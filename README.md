# Big Business - Full-Stack Functional Web Application

An exact, full-stack, responsive replication of **Big Business** (`https://business.aixellabs.in/`), a private-room property trading board game built for mobile, tablet, and desktop browsers.

---

## 🌟 Overview & Key Features

### 1. Authentic Visual Design & Color Palette
- **Primary Color Theme**: Royal Navy & Indigo (`#120A2E`, `#2A1569`, `#1E133D`), Gold Accents (`#FFC83D`, `#F0A416`), Emerald (`#34D27B`), Coral (`#FF5568`), and Cream (`#FFF6E3`).
- **Stylized Crown Logo**: Authentic multi-colored jewel crown SVG with gradient stops and 3D typography.
- **Responsive Layout**: Fluid CSS Grid and `--u` unit scaling that seamlessly adapts from compact mobile viewports to ultrawide desktop screens.

### 2. Player Customization ("Your Look")
- **Custom Player Tokens (8 Pieces)**:
  - Pawn, Crown, Rocket, Auto-rickshaw, Gem, Star, Kite, and Chai (tea cup).
- **Photo Upload & Profile**: Upload any avatar image with automatic canvas resizing to 96×96 JPEG, or display initial letters with dynamic player colors.

### 3. Room Management & Waiting Lobby
- **Create Room**:
  - Configurable seats (2 to 6 players).
  - Match length settings (30 min, 45 min, 1 hour, or No limit).
  - Missed turn limit (2, 3, or 5 turns).
- **Join Room**: Upper-cased 6-character room codes (e.g. `ABC123`).
- **Waiting Lobby**:
  - One-click copy and native OS share invite.
  - Interactive player slots with host badge, ready indicators, and **"Add Bot"** capability to immediately test or play solo against intelligent AI opponents.

### 4. Interactive 48-Tile Pune / PCMC Game Board
- **48 Spaces**:
  - **Corners**: Launch (`+₹100` salary growth every lap), Jail (with visiting walkway), Take a Break, and Go to Jail.
  - **Pune & PCMC Neighborhoods**: Mulshi, Kamshet, Dehu, Alandi, Jejuri, Lavasa, Khandala, Lonavala, Akurdi, Nigdi, Pimpri, Ravet, Saudagar, Wakad, Katraj, Warje, Wagholi, Pashan, Kharadi, Kothrud, Aundh, Viman, Baner, Camp, Deccan, Kalyani, Boat Club, Koregaon Park.
  - **Toll Stations**: Pune Stn, Pimpri Stn, Swargate, Lohegaon Airport.
  - **Utilities**: Power Company, Telecom Network.
  - **Special Spaces**: Income Tax (10%), Luxury Tax (20%), Chance Cards, and Market Speculation.
- **Village Sets**: Brown, Sky, and Pink sets are village sets capable of hosting a **Village Festival for 3× Rent**!
- **Center Board Sky & Stars**: Silhouetted Pune landmarks on all 4 board edges, drifting stars, and animated shooting stars.

### 5. Web Audio API Sound Synthesizer & Music
- Zero external MP3 asset dependency: utilizes an embedded Web Audio synthesizer for all 24 sound effects:
  - Rolling dice, piece steps, property purchase fanfare, building hammer, cash chime, rent payments, loans, salary payday chime, victory celebration, and police siren.
  - Looping ambient chiptune board music with triangle/sine chords (`C Maj`, `A Min`, `F Maj`, `G Maj`).
  - Settings dropdown to independently toggle sound effects and background music.

