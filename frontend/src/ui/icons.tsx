// Inline stroke icons (24px grid, currentColor) so the app has no icon font to load or flash.
import React from "react";

type IconProps = { size?: number; className?: string; strokeWidth?: number };

function make(paths: React.ReactNode) {
  return function Icon({ size = 22, className, strokeWidth = 2 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths}
      </svg>
    );
  };
}

export const IconHome = make(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>);
export const IconActivity = make(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>);
export const IconMic = make(<><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" /></>);
export const IconInsights = make(<><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 4.5a3 3 0 0 1 0 6M18 14.5a6 6 0 0 1 3 5.5" /></>);
export const IconChart = make(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>);
export const IconMore = make(<><path d="M4 7h16M4 12h16M4 17h16" /></>);
export const IconCamera = make(<><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></>);
export const IconPencil = make(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconBack = make(<path d="M15 5 8 12l7 7" />);
export const IconChevronRight = make(<path d="m9 5 7 7-7 7" />);
export const IconClose = make(<path d="M6 6l12 12M18 6 6 18" />);
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7" />);
export const IconCheckCircle = make(<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></>);
export const IconWallet = make(<><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7Z" /><path d="M4 7V6a2 2 0 0 1 2-2h10v3" /><circle cx="16" cy="13.5" r="1.2" /></>);
export const IconBank = make(<><path d="M3 9.5 12 4l9 5.5H3Z" /><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" /></>);
export const IconLayers = make(<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>);
export const IconAlert = make(<><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4.5M12 17.5v.01" /></>);
export const IconInfo = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.01" /></>);
export const IconCalendar = make(<><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);
export const IconArrowUp = make(<path d="M12 19V5M6 11l6-6 6 6" />);
export const IconArrowDown = make(<path d="M12 5v14M6 13l6 6 6-6" />);
export const IconKeyboard = make(<><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7 14h10" /></>);
export const IconImage = make(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-9 9" /></>);
export const IconTarget = make(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>);
export const IconBulb = make(<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2.2h5c.1-1 .5-1.7 1.1-2.2A6 6 0 0 0 12 3Z" /></>);
export const IconPiggy = make(<><path d="M5 11a7 6 0 0 1 12.5-3.5L20 7l-.6 3.4A6 6 0 0 1 19 15l-1 1v3h-3v-1.5h-4V19H8v-2.5A6.5 6 0 0 1 5 11Z" /><path d="M15 10.5h.01" /></>);
export const IconReceipt = make(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>);
export const IconClock = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const IconUser = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const IconLogout = make(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4M6 12h10" /></>);
export const IconShield = make(<><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>);
export const IconTrash = make(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>);
export const IconStop = make(<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />);
export const IconSparkle = make(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.5 6.5 2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2" /></>);
export const IconRefresh = make(<><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></>);
