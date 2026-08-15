"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Shown on the sign-in screen after the server rejects the token. */
export const REJECTED_TOKEN = "That token wasn’t accepted. Check it and try again.";

const MANAGEMENT_USER_KEY = "bmf-management-user";
const MANAGEMENT_TOKEN_KEY = "bmf-management-token";

export function AdminLogin({
  token,
  onTokenChange,
  onSubmit,
  description,
  error,
}: {
  token: string;
  onTokenChange: (token: string) => void;
  onSubmit: () => void;
  description: string;
  error?: string | null;
}) {
  const pathname = usePathname();
  const tab = pathname.split("/").pop() || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [managementError, setManagementError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoLoggingIn] = useState(() =>
    typeof window !== "undefined" && !!window.sessionStorage.getItem(MANAGEMENT_TOKEN_KEY),
  );

  useEffect(() => {
    const stored = window.sessionStorage.getItem(MANAGEMENT_TOKEN_KEY);
    if (stored && !token) {
      onTokenChange(stored);
      onSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishLogin = (authToken: string, user?: unknown) => {
    window.sessionStorage.setItem(MANAGEMENT_TOKEN_KEY, authToken);
    onTokenChange(authToken);

    if (user) {
      window.localStorage.setItem(MANAGEMENT_USER_KEY, JSON.stringify(user));
      window.dispatchEvent(
        new CustomEvent("bmf-management-login", { detail: user }),
      );
    }

    onSubmit();
  };

  const handleManagementLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setManagementError(null);
    setLoading(true);

    const res = await fetch("/api/management/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password, tab }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setManagementError(data.error ?? "Couldn’t sign in.");
      return;
    }

    finishLogin(data.token, data.user);
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    finishLogin(token);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password) {
      void handleManagementLogin(e);
    } else {
      handleTokenSubmit(e);
    }
  };

  if (autoLoggingIn) {
    return (
      <div className="mx-auto max-w-md py-12 text-center text-sm text-muted">
        Resuming session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h2 className="card-title">Sign in</h2>
        <p className="card-subtitle">{description}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="field-label" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              className="input"
              placeholder="e.g. Lucas2013"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="relative flex items-center gap-4 py-1">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs font-semibold uppercase text-muted">or</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>
          <div>
            <label className="field-label" htmlFor="admin-token">
              Admin token
            </label>
            <input
              id="admin-token"
              type="password"
              className="input"
              placeholder="••••••••••••"
              value={token}
              onChange={(e) => onTokenChange(e.target.value.trim())}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>
        {(error || managementError) && (
          <p className="mt-4 text-sm text-red-600">{error || managementError}</p>
        )}
      </div>
    </div>
  );
}