### 6. In-Game Interactivity & Modals
- **3D Animated Dice**: CSS 3D cube rolling animation with doubles detection and 5% cash bonus.
- **Property Deed Card Modal**: Click any tile to inspect purchase price, rent tiers, house costs, and mortgage terms.
- **Market Speculation Minigame**: Stake cash on a 2-dice roll (2–5: lose, 6–8: flat, 9–12: double stake!).
- **Chance Cards**: Animated card flips with cash refunds, assessment taxes, and Get Out of Jail Free cards.
- **Trade Interface**: Propose cash & property trades with other players or AI bots.
- **Slide-up Table Chat**: Global table chat and 1-on-1 private player direct messages with quick chat pills (*"Deal?"*, *"Good roll!"*, *"GG"*).
- **Activity Ticker**: Live real-time log of match actions, rolls, and rent transactions.
- **Game Over Modal**: Net worth calculation and podium leaderboard.

---

## 📁 Project Architecture & Directory Structure

```
├── public/
│   └── business/
│       ├── apple-touch-icon.png
│       ├── icon-192.png
│       └── manifest.webmanifest
├── src/
│   ├── audio/
│   │   └── soundEngine.js          # Web Audio API sound generator & music loop
│   ├── components/
│   │   ├── ActivityTicker.jsx      # Live event history ticker
│   │   ├── AvatarCustomizerModal.jsx # Avatar photo & piece selector
│   │   ├── ChanceCardModal.jsx     # Chance cards dialog
│   │   ├── ChatDrawer.jsx          # Slide-up table chat with quick pills & DMs
│   │   ├── Dice3D.jsx              # 3D tumbling CSS dice cube
│   │   ├── GameBoard.jsx           # 48-tile property board with animated tokens
│   │   ├── GameOverModal.jsx       # Match end podium leaderboard
│   │   ├── HeaderHUD.jsx           # Top HUD with room info, timer, & settings
│   │   ├── Icons.jsx               # SVG icons, crowns, houses, & hotels
│   │   ├── Lobby.jsx               # Waiting room with player cards & bot filler
│   │   ├── MarketModal.jsx         # Market speculation minigame
│   │   ├── PieceToken.jsx          # Custom SVG tokens (Pawn, Crown, Rocket, etc.)
│   │   ├── PropertyCardModal.jsx   # Interactive property title deed popup
│   │   ├── RoomSetup.jsx           # Landing screen (Create & Join room panels)
│   │   ├── SettingsModal.jsx       # Fullscreen, sound effects & music toggles
│   │   ├── Tile.jsx                # Responsive board tile component
│   │   ├── Toaster.jsx             # In-game toast notification banner
│   │   ├── TurnDock.jsx            # Action toolbar (Roll, Buy, Trade, End Turn)
│   │   └── WhatsNewModal.jsx       # Release changelog modal
│   ├── data/
│   │   ├── boardData.js            # 48 board tiles, coordinates & grid mapping
│   │   ├── chanceDeck.js           # Chance card deck definitions
│   │   ├── constants.js            # Rule limits, color sets, & rupee formatting
│   │   ├── tipsData.js             # Rotating strategy tips
│   │   └── updatesData.js          # 10 release updates history
│   ├── hooks/
│   │   └── useGameState.js         # Core game state & AI bot automation hook
│   ├── styles/
│   │   ├── business.css            # Authentic 92KB Big Business styles & keyframes
│   │   └── index.css               # Tailwind & root resets
│   ├── App.jsx                     # Root application container & modal router
│   └── main.jsx                    # React entry point
├── server.js                       # Full-stack Node.js WebSocket & Express server
├── index.html                      # HTML5 template with viewport & PWA meta tags
├── package.json                    # Project dependencies & npm scripts
├── tailwind.config.js              # Tailwind CSS configuration
└── vite.config.js                  # Vite bundler configuration
```

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)

### Installation
Dependencies are already installed. If needed, install dependencies with:
```bash
npm install
```

### 1. Development Mode (Frontend with simulated multiplayer & AI bots)
Run Vite dev server:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 2. Full-Stack Production Mode (Express + WebSocket Server)
To build and start the full-stack server on port 8080:
```bash
npm run build
npm start
```
Open `http://localhost:8080`.

