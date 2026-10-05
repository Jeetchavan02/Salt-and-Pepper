import React, { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import type { AuthStatus, User } from "../types";

// ─── Login flow visualization ─────────────────────────────────────────────────
function LoginFlow({ result }: { result?: "success" | "failure" | null }) {
  return (
    <div className="mt-8 glass-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue inline-block"></span>
        Login Verification Flow
      </h3>

      <div className="space-y-1">
        {[
          { label: "Entered Password", sub: "from the form — not stored anywhere", color: "text-slate-300" },
          { label: "+  Stored Salt", sub: "fetched from MongoDB — not regenerated", color: "text-cyber-blue" },
          { label: "+  Server Pepper", sub: "loaded from process.env.PEPPER — never in DB", color: "text-cyber-green" },
          { label: "↓  scrypt( combined )", sub: "same parameters as registration", color: "text-yellow-400" },
          { label: "↓  Generated Hash", sub: "computed fresh — not fetched", color: "text-purple-400" },
          { label: "↓  timingSafeEqual()", sub: "compare with stored passwordHash", color: "text-orange-400" },
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0">
            <span className={`font-mono text-sm font-medium ${step.color} min-w-[200px]`}>{step.label}</span>
            <span className="text-xs text-slate-500 pt-0.5">{step.sub}</span>
          </div>
        ))}

        {/* Result indicator */}
        {result && (
          <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold ${
            result === "success"
              ? "bg-cyber-green/10 border border-cyber-green/30 text-cyber-green"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}>
            {result === "success" ? "✓  MATCH → Login Successful" : "✗  NO MATCH → Access Denied"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Success banner ───────────────────────────────────────────────────────────
function SuccessBanner({ user }: { user: User }) {
  return (
    <div className="glass-card p-8 text-center">
      <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,212,255,0.1))", border: "1px solid rgba(0,255,136,0.3)" }}>
        <svg className="w-10 h-10 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-cyber-green mb-2">Login Successful</h2>
      <p className="text-slate-400">Welcome back,</p>
      <p className="text-xl font-semibold text-white mt-1">{user.username}</p>
      <p className="text-slate-500 text-sm mt-1">{user.email}</p>

      <div className="mt-6 p-4 rounded-xl bg-navy-900/50 border border-white/5 text-left space-y-2">
        <p className="text-xs text-slate-500 font-mono">
          <span className="text-cyber-green">✔</span> Identity verified via: password + storedSalt + pepper → scrypt → compare
        </p>
        <p className="text-xs text-slate-500 font-mono">
          <span className="text-cyber-green">✔</span> No password or pepper was stored in MongoDB
        </p>
        <p className="text-xs text-slate-500 font-mono">
          <span className="text-cyber-green">✔</span> Hash comparison used crypto.timingSafeEqual()
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-6 btn-secondary max-w-xs mx-auto"
      >
        Sign out / Test again
      </button>
    </div>
  );
}

// ─── Main LoginForm ───────────────────────────────────────────────────────────

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [flowResult, setFlowResult] = useState<"success" | "failure" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setStatus("error");
      setMessage("Please enter your email and password");
      return;
    }

    setStatus("loading");
    setMessage("");
    setFlowResult(null);

    try {
      const response = await loginUser({ email: form.email, password: form.password });
      setStatus("success");
      setFlowResult("success");
      setMessage("Login successful");
      if (response.user) {
        setLoggedInUser(response.user as User);
      }
    } catch (err: unknown) {
      setStatus("error");
      setFlowResult("failure");
      const axiosErr = err as { response?: { data?: { message?: string } } };
      // Use vague message — don't tell user whether email or password was wrong
      setMessage(axiosErr?.response?.data?.message ?? "Invalid credentials");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  const isLoading = status === "loading";

  if (status === "success" && loggedInUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <SuccessBanner user={loggedInUser} />
          <LoginFlow result="success" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyber-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-cyber-purple/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border border-cyber-blue/20"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,255,136,0.05))" }}>
            <svg className="w-8 h-8 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold glow-text">Salt + Pepper Auth</h1>
          <p className="text-slate-400 text-sm mt-2">Secure password verification using salted & peppered hashing</p>
          <div className="flex justify-center gap-2 mt-3">
            <span className="badge-success">Exp-7-CSS</span>
            <span className="badge-success">scrypt</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="scan-line"></div>

          <h2 className="text-xl font-semibold mb-2 text-slate-100">Secure Login</h2>
          <p className="text-xs text-slate-500 mb-6">
            The backend fetches your stored salt, recomputes the hash, and compares — your password is never stored.
          </p>

          {/* Error message */}
          {status === "error" && message && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400">
              <span>✗</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form" noValidate className="space-y-5">
            <div>
              <label htmlFor="login-email" className="cyber-label">Email Address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className="cyber-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="cyber-label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="cyber-input pr-11"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin"></span>
                  Verifying…
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-cyber-blue hover:text-cyber-blue/80 font-medium transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Process visualization */}
        <LoginFlow result={flowResult} />

        {/* Dev links */}
        <div className="flex justify-center gap-6 mt-4">
          <Link to="/admin/users-demo" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            🗄️ DB View
          </Link>
          <Link to="/demo/hash-cases" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            🔬 Hash Cases Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
