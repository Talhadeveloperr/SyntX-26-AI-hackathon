import { useContext } from "react";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Download,
  LogOut,
  Trash2,
  Eye,
  Copy
} from "lucide-react";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const fullName = user?.full_name || "Student";
  const email = user?.email || "";
  const initial = fullName[0]?.toUpperCase() || "S";
  const classLevel = user?.class_level || "";
  const institution = user?.institution_name || "";
  const city = user?.city || "";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <Layout title="Profile">
      <div style={{ padding: "28px 32px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: 700, color: "#d4e4fa" }}>
              Profile Settings
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.5)" }}>
              Manage your identity and preferences.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>

            {/* LEFT PANEL */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Avatar */}
              <div className="glass-card" style={{
                borderRadius: "16px",
                padding: "28px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}>
                <div style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "24px",
                  background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                  fontWeight: 800,
                  color: "#051424",
                  marginBottom: "16px"
                }}>
                  {initial}
                </div>

                <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 700, color: "#d4e4fa" }}>
                  {fullName}
                </h3>

                <p style={{ margin: "0 0 4px", fontSize: "13px", color: "rgba(199,196,215,0.5)" }}>
                  {email}
                </p>

                {classLevel && (
                  <p style={{
                    margin: "0 0 16px",
                    fontSize: "12px",
                    color: "rgba(192,193,255,0.6)",
                    background: "rgba(192,193,255,0.08)",
                    border: "1px solid rgba(192,193,255,0.18)",
                    borderRadius: "999px",
                    padding: "3px 10px"
                  }}>
                    {classLevel}
                  </p>
                )}

                <button style={{
                  padding: "7px 18px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(199,196,215,0.7)",
                  fontSize: "12px",
                  cursor: "pointer"
                }}>
                  Change Photo
                </button>
              </div>

              {/* Quick Actions */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "18px" }}>
                <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: "#d4e4fa" }}>
                  Quick Actions
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                  <button style={actionBtn}>
                    <Download size={17} color="#c0c1ff" />
                    Export My Data
                  </button>

                  <button onClick={handleLogout} style={dangerBtn}>
                    <LogOut size={17} color="#ffb4ab" />
                    Sign Out
                  </button>

                  <button style={dangerBtn2}>
                    <Trash2 size={17} color="rgba(255,100,100,0.7)" />
                    Delete Account
                  </button>

                </div>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Personal Info */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
                <p style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>
                  Personal Information
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Full Name" defaultValue={fullName} />
                  <Field label="Email" defaultValue={email} type="email" />
                  <Field label="Institution" defaultValue={institution} />
                  <Field label="City" defaultValue={city} />
                </div>
              </div>

              {/* API KEY */}
              <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
                <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>
                  API Key
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  background: "rgba(1,15,31,0.6)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: "10px"
                }}>
                  <span style={{
                    flex: 1,
                    fontFamily: "monospace",
                    fontSize: "13px",
                    color: "rgba(199,196,215,0.5)"
                  }}>
                    ••••••••••••••••••••••••••••
                  </span>

                  <button style={iconBtn}>
                    <Eye size={18} color="rgba(199,196,215,0.45)" />
                  </button>

                  <button style={iconBtn}>
                    <Copy size={16} color="rgba(199,196,215,0.6)" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ===== Reusable Components ===== */

function Field({ label, defaultValue, type = "text" }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        style={inputStyle}
      />
    </div>
  );
}

/* ===== Styles ===== */

const actionBtn = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "9px",
  border: "none",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(199,196,215,0.7)",
  fontSize: "13px",
  cursor: "pointer"
};

const dangerBtn = {
  ...actionBtn,
  background: "rgba(255,180,171,0.06)",
  color: "#ffb4ab"
};

const dangerBtn2 = {
  ...actionBtn,
  background: "transparent",
  color: "rgba(255,100,100,0.7)"
};

const iconBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center"
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "rgba(199,196,215,0.45)",
  marginBottom: "6px"
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  background: "rgba(1,15,31,0.6)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "9px",
  color: "#d4e4fa",
  fontSize: "13px",
  outline: "none"
};