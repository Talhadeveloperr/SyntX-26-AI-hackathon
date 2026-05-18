import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Brain, BookOpen, Zap, Target, Sparkles } from "lucide-react";
import { login } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";

const FEATURES = [
  { icon: Brain,    text: "AI-powered study sessions" },
  { icon: BookOpen, text: "Smart flashcards & quizzes" },
  { icon: Zap,      text: "Real-time progress tracking" },
  { icon: Target,   text: "Personalised learning paths" },
];

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [errs,    setErrs]    = useState({});

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
    <div style={{ display: "flex", minHeight: "100vh", background: "#051424", overflow: "hidden", position: "relative" }}>

      {/* Background blobs */}
      <div className="auth-blob" style={{ width: 560, height: 560, background: "rgba(192,193,255,0.07)", top: "-140px", left: "-140px", animationDelay: "0s" }} />
      <div className="auth-blob" style={{ width: 420, height: 420, background: "rgba(255,176,205,0.06)", bottom: "-60px", left: "32%", animationDelay: "4s" }} />
      <div className="auth-blob" style={{ width: 280, height: 280, background: "rgba(192,193,255,0.05)", top: "25%", right: "8%", animationDelay: "7s" }} />

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: "0 0 52%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "60px 64px",
        position: "relative", zIndex: 1,
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}>

        {/* Logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "52px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={22} color="#051424" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#d4e4fa", letterSpacing: "-0.02em" }}>
            AI Study OS
          </span>
        </div>

        {/* Hero text */}
        <div style={{ marginBottom: "48px" }}>
          <h1 style={{
            margin: "0 0 14px", fontSize: "48px", fontWeight: 800,
            lineHeight: 1.1, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg,#d4e4fa 30%,#c0c1ff 70%,#ffb0cd 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Study smarter,<br />not harder.
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "rgba(199,196,215,0.55)", lineHeight: 1.6, maxWidth: "360px" }}>
            Your AI-powered academic companion — from deadlines to deep focus, all in one place.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="auth-feature-item" style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "12px 14px", borderRadius: "12px",
              transition: "background 0.2s", cursor: "default",
            }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
                background: "rgba(192,193,255,0.1)", border: "1px solid rgba(192,193,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={16} color="#c0c1ff" strokeWidth={2} />
              </div>
              <span style={{ fontSize: "14px", color: "rgba(199,196,215,0.7)" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom stat strip */}
        <div style={{
          display: "flex", gap: "32px", marginTop: "48px",
          paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          {[["10K+","Students"], ["50K+","Flashcards"], ["99%","Uptime"]].map(([num, label]) => (
            <div key={label}>
              <p style={{ margin: "0 0 2px", fontSize: "22px", fontWeight: 800, color: "#c0c1ff" }}>{num}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 48px", position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>

          {/* Heading */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 800, color: "#d4e4fa", letterSpacing: "-0.02em" }}>
              Welcome back
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.45)" }}>
              Sign in to continue your learning journey
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: "20px", padding: "12px 14px", borderRadius: "10px",
              background: "rgba(255,180,171,0.08)", border: "1px solid rgba(255,180,171,0.25)",
              color: "#ffb4ab", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ fontSize: "16px" }}>⚠</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(199,196,215,0.35)", pointerEvents: "none" }} />
                <input
                  className={`auth-input${errs.email ? " auth-err" : ""}`}
                  style={{ paddingLeft: "40px" }}
                  type="email" name="email" placeholder="you@example.com"
                  value={form.email} onChange={onChange} autoComplete="email"
                />
              </div>
              {errs.email && <p style={errStyle}>{errs.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: "12px", color: "#c0c1ff", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(199,196,215,0.35)", pointerEvents: "none" }} />
                <input
                  className={`auth-input${errs.password ? " auth-err" : ""}`}
                  style={{ paddingLeft: "40px", paddingRight: "44px" }}
                  type={showPw ? "text" : "password"} name="password"
                  placeholder="Enter your password"
                  value={form.password} onChange={onChange} autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: "2px",
                  color: "rgba(199,196,215,0.4)", display: "flex",
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errs.password && <p style={errStyle}>{errs.password}</p>}
            </div>

            {/* Submit */}
            <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: "4px" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={spinnerStyle} /> Signing in…
                </span>
              ) : (
                <> Sign In <ArrowRight size={16} /> </>
              )}
            </button>

            {/* Demo */}
            <button
              type="button"
              className="auth-btn-ghost"
              onClick={() => { setForm({ email: "a@gmail.com", password: "123456" }); setErrs({}); setError(""); }}
            >
              Use demo credentials
            </button>

          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: "12px", color: "rgba(199,196,215,0.3)" }}>New here?</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          </div>

          <Link to="/register" style={{ textDecoration: "none" }}>
            <button type="button" style={{
              width: "100%", padding: "11px", borderRadius: "10px",
              border: "1px solid rgba(192,193,255,0.25)",
              background: "rgba(192,193,255,0.05)",
              color: "#c0c1ff", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.2s",
            }}>
              Create an account
            </button>
          </Link>

        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", marginBottom: "6px",
  fontSize: "12px", fontWeight: 600,
  color: "rgba(199,196,215,0.55)",
  letterSpacing: "0.04em", textTransform: "uppercase",
};
const errStyle = {
  margin: "5px 0 0", fontSize: "11px", color: "#ffb4ab",
};
const spinnerStyle = {
  display: "inline-block", width: "14px", height: "14px",
  border: "2px solid rgba(5,20,36,0.3)",
  borderTopColor: "#051424", borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};
