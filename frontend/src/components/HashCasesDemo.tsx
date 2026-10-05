import { useState } from "react";
import { runHashCasesDemo, type HashCasesResponse } from "../services/authService";

// ─── Case Card ────────────────────────────────────────────────────────────────
function CaseCard({
  caseKey,
  label,
  passwordUsed,
  storedHashPrefix,
  saltPrefix,
  computedHashPrefix,
  matched,
  verdict,
  pepperNote,
}: {
  caseKey: "A" | "B";
  label: string;
  passwordUsed: string;
  storedHashPrefix: string;
  saltPrefix: string;
  computedHashPrefix: string;
  matched: boolean;
  verdict: string;
  pepperNote: string;
}) {
  const isMatch = matched;
  const borderColor = isMatch
    ? "border-cyber-green/30"
    : "border-red-400/30";
  const bgColor = isMatch
    ? "bg-cyber-green/5"
    : "bg-red-500/5";

  const steps = [
    {
      icon: "🔑",
      label: "Password Entered",
      value: passwordUsed,
      color: "text-slate-200",
      note: caseKey === "A" ? "Correct password" : "Wrong password",
    },
    {
      icon: "🧂",
      label: "Stored Salt (from DB)",
      value: saltPrefix,
      color: "text-cyber-blue",
      note: "Never regenerated during login",
    },
    {
      icon: "🌶️",
      label: "Server Pepper",
      value: pepperNote,
      color: "text-cyber-green",
      note: "From process.env.PEPPER — never in DB",
    },
    {
      icon: "⚙️",
      label: "scrypt( combined )",
      value: "password + salt + pepper",
      color: "text-yellow-400",
      note: "N=16384, r=8, p=1, keylen=64",
    },
    {
      icon: "🔒",
      label: "Computed Hash",
      value: computedHashPrefix,
      color: "text-purple-400",
      note: "Generated from above combination",
    },
    {
      icon: "🗄️",
      label: "Stored Hash (from DB)",
      value: storedHashPrefix,
      color: "text-orange-400",
      note: "Retrieved from MongoDB",
    },
  ];

  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} overflow-hidden`}>
      {/* Header */}
      <div
        className={`px-6 py-4 flex items-center justify-between ${
          isMatch
            ? "bg-cyber-green/10 border-b border-cyber-green/20"
            : "bg-red-500/10 border-b border-red-500/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
              isMatch
                ? "bg-cyber-green/20 text-cyber-green border border-cyber-green/30"
                : "bg-red-500/20 text-red-400 border border-red-400/30"
            }`}
          >
            {caseKey}
          </span>
          <div>
            <p className="font-semibold text-white text-sm">{label}</p>
            <p className={`text-xs font-mono ${isMatch ? "text-cyber-green" : "text-red-400"}`}>
              {isMatch ? "Case A" : "Case B"}
            </p>
          </div>
        </div>
        <span
          className={`text-xl font-bold ${
            isMatch ? "text-cyber-green" : "text-red-400"
          }`}
        >
          {isMatch ? "✅" : "❌"}
        </span>
      </div>

      {/* Steps */}
      <div className="p-5 space-y-2">
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-start gap-3 py-2">
              <span className="text-base mt-0.5">{step.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  {step.label}
                </p>
                <p className={`font-mono text-sm font-semibold break-all ${step.color}`}>
                  {step.value}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{step.note}</p>
              </div>
            </div>
            {/* Arrow between steps */}
            {i < steps.length - 1 && (
              <div className="flex justify-start ml-7">
                <span className="text-slate-600 text-xs">↓</span>
              </div>
            )}
          </div>
        ))}

        {/* Compare line */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-2">
            <span>timingSafeEqual(</span>
            <span className="text-purple-400">computedHash</span>
            <span>,</span>
            <span className="text-orange-400">storedHash</span>
            <span>)</span>
          </div>

          {/* Hash comparison visual */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28">Computed:</span>
              <span className="font-mono text-xs text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/20">
                {computedHashPrefix}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28">Stored:</span>
              <span className="font-mono text-xs text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded border border-orange-500/20">
                {storedHashPrefix}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-28 mt-1">
              <span
                className={`text-lg font-bold ${
                  isMatch ? "text-cyber-green" : "text-red-400"
                }`}
              >
                {isMatch ? "= EQUAL" : "≠ NOT EQUAL"}
              </span>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div
          className={`mt-4 p-3 rounded-xl flex items-center gap-3 font-semibold text-sm ${
            isMatch
              ? "bg-cyber-green/10 border border-cyber-green/40 text-cyber-green"
              : "bg-red-500/10 border border-red-400/40 text-red-400"
          }`}
        >
          <span className="text-xl">{isMatch ? "🔓" : "🔒"}</span>
          <span>{verdict}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main HashCasesDemo component ─────────────────────────────────────────────

export default function HashCasesDemo() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wrongPassword, setWrongPassword] = useState("");
  const [result, setResult] = useState<HashCasesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !wrongPassword) {
      setError("Please fill in all three fields");
      return;
    }
    if (password === wrongPassword) {
      setError("Wrong password must be different from the correct password");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await runHashCasesDemo(email, password, wrongPassword);
      setResult(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr?.response?.data?.message ??
          "Failed to run demo — make sure the user is registered first"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-8 text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)",
              color: "#facc15",
            }}
          >
            🔬 Educational Lab Demo — Exp-7-CSS
          </span>
          <h1 className="text-3xl font-bold text-white">
            Hash Comparison: Two Cases
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto text-sm leading-relaxed">
            Enter a registered user's email, their <strong>correct</strong> password, and
            a <strong>different wrong</strong> password. The backend runs both
            computations using the{" "}
            <span className="text-cyber-blue font-mono">stored salt</span> (never
            regenerated) and shows why only the correct password produces a matching hash.
          </p>
        </div>

        {/* How it works info box */}
        <div className="glass-card p-5 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">
            What happens on the backend
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-300 font-mono">
            <div className="space-y-1.5 p-3 rounded-lg bg-cyber-green/5 border border-cyber-green/15">
              <p className="text-cyber-green font-semibold text-sm mb-2">Case A — MATCH ✅</p>
              <p>correctPassword + storedSalt + pepper</p>
              <p className="text-slate-500">↓ scrypt()</p>
              <p className="text-purple-400">computedHash</p>
              <p className="text-slate-500">↓ timingSafeEqual()</p>
              <p className="text-orange-400">storedHash</p>
              <p className="text-slate-500">↓</p>
              <p className="text-cyber-green font-bold">= EQUAL → Login Successful</p>
            </div>
            <div className="space-y-1.5 p-3 rounded-lg bg-red-500/5 border border-red-400/15">
              <p className="text-red-400 font-semibold text-sm mb-2">Case B — NO MATCH ❌</p>
              <p>wrongPassword + storedSalt + pepper</p>
              <p className="text-slate-500">↓ scrypt()</p>
              <p className="text-purple-400">differentHash</p>
              <p className="text-slate-500">↓ timingSafeEqual()</p>
              <p className="text-orange-400">storedHash</p>
              <p className="text-slate-500">↓</p>
              <p className="text-red-400 font-bold">≠ NOT EQUAL → Access Denied</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            ⚠ The salt is <strong>the same</strong> in both cases — fetched from MongoDB, never regenerated.
            Only the password input differs. The pepper is never revealed.
          </p>
        </div>

        {/* Input form */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Run the Demo
          </h2>
          <form onSubmit={handleRun} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="cyber-label">Registered Email</label>
                <input
                  id="demo-email"
                  type="email"
                  className="cyber-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="cyber-label">
                  Correct Password
                  <span className="ml-1 text-cyber-green normal-case font-normal">(Case A ✅)</span>
                </label>
                <input
                  id="demo-correct-password"
                  type="password"
                  className="cyber-input"
                  placeholder="The real password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="cyber-label">
                  Wrong Password
                  <span className="ml-1 text-red-400 normal-case font-normal">(Case B ❌)</span>
                </label>
                <input
                  id="demo-wrong-password"
                  type="password"
                  className="cyber-input"
                  placeholder="Any different password"
                  value={wrongPassword}
                  onChange={(e) => setWrongPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Salt note — no salt input, always server-side */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-cyber-blue/5 border border-cyber-blue/15 text-xs text-slate-400">
              <span className="text-cyber-blue mt-0.5">ℹ</span>
              <span>
                <strong className="text-cyber-blue">Salt is never entered by the user.</strong>{" "}
                It was generated server-side using{" "}
                <code className="font-mono text-cyber-green bg-navy-900 px-1 rounded">
                  crypto.randomBytes(16)
                </code>{" "}
                during registration and is fetched from MongoDB by the backend — you will
                see it below after running the demo.
              </span>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400">
                <span>✗</span> {error}
              </div>
            )}

            <button
              id="demo-run-btn"
              type="submit"
              disabled={loading}
              className="btn-primary max-w-xs"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin"></span>
                  Computing hashes…
                </span>
              ) : (
                "▶  Run Two-Case Demo"
              )}
            </button>
          </form>
        </div>

        {/* Results: two cards side by side */}
        {result && (
          <>
            {/* Shared context */}
            <div className="glass-card p-5 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Shared Context (same for both cases)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="cyber-label">User</p>
                  <p className="text-sm font-semibold text-white">{result.username}</p>
                </div>
                <div>
                  <p className="cyber-label">Salt Prefix (from MongoDB)</p>
                  <p className="font-mono text-sm text-cyber-blue">{result.saltPrefix}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Same in both cases — never regenerated</p>
                </div>
                <div>
                  <p className="cyber-label">Server Pepper</p>
                  <p className="font-mono text-sm text-cyber-green">{result.pepperNote}</p>
                </div>
              </div>
            </div>

            {/* The two cases */}
            <div className="grid md:grid-cols-2 gap-6">
              <CaseCard
                caseKey="A"
                label="Correct Password"
                passwordUsed={result.caseA.passwordUsed}
                storedHashPrefix={result.storedHashPrefix}
                saltPrefix={result.saltPrefix}
                computedHashPrefix={result.caseA.computedHashPrefix}
                matched={result.caseA.matched}
                verdict={result.caseA.verdict}
                pepperNote={result.pepperNote}
              />
              <CaseCard
                caseKey="B"
                label="Wrong Password"
                passwordUsed={result.caseB.passwordUsed}
                storedHashPrefix={result.storedHashPrefix}
                saltPrefix={result.saltPrefix}
                computedHashPrefix={result.caseB.computedHashPrefix}
                matched={result.caseB.matched}
                verdict={result.caseB.verdict}
                pepperNote={result.pepperNote}
              />
            </div>

            {/* Takeaway */}
            <div className="glass-card p-5 mt-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">🎓 Lab Takeaway</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>
                  <span className="text-cyber-green">✔</span> The <strong className="text-white">same salt</strong> was used in both cases — fetched from MongoDB, not regenerated
                </li>
                <li>
                  <span className="text-cyber-green">✔</span> The <strong className="text-white">same pepper</strong> was used — loaded from <code className="text-cyber-green font-mono">process.env.PEPPER</code>, never from DB
                </li>
                <li>
                  <span className="text-cyber-green">✔</span> Only the <strong className="text-white">password input</strong> differed — and that alone changed the hash completely (avalanche effect)
                </li>
                <li>
                  <span className="text-cyber-green">✔</span> <code className="font-mono text-cyber-blue">crypto.timingSafeEqual()</code> was used for comparison — prevents timing-based attacks
                </li>
                <li>
                  <span className="text-red-400">✗</span> Salt was <strong className="text-white">never taken as input</strong> — generated server-side at registration via{" "}
                  <code className="font-mono text-cyber-blue">crypto.randomBytes(16)</code>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Nav */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <a href="/register" className="btn-secondary max-w-xs text-center">Register User</a>
          <a href="/login" className="btn-secondary max-w-xs text-center">Login</a>
          <a href="/admin/users-demo" className="btn-secondary max-w-xs text-center">DB View</a>
        </div>
      </div>
    </div>
  );
}
