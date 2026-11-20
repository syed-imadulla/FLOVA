import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { RedirectIfAuthed } from "./auth/RedirectIfAuthed";
import { RequireAuth } from "./auth/RequireAuth";
import { HomePlaceholder } from "./pages/HomePlaceholder";
import { OnboardingPage } from "./pages/OnboardingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ProfileProvider } from "./profile/ProfileProvider";
import { RequireOnboarded } from "./profile/RequireOnboarded";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
