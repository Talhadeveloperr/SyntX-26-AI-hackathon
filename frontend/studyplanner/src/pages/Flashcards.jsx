import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { useStudyMaterials } from "../context/StudyMaterialsContext";
import {
  getDecks, createDeck, deleteDeck,
  getCards, addCard, deleteCard, reviewCard,
  getStats,
} from "../api/flashcardsApi";

// ─── constants ────────────────────────────────────────────────────────────────
function toYMD(d) { return new Date(d).toISOString().split("T")[0]; }

const ICONS = [
  "style", "science", "calculate", "translate",
  "history_edu", "psychology", "biotech", "computer",
];

const RATING = {
  Hard:   { icon: "sentiment_very_dissatisfied", color: "#ffb4ab", bg: "255,180,171", next: "1 day"  },
  Medium: { icon: "sentiment_neutral",           color: "#ffb783", bg: "255,183,131", next: "~1 day" },
  Easy:   { icon: "sentiment_very_satisfied",    color: "#81c995", bg: "129,201,149", next: "4+ days"},
};

// ─── component ────────────────────────────────────────────────────────────────
export default function Flashcards() {
  const [decks,        setDecks]        = useState([]);
  const [activeDeck,   setActiveDeck]   = useState(null);
  const [cards,        setCards]        = useState([]);
  const [stats,        setStats]        = useState({ total_due: 0, reviewed_today: 0, streak: 0, total_cards: 0 });

  //const [loading,      setLoading]      = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [mode,         setMode]         = useState("study"); // "study" | "manage"

  // study session state
  const [studyIdx,  setStudyIdx]  = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rated,     setRated]     = useState(null); // "Hard"|"Medium"|"Easy"|null
  const [done,      setDone]      = useState(false);
  const [reviewed,  setReviewed]  = useState(0);

  // form state
  const [showDeckForm, setShowDeckForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [deckForm,     setDeckForm]     = useState({ name: "", icon: "style" });
  const [cardForm,     setCardForm]     = useState({ front_text: "", back_text: "" });
  const [formBusy,     setFormBusy]     = useState(false);
  const [cardMsg,      setCardMsg]      = useState(null);

  // ── Study Materials context ──────────────────────────────────────────────────
  const { subjects, subjectDocs, loading } = useStudyMaterials();
  const [fcSubjectId,     setFcSubjectId]     = useState(null);
  const [generating,      setGenerating]      = useState(false);
  const [generatedCards,  setGeneratedCards]  = useState(null);
  const [genIdx,          setGenIdx]          = useState(0);
  const [genFlipped,      setGenFlipped]      = useState(false);

  const fcSubject  = subjects.find(s => s.id === fcSubjectId) || null;
  const fcDocs     = fcSubjectId ? (subjectDocs[fcSubjectId] || []) : [];

  const DUMMY_CARDS = {
    default: [
      { q: "What is the main concept covered in your uploaded material?",           a: "Review your document for core definitions and foundational ideas." },
      { q: "List three key terms from this subject.",                               a: "Key terms depend on your specific documents — highlight them as you read." },
      { q: "What is the significance of the primary topic?",                        a: "It forms the basis for understanding related subtopics in the subject." },
      { q: "How does this subject connect to real-world applications?",             a: "Practical applications are usually discussed in your reference materials." },
      { q: "Summarise the most important idea in one sentence.",                    a: "Focus on the central argument or theorem presented in your notes." },
    ],
  };

  const handleGenerateFlashcards = () => {
    if (!fcSubject) return;
    const payload = {
      student_id:  1,
      subject_id:  fcSubject.id,
      subject_name: fcSubject.name,
      documents:   fcDocs.map(d => ({ document_id: d.id, file_name: d.name })),
    };
    console.log("Flashcards Generate Payload:", payload);
    setGenerating(true);
    setGeneratedCards(null);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedCards(DUMMY_CARDS.default);
      setGenIdx(0);
      setGenFlipped(false);
    }, 1600);
  };

  const docTypeIconFC = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "pdf")                             return { icon: "picture_as_pdf", color: "#ffb0cd" };
    if (["doc","docx"].includes(ext))              return { icon: "description",    color: "#c0c1ff" };
    if (["ppt","pptx"].includes(ext))              return { icon: "slideshow",      color: "#ffd580" };
    if (["jpg","jpeg","png","gif"].includes(ext))  return { icon: "image",          color: "#81c995" };
    return { icon: "insert_drive_file", color: "rgba(199,196,215,0.5)" };
  };
  // ─────────────────────────────────────────────────────────────────────────────

  // ── loaders ─────────────────────────────────────────────────────────────────
  const loadDecks = useCallback(async (keepActive) => {
    try {
      const [a, b] = await Promise.all([getDecks(), getStats()]);
      setDecks(a.data);
      setStats(b.data);
      if (!keepActive && a.data.length > 0) {
        setActiveDeck(prev => prev ?? a.data[0]);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const loadCards = useCallback(async (deckId) => {
    setCardsLoading(true);
    try {
      const r = await getCards(deckId);
      setCards(r.data);
      setStudyIdx(0);
      setIsFlipped(false);
      setRated(null);
      setDone(false);
      setReviewed(0);
    } catch { /* silent */ }
    finally { setCardsLoading(false); }
  }, []);

  useEffect(() => { loadDecks(false); }, []);
  useEffect(() => { if (activeDeck) loadCards(activeDeck.deck_id); }, [activeDeck]);

  // ── derived ─────────────────────────────────────────────────────────────────
  const today    = toYMD(new Date());
  const dueCards = cards.filter(c => c.next_review <= today);
  const current  = dueCards[studyIdx];

  // ── handlers ────────────────────────────────────────────────────────────────
  function selectDeck(deck) {
    if (activeDeck?.deck_id === deck.deck_id) return;
    setActiveDeck(deck);
    setMode("study");
  }

  async function submitDeck(e) {
    e.preventDefault();
    if (!deckForm.name.trim()) return;
    setFormBusy(true);
    try {
      const r = await createDeck(deckForm);
      setShowDeckForm(false);
      setDeckForm({ name: "", icon: "style" });
      await loadDecks(true);
      // auto-select new deck
      setDecks(prev => {
        const nd = { deck_id: r.data.deck_id, name: deckForm.name, icon: deckForm.icon, total_cards: 0, due_count: 0 };
        setActiveDeck(nd);
        return prev;
      });
      loadDecks(true);
    } catch { /* silent */ }
    finally { setFormBusy(false); }
  }

  async function handleDeleteDeck(id) {
    if (!window.confirm("Delete this deck and all its cards?")) return;
    try {
      await deleteDeck(id);
      if (activeDeck?.deck_id === id) setActiveDeck(null);
      loadDecks(false);
    } catch { /* silent */ }
  }

  async function submitCard(e) {
    e.preventDefault();
    if (!cardForm.front_text.trim() || !cardForm.back_text.trim() || !activeDeck) return;
    setFormBusy(true);
    try {
      await addCard(activeDeck.deck_id, cardForm);
      setCardForm({ front_text: "", back_text: "" });
      flashMsg(true, "Card added to deck!");
      loadCards(activeDeck.deck_id);
      loadDecks(true);
    } catch { flashMsg(false, "Failed to add card."); }
    finally { setFormBusy(false); }
  }

  async function handleDeleteCard(id) {
    try {
      await deleteCard(id);
      loadCards(activeDeck.deck_id);
      loadDecks(true);
    } catch { /* silent */ }
  }

  async function handleRate(rating) {
    if (!current || rated) return;
    setRated(rating);
    try {
      await reviewCard(current.card_id, rating);
      setReviewed(n => n + 1);
      getStats().then(r => setStats(r.data)).catch(() => {});
      setTimeout(() => {
        if (studyIdx + 1 >= dueCards.length) {
          setDone(true);
        } else {
          setStudyIdx(i => i + 1);
          setIsFlipped(false);
          setRated(null);
        }
      }, 550);
    } catch { setRated(null); }
  }

  function restartSession() {
    loadCards(activeDeck.deck_id);
  }

  function flashMsg(ok, text) {
    setCardMsg({ ok, text });
    setTimeout(() => setCardMsg(null), 3000);
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Layout title="Flashcards">
      <div style={{ padding: "32px 40px", maxWidth: "1280px", margin: "0 auto" }}>

        {/* ── Generate from Study Materials ── */}
        {(loading || subjects.length > 0) && (
          <section style={{ marginBottom: "28px" }}>
            <div className="glass-card" style={{ borderRadius: "16px", padding: "20px 24px" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(192,193,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="auto_awesome" size={18} style={{ color: "#c0c1ff" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#d4e4fa" }}>Generate from Study Materials</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.4)" }}>Select a subject, review its documents, and auto-generate flashcards</p>
                </div>
              </div>

              {/* Subject chips */}
              {loading && subjects.length === 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "16px" }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: "30px", width: "100px", borderRadius: "999px", background: "rgba(255,255,255,0.05)", animation: "fc-pulse 1.5s ease infinite" }} />
                  ))}
                </div>
              ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "16px" }}>
                {subjects.map(s => {
                  const isActive = fcSubjectId === s.id;
                  const count    = (subjectDocs[s.id] || []).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setFcSubjectId(isActive ? null : s.id); setGeneratedCards(null); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 13px", borderRadius: "999px", cursor: "pointer",
                        background: isActive ? "rgba(192,193,255,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? "rgba(192,193,255,0.45)" : "rgba(255,255,255,0.1)"}`,
                        color: isActive ? "#c0c1ff" : "rgba(199,196,215,0.6)",
                        fontSize: "12px", fontWeight: 600,
                      }}
                    >
                      <Icon name="folder" size={13} style={{ color: isActive ? "#c0c1ff" : "rgba(199,196,215,0.35)" }} />
                      {s.name}
                      {count > 0 && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: isActive ? "#c0c1ff" : "rgba(199,196,215,0.4)", background: isActive ? "rgba(192,193,255,0.2)" : "rgba(255,255,255,0.07)", borderRadius: "999px", padding: "1px 6px" }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              )}

              {/* Selected subject docs */}
              {fcSubject && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
                  <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(199,196,215,0.4)" }}>
                    Documents in {fcSubject.name}
                  </p>

                  {fcDocs.length === 0 ? (
                    <p style={{ margin: "0 0 14px", fontSize: "12px", color: "rgba(199,196,215,0.3)", fontStyle: "italic" }}>
                      No documents uploaded yet. Go to Quiz Generator to upload files.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                      {fcDocs.map(doc => {
                        const { icon, color } = docTypeIconFC(doc.name);
                        return (
                          <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <Icon name={icon} size={13} style={{ color, flexShrink: 0 }} />
                            <span style={{ fontSize: "11px", color: "rgba(199,196,215,0.65)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Generate button */}
                  <button
                    onClick={handleGenerateFlashcards}
                    disabled={generating}
                    style={{
                      display: "flex", alignItems: "center", gap: "7px",
                      padding: "9px 20px", borderRadius: "10px", border: "none", cursor: generating ? "not-allowed" : "pointer",
                      background: generating ? "rgba(192,193,255,0.1)" : "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                      color: generating ? "#c0c1ff" : "#051424",
                      fontSize: "13px", fontWeight: 700, opacity: generating ? 0.7 : 1,
                      border: generating ? "1px solid rgba(192,193,255,0.25)" : "none",
                    }}
                  >
                    <Icon name={generating ? "hourglass_top" : "auto_awesome"} size={15} />
                    {generating ? "Generating flashcards…" : `Generate Flashcards for ${fcSubject.name}`}
                  </button>
                </div>
              )}

              {/* Generated dummy cards — physical flip cards */}
              {generatedCards && fcSubject && (() => {
                const card = generatedCards[genIdx];
                const hasNext = genIdx + 1 < generatedCards.length;
                const hasNext2 = genIdx + 2 < generatedCards.length;
                return (
                  <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "18px" }}>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#c0c1ff" }}>
                        {generatedCards.length} Cards — {fcSubject.name}
                      </p>
                      <button
                        onClick={() => setGenFlipped(v => !v)}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "4px 10px", borderRadius: "6px", cursor: "pointer",
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(199,196,215,0.5)", fontSize: "10px", fontWeight: 600,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,193,255,0.1)"; e.currentTarget.style.borderColor = "rgba(192,193,255,0.3)"; e.currentTarget.style.color = "#c0c1ff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(199,196,215,0.5)"; }}
                      >
                        <Icon name="flip" size={11} />
                        {genFlipped ? "Show question" : "Click to flip"}
                      </button>
                    </div>

                    {/* Card stage — centered */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>

                      {/* Stack wrapper — gives room for the ghost cards */}
                      <div style={{ position: "relative", width: "300px", height: "190px" }}>

                        {/* Ghost card 2 (furthest back) */}
                        {hasNext2 && (
                          <div style={{
                            position: "absolute", top: "9px", left: "9px",
                            width: "300px", height: "190px", borderRadius: "13px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                          }} />
                        )}

                        {/* Ghost card 1 */}
                        {hasNext && (
                          <div style={{
                            position: "absolute", top: "5px", left: "5px",
                            width: "300px", height: "190px", borderRadius: "13px",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                          }} />
                        )}

                        {/* Active flip card */}
                        <div style={{ position: "absolute", inset: 0, perspective: "900px", zIndex: 1 }}>
                          <div
                            onClick={() => setGenFlipped(v => !v)}
                            style={{
                              position: "relative", width: "100%", height: "100%",
                              transformStyle: "preserve-3d",
                              WebkitTransformStyle: "preserve-3d",
                              transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                              transform: genFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                              borderRadius: "13px",
                              cursor: "pointer",
                            }}
                          >

                            {/* Front */}
                            <div style={{
                              position: "absolute", inset: 0, borderRadius: "13px",
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                              background: "linear-gradient(150deg, rgba(192,193,255,0.13) 0%, rgba(192,193,255,0.05) 100%)",
                              border: "1px solid rgba(192,193,255,0.2)",
                              boxShadow: "0 12px 36px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.09)",
                              display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center",
                              padding: "20px 24px", textAlign: "center",
                            }}>
                              <span style={{ position: "absolute", top: "10px", left: "13px", fontSize: "9px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(192,193,255,0.4)" }}>Q</span>
                              <span style={{ position: "absolute", top: "10px", right: "13px", fontSize: "9px", color: "rgba(199,196,215,0.22)", fontWeight: 600 }}>{genIdx + 1}/{generatedCards.length}</span>

                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#d4e4fa", lineHeight: 1.55 }}>
                                {card.q}
                              </p>

                              <div style={{ position: "absolute", bottom: "9px", display: "flex", alignItems: "center", gap: "4px", color: "rgba(199,196,215,0.2)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", userSelect: "none", pointerEvents: "none" }}>
                                <Icon name="touch_app" size={10} />
                                tap to flip
                              </div>
                            </div>

                            {/* Back */}
                            <div style={{
                              position: "absolute", inset: 0, borderRadius: "13px",
                              backfaceVisibility: "hidden",
                              WebkitBackfaceVisibility: "hidden",
                              transform: "rotateY(180deg)",
                              WebkitTransform: "rotateY(180deg)",
                              background: "linear-gradient(150deg, rgba(129,201,149,0.12) 0%, rgba(129,201,149,0.04) 100%)",
                              border: "1px solid rgba(129,201,149,0.22)",
                              boxShadow: "0 12px 36px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)",
                              display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center",
                              padding: "20px 24px", textAlign: "center",
                            }}>
                              <span style={{ position: "absolute", top: "10px", left: "13px", fontSize: "9px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(129,201,149,0.45)" }}>A</span>
                              <span style={{ position: "absolute", top: "10px", right: "13px", fontSize: "9px", color: "rgba(199,196,215,0.22)", fontWeight: 600 }}>{genIdx + 1}/{generatedCards.length}</span>

                              <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.82)", lineHeight: 1.6 }}>
                                {card.a}
                              </p>

                              <div style={{ position: "absolute", bottom: "9px", display: "flex", alignItems: "center", gap: "4px", color: "rgba(199,196,215,0.2)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", userSelect: "none", pointerEvents: "none" }}>
                                <Icon name="flip" size={10} />
                                tap to flip
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>

                      {/* Dots */}
                      <div style={{ display: "flex", gap: "5px" }}>
                        {generatedCards.map((_, i) => (
                          <button key={i} onClick={() => { setGenIdx(i); setGenFlipped(false); }}
                            style={{
                              width: i === genIdx ? "18px" : "5px", height: "5px",
                              borderRadius: "999px", border: "none", cursor: "pointer", padding: 0,
                              background: i === genIdx ? "#c0c1ff" : "rgba(255,255,255,0.12)",
                              transition: "all 0.22s",
                            }}
                          />
                        ))}
                      </div>

                      {/* Prev / Next */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                          onClick={() => { setGenIdx(i => Math.max(0, i - 1)); setGenFlipped(false); }}
                          disabled={genIdx === 0}
                          style={{
                            width: "30px", height: "30px", borderRadius: "50%", padding: 0,
                            border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                            color: genIdx === 0 ? "rgba(199,196,215,0.15)" : "rgba(199,196,215,0.55)",
                            cursor: genIdx === 0 ? "default" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Icon name="arrow_back" size={13} />
                        </button>

                        <span style={{ fontSize: "11px", color: "rgba(199,196,215,0.35)", fontWeight: 600, minWidth: "38px", textAlign: "center" }}>
                          {genIdx + 1} / {generatedCards.length}
                        </span>

                        <button
                          onClick={() => { setGenIdx(i => Math.min(generatedCards.length - 1, i + 1)); setGenFlipped(false); }}
                          disabled={genIdx === generatedCards.length - 1}
                          style={{
                            width: "30px", height: "30px", borderRadius: "50%", padding: 0,
                            border: `1px solid ${genIdx === generatedCards.length - 1 ? "rgba(255,255,255,0.08)" : "rgba(192,193,255,0.28)"}`,
                            background: genIdx === generatedCards.length - 1 ? "transparent" : "rgba(192,193,255,0.08)",
                            color: genIdx === generatedCards.length - 1 ? "rgba(199,196,215,0.15)" : "#c0c1ff",
                            cursor: genIdx === generatedCards.length - 1 ? "default" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Icon name="arrow_forward" size={13} />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })()}

            </div>
          </section>
        )}

        {/* ── Deck strip ── */}
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(199,196,215,0.4)" }}>
              Your Decks
            </span>
            <button onClick={() => setShowDeckForm(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "10px", border: "1px solid rgba(192,193,255,0.25)", background: showDeckForm ? "rgba(192,193,255,0.12)" : "transparent", color: "#c0c1ff", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              <Icon name={showDeckForm ? "close" : "add"} size={14} />
              New Deck
            </button>
          </div>

          {/* New deck form */}
          {showDeckForm && (
            <form onSubmit={submitDeck} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", padding: "14px 16px", borderRadius: "14px", background: "rgba(192,193,255,0.05)", border: "1px solid rgba(192,193,255,0.15)" }}>
              <input
                autoFocus
                placeholder="Deck name…"
                value={deckForm.name}
                onChange={e => setDeckForm(f => ({ ...f, name: e.target.value }))}
                style={{ flex: 1, minWidth: 0, background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px", color: "#d4e4fa", fontSize: "13px", outline: "none", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "rgba(192,193,255,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <div style={{ display: "flex", gap: "4px" }}>
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setDeckForm(f => ({ ...f, icon: ic }))}
                    style={{ width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${deckForm.icon === ic ? "rgba(192,193,255,0.5)" : "rgba(255,255,255,0.08)"}`, background: deckForm.icon === ic ? "rgba(192,193,255,0.15)" : "transparent", color: deckForm.icon === ic ? "#c0c1ff" : "rgba(199,196,215,0.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "all 0.12s", flexShrink: 0 }}>
                    <Icon name={ic} size={15} />
                  </button>
                ))}
              </div>
              <button type="submit" disabled={formBusy || !deckForm.name.trim()}
                style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#c0c1ff,#a0a2e8)", color: "#051424", fontWeight: 700, fontSize: "13px", cursor: "pointer", flexShrink: 0, opacity: !deckForm.name.trim() ? 0.5 : 1 }}>
                Create
              </button>
            </form>
          )}

          {/* Deck cards */}
          {loading
            ? (
              <div style={{ display: "flex", gap: "12px" }}>
                {[1,2,3].map(i => <div key={i} style={{ minWidth: "178px", height: "96px", borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animation: "fc-pulse 1.5s ease infinite" }}/>)}
              </div>
            )
            : decks.length === 0
              ? (
                <div style={{ padding: "22px", borderRadius: "14px", border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", color: "rgba(199,196,215,0.3)", fontSize: "13px" }}>
                  No decks yet — create your first one above.
                </div>
              )
              : (
                <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                  {decks.map(deck => {
                    const active = activeDeck?.deck_id === deck.deck_id;
                    return (
                      <button key={deck.deck_id} onClick={() => selectDeck(deck)}
                        style={{ minWidth: "178px", padding: "16px", borderRadius: "16px", border: `1px solid ${active ? "rgba(192,193,255,0.4)" : "rgba(255,255,255,0.08)"}`, background: active ? "rgba(192,193,255,0.1)" : "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left", flexShrink: 0, position: "relative" }}>
                        <Icon name={deck.icon} size={22} style={{ color: active ? "#c0c1ff" : "rgba(199,196,215,0.4)", display: "block", marginBottom: "8px" }} />
                        <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "14px", color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.name}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.38)" }}>
                          {deck.total_cards} card{deck.total_cards !== 1 ? "s" : ""}
                          {deck.due_count > 0 && <span style={{ marginLeft: "6px", color: "#c0c1ff", fontWeight: 700 }}>• {deck.due_count} due</span>}
                        </p>
                        <button
                          onClick={ev => { ev.stopPropagation(); handleDeleteDeck(deck.deck_id); }}
                          style={{ position: "absolute", top: "8px", right: "8px", width: "22px", height: "22px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(199,196,215,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                          <Icon name="delete" size={12} />
                        </button>
                      </button>
                    );
                  })}
                </div>
              )
          }
        </section>

        {/* ── Main area ── */}
        {!activeDeck
          ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(199,196,215,0.25)" }}>
              <Icon name="style" size={60} style={{ display: "block", marginBottom: "14px", color: "rgba(199,196,215,0.25)" }} />
              <p style={{ fontSize: "15px", margin: 0 }}>Select a deck above to start studying</p>
            </div>
          )
          : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "28px", alignItems: "start" }}>

              {/* ── LEFT: Study / Manage ── */}
              <div>

                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontFamily: "Geist, sans-serif", fontWeight: 700, fontSize: "22px", color: "#d4e4fa", letterSpacing: "-0.02em" }}>{activeDeck.name}</h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.38)" }}>
                      {activeDeck.total_cards} card{activeDeck.total_cards !== 1 ? "s" : ""}
                      {dueCards.length > 0 && <span style={{ color: "#c0c1ff", fontWeight: 600 }}> • {dueCards.length} due today</span>}
                    </p>
                  </div>
                  {/* Mode switcher */}
                  <div style={{ display: "flex", background: "rgba(1,15,31,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "4px", gap: "4px" }}>
                    {[{ k: "study", ico: "school", lbl: "Study" }, { k: "manage", ico: "list", lbl: "Cards" }].map(({ k, ico, lbl }) => (
                      <button key={k} onClick={() => setMode(k)}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s", background: mode === k ? "rgba(192,193,255,0.12)" : "transparent", color: mode === k ? "#c0c1ff" : "rgba(199,196,215,0.5)", boxShadow: mode === k ? "0 0 0 1px rgba(192,193,255,0.2)" : "none" }}>
                        <Icon name={ico} size={14} />
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── STUDY MODE ── */}
                {mode === "study" && (
                  cardsLoading
                    ? <div style={{ height: "340px", borderRadius: "24px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animation: "fc-pulse 1.5s ease infinite" }}/>
                    : dueCards.length === 0
                      ? <AllCaughtUp onBrowse={() => setMode("manage")} />
                      : done
                        ? <SessionComplete reviewed={reviewed} onRestart={restartSession} />
                        : (
                          <>
                            {/* Progress bar */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#c0c1ff", whiteSpace: "nowrap" }}>
                                DUE: {dueCards.length}
                              </span>
                              <div style={{ flex: 1, height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.round((reviewed / dueCards.length) * 100)}%`, background: "linear-gradient(to right,#c0c1ff,#ffb0cd)", borderRadius: "999px", transition: "width 0.5s ease" }}/>
                              </div>
                              <span style={{ fontSize: "11px", color: "rgba(199,196,215,0.38)", whiteSpace: "nowrap" }}>
                                {reviewed} / {dueCards.length}
                              </span>
                            </div>

                            {/* Flip card */}
                            <div style={{ perspective: "1200px", cursor: rated ? "default" : "pointer", marginBottom: "20px" }}
                              onClick={() => { if (!rated) setIsFlipped(v => !v); }}>
                              <div style={{ position: "relative", width: "100%", aspectRatio: "1.75 / 1", transformStyle: "preserve-3d", transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", borderRadius: "24px" }}>

                                {/* ── Front ── */}
                                <div style={{ position: "absolute", inset: 0, borderRadius: "24px", backfaceVisibility: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px", textAlign: "center", overflow: "hidden" }}>
                                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#c0c1ff", marginBottom: "18px" }}>Question</span>
                                  <p style={{ fontFamily: "Geist, sans-serif", fontSize: "clamp(15px,2.2vw,24px)", fontWeight: 600, color: "#d4e4fa", lineHeight: 1.45, margin: 0, maxWidth: "520px" }}>
                                    {current?.front_text}
                                  </p>
                                  <div style={{ position: "absolute", bottom: "18px", display: "flex", alignItems: "center", gap: "5px", color: "rgba(199,196,215,0.28)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", userSelect: "none" }}>
                                    <Icon name="touch_app" size={13} />
                                    Click to reveal
                                  </div>
                                </div>

                                {/* ── Back ── */}
                                <div style={{ position: "absolute", inset: 0, borderRadius: "24px", backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "44px", textAlign: "center", overflow: "hidden" }}>
                                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#81c995", marginBottom: "18px" }}>Answer</span>
                                  <p style={{ fontSize: "clamp(13px,1.8vw,18px)", color: "#d4e4fa", lineHeight: 1.7, margin: 0, maxWidth: "520px" }}>
                                    {current?.back_text}
                                  </p>
                                  <div style={{ position: "absolute", bottom: "18px", display: "flex", alignItems: "center", gap: "5px", color: "rgba(199,196,215,0.28)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", userSelect: "none" }}>
                                    <Icon name="low_priority" size={13} />
                                    Rate to advance
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Rating buttons */}
                            <div style={{ display: "flex", gap: "12px", transition: "opacity 0.3s", opacity: isFlipped ? 1 : 0.3, pointerEvents: isFlipped && !rated ? "auto" : "none" }}>
                              {Object.entries(RATING).map(([rKey, cfg]) => {
                                const isSelected = rated === rKey;
                                return (
                                  <button key={rKey} onClick={() => handleRate(rKey)}
                                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "14px 8px", borderRadius: "16px", border: `1px solid ${isSelected ? `rgba(${cfg.bg},0.5)` : "rgba(255,255,255,0.1)"}`, background: isSelected ? `rgba(${cfg.bg},0.12)` : "rgba(255,255,255,0.03)", color: cfg.color, cursor: "pointer" }}>
                                    <Icon name={cfg.icon} size={26} />
                                    <span style={{ fontSize: "13px", fontWeight: 700 }}>{rKey}</span>
                                    <span style={{ fontSize: "10px", fontWeight: 600, opacity: 0.6, letterSpacing: "0.04em" }}>{cfg.next}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Card counter chip */}
                            <div style={{ display: "flex", justifyContent: "center", marginTop: "14px" }}>
                              <span style={{ fontSize: "11px", color: "rgba(199,196,215,0.3)", letterSpacing: "0.04em" }}>
                                Card {studyIdx + 1} of {dueCards.length}
                                {current?.review_count > 0 && ` • ${current.review_count} review${current.review_count > 1 ? "s" : ""}`}
                              </span>
                            </div>
                          </>
                        )
                )}

                {/* ── MANAGE MODE ── */}
                {mode === "manage" && (
                  cardsLoading
                    ? [1,2,3,4].map(i => <div key={i} style={{ height: "66px", borderRadius: "14px", marginBottom: "8px", background: "rgba(255,255,255,0.04)", animation: "fc-pulse 1.5s ease infinite" }}/>)
                    : cards.length === 0
                      ? (
                        <div style={{ textAlign: "center", padding: "48px 20px", color: "rgba(199,196,215,0.3)", fontSize: "13px" }}>
                          <Icon name="style" size={40} style={{ display: "block", marginBottom: "10px", opacity: 0.4, color: "rgba(199,196,215,0.3)" }} />
                          No cards yet — add your first card on the right.
                        </div>
                      )
                      : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {cards.map((card, idx) => {
                            const isDue = card.next_review <= today;
                            return (
                              <div key={card.card_id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "13px 15px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${isDue ? "rgba(192,193,255,0.14)" : "rgba(255,255,255,0.07)"}`, transition: "border-color 0.15s" }}>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(199,196,215,0.25)", paddingTop: "3px", minWidth: "22px" }}>#{idx + 1}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 600, color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.front_text}</p>
                                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.38)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.back_text}</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                                  {isDue && (
                                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#c0c1ff", background: "rgba(192,193,255,0.1)", border: "1px solid rgba(192,193,255,0.2)", borderRadius: "999px", padding: "2px 8px", letterSpacing: "0.04em" }}>DUE</span>
                                  )}
                                  <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.25)" }}>{card.next_review}</span>
                                  <DangerBtn onClick={() => handleDeleteCard(card.card_id)} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                )}
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

                {/* Add Card */}
                <div className="glass-card" style={{ borderRadius: "18px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showCardForm ? "16px" : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,176,205,0.1)", border: "1px solid rgba(255,176,205,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="add_card" size={17} style={{ color: "#ffb0cd" }} />
                      </div>
                      <p style={{ margin: 0, fontFamily: "Geist, sans-serif", fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>Add New Card</p>
                    </div>
                    <button onClick={() => setShowCardForm(v => !v)}
                      style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: showCardForm ? "rgba(255,176,205,0.1)" : "rgba(255,255,255,0.04)", color: showCardForm ? "#ffb0cd" : "rgba(199,196,215,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "all 0.15s" }}>
                      <Icon name={showCardForm ? "expand_less" : "expand_more"} size={16} />
                    </button>
                  </div>

                  {showCardForm && (
                    <>
                      {cardMsg && (
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 12px", marginBottom: "12px", borderRadius: "10px", fontSize: "12px", fontWeight: 500, background: cardMsg.ok ? "rgba(192,193,255,0.1)" : "rgba(255,180,171,0.1)", border: `1px solid ${cardMsg.ok ? "rgba(192,193,255,0.2)" : "rgba(255,180,171,0.2)"}`, color: cardMsg.ok ? "#c0c1ff" : "#ffb4ab" }}>
                          <Icon name={cardMsg.ok ? "check_circle" : "error"} size={13} />
                          {cardMsg.text}
                        </div>
                      )}
                      <form onSubmit={submitCard} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <TextareaField label="Front — Question" placeholder="e.g. What is mitosis?" value={cardForm.front_text} onChange={v => setCardForm(f => ({ ...f, front_text: v }))} />
                        <TextareaField label="Back — Answer" placeholder="e.g. Cell division producing two genetically identical cells." value={cardForm.back_text} onChange={v => setCardForm(f => ({ ...f, back_text: v }))} />
                        <button type="submit" disabled={formBusy}
                          style={{ padding: "10px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#ffb0cd,#e890b0)", color: "#051424", fontWeight: 700, fontSize: "13px", cursor: formBusy ? "not-allowed" : "pointer", opacity: formBusy ? 0.65 : 1, transition: "opacity 0.2s" }}>
                          {formBusy ? "Adding…" : "Add Card"}
                        </button>
                      </form>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="glass-card" style={{ borderRadius: "18px", padding: "20px" }}>
                  <p style={{ margin: "0 0 14px", fontFamily: "Geist, sans-serif", fontWeight: 700, fontSize: "14px", color: "#d4e4fa" }}>Overview</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                    <StatRow icon="pending" color="#c0c1ff" label="Due Today" value={stats.total_due} />
                    <StatRow icon="check_circle" color="#81c995" label="Reviewed Today" value={stats.reviewed_today} />
                    <StatRow icon="local_fire_department" color="#ffb783" label="Day Streak" value={`${stats.streak}d`} />
                    <StatRow icon="style" color="#ffb0cd" label="Total Cards" value={stats.total_cards} />
                  </div>
                </div>

                {/* Spaced repetition info */}
                <div style={{ borderRadius: "18px", padding: "18px 20px", background: "rgba(192,193,255,0.04)", border: "1px solid rgba(192,193,255,0.11)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <Icon name="auto_awesome" size={16} style={{ color: "#c0c1ff" }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#c0c1ff", letterSpacing: "0.08em", textTransform: "uppercase" }}>Spaced Repetition</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(199,196,215,0.55)", lineHeight: 1.65, fontStyle: "italic" }}>
                    Cards you find <b style={{ color: "#81c995", fontStyle: "normal" }}>Easy</b> are shown less often. <b style={{ color: "#ffb4ab", fontStyle: "normal" }}>Hard</b> cards come back tomorrow. Rate honestly for best results.
                  </p>
                </div>
              </div>

            </div>
          )
        }
      </div>

      <style>{`
        @keyframes fc-pulse { 0%,100%{opacity:1}50%{opacity:0.45} }
        textarea::placeholder { color:rgba(199,196,215,0.25); }
      `}</style>
    </Layout>
  );
}

// ─── helper components ─────────────────────────────────────────────────────────

function AllCaughtUp({ onBrowse }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px", borderRadius: "24px", background: "rgba(129,201,149,0.04)", border: "1px solid rgba(129,201,149,0.14)" }}>
      <Icon name="check_circle" size={52} style={{ color: "#81c995", display: "block", marginBottom: "12px" }} />
      <p style={{ fontFamily: "Geist, sans-serif", fontWeight: 700, fontSize: "22px", color: "#d4e4fa", margin: "0 0 6px" }}>All caught up!</p>
      <p style={{ fontSize: "13px", color: "rgba(199,196,215,0.4)", margin: "0 0 24px", lineHeight: 1.6 }}>No cards are due in this deck right now.<br/>Come back tomorrow to keep your streak alive.</p>
      <button onClick={onBrowse}
        style={{ padding: "10px 22px", borderRadius: "12px", border: "1px solid rgba(192,193,255,0.25)", background: "rgba(192,193,255,0.08)", color: "#c0c1ff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
        Browse Cards
      </button>
    </div>
  );
}

function SessionComplete({ reviewed, onRestart }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px", borderRadius: "24px", background: "rgba(192,193,255,0.05)", border: "1px solid rgba(192,193,255,0.15)" }}>
      <Icon name="celebration" size={52} style={{ color: "#c0c1ff", display: "block", marginBottom: "12px" }} />
      <p style={{ fontFamily: "Geist, sans-serif", fontWeight: 700, fontSize: "22px", color: "#d4e4fa", margin: "0 0 6px" }}>Session complete!</p>
      <p style={{ fontSize: "13px", color: "rgba(199,196,215,0.45)", margin: "0 0 4px" }}>
        You reviewed <b style={{ color: "#d4e4fa" }}>{reviewed}</b> card{reviewed !== 1 ? "s" : ""}.
      </p>
      <p style={{ fontSize: "12px", color: "rgba(199,196,215,0.3)", margin: "0 0 24px" }}>Cards scheduled via spaced repetition.</p>
      <button onClick={onRestart}
        style={{ padding: "10px 24px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#c0c1ff,#a0a2e8)", color: "#051424", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
        Review Again
      </button>
    </div>
  );
}

function TextareaField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(199,196,215,0.38)", display: "block", marginBottom: "5px" }}>{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required rows={3}
        style={{ width: "100%", background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "9px 12px", color: "#d4e4fa", fontSize: "13px", resize: "vertical", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit", lineHeight: 1.5 }}
        onFocus={e => e.target.style.borderColor = "rgba(255,176,205,0.4)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
      />
    </div>
  );
}

function StatRow({ icon, color, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "rgba(199,196,215,0.5)" }}>
        <Icon name={icon} size={14} style={{ color, flexShrink: 0 }} />
        {label}
      </div>
      <span style={{ fontSize: "14px", fontWeight: 700, color: "#d4e4fa" }}>{value}</span>
    </div>
  );
}

function DangerBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "24px", height: "24px", borderRadius: "7px",
        border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
        color: "rgba(199,196,215,0.35)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0, flexShrink: 0,
      }}
    >
      <Icon name="delete" size={12} />
    </button>
  );
}
