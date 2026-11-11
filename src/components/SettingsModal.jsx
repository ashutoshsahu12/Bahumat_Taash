import React, { useState, useEffect, useRef } from 'react';
import { Settings, Maximize2, Minimize2, Volume2, VolumeX, Music, Share } from 'lucide-react';
import { 
  playSound, 
  isSoundMuted, 
  setSoundMuted, 
  isMusicMuted, 
  setMusicMuted 
} from '../audio/soundEngine';
import { showToast } from './Toaster';

export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [soundOff, setSoundOff] = useState(isSoundMuted());
  const [musicOn, setMusicOn] = useState(!isMusicMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
    const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(!isStandalone && iOSDevice);

    const checkFs = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", checkFs);
    document.addEventListener("webkitfullscreenchange", checkFs);
    return () => {
      document.removeEventListener("fullscreenchange", checkFs);
      document.removeEventListener("webkitfullscreenchange", checkFs);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [open]);

  const toggleFullscreen = () => {
    if (isIOS) {
      setShowIOSHint(!showIOSHint);
      return;
    }
    playSound("click");
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => showToast("Full screen is not available here.", "error"));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
    setOpen(false);
  };

  const toggleSound = () => {
    const next = !soundOff;
    setSoundOff(next);
    setSoundMuted(next);
    if (!next) {
      playSound("income");
    }
  };

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicMuted(!next);
    playSound("click");
  };

  return (
    <div className="setwrap" ref={menuRef}>
      <button
        type="button"
        className={`ib ${open ? "on" : ""}`}
        aria-label="Settings: full screen, sound and music"
        aria-expanded={open}
        onClick={() => {
          playSound("click");
          setOpen(!open);
          setShowIOSHint(false);
        }}
      >
        <Settings className="lucide lucide-settings lu" />
      </button>

      {open && (
        <div className="setmenu" role="menu">
          <button type="button" role="menuitem" className="setrow" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="lu" /> : <Maximize2 className="lu" />}
            <span>{isFullscreen ? "Leave full screen" : "Full screen"}</span>
          </button>

          {isIOS && showIOSHint && (
            <p className="sethint">
              iPhone browsers cannot go full screen. In Safari, tap <Share className="lu inline" aria-label="Share" /> and then <b>Add to Home Screen</b>. Opened from there, the game fills the whole screen.
            </p>
          )}

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={!soundOff}
            className="setrow"
            onClick={toggleSound}
          >
            {soundOff ? <VolumeX className="lu" /> : <Volume2 className="lu" />}
            <span>Sound effects</span>
            <i className={`sw ${!soundOff ? "on" : ""}`} />
          </button>

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={musicOn}
            className="setrow"
            onClick={toggleMusic}
          >
            <Music className="lu" />
            <span>Music</span>
            <i className={`sw ${musicOn ? "on" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}

