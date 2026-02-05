"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getAuthClient } from "../../../firebase/firebaseClient"; // <-- client-only auth

function friendlyAuthError(
  err: unknown,
  mode: "signin" | "signup" | "reset" | "google"
): string {
  const anyErr = err as { code?: string; message?: string };
  const code = anyErr?.code ?? "";

  const generic =
    mode === "reset"
      ? "Unable to send reset email. Please try again."
      : mode === "signup"
      ? "Unable to create your account. Please try again."
      : mode === "google"
      ? "Google sign-in failed. Please try again."
      : "Unable to sign in. Please try again.";

  switch (code) {
    // Sign in
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/user-not-found":
      return "Account does not exist. Please sign up first.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a while and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";

    // Sign up
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters (mix letters and numbers if possible).";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled. Please enable it in Firebase Auth settings.";

    // Reset password
    case "auth/missing-email":
      return "Please enter your email address first.";
    case "auth/user-not-found":
      return "Account does not exist for this email.";

    // Google sign-in common errors
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/cancelled-popup-request":
      return "Google sign-in is already in progress. Please try again.";
    case "auth/popup-blocked":
      return "Popup blocked by your browser. Please allow popups and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email but a different sign-in method. Try signing in using email/password first.";
    default:
      return generic;
  }
}

export default function SignInPage() {
  const [isSignIn, setIsSignIn] = React.useState(true);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [name, setName] = React.useState("");

  const [rememberMe, setRememberMe] = React.useState(true);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [loading, setLoading] = React.useState(false);

  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetMessage, setResetMessage] = React.useState("");

  const [googleLoading, setGoogleLoading] = React.useState(false);

  const [error, setError] = React.useState("");

  const router = useRouter();

  const clearAlerts = () => {
    setError("");
    setResetMessage("");
  };

  const applyPersistence = async () => {
    const auth = getAuthClient();
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    return auth;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearAlerts();

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (!isSignIn) {
      if (!name.trim()) {
        setError("Please enter a username.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const auth = await applyPersistence();

      if (isSignIn) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        alert("Welcome back!");
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, { displayName: name.trim() });
        alert("Account created successfully!");
      }

      router.push("/");
    } catch (err: unknown) {
      setError(friendlyAuthError(err, isSignIn ? "signin" : "signup"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearAlerts();

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      setResetLoading(true);
      const auth = getAuthClient();
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage(
        "Password reset email sent. Please check your inbox (and spam folder)."
      );
    } catch (err: unknown) {
      setError(friendlyAuthError(err, "reset"));
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAlerts();
    setGoogleLoading(true);

    try {
      const auth = await applyPersistence();
      const provider = new GoogleAuthProvider();
      // Optional: force account selection each time
      provider.setCustomParameters({ prompt: "select_account" });

      await signInWithPopup(auth, provider);
      alert("Signed in with Google!");
      router.push("/");
    } catch (err: unknown) {
      setError(friendlyAuthError(err, "google"));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center py-20 dark:bg-black bg-white min-h-screen w-full px-6">
      <section className="bg-white dark:bg-black shadow-lg rounded-xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          {isSignIn ? "Sign In" : "Create Account"}
        </h1>

        {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}

        {resetMessage && (
          <p className="mb-4 text-sm text-green-600 text-center">{resetMessage}</p>
        )}

        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading || resetLoading}
          className="w-full py-2 px-4 mb-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-semibold rounded-lg shadow-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {googleLoading ? (
            "Signing in..."
          ) : (
            <>
              <span className="text-lg">G</span>
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-500 dark:text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isSignIn && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-gray-100 dark:focus:ring-gray-100 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="e.g., Keith"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>

            <div className="mt-1 flex items-stretch gap-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-gray-100 dark:focus:ring-gray-100 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder={isSignIn ? "Enter your password" : "At least 6 characters"}
                autoComplete={isSignIn ? "current-password" : "new-password"}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign up only) */}
          {!isSignIn && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm Password
              </label>

              <div className="mt-1 flex items-stretch gap-2">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 dark:focus:border-gray-100 dark:focus:ring-gray-100 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="px-3 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-black dark:text-white focus:ring-gray-900 dark:focus:ring-gray-100"
              />
              Remember me
            </label>

            {isSignIn && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading || loading || googleLoading}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:underline disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Forgot password?"}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || resetLoading || googleLoading}
            className="w-full py-2 px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignIn ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignIn(!isSignIn);
              clearAlerts();
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:underline text-sm"
            type="button"
          >
            {isSignIn ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </section>

      <footer className="mt-5 text-sm text-gray-600 dark:text-gray-400">
        Powered by Firebase 🔥
      </footer>
    </main>
  );
}
