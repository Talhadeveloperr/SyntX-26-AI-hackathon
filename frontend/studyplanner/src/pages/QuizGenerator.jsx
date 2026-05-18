import { useState } from "react";
import Layout from "../components/Layout";
import MaterialIcon from "../components/MaterialIcon";

const TOPICS = ["Quantum Physics Fundamentals", "Modern European History", "Advanced Calculus", "Neurobiology"];
const COUNTS = [10, 20, 50];

const QUESTION = {
  text: "Which principle states that it is impossible to simultaneously know both the precise position and momentum of a particle?",
  options: [
    { id: "a", text: "Schrödinger's Cat Paradox",         state: "neutral"  },
    { id: "b", text: "Heisenberg Uncertainty Principle",  state: "correct"  },
    { id: "c", text: "Planck's Constant Hypothesis",      state: "wrong"    },
    { id: "d", text: "Bohr's Atomic Model",               state: "neutral"  },
  ],
};

function optionStyle(state) {
  if (state === "correct") return { background: "rgba(25,135,84,0.1)", border: "1px solid rgba(25,135,84,0.45)", color: "#81c995" };
  if (state === "wrong")   return { background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.4)", color: "#ffb4ab" };
  return { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(199,196,215,0.75)" };
}

export default function QuizGenerator() {
  const [topic,       setTopic]       = useState(TOPICS[0]);
  const [difficulty,  setDifficulty]  = useState(3);
  const [count,       setCount]       = useState(20);

  const diffLabel = ["", "Easy", "Medium", "Hard"][difficulty];

  return (
    <Layout title="Quiz Generator">
      <div style={{ padding: "28px 32px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>

          {/* Controls */}
          <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "end" }}>

              {/* Topic */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(199,196,215,0.5)", marginBottom: "8px" }}>Topic</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px",
                    background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "9px", color: "#d4e4fa", fontSize: "13px", outline: "none",
                  }}
                >
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(199,196,215,0.5)" }}>Difficulty</label>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#c0c1ff" }}>{diffLabel}</span>
                </div>
                <input
                  type="range" min="1" max="3" value={difficulty}
                  onChange={e => setDifficulty(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#c0c1ff" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  {["Easy","Medium","Hard"].map(l => (
                    <span key={l} style={{ fontSize: "9px", fontWeight: 600, color: "rgba(199,196,215,0.3)", textTransform: "uppercase" }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <label style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(199,196,215,0.5)", marginBottom: "8px" }}>Questions</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {COUNTS.map(n => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      style={{
                        flex: 1, padding: "9px 4px", borderRadius: "8px",
                        border: `1px solid ${count === n ? "rgba(192,193,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                        background: count === n ? "rgba(192,193,255,0.1)" : "transparent",
                        color: count === n ? "#c0c1ff" : "rgba(199,196,215,0.5)",
                        fontSize: "13px", fontWeight: count === n ? 700 : 400, cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Question card */}
          <div className="glass-card" style={{ borderRadius: "16px", padding: "28px 32px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
            {/* Progress line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(255,255,255,0.05)" }}>
              <div style={{ height: "100%", width: "20%", background: "linear-gradient(to right,#c0c1ff,#ffb0cd)" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#c0c1ff", background: "rgba(192,193,255,0.1)", border: "1px solid rgba(192,193,255,0.2)", borderRadius: "999px", padding: "4px 12px" }}>
                Question 4 of {count}
              </span>
              {/* Dots */}
              <div style={{ display: "flex", gap: "4px" }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ width: "28px", height: "3px", borderRadius: "999px", background: i <= 4 ? "#c0c1ff" : "rgba(255,255,255,0.1)" }} />
                ))}
              </div>
            </div>

            <h3 style={{ margin: "0 0 24px", fontSize: "20px", fontWeight: 700, color: "#d4e4fa", lineHeight: 1.4 }}>
              {QUESTION.text}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {QUESTION.options.map(opt => {
                const s = optionStyle(opt.state);
                return (
                  <button
                    key={opt.id}
                    style={{
                      ...s, padding: "14px 18px", borderRadius: "12px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      fontSize: "14px", fontWeight: opt.state === "neutral" ? 400 : 600,
                    }}
                  >
                    <span>{opt.text}</span>
                    {opt.state === "correct" && <MaterialIcon name="check_circle" size={20} style={{ color: "#81c995" }} />}
                    {opt.state === "wrong"   && <MaterialIcon name="cancel" size={20} style={{ color: "#ffb4ab" }} />}
                    {opt.state === "neutral" && <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.18)" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Explanation */}
          <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px", marginBottom: "20px", borderColor: "rgba(192,193,255,0.2)" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(192,193,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MaterialIcon name="auto_awesome" size={20} style={{ color: "#c0c1ff" }} />
              </div>
              <div>
                <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#c0c1ff" }}>AI Explanation</p>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(199,196,215,0.7)", lineHeight: 1.65 }}>
                  The <strong style={{ color: "#d4e4fa" }}>Heisenberg Uncertainty Principle</strong>, formulated in 1927, is a fundamental concept of quantum mechanics. It states that the more precisely the position of a particle is determined, the less precisely its momentum can be known — and vice versa. This is not a measurement limitation but a fundamental property of quantum systems.
                </p>
                <div style={{ display: "flex", gap: "20px", marginTop: "14px" }}>
                  <button style={{ background: "none", border: "none", color: "#c0c1ff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}>
                    <MaterialIcon name="menu_book" size={15} />
                    Read Chapter 4.2
                  </button>
                  <button style={{ background: "none", border: "none", color: "#c0c1ff", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", padding: 0 }}>
                    <MaterialIcon name="bolt" size={15} />
                    Similar questions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button style={{ padding: "10px 24px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(199,196,215,0.6)", fontSize: "14px", cursor: "pointer" }}>
              Skip Question
            </button>
            <button style={{
              padding: "10px 28px", borderRadius: "9px", border: "none",
              background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
              color: "#051424", fontWeight: 700, fontSize: "14px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "7px",
            }}>
              Next Question
              <MaterialIcon name="arrow_forward" size={18} />
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
