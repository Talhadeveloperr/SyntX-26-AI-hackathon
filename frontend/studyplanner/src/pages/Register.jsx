import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Building2, MapPin, Hash, GraduationCap, ArrowRight, Brain, CheckCircle } from "lucide-react";
import { register } from "../api/authApi";

const CLASS_LEVELS = [
  "High School Freshman", "High School Sophomore", "High School Junior", "High School Senior",
  "Undergraduate Year 1", "Undergraduate Year 2", "Undergraduate Year 3", "Undergraduate Year 4",
  "Graduate Student", "PhD Student", "Professional", "Other",
];

const PERKS = [
  { text: "AI-generated study plans tailored to you",      color: "#7c3aed" },
  { text: "Unlimited flashcards & smart quizzes",          color: "#22d3ee" },
  { text: "Deadline tracker with priority alerts",         color: "#34d399" },
  { text: "Focus session analytics & heatmaps",            color: "#e879f9" },
];

export default function Register() {
  const navigate = useNavigate();
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");
  const [focused, setFocused] = useState("");
  const [form,    setForm]    = useState({
    full_name: "", email: "", password: "", confirmPassword: "",
    class_level: "", institution_name: "", city: "", age: "",
  });
  const [errs, setErrs] = useState({});

  function onChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrs(p => ({ ...p, [name]: "" }));
    if (error) setError("");
  }

  function validate() {
    const e = {};
    if (!form.full_name.trim())            e.full_name = "Full name is required";
    else if (form.full_name.length < 3)    e.full_name = "At least 3 characters";
    if (!form.email.trim())                e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password)                    e.password = "Password is required";
    else if (form.password.length < 6)     e.password = "At least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (form.age && (Number(form.age) < 5 || Number(form.age) > 120)) e.age = "Enter a valid age";
    setErrs(e);
    return !Object.keys(e).length;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      await register({
        full_name:        form.full_name,
        email:            form.email,
        password:         form.password,
        class_level:      form.class_level      || null,
        institution_name: form.institution_name || null,
        city:             form.city             || null,
        age:              form.age ? parseInt(form.age) : null,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const m = err.response?.data?.error || err.response?.data?.message;
      setError(m || (err.request ? "Unable to connect to server" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div className="orb orb-1" style={{ position: "fixed" }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: "center", padding: "40px", maxWidth: "400px" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            style={{
              width: "80px", height: "80px", borderRadius: "50%", margin: "0 auto 24px",
              background: "rgba(52, 211, 153, 0.12)", border: "2px solid rgba(52, 211, 153, 0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 40px rgba(52, 211, 153, 0.2)",
            }}
          >
            <CheckCircle size={36} color="#34d399" strokeWidth={2} />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ margin: "0 0 10px", fontSize: "26px", fontWeight: 800, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}
          >
            Account created! 🎉
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{ margin: 0, fontSize: "14px", color: "var(--text-3)" }}
          >
            Redirecting you to sign in…
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.5, delay: 0.3, ease: "linear" }}
            style={{ height: "2px", background: "linear-gradient(90deg, #7c3aed, #34d399)", borderRadius: "99px", marginTop: "24px", transformOrigin: "left" }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", overflow: "hidden", position: "relative" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-pattern" />
      </div>

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          flex: "0 0 48%",
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(40px, 5vw, 80px) clamp(32px, 5vw, 64px)",
          position: "relative", zIndex: 1,
          borderRight: "1px solid rgba(124, 58, 237, 0.12)",
        }}
        className="d-none d-lg-flex"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "52px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: "linear-gradient(135deg, #7c3aed, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 24px rgba(124, 58, 237, 0.45)" }}>
            <Brain size={22} color="#fff" strokeWidth={2} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.02em", fontFamily: "Space Grotesk, sans-serif" }}>
            Brain<span style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sync</span>
          </span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", fontFamily: "Space Grotesk, sans-serif" }}>
            <span style={{ background: "linear-gradient(135deg, #e879f9 0%, #a78bfa 50%, #f0eeff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Your journey
            </span>
            <br />
            <span style={{ color: "var(--text-1)" }}>starts here.</span>
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: "var(--text-2)", lineHeight: 1.7, maxWidth: "360px" }}>
            Join thousands of students levelling up their academics with AI — completely free.
          </p>
        </div>

        {/* Perks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
          {PERKS.map(({ text, color }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, marginTop: "1px",
                background: `${color}15`, border: `1px solid ${color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: "14px", color: "var(--text-2)", lineHeight: 1.55 }}>{text}</span>
            </motion.div>
          ))}
        </div>

        {/* Sign-in link */}
        <div style={{ paddingTop: "28px", borderTop: "1px solid var(--border-subtle)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-3)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 700, transition: "opacity 0.2s" }}
              onMouseEnter={e => e.target.style.opacity = '0.7'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Sign in →
            </Link>
          </p>
        </div>
      </motion.div>

      {/* ── RIGHT FORM PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          flex: 1, overflowY: "auto",
          display: "flex", justifyContent: "center",
          padding: "clamp(32px, 4vw, 56px) clamp(24px, 5vw, 56px)",
          position: "relative", zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "460px", paddingBottom: "32px" }}>

          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }} className="d-lg-none">
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #7c3aed, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={18} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>
              Brain<span style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Sync</span>
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "26px", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", fontFamily: "Space Grotesk, sans-serif" }}>
              Create your account
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)" }}>
              Fill in your details to get started for free
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ marginBottom: "20px", padding: "13px 16px", borderRadius: "12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--red)", fontSize: "13px" }}
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Section label */}
            <SectionLabel text="Required Information" />

            {/* Full name */}
            <FieldRow label="Full Name" error={errs.full_name}>
              <User size={15} style={iconSt(focused === "full_name")} />
              <input
                className={`auth-input${errs.full_name ? " auth-err" : ""}`}
                style={{ paddingLeft: "42px" }}
                type="text" name="full_name" placeholder="Your full name"
                value={form.full_name} onChange={onChange}
                onFocus={() => setFocused("full_name")} onBlur={() => setFocused("")}
                autoComplete="name"
              />
            </FieldRow>

            {/* Email */}
            <FieldRow label="Email Address" error={errs.email}>
              <Mail size={15} style={iconSt(focused === "email")} />
              <input
                className={`auth-input${errs.email ? " auth-err" : ""}`}
                style={{ paddingLeft: "42px" }}
                type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={onChange}
                onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                autoComplete="email"
              />
            </FieldRow>

            {/* Password */}
            <FieldRow label="Password" error={errs.password}>
              <Lock size={15} style={iconSt(focused === "password")} />
              <input
                className={`auth-input${errs.password ? " auth-err" : ""}`}
                style={{ paddingLeft: "42px", paddingRight: "46px" }}
                type={showPw ? "text" : "password"} name="password"
                placeholder="Min. 6 characters"
                value={form.password} onChange={onChange}
                onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={eyeBtnSt}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </FieldRow>

            {/* Confirm password */}
            <FieldRow label="Confirm Password" error={errs.confirmPassword}>
              <Lock size={15} style={iconSt(focused === "confirmPassword")} />
              <input
                className={`auth-input${errs.confirmPassword ? " auth-err" : ""}`}
                style={{ paddingLeft: "42px" }}
                type={showPw ? "text" : "password"} name="confirmPassword"
                placeholder="Repeat your password"
                value={form.confirmPassword} onChange={onChange}
                onFocus={() => setFocused("confirmPassword")} onBlur={() => setFocused("")}
                autoComplete="new-password"
              />
            </FieldRow>

            {/* Optional section */}
            <SectionLabel text="Optional — personalise your experience" />

            {/* 2-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

              {/* Institution */}
              <FieldRow label="Institution" error={errs.institution_name}>
                <Building2 size={15} style={iconSt(focused === "institution_name")} />
                <input
                  className="auth-input"
                  style={{ paddingLeft: "42px" }}
                  type="text" name="institution_name" placeholder="University / School"
                  value={form.institution_name} onChange={onChange}
                  onFocus={() => setFocused("institution_name")} onBlur={() => setFocused("")}
                />
              </FieldRow>

              {/* City */}
              <FieldRow label="City" error={errs.city}>
                <MapPin size={15} style={iconSt(focused === "city")} />
                <input
                  className="auth-input"
                  style={{ paddingLeft: "42px" }}
                  type="text" name="city" placeholder="Your city"
                  value={form.city} onChange={onChange}
                  onFocus={() => setFocused("city")} onBlur={() => setFocused("")}
                />
              </FieldRow>

              {/* Age */}
              <FieldRow label="Age" error={errs.age}>
                <Hash size={15} style={iconSt(focused === "age")} />
                <input
                  className={`auth-input${errs.age ? " auth-err" : ""}`}
                  style={{ paddingLeft: "42px" }}
                  type="number" name="age" placeholder="Your age"
                  value={form.age} onChange={onChange} min={5} max={120}
                  onFocus={() => setFocused("age")} onBlur={() => setFocused("")}
                />
              </FieldRow>

              {/* Class level */}
              <div>
                <label style={labelSt}>Class Level</label>
                <div style={{ position: "relative" }}>
                  <GraduationCap size={15} style={iconSt(focused === "class_level")} />
                  <select
                    className="auth-select"
                    style={{ paddingLeft: "42px" }}
                    name="class_level" value={form.class_level} onChange={onChange}
                    onFocus={() => setFocused("class_level")} onBlur={() => setFocused("")}
                  >
                    <option value="">Select level</option>
                    {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              className="auth-btn"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{ marginTop: "8px" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={spinSt} /> Creating account…
                </span>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </motion.button>

            <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: "11px", color: "var(--text-4)" }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Sub-components ── */
function SectionLabel({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 2px" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{text}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
    </div>
  );
}

function FieldRow({ label, error, children }) {
  const [icon, ...rest] = Array.isArray(children) ? children : [null, children];
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>{icon}</span>}
        {rest}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ margin: "5px 0 0", fontSize: "11px", color: "var(--red)", overflow: "hidden" }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const labelSt = {
  display: "block", marginBottom: "6px",
  fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.06em", color: "var(--text-3)",
  fontFamily: "Plus Jakarta Sans, sans-serif",
};
const iconSt = (focused) => ({
  position: "absolute", left: "14px", top: "50%",
  transform: "translateY(-50%)",
  color: focused ? "#a78bfa" : "var(--text-4)",
  pointerEvents: "none",
  transition: "color 0.2s",
  display: "flex",
});
const eyeBtnSt = {
  position: "absolute", right: "12px", top: "50%",
  transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer",
  padding: "4px", color: "var(--text-3)", display: "flex",
};
const spinSt = {
  display: "inline-block", width: "14px", height: "14px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#fff", borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};
