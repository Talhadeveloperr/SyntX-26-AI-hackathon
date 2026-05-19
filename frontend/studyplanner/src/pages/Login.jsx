import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Brain, BookOpen, Zap, Target, BarChart3, Layers } from "lucide-react";
import { login } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";

const FEATURES = [
  { icon: Brain,    text: "AI-powered study sessions",      sub: "Chat with your documents" },
  { icon: BookOpen, text: "Smart flashcards & quizzes",     sub: "Spaced repetition built-in"  },
  { icon: Zap,      text: "Real-time progress tracking",    sub: "Heatmaps & streak analytics" },
  { icon: Target,   text: "Personalised learning paths",    sub: "Adapted to your weak areas"  },
];

const SOCIAL_PROOF = [
  { initials: "AS", color: "#7c3aed", name: "Ayesha S." },
  { initials: "MR", color: "#22d3ee", name: "Muhammad R." },
  { initials: "FK", color: "#e879f9", name: "Fatima K." },
];

export default function Login() {
  const navigate    = useNavigate();
  const { loginUser } = useContext(AuthContext);
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [errs,    setErrs]    = useState({});
  const [focused, setFocused] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrs(p => ({ ...p, [name]: "" }));
    if (error) setError("");
  }

  function validate() {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrs(e);
    return !Object.keys(e).length;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const res = await login(form);
      loginUser(res.data);
      navigate("/dashboard");
    } catch (err) {
      const s = err.response?.status;
      const m = err.response?.data?.error || err.response?.data?.message;
      setError(
        s === 401 || s === 404 ? "Invalid email or password"
        : m ? m
        : err.request ? "Unable to connect to server"
        : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", overflow: "hidden", position: "relative" }}>

      {/* ── Background Orbs ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="grid-pattern" />
      </div>

      {/* ── LEFT BRANDING PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          flex: "0 0 52%",
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(40px, 5vw, 80px) clamp(32px, 5vw, 72px)",
          position: "relative", zIndex: 1,
          borderRight: "1px solid rgba(124, 58, 237, 0.12)",
        }}
        className="d-none d-lg-flex"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "56px" }}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            style={{
              width: "44px", height: "44px", borderRadius: "13px",
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 24px rgba(124, 58, 237, 0.45)",
            }}
          >
            <Brain size={22} color="#fff" strokeWidth={2} />
          </motion.div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", fontFamily: "Space Grotesk, sans-serif" }}>
            Brain<span style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sync</span>
          </span>
        </div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ marginBottom: "48px" }}
        >
          <h1 style={{
            margin: "0 0 16px",
            fontSize: "clamp(36px, 4vw, 52px)",
            fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em",
            fontFamily: "Space Grotesk, sans-serif",
          }}>
            <span style={{ background: "linear-gradient(135deg, #f0eeff 20%, #a78bfa 60%, #e879f9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Study smarter,
            </span>
            <br />
            <span style={{ color: "var(--text-1)" }}>not harder.</span>
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "var(--text-2)", lineHeight: 1.7, maxWidth: "380px" }}>
            Your AI-powered academic companion — from deadlines to deep focus, all in one intelligent platform.
          </p>
        </motion.div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "48px" }}
        >
          {FEATURES.map(({ icon: Icon, text, sub }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "13px 14px", borderRadius: "14px",
                background: "rgba(124, 58, 237, 0.04)",
                border: "1px solid transparent",
                transition: "all 0.2s", cursor: "default",
              }}
              whileHover={{ background: "rgba(124, 58, 237, 0.08)", borderColor: "rgba(124, 58, 237, 0.2)" }}
            >
              <div style={{
                width: "38px", height: "38px", borderRadius: "11px", flexShrink: 0,
                background: "rgba(124, 58, 237, 0.12)", border: "1px solid rgba(124, 58, 237, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={17} color="#a78bfa" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>{text}</div>
                <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "1px" }}>{sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            display: "flex", alignItems: "center", gap: "16px",
            padding: "18px 20px", borderRadius: "16px",
            background: "rgba(12, 12, 30, 0.6)",
            border: "1px solid rgba(124, 58, 237, 0.15)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div style={{ display: "flex" }}>
            {SOCIAL_PROOF.map(({ initials, color }, i) => (
              <div key={initials} style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: `${color}30`, border: `2px solid ${color}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 800, color,
                marginLeft: i > 0 ? "-8px" : 0, position: "relative", zIndex: 3 - i,
              }}>
                {initials}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-2)" }}>
              Loved by <strong style={{ color: "var(--text-1)" }}>10,000+</strong> students
            </p>
          </div>

          {/* Stats */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "24px" }}>
            {[["10K+", "Students"], ["50K+", "Flashcards"], ["99%", "Uptime"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 800, color: "#a78bfa", fontFamily: "Space Grotesk, sans-serif" }}>{n}</p>
                <p style={{ margin: 0, fontSize: "10px", color: "var(--text-4)" }}>{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── RIGHT FORM PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          flex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "clamp(32px, 5vw, 60px) clamp(24px, 5vw, 56px)",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px" }} className="d-lg-none">
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #7c3aed, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={18} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>
              Brain<span style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sync</span>
            </span>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ marginBottom: "32px" }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", fontFamily: "Space Grotesk, sans-serif" }}>
              Welcome back 👋
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)" }}>
              Sign in to continue your learning journey
            </p>
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                style={{
                  marginBottom: "20px", padding: "13px 16px", borderRadius: "12px",
                  background: "rgba(248, 113, 113, 0.08)",
                  border: "1px solid rgba(248, 113, 113, 0.25)",
                  color: "var(--red)", fontSize: "13px",
                  display: "flex", alignItems: "center", gap: "10px",
                }}
              >
                <span style={{ fontSize: "15px", flexShrink: 0 }}>⚠</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={onSubmit}
            noValidate
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            {/* Email field */}
            <div>
              <label style={labelSt}>Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: focused === "email" ? "#a78bfa" : "var(--text-4)", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  className={`auth-input${errs.email ? " auth-err" : ""}`}
                  style={{ paddingLeft: "42px" }}
                  type="email" name="email" placeholder="you@example.com"
                  value={form.email} onChange={onChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  autoComplete="email"
                />
              </div>
              <AnimatePresence>
                {errs.email && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--red)", overflow: "hidden" }}>
                    {errs.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ ...labelSt, marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: "12px", color: "#a78bfa", textDecoration: "none", fontWeight: 600, transition: "opacity 0.2s" }}
                  onMouseEnter={e => e.target.style.opacity = '0.7'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: focused === "password" ? "#a78bfa" : "var(--text-4)", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  className={`auth-input${errs.password ? " auth-err" : ""}`}
                  style={{ paddingLeft: "42px", paddingRight: "46px" }}
                  type={showPw ? "text" : "password"} name="password"
                  placeholder="Enter your password"
                  value={form.password} onChange={onChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  autoComplete="current-password"
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-3)", display: "flex", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text-1)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </motion.button>
              </div>
              <AnimatePresence>
                {errs.password && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--red)", overflow: "hidden" }}>
                    {errs.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Sign In button */}
            <motion.button
              type="submit"
              className="auth-btn"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{ marginTop: "4px" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={spinSt} /> Signing in…
                </span>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </motion.button>

            {/* Demo */}
            <motion.button
              type="button"
              className="auth-btn-ghost"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => { setForm({ email: "a@gmail.com", password: "123456" }); setErrs({}); setError(""); }}
            >
              Use demo credentials
            </motion.button>
          </motion.form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-4)", fontWeight: 500 }}>New here?</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>

          <Link to="/register" style={{ textDecoration: "none" }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, borderColor: "rgba(124,58,237,0.4)", color: "var(--text-1)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%", padding: "12px", borderRadius: "12px",
                border: "1px solid rgba(124, 58, 237, 0.25)",
                background: "rgba(124, 58, 237, 0.06)",
                color: "#a78bfa", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif",
                transition: "all 0.2s",
              }}
            >
              Create an account →
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

const labelSt = {
  display: "block", marginBottom: "7px",
  fontSize: "11px", fontWeight: 700,
  color: "var(--text-3)",
  letterSpacing: "0.06em", textTransform: "uppercase",
  fontFamily: "Plus Jakarta Sans, sans-serif",
};
const spinSt = {
  display: "inline-block", width: "14px", height: "14px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#fff", borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};
