import React, { useState, useRef } from "react";
import { Camera, Trash2 } from "lucide-react";
import PieceToken from "./PieceToken";
import { TOKEN_KINDS, TOKEN_NAMES } from "../data/constants";
import { playSound } from "../audio/soundEngine";
import { showToast } from "./Toaster";

export default function AvatarCustomizerModal({
  name = "",
  initialPhoto = null,
  initialToken = "pawn",
  onSave,
  onClose
}) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [selectedToken, setSelectedToken] = useState(initialToken);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Pick a picture: a JPG, PNG or HEIC photo.", "error");
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const side = 96;
          const canvas = document.createElement("canvas");
          canvas.width = side;
          canvas.height = side;
          const ctx = canvas.getContext("2d");
          const minSide = Math.min(img.naturalWidth, img.naturalHeight);
          ctx.drawImage(
            img,
            (img.naturalWidth - minSide) / 2,
            (img.naturalHeight - minSide) / 2,
            minSide,
            minSide,
            0,
            0,
            side,
            side
          );
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setPhoto(dataUrl);
          playSound("income");
        } catch (err) {
          showToast("Could not process picture.", "error");
        } finally {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      img.onerror = () => {
        showToast("That file could not be opened as a picture.", "error");
        setIsProcessing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    playSound("click");
    onSave(photo, selectedToken);
    onClose();
  };

  const initialLetter = (name.trim()[0] || "?").toUpperCase();

  return (
    <div className="pop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop-card">
        <h3 className="pop-title">Your look</h3>

        <div className="lookface">
          <span className={`av lg ${photo ? "ph" : ""}`} style={{ "--c": "#FFC83D", "--ci": "#2A1B4D" }}>
            {photo ? <img src={photo} alt="" draggable={false} /> : initialLetter}
          </span>

          <div className="btns">
            <button
              type="button"
              className="gbtn sm blue"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="lu w-4 h-4" />
              {isProcessing ? "Loading…" : photo ? "Change photo" : "Add photo"}
            </button>
            {photo && (
              <button
                type="button"
                className="gbtn sm"
                onClick={() => {
                  playSound("click");
                  setPhoto(null);
                }}
              >
                <Trash2 className="lu w-4 h-4" />
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoUpload}
          />
        </div>

        <span className="small">Your piece on the board</span>

        <div className="pieces" role="radiogroup" aria-label="Your piece">
          {TOKEN_KINDS.map((kind) => {
            const isSelected = selectedToken === kind;
            return (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`piece ${isSelected ? "on" : ""}`}
                onClick={() => {
                  playSound("click");
                  setSelectedToken(kind);
                }}
              >
                <PieceToken color="#FFC83D" label={initialLetter} kind={kind} />
                <span>{TOKEN_NAMES[kind]}</span>
              </button>
            );
          })}
        </div>

        <p className="small center">
          Everyone at the table sees your photo. Colours are dealt when the match starts.
        </p>

        <div className="btns">
          <button
            type="button"
            className="gbtn red"
            onClick={() => {
              playSound("click");
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="gbtn green"
            disabled={isProcessing}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

