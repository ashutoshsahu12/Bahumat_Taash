import React from 'react';
import { 
  Rocket, 
  TrainFront, 
  Plane, 
  Zap, 
  Wifi, 
  Receipt, 
  Coffee, 
  LockKeyhole, 
  Siren, 
  TrendingUp, 
  CircleHelp,
  Settings,
  Share,
  Volume2,
  VolumeX,
  Music,
  Maximize2,
  Minimize2,
  Camera,
  Trash2,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  X,
  User,
  Users,
  MessageSquare,
  Home,
  Building2,
  Coins
} from 'lucide-react';

export const BOARD_ICONS = {
  rocket: Rocket,
  "train-front": TrainFront,
  plane: Plane,
  zap: Zap,
  wifi: Wifi,
  receipt: Receipt,
  coffee: Coffee,
  "lock-keyhole": LockKeyhole,
  siren: Siren,
  "trending-up": TrendingUp,
  "circle-help": CircleHelp
};

export function LogoCrown({ className = "" }) {
  return (
    <svg className={`crown ${className}`} viewBox="0 0 64 44" aria-hidden="true">
      <defs>
        <linearGradient id="bb-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE98A" />
          <stop offset="1" stopColor="#F0A416" />
        </linearGradient>
      </defs>
      <path
        d="M7 33 4 12l14 10L32 4l14 18 14-10-3 21z"
        fill="url(#bb-crown)"
        stroke="#8A5200"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <rect
        x="6"
        y="33"
        width="52"
        height="8"
        rx="3"
        fill="url(#bb-crown)"
        stroke="#8A5200"
        strokeWidth="2.6"
      />
      <circle cx="4" cy="11" r="3.4" fill="#FF5568" stroke="#8A5200" strokeWidth="1.6" />
      <circle cx="32" cy="4.5" r="3.8" fill="#49A6FF" stroke="#8A5200" strokeWidth="1.6" />
      <circle cx="60" cy="11" r="3.4" fill="#34D27B" stroke="#8A5200" strokeWidth="1.6" />
      <circle cx="20" cy="37" r="1.9" fill="#FF5568" />
      <circle cx="32" cy="37" r="1.9" fill="#49A6FF" />
      <circle cx="44" cy="37" r="1.9" fill="#34D27B" />
    </svg>
  );
}

export function Logo({ className = "" }) {
  return (
    <div className={`logo ${className}`}>
      <LogoCrown />
      <span>Big</span>
      <span>Business</span>
    </div>
  );
}

export function HouseIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="w-3 h-3 inline-block">
      <path className="hm-body" d="M6 1 11.4 5.6H10V11H2V5.6H0.6z" fill="#34D27B" />
      <path d="M6 1 11.4 5.6H0.6z" fill="rgba(0,0,0,.3)" />
      <rect x="5" y="7.2" width="2" height="3.8" fill="#fff" />
    </svg>
  );
}

export function HotelIcon() {
  return (
    <svg viewBox="0 0 20 15" aria-hidden="true" className="w-4 h-3 inline-block">
      <path className="hm-body" d="M10 0.9 18.6 4.4H17V14H3V4.4H1.4z" fill="#FF5568" />
      <path d="M10 0.9 18.6 4.4H1.4z" fill="rgba(0,0,0,.3)" />
      <g fill="#fff">
        <rect x="5" y="6" width="2.2" height="2.2" />
        <rect x="8.9" y="6" width="2.2" height="2.2" />
        <rect x="12.8" y="6" width="2.2" height="2.2" />
        <rect x="5" y="9.8" width="2.2" height="2.2" />
        <rect x="12.8" y="9.8" width="2.2" height="2.2" />
        <rect x="8.7" y="9.8" width="2.6" height="4.2" />
      </g>
    </svg>
  );
}

export function PropertyMarker({ color = "#34D27B" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4">
      <path d="M12 2.6 22 11.4h-2.6V21H4.6v-9.6H2z" fill={color} stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M12 2.6 22 11.4H2z" fill="rgba(0,0,0,.28)" />
      <path d="M16.2 4.4h2.4v4l-2.4-2.1z" fill={color} stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
      <rect x="10" y="14.2" width="4" height="6.8" rx="0.8" fill="#fff" />
    </svg>
  );
}

export function RupeeSign({ className = "" }) {
  return <span className={`inline-block font-sans font-bold ${className}`}>₹</span>;
}

export {
  Settings,
  Share,
  Volume2,
  VolumeX,
  Music,
  Maximize2,
  Minimize2,
  Camera,
  Trash2,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  X,
  User,
  Users,
  MessageSquare,
  Home,
  Building2,
  Coins
};

