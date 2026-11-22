import { createContext, useContext, useLayoutEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recoveryUserId, setRecoveryUserId] = useState(null);

  useLayoutEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryUserId(sessionUser?.id ?? null);
      } else {
        setRecoveryUserId((current) => current === sessionUser?.id ? current : null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isRecoverySession: recoveryUserId !== null && recoveryUserId === user?.id }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};