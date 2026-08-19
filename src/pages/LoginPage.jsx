import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, Loader2, ArrowLeft, Mail, Lock, KeyRound, CheckCircle2, ShieldAlert, Eye, EyeOff, Info, Sparkles } from "lucide-react";

import { supabase } from "@/src/lib/supabase";

export const LoginPage = () => {
  const { login, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupBanner, setSignupBanner] = useState(null);

  const [view, setView] = useState("login"); // "login" | "forgot" | "reset"
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [simulationMode, setSimulationMode] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      setSignupBanner(location.state.message);
    }
  }, [location.state]);

  useEffect(() => {
    const checkRecovery = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      
      if (search.includes("recovery=true") || hash.includes("type=recovery") || hash.includes("access_token")) {
        setView("reset");
        toast.info("Recovery session active! Please enter your new password below.");
      }
    };
    checkRecovery();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to initialize Google login.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedInUser = await login({ email: email.trim().toLowerCase(), password });
      toast.success(`Welcome back, ${loggedInUser.fullName || "User"}!`);
      if (loggedInUser.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      return toast.error("Please enter your email address");
    }
    setLoading(true);
    try {
      if (simulationMode) {
        toast.success("Simulation mode: Recovery code generated!");
        setResetSent(true);
      } else {
        await forgotPassword(resetEmail.trim().toLowerCase());
        toast.success("A password reset link has been sent to your email!");
        setResetSent(true);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Could not send reset link. Try enabling simulation mode.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      return toast.error("Please enter your registered email address");
    }
    if (!newPassword) {
      return toast.error("Please enter a new password");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      if (simulationMode) {
        toast.success("Password updated successfully (Simulation Mode)!");
        setView("login");
        setResetSent(false);
        setResetEmail("");
      } else {
        await resetPassword(newPassword, resetEmail.trim().toLowerCase());
        toast.success("Your password has been successfully updated!");
        setView("login");
        setResetSent(false);
        setResetEmail("");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update password. Try using simulation mode if session expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-8">
      
      <div className="w-full max-w-md mb-4 flex justify-start">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-slate-800 flex items-center gap-2"
          onClick={() => {
            if (view !== "login") {
              setView("login");
              setResetSent(false);
            } else {
              navigate("/");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {view === "login" ? "Back to Home" : "Back to Sign In"}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl border border-slate-100 overflow-hidden bg-white/80 backdrop-blur-md">
        <div className="h-2 bg-gradient-to-r from-primary to-slate-900 w-full" />

        {view === "login" && (
          <>
            <CardHeader className="space-y-2 text-center pt-8 pb-6">
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                SORECO-1 Portal
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Sign in with your email and password to access the portal
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-5 pb-6">
                {signupBanner && (
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-amber-900 text-sm flex items-start gap-3 shadow-xs">
                    <Mail className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-amber-900 text-xs tracking-wide uppercase">Email Confirmation Required</p>
                      <p className="text-amber-800 text-xs mt-0.5 font-medium leading-relaxed">{signupBanner}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus-visible:ring-primary border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="focus-visible:ring-primary border-slate-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-0 pb-8">
                <Button
                  type="submit"
                  className="w-full text-white bg-primary hover:bg-primary/95 transition-all text-sm font-medium h-11"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  Sign In to Portal
                </Button>

                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-medium h-11 flex items-center justify-center"
                  onClick={handleGoogleLogin}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>

                <div className="text-center text-sm text-slate-500 pt-2">
                  Don't have a consumer account?{" "}
                  <Link to="/register" className="text-primary font-semibold hover:underline">
                    Register here
                  </Link>
                </div>
              </CardFooter>
            </form>
          </>
        )}

        {view === "forgot" && (
          <>
            <CardHeader className="space-y-2 text-center pt-8 pb-6">
              <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                Reset Password
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm px-4">
                {resetSent 
                  ? "We've sent a recovery message to your email address."
                  : "Enter your registered email address and we'll send you a secure link to reset your password."}
              </CardDescription>
            </CardHeader>

            {!resetSent ? (
              <form onSubmit={handleForgotPassword}>
                <CardContent className="space-y-5 pb-6">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-slate-700 font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="your-email@example.com"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10 focus-visible:ring-primary border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="simulation-mode" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        No SMTP email configured?
                      </Label>
                      <button
                        type="button"
                        onClick={() => setSimulationMode(!simulationMode)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                          simulationMode 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-200 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {simulationMode ? "Simulation ON" : "Use Simulation"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {simulationMode 
                        ? "Simulation Mode will immediately let you proceed to the password update screen without waiting for email delivery."
                        : "Enable simulation mode to bypass live email SMTP requirements and test the reset page instantly."}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-0 pb-8">
                  <Button
                    type="submit"
                    className="w-full text-white bg-primary hover:bg-primary/95 transition-all text-sm font-medium h-11"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Password Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-600 hover:text-slate-900 text-sm"
                    onClick={() => {
                      setView("login");
                      setResetSent(false);
                    }}
                  >
                    Cancel & Return to Sign In
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="space-y-6 pb-8 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-14 w-14 text-emerald-500 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-md font-semibold text-slate-800">Check Your Email</h4>
                  <p className="text-xs text-slate-600 leading-relaxed px-4">
                    {simulationMode
                      ? "In simulation mode, you can immediately access the password setting tab by clicking below."
                      : `A password reset link was requested for ${resetEmail}. Please check your inbox and spam folders.`}
                  </p>
                </div>
                
                <div className="pt-2 flex flex-col gap-2">
                  {simulationMode ? (
                    <Button
                      type="button"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setView("reset");
                        toast.success("Welcome to password update mockup!");
                      }}
                    >
                      Proceed to New Password Form
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                      onClick={() => {
                        setView("reset");
                        toast.success("Manual override: testing reset form.");
                      }}
                    >
                      Bypass to Reset Form (Dev Test)
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-500"
                    onClick={() => {
                      setView("login");
                      setResetSent(false);
                    }}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </CardContent>
            )}
          </>
        )}

        {view === "reset" && (
          <>
            <CardHeader className="space-y-2 text-center pt-8 pb-6">
              <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                <Lock className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                New Password
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter your new secure password below to complete the reset.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-5 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="resetConfirmEmail" className="text-slate-700 font-medium">Confirm Email Address</Label>
                  <Input
                    id="resetConfirmEmail"
                    type="email"
                    placeholder="your-email@example.com"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="focus-visible:ring-primary border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-700 font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="focus-visible:ring-primary border-slate-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword" className="text-slate-700 font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="focus-visible:ring-primary border-slate-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 pt-0 pb-8">
                <Button
                  type="submit"
                  className="w-full text-white bg-primary hover:bg-primary/95 transition-all text-sm font-medium h-11"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save New Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-slate-600 hover:text-slate-900 text-sm"
                  onClick={() => {
                    setView("login");
                    setResetSent(false);
                  }}
                >
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};
