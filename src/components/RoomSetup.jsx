import React, { useState, useEffect } from "react";
import { Camera, Lightbulb, Download, MapPin } from "lucide-react";
import { Logo } from "./Icons";
import PieceToken from "./PieceToken";
import { 
  GAME_CONSTANTS, 
  MATCH_LENGTH_OPTIONS, 
  MISS_LIMIT_OPTIONS, 
  formatLength, 
  formatMisses 
} from "../data/constants";
import { STATE_REGIONS } from "../data/stateBoardData";
import { TIPS_DATA } from "../data/tipsData";
import { playSound } from "../audio/soundEngine";

export default function RoomSetup({
  profile,
  onOpenLookCustomizer,
  onNameChange,
  onCreateRoom,
  onJoinRoom,
  onOpenWhatsNew,
  lastRoom = null,
  onRejoinLastRoom = null
}) {
  const [tab, setTab] = useState("create"); // 'create' | 'join'
  const [selectedState, setSelectedState] = useState("maharashtra");
  const [seats, setSeats] = useState(4);
  const [matchLength, setMatchLength] = useState(45);
  const [missLimit, setMissLimit] = useState(GAME_CONSTANTS.DEFAULT_MISS_LIMIT);
  const [roomCode, setRoomCode] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Rotating tips
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS_DATA.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPWAInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    }
  };

  const isNameValid = profile.name.trim().length > 0;
  const isJoinValid = isNameValid && roomCode.length === 6;

  const handleCreate = async () => {
    if (!isNameValid || isCreating) return;
    playSound("click");
    setIsCreating(true);
    try {
      await onCreateRoom({ seats, matchLength, missLimit, selectedState });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = () => {
    if (!isJoinValid) return;
    playSound("click");
    onJoinRoom(roomCode);
  };

  const initialLetter = (profile.name.trim()[0] || "?").toUpperCase();

  return (
    <>
      <Logo />

      {lastRoom && (
        <div className="banner info">
          <span>
            {lastRoom.started
              ? `Your match in ${lastRoom.host}'s room is still on. Room ${lastRoom.code}.`
              : `You have a seat in ${lastRoom.host}'s room. Room ${lastRoom.code}.`}
          </span>
          <button
            type="button"
            className="gbtn sm gold"
            onClick={() => onRejoinLastRoom && onRejoinLastRoom(lastRoom.code)}
          >
            {lastRoom.started ? "Rejoin" : "Back to it"}
          </button>
        </div>
      )}

      {/* Name and Look row */}
      <div className="namerow">
        <button
          type="button"
          className="lookbtn"
          aria-label="Change your photo and piece"
          onClick={() => {
            playSound("click");
            onOpenLookCustomizer();
          }}
        >
          <span
            className={`av ${profile.photo ? "ph" : ""}`}
            style={{ "--c": "#FFC83D", "--ci": "#2A1B4D" }}
          >
            {profile.photo ? (
              <img src={profile.photo} alt="" draggable={false} />
            ) : (
              initialLetter
            )}
          </span>
          <span className="lookpiece">
            <PieceToken color="#FFC83D" kind={profile.token || "pawn"} />
          </span>
          <Camera className="lucide lucide-camera lu lookcam" />
        </button>

        <label className="field">
          Your name
          <input
            type="text"
            placeholder="Type your name"
            value={profile.name}
            maxLength={GAME_CONSTANTS.NAME_MAX}
            onChange={(e) => onNameChange(e.target.value.slice(0, GAME_CONSTANTS.NAME_MAX))}
          />
        </label>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="seg two">
        <button
          type="button"
          className={`gbtn gold ${tab === "create" ? "" : "off"}`}
          onClick={() => {
            playSound("click");
            setTab("create");
          }}
        >
          Create room
        </button>
        <button
          type="button"
          className={`gbtn gold ${tab === "join" ? "" : "off"}`}
          onClick={() => {
            playSound("click");
            setTab("join");
          }}
        >
          Join room
        </button>
      </div>

      {/* Create / Join Swap Panel */}
      <div className="swap">
        {/* Create Panel */}
        <section className={`panel ${tab !== "create" ? "hid" : ""}`} aria-hidden={tab !== "create"}>
          {/* Dynamic Region / State Dropdown */}
          <div className="row flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Select Region/State
            </span>
          </div>
          <div className="flex flex-col gap-1 w-full bg-[#1b0f3b] p-2.5 rounded-xl border border-amber-400/30">
            <select
              className="w-full bg-[#2a175c] text-white font-semibold text-xs py-2 px-2.5 rounded-lg border border-white/20 focus:outline-none focus:border-amber-400 cursor-pointer"
              value={selectedState}
              onChange={(e) => {
                playSound("click");
                setSelectedState(e.target.value);
              }}
            >
              {Object.values(STATE_REGIONS).map((reg) => (
                <option key={reg.id} value={reg.id} className="bg-[#1b0f3b] text-white py-1">
                  {reg.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-purple-300/80 px-1 italic">
              {STATE_REGIONS[selectedState]?.description}
            </p>
          </div>

          <div className="row mt-1">
            <span>Seats</span>
            <span className="stepper">
              <button
                type="button"
                className="gbtn sm"
                disabled={seats <= GAME_CONSTANTS.MIN_SEATS}
                onClick={() => {
                  playSound("click");
                  setSeats((s) => Math.max(GAME_CONSTANTS.MIN_SEATS, s - 1));
                }}
              >
                −
              </button>
              <b>{seats}</b>
              <button
                type="button"
                className="gbtn sm"
                disabled={seats >= GAME_CONSTANTS.MAX_SEATS}
                onClick={() => {
                  playSound("click");
                  setSeats((s) => Math.min(GAME_CONSTANTS.MAX_SEATS, s + 1));
                }}
              >
                +
              </button>
            </span>
          </div>

          <div className="row">
            <span>Match length</span>
          </div>
          <div className="seg" style={{ gridTemplateColumns: `repeat(${MATCH_LENGTH_OPTIONS.length}, 1fr)` }}>
            {MATCH_LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`gbtn gold sm ${matchLength === opt ? "" : "off"}`}
                onClick={() => {
                  playSound("click");
                  setMatchLength(opt);
                }}
              >
                {formatLength(opt)}
              </button>
            ))}
          </div>

          <div className="row">
            <span>Out after missing</span>
          </div>
          <div className="seg" style={{ gridTemplateColumns: `repeat(${MISS_LIMIT_OPTIONS.length}, 1fr)` }}>
            {MISS_LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`gbtn gold sm ${missLimit === opt ? "" : "off"}`}
                onClick={() => {
                  playSound("click");
                  setMissLimit(opt);
                }}
              >
                {formatMisses(opt)}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="gbtn green big mt-2"
            disabled={!isNameValid || isCreating}
            onClick={handleCreate}
          >
            {isCreating ? "Creating…" : "Create"}
          </button>
        </section>

        {/* Join Panel */}
        <section className={`panel ${tab !== "join" ? "hid" : ""}`} aria-hidden={tab !== "join"}>
          <label className="field">
            Room code from your host
            <input
              type="text"
              className="code"
              maxLength={6}
              placeholder="ABC123"
              autoCapitalize="characters"
              tabIndex={tab === "join" ? 0 : -1}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
            />
          </label>
          <p className="small">
            Ask your host for the 6-character code, or open the invite link they sent.
          </p>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="gbtn green big"
            disabled={!isJoinValid}
            onClick={handleJoin}
          >
            Join
          </button>
        </section>
      </div>

      {isPWAInstallable && (
        <div className="install mt-2">
          <button type="button" className="gbtn sm blue" onClick={handleInstallClick}>
            <Download className="lu w-4 h-4" />
            Install the app
          </button>
        </div>
      )}

      {/* What's new link */}
      <button
        type="button"
        className="newslink"
        onClick={() => {
          playSound("click");
          onOpenWhatsNew();
        }}
      >
        What's new
      </button>

      {/* Rotating tips */}
      <p className="tips" aria-live="off">
        <Lightbulb className="lucide lucide-lightbulb lu text-amber-300" />
        <span>{TIPS_DATA[tipIndex]}</span>
      </p>
    </>
  );
}
