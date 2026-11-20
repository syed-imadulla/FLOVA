import React from "react";

interface OneRupeeCoinProps {
  className?: string;
  size?: number;
  rotation?: number;
  style?: React.CSSProperties;
}

export const OneRupeeCoin: React.FC<OneRupeeCoinProps> = ({
  className = "",
  size = 80,
  rotation = 0,
  style = {},
}) => {
  return (
    <div
      className={`one-rupee-coin-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
      aria-label="Indian 1 Rupee Coin"
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="one-rupee-svg"
      >
        <defs>
          {/* Radial brushed steel gradient */}
          <radialGradient id="coinSteelGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#E6E9EE" />
            <stop offset="55%" stopColor="#B4BAC4" />
            <stop offset="85%" stopColor="#7E8793" />
            <stop offset="100%" stopColor="#555D68" />
          </radialGradient>

          {/* Rim bevel shadow */}
          <linearGradient id="rimShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8A93A0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2A3038" stopOpacity="0.9" />
          </linearGradient>

          {/* Inner disc gradient */}
          <radialGradient id="innerDisc" cx="45%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#E9EDF2" />
            <stop offset="70%" stopColor="#C0C6CF" />
            <stop offset="100%" stopColor="#969EA9" />
          </radialGradient>

          {/* Specular highlight */}
          <linearGradient id="specularGleam" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Outer drop-shadow ring */}
        <circle cx="50" cy="50" r="48" fill="url(#coinSteelGrad)" stroke="url(#rimShadow)" strokeWidth="2.5" />

        {/* Milled beaded rim perimeter */}
        <circle cx="50" cy="50" r="45" stroke="#68727E" strokeWidth="0.8" strokeDasharray="1.2 2" fill="none" opacity="0.6" />

        {/* Inner concentric ring */}
        <circle cx="50" cy="50" r="42" fill="url(#innerDisc)" stroke="#535B66" strokeWidth="0.6" />

        {/* National inscription: "भारत INDIA" in clean arc */}
        <path id="textArcTop" d="M 20,48 A 32,32 0 0,1 80,48" fill="none" />
        <text fontSize="6" fontWeight="700" fill="#2E353F" letterSpacing="0.8">
          <textPath href="#textArcTop" startOffset="50%" textAnchor="middle">
            भारत INDIA
          </textPath>
        </text>

        {/* Centered Rupee Symbol and Numeral 1: ₹ 1 */}
        <g fill="#252C36" textAnchor="middle">
          {/* Indian Rupee Symbol ₹ */}
          <text x="50" y="44" fontSize="18" fontWeight="800" fontFamily="sans-serif">
            ₹
          </text>
          {/* Bold Numeral 1 */}
          <text x="50" y="66" fontSize="24" fontWeight="900" fontFamily="sans-serif">
            1
          </text>
        </g>

        {/* Flanking Wheat Stalks (Corn Ears) */}
        {/* Left stalk */}
        <g stroke="#373F4A" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M 28,68 C 26,60 26,50 30,42" />
          <ellipse cx="27" cy="58" rx="2" ry="3.5" transform="rotate(-25 27 58)" fill="#444C57" />
          <ellipse cx="26" cy="50" rx="2" ry="3.5" transform="rotate(-30 26 50)" fill="#444C57" />
          <ellipse cx="28" cy="43" rx="1.8" ry="3" transform="rotate(-20 28 43)" fill="#444C57" />
        </g>

        {/* Right stalk */}
        <g stroke="#373F4A" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M 72,68 C 74,60 74,50 70,42" />
          <ellipse cx="73" cy="58" rx="2" ry="3.5" transform="rotate(25 73 58)" fill="#444C57" />
          <ellipse cx="74" cy="50" rx="2" ry="3.5" transform="rotate(30 74 50)" fill="#444C57" />
          <ellipse cx="72" cy="43" rx="1.8" ry="3" transform="rotate(20 72 43)" fill="#444C57" />
        </g>

        {/* Bottom Year "2026" */}
        <text x="50" y="78" fontSize="6.5" fontWeight="700" fill="#3D4550" textAnchor="middle" letterSpacing="0.8">
          2026
        </text>

        {/* Diagonal specular glare sheen */}
        <circle cx="50" cy="50" r="48" fill="url(#specularGleam)" style={{ mixBlendMode: "overlay" }} pointerEvents="none" />
      </svg>
    </div>
  );
};
