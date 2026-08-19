import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/src/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Loader2, ShieldCheck, X, Check, Circle, Eye, EyeOff } from "lucide-react";
export const RegisterPage = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    accountNumber: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const password = formData.password;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return toast.error(
        "Password is too weak! It must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (formData.accountNumber.length < 5) {
      return toast.error("Please enter a valid utility account number");
    }
    setLoading(true);
    try {
      const trimmedEmail = formData.email.trim().toLowerCase();
      await register({
        fullName: formData.fullName,
        email: trimmedEmail,
        password: formData.password,
        accountNumber: formData.accountNumber,
        phoneNumber: formData.phoneNumber
      });
      
      const confirmMessage = "Check your email and confirm your account before logging in.";
      toast.success(confirmMessage, {
        duration: 10000
      });

      // Do NOT auto-login. Redirect to Sign In page with email and success message in state.
      navigate("/login", {
        state: {
          email: trimmedEmail,
          registered: true,
          message: confirmMessage
        }
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };
  return <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-128px)] px-4 py-12">
      <Card className="w-full max-w-lg shadow-xl border-slate-100 relative">
        <Button
    variant="ghost"
    size="icon"
    className="absolute right-2 top-2 text-slate-400 hover:text-red-500 z-10"
    onClick={() => navigate("/")}
  >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Register using your SORECO-1 utility account number
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
    id="fullName"
    placeholder="Enter Full name"
    required
    value={formData.fullName}
    onChange={handleChange}
  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Utility Account Number</Label>
                <div className="relative">
                  <Input
    id="accountNumber"
    placeholder="Enter your Utility Account Number"
    required
    value={formData.accountNumber}
    onChange={handleChange}
  />
                  <ShieldCheck className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
      id="email"
      type="email"
      placeholder="name@example.com"
      required
      value={formData.email}
      onChange={handleChange}
    />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
      id="phoneNumber"
      placeholder="09XX XXX XXXX"
      value={formData.phoneNumber}
      onChange={handleChange}
    />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-2">
              <div className="font-semibold text-slate-700">Password strength requirements:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  {hasUppercase ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  )}
                  <span className={hasUppercase ? "text-emerald-700 font-medium" : "text-slate-500"}>
                    Uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasLowercase ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  )}
                  <span className={hasLowercase ? "text-emerald-700 font-medium" : "text-slate-500"}>
                    Lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  )}
                  <span className={hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"}>
                    Number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSpecial ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  )}
                  <span className={hasSpecial ? "text-emerald-700 font-medium" : "text-slate-500"}>
                    Special character / symbol
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
    type="submit"
    className="w-full bg-primary hover:bg-primary/90 text-white"
    disabled={loading}
  >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create Account
            </Button>

            <div className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>;
};
