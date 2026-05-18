import { useState } from "react";
import Layout from "../components/Layout";
import Icon from "../components/Icon";

const TOPICS = [
  { name: "Cell Respiration",  pct: 98, color: "#c0c1ff" },
  { name: "Genetic Variation", pct: 85, color: "#ffb0cd" },
  { name: "Neurobiology",      pct: 72, color: "#c0c1ff" },
];

const TAGS = [
  { text: "Mitosis",           accent: true  },
  { text: "Photosynthesis",    accent: false },
  { text: "Cell Membrane",     accent: false },
  { text: "Active Transport",  accent: false },
  { text: "DNA Replication",   accent: true  },
  { text: "Enzyme Kinetics",   accent: false },
  { text: "Homeostasis",       accent: false },
  { text: "Osmosis",           accent: false },
  { text: "ATP Synthesis",     accent: false },
  { text: "Meiosis",           accent: true  },
  { text: "Metabolism",        accent: false },
  { text: "Protein Synthesis", accent: false },
  { text: "Endocytosis",       accent: false },
];

const PAPERS = [
  { name: "Biology Paper 1 2023",  icon: "picture_as_pdf", date: "2 days ago"   },
  { name: "Chemistry Mock V2",     icon: "description",    date: "5 days ago"   },
  { name: "Biology Paper 2 2022",  icon: "picture_as_pdf", date: "1 week ago"   },
  { name: "Physics Unit 4 Scan",   icon: "image",          date: "2 weeks ago"  },
];

const HEAT_LEVELS = Array.from({ length: 36 }, (_, i) => ({
  color: i % 5 === 0 ? "#ffb0cd" : "#c0c1ff",
  opacity: (Math.sin(i * 0.7) * 0.4 + 0.55).toFixed(2),
}));

export default function PastPapers() {
  const [dragging, setDragging] = useState(false);

  return (
    <Layout title="Past Papers Analyzer">
      <div style={{ padding: "28px 32px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); }}
            className="glass-card"
            style={{
              borderRadius: "16px", padding: "48px 32px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              textAlign: "center", minHeight: "220px",
              border: `2px dashed ${dragging ? "rgba(192,193,255,0.5)" : "rgba(192,193,255,0.25)"}`,
              marginBottom: "20px",
            }}
          >
            <Icon name="cloud_upload" size={44} style={{ color: "#c0c1ff", display: "block", marginBottom: "12px" }} />
            <h3 style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700, color: "#d4e4fa" }}>Drag and drop past paper files</h3>
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: "rgba(199,196,215,0.5)" }}>Supports PDF, DOCX, and JPG scans. AI extracts and categorizes topics automatically.</p>
            <button style={{ padding: "9px 24px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "rgba(199,196,215,0.8)", fontSize: "13px", cursor: "pointer" }}>
              Browse Files
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", marginBottom: "20px" }}>

            {/* Heatmap */}
            <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                <div>
                  <p style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Topic Frequency Heatmap</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.4)" }}>Distribution across 50+ analyzed papers</p>
                </div>
                <Icon name="leaderboard" size={20} style={{ color: "rgba(199,196,215,0.3)" }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", height: "160px", alignContent: "flex-start" }}>
                {HEAT_LEVELS.map((cell, i) => (
                  <div
                    key={i}
                    style={{
                      width: "calc(8.33% - 4px)", height: "28px", borderRadius: "3px",
                      background: cell.color, opacity: cell.opacity,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Low Frequency</span>
                <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>High Frequency</span>
              </div>
            </div>

            {/* Predicted topics */}
            <div className="glass-card" style={{ borderRadius: "16px", padding: "22px 24px", display: "flex", flexDirection: "column" }}>
              <p style={{ margin: "0 0 18px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Predicted Topics</p>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                {TOPICS.map(({ name, pct, color }) => (
                  <div key={name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#d4e4fa" }}>{name}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color }}>{pct}% AI</span>
                    </div>
                    <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "999px" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "18px", padding: "10px 12px", borderRadius: "10px", background: "rgba(192,193,255,0.07)", border: "1px solid rgba(192,193,255,0.18)" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#c0c1ff", display: "flex", alignItems: "flex-start", gap: "7px", lineHeight: 1.5 }}>
                  <Icon name="auto_awesome" size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                  High confidence in Cell Respiration based on 5-year cycle analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Tag cloud */}
          <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Extracted Topics</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TAGS.map(({ text, accent }) => (
                <span
                  key={text}
                  style={{
                    padding: "5px 14px", borderRadius: "999px", fontSize: "13px",
                    border: `1px solid ${accent ? "rgba(192,193,255,0.28)" : "rgba(255,255,255,0.1)"}`,
                    background: accent ? "rgba(192,193,255,0.08)" : "rgba(255,255,255,0.04)",
                    color: accent ? "#c0c1ff" : "rgba(199,196,215,0.6)",
                    cursor: "pointer",
                  }}
                >
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* Recent analysis */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#d4e4fa" }}>Recent Analysis</p>
              <button style={{ background: "none", border: "none", color: "#c0c1ff", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0 }}>View History</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
              {PAPERS.map(({ name, icon, date }) => (
                <div key={name} className="glass-card" style={{ borderRadius: "14px", overflow: "hidden", cursor: "pointer" }}>
                  <div style={{ height: "100px", background: "rgba(12,22,35,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={icon} size={36} style={{ color: "rgba(199,196,215,0.3)" }} />
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 600, color: "#d4e4fa" }}>{name}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.4)" }}>Analyzed {date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
