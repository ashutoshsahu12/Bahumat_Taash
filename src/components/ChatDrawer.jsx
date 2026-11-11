import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Users, User } from 'lucide-react';
import { playSound } from '../audio/soundEngine';

const QUICK_CHATS = [
  "Deal?",
  "Good roll!",
  "Check my offer",
  "Your turn!",
  "No thanks",
  "Nice one",
  "GG"
];

export default function ChatDrawer({
  players = [],
  mySeat = 0,
  messages = [],
  onSendMessage,
  onClose
}) {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | seat index
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Filter messages for active channel
  const filteredMessages = messages.filter((m) => {
    if (activeTab === "all") {
      return m.channel === "all";
    }
    const partnerSeat = Number(activeTab);
    return (
      (m.from === mySeat && m.to === partnerSeat) ||
      (m.from === partnerSeat && m.to === mySeat)
    );
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages.length]);

  const handleSend = (contentToSend) => {
    const msg = (contentToSend || text).trim();
    if (!msg) return;
    playSound("click");
    onSendMessage({
      channel: activeTab === "all" ? "all" : "dm",
      to: activeTab === "all" ? null : Number(activeTab),
      text: msg
    });
    setText("");
  };

  const otherPlayers = players.filter((_, idx) => idx !== mySeat);

  return (
    <div className="chatlayer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="chat" aria-label="Chat">
        <div className="grab" aria-hidden="true" />
        <header className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5">
            Table Chat
          </h2>
          <button
            type="button"
            className="ib"
            aria-label="Close chat"
            onClick={() => {
              playSound("click");
              onClose();
            }}
          >
            <X className="lu w-5 h-5" />
          </button>
        </header>

        {/* Channel Tabs */}
        <div className="tabs flex gap-1 overflow-x-auto pb-1 mb-2 scrollbar-none" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`tab ${activeTab === "all" ? "on" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <Users className="lu w-3.5 h-3.5 inline mr-1" />
            Everyone
          </button>

          {otherPlayers.map((p, idx) => {
            const seatIdx = players.indexOf(p);
            return (
              <button
                key={seatIdx}
                type="button"
                role="tab"
                aria-selected={activeTab === String(seatIdx)}
                className={`tab ${activeTab === String(seatIdx) ? "on" : ""}`}
                onClick={() => setActiveTab(String(seatIdx))}
              >
                <User className="lu w-3.5 h-3.5 inline mr-1" />
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Messages Stream */}
        <div className="log flex-1 overflow-y-auto flex flex-col gap-2 p-2 bg-[#120a2e]/60 rounded-xl min-h-[160px] max-h-[220px] border border-white/5">
          {filteredMessages.length === 0 ? (
            <div className="text-center text-xs text-purple-300/60 my-auto italic">
              No messages yet. Say hello or tap a quick message below!
            </div>
          ) : (
            filteredMessages.map((msg, i) => {
              const isMine = msg.from === mySeat;
              const sender = players[msg.from] || { name: "Player" };
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-purple-300 font-semibold px-1">
                    {isMine ? "You" : sender.name}
                  </span>
                  <div
                    className={`p-2 rounded-xl text-xs max-w-[80%] break-words ${
                      isMine
                        ? "bg-amber-400 text-purple-950 font-semibold rounded-br-none shadow"
                        : "bg-[#2c1873] text-purple-100 rounded-bl-none border border-white/10"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chat Pills */}
        <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-none">
          {QUICK_CHATS.map((phrase) => (
            <button
              key={phrase}
              type="button"
              className="gbtn sm gold whitespace-nowrap text-[11px] py-1 px-2.5"
              onClick={() => handleSend(phrase)}
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex gap-2 items-center mt-1">
          <input
            type="text"
            className="flex-1 bg-[#1a0e3a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-amber-400"
            placeholder={
              activeTab === "all" ? "Message everyone..." : `Private message...`
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            type="button"
            className="gbtn green sm px-3 py-2"
            disabled={!text.trim()}
            onClick={() => handleSend()}
          >
            <Send className="lu w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

