import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RedirectIfAuthed } from "./auth/RedirectIfAuthed";
import { RequireAuth } from "./auth/RequireAuth";
import { DataVersionProvider } from "./data/DataVersionProvider";
import { AddTransactionPage } from "./pages/AddTransactionPage";
import { CheckinPage } from "./pages/CheckinPage";
import { CommitmentsPage } from "./pages/CommitmentsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePlaceholder } from "./pages/HomePlaceholder";
import { OnboardingPage } from "./pages/OnboardingPage";
import { PayoutsPage } from "./pages/PayoutsPage";
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
                path="/history"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <HistoryPage />
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
