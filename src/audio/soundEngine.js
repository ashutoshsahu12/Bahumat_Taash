// Authentic Big Business Web Audio API Synthesizer and Music Engine

let audioCtx = null;
let musicInterval = null;
let musicGain = null;
let nextNoteTime = 0;
let noteIndex = 0;

let soundMuted = false;
let musicMuted = false;

// Initialize preferences from localStorage
try {
  soundMuted = window.localStorage.getItem("bb:mute") === "true";
  musicMuted = window.localStorage.getItem("bb:music") === "false";
} catch (e) {}

function getContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

function playTone(freq, duration, type, gainVal, startTime = 0, rampFreq, dest) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const start = Math.max(ctx.currentTime, startTime);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (rampFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, rampFreq), start + duration);
    }

    gain.gain.setValueAtTime(gainVal, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(dest || ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.02);
  } catch (e) {}
}

function playSfx(freq, duration, type, gain, delay = 0, rampFreq) {
  if (soundMuted) return;
  const ctx = getContext();
  if (ctx) {
    playTone(freq, duration, type, gain, ctx.currentTime + delay, rampFreq);
  }
}

export const SOUNDS = {
  click: () => playSfx(520, 0.05, "square", 0.04),
  dice: () => {
    for (let e = 0; e < 9; e++) {
      playSfx(170 + 260 * Math.random(), 0.045, "square", 0.05, 0.1 * e);
    }
  },
  step: () => playSfx(620, 0.07, "triangle", 0.1, 0, 900),
  buy: () => {
    playSfx(988, 0.08, "square", 0.045);
    playSfx(1319, 0.42, "square", 0.045, 0.08);
    playSfx(1976, 0.36, "sine", 0.06, 0.1);
    playSfx(2637, 0.28, "sine", 0.035, 0.18);
    playSfx(330, 0.18, "triangle", 0.1);
  },
  build: () => {
    playSfx(240, 0.06, "square", 0.09);
    playSfx(240, 0.06, "square", 0.09, 0.13);
    playSfx(1047, 0.1, "triangle", 0.09, 0.28);
    playSfx(1568, 0.3, "sine", 0.08, 0.36);
  },
  income: () => {
    playSfx(1175, 0.07, "sine", 0.12);
    playSfx(1568, 0.07, "sine", 0.12, 0.07);
    playSfx(2093, 0.16, "sine", 0.1, 0.14);
  },
  pay: () => playSfx(330, 0.24, "sawtooth", 0.06, 0, 150),
  rent: () => {
    [1568, 1397, 1319, 1175, 1047].forEach((e, t) => playSfx(e, 0.09, "triangle", 0.09, 0.06 * t));
    playSfx(2093, 0.3, "sine", 0.07, 0.32);
  },
  loan: () => {
    playSfx(180, 0.06, "square", 0.08);
    playSfx(140, 0.06, "square", 0.08, 0.06);
    playSfx(2349, 0.5, "sine", 0.09, 0.13);
    playSfx(3136, 0.4, "sine", 0.05, 0.13);
  },
  salary: () => {
    [784, 988, 1175, 1568].forEach((e, t) => playSfx(e, 0.12, "square", 0.035, 0.07 * t));
    playSfx(2093, 0.35, "sine", 0.08, 0.3);
  },
  win: () => {
    for (let e = 0; e < 10; e++) playSfx(140 + (e % 2) * 20, 0.06, "square", 0.04, 0.07 * e);
    let start = 0.75;
    const notes = [
      [523, 0.15], [523, 0.15], [523, 0.15], [523, 0.45],
      [415, 0.45], [466, 0.45], [523, 0.3], [466, 0.15], [523, 1.1]
    ];
    for (let [note, dur] of notes) {
      playSfx(note, 0.95 * dur, "square", 0.05, start);
      playSfx(note / 2, 0.95 * dur, "triangle", 0.09, start);
      start += dur;
    }
    [1047, 1319, 1568, 2093].forEach((t, n) => playSfx(t, 0.6, "sine", 0.05, start - 1 + 0.08 * n));
  },
  lose: () => {
    [523, 494, 466, 440].forEach((e, t) => playSfx(e, t === 3 ? 0.9 : 0.32, "triangle", 0.1, 0.34 * t, t === 3 ? 400 : undefined));
  },
  chime: () => {
    playSfx(1319, 0.5, "sine", 0.1);
    playSfx(988, 0.7, "sine", 0.1, 0.25);
  },
  speeding: () => {
    playSfx(1800, 0.05, "square", 0.05);
    playSfx(1800, 0.05, "square", 0.05, 0.1);
    playSfx(1800, 0.05, "square", 0.05, 0.2);
    playSfx(220, 0.5, "sawtooth", 0.07, 0.32, 110);
  },
  start: () => {
    [392, 523, 659].forEach((e, t) => playSfx(e, 0.16, "square", 0.05, 0.13 * t));
    playSfx(784, 0.55, "square", 0.05, 0.39);
    playSfx(1047, 0.55, "triangle", 0.08, 0.39);
    playSfx(196, 0.8, "triangle", 0.12, 0.39);
  },
  card: () => playSfx(950, 0.14, "sine", 0.08, 0, 420),
  jail: () => playSfx(150, 0.45, "sawtooth", 0.08, 0, 70),
  bid: () => playSfx(1250, 0.05, "square", 0.04),
  turn: () => playSfx(440, 0.12, "triangle", 0.07),
  myTurn: () => {
    playSfx(523, 0.1, "triangle", 0.12);
    playSfx(659, 0.1, "triangle", 0.12, 0.1);
    playSfx(784, 0.2, "triangle", 0.12, 0.2);
  },
  paidOff: () => {
    [523, 659, 784, 1047].forEach((e, t) => playSfx(e, 0.16, "triangle", 0.12, 0.1 * t));
    playSfx(1319, 0.35, "sine", 0.1, 0.42);
  },
  tick: () => playSfx(1100, 0.035, "square", 0.07),
  timeout: () => {
    playSfx(300, 0.18, "square", 0.07);
    playSfx(220, 0.4, "square", 0.07, 0.2);
  },
  siren: () => {
    for (let e = 0; e < 6; e++) {
      playSfx(e % 2 ? 620 : 880, 0.24, "sawtooth", 0.045, 0.24 * e, e % 2 ? 880 : 620);
    }
  },
  out: () => {
    playSfx(392, 0.2, "sawtooth", 0.07);
    playSfx(294, 0.2, "sawtooth", 0.07, 0.2);
    playSfx(196, 0.5, "sawtooth", 0.07, 0.4);
  }
};

