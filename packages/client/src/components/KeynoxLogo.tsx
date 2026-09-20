import React from "react";

interface KeynoxLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

export const KeynoxLogo: React.FC<KeynoxLogoProps> = ({
  size = 36,
  className = "",
  showGlow = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Ambient Glow behind the logo badge */}
      {showGlow && (
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-cyan-500/40 via-indigo-500/30 to-purple-500/30 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none -z-10" />
      )}

      {/* Glossy Badge Container */}
      <div className="w-full h-full rounded-xl bg-gradient-to-b from-[#16171d] to-[#0a0a0e] border border-white/[0.14] shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:border-white/25 group-hover:scale-105">
        {/* Specular glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-transparent pointer-events-none" />

        {/* Custom Keynox Monogram Emblem */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 relative z-10 drop-shadow-[0_2px_6px_rgba(99,102,241,0.4)]"
        >
          <defs>
            <linearGradient id="knx-spine" x1="5" y1="4" x2="11" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="0.6" stopColor="#6366F1" />
              <stop offset="1" stopColor="#818CF8" />
            </linearGradient>
            <linearGradient id="knx-upper" x1="12" y1="6" x2="26" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>
            <linearGradient id="knx-lower" x1="12" y1="16" x2="27" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#818CF8" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <radialGradient id="knx-spark" cx="50%" cy="50%" r="50%">
              <stop stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Left Vertical Spine / Presentation Pillar */}
          <rect x="5.5" y="4.5" width="4.5" height="23" rx="2.25" fill="url(#knx-spine)" />

          {/* Upper Projection Wing */}
          <path
            d="M12.5 17.5L22.8 6.8C23.6 6.0 25.0 6.0 25.8 6.8C26.6 7.6 26.6 9.0 25.8 9.8L16.8 19.0L12.5 17.5Z"
            fill="url(#knx-upper)"
          />

          {/* Lower Dynamic Base Wing */}
          <path
            d="M15.5 16.0L25.0 25.2C25.8 26.0 25.8 27.4 25.0 28.2C24.2 29.0 22.8 29.0 22.0 28.2L12.5 18.5L15.5 16.0Z"
            fill="url(#knx-lower)"
          />

          {/* Central Prismatic Core Node */}
          <circle cx="14" cy="17.2" r="2" fill="url(#knx-spark)" />
          <circle cx="14" cy="17.2" r="1" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  );
};
