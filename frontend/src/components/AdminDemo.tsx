import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUsersDemo, type DemoUser } from "../services/authService";

function truncate(s: string, n = 24) {
  return s.length <= n ? s : s.slice(0, n) + "…";
}

export default function AdminDemo() {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsersDemo()
      .then(setUsers)
      .catch((e) => {
        const axiosErr = e as { response?: { data?: { message?: string } } };
        setError(axiosErr?.response?.data?.message ?? "Failed to fetch users");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            ⚠ DEVELOPMENT ONLY — Never deploy without authentication
          </div>
          <h1 className="text-3xl font-bold text-white">Database Demo View</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Shows what is actually stored in MongoDB. Demonstrates that passwords and peppers are never stored.
          </p>
        </div>

        {/* Legend */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">What MongoDB Stores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { field: "username", stored: true, note: "Displayed" },
              { field: "email", stored: true, note: "Lowercased" },
              { field: "salt", stored: true, note: "32-char hex" },
              { field: "passwordHash", stored: true, note: "128-char scrypt" },
              { field: "password", stored: false, note: "NEVER stored" },
              { field: "pepper", stored: false, note: "NEVER stored" },
              { field: "confirmPassword", stored: false, note: "Frontend only" },
              { field: "plaintext", stored: false, note: "NEVER stored" },
            ].map((f) => (
              <div key={f.field} className={`flex items-start gap-2 p-3 rounded-lg ${
                f.stored ? "bg-cyber-green/5 border border-cyber-green/15" : "bg-red-500/5 border border-red-500/15"
              }`}>
                <span className={f.stored ? "text-cyber-green" : "text-red-400"}>{f.stored ? "✔" : "✗"}</span>
                <div>
                  <p className={`font-mono text-xs font-semibold ${f.stored ? "text-cyber-green" : "text-red-400"}`}>{f.field}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important note */}
        <div className="glass-card p-5 mb-8 border-l-4 border-cyber-blue">
          <h3 className="text-sm font-semibold text-cyber-blue mb-2">Salt Uniqueness Demonstration</h3>
          <p className="text-xs text-slate-400">
            Register two users with <strong>the same password</strong>. Their <code className="text-cyber-green bg-navy-900 px-1 rounded">salt</code> and
            <code className="text-cyber-green bg-navy-900 px-1 ml-1 rounded">passwordHash</code> will be completely different.
            This is why salts are essential — they prevent rainbow table and pre-computation attacks.
          </p>
        </div>

        {/* Users table */}
        {loading && (
          <div className="text-center py-12 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin mx-auto mb-4"></div>
            Fetching from MongoDB…
          </div>
        )}

        {error && (
          <div className="glass-card p-6 text-red-400 text-center">{error}</div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-slate-400 mb-4">No users registered yet.</p>
            <Link to="/register" className="text-cyber-blue hover:underline">Register a user →</Link>
          </div>
        )}

        {users.length > 0 && (
          <div className="space-y-4">
            {users.map((u, i) => (
              <div key={u.email} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.1))", border: "1px solid rgba(0,212,255,0.2)" }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{u.username}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="cyber-label">Salt <span className="text-cyber-blue normal-case">(stored in DB)</span></p>
                    <p className="hash-display font-mono text-xs">{u.salt}</p>
                    <p className="text-xs text-slate-500 mt-1">{u.salt.length} chars — crypto.randomBytes(16).hex()</p>
                  </div>
                  <div>
                    <p className="cyber-label">Password Hash <span className="text-cyber-green normal-case">(stored in DB)</span></p>
                    <p className="hash-display font-mono text-xs" title={u.passwordHash}>{truncate(u.passwordHash, 48)}</p>
                    <p className="text-xs text-slate-500 mt-1">{u.passwordHash.length} chars — scrypt output (64 bytes)</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Password", value: "❌ Not stored", color: "text-red-400" },
                    { label: "Pepper", value: "❌ Not stored", color: "text-red-400" },
                    { label: "Algorithm", value: "scrypt (N=16384,r=8,p=1)", color: "text-yellow-400" },
                  ].map((item) => (
                    <div key={item.label} className="p-2 rounded-lg bg-navy-900/60 border border-white/5">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className={`text-xs font-mono font-semibold mt-0.5 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4 justify-center">
          <Link to="/login" className="btn-secondary max-w-xs">← Login</Link>
          <Link to="/register" className="btn-secondary max-w-xs">Register →</Link>
        </div>
      </div>
    </div>
  );
}
