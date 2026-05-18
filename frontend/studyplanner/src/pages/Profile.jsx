import { useContext, useState } from "react";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { updateProfile } from "../api/authApi";

const CLASS_LEVELS = [
  "High School Freshman", "High School Sophomore", "High School Junior", "High School Senior",
  "Undergraduate Year 1", "Undergraduate Year 2", "Undergraduate Year 3", "Undergraduate Year 4",
  "Graduate Student", "PhD Student", "Professional", "Other",
];

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
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

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
    setSaving(true);
    setError("");
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
      <div style={{ padding: "28px 32px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>

          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 700, color: "#d4e4fa" }}>Profile</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.5)" }}>Manage your account details.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", alignItems: "start" }}>

            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Avatar card */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "20px",
                  background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "34px", fontWeight: 800, color: "#051424",
                  marginBottom: "14px",
                }}>
                  {initial}
                </div>
                <h3 style={{ margin: "0 0 3px", fontSize: "16px", fontWeight: 700, color: "#d4e4fa" }}>
                  {form.full_name || "Student"}
                </h3>
                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "rgba(199,196,215,0.5)" }}>
                  {user?.email}
                </p>
                {user?.role && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700, color: "#81c995",
                    background: "rgba(129,201,149,0.12)", border: "1px solid rgba(129,201,149,0.25)",
                    borderRadius: "999px", padding: "3px 10px", textTransform: "uppercase",
                    letterSpacing: "0.06em", marginBottom: "6px",
                  }}>
                    {user.role}
                  </span>
                )}
                {form.class_level && (
                  <p style={{
                    margin: "6px 0 0", fontSize: "11px", color: "rgba(192,193,255,0.6)",
                    background: "rgba(192,193,255,0.08)", border: "1px solid rgba(192,193,255,0.18)",
                    borderRadius: "999px", padding: "3px 10px",
                  }}>
                    {form.class_level}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "18px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, color: "rgba(199,196,215,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Account</p>
                <button
                  onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "9px", border: "none", background: "rgba(255,180,171,0.06)", color: "#ffb4ab", fontSize: "13px", cursor: "pointer", textAlign: "left", width: "100%" }}
                >
                  <Icon name="logout" size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {error && (
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(255,180,171,0.08)", border: "1px solid rgba(255,180,171,0.25)", color: "#ffb4ab", fontSize: "13px" }}>
                  {error}
                </div>
              )}
              {saved && (
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(129,201,149,0.08)", border: "1px solid rgba(129,201,149,0.25)", color: "#81c995", fontSize: "13px" }}>
                  Changes saved successfully.
                </div>
              )}

              {/* Editable fields */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
                <p style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Personal Information</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                  <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} />

                  <Field label="Email" name="email" value={user?.email || ""} disabled />

                  <Field label="Institution" name="institution_name" value={form.institution_name} onChange={handleChange} placeholder="University / School" />

                  <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="Your city" />

                  <Field label="Age" name="age" value={form.age} onChange={handleChange} type="number" placeholder="Your age" />

                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(199,196,215,0.45)", marginBottom: "7px" }}>
                      Class Level
                    </label>
                    <select
                      name="class_level"
                      value={form.class_level}
                      onChange={handleChange}
                      style={{
                        width: "100%", padding: "9px 12px",
                        background: "rgba(1,15,31,0.6)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "9px", color: form.class_level ? "#d4e4fa" : "rgba(199,196,215,0.35)",
                        fontSize: "13px", outline: "none", boxSizing: "border-box", cursor: "pointer",
                      }}
                    >
                      <option value="">Select class level</option>
                      {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                </div>
              </div>

              {/* Read-only account info */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
                <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Account Info</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <InfoRow label="Student ID" value={user?.student_id} mono />
                  <InfoRow label="Role"       value={user?.role} />
                  <InfoRow label="Email"      value={user?.email} note="Contact support to change your email" />
                </div>
              </div>

              {/* Save bar */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  onClick={handleDiscard}
                  disabled={!isDirty || saving}
                  style={{
                    padding: "10px 20px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent", fontSize: "13px", cursor: isDirty && !saving ? "pointer" : "default",
                    color: isDirty && !saving ? "rgba(199,196,215,0.65)" : "rgba(199,196,215,0.25)",
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  style={{
                    padding: "10px 28px", borderRadius: "9px", border: "none", fontWeight: 700, fontSize: "13px",
                    background: isDirty && !saving ? "linear-gradient(135deg,#c0c1ff,#ffb0cd)" : "rgba(255,255,255,0.07)",
                    color: isDirty && !saving ? "#051424" : "rgba(199,196,215,0.25)",
                    cursor: isDirty && !saving ? "pointer" : "default", transition: "all 0.2s",
                  }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder = "", disabled = false }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(199,196,215,0.45)", marginBottom: "7px" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", padding: "9px 12px",
          background: disabled ? "rgba(255,255,255,0.02)" : "rgba(1,15,31,0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "9px", color: disabled ? "rgba(199,196,215,0.35)" : "#d4e4fa",
          fontSize: "13px", outline: "none", boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
}

function InfoRow({ label, value, note, mono = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "12px", color: "rgba(199,196,215,0.45)", minWidth: "100px" }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: "13px", color: "#d4e4fa", fontFamily: mono ? "monospace" : "inherit", letterSpacing: mono ? "0.05em" : "normal" }}>
          {value || "—"}
        </span>
        {note && <p style={{ margin: "2px 0 0", fontSize: "10px", color: "rgba(199,196,215,0.3)" }}>{note}</p>}
      </div>
    </div>
  );
}
