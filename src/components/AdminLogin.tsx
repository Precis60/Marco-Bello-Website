"use client";

/** Shown on the sign-in screen after the server rejects the token. */
export const REJECTED_TOKEN = "That token wasn’t accepted. Check it and try again.";

export function AdminLogin({
  token,
  onTokenChange,
  onSubmit,
  description,
  error,
}: {
  token: string;
  onTokenChange: (token: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  description: string;
  error?: string | null;
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h2 className="card-title">Sign in</h2>
        <p className="card-subtitle">{description}</p>
        <form onSubmit={onSubmit} className="mt-6">
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
            required
          />
          <button type="submit" className="btn btn-primary mt-6 w-full">
            Continue
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