// Background Ambient Music Generator
const CHORDS = [
  [261.63, 329.63, 392],    // C Major
  [220, 261.63, 329.63],    // A Minor
  [174.61, 220, 261.63],    // F Major
  [196, 246.94, 293.66]     // G Major
];
const ARPEGGIO_PATTERN = [0, 1, 2, 1, 0, 2, 1, 2];

function scheduleMusic() {
  const ctx = getContext();
  if (!ctx || !musicGain || musicMuted) return;

  while (nextNoteTime < ctx.currentTime + 0.6) {
    const chord = CHORDS[Math.floor(noteIndex / ARPEGGIO_PATTERN.length) % CHORDS.length];
    const patternStep = noteIndex % ARPEGGIO_PATTERN.length;

    playTone(2 * chord[ARPEGGIO_PATTERN[patternStep]], 0.544, "triangle", 0.5, nextNoteTime, undefined, musicGain);
    if (patternStep === 0) {
      playTone(chord[0] / 2, 2.38, "sine", 0.9, nextNoteTime, undefined, musicGain);
    }
    nextNoteTime += 0.34;
    noteIndex++;
  }
}

export function startMusic() {
  if (musicMuted) return;
  const ctx = getContext();
  if (ctx && !musicInterval) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.045;
    musicGain.connect(ctx.destination);
    nextNoteTime = ctx.currentTime + 0.1;
    scheduleMusic();
    musicInterval = window.setInterval(scheduleMusic, 200);
  }
}

export function stopMusic() {
  if (musicInterval) {
    window.clearInterval(musicInterval);
    musicInterval = null;
  }
  if (musicGain) {
    musicGain.disconnect();
    musicGain = null;
  }
}

export function playSound(name) {
  if (SOUNDS[name]) {
    SOUNDS[name]();
  }
}

export function isSoundMuted() {
  return soundMuted;
}

export function setSoundMuted(muted) {
  soundMuted = muted;
  try {
    window.localStorage.setItem("bb:mute", String(muted));
  } catch (e) {}
}

export function isMusicMuted() {
  return musicMuted;
}

export function setMusicMuted(muted) {
  musicMuted = muted;
  try {
    window.localStorage.setItem("bb:music", String(!muted));
  } catch (e) {}
  if (muted) {
    stopMusic();
  } else {
    startMusic();
  }
}

