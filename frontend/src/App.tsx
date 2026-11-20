import { useCallback, useState } from "react";
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
import { PhonePeLandingPage, type Tab } from "./components/phonepe/PhonePeLandingPage";

function loadRider(): number | null {
  try {
    const v = localStorage.getItem("flova.rider");
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>("week");
  const [riderId, setRiderId] = useState<number | null>(loadRider);

  const onRider = useCallback((id: number | null) => {
    setRiderId(id);
    try {
      if (id == null) localStorage.removeItem("flova.rider");
      else localStorage.setItem("flova.rider", String(id));
    } catch {
      /* storage blocked: fine, just not remembered */
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <DataVersionProvider>
            <Routes>
              {/* Public FLOVA Landing Page adapted from PhonePe reference */}
              <Route
                path="/"
                element={
                  <PhonePeLandingPage
                    tab={tab}
                    setTab={setTab}
                    riderId={riderId}
                    onRider={onRider}
                  />
                }
              />

              {/* Authenticated Application Dashboard */}
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <HomePlaceholder />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <HomePlaceholder />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              />

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

              {/* Onboarding & Data Capture Routes */}
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

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataVersionProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
