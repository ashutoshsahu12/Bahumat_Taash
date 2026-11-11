import React from 'react';
import { Sparkles } from 'lucide-react';
import { UPDATES_DATA } from '../data/updatesData';
import { playSound } from '../audio/soundEngine';

export default function WhatsNewModal({ onClose }) {
  return (
    <div className="pop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pop-card">
        <span className="rib">What's new</span>

        <div className="news">
          {UPDATES_DATA.map((update) => (
            <section key={update.id}>
              <h4>
                <Sparkles className="lu w-4 h-4 text-amber-400" />
                {update.title}
              </h4>
              <ul>
                {update.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <button
          type="button"
          className="gbtn green big w-full mt-4"
          onClick={() => {
            playSound("click");
            onClose();
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

