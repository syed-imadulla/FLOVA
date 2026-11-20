import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./AuthProvider";

export function useSession(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession must be used within an AuthProvider");
  }
  return context;
}
