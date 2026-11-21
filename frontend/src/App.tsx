import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RedirectIfAuthed } from "./auth/RedirectIfAuthed";
import { RequireAuth } from "./auth/RequireAuth";
import { DataVersionProvider } from "./data/DataVersionProvider";
import { ActivityPage } from "./pages/ActivityPage";
import { AddTransactionPage } from "./pages/AddTransactionPage";
import { CheckinPage } from "./pages/CheckinPage";
import { CommitmentsPage } from "./pages/CommitmentsPage";
import { FlovaCatchPage } from "./pages/FlovaCatchPage";
import { HomeRunwayView } from "./pages/HomeRunwayView";
import { InsightsView } from "./pages/InsightsView";
import { MoneyOverviewPage } from "./pages/MoneyOverviewPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PayoutsPage } from "./pages/PayoutsPage";
import { ProfileSettingsView } from "./pages/ProfileSettingsView";
import { VoiceCapturePage } from "./pages/VoiceCapturePage";
import { WishPage } from "./wish/WishPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ProfileProvider } from "./profile/ProfileProvider";
import { RequireOnboarded } from "./profile/RequireOnboarded";
import { FlovaLandingPage } from "./components/landing/FlovaLandingPage";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ProfileProvider>
          <DataVersionProvider>
            <Routes>
              {/* Public FLOVA Indian-Context Landing Page */}
              <Route path="/" element={<FlovaLandingPage />} />

              {/* Authentication Routes */}
              <Route
                path="/login"
                element={
                  <RedirectIfAuthed>
                    <LoginPage />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/signup"
                element={
                  <RedirectIfAuthed>
                    <SignupPage />
                  </RedirectIfAuthed>
                }
              />

              {/* Onboarding — requires auth, pre-onboarding */}
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <OnboardingPage />
                  </RequireAuth>
                }
              />

              {/* Authenticated Application Dashboard */}
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <HomeRunwayView />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <HomeRunwayView />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/insights"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <InsightsView />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <ProfileSettingsView />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <ProfileSettingsView />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />

              {/* Phase 10: Activity & Money Overview */}
              <Route
                path="/overview"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <MoneyOverviewPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/activity"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <ActivityPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/history"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <ActivityPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />

              {/* Phase 8: FLOVA Catch */}
              <Route
                path="/catch"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <FlovaCatchPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />

              {/* Phase 9: Voice Transcription */}
              <Route
                path="/voice"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <VoiceCapturePage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />

              {/* WISH */}
              <Route
                path="/wish"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <WishPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />

              {/* Data Capture Routes */}
              <Route
                path="/checkin"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <CheckinPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/add"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <AddTransactionPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/payouts"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <PayoutsPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/commitments"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <CommitmentsPage />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />

              {/* Legacy route aliases */}
              <Route path="/plan" element={<Navigate to="/commitments" replace />} />
              <Route path="/transactions" element={<Navigate to="/history" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataVersionProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
