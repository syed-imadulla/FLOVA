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
import { HomePlaceholder } from "./pages/HomePlaceholder";
import { MoneyOverviewPage } from "./pages/MoneyOverviewPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PayoutsPage } from "./pages/PayoutsPage";
import { VoiceCapturePage } from "./pages/VoiceCapturePage";
import { WishPage } from "./wish/WishPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ProfileProvider } from "./profile/ProfileProvider";
import { RequireOnboarded } from "./profile/RequireOnboarded";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <DataVersionProvider>
            <Routes>
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
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <HomePlaceholder />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <OnboardingPage />
                  </RequireAuth>
                }
              />
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
                path="/catch"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <FlovaCatchPage />
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataVersionProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
