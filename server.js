import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory active game rooms
const rooms = new Map();

// Helper to broadcast message to all clients in a room
function broadcastToRoom(code, payload) {
  const room = rooms.get(code);
  if (!room || !room.clients) return;
  const msg = JSON.stringify(payload);
  room.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// REST Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Big Business Game Server',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// REST Create Room
app.post('/api/rooms/create', (req, res) => {
  const { name, seats = 4, minutes = 45, missLimit = 3 } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const token = Math.random().toString(36).substring(2, 12);

  const room = {
    code,
    seats,
    minutes,
    missLimit,
    host: name || 'Host',
    started: false,
    over: false,
    clients: new Set(),
    players: [
      {
        seat: 0,
        token,
        name: name || 'Host',
        color: '#FFC83D',
        tokenPiece: 'pawn',
        cash: 2000,
        position: 0,
        lap: 0,
        jail: 0,
        jailCards: 0,
        bankrupt: false
      }
    ],
    properties: {},
    logs: [],
    messages: []
  };

  rooms.set(code, room);
  res.json({ code, token, seat: 0 });
});

// REST Peek Room info
app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    code: room.code,
    host: room.host,
    seats: room.seats,
    minutes: room.minutes,
    started: room.started,
    playerCount: room.players.filter(Boolean).length
  });
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(distIndex);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let userRoomCode = null;
  let userSeat = null;

  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());

      // 1. PEEK ROOM
      if (data.t === 'peek') {
        const room = rooms.get(data.code?.toUpperCase());
        ws.send(JSON.stringify({ t: 'peek', room: room || null }));
        return;
      }

      // 2. CREATE ROOM
      if (data.t === 'create') {
        const code = data.code || Math.random().toString(36).substring(2, 8).toUpperCase();
        const token = Math.random().toString(36).substring(2, 12);

        const newRoom = {
          code,
          seats: data.seats || 4,
          minutes: data.minutes || 45,
          missLimit: data.missLimit || 3,
          host: data.name || 'Host',
          started: false,
          over: false,
          clients: new Set([ws]),
          players: [
            {
              seat: 0,
              token,
              name: data.name || 'Host',
              color: '#FFC83D',
              tokenPiece: data.tokenPiece || 'pawn',
              cash: 2000,
              position: 0,
              lap: 0,
              jail: 0,
              jailCards: 0,
              bankrupt: false
            }
          ],
          properties: {},
          logs: [],
          messages: []
        };

        rooms.set(code, newRoom);
        userRoomCode = code;
        userSeat = 0;
        ws.send(JSON.stringify({ t: 'joined', code, token, seat: 0, room: newRoom }));
        return;
      }

      // 3. JOIN ROOM
      if (data.t === 'join') {
        const code = data.code?.toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ t: 'error', message: 'Room not found. Check the code.' }));
          return;
        }

        if (room.started) {
          ws.send(JSON.stringify({ t: 'error', message: 'That match has already started.' }));
          return;
        }

        const seat = room.players.length;
        if (seat >= room.seats) {
          ws.send(JSON.stringify({ t: 'error', message: 'That room is full.' }));
          return;
        }

        const token = Math.random().toString(36).substring(2, 12);
        const newPlayer = {
          seat,
          token,
          name: data.name || `Player ${seat + 1}`,
          color: ['#FFC83D', '#34D27B', '#49A6FF', '#FF5568', '#B55FE6', '#FF8A1F'][seat % 6],
          tokenPiece: data.tokenPiece || 'crown',
          cash: 2000,
          position: 0,
          lap: 0,
          jail: 0,
          jailCards: 0,
          bankrupt: false
        };

        room.players.push(newPlayer);
        room.clients.add(ws);
        userRoomCode = code;
        userSeat = seat;

        ws.send(JSON.stringify({ t: 'joined', code, token, seat, room }));
        broadcastToRoom(code, { t: 'playerJoined', player: newPlayer, room });
        return;
      }

      // 4. GAMEPLAY ACTIONS (START, ROLL, BUY, CHAT, TRADE, ETC.)
      if (data.code) {
        const room = rooms.get(data.code.toUpperCase());
        if (room) {
          if (data.t === 'start') {
            room.started = true;
          } else if (data.t === 'chat') {
            room.messages.push(data.message);
          }
          // Broadcast action to all players in the room
          broadcastToRoom(data.code.toUpperCase(), data);
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ t: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    if (userRoomCode && rooms.has(userRoomCode)) {
      const room = rooms.get(userRoomCode);
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        // Keep room alive for 10 minutes for reconnects
        setTimeout(() => {
          if (room.clients.size === 0) {
            rooms.delete(userRoomCode);
          }
        }, 10 * 60 * 1000);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Big Business Game Server running on port ${PORT}`);
  console.log(`WebSocket service listening on ws://localhost:${PORT}`);
});
