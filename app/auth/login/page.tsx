"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Icon } from "../../components";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithMagicLink, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        router.push("/questions");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <Card className="w-full max-w-md text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <Icon name="mark_email_read" size="xl" className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Check your email
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => setMagicLinkSent(false)}>
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
              Welcome back
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">
              Sign in to continue to ExamPrep
            </p>
          </div>

          {/* Login Form */}
          <Card className="mb-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
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
                    placeholder="••••••••"
                    required
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
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                or
              </span>
              <div className="flex-1 h-px bg-border-light dark:bg-border-dark" />
            </div>

            {/* Magic Link Button */}
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleMagicLink}
              disabled={!email || loading || authLoading}
            >
              <Icon name="mail" size="sm" />
              Sign in with Magic Link
            </Button>
          </Card>

          {/* Sign Up Link */}
          <p className="text-center text-text-secondary-light dark:text-text-secondary-dark">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

