import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { generateBoardForState } from "../data/stateBoardData";
import { CHANCE_CARDS } from "../data/chanceDeck";
import { 
  GAME_CONSTANTS, 
  PLAYER_COLORS, 
  TOKEN_KINDS, 
  formatRupee 
} from "../data/constants";
import { playSound } from "../audio/soundEngine";
import { showToast } from "../components/Toaster";
import { usePieceAnimation } from "./usePieceAnimation";
import { hasFullColorSet } from "../data/checkColorSetOwnership";
import { RoomConnection } from "../network/RoomConnection";

const BOT_NAMES = ["Maya", "Rohan", "Aisha", "Vikram", "Tara", "Kabir"];
const DICE_ROLL_DURATION_MS = 700;
const DICE_LAND_TRANSITION_MS = 600;
const POST_ROLL_PAUSE_MS = 800;

export function useGameState(initialProfile) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("bb:profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { name: "", token: "pawn", photo: null };
  });

  const [screen, setScreen] = useState("setup"); // 'setup' | 'lobby' | 'game'
  const [selectedState, setSelectedState] = useState("maharashtra");
  const [room, setRoom] = useState(null);
  const [mySeat, setMySeat] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [connectionError, setConnectionError] = useState("");
  const [roomError, setRoomError] = useState("");
  const roomConnectionRef = useRef(null);
  const roomSyncEnabledRef = useRef(false);
  const lastAppliedSnapshotRef = useRef("");
  const networkMessageHandlerRef = useRef(null);

  // Dynamically generated board spaces based on chosen region/state
  const boardSpaces = useMemo(() => {
    return generateBoardForState(selectedState);
  }, [selectedState]);

  // Gameplay state
  const [turnSeat, setTurnSeat] = useState(0);
  const [turnPhase, setTurnPhase] = useState("roll"); // 'roll' | 'action'
  const [dice, setDice] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [isTurnResolving, setIsTurnResolving] = useState(false);
  const [botStatus, setBotStatus] = useState("");
  const [properties, setProperties] = useState({});
  const [round, setRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [festivals, setFestivals] = useState([]); // active village sets
  const [actionNotices, setActionNotices] = useState([]);
  const activeActionNotice = actionNotices[0] || null;
  const isActionModalActive = Boolean(activeActionNotice);
  const activeActionNoticeRef = useRef(activeActionNotice);
  const actionNoticeIdRef = useRef(0);
  activeActionNoticeRef.current = activeActionNotice;

  // Modals & UI overlays
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // ─── Stable refs so animation callbacks always see the latest state ────────
  const roomRef = useRef(null);
  const propertiesRef = useRef({});
  const festivalsRef = useRef([]);
  const boardSpacesRef = useRef([]);
  const mySeatRef = useRef(0);
  roomRef.current = room;
  propertiesRef.current = properties;
  festivalsRef.current = festivals;
  boardSpacesRef.current = boardSpaces;
  mySeatRef.current = mySeat;

  // handleTileAction is defined later but called from onMoveDone — bridge via ref
  const handleTileActionRef = useRef(null);
  const applyChanceCardRef = useRef(null);
  const sequenceTimersRef = useRef(new Set());
  const botTurnTimersRef = useRef(new Set());
  const botStepInProgressRef = useRef(false);
  const rollDiceRef = useRef(null);
  const endTurnRef = useRef(null);
  const tileCenterGetterRef = useRef(null);
  const pendingSalaryNoticesRef = useRef(new Map());
  const getTileCenterCoordinates = useCallback(
    (tileIndex) => tileCenterGetterRef.current?.(tileIndex) ?? null,
    []
  );
  const registerTileCenterGetter = useCallback((getter) => {
    tileCenterGetterRef.current = getter;
  }, []);

  useEffect(() => {
    if (screen === "game" && !isGameOver) return;
    botTurnTimersRef.current.forEach(clearTimeout);
    botTurnTimersRef.current.clear();
    sequenceTimersRef.current.forEach(clearTimeout);
    sequenceTimersRef.current.clear();
    botStepInProgressRef.current = false;
    setBotStatus("");
    setActionNotices([]);
  }, [screen, isGameOver]);

  const scheduleSequenceTimeout = useCallback((callback, delay) => {
    const timer = setTimeout(() => {
      sequenceTimersRef.current.delete(timer);
      callback();
    }, delay);
    sequenceTimersRef.current.add(timer);
    return timer;
  }, []);

  useEffect(() => () => {
    sequenceTimersRef.current.forEach(clearTimeout);
    sequenceTimersRef.current.clear();
    botTurnTimersRef.current.forEach(clearTimeout);
    botTurnTimersRef.current.clear();
  }, []);

  // ─── Piece Animation Hook ─────────────────────────────────────────────────
  const { displayPositions, activeHopState, isMoving, animateMove, teleport, initPositions } =
    usePieceAnimation({
      boardSize: 48,
      onStepSound: () => playSound("step"),
      getTileCenterCoordinates,
      onMoveDone: (seat, finalPos) => {
        // The animation hook waits 650ms after landing before this callback.
        const salaryNotice = pendingSalaryNoticesRef.current.get(seat);
        if (salaryNotice) {
          pendingSalaryNoticesRef.current.delete(seat);
          queueActionNotice(salaryNotice);
        }
        setIsTurnResolving(false);
        if (handleTileActionRef.current) {
          handleTileActionRef.current(seat, finalPos);
        }
      }
    });

  networkMessageHandlerRef.current = (message) => {
    if (message.t === "error") {
      setRoomError(message.message || "Room request failed.");
      if (roomSyncEnabledRef.current) {
        setConnectionError(message.message || "The room connection could not be restored.");
      }
      return;
    }

    if (!roomSyncEnabledRef.current && message.t !== "joined") return;

    if (message.t === "joined") {
      const joinedRoom = message.room;
      if (!joinedRoom) return;
      roomSyncEnabledRef.current = true;
      roomConnectionRef.current?.setCredentials({ code: message.code, token: message.token });
      setRoomError("");
      setMySeat(message.seat);
      setRoom({ ...joinedRoom, online: true });
      const state = message.state;
      if (state) applyRemoteSnapshot({ ...state, room: joinedRoom });
      else if (joinedRoom.state) setSelectedState(joinedRoom.state);
      setScreen(joinedRoom.started ? "game" : "lobby");
      return;
    }

    if (message.t === "playerJoined" && message.room) {
      setRoom({ ...message.room, online: true });
      return;
    }

    if (message.t === "snapshot" && message.state) {
      applyRemoteSnapshot(message.state);
    }
  };

  const applyRemoteSnapshot = (snapshot) => {
    const normalized = {
      ...snapshot,
      room: snapshot.room ? { ...snapshot.room, online: true } : snapshot.room
    };
    const serialized = JSON.stringify(normalized);
    lastAppliedSnapshotRef.current = serialized;
    roomSyncEnabledRef.current = true;
    if (normalized.room) setRoom(normalized.room);
    if (normalized.selectedState) setSelectedState(normalized.selectedState);
    if (normalized.properties) setProperties(normalized.properties);
    if (Number.isInteger(normalized.turnSeat)) setTurnSeat(normalized.turnSeat);
    if (normalized.turnPhase) setTurnPhase(normalized.turnPhase);
    if (normalized.dice) setDice(normalized.dice);
    if (Number.isInteger(normalized.round)) setRound(normalized.round);
    if (normalized.timeRemaining !== undefined) setTimeRemaining(normalized.timeRemaining);
    if (normalized.logs) setLogs(normalized.logs);
    if (normalized.messages) setMessages(normalized.messages);
    if (normalized.festivals) setFestivals(normalized.festivals);
    if (normalized.room?.started) setScreen("game");
    else if (normalized.room) setScreen("lobby");
  };

  useEffect(() => {
    const connection = new RoomConnection({
      onStatusChange: (status) => {
        setConnectionStatus(status);
        if (status === "connected") setConnectionError("");
        if (status === "disconnected" && roomSyncEnabledRef.current) {
          setConnectionError("Connection lost. Reconnecting to the room…");
        }
      },
      onMessage: (message) => networkMessageHandlerRef.current?.(message)
    });
    roomConnectionRef.current = connection;
    return () => {
      roomSyncEnabledRef.current = false;
      connection.close();
      roomConnectionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!roomSyncEnabledRef.current || !room || !roomConnectionRef.current) return;
    const snapshot = {
      room,
      selectedState,
      properties,
      turnSeat,
      turnPhase,
      dice,
      round,
      timeRemaining,
      logs,
      messages,
      festivals
    };
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastAppliedSnapshotRef.current) {
      return;
    }
    roomConnectionRef.current.send({ t: "sync", code: room.code, state: snapshot });
  }, [room, selectedState, properties, turnSeat, turnPhase, dice, round, timeRemaining, logs, messages, festivals]);

  useEffect(() => {
    if (!room?.started || screen === "game") return;
    initPositions(room.players.filter(Boolean).map((player) => ({ ...player, position: player.position || 0 })));
    setScreen("game");
  }, [room?.started, screen, initPositions]);

  // Sync profile to localStorage
  const updateProfile = (updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("bb:profile", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const addLog = useCallback((text, options = {}) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      ...prev.slice(-GAME_CONSTANTS.LOG_LIMIT),
      { text, time: timeStr, ...options }
    ]);
  }, []);

  const queueActionNotice = useCallback((notice) => {
    const seat = notice.seat;
    const isBot = seat !== undefined && Boolean(roomRef.current?.players[seat]?.isBot);
    setActionNotices((previous) => [
      ...previous,
      { ...notice, id: ++actionNoticeIdRef.current, isBot, autoDismissMs: isBot ? 1350 : null }
    ]);
  }, []);

  const dismissActionNotice = useCallback(() => {
    activeActionNoticeRef.current?.onDismiss?.();
    setActionNotices((previous) => previous.slice(1));
  }, []);

  // Create room
  const createRoom = async ({ seats, matchLength, missLimit, selectedState: chosenState }) => {
    const code = Math.random().toString(36).slice(2, 8).padEnd(6, "0").toUpperCase();
    const stateToUse = chosenState || selectedState;
    const humanPlayer = {
      id: "p-0",
      seat: 0,
      name: profile.name.trim() || "Player 1",
      color: PLAYER_COLORS[0],
      token: profile.token || "pawn",
      photo: profile.photo || null,
      isHost: true,
      isBot: false,
      cash: GAME_CONSTANTS.START_CASH,
      position: 0,
      lap: 0,
      jail: 0,
      jailCards: 0,
      bankrupt: false
    };

    setRoomError("");
    setConnectionError("");
    roomSyncEnabledRef.current = false;
    roomConnectionRef.current?.setCredentials(null);
    try {
      const response = await roomConnectionRef.current.request({
        t: "create",
        seats,
        minutes: matchLength,
        missLimit,
        state: stateToUse,
        name: humanPlayer.name,
        playerToken: humanPlayer.token,
        photo: humanPlayer.photo
      });
      roomSyncEnabledRef.current = true;
      roomConnectionRef.current.setCredentials({ code: response.code, token: response.token });
      setSelectedState(stateToUse);
      setRoom({ ...response.room, online: true });
      setMySeat(response.seat);
      setScreen("lobby");
      showToast(`Room ${response.code} created!`, "good");
    } catch (error) {
      roomSyncEnabledRef.current = false;
      setConnectionError(`${error.message} A local game is available instead.`);
      const offlineRoom = {
        code,
        seats,
        minutes: matchLength,
        missLimit,
        state: stateToUse,
        host: humanPlayer.name,
        started: false,
        over: false,
        offline: true,
        players: Array.from({ length: seats }, (_, index) => index === 0 ? humanPlayer : null)
      };
      setSelectedState(stateToUse);
      setRoom(offlineRoom);
      setMySeat(0);
      setScreen("lobby");
      showToast("Room server unavailable. You can play locally with an AI.", "info");
    }
  };

  // Join room
  const joinRoom = async (rawCode) => {
    const code = String(rawCode || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setRoomError("Enter a valid 6-character room code.");
      return;
    }

    setRoomError("");
    setConnectionError("");
    roomSyncEnabledRef.current = false;
    roomConnectionRef.current?.setCredentials(null);
    try {
      const response = await roomConnectionRef.current.request({
        t: "join",
        code,
        name: profile.name.trim() || "Guest",
        token: profile.token || "crown",
        photo: profile.photo || null
      });
      roomSyncEnabledRef.current = true;
      roomConnectionRef.current.setCredentials({ code: response.code, token: response.token });
      setRoom({ ...response.room, online: true });
      setMySeat(response.seat);
      if (response.state?.selectedState) setSelectedState(response.state.selectedState);
      else if (response.room.state) setSelectedState(response.room.state);
      setScreen(response.room.started ? "game" : "lobby");
      setRoomError("");
      showToast(`Joined room ${response.code}!`, "good");
    } catch (error) {
      setRoomError(error.message);
      setScreen("setup");
    }
  };

  const startOfflineGame = ({
    selectedState: chosenState,
    matchLength = 45,
    missLimit = GAME_CONSTANTS.DEFAULT_MISS_LIMIT
  } = {}) => {
    const stateToUse = chosenState || selectedState || "maharashtra";
    const host = {
      id: "p-0",
      seat: 0,
      name: profile.name.trim() || "Player 1",
      color: PLAYER_COLORS[0],
      token: profile.token || "pawn",
      photo: profile.photo || null,
      isHost: true,
      isBot: false,
      cash: GAME_CONSTANTS.START_CASH,
      position: 0,
      lap: 0,
      jail: 0,
      jailCards: 0,
      bankrupt: false
    };
    const bot = {
      id: "bot-1",
      seat: 1,
      name: BOT_NAMES[0],
      color: PLAYER_COLORS[1],
      token: TOKEN_KINDS[1],
      photo: null,
      isHost: false,
      isBot: true,
      cash: GAME_CONSTANTS.START_CASH,
      position: 0,
      lap: 0,
      jail: 0,
      jailCards: 0,
      bankrupt: false
    };

    roomSyncEnabledRef.current = false;
    roomConnectionRef.current?.setCredentials(null);
    setConnectionError("");
    setRoomError("");
    setRoom({
      code: "LOCAL1",
      seats: 2,
      minutes: matchLength,
      missLimit,
      state: stateToUse,
      host: host.name,
      started: true,
      over: false,
      offline: true,
      players: [host, bot]
    });
    setSelectedState(stateToUse);
    setMySeat(0);
    setTurnSeat(0);
    setTurnPhase("roll");
    setRound(1);
    setProperties({});
    setLogs([]);
    setMessages([]);
    setFestivals([]);
    setTimeRemaining(matchLength * 60);
    setIsGameOver(false);
    setScreen("game");
    initPositions([host, bot]);
    addLog(`Offline match started in ${stateToUse.toUpperCase()}! Roll the dice to begin.`, { isHighlight: true });
  };

  const leaveRoom = () => {
    roomSyncEnabledRef.current = false;
    roomConnectionRef.current?.setCredentials(null);
    setRoom(null);
    setRoomError("");
    setConnectionError("");
    setScreen("setup");
  };

  // Add AI bot to lobby
  const addBot = () => {
    if (!room || mySeat !== 0) return;
    const emptyIndex = room.players.findIndex((p) => p === null);
    if (emptyIndex === -1) return;

    const botName = BOT_NAMES[emptyIndex % BOT_NAMES.length];
    const botToken = TOKEN_KINDS[emptyIndex % TOKEN_KINDS.length];
    const botPlayer = {
      id: `bot-${emptyIndex}`,
      seat: emptyIndex,
      name: botName,
      color: PLAYER_COLORS[emptyIndex % PLAYER_COLORS.length],
      token: botToken,
      photo: null,
      isBot: true,
      isHost: false,
      cash: GAME_CONSTANTS.START_CASH,
      position: 0,
      lap: 0,
      jail: 0,
      jailCards: 0,
      bankrupt: false
    };

    setRoom((prev) => {
      const nextPlayers = [...prev.players];
      nextPlayers[emptyIndex] = botPlayer;
      return { ...prev, players: nextPlayers };
    });
    showToast(`${botName} joined the room`, "info");
  };

  // Kick player
  const kickPlayer = (seatIndex) => {
    if (!room || mySeat !== 0 || seatIndex === 0) return;
    setRoom((prev) => {
      const nextPlayers = [...prev.players];
      nextPlayers[seatIndex] = null;
      return { ...prev, players: nextPlayers };
    });
  };

  // Start match
  const startMatch = () => {
    if (!room || mySeat !== 0) {
      showToast("Only the host can start the match.", "error");
      return;
    }
    const activePlayers = room.players.filter(Boolean);
    if (activePlayers.length < 2) {
      showToast("Need at least 2 players to start.", "error");
      return;
    }

    setRoom((prev) => ({ ...prev, started: true }));
    setTurnSeat(0);
    setTurnPhase("roll");
    setRound(1);
    setProperties({});
    setActionNotices([]);
    setBotStatus("");
    botStepInProgressRef.current = false;
    botTurnTimersRef.current.forEach(clearTimeout);
    botTurnTimersRef.current.clear();
    sequenceTimersRef.current.forEach(clearTimeout);
    sequenceTimersRef.current.clear();
    setIsGameOver(false);
    setScreen("game");
    playSound("start");
    addLog(`Match started in ${selectedState.toUpperCase()}! Roll the dice to begin.`, { isHighlight: true });

    // Snap all tokens to position 0 (no animation on match start)
    initPositions(activePlayers.map((p) => ({ ...p, position: 0 })));

    if (room.minutes > 0) {
      setTimeRemaining(room.minutes * 60);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (screen !== "game" || timeRemaining === null || isGameOver || isActionModalActive) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, timeRemaining, isGameOver, isActionModalActive]);

  // End match and calculate net worth
  const endGame = () => {
    setIsGameOver(true);
    playSound("win");
    setRoom((prev) => {
      const updated = prev.players.filter(Boolean).map((p) => {
        const ownedProps = Object.entries(properties).filter(
          ([_, prop]) => prop.owner === p.seat && !prop.mortgaged
        );
        let propValue = 0;
        ownedProps.forEach(([id, prop]) => {
          const space = boardSpaces[Number(id)];
          if (space) {
            propValue += space.price || 0;
            propValue += (prop.houses || 0) * 100;
          }
        });
        return { ...p, netWorth: p.cash + propValue };
      });
      return { ...prev, over: true, players: updated };
    });
    addLog("Match concluded! Leaderboard available.", { isHighlight: true });
  };

  // Turn management: Roll Dice
  const rollDice = () => {
    // Block rolling immediately if already rolling, animating, or wrong phase
    if (isRolling || isMoving || isTurnResolving || isActionModalActive || turnPhase !== "roll") return;
    setIsTurnResolving(true);
    setIsRolling(true);
    playSound("dice");

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    const isDoubles = d1 === d2;

    // Let the dice tumble, then hold the landed result on screen before moving.
    scheduleSequenceTimeout(() => {
      setDice([d1, d2]);
      setIsRolling(false);

      scheduleSequenceTimeout(() => {
        const currentPlayer = roomRef.current?.players[turnSeat];
        if (!currentPlayer || currentPlayer.bankrupt) {
          setIsTurnResolving(false);
          return;
        }

        addLog(`${currentPlayer.name}${currentPlayer.isBot ? " (Bot)" : ""} rolled a ${sum} (${d1} + ${d2})${isDoubles ? " — DOUBLES!" : ""}`, {
          playerColor: currentPlayer.color,
          seat: turnSeat,
          isHighlight: isDoubles
        });

        // Handle Jail Release on Doubles
        if (currentPlayer.jail > 0) {
          if (isDoubles) {
            playSound("income");
            addLog(`${currentPlayer.name}${currentPlayer.isBot ? " (Bot)" : ""} rolled doubles (${d1}+${d2}) and walked out of Jail free!`, { isGood: true });
            queueActionNotice({
              type: "jail",
              title: "Released from Jail",
              message: `${currentPlayer.name}${currentPlayer.isBot ? " (Bot)" : ""} rolled doubles and is free to move.`,
              seat: turnSeat
            });
            setRoom((prev) => {
              const next = [...prev.players];
              next[turnSeat] = { ...currentPlayer, jail: 0 };
              return { ...prev, players: next };
            });
            movePlayer(turnSeat, sum, { ...currentPlayer, jail: 0 });
          } else {
            playSound("lose");
            addLog(`${currentPlayer.name}${currentPlayer.isBot ? " (Bot)" : ""} rolled ${d1}+${d2}. Still in Jail (${currentPlayer.jail - 1} tries left).`, { isBad: true });
            queueActionNotice({
              type: "jail",
              title: "Still in Jail",
              message: `${currentPlayer.name}${currentPlayer.isBot ? " (Bot)" : ""} did not roll doubles and remains in Jail (${currentPlayer.jail - 1} tries left).`,
              seat: turnSeat
            });
            setRoom((prev) => {
              const next = [...prev.players];
              const remaining = currentPlayer.jail - 1;
              next[turnSeat] = { ...currentPlayer, jail: remaining };
              return { ...prev, players: next };
            });
            setTurnPhase("action");
            setIsTurnResolving(false);
          }
          return;
        }

        // Lucky Doubles cash bonus & visual highlight
        if (isDoubles) {
          const bonus = Math.max(50, Math.round(currentPlayer.cash * (GAME_CONSTANTS.DOUBLES_BONUS_PCT / 100)));
          playSound("income");
          showToast(`Doubles ${d1}+${d2}! +${formatRupee(bonus)} cash bonus!`, "gold");
          addLog(`${currentPlayer.name}${currentPlayer.isBot ? " (Bot)" : ""} rolled doubles (${d1}+${d2})! Earned ${formatRupee(bonus)} bonus.`, { isGood: true });
          setRoom((prev) => {
            const next = [...prev.players];
            next[turnSeat] = { ...currentPlayer, cash: currentPlayer.cash + bonus };
            return { ...prev, players: next };
          });
        }

        movePlayer(turnSeat, sum);
      }, DICE_LAND_TRANSITION_MS + POST_ROLL_PAUSE_MS);
    }, DICE_ROLL_DURATION_MS);
  };

  // ─── Move player: update logical state immediately, kick off visual animation
  const movePlayer = (seat, steps, playerOverride = null) => {
    const player = playerOverride || roomRef.current?.players[seat];
    if (!player) return;

    const bSpaces = boardSpacesRef.current;
    const oldPos = player.position;
    const newPos = (oldPos + steps) % bSpaces.length;
    const passedLaunch = oldPos + steps >= bSpaces.length;
    let lap = player.lap;

    // Salary / lap bonus resolved immediately (before animation)
    let salaryCash = 0;
    if (passedLaunch) {
      lap += 1;
      salaryCash = 200 + (lap - 1) * GAME_CONSTANTS.SALARY_STEP;
      playSound("salary");
      showToast(`Completed lap! Salary: +${formatRupee(salaryCash)}`, "good");
      addLog(`${player.name}${player.isBot ? " (Bot)" : ""} passed Launch (Lap ${lap}) and collected ${formatRupee(salaryCash)}!`, { isGood: true });
      pendingSalaryNoticesRef.current.set(seat, {
        type: "salary",
        title: "Launch salary",
        message: `${player.name}${player.isBot ? " (Bot)" : ""} completed a lap and collected ${formatRupee(salaryCash)}.`,
        amount: salaryCash,
        seat
      });
    }

    // Update logical position in room state now
    setRoom((prev) => {
      if (!prev) return prev;
      const next = [...prev.players];
      next[seat] = { ...player, position: newPos, lap, cash: player.cash + salaryCash };
      return { ...prev, players: next };
    });

    // Kick off step-by-step visual animation; tile action fires in onMoveDone
    animateMove(seat, oldPos, steps);
    // turnPhase stays "roll" during motion — set to "action" inside handleTileAction
  };

  // ─── Tile action — fires AFTER animation completes (via handleTileActionRef) ──
  // Reads from refs so stale closure values are never used.
  const handleTileAction = useCallback((seat, spaceId) => {
    const bSpaces = boardSpacesRef.current;
    const currentRoom = roomRef.current;
    const currentProperties = propertiesRef.current;
    const currentFestivals = festivalsRef.current;
    const currentMySeat = mySeatRef.current;

    const space = bSpaces[spaceId];
    const player = currentRoom?.players[seat];
    if (!space || !player) return;

    setTurnPhase("action");

    // 1. Go to Jail tile
    if (space.kind === "gojail") {
      playSound("siren");
      addLog(`${player.name} landed on Go to Jail! Sent directly to lockup.`, { isBad: true });
      showToast(`${player.name} sent to Jail!`, "error");
      queueActionNotice({
        type: "jail",
        title: "Sent to Jail",
        message: `${player.name}${player.isBot ? " (Bot)" : ""} landed on Go to Jail and was sent to lockup.`,
        seat,
        space
      });
      setRoom((prev) => {
        if (!prev) return prev;
        const next = [...prev.players];
        next[seat] = { ...player, position: 12, jail: GAME_CONSTANTS.JAIL_TRIES };
        return { ...prev, players: next };
      });
      // Teleport the token visually to Jail (index 12)
      teleport(seat, 12);
      return;
    }

    if (space.kind === "jail") {
      queueActionNotice({
        type: "jail",
        title: "Jail visit",
        message: player.jail > 0
          ? `${player.name}${player.isBot ? " (Bot)" : ""} is in Jail. They can roll doubles, pay bail, or use a jail card.`
          : `${player.name}${player.isBot ? " (Bot)" : ""} is just visiting Jail.`,
        seat,
        space
      });
      return;
    }

    if (space.kind === "break") {
      addLog(`${player.name}${player.isBot ? " (Bot)" : ""} landed on ${space.name} and gets a free rest.`, {
        playerColor: player.color
      });
      queueActionNotice({
        type: "default",
        title: space.name,
        message: `${player.name}${player.isBot ? " (Bot)" : ""} gets a free rest. No payment is due.`,
        space,
        seat
      });
      return;
    }

    // 2. Chance Tile
    if (space.kind === "chance") {
      const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      playSound("card");
      addLog(`${player.name}${player.isBot ? " (Bot)" : ""} drew a Chance card: ${card.title}.`, { isHighlight: true });
      queueActionNotice({
        type: "chance",
        title: card.title,
        message: `${player.name}${player.isBot ? " (Bot)" : ""} drew a Chance card.`,
        card,
        seat,
        onDismiss: seat === currentMySeat
          ? () => applyChanceCardRef.current?.(seat, card, { logEvent: false })
          : undefined
      });
      if (seat !== currentMySeat) applyChanceCardRef.current?.(seat, card, { logEvent: false });
      return;
    }

    // 3. Market Tile
    if (space.kind === "market") {
      playSound("income");
      if (seat === currentMySeat) {
        setIsMarketOpen(true);
      } else {
        if (Math.random() > 0.5) {
          const stake = 100;
          const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
          if (roll >= 9) {
            addLog(`${player.name} speculated in the Market and doubled ₹${stake}!`, { isGood: true });
            queueActionNotice({
              type: "market",
              title: "Market gain",
              message: `${player.name} (Bot) gained ${formatRupee(stake)} from market speculation.`,
              amount: stake,
              space,
              seat
            });
            setRoom((prev) => {
              if (!prev) return prev;
              const next = [...prev.players];
              next[seat] = { ...player, cash: player.cash + stake };
              return { ...prev, players: next };
            });
          } else if (roll <= 5) {
            addLog(`${player.name} lost ₹${stake} in Market speculation.`, { isBad: true });
            queueActionNotice({
              type: "market",
              title: "Market loss",
              message: `${player.name} (Bot) lost ${formatRupee(stake)} in market speculation.`,
              amount: -stake,
              space,
              seat
            });
            setRoom((prev) => {
              if (!prev) return prev;
              const next = [...prev.players];
              next[seat] = { ...player, cash: Math.max(0, player.cash - stake) };
              return { ...prev, players: next };
            });
          }
        }
      }
      return;
    }

    // 4. Taxes
    if (space.kind === "levy") {
      const taxAmount = Math.round(player.cash * (space.pct / 100));
      playSound("pay");
      addLog(`${player.name} paid ${space.name} (${space.pct}%): ${formatRupee(taxAmount)}.`, { isBad: true });
      queueActionNotice({
        type: "tax",
        title: space.name,
        message: `${player.name}${player.isBot ? " (Bot)" : ""} paid ${formatRupee(taxAmount)} in tax.`,
        amount: taxAmount,
        space,
        seat
      });
      setRoom((prev) => {
        if (!prev) return prev;
        const next = [...prev.players];
        next[seat] = { ...player, cash: Math.max(0, player.cash - taxAmount) };
        return { ...prev, players: next };
      });
      return;
    }

    // 5. Properties (City, Rail, Utility)
    if (space.price !== undefined) {
      const propState = currentProperties[spaceId];
      if (!propState) {
        addLog(`${player.name} landed on unowned property ${space.name} (Value: ${formatRupee(space.price)})`, {
          playerColor: player.color,
          seat
        });
        if (seat === currentMySeat) {
          setSelectedTileId(spaceId);
        } else if (player.isBot && player.cash - space.price >= 400) {
          playSound("buy");
          setRoom((prev) => {
            if (!prev) return prev;
            const next = [...prev.players];
            const latestPlayer = next[seat];
            if (!latestPlayer || latestPlayer.cash - space.price < 400) return prev;
            next[seat] = { ...latestPlayer, cash: latestPlayer.cash - space.price };
            return { ...prev, players: next };
          });
          setProperties((prev) => ({
            ...prev,
            [spaceId]: { owner: seat, houses: 0, mortgaged: false }
          }));
          addLog(`${player.name} (Bot) bought ${space.name} for ${formatRupee(space.price)}!`, {
            playerColor: player.color,
            isGood: true
          });
          queueActionNotice({
            type: "purchase",
            title: "Property purchased",
            message: `${player.name} (Bot) bought ${space.name} for ${formatRupee(space.price)}!`,
            amount: space.price,
            space,
            seat
          });
        } else if (!player.isBot && player.cash >= space.price + 200) {
          buyProperty(seat, spaceId);
        }
      } else if (propState.owner !== seat && !propState.mortgaged) {
        const owner = currentRoom.players[propState.owner];
        const currentHouses = propState.houses || 0;
        let rentDue = space.rent ? space.rent[currentHouses] : 50;

        const ownerHoldsFullSet = hasFullColorSet(propState.owner, space.set, bSpaces, currentProperties);
        if (currentHouses === 0 && ownerHoldsFullSet) {
          rentDue = Math.round(rentDue * (GAME_CONSTANTS.FESTIVAL_RENT_MULTIPLIER || 3));
        }

        if (space.set && currentFestivals.includes(space.set)) {
          rentDue *= GAME_CONSTANTS.FESTIVAL_RENT_MULTIPLIER;
        }

        let availableCash = player.cash;
        let nextProperties = currentProperties;
        if (player.isBot && availableCash < rentDue) {
          const candidates = Object.entries(currentProperties)
            .filter(([id, owned]) =>
              owned.owner === seat &&
              !owned.mortgaged &&
              Number(id) !== spaceId &&
              bSpaces[Number(id)]
            )
            .sort(([a], [b]) => {
              const spaceA = bSpaces[Number(a)];
              const spaceB = bSpaces[Number(b)];
              const rentA = spaceA.rent?.[0] ?? 0;
              const rentB = spaceB.rent?.[0] ?? 0;
              return rentA - rentB || (spaceA.price || 0) - (spaceB.price || 0);
            });

          nextProperties = { ...currentProperties };
          for (const [id, owned] of candidates) {
            if (availableCash >= rentDue) break;
            const candidate = bSpaces[Number(id)];
            const mortgageValue = Math.round((candidate.price || 0) * 0.5);
            availableCash += mortgageValue;
            nextProperties[id] = { ...owned, mortgaged: true };
            addLog(`${player.name} (Bot) mortgaged ${candidate.name} to cover rent.`, {
              playerColor: player.color,
              isHighlight: true
            });
          }

          if (availableCash < rentDue) {
            for (const [id] of candidates) {
              const owned = nextProperties[id];
              if (!owned || !owned.mortgaged || availableCash >= rentDue) continue;
              const candidate = bSpaces[Number(id)];
              const saleValue = Math.round((candidate.price || 100) * 0.7);
              availableCash += saleValue - Math.round((candidate.price || 100) * 0.5);
              delete nextProperties[id];
              addLog(`${player.name} (Bot) sold ${candidate.name} to cover rent.`, {
                playerColor: player.color,
                isBad: true
              });
            }
          }
        }

        const actualPay = Math.min(availableCash, rentDue);
        const isBankrupt = player.isBot && availableCash < rentDue;
        playSound("rent");
        addLog(`${player.name}${player.isBot ? " (Bot)" : ""} paid ${formatRupee(actualPay)} rent to ${owner.name} for landing on ${space.name}!`, {
          playerColor: player.color,
          isBad: seat === currentMySeat,
          isGood: propState.owner === currentMySeat
        });
        queueActionNotice({
          type: "rent",
          title: isBankrupt ? "Rent and bankruptcy" : "Rent paid",
          message: `${player.name}${player.isBot ? " (Bot)" : ""} paid ${formatRupee(actualPay)} rent to ${owner.name} at ${space.name}.${isBankrupt ? " The remaining balance was insufficient; the bot is bankrupt." : ""}`,
          amount: actualPay,
          space,
          seat
        });
        if (isBankrupt) {
          addLog(`${player.name} (Bot) could not cover rent and went bankrupt.`, { isBad: true });
          const remainingAssets = Object.keys(nextProperties).filter(
            (id) => nextProperties[id]?.owner === seat
          );
          remainingAssets.forEach((id) => delete nextProperties[id]);
          setProperties(nextProperties);
        } else if (nextProperties !== currentProperties) {
          setProperties(nextProperties);
        }

        setRoom((prev) => {
          if (!prev) return prev;
          const next = [...prev.players];
          const latestPlayer = next[seat];
          const latestOwner = next[propState.owner];
          next[seat] = {
            ...latestPlayer,
            cash: Math.max(0, availableCash - actualPay),
            bankrupt: isBankrupt
          };
          next[propState.owner] = { ...latestOwner, cash: latestOwner.cash + actualPay };
          return { ...prev, players: next };
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the ref in sync so onMoveDone always calls the latest version
  handleTileActionRef.current = handleTileAction;

  // Buy property
  const buyProperty = (seat, spaceId) => {
    const space = boardSpaces[spaceId];
    const player = room.players[seat];
    if (!space || !player || player.cash < space.price) return;

    playSound("buy");
    setRoom((prev) => {
      const next = [...prev.players];
      next[seat] = { ...player, cash: player.cash - space.price };
      return { ...prev, players: next };
    });

    setProperties((prev) => ({
      ...prev,
      [spaceId]: { owner: seat, houses: 0, mortgaged: false }
    }));

    addLog(`${player.name} bought ${space.name} for ${formatRupee(space.price)}!`, {
      playerColor: player.color,
      isGood: true
    });
    queueActionNotice({
      type: "purchase",
      title: "Property purchased",
      message: `${player.name} bought ${space.name} for ${formatRupee(space.price)}!`,
      amount: space.price,
      space,
      seat
    });
    showToast(`${player.name} bought ${space.name}!`, "good");
  };

  // Build House or Hotel (with strict Monopoly Color Set rule enforcement)
  const buildHouse = (spaceId) => {
    const space = boardSpaces[spaceId];
    const prop = properties[spaceId];
    const player = room.players[mySeat];
    if (!space || !prop || prop.owner !== mySeat || prop.mortgaged) return;

    // Enforce Monopoly rule: must own all properties of this color set to build
    const fullSet = hasFullColorSet(mySeat, space.set, boardSpaces, properties);
    if (!fullSet) {
      playSound("lose");
      showToast("You must own all properties of this color set to build houses.", "error");
      addLog(`Build blocked: Must own all properties in the ${space.set?.toUpperCase()} set to build houses.`, {
        isBad: true
      });
      return;
    }

    const cost = 100;
    if (player.cash < cost) {
      showToast("Not enough cash to build structure.", "error");
      return;
    }
    if (prop.houses >= 5) {
      showToast("Property already has a Hotel (max structures).", "info");
      return;
    }

    playSound("build");
    setRoom((prev) => {
      const next = [...prev.players];
      next[mySeat] = { ...player, cash: player.cash - cost };
      return { ...prev, players: next };
    });

    setProperties((prev) => ({
      ...prev,
      [spaceId]: { ...prop, houses: prop.houses + 1 }
    }));

    addLog(`You built a ${prop.houses === 4 ? "Hotel" : "House"} on ${space.name}!`, { isGood: true });
    queueActionNotice({
      type: "build",
      title: "Property upgraded",
      message: `You built a ${prop.houses === 4 ? "hotel" : "house"} on ${space.name}.`,
      amount: cost,
      space,
      seat: mySeat
    });
    showToast(`Built on ${space.name}!`, "good");
  };

  // Mortgage property
  const mortgageProperty = (spaceId) => {
    const space = boardSpaces[spaceId];
    const prop = properties[spaceId];
    const player = room.players[mySeat];
    if (!space || !prop || prop.owner !== mySeat || prop.mortgaged) return;

    const cashBack = Math.round(space.price * 0.5);
    playSound("loan");
    setRoom((prev) => {
      const next = [...prev.players];
      next[mySeat] = { ...player, cash: player.cash + cashBack };
      return { ...prev, players: next };
    });

    setProperties((prev) => ({
      ...prev,
      [spaceId]: { ...prop, mortgaged: true }
    }));

    addLog(`You mortgaged ${space.name} and received ${formatRupee(cashBack)}.`, { isHighlight: true });
    queueActionNotice({
      type: "default",
      title: "Property mortgaged",
      message: `You received ${formatRupee(cashBack)} by mortgaging ${space.name}.`,
      amount: cashBack,
      space,
      seat: mySeat
    });
  };

  // Unmortgage property
  const unmortgageProperty = (spaceId) => {
    const space = boardSpaces[spaceId];
    const prop = properties[spaceId];
    const player = room.players[mySeat];
    if (!space || !prop || prop.owner !== mySeat || !prop.mortgaged) return;

    const cost = Math.round(space.price * 0.5 * 1.1);
    if (player.cash < cost) return;

    playSound("paidOff");
    setRoom((prev) => {
      const next = [...prev.players];
      next[mySeat] = { ...player, cash: player.cash - cost };
      return { ...prev, players: next };
    });

    setProperties((prev) => ({
      ...prev,
      [spaceId]: { ...prop, mortgaged: false }
    }));

    addLog(`You unmortgaged ${space.name}!`, { isGood: true });
    queueActionNotice({
      type: "default",
      title: "Property restored",
      message: `You unmortgaged ${space.name} for ${formatRupee(cost)}.`,
      amount: cost,
      space,
      seat: mySeat
    });
  };

  // Sell property back to bank for 70% of value
  const sellProperty = (spaceId) => {
    const space = boardSpaces[spaceId];
    const prop = properties[spaceId];
    const player = room.players[mySeat];
    if (!space || !prop || prop.owner !== mySeat) return;

    const sellValue = Math.round((space.price || 100) * 0.7);
    playSound("income");
    setRoom((prev) => {
      const next = [...prev.players];
      next[mySeat] = { ...player, cash: player.cash + sellValue };
      return { ...prev, players: next };
    });

    setProperties((prev) => {
      const next = { ...prev };
      delete next[spaceId];
      return next;
    });

    addLog(`You sold ${space.name} back to the bank for ${formatRupee(sellValue)}!`, {
      playerColor: player.color,
      isGood: true
    });
    queueActionNotice({
      type: "default",
      title: "Property sold",
      message: `You sold ${space.name} back to the bank for ${formatRupee(sellValue)}.`,
      amount: sellValue,
      space,
      seat: mySeat
    });
    showToast(`Sold ${space.name} for ${formatRupee(sellValue)}`, "good");
  };

  // Mine feature: spend cash to excavate gems/ores
  const [mineLevel, setMineLevel] = useState(0);

  const mineAction = ({ cost, yieldAmount, netProfit }) => {
    const player = room.players[mySeat];
    if (!player) return;

    setRoom((prev) => {
      const next = [...prev.players];
      next[mySeat] = { ...player, cash: Math.max(0, player.cash - cost + yieldAmount) };
      return { ...prev, players: next };
    });

    addLog(`⛏️ ${player.name} mined a shaft and yielded ${formatRupee(yieldAmount)} (Net: ${netProfit >= 0 ? `+${formatRupee(netProfit)}` : formatRupee(netProfit)})!`, {
      playerColor: player.color,
      isGood: netProfit >= 0,
      isBad: netProfit < 0
    });
    queueActionNotice({
      type: "default",
      title: "Mine result",
      message: `${player.name} received ${formatRupee(yieldAmount)} from mining (${netProfit >= 0 ? "profit" : "loss"}: ${formatRupee(Math.abs(netProfit))}).`,
      amount: netProfit,
      seat: mySeat
    });
  };

  // Pay Jail Bail
  const payJailBail = () => {
    const player = room.players[mySeat];
    if (player.cash < GAME_CONSTANTS.JAIL_BAIL_AMOUNT) return;

    playSound("paidOff");
    setRoom((prev) => {
      const next = [...prev.players];
      next[mySeat] = {
        ...player,
        cash: player.cash - GAME_CONSTANTS.JAIL_BAIL_AMOUNT,
        jail: 0
      };
      return { ...prev, players: next };
    });
    addLog(`You paid ₹50 bail and were released from Jail!`, { isGood: true });
    queueActionNotice({
      type: "jail",
      title: "Bail paid",
      message: `You paid ${formatRupee(GAME_CONSTANTS.JAIL_BAIL_AMOUNT)} bail and were released from Jail.`,
      amount: GAME_CONSTANTS.JAIL_BAIL_AMOUNT,
      seat: mySeat
    });
  };

  // Use Jail Free Card
  const useJailCard = () => {
    const player = room.players[mySeat];
    if ((player.jailCards || 0) <= 0) return;

    playSound("paidOff");
    setRoom((prev) => {
      const next = [...prev.players];
      next[mySeat] = {
        ...player,
        jailCards: player.jailCards - 1,
        jail: 0
      };
      return { ...prev, players: next };
    });
    addLog(`You used a "Get Out of Jail Free" card!`, { isGood: true });
    queueActionNotice({
      type: "jail",
      title: "Jail card used",
      message: "You used a Get Out of Jail Free card and were released.",
      seat: mySeat
    });
  };

  // Apply Chance Card
  const applyChanceCard = (seat, card, { logEvent = true } = {}) => {
    const player = roomRef.current?.players[seat];
    if (!player) return;

    if (logEvent) {
      addLog(`Chance for ${player.name}${player.isBot ? " (Bot)" : ""}: ${card.title} - ${card.desc}`, { isHighlight: true });
      queueActionNotice({
        type: "chance",
        title: card.title,
        message: `${player.name}${player.isBot ? " (Bot)" : ""} drew a Chance card.`,
        card,
        seat
      });
    }

    if (card.type === "jail_free") {
      setRoom((prev) => {
        if (!prev) return prev;
        const next = [...prev.players];
        next[seat] = { ...player, jailCards: (player.jailCards || 0) + 1 };
        return { ...prev, players: next };
      });
    } else if (card.type === "festival") {
      setFestivals(["brown", "sky", "pink"]);
      showToast("Village Festival active! 3× rent on village sets!", "gold");
      playSound("income");
    } else if (card.type === "move" && card.target !== undefined) {
      // Animated move to target tile
      const bSpaces = boardSpacesRef.current;
      const steps = (card.target - player.position + bSpaces.length) % bSpaces.length;
      movePlayer(seat, steps);
    } else if (card.type === "go_jail") {
      playSound("siren");
      addLog(`${player.name}${player.isBot ? " (Bot)" : ""} was sent to Jail by a Chance card.`, { isBad: true });
      queueActionNotice({
        type: "jail",
        title: "Chance: Go to Jail",
        message: `${player.name}${player.isBot ? " (Bot)" : ""} must go directly to Jail.`,
        card,
        seat
      });
      setRoom((prev) => {
        if (!prev) return prev;
        const next = [...prev.players];
        next[seat] = { ...player, position: 12, jail: GAME_CONSTANTS.JAIL_TRIES };
        return { ...prev, players: next };
      });
      // Teleport token to jail visually
      teleport(seat, 12);
    } else if (card.type === "cash_flat") {
      setRoom((prev) => {
        if (!prev) return prev;
        const next = [...prev.players];
        next[seat] = { ...player, cash: Math.max(0, player.cash + card.amount) };
        return { ...prev, players: next };
      });
    } else if (card.type === "cash_pct") {
      const gain = Math.max(card.min || 50, Math.round(player.cash * (card.percent / 100)));
      setRoom((prev) => {
        if (!prev) return prev;
        const next = [...prev.players];
        next[seat] = { ...player, cash: player.cash + gain };
        return { ...prev, players: next };
      });
    }
  };
  applyChanceCardRef.current = applyChanceCard;

  // End turn
  const endTurn = () => {
    if (isActionModalActive) return;
    playSound("turn");
    setSelectedTileId(null);
    setTurnPhase("roll");
    setBotStatus("");
    botStepInProgressRef.current = false;

    const activeSeats = room.players
      .map((player, seat) => player && !player.bankrupt ? seat : -1)
      .filter((seat) => seat >= 0);
    if (activeSeats.length <= 1) {
      endGame();
      return;
    }

    const currentIndex = activeSeats.indexOf(turnSeat);
    const nextSeat = activeSeats[(currentIndex + 1 + activeSeats.length) % activeSeats.length];
    setTurnSeat(nextSeat);

    if (nextSeat <= turnSeat) {
      setRound((r) => r + 1);
    }

    if (nextSeat === mySeat) {
      playSound("myTurn");
      showToast("Your turn to roll!", "gold");
    }
  };

  rollDiceRef.current = rollDice;
  endTurnRef.current = endTurn;

  const handleBotTurn = useCallback((botPlayer, phase) => {
    const currentPlayer = roomRef.current?.players[botPlayer.seat];
    if (!currentPlayer || currentPlayer.bankrupt || !currentPlayer.isBot) {
      botStepInProgressRef.current = false;
      return;
    }

    if (phase === "roll") {
      if (currentPlayer.jail > 0) {
        if ((currentPlayer.jailCards || 0) > 0) {
          setRoom((prev) => {
            if (!prev) return prev;
            const next = [...prev.players];
            const latest = next[botPlayer.seat];
            next[botPlayer.seat] = {
              ...latest,
              jailCards: latest.jailCards - 1,
              jail: 0
            };
            return { ...prev, players: next };
          });
          addLog(`${currentPlayer.name} (Bot) used a Get Out of Jail Free card.`, { isGood: true });
          queueActionNotice({
            type: "jail",
            title: "Jail card used",
            message: `${currentPlayer.name} (Bot) used a Get Out of Jail Free card.`,
            seat: botPlayer.seat
          });
          setBotStatus("thinking");
          scheduleSequenceTimeout(() => {
            botStepInProgressRef.current = false;
            rollDiceRef.current?.();
          }, 350);
          return;
        }

        if (currentPlayer.cash >= GAME_CONSTANTS.JAIL_BAIL_AMOUNT + 400) {
          setRoom((prev) => {
            if (!prev) return prev;
            const next = [...prev.players];
            const latest = next[botPlayer.seat];
            next[botPlayer.seat] = {
              ...latest,
              cash: latest.cash - GAME_CONSTANTS.JAIL_BAIL_AMOUNT,
              jail: 0
            };
            return { ...prev, players: next };
          });
          addLog(`${currentPlayer.name} (Bot) paid ₹50 bail.`, { isGood: true });
          queueActionNotice({
            type: "jail",
            title: "Bail paid",
            message: `${currentPlayer.name} (Bot) paid ${formatRupee(GAME_CONSTANTS.JAIL_BAIL_AMOUNT)} bail.`,
            amount: GAME_CONSTANTS.JAIL_BAIL_AMOUNT,
            seat: botPlayer.seat
          });
          setBotStatus("thinking");
          scheduleSequenceTimeout(() => {
            botStepInProgressRef.current = false;
            rollDiceRef.current?.();
          }, 350);
          return;
        }
      }

      setBotStatus("rolling");
      botStepInProgressRef.current = false;
      rollDiceRef.current?.();
      return;
    }

    const currentProperties = propertiesRef.current;
    const buildCandidate = boardSpacesRef.current
      .map((space) => ({ space, property: currentProperties[space.id] }))
      .filter(({ space, property }) =>
        space.kind === "city" &&
        property?.owner === botPlayer.seat &&
        !property.mortgaged &&
        (property.houses || 0) < 5 &&
        hasFullColorSet(botPlayer.seat, space.set, boardSpacesRef.current, currentProperties) &&
        currentPlayer.cash - 100 >= 500
      )
      .sort((a, b) => {
        const housesA = a.property.houses || 0;
        const housesB = b.property.houses || 0;
        const rentA = a.space.rent?.[housesA + 1] ?? 0;
        const rentB = b.space.rent?.[housesB + 1] ?? 0;
        return rentB - rentA || housesA - housesB;
      })[0];

    if (buildCandidate) {
      const { space, property } = buildCandidate;
      setRoom((prev) => {
        if (!prev) return prev;
        const next = [...prev.players];
        const latest = next[botPlayer.seat];
        if (!latest || latest.cash < 600) return prev;
        next[botPlayer.seat] = { ...latest, cash: latest.cash - 100 };
        return { ...prev, players: next };
      });
      setProperties((prev) => ({
        ...prev,
        [space.id]: { ...property, houses: (property.houses || 0) + 1 }
      }));
      addLog(`${currentPlayer.name} (Bot) built a ${property.houses === 4 ? "hotel" : "house"} on ${space.name}.`, {
        playerColor: currentPlayer.color,
        isGood: true
      });
      queueActionNotice({
        type: "build",
        title: "Property upgraded",
        message: `${currentPlayer.name} (Bot) built a ${property.houses === 4 ? "hotel" : "house"} on ${space.name}.`,
        amount: 100,
        space,
        seat: botPlayer.seat
      });
      setBotStatus("building");
    } else {
      setBotStatus("thinking");
    }

    const finishBotTurnAfterNotices = () => {
      if (activeActionNoticeRef.current) {
        scheduleSequenceTimeout(finishBotTurnAfterNotices, 150);
      } else {
        endTurnRef.current?.();
      }
    };
    scheduleSequenceTimeout(finishBotTurnAfterNotices, buildCandidate ? 900 : 700);
  }, [addLog, scheduleSequenceTimeout]);

  const currentTurnPlayer = room?.players[turnSeat];
  const isBotTurn = Boolean(
    screen === "game" &&
    !isGameOver &&
    currentTurnPlayer?.isBot &&
    (!roomSyncEnabledRef.current || mySeat === 0)
  );

  // Bot turns wait for all dice and movement sequences before taking the next action.
  useEffect(() => {
    if (!isBotTurn || isActionModalActive || isRolling || isTurnResolving || isMoving || botStepInProgressRef.current) {
      return undefined;
    }

    const botPlayer = room?.players[turnSeat];
    if (!botPlayer) return undefined;

    setBotStatus("thinking");
    const timer = setTimeout(() => {
      botTurnTimersRef.current.delete(timer);
      if (botStepInProgressRef.current) return;
      botStepInProgressRef.current = true;
      if (botPlayer.bankrupt) {
        setBotStatus("thinking");
        endTurnRef.current?.();
      } else {
        handleBotTurn(botPlayer, turnPhase);
      }
    }, 1000 + Math.floor(Math.random() * 501));
    botTurnTimersRef.current.add(timer);

    return () => {
      clearTimeout(timer);
      botTurnTimersRef.current.delete(timer);
    };
  }, [
    handleBotTurn,
    isBotTurn,
    isActionModalActive,
    isMoving,
    isRolling,
    isTurnResolving,
    room,
    turnPhase,
    turnSeat
  ]);

  // Send Chat message
  const sendMessage = ({ channel, to, text }) => {
    const newMsg = {
      from: mySeat,
      to,
      channel,
      text,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, newMsg]);

    if (channel === "dm" && to !== null) {
      const recipient = room.players[to];
      if (recipient?.isBot) {
        setTimeout(() => {
          const replies = [
            "Sounds good to me!",
            "Let's see how the next round goes.",
            "I'm focusing on completing my color set right now.",
            "Make me an offer I can't refuse!",
            "Haha, nice roll earlier!"
          ];
          const replyText = replies[Math.floor(Math.random() * replies.length)];
          setMessages((prev) => [
            ...prev,
            { from: to, to: mySeat, channel: "dm", text: replyText, timestamp: Date.now() }
          ]);
        }, 1200);
      }
    }
  };

  // Propose Trade
  const proposeTrade = ({ from, to, giveProps, giveCash, getProps, getCash }) => {
    const currentRoom = roomRef.current;
    const fromP = currentRoom?.players[from];
    const toP = currentRoom?.players[to];
    if (!fromP || !toP) return;

    addLog(`${fromP.name} proposed a trade to ${toP.name}.`, { isHighlight: true });

    if (toP.isBot) {
      setTimeout(() => {
        const latestRoom = roomRef.current;
        const latestProperties = propertiesRef.current;
        const latestFrom = latestRoom?.players[from];
        const latestBot = latestRoom?.players[to];
        const cashIsValid =
          Number.isInteger(giveCash) &&
          Number.isInteger(getCash) &&
          giveCash >= 0 &&
          getCash >= 0 &&
          giveCash <= (latestFrom?.cash ?? 0) &&
          getCash <= (latestBot?.cash ?? 0);
        const assetsAreValid =
          new Set(giveProps).size === giveProps.length &&
          new Set(getProps).size === getProps.length &&
          giveProps.every((id) => latestProperties[id]?.owner === from && !latestProperties[id].mortgaged) &&
          getProps.every((id) => latestProperties[id]?.owner === to && !latestProperties[id].mortgaged);

        const offeredValue = giveProps.reduce(
          (sum, id) => sum + (boardSpacesRef.current[Number(id)]?.price || 0),
          giveCash
        );
        const requestedValue = getProps.reduce(
          (sum, id) => sum + (boardSpacesRef.current[Number(id)]?.price || 0),
          getCash
        );
        const resultingBotCash = (latestBot?.cash ?? 0) + giveCash - getCash;
        const accepted =
          cashIsValid &&
          assetsAreValid &&
          resultingBotCash >= 300 &&
          offeredValue >= requestedValue * 1.1 &&
          (offeredValue > 0 || requestedValue > 0);

        if (accepted) {
          playSound("income");
          showToast(`${latestBot.name} accepted your trade!`, "good");
          addLog(`${latestBot.name} (Bot) accepted the trade with ${latestFrom.name}!`, { isGood: true });

          setProperties((prev) => {
            const next = { ...prev };
            giveProps.forEach((id) => {
              if (next[id]) next[id] = { ...next[id], owner: to };
            });
            getProps.forEach((id) => {
              if (next[id]) next[id] = { ...next[id], owner: from };
            });
            return next;
          });

          setRoom((prev) => {
            const next = [...prev.players];
            const currentFrom = next[from];
            const currentTo = next[to];
            next[from] = { ...currentFrom, cash: currentFrom.cash - giveCash + getCash };
            next[to] = { ...currentTo, cash: currentTo.cash + giveCash - getCash };
            return { ...prev, players: next };
          });
        } else {
          showToast(`${latestBot?.name || toP.name} declined the trade offer.`, "info");
          addLog(`${latestBot?.name || toP.name} (Bot) declined an invalid or unfavorable trade offer.`);
        }
      }, 1000);
    }
  };

  return {
    screen,
    setScreen,
    selectedState,
    setSelectedState,
    boardSpaces,
    registerTileCenterGetter,
    profile,
    updateProfile,
    room,
    setRoom,          // exposed for MarketModal onResolve in App.jsx
    mySeat,
    connectionStatus,
    connectionError,
    roomError,
    setRoomError,
    turnSeat,
    turnPhase,
    isBotTurn,
    botStatus,
    activeActionNotice,
    isActionModalActive,
    dismissActionNotice,
    queueActionNotice,
    addLog,
    dice,
    isRolling,
    isTurnResolving,
    isMoving,         // true while piece is animating
    displayPositions, // { [seat]: tileIndex } for animated rendering
    activeHopState,   // { seat, hopY, scaleY } | null — live arc for active token
    properties,
    round,
    timeRemaining,
    logs,
    messages,
    festivals,
    selectedTileId,
    setSelectedTileId,
    isMarketOpen,
    setIsMarketOpen,
    isChatOpen,
    setIsChatOpen,
    isTradeOpen,
    setIsTradeOpen,
    isGameOver,
    setIsGameOver,    // exposed so App.jsx GameOver modal can reset
    createRoom,
    joinRoom,
    startOfflineGame,
    leaveRoom,
    addBot,
    kickPlayer,
    startMatch,
    rollDice,
    endTurn,
    buyProperty,
    buildHouse,
    mortgageProperty,
    unmortgageProperty,
    sellProperty,
    mineAction,
    mineLevel,
    payJailBail,
    useJailCard,
    applyChanceCard,
    sendMessage,
    proposeTrade,
    endGame
  };
}
