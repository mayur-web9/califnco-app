import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { getUserProfile } from "../services/authService";
import { registerForPushNotificationsAsync } from "../services/notificationHelper";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const prof = await getUserProfile(firebaseUser.uid);
          setUser(firebaseUser);
          setProfile(prof);
          registerForPushNotificationsAsync(firebaseUser.uid).catch(err => {
            console.warn("FCM push registration warning:", err?.message);
          });
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn("Auth state change error:", err?.message);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
