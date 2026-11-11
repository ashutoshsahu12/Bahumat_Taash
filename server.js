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

const normalizeRoomCode = (value) => String(value || '').trim().toUpperCase();
const isValidRoomCode = (code) => /^[A-Z0-9]{6}$/.test(code);
const makeRoomCode = () => {
  let code;
  do {
    code = Math.random().toString(36).slice(2, 8).padEnd(6, '0').toUpperCase();
  } while (rooms.has(code));
  return code;
};
const publicRoom = (room) => {
  const { clients, tokens, snapshot, ...details } = room;
  return details;
};

// Helper to broadcast message to all clients in a room
function broadcastToRoom(code, payload, excludedClient = null) {
  const room = rooms.get(code);
  if (!room || !room.clients) return;
  const msg = JSON.stringify(payload);
  room.clients.forEach((client) => {
    if (client !== excludedClient && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function createRoomRecord({ code, seats, minutes, missLimit, state, name, token, playerToken, photo }) {
  const roomCode = normalizeRoomCode(code || makeRoomCode());
  if (!isValidRoomCode(roomCode)) throw new Error('Room codes must be 6 letters or numbers.');
  if (rooms.has(roomCode)) throw new Error('That room code is already in use. Try again.');

  const hostName = String(name || 'Host').trim() || 'Host';
  const hostAuthToken = token || Math.random().toString(36).slice(2, 12);
  return {
    code: roomCode,
    seats: Math.max(2, Math.min(6, Number(seats) || 4)),
    minutes: Number(minutes) || 45,
    missLimit: Number(missLimit) || 3,
    state: state || 'maharashtra',
    host: hostName,
    started: false,
    over: false,
    clients: new Set(),
    tokens: new Map([[0, hostAuthToken]]),
    players: Array.from({ length: Math.max(2, Math.min(6, Number(seats) || 4)) }, (_, seat) => (
      seat === 0
        ? {
            id: 'p-0',
            seat: 0,
            token: playerToken || 'pawn',
            name: hostName,
            color: '#FFC83D',
            tokenPiece: playerToken || 'pawn',
            photo: photo || null,
            isHost: true,
            isBot: false,
            cash: 2000,
            position: 0,
            lap: 0,
            jail: 0,
            jailCards: 0,
            bankrupt: false
          }
        : null
    )),
    properties: {},
    logs: [],
    messages: [],
    snapshot: null
  };
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
  try {
    const code = makeRoomCode();
    const token = Math.random().toString(36).slice(2, 12);
    const room = createRoomRecord({ ...req.body, code, token });
    rooms.set(room.code, room);
    res.json({ code: room.code, token, seat: 0 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// REST Peek Room info
app.get('/api/rooms/:code', (req, res) => {
  const code = normalizeRoomCode(req.params.code);
  if (!isValidRoomCode(code)) {
    return res.status(400).json({ error: 'Enter a valid 6-character room code.' });
  }
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

  const send = (payload) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  };
  const detachFromRoom = () => {
    const previousRoom = userRoomCode && rooms.get(userRoomCode);
    if (previousRoom) previousRoom.clients.delete(ws);
    userRoomCode = null;
    userSeat = null;
  };
  const sendError = (requestId, message) => send({ t: 'error', requestId, message });

  ws.on('message', (rawData) => {
    let data;
    try {
      data = JSON.parse(rawData.toString());
    } catch {
      sendError(null, 'Invalid room request.');
      return;
    }

    try {
      if (data.t === 'peek') {
        const code = normalizeRoomCode(data.code);
        const room = isValidRoomCode(code) ? rooms.get(code) : null;
        send({ t: 'peek', requestId: data.requestId, room: room ? publicRoom(room) : null });
        return;
      }

      if (data.t === 'create') {
        const newRoom = createRoomRecord(data);
        detachFromRoom();
        newRoom.clients.add(ws);
        rooms.set(newRoom.code, newRoom);
        userRoomCode = newRoom.code;
        userSeat = 0;
        send({
          t: 'joined',
          requestId: data.requestId,
          code: newRoom.code,
          token: newRoom.tokens.get(0),
          seat: 0,
          room: publicRoom(newRoom),
          state: null
        });
        return;
      }

      if (data.t === 'join') {
        const code = normalizeRoomCode(data.code);
        if (!isValidRoomCode(code)) {
          sendError(data.requestId, 'Enter a valid 6-character room code.');
          return;
        }
        const room = rooms.get(code);
        if (!room) {
          sendError(data.requestId, 'Room not found. Check the code.');
          return;
        }
        if (room.started) {
          sendError(data.requestId, 'That match has already started.');
          return;
        }
        const seat = room.players.findIndex((player) => player === null);
        if (seat === -1) {
          sendError(data.requestId, 'That room is full.');
          return;
        }

        const token = Math.random().toString(36).substring(2, 12);
        const newPlayer = {
          id: `p-${seat}`,
          seat,
          token: data.token || 'crown',
          name: String(data.name || `Player ${seat + 1}`).trim() || `Player ${seat + 1}`,
          color: ['#FFC83D', '#34D27B', '#49A6FF', '#FF5568', '#B55FE6', '#FF8A1F'][seat % 6],
          photo: data.photo || null,
          isHost: false,
          isBot: false,
          cash: 2000,
          position: 0,
          lap: 0,
          jail: 0,
          jailCards: 0,
          bankrupt: false
        };

        detachFromRoom();
        room.players[seat] = newPlayer;
        room.tokens.set(seat, token);
        room.clients.add(ws);
        userRoomCode = code;
        userSeat = seat;

        send({
          t: 'joined',
          requestId: data.requestId,
          code,
          token,
          seat,
          room: publicRoom(room),
          state: room.snapshot
        });
        broadcastToRoom(code, { t: 'playerJoined', player: newPlayer, room: publicRoom(room) }, ws);
        if (room.snapshot) {
          room.snapshot = { ...room.snapshot, room: publicRoom(room) };
          broadcastToRoom(code, { t: 'snapshot', state: room.snapshot }, ws);
        }
        return;
      }

      if (data.t === 'resume') {
        const code = normalizeRoomCode(data.code);
        const room = rooms.get(code);
        const seat = room ? room.players.findIndex((player, index) => player && room.tokens.get(index) === data.token) : -1;
        if (!room || seat < 0) {
          sendError(data.requestId, 'Your room seat could not be restored. Rejoin using the room code.');
          return;
        }
        detachFromRoom();
        room.clients.add(ws);
        userRoomCode = code;
        userSeat = seat;
        send({
          t: 'joined',
          requestId: data.requestId,
          code,
          token: data.token,
          seat,
          room: publicRoom(room),
          state: room.snapshot
        });
        return;
      }

      if (data.t === 'leave') {
        if (normalizeRoomCode(data.code) === userRoomCode) detachFromRoom();
        return;
      }

      const code = normalizeRoomCode(data.code);
      const room = rooms.get(code);
      if (!room || userRoomCode !== code) return;

      if (data.t === 'sync') {
        if (!data.state || typeof data.state !== 'object') {
          sendError(data.requestId, 'Invalid room state update.');
          return;
        }
        if (data.state.room?.started && !room.started && userSeat !== 0) {
          sendError(data.requestId, 'Only the host can start the match.');
          return;
        }
        if (data.state.room?.started && !room.started && data.state.room.players?.filter(Boolean).length < 2) {
          sendError(data.requestId, 'Need at least 2 players to start.');
          return;
        }
        room.started = room.started || Boolean(data.state.room?.started);
        room.over = room.over || Boolean(data.state.room?.over);
        room.snapshot = {
          ...data.state,
          room: { ...data.state.room, code, started: room.started, over: room.over }
        };
        if (Array.isArray(room.snapshot.room.players)) {
          room.players = room.snapshot.room.players;
          room.players.forEach((player, seat) => {
            if (!player) room.tokens.delete(seat);
          });
        }
        broadcastToRoom(code, { t: 'snapshot', state: room.snapshot }, ws);
        return;
      }

      if (data.t === 'start') {
        if (userSeat !== 0) {
          sendError(data.requestId, 'Only the host can start the match.');
          return;
        }
        room.started = true;
        if (room.snapshot) room.snapshot.room.started = true;
        broadcastToRoom(code, { t: 'snapshot', state: room.snapshot }, ws);
      }
    } catch (err) {
      sendError(data?.requestId, err.message || 'Room request failed.');
    }
  });

  ws.on('close', () => {
    if (userRoomCode && rooms.has(userRoomCode)) {
      const room = rooms.get(userRoomCode);
      room.clients.delete(ws);
      const roomCode = userRoomCode;
      userRoomCode = null;
      if (room.clients.size === 0) {
        // Keep room alive for 10 minutes for reconnects
        setTimeout(() => {
          if (room.clients.size === 0) {
            rooms.delete(roomCode);
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
