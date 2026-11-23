import React from "react";

export const FlovaBillsAndUtilities: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto text-center">
        {/* Top Cartoon Illustration (FLOVA Design Specification) */}
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 360 260" className="w-80 sm:w-96 h-auto drop-shadow-xs">
            {/* Hanging top paper segment from above */}
            <path
              d="M152 0 L198 0 L198 48 L152 48 Z"
              fill="#cbebf7"
              opacity="0.7"
            />

            {/* Left Lilac Hand (curled around paper) */}
            <path
              d="M100 95 C80 95 62 118 62 150 C62 182 86 198 114 194 C134 190 144 170 142 148 C140 126 122 95 100 95 Z"
              fill="#bca7e8"
              stroke="#1f1435"
              strokeWidth="2.5"
            />
            {/* Left Hand Thumb grasping front */}
            <path
              d="M125 116 C144 116 150 134 142 150 C134 164 118 158 118 136 Z"
              fill="#cbbbf0"
              stroke="#1f1435"
              strokeWidth="2.5"
            />

            {/* Center Cascading Blue Receipt Paper */}
            <path
              d="M140 40 L195 40 L210 216 C210 224 202 230 194 230 L130 230 C122 230 116 224 116 216 Z"
              fill="#aee9f7"
              stroke="#1f1435"
              strokeWidth="2.5"
            />
            {/* Paper tear jagged bottom edge */}
            <path
              d="M116 218 L122 228 L130 218 L138 228 L146 218 L154 228 L162 218 L170 228 L178 218 L186 228 L194 218 L202 228 L210 218"
              fill="none"
              stroke="#1f1435"
              strokeWidth="2.5"
            />
            {/* Printed lines on receipt */}
            <line x1="140" y1="72" x2="182" y2="72" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="88" x2="182" y2="88" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="104" x2="182" y2="104" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="120" x2="182" y2="120" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="136" x2="182" y2="136" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="152" x2="182" y2="152" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="168" x2="182" y2="168" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="184" x2="182" y2="184" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="140" y1="200" x2="182" y2="200" stroke="#1f1435" strokeWidth="2.5" strokeLinecap="round" />

            {/* Right Peach Hand */}
            <path
              d="M228 95 C250 95 268 118 268 150 C268 182 244 198 216 194 C196 190 186 170 188 148 C190 126 206 95 228 95 Z"
              fill="#f9d7cf"
              stroke="#1f1435"
              strokeWidth="2.5"
            />
            {/* Right Hand Thumb grasping front */}
            <path
              d="M202 116 C184 116 178 134 186 150 C194 164 210 158 210 136 Z"
              fill="#fee5df"
              stroke="#1f1435"
              strokeWidth="2.5"
            />

            {/* Gold Coin 1 (Upper left, upright rim perspective) */}
            <ellipse cx="164" cy="126" rx="6" ry="22" fill="#d97706" stroke="#1f1435" strokeWidth="2.5" />
            <ellipse cx="163" cy="126" rx="5" ry="21" fill="#fbbf24" />

            {/* Gold Coin 2 (Lower right, larger upright rim perspective) */}
            <ellipse cx="194" cy="180" rx="11" ry="38" fill="#d97706" stroke="#1f1435" strokeWidth="2.5" />
            <ellipse cx="191" cy="180" rx="9" ry="36" fill="#fbbf24" />
            {/* Ridges on rim of Coin 2 */}
            <line x1="192" y1="162" x2="196" y2="162" stroke="#b45309" strokeWidth="2" />
            <line x1="192" y1="172" x2="196" y2="172" stroke="#b45309" strokeWidth="2" />
            <line x1="192" y1="182" x2="196" y2="182" stroke="#b45309" strokeWidth="2" />
            <line x1="192" y1="192" x2="196" y2="192" stroke="#b45309" strokeWidth="2" />
          </svg>
        </div>

        {/* Section Headline (FLOVA Design Specification) */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#23173d] tracking-tight mb-12">
          Convenience at your fingertips
        </h2>

        {/* Staggered 2-Row Capsule Pill Grid with FLOVA Geometric Accents (FLOVA Design Specification) */}
        <div className="space-y-4 max-w-5xl mx-auto overflow-x-auto pb-6">
          {/* Row 1 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-nowrap sm:flex-wrap">
            {/* Capsule 1: DTH */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ede7f6] text-[#5f259f] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">DTH</span>
            </div>

            {/* Geometric Accent Group 1: Teal circle, Lilac circle, Pink Double-Crescents */}
            <div className="flex items-center gap-1.5 px-1 shrink-0">
              <span className="w-6 h-6 rounded-full bg-[#4dd0e1]" />
              <span className="w-6 h-6 rounded-full bg-[#c5cae9]" />
              <div className="flex -space-x-1">
                <span className="w-4 h-6 rounded-r-full bg-[#f48fb1]" />
                <span className="w-4 h-6 rounded-r-full bg-[#f48fb1]" />
              </div>
            </div>

            {/* Capsule 2: Cable Television */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ffe0b2] text-[#e65100] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">Cable Television</span>
            </div>

            {/* Geometric Accent Group 2 */}
            <div className="flex items-center gap-1.5 px-1 shrink-0">
              <span className="w-6 h-6 rounded-full bg-[#c5cae9]" />
              <div className="flex -space-x-1">
                <span className="w-4 h-6 rounded-r-full bg-[#f48fb1]" />
                <span className="w-4 h-6 rounded-r-full bg-[#f48fb1]" />
              </div>
            </div>

            {/* Capsule 3: Mobile Recharge */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f5] text-[#424242] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">Mobile Recharge</span>
            </div>

            {/* Capsule 4: FASTag */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#fce4ec] text-[#d81b60] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.8 2 11 2 11.2V16c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">FASTag</span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-nowrap sm:flex-wrap">
            {/* Capsule 5: Book a Cylinder */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ffe0b2] text-[#e65100] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h8M10 2h4M9 6v14a3 3 0 0 0 6 0V6" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">Book a Cylinder</span>
            </div>

            {/* Capsule 6: Electricity */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#fce4ec] text-[#c2185b] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 3 2 5 2 7h10c0-2 2-4 2-7a7 7 0 0 0-7-7z" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">Electricity</span>
            </div>

            {/* Geometric Accent Group 3 */}
            <div className="flex items-center gap-1.5 px-1 shrink-0">
              <span className="w-6 h-6 rounded-full bg-[#c5cae9]" />
              <div className="flex -space-x-1">
                <span className="w-4 h-6 rounded-r-full bg-[#f48fb1]" />
                <span className="w-4 h-6 rounded-r-full bg-[#f48fb1]" />
              </div>
            </div>

            {/* Capsule 7: Piped Gas */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#e0f2f1] text-[#00695c] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2c1.5 2 3 4 3 6a3 3 0 0 1-6 0c0-2 1.5-4 3-6z" />
                  <path d="M3 13h18M5 13v8M19 13v8" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">Piped Gas</span>
            </div>

            {/* Capsule 8: Rent Payment */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ffe0b2] text-[#e65100] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">Rent Payment</span>
            </div>

            {/* Capsule 9: Water */}
            <div className="flova-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#e1f5fe] text-[#0288d1] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-[#23173d]">Water</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
