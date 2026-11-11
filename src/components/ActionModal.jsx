import React, { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleHelp,
  Coins,
  Gavel,
  Landmark,
  Sparkles,
  X
} from "lucide-react";
import { formatRupee } from "../data/constants";

const ACTION_STYLES = {
  purchase: {
    Icon: Building2,
    tone: "border-emerald-400/50 text-emerald-300 bg-emerald-400/15",
    label: "Property acquired"
  },
  rent: {
    Icon: Coins,
    tone: "border-rose-400/50 text-rose-300 bg-rose-400/15",
    label: "Rent payment"
  },
  tax: {
    Icon: Landmark,
    tone: "border-orange-400/50 text-orange-300 bg-orange-400/15",
    label: "Tax payment"
  },
  chance: {
    Icon: CircleHelp,
    tone: "border-amber-400/50 text-amber-300 bg-amber-400/15",
    label: "Chance"
  },
  market: {
    Icon: Sparkles,
    tone: "border-sky-400/50 text-sky-300 bg-sky-400/15",
    label: "Market"
  },
  jail: {
    Icon: Gavel,
    tone: "border-red-400/50 text-red-300 bg-red-400/15",
    label: "Jail"
  },
  salary: {
    Icon: Coins,
    tone: "border-yellow-400/50 text-yellow-300 bg-yellow-400/15",
    label: "Launch bonus"
  },
  build: {
    Icon: Building2,
    tone: "border-purple-400/50 text-purple-300 bg-purple-400/15",
    label: "Construction"
  },
  bankruptcy: {
    Icon: AlertTriangle,
    tone: "border-red-400/50 text-red-300 bg-red-400/15",
    label: "Bankruptcy"
  },
  default: {
    Icon: CheckCircle2,
    tone: "border-purple-400/50 text-purple-300 bg-purple-400/15",
    label: "Game update"
  }
};

export default function ActionModal({ notice, onDismiss }) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!notice?.autoDismissMs) return undefined;
    const timer = window.setTimeout(() => onDismissRef.current(), notice.autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [notice?.id, notice?.autoDismissMs]);

  if (!notice) return null;

  const { Icon, tone, label } = ACTION_STYLES[notice.type] || ACTION_STYLES.default;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#1b0d38] p-5 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${tone}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-300">
                {label}
              </p>
              <h2 id="action-modal-title" className="truncate text-lg font-extrabold">
                {notice.title || label}
              </h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close notification"
            className="rounded-full p-1.5 text-purple-300 hover:bg-white/10 hover:text-white"
            onClick={onDismiss}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-purple-100">{notice.message}</p>

        {notice.space && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">{notice.space.name}</span>
              {notice.amount !== undefined && (
                <span className="font-mono font-extrabold text-amber-300">
                  {formatRupee(Math.abs(notice.amount))}
                </span>
              )}
            </div>
            {notice.subtitle && (
              <p className="mt-1 text-xs text-purple-300">{notice.subtitle}</p>
            )}
          </div>
        )}

        {notice.card && (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
            <p className="font-bold text-amber-200">{notice.card.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-purple-200">{notice.card.desc}</p>
          </div>
        )}

        <button type="button" className="gbtn green mt-5 w-full" onClick={onDismiss}>
          {notice.isBot ? "Continuing…" : "OK / Continue"}
        </button>
      </section>
    </div>
  );
}
