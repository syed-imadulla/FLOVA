/** Screens where Android "back" with no in-app history should close the app. */
export const EXIT_PATHS = new Set(["/", "/app", "/login", "/onboarding"]);

/** What the Android back button should do on a given screen. */
export function backAction(pathname: string, canGoBack: boolean): "history" | "exit" | "home" {
  if (canGoBack) return "history";
  return EXIT_PATHS.has(pathname) ? "exit" : "home";
}
