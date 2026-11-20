import React from "react";

export const PhonePeConvenienceBills: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto text-center">
        {/* Top Cartoon Illustration: Two hands holding rolling receipt + 2 gold coins */}
        <div className="flex justify-center mb-6">
          <svg viewBox="0 0 320 220" className="w-72 sm:w-80 h-auto">
            {/* Top hanging receipt segment */}
            <rect x="148" y="0" width="48" height="40" fill="#cbebf7" opacity="0.6" />

            {/* Lilac Left Hand */}
            <path
              d="M110 90 C90 90 70 115 70 145 C70 175 95 190 120 185 C140 180 150 160 148 140 C146 120 130 90 110 90 Z"
              fill="#bca7e8"
            />
            {/* Thumb grabbing receipt */}
            <path
              d="M130 110 C145 110 152 125 145 140 C138 155 125 150 125 130 Z"
              fill="#d1c4e9"
              stroke="#2e1b4d"
              strokeWidth="2"
            />

            {/* Warm Peach Right Hand */}
            <path
              d="M210 90 C230 90 250 115 250 145 C250 175 225 190 200 185 C180 180 170 160 172 140 C174 120 190 90 210 90 Z"
              fill="#f8bbd0"
            />
            {/* Thumb grabbing receipt */}
            <path
              d="M190 110 C175 110 168 125 175 140 C182 155 195 150 195 130 Z"
              fill="#ffcdd2"
              stroke="#2e1b4d"
              strokeWidth="2"
            />

            {/* Center Rolling Blue Receipt */}
            <path
              d="M140 40 L180 40 L185 190 C185 195 180 200 175 200 L145 200 C140 200 135 195 135 190 Z"
              fill="#b3e5fc"
              stroke="#2e1b4d"
              strokeWidth="2.5"
            />
            {/* Receipt Zigzag Bottom Tear */}
            <path
              d="M135 190 L140 198 L146 190 L152 198 L158 190 L164 198 L170 190 L176 198 L182 190 L185 198"
              fill="none"
              stroke="#2e1b4d"
              strokeWidth="2.5"
            />
            {/* Printed Lines on Receipt */}
            <line x1="145" y1="65" x2="175" y2="65" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="80" x2="175" y2="80" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="95" x2="175" y2="95" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="110" x2="175" y2="110" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="125" x2="175" y2="125" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="140" x2="175" y2="140" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="155" x2="175" y2="155" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="170" x2="175" y2="170" stroke="#2e1b4d" strokeWidth="2" strokeLinecap="round" />

            {/* Edge-On Coin 1 (Left of receipt) */}
            <ellipse cx="148" cy="118" rx="5" ry="18" fill="#e65100" stroke="#2e1b4d" strokeWidth="2" />
            <ellipse cx="147" cy="118" rx="4" ry="17" fill="#ffb74d" />

            {/* Edge-On Coin 2 (Right of receipt, larger) */}
            <ellipse cx="184" cy="155" rx="9" ry="34" fill="#e65100" stroke="#2e1b4d" strokeWidth="2" />
            <ellipse cx="182" cy="155" rx="7" ry="32" fill="#ffb74d" />
            {/* Coin Rim ridges */}
            <line x1="183" y1="140" x2="187" y2="140" stroke="#bf360c" strokeWidth="1.5" />
            <line x1="183" y1="150" x2="187" y2="150" stroke="#bf360c" strokeWidth="1.5" />
            <line x1="183" y1="160" x2="187" y2="160" stroke="#bf360c" strokeWidth="1.5" />
            <line x1="183" y1="170" x2="187" y2="170" stroke="#bf360c" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Section Headline */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#23173d] tracking-tight mb-12">
          Convenience at your fingertips
        </h2>

        {/* Staggered 2-Row Capsule Pill Grid with PhonePe Geometric Accents */}
        <div className="space-y-4 max-w-5xl mx-auto overflow-x-auto pb-4">
          {/* Row 1 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-nowrap sm:flex-wrap">
            {/* Capsule 1: DTH */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ede7f6] text-[#5f259f] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" />
                </svg>
              </div>
              <span>DTH</span>
            </div>

            {/* Geometric Dot Group 1 */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="w-6 h-6 rounded-full bg-[#4dd0e1]" />
              <span className="w-6 h-6 rounded-full bg-[#b39ddb]" />
              <span className="w-6 h-6 rounded-r-full bg-[#f48fb1]" />
              <span className="w-6 h-6 rounded-r-full bg-[#f06292]" />
            </div>

            {/* Capsule 2: Cable Television */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ffe0b2] text-[#e65100] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                  <polyline points="17 2 12 7 7 2" />
                </svg>
              </div>
              <span>Cable Television</span>
            </div>

            {/* Geometric Dot Group 2 */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="w-6 h-6 rounded-full bg-[#b39ddb]" />
              <span className="w-6 h-6 rounded-r-full bg-[#f48fb1]" />
              <span className="w-6 h-6 rounded-r-full bg-[#f06292]" />
            </div>

            {/* Capsule 3: Mobile Recharge */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f5] text-slate-800 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <span>Mobile Recharge</span>
            </div>

            {/* Capsule 4: FASTag */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#fce4ec] text-[#d81b60] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <span>FASTag</span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-nowrap sm:flex-wrap">
            {/* Capsule 5: Book a Cylinder */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ffe0b2] text-[#e65100] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 10h12v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" />
                  <path d="M10 6h4v4h-4z" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                </svg>
              </div>
              <span>Book a Cylinder</span>
            </div>

            {/* Capsule 6: Electricity */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#fce4ec] text-[#d81b60] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                </svg>
              </div>
              <span>Electricity</span>
            </div>

            {/* Geometric Dot Group 3 */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="w-6 h-6 rounded-full bg-[#b39ddb]" />
              <span className="w-6 h-6 rounded-r-full bg-[#f48fb1]" />
              <span className="w-6 h-6 rounded-r-full bg-[#f06292]" />
            </div>

            {/* Capsule 7: Piped Gas */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ede7f6] text-[#5f259f] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2c2 4 4 6 4 9a4 4 0 0 1-8 0c0-3 2-5 4-9z" />
                  <path d="M4 22h16" />
                  <path d="M12 15v7" />
                </svg>
              </div>
              <span>Piped Gas</span>
            </div>

            {/* Capsule 8: Rent Payment */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#ffe0b2] text-[#e65100] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span>Rent Payment</span>
            </div>

            {/* Geometric Dot Group 4 */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="w-6 h-6 rounded-full bg-[#b39ddb]" />
              <span className="w-6 h-6 rounded-full bg-[#4dd0e1]" />
            </div>

            {/* Capsule 9: Water */}
            <div className="phonepe-capsule-pill">
              <div className="w-10 h-10 rounded-full bg-[#e1f5fe] text-[#0288d1] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span>Water</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
