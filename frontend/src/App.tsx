import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RedirectIfAuthed } from "./auth/RedirectIfAuthed";
import { RequireAuth } from "./auth/RequireAuth";
import { DataVersionProvider } from "./data/DataVersionProvider";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { ProfileProvider } from "./profile/ProfileProvider";
import { RequireOnboarded } from "./profile/RequireOnboarded";
import { FlovaLandingPage } from "./components/landing/FlovaLandingPage";
import { AppLayout } from "./app/AppLayout";
import { HomeScreen } from "./screens/HomeScreen";
import { ActivityScreen } from "./screens/ActivityScreen";
import { VoiceScreen } from "./screens/VoiceScreen";
import { InsightsScreen } from "./screens/InsightsScreen";
import { MoreScreen } from "./screens/MoreScreen";
import { CheckinScreen } from "./screens/CheckinScreen";
import { AddScreen } from "./screens/AddScreen";
import { CatchScreen } from "./screens/CatchScreen";
import { PayoutsScreen } from "./screens/PayoutsScreen";
import { CommitmentsScreen } from "./screens/CommitmentsScreen";
import { WishScreen } from "./screens/WishScreen";
import { InvoicesScreen } from "./screens/InvoicesScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AndroidBackButton } from "./native/AndroidBackButton";
import { APP_START_PATH, IS_NATIVE_APP } from "./native/platform";

export default function App() {
  return (
    <BrowserRouter>
      <AndroidBackButton />
      <AuthProvider>
        <ProfileProvider>
          <DataVersionProvider>
            <Routes>
              {/* Public */}
              {/* The landing page is website-only; the Android app starts at login (→ /app if signed in). */}
              <Route path="/" element={IS_NATIVE_APP ? <Navigate to={APP_START_PATH} replace /> : <FlovaLandingPage />} />
              <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
              <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />
              <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPasswordPage /></RedirectIfAuthed>} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Signed in, before onboarding */}
              <Route path="/onboarding" element={<RequireAuth><OnboardingScreen /></RequireAuth>} />

              {/* The app: one persistent layout with the bottom navbar; screens swap inside it. */}
              <Route
                element={
                  <RequireAuth>
                    <RequireOnboarded>
                      <AppLayout />
                    </RequireOnboarded>
                  </RequireAuth>
                }
              >
                <Route path="/app" element={<HomeScreen />} />
                <Route path="/activity" element={<ActivityScreen />} />
                <Route path="/voice" element={<VoiceScreen />} />
                <Route path="/insights" element={<InsightsScreen />} />
                <Route path="/more" element={<MoreScreen />} />
                <Route path="/checkin" element={<CheckinScreen />} />
                <Route path="/add" element={<AddScreen />} />
                <Route path="/catch" element={<CatchScreen />} />
                <Route path="/payouts" element={<PayoutsScreen />} />
                <Route path="/commitments" element={<CommitmentsScreen />} />
                <Route path="/invoices" element={<InvoicesScreen />} />
                <Route path="/wish" element={<WishScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
              </Route>

              {/* Legacy URLs → their single current screen */}
              <Route path="/bills" element={<Navigate to="/invoices" replace />} />
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="/history" element={<Navigate to="/activity" replace />} />
              <Route path="/transactions" element={<Navigate to="/activity" replace />} />
              <Route path="/overview" element={<Navigate to="/insights" replace />} />
              <Route path="/settings" element={<Navigate to="/profile" replace />} />
              <Route path="/plan" element={<Navigate to="/commitments" replace />} />
              <Route path="/quick-capture" element={<Navigate to="/add" replace />} />
              <Route path="/voice-transcription" element={<Navigate to="/voice" replace />} />
              <Route path="/catch-receipt" element={<Navigate to="/catch" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DataVersionProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
