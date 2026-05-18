import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, Building2, MapPin, Hash, GraduationCap, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { register } from "../api/authApi";

const CLASS_LEVELS = [
  "High School Freshman", "High School Sophomore", "High School Junior", "High School Senior",
  "Undergraduate Year 1", "Undergraduate Year 2", "Undergraduate Year 3", "Undergraduate Year 4",
  "Graduate Student", "PhD Student", "Professional", "Other",
];

const PERKS = [
  "AI-generated study plans tailored to you",
  "Unlimited flashcards & smart quizzes",
  "Deadline tracker with priority alerts",
  "Focus session analytics & heatmaps",
];

export default function Register() {
  const navigate = useNavigate();

  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");
  const [form,     setForm]     = useState({
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
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      const m = err.response?.data?.error || err.response?.data?.message;
      setError(m || (err.request ? "Unable to connect to server" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#051424", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%", margin: "0 auto 20px",
            background: "rgba(129,201,149,0.15)", border: "1px solid rgba(129,201,149,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={32} color="#81c995" />
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#d4e4fa" }}>Account created!</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.5)" }}>Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#051424", overflow: "hidden", position: "relative" }}>

      {/* Background blobs */}
      <div className="auth-blob" style={{ width: 500, height: 500, background: "rgba(255,176,205,0.07)", top: "-100px", right: "-80px", animationDelay: "0s" }} />
      <div className="auth-blob" style={{ width: 380, height: 380, background: "rgba(192,193,255,0.06)", bottom: "-60px", left: "38%", animationDelay: "5s" }} />
      <div className="auth-blob" style={{ width: 260, height: 260, background: "rgba(255,183,131,0.04)", top: "40%", left: "5%", animationDelay: "2s" }} />

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: "0 0 48%", display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "60px 56px",
        position: "relative", zIndex: 1,
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "52px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={22} color="#051424" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#d4e4fa", letterSpacing: "-0.02em" }}>AI Study OS</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{
            margin: "0 0 14px", fontSize: "44px", fontWeight: 800,
            lineHeight: 1.1, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg,#ffb0cd 0%,#c0c1ff 50%,#d4e4fa 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Your journey<br />starts here.
          </h1>
          <p style={{ margin: 0, fontSize: "15px", color: "rgba(199,196,215,0.5)", lineHeight: 1.65, maxWidth: "340px" }}>
            Join thousands of students levelling up their academics with AI.
          </p>
        </div>

        {/* Perks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "44px" }}>
          {PERKS.map(perk => (
            <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, marginTop: "1px",
                background: "rgba(192,193,255,0.12)", border: "1px solid rgba(192,193,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="#c0c1ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: "13px", color: "rgba(199,196,215,0.6)", lineHeight: 1.5 }}>{perk}</span>
            </div>
          ))}
        </div>

        {/* Divider + sign-in link */}
        <div style={{ paddingTop: "28px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(199,196,215,0.4)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#c0c1ff", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (scrollable form) ── */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex",
        justifyContent: "center", padding: "48px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ width: "100%", maxWidth: "440px", paddingBottom: "24px" }}>

          <div style={{ marginBottom: "28px" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "#d4e4fa", letterSpacing: "-0.02em" }}>
              Create account
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.45)" }}>
              Fill in your details to get started
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: "20px", padding: "12px 14px", borderRadius: "10px",
              background: "rgba(255,180,171,0.08)", border: "1px solid rgba(255,180,171,0.25)",
              color: "#ffb4ab", fontSize: "13px",
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Section: Required */}
            <SectionLabel text="Required" />

            {/* Full name */}
            <Field label="Full Name" error={errs.full_name}>
              <User size={15} />
              <input
                className={`auth-input${errs.full_name ? " auth-err" : ""}`}
                style={{ paddingLeft: "40px" }}
                type="text" name="full_name" placeholder="Your full name"
                value={form.full_name} onChange={onChange} autoComplete="name"
              />
            </Field>

            {/* Email */}
            <Field label="Email Address" error={errs.email}>
              <Mail size={15} />
              <input
                className={`auth-input${errs.email ? " auth-err" : ""}`}
                style={{ paddingLeft: "40px" }}
                type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={onChange} autoComplete="email"
              />
            </Field>

            {/* Password */}
            <Field label="Password" error={errs.password}>
              <Lock size={15} />
              <input
                className={`auth-input${errs.password ? " auth-err" : ""}`}
                style={{ paddingLeft: "40px", paddingRight: "44px" }}
                type={showPw ? "text" : "password"} name="password"
                placeholder="Min. 6 characters"
                value={form.password} onChange={onChange} autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={eyeBtn}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            {/* Confirm password */}
            <Field label="Confirm Password" error={errs.confirmPassword}>
              <Lock size={15} />
              <input
                className={`auth-input${errs.confirmPassword ? " auth-err" : ""}`}
                style={{ paddingLeft: "40px" }}
                type={showPw ? "text" : "password"} name="confirmPassword"
                placeholder="Repeat your password"
                value={form.confirmPassword} onChange={onChange} autoComplete="new-password"
              />
            </Field>

            {/* Section: Optional */}
            <SectionLabel text="Optional — help us personalise your experience" />

            {/* 2-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

              {/* Institution */}
              <Field label="Institution" error={errs.institution_name}>
                <Building2 size={15} />
                <input
                  className="auth-input"
                  style={{ paddingLeft: "40px" }}
                  type="text" name="institution_name" placeholder="University / School"
                  value={form.institution_name} onChange={onChange}
                />
              </Field>

              {/* City */}
              <Field label="City" error={errs.city}>
                <MapPin size={15} />
                <input
                  className="auth-input"
                  style={{ paddingLeft: "40px" }}
                  type="text" name="city" placeholder="Your city"
                  value={form.city} onChange={onChange}
                />
              </Field>

              {/* Age */}
              <Field label="Age" error={errs.age}>
                <Hash size={15} />
                <input
                  className={`auth-input${errs.age ? " auth-err" : ""}`}
                  style={{ paddingLeft: "40px" }}
                  type="number" name="age" placeholder="Your age"
                  value={form.age} onChange={onChange} min={5} max={120}
                />
              </Field>

              {/* Class level */}
              <div>
                <label style={labelSt}>Class Level</label>
                <div style={{ position: "relative" }}>
                  <GraduationCap size={15} style={iconSt} />
                  <select
                    className="auth-select"
                    style={{ paddingLeft: "40px" }}
                    name="class_level" value={form.class_level} onChange={onChange}
                  >
                    <option value="">Select level</option>
                    {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

            </div>

            {/* Submit */}
            <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: "6px" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={spinSt} /> Creating account…
                </span>
              ) : (
                <> Create Account <ArrowRight size={16} /> </>
              )}
            </button>

            <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: "11px", color: "rgba(199,196,215,0.28)" }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 2px" }}>
      <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(199,196,215,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{text}</span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

function Field({ label, error, children }) {
  const [icon, ...rest] = Array.isArray(children) ? children : [null, children];
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <span style={iconSt}>{icon}</span>}
        {rest}
      </div>
      {error && <p style={{ margin: "5px 0 0", fontSize: "11px", color: "#ffb4ab" }}>{error}</p>}
    </div>
  );
}

const labelSt = {
  display: "block", marginBottom: "6px",
  fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.05em", color: "rgba(199,196,215,0.5)",
};
const iconSt = {
  position: "absolute", left: "14px", top: "50%",
  transform: "translateY(-50%)",
  color: "rgba(199,196,215,0.35)", pointerEvents: "none",
  display: "flex",
};
const eyeBtn = {
  position: "absolute", right: "12px", top: "50%",
  transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer",
  padding: "2px", color: "rgba(199,196,215,0.4)", display: "flex",
};
const spinSt = {
  display: "inline-block", width: "14px", height: "14px",
  border: "2px solid rgba(5,20,36,0.3)",
  borderTopColor: "#051424", borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
};
