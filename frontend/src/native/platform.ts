import { Capacitor } from "@capacitor/core";

/** True inside the installed Android app (Capacitor), false on the website. */
export const IS_NATIVE_APP = Capacitor.isNativePlatform();

/**
 * Where "/" leads. The marketing landing page is website-only; the app starts at login
 * (RedirectIfAuthed then sends signed-in users straight to /app).
 */
export const APP_START_PATH = "/login";
