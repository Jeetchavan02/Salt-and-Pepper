import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import type { AuthStatus } from "../types";

// ─── Tiny icon components ─────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {open ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    )}
  </svg>
);

// ─── ProcessFlow — shows the registration algorithm (no secrets) ─────────────
function RegistrationFlow() {
  return (
    <div className="mt-8 glass-card p-5 space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyber-green inline-block"></span>
        Registration Process
      </h3>

      {[
        { label: "Your Password", sub: "entered in the form above", color: "text-slate-300" },
        { label: "+  Unique Salt", sub: "generated server-side using crypto.randomBytes(16)", color: "text-cyber-blue" },
        { label: "+  Server Pepper", sub: "loaded from process.env.PEPPER — never sent to browser", color: "text-cyber-green" },
        { label: "↓  scrypt( combined )", sub: "N=16384, r=8, p=1, keylen=64", color: "text-yellow-400" },
        { label: "↓  Password Hash", sub: "stored in MongoDB", color: "text-purple-400" },
      ].map((step, i) => (
        <div key={i} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0">
          <span className={`font-mono text-sm font-medium ${step.color} min-w-[180px]`}>{step.label}</span>
          <span className="text-xs text-slate-500 pt-0.5">{step.sub}</span>
        </div>
      ))}

      <div className="mt-3 p-3 rounded-lg bg-navy-900/50 border border-white/5">
        <p className="text-xs text-slate-400">
          <span className="text-cyber-green font-semibold">MongoDB stores:</span>{" "}
          <span className="font-mono text-slate-300">passwordHash</span> + <span className="font-mono text-slate-300">salt</span>
          <span className="ml-3 text-red-400">❌ NOT password</span>
          <span className="ml-2 text-red-400">❌ NOT pepper</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main RegisterForm ────────────────────────────────────────────────────────

export default function RegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.username.trim() || form.username.trim().length < 3)
      errors.username = "Username must be at least 3 characters";
    if (!form.email.match(/^\S+@\S+\.\S+$/))
      errors.email = "Enter a valid email address";
    if (form.password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setMessage("");

    try {
      // confirmPassword is validated above and intentionally NOT sent to backend
      await registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setStatus("success");
      setMessage("Account created successfully! Redirecting to login…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: unknown) {
      setStatus("error");
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessage(
        axiosErr?.response?.data?.message ?? "Registration failed. Please try again."
      );
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: "" }));
  }

  const isLoading = status === "loading";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-green/4 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border border-cyber-blue/20"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,255,136,0.05))" }}>
            <ShieldIcon />
          </div>
          <h1 className="text-3xl font-bold glow-text">Salt + Pepper Auth</h1>
          <p className="text-slate-400 text-sm mt-2">Secure password verification using salted & peppered hashing</p>
          <div className="flex justify-center gap-2 mt-3">
            <span className="badge-success">Exp-7-CSS</span>
            <span className="badge-success">scrypt</span>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="scan-line"></div>

          <h2 className="text-xl font-semibold mb-6 text-slate-100">Create Account</h2>

          {/* Global message */}
          {message && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
              status === "success"
                ? "bg-cyber-green/10 border border-cyber-green/30 text-cyber-green"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}>
              <span>{status === "success" ? "✓" : "✗"}</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="register-form" noValidate className="space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="cyber-label">Username</label>
              <input
                id="reg-username"
                name="username"
                type="text"
                autoComplete="username"
                className="cyber-input"
                placeholder="jeet123"
                value={form.username}
                onChange={handleChange}
                disabled={isLoading}
              />
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="cyber-label">Email Address</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                className="cyber-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="cyber-label">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="cyber-input pr-11"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="cyber-label">Confirm Password</label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="cyber-input pr-11"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">confirmPassword is validated here and never sent to the server</p>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isLoading || status === "success"}
              className="btn-primary mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin"></span>
                  Hashing & Storing…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-cyber-blue hover:text-cyber-blue/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Process visualization */}
        <RegistrationFlow />

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
