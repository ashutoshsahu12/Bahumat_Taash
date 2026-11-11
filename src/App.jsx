import React, { useState } from "react";
import HeaderHUD from "./components/HeaderHUD";
import RoomSetup from "./components/RoomSetup";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import TurnDock from "./components/TurnDock";
import ActivityTicker from "./components/ActivityTicker";
import ActionModal from "./components/ActionModal";
import PropertyCardModal from "./components/PropertyCardModal";
import MarketModal from "./components/MarketModal";
import TradeModal from "./components/TradeModal";
import BuildModal from "./components/BuildModal";
import SellModal from "./components/SellModal";
import MineModal from "./components/MineModal";
import ChatDrawer from "./components/ChatDrawer";
import AvatarCustomizerModal from "./components/AvatarCustomizerModal";
import WhatsNewModal from "./components/WhatsNewModal";
import GameOverModal from "./components/GameOverModal";
import Toaster from "./components/Toaster";
import { MessageSquare } from "lucide-react";
import { formatRupee } from "./data/constants";
import { useGameState } from "./hooks/useGameState";
import { playSound } from "./audio/soundEngine";

export default function App() {
  const [isLookModalOpen, setIsLookModalOpen] = useState(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const [isBuildOpen, setIsBuildOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isMineOpen, setIsMineOpen] = useState(false);

  const {
    screen,
    setScreen,
    selectedState,
    setSelectedState,
    boardSpaces,
    registerTileCenterGetter,
    profile,
    updateProfile,
    room,
    setRoom,
    mySeat,
    turnSeat,
    turnPhase,
    isBotTurn,
    botStatus,
    dice,
    isRolling,
    isTurnResolving,
    isMoving,
    displayPositions,
    activeHopState,
    properties,
    round,
    timeRemaining,
    logs,
    messages,
    festivals,
    selectedTileId,
    setSelectedTileId,
    activeActionNotice,
    isActionModalActive,
    dismissActionNotice,
    queueActionNotice,
    addLog,
    isMarketOpen,
    setIsMarketOpen,
    isChatOpen,
    setIsChatOpen,
    isTradeOpen,
    setIsTradeOpen,
    isGameOver,
    setIsGameOver,
    createRoom,
    joinRoom,
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
  } = useGameState();

  const myPlayer = room?.players[mySeat];
  const turnPlayer = room?.players[turnSeat];
  const isMyTurn = turnSeat === mySeat;

  // Format timer
  const formatTime = (seconds) => {
    if (seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const selectedSpace = selectedTileId !== null ? boardSpaces[selectedTileId] : null;
  const selectedPropState = selectedTileId !== null ? properties[selectedTileId] : null;
  const selectedOwner =
    selectedPropState?.owner !== undefined ? room?.players[selectedPropState.owner] : null;

  return (
    <div className="bb flex flex-col items-center justify-center h-full w-full relative">
      <Toaster />

      {/* 1. SETUP / LANDING SCREEN */}
      {screen === "setup" && (
        <main className="screen form">
          <div className="hud">
            <span className="sp" />
            <HeaderHUD />
          </div>

          <RoomSetup
            profile={profile}
            onOpenLookCustomizer={() => setIsLookModalOpen(true)}
            onNameChange={(name) => updateProfile({ name })}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
          />
        </main>
      )}

      {/* 2. LOBBY / WAITING SCREEN */}
      {screen === "lobby" && room && (
        <main className="screen form">
          <HeaderHUD inGame={true} roomCode={room.code} onLeave={() => setScreen("setup")} />

          <Lobby
            room={room}
            mySeat={mySeat}
            isHost={mySeat === 0}
            selectedState={selectedState}
            onChangeState={(st) => setSelectedState(st)}
            onStartMatch={startMatch}
            onAddBot={addBot}
            onKickPlayer={kickPlayer}
          />
        </main>
      )}

      {/* 3. ACTIVE GAMEPLAY SCREEN */}
      {screen === "game" && room && (
        <main className={`screen game-screen ${isMyTurn ? "myturn" : ""}`}>
          {/* Top HUD */}
          <div className="hudwrap w-full">
            <HeaderHUD
              inGame={true}
              roomCode={room.code}
              round={round}
              timeLeft={formatTime(timeRemaining)}
              onLeave={() => setScreen("setup")}
            />
          </div>

          {/* Center 48-tile Board Area */}
          <GameBoard
            boardSpaces={boardSpaces}
            registerTileCenterGetter={registerTileCenterGetter}
            players={room.players.filter(Boolean)}
            properties={properties}
            selectedTile={selectedTileId}
            isTurnResolving={isTurnResolving || isActionModalActive}
            isMoving={isMoving}
            displayPositions={displayPositions}
            activeHopState={activeHopState}
            festivals={festivals}
            onSelectTile={(id) => setSelectedTileId(id)}
            onOpenMarket={() => setIsMarketOpen(true)}
            onOpenChance={() => {
              const card = {
                title: "Village Festival",
                desc: "Own a whole village set (Brown, Sky, or Pink) and hold a festival for 3× rent on all of it!",
                type: "festival"
              };
              addLog("You opened the Village Festival card.", { isHighlight: true });
              queueActionNotice({
                type: "chance",
                title: card.title,
                message: "Festival rules reminder.",
                card,
                seat: mySeat,
                onDismiss: () => applyChanceCard(mySeat, card, { logEvent: false })
              });
            }}
          />

          {/* Turn Dock */}
          <TurnDock
            isMyTurn={isMyTurn}
            turnPlayer={turnPlayer}
            myPlayer={myPlayer}
            players={room.players.filter(Boolean)}
            gameState={{ turnPhase }}
            isBotTurn={isBotTurn}
            botStatus={botStatus}
            dice={dice}
            isRolling={isRolling}
            isTurnResolving={isTurnResolving}
            isActionModalActive={isActionModalActive}
            isMoving={isMoving}
            onRollDice={rollDice}
            onEndTurn={endTurn}
            onOpenTrade={() => setIsTradeOpen(true)}
            onOpenBuild={() => setIsBuildOpen(true)}
            onOpenSell={() => setIsSellOpen(true)}
            onOpenMine={() => setIsMineOpen(true)}
            onPayJailBail={payJailBail}
            onUseJailCard={useJailCard}
          />

          {/* Live Activity Feed and Chat */}
          <div className="game-activity-row flex w-full min-w-0 flex-row items-center gap-2">
            <ActivityTicker logs={logs} />
            <button
              type="button"
              aria-label="Open chat"
              className="gbtn sm blue flex shrink-0 items-center gap-1 whitespace-nowrap"
              onClick={() => {
                playSound("click");
                setIsChatOpen(true);
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden min-[380px]:inline">Chat</span>
              {messages.length > 0 && (
                <span className="ml-0.5 h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </main>
      )}

      {/* MODALS */}

      <ActionModal
        notice={activeActionNotice}
        onDismiss={dismissActionNotice}
      />

      {/* Build Structures Modal */}
      <BuildModal
        isOpen={isBuildOpen}
        onClose={() => setIsBuildOpen(false)}
        boardSpaces={boardSpaces}
        properties={properties}
        mySeat={mySeat}
        playerCash={myPlayer?.cash || 0}
        onBuildHouse={buildHouse}
      />

      {/* Sell / Mortgage Assets Modal */}
      <SellModal
        isOpen={isSellOpen}
        onClose={() => setIsSellOpen(false)}
        boardSpaces={boardSpaces}
        properties={properties}
        mySeat={mySeat}
        onMortgage={mortgageProperty}
        onUnmortgage={unmortgageProperty}
        onSellProperty={sellProperty}
      />

      {/* Resource Mine Minigame Modal */}
      <MineModal
        isOpen={isMineOpen}
        onClose={() => setIsMineOpen(false)}
        playerCash={myPlayer?.cash || 0}
        mineLevel={mineLevel}
        onMineAction={mineAction}
      />

      {/* Avatar & Piece Customizer Modal */}
      {isLookModalOpen && (
        <AvatarCustomizerModal
          name={profile.name}
          initialPhoto={profile.photo}
          initialToken={profile.token}
          onSave={(photo, token) => updateProfile({ photo, token })}
          onClose={() => setIsLookModalOpen(false)}
        />
      )}

      {/* What's New Release Notes Modal */}
      {isWhatsNewOpen && (
        <WhatsNewModal onClose={() => setIsWhatsNewOpen(false)} />
      )}

      {/* Title Deed Property Card Modal */}
      {selectedSpace && (
        <PropertyCardModal
          space={selectedSpace}
          propertyState={selectedPropState}
          ownerPlayer={selectedOwner}
          mySeat={mySeat}
          boardSpaces={boardSpaces}
          properties={properties}
          isMyTurn={isMyTurn}
          canBuyNow={
            isMyTurn &&
            selectedSpace.price !== undefined &&
            !selectedPropState &&
            myPlayer?.cash >= selectedSpace.price
          }
          onBuy={() => buyProperty(mySeat, selectedSpace.id)}
          onBuildHouse={buildHouse}
          onMortgage={mortgageProperty}
          onUnmortgage={unmortgageProperty}
          onClose={() => setSelectedTileId(null)}
        />
      )}

      {/* Market Speculation Minigame Modal */}
      {isMarketOpen && (
        <MarketModal
          playerCash={myPlayer?.cash || 2000}
          onResolve={(amount) => {
            if (myPlayer) {
              const marketSpace = boardSpaces[myPlayer.position];
              const message = amount > 0
                ? `You gained ${formatRupee(amount)} from the Market.`
                : amount < 0
                ? `You lost ${formatRupee(Math.abs(amount))} in the Market.`
                : "The Market was flat; your stake was returned.";
              addLog(`${myPlayer.name} ${message}`, { isGood: amount > 0, isBad: amount < 0 });
              setIsMarketOpen(false);
              queueActionNotice({
                type: "market",
                title: amount > 0 ? "Market gain" : amount < 0 ? "Market loss" : "Market unchanged",
                message,
                amount,
                space: marketSpace,
                seat: mySeat
              });
            }
            if (amount !== 0 && myPlayer) {
              setRoom((prev) => {
                if (!prev) return prev;
                const next = [...prev.players];
                next[mySeat] = {
                  ...myPlayer,
                  cash: Math.max(0, myPlayer.cash + amount)
                };
                return { ...prev, players: next };
              });
            }
          }}
          onClose={() => setIsMarketOpen(false)}
        />
      )}

      {/* Trade Modal */}
      {isTradeOpen && (
        <TradeModal
          boardSpaces={boardSpaces}
          players={room?.players.filter(Boolean)}
          mySeat={mySeat}
          properties={properties}
          onProposeTrade={proposeTrade}
          onClose={() => setIsTradeOpen(false)}
        />
      )}

      {/* Chat Drawer */}
      {isChatOpen && (
        <ChatDrawer
          players={room?.players.filter(Boolean)}
          mySeat={mySeat}
          messages={messages}
          onSendMessage={sendMessage}
          onClose={() => setIsChatOpen(false)}
        />
      )}

      {/* Game Over Leaderboard Modal */}
      {isGameOver && (
        <GameOverModal
          players={room?.players.filter(Boolean)}
          onPlayAgain={() => {
            setIsGameOver(false);
            startMatch();
          }}
          onBackHome={() => {
            setIsGameOver(false);
            setScreen("setup");
          }}
        />
      )}    </div>
  );
}
