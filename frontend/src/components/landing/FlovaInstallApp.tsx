import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { promptInstall, useInstallState } from "../../pwa/installPrompt";

/** Google Play listing, set once the Android app is published (VITE_PLAY_STORE_URL). */
const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL as string | undefined)?.trim() || "";

export const FlovaInstallApp: React.FC = () => {
  const navigate = useNavigate();
  const state = useInstallState();
  const [note, setNote] = useState<string | null>(null);

  async function install() {
    const outcome = await promptInstall();
    if (outcome === "dismissed") setNote("No problem. You can install FLOVA any time from this page.");
    if (outcome === "unavailable") setNote("Use your browser menu and choose “Install app” or “Add to Home screen”.");
  }

  return (
    <section id="install" className="scroll-mt-24 py-16 sm:py-24 bg-white border-t border-[#E7E4DD]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#E8F3EF] text-[#0F5C4C] text-xs font-bold uppercase tracking-wider mb-4">
              Install the app
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#16181D] leading-tight">
              Keep FLOVA on your home screen
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#5D6B66] leading-relaxed">
              Open FLOVA in one tap like any other app. It installs from this website in seconds, works full screen,
              and uses the same secure account.
            </p>

            <div className="mt-7">
              {state === "installed" && (
                <button
                  onClick={() => navigate("/app")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0F5C4C] text-white font-bold text-base shadow-lg hover:bg-[#0c4d40] active:scale-95 transition"
                >
                  FLOVA is installed · Open FLOVA
                </button>
              )}

              {state === "prompt" && (
                <button
                  onClick={install}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#0F5C4C] text-white font-bold text-base shadow-lg hover:bg-[#0c4d40] active:scale-95 transition"
                >
                  <span aria-hidden>⬇</span> Install FLOVA
                </button>
              )}

              {state === "ios" && (
                <ol className="space-y-2 text-[15px] text-[#16181D]">
                  <li><b>1.</b> Open this page in <b>Safari</b>.</li>
                  <li><b>2.</b> Tap the <b>Share</b> button <span aria-hidden>⎋</span> at the bottom of the screen.</li>
                  <li><b>3.</b> Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
                </ol>
              )}

              {state === "manual" && (
                <ol className="space-y-2 text-[15px] text-[#16181D]">
                  <li><b>1.</b> Open this page in <b>Chrome</b> or <b>Edge</b> (Android or computer).</li>
                  <li><b>2.</b> Open the browser menu <span aria-hidden>⋮</span>.</li>
                  <li><b>3.</b> Choose <b>Install app</b> or <b>Add to Home screen</b>.</li>
                </ol>
              )}

              {note && <p className="mt-3 text-sm text-[#5D6B66]">{note}</p>}
            </div>

            <div className="mt-6 text-sm text-[#5D6B66]">
              {PLAY_STORE_URL ? (
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-semibold text-[#0F5C4C] underline underline-offset-4"
                >
                  Get the Android app on Google Play
                </a>
              ) : (
                <span>Android app on Google Play: coming soon.</span>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-56 sm:w-64 rounded-[2.25rem] border-[10px] border-[#16181D] bg-[#F6F7F4] shadow-2xl p-5 aspect-[9/18] flex flex-col items-center justify-center gap-4">
              <img src="/icon-512.png" alt="" width={96} height={96} className="w-24 h-24 rounded-3xl shadow-md" />
              <div className="text-center">
                <p className="text-xl font-black text-[#16181D]">FLOVA</p>
                <p className="text-xs text-[#5D6B66] mt-1">Every rupee has a story.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
