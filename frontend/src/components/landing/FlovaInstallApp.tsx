import React from "react";
import { promptInstall, useInstallState } from "../../pwa/installPrompt";

/** Google Play listing, set once the Android app is published (VITE_PLAY_STORE_URL). */
const PLAY_STORE_URL = (import.meta.env.VITE_PLAY_STORE_URL as string | undefined)?.trim() || "";

export const FlovaInstallApp: React.FC = () => {
  const state = useInstallState();

  async function install() {
    await promptInstall();
  }

  return (
    <section id="install" className="scroll-mt-24 py-16 sm:py-24 bg-white border-t border-[#E7E4DD]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#E8F3EF] text-[#0F5C4C] text-xs font-bold uppercase tracking-wider mb-4">
              Get FLOVA for Android
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#16181D] leading-tight">
              Direct Download for Android
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#5D6B66] leading-relaxed">
              Experience the full voice-first financial companion natively on your smartphone.
              Includes high-accuracy voice logging, native receipt camera OCR, and offline security.
            </p>

            {/* Primary Action: Download for Android APK */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="/download/flova-latest.apk"
                  download="flova-latest.apk"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#0F5C4C] text-white font-bold text-base shadow-lg hover:bg-[#0c4d40] active:scale-95 transition-all text-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download for Android</span>
                </a>
              </div>

              {/* Version & File Size Badges */}
              <div className="flex items-center gap-3 text-xs text-[#5D6B66] font-medium">
                <span className="inline-flex items-center gap-1 bg-[#F2EFE9] px-2.5 py-1 rounded-md text-[#16181D] font-semibold">
                  v1.0 (Build 1)
                </span>
                <span>•</span>
                <span>APK Size: ~11 MB</span>
                <span>•</span>
                <span>Android 7.0+</span>
              </div>
            </div>

            {/* PWA / Alternative Install Option */}
            <div className="mt-8 pt-6 border-t border-[#E5E2DC]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#7A7468] mb-3">
                Other Ways to Install
              </p>
              {state === "prompt" && (
                <button
                  onClick={install}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F5C4C] hover:underline cursor-pointer"
                >
                  <span>🌐</span> Install Web App (PWA) instead
                </button>
              )}
              {state === "ios" && (
                <p className="text-xs text-[#5D6B66]">
                  iPhone user? Tap Share <span aria-hidden>⎋</span> and choose <b>Add to Home Screen</b>.
                </p>
              )}
              <div className="mt-2 text-xs text-[#5D6B66]">
                {PLAY_STORE_URL ? (
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#0F5C4C] underline underline-offset-4"
                  >
                    Get on Google Play Store
                  </a>
                ) : (
                  <span>Google Play Store listing: coming soon</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-56 sm:w-64 rounded-[2.25rem] border-[10px] border-[#16181D] bg-[#F6F7F4] shadow-2xl p-5 aspect-[9/18] flex flex-col items-center justify-center gap-4">
              <img src="/icon-512.png" alt="FLOVA App" width={96} height={96} className="w-24 h-24 rounded-3xl shadow-md" />
              <div className="text-center">
                <p className="text-xl font-black text-[#16181D]">FLOVA</p>
                <p className="text-xs text-[#5D6B66] mt-1">Native Android Companion</p>
                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Portrait Locked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
