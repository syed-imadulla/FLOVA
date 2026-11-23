// On-screen keyboard detection for the Android app and mobile browsers.
// Android resizes the window when the keyboard opens, so a bar fixed to the bottom of the
// window would ride up on top of the keyboard. Detect the keyboard by the visible height
// dropping well below the tallest height seen at the current width.
import { useEffect, useState } from "react";

/** Height loss that means "keyboard", not a browser toolbar collapsing (~56–80 px). */
export const KEYBOARD_MIN_PX = 150;

export function isKeyboardOpen(baselineHeight: number, currentHeight: number): boolean {
  return baselineHeight - currentHeight > KEYBOARD_MIN_PX;
}

export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    const height = () => (vv ? vv.height : window.innerHeight);
    let width = window.innerWidth;
    let baseline = height();

    const update = () => {
      if (window.innerWidth !== width) {
        // Rotation or window resize: start over at the new width.
        width = window.innerWidth;
        baseline = height();
      }
      const h = height();
      if (h > baseline) baseline = h;
      setOpen(isKeyboardOpen(baseline, h));
    };

    const target: EventTarget = vv ?? window;
    target.addEventListener("resize", update);
    return () => target.removeEventListener("resize", update);
  }, []);

  return open;
}
