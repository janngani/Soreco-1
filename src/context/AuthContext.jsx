import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/src/lib/api";
import { supabase } from "@/src/lib/supabase";
const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  login: async () => {
  },
  register: async () => {
  },
  logout: async () => {
  },
  forgotPassword: async () => {
  },
  resetPassword: async () => {
  }
});
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchProfile = async (sessionToken) => {
    if (!sessionToken) {
      localStorage.removeItem("auth_token");
      setUser(null);
      setLoading(false);
      return;
    }
    localStorage.setItem("auth_token", sessionToken);
    let retries = 3;
    let delay = 1000;
    let success = false;
    let lastError = null;
    while (retries > 0 && !success) {
      try {
        const data = await api.auth.me();
        setUser(data);
        success = true;
      } catch (error) {
        lastError = error;
        const errMsg = error?.message || "";
        if (errMsg.includes("401") || errMsg.includes("Unauthorized") || errMsg.includes("expired") || errMsg.includes("Invalid or expired session")) {
          console.info("Definitive auth failure, logging out:", errMsg);
          localStorage.removeItem("auth_token");
          setUser(null);
          setLoading(false);
          return;
        }
        console.warn(`Transient/network error fetching user profile, retrying (${retries} left):`, errMsg);
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }
    }
    if (!success) {
      console.warn("Failed to fetch user profile after retries:", lastError);
      const errMsg = lastError?.message || "";
      if (errMsg.includes("401") || errMsg.includes("Unauthorized") || errMsg.includes("expired") || errMsg.includes("Invalid or expired session")) {
        localStorage.removeItem("auth_token");
        setUser(null);
      }
    }
    setLoading(false);
  };
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              await fetchProfile(session.access_token);
            } else if (token === "mock_admin_token" || token) {
              await fetchProfile(token);
            } else {
              localStorage.removeItem("auth_token");
              setUser(null);
              setLoading(false);
            }
          } catch (sessionErr) {
            console.warn("Error getting supabase session, falling back to local token:", sessionErr);
            await fetchProfile(token);
          }
        } else {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              localStorage.setItem("auth_token", session.access_token);
              await fetchProfile(session.access_token);
            } else {
              setUser(null);
              setLoading(false);
            }
          } catch {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn("Initial session fetch error:", err);
        setLoading(false);
      }
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          const currentToken = localStorage.getItem("auth_token");
          if (currentToken !== session.access_token) {
            localStorage.setItem("auth_token", session.access_token);
            await fetchProfile(session.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);
  const login = async (credentials) => {
    const data = await api.auth.login(credentials.email, credentials.password);
    if (data && data.session && data.session.access_token) {
      localStorage.setItem("auth_token", data.session.access_token);
      try {
        if (data.session.refresh_token) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        }
      } catch (syncErr) {
        console.warn("Could not set supabase client session:", syncErr);
      }
      const profileData = await api.auth.me();
      setUser(profileData);
      return profileData;
    }
    throw new Error("No active session found. Please check your credentials or confirm your email.");
  };
  const register = async (formData) => {
    const data = await api.auth.register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      accountNumber: formData.accountNumber,
      phoneNumber: formData.phoneNumber
    });
    // Explicitly do NOT auto-login after sign-up.
    // Do not set localStorage auth_token or setUser.
    return {
      success: true,
      supabaseConfirmRequired: data?.supabaseConfirmRequired ?? (!data?.session),
      session: data?.session || null,
      user: data?.user || null,
      email: formData.email
    };
  };
  const updateProfile = async (profileData) => {
    await api.auth.updateProfile(profileData);
    const updated = await api.auth.me();
    setUser(updated);
    return updated;
  };
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut error:", e);
    }
    localStorage.removeItem("auth_token");
    setUser(null);
  };
  const forgotPassword = async (email) => {
    const redirectTo = `${window.location.origin}/login?recovery=true`;
    return await api.auth.forgotPassword(email, redirectTo);
  };
  const resetPassword = async (newPassword, email) => {
    if (email) {
      return await api.auth.resetPassword(email, newPassword);
    }
    throw new Error("Email is required for resetting password");
  };
  const isAdmin = user?.role === "admin";
  return <AuthContext.Provider value={{
    user,
    userData: user,
    loading,
    isAdmin,
    login,
    register,
    updateProfile,
    logout,
    forgotPassword,
    resetPassword
  }}>
      {children}
    </AuthContext.Provider>;
};
export default AuthProvider;
