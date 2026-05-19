import { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../api/authApi";
import { User, Mail, Building2, MapPin, Hash, GraduationCap, LogOut, Save, X, CheckCircle, AlertCircle, Shield } from "lucide-react";

const CLASS_LEVELS = [
  "High School Freshman", "High School Sophomore", "High School Junior", "High School Senior",
  "Undergraduate Year 1", "Undergraduate Year 2", "Undergraduate Year 3", "Undergraduate Year 4",
  "Graduate Student", "PhD Student", "Professional", "Other",
];

const panel = {
  padding: "24px", borderRadius: "18px",
  background: "rgba(12, 12, 30, 0.7)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
};

export default function Profile() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name:        user?.full_name        || "",
    class_level:      user?.class_level      || "",
    institution_name: user?.institution_name || "",
    city:             user?.city             || "",
    age:              user?.age              ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const initial = (form.full_name[0] || user?.email?.[0] || "S").toUpperCase();
  const isDirty = (
    form.full_name        !== (user?.full_name        || "") ||
    form.class_level      !== (user?.class_level      || "") ||
    form.institution_name !== (user?.institution_name || "") ||
    form.city             !== (user?.city             || "") ||
    String(form.age)      !== String(user?.age        ?? "")
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSaved(false);
    setError("");
  }

  function handleDiscard() {
    setForm({
      full_name:        user?.full_name        || "",
      class_level:      user?.class_level      || "",
      institution_name: user?.institution_name || "",
      city:             user?.city             || "",
      age:              user?.age              ?? "",
    });
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    if (!form.full_name.trim()) { setError("Full name is required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        full_name:        form.full_name.trim(),
        class_level:      form.class_level      || null,
        institution_name: form.institution_name || null,
        city:             form.city             || null,
        age:              form.age !== "" ? Number(form.age) : null,
      };
      await updateProfile(payload);
      updateUser(payload);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <Layout title="Profile">
      <div style={{ padding: "clamp(20px, 3vw, 32px)", maxWidth: "1000px", margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "28px" }}
        >
          <h2 style={{ margin: "0 0 5px", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800, color: "var(--text-1)", letterSpacing: "-0.03em", fontFamily: "Space Grotesk, sans-serif" }}>
            Your Profile
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)" }}>Manage your account details and preferences.</p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "clamp(220px, 26%, 280px) 1fr", gap: "20px", alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Avatar card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              style={{ ...panel, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "32px 24px" }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  width: "80px", height: "80px", borderRadius: "22px",
                  background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "32px", fontWeight: 800, color: "#fff",
                  marginBottom: "16px",
                  boxShadow: "0 8px 28px rgba(124, 58, 237, 0.45)",
                }}
              >
                {initial}
              </motion.div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>
                {form.full_name || "Student"}
              </h3>
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-3)" }}>
                {user?.email}
              </p>
              {user?.role && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--green)", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "999px", padding: "3px 12px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  {user.role}
                </span>
              )}
              {form.class_level && (
                <span style={{ fontSize: "11px", color: "#a78bfa", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "999px", padding: "3px 10px", marginTop: "6px" }}>
                  {form.class_level}
                </span>
              )}
            </motion.div>

            {/* Account actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={panel}
            >
              <p style={{ margin: "0 0 12px", fontSize: "10px", fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Account</p>
              <motion.button
                whileHover={{ background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)", x: 3 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "10px",
                  border: "1px solid transparent",
                  background: "rgba(248,113,113,0.05)",
                  color: "rgba(248, 113, 113, 0.7)",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  textAlign: "left", width: "100%",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  transition: "all 0.2s",
                }}
              >
                <LogOut size={16} />
                Sign Out
              </motion.button>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Status banners */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: "13px 16px", borderRadius: "12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--red)", fontSize: "13px", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: "13px 16px", borderRadius: "12px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", color: "var(--green)", fontSize: "13px", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <CheckCircle size={16} />
                  Changes saved successfully!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Editable fields */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              style={panel}
            >
              <p style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Personal Information</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                <PremiumField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} icon={User} />
                <PremiumField label="Email" name="email" value={user?.email || ""} icon={Mail} disabled />
                <PremiumField label="Institution" name="institution_name" value={form.institution_name} onChange={handleChange} icon={Building2} placeholder="University / School" />
                <PremiumField label="City" name="city" value={form.city} onChange={handleChange} icon={MapPin} placeholder="Your city" />
                <PremiumField label="Age" name="age" value={form.age} onChange={handleChange} icon={Hash} type="number" placeholder="Your age" />

                {/* Class level */}
                <div>
                  <label style={labelSt}>Class Level</label>
                  <div style={{ position: "relative" }}>
                    <GraduationCap size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />
                    <select
                      name="class_level"
                      value={form.class_level}
                      onChange={handleChange}
                      style={{
                        width: "100%", padding: "10px 12px 10px 36px",
                        background: "rgba(12, 12, 30, 0.6)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px", color: form.class_level ? "var(--text-1)" : "var(--text-4)",
                        fontSize: "13px", outline: "none", boxSizing: "border-box", cursor: "pointer",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        appearance: "none",
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                    >
                      <option value="">Select class level</option>
                      {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account info (read-only) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              style={panel}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={14} color="#a78bfa" />
                </div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif" }}>Account Info</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "Student ID", value: user?.student_id, mono: true },
                  { label: "Role",       value: user?.role       },
                  { label: "Email",      value: user?.email, note: "Contact support to change your email" },
                ].map(({ label, value, note, mono }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-3)", minWidth: "100px" }}>{label}</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-1)", fontFamily: mono ? "JetBrains Mono, monospace" : "inherit", letterSpacing: mono ? "0.04em" : "normal" }}>
                        {value || "—"}
                      </span>
                      {note && <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--text-4)" }}>{note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Save bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
            >
              <motion.button
                whileHover={{ scale: isDirty && !saving ? 1.02 : 1 }}
                whileTap={{ scale: isDirty && !saving ? 0.98 : 1 }}
                onClick={handleDiscard}
                disabled={!isDirty || saving}
                style={{
                  padding: "11px 22px", borderRadius: "11px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent", fontSize: "13px", fontWeight: 600,
                  cursor: isDirty && !saving ? "pointer" : "default",
                  color: isDirty && !saving ? "var(--text-2)" : "var(--text-4)",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  display: "flex", alignItems: "center", gap: "7px",
                  transition: "all 0.2s",
                }}
              >
                <X size={14} /> Discard
              </motion.button>
              <motion.button
                whileHover={{ scale: isDirty && !saving ? 1.03 : 1, boxShadow: isDirty && !saving ? "0 8px 24px rgba(124,58,237,0.4)" : "none" }}
                whileTap={{ scale: isDirty && !saving ? 0.97 : 1 }}
                onClick={handleSave}
                disabled={!isDirty || saving}
                style={{
                  padding: "11px 28px", borderRadius: "11px",
                  border: "none", fontWeight: 700, fontSize: "13px",
                  background: isDirty && !saving ? "linear-gradient(135deg, #7c3aed, #a78bfa)" : "rgba(255,255,255,0.06)",
                  color: isDirty && !saving ? "#fff" : "var(--text-4)",
                  cursor: isDirty && !saving ? "pointer" : "default",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  display: "flex", alignItems: "center", gap: "7px",
                  boxShadow: isDirty && !saving ? "0 4px 16px rgba(124,58,237,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PremiumField({ label, name, value, onChange, type = "text", placeholder = "", disabled = false, icon: Icon }) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ position: "relative" }}>
        {Icon && <Icon size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", pointerEvents: "none" }} />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            padding: Icon ? "10px 12px 10px 36px" : "10px 12px",
            background: disabled ? "rgba(255,255,255,0.02)" : "rgba(12, 12, 30, 0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            color: disabled ? "var(--text-3)" : "var(--text-1)",
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
            cursor: disabled ? "not-allowed" : "text",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={e => {
            if (!disabled) {
              e.target.style.borderColor = "rgba(124,58,237,0.5)";
              e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
            }
          }}
          onBlur={e => {
            e.target.style.borderColor = "rgba(255,255,255,0.08)";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>
    </div>
  );
}

const labelSt = {
  display: "block",
  fontSize: "10px", fontWeight: 700,
  letterSpacing: "0.07em", textTransform: "uppercase",
  color: "var(--text-3)", marginBottom: "7px",
  fontFamily: "Plus Jakarta Sans, sans-serif",
};
