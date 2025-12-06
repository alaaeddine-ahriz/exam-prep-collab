"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Icon } from "../../components";
import { useAuth } from "../../context/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = () => {
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <Card className="w-full max-w-md text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <Icon name="check_circle" size="xl" className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Check your email
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
          <div className="flex justify-center">
            <Button variant="primary" onClick={() => router.push("/auth/login")}>
              Back to login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="p-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
        >
          <Icon name="arrow_back" size="sm" />
          <span>Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
              <Icon name="school" size="xl" className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Create account
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
              Join ExamPrep to start studying smarter
            </p>
          </div>

          {/* Sign Up Form */}
          <Card className="mb-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} size="sm" />
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              {/* Password Requirements */}
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <p className="flex items-center gap-2">
                  <Icon
                    name={password.length >= 6 ? "check_circle" : "radio_button_unchecked"}
                    size="sm"
                    className={password.length >= 6 ? "text-success" : ""}
                  />
                  At least 6 characters
                </p>
                <p className="flex items-center gap-2">
                  <Icon
                    name={password && password === confirmPassword ? "check_circle" : "radio_button_unchecked"}
                    size="sm"
                    className={password && password === confirmPassword ? "text-success" : ""}
                  />
                  Passwords match
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
                  <Icon name="error" size="sm" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading || authLoading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Card>

          {/* Sign In Link */}
          <p className="text-center text-text-secondary-light dark:text-text-secondary-dark">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

