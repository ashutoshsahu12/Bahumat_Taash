import React, { useState, useEffect } from 'react';
import { Info, Check, AlertTriangle, Sparkles } from 'lucide-react';

const listeners = new Set();
let toasts = [];
let nextId = 0;

export function showToast(text, tone = "info") {
  const id = ++nextId;
  toasts = [...toasts.slice(-2), { id, tone, text }];
  listeners.forEach((fn) => fn(toasts));
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((fn) => fn(toasts));
  }, 3200);
}

const TONE_ICONS = {
  error: AlertTriangle,
  good: Check,
  info: Info,
  gold: Sparkles
};

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return (
    <div className="toasts" aria-live="polite">
      {items.map((item) => {
        const Icon = TONE_ICONS[item.tone] || Info;
        return (
          <div key={item.id} className={`toast ${item.tone}`}>
            <Icon className="lu w-4 h-4" />
            <span>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
}

