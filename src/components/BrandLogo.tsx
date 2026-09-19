import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showSubtitle = false,
}) => {
  const sizeClasses = {
    sm: "text-xl tracking-[0.25em]",
    md: "text-3xl tracking-[0.3em]",
    lg: "text-5xl tracking-[0.35em]",
    xl: "text-7xl tracking-[0.4em]",
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 44,
    xl: 60,
  };

  const currIconSize = iconSizes[size];

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center gap-3">
        {/* Geometric Minimalist Orbit Icon */}
        <div className="relative flex items-center justify-center">
          <svg
            width={currIconSize}
            height={currIconSize}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-700 hover:rotate-45"
          >
            {/* Outer dotted orbit */}
            <circle
              cx="24"
              cy="24"
              r="21"
              stroke="#8AB4F8"
              strokeWidth="1.2"
              strokeDasharray="3 4"
              opacity="0.4"
            />
            {/* Inner orbit */}
            <circle
              cx="24"
              cy="24"
              r="13"
              stroke="#E2E8F0"
              strokeWidth="1.5"
              opacity="0.6"
            />
            {/* Central core star */}
            <circle
              cx="24"
              cy="24"
              r="4.5"
              fill="#FDD663"
              className="drop-shadow-[0_0_8px_rgba(253,214,99,0.8)]"
            />
            {/* Orbiting geometric scout/troop triangle */}
            <polygon
              points="37,22 41,24 37,26"
              fill="#81C995"
            />
          </svg>
        </div>

        {/* Minimalist Typographic SSS */}
        <div className="flex items-baseline">
          <span
            className={`font-black ${sizeClasses[size]} font-mono text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-sky-200 to-indigo-300 drop-shadow-[0_0_12px_rgba(138,180,248,0.25)]`}
          >
            SSS
          </span>
          <span className="text-xs uppercase font-mono tracking-widest text-sky-400/80 ml-1.5 font-bold">
            YSTEM
          </span>
        </div>
      </div>

      {showSubtitle && (
        <p className="mt-2 text-xs font-mono tracking-[0.25em] uppercase text-slate-400/70 text-center">
          Super Space System • Macro-Gestão Espacial
        </p>
      )}
    </div>
  );
};
