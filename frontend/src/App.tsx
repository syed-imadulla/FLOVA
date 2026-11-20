import { useCallback, useState, lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PhonePeLandingPage, type Tab } from "./components/phonepe/PhonePeLandingPage";

// Lazy-load authenticated pages and Supabase providers so the public landing page loads instantly
// and never crashes even if Supabase environment variables have not been configured yet.
const AuthProvider = lazy(() => import("./auth/AuthProvider").then((m) => ({ default: m.AuthProvider })));
const ProfileProvider = lazy(() => import("./profile/ProfileProvider").then((m) => ({ default: m.ProfileProvider })));
const DataVersionProvider = lazy(() => import("./data/DataVersionProvider").then((m) => ({ default: m.DataVersionProvider })));
const RequireAuth = lazy(() => import("./auth/RequireAuth").then((m) => ({ default: m.RequireAuth })));
const RequireOnboarded = lazy(() => import("./profile/RequireOnboarded").then((m) => ({ default: m.RequireOnboarded })));
const RedirectIfAuthed = lazy(() => import("./auth/RedirectIfAuthed").then((m) => ({ default: m.RedirectIfAuthed })));
const HomePlaceholder = lazy(() => import("./pages/HomePlaceholder").then((m) => ({ default: m.HomePlaceholder })));
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("./pages/auth/SignupPage").then((m) => ({ default: m.SignupPage })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then((m) => ({ default: m.OnboardingPage })));
const CheckinPage = lazy(() => import("./pages/CheckinPage").then((m) => ({ default: m.CheckinPage })));
const AddTransactionPage = lazy(() => import("./pages/AddTransactionPage").then((m) => ({ default: m.AddTransactionPage })));
const PayoutsPage = lazy(() => import("./pages/PayoutsPage").then((m) => ({ default: m.PayoutsPage })));
const CommitmentsPage = lazy(() => import("./pages/CommitmentsPage").then((m) => ({ default: m.CommitmentsPage })));
const HistoryPage = lazy(() => import("./pages/HistoryPage").then((m) => ({ default: m.HistoryPage })));

function loadRider(): number | null {
  try {
    const v = localStorage.getItem("flova.rider");
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

const LoadingSpinner = () => (
  <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: "monospace", color: "#666" }}>
    Loading FLOVA module...
  </div>
);

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
      <Routes>
        {/* Public FLOVA Landing Page — loads instantly, completely standalone */}
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
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <ProfileProvider>
                  <DataVersionProvider>
                    <RequireAuth>
                      <RequireOnboarded>
                        <HomePlaceholder />
                      </RequireOnboarded>
                    </RequireAuth>
                  </DataVersionProvider>
                </ProfileProvider>
              </AuthProvider>
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <ProfileProvider>
                  <DataVersionProvider>
                    <RequireAuth>
                      <RequireOnboarded>
                        <HomePlaceholder />
                      </RequireOnboarded>
                    </RequireAuth>
                  </DataVersionProvider>
                </ProfileProvider>
              </AuthProvider>
            </Suspense>
          }
        />

        {/* Authentication Routes */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <RedirectIfAuthed>
                  <LoginPage />
                </RedirectIfAuthed>
              </AuthProvider>
            </Suspense>
          }
        />
        <Route
          path="/signup"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <RedirectIfAuthed>
                  <SignupPage />
                </RedirectIfAuthed>
              </AuthProvider>
            </Suspense>
          }
        />

        {/* Onboarding & Data Capture Routes */}
        <Route
          path="/onboarding"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <RequireAuth>
                  <OnboardingPage />
                </RequireAuth>
              </AuthProvider>
            </Suspense>
          }
        />
        <Route
          path="/checkin"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <ProfileProvider>
                  <DataVersionProvider>
                    <RequireAuth>
                      <RequireOnboarded>
                        <CheckinPage />
                      </RequireOnboarded>
                    </RequireAuth>
                  </DataVersionProvider>
                </ProfileProvider>
              </AuthProvider>
            </Suspense>
          }
        />
        <Route
          path="/add"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <ProfileProvider>
                  <DataVersionProvider>
                    <RequireAuth>
                      <RequireOnboarded>
                        <AddTransactionPage />
                      </RequireOnboarded>
                    </RequireAuth>
                  </DataVersionProvider>
                </ProfileProvider>
              </AuthProvider>
            </Suspense>
          }
        />
        <Route
          path="/payouts"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <ProfileProvider>
                  <DataVersionProvider>
                    <RequireAuth>
                      <RequireOnboarded>
                        <PayoutsPage />
                      </RequireOnboarded>
                    </RequireAuth>
                  </DataVersionProvider>
                </ProfileProvider>
              </AuthProvider>
            </Suspense>
          }
        />
        <Route
          path="/commitments"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <ProfileProvider>
                  <DataVersionProvider>
                    <RequireAuth>
                      <RequireOnboarded>
                        <CommitmentsPage />
                      </RequireOnboarded>
                    </RequireAuth>
                  </DataVersionProvider>
                </ProfileProvider>
              </AuthProvider>
            </Suspense>
          }
        />
        <Route
          path="/history"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AuthProvider>
                <ProfileProvider>
                  <DataVersionProvider>
                    <RequireAuth>
                      <RequireOnboarded>
                        <HistoryPage />
                      </RequireOnboarded>
                    </RequireAuth>
                  </DataVersionProvider>
                </ProfileProvider>
              </AuthProvider>
            </Suspense>
          }
        />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
