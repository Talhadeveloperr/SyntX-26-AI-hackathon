import { useState, useContext, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { AuthContext } from "../context/AuthContext";
import { sendChatMessage } from "../api/chatApi";

// ── Helpers ──────────────────────────────────────────────
function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderText(text) {
  return text.split("\n").map((line, i, arr) => (
    <p key={i} style={{ margin: i < arr.length - 1 ? "0 0 7px" : 0, lineHeight: 1.65 }}>
      {line.split(/\*\*(.+?)\*\*/).map((part, j) =>
        j % 2 === 1
          ? <strong key={j} style={{ color: "#d4e4fa", fontWeight: 600 }}>{part}</strong>
          : part
      )}
    </p>
  ));
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "5px", padding: "14px 16px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "rgba(192,193,255,0.5)",
          animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: "inline-block",
        }} />
      ))}
    </div>
  );
}

function SourcesPanel({ sources }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;
  return (
    <div style={{ marginTop: "8px" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          display: "flex", alignItems: "center", gap: "5px",
          fontSize: "11px", color: "rgba(199,196,215,0.45)",
        }}
      >
        <Icon name="description" size={13} style={{ color: "rgba(192,193,255,0.5)" }} />
        {sources.length} source{sources.length > 1 ? "s" : ""}
        <Icon name={open ? "expand_less" : "expand_more"} size={14} />
      </button>
      {open && (
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {sources.map((s, i) => (
            <div key={i} style={{
              padding: "9px 12px", borderRadius: "8px",
              background: "rgba(192,193,255,0.05)", border: "1px solid rgba(192,193,255,0.12)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#c0c1ff" }}>{s.file_name}</span>
                <span style={{ fontSize: "10px", color: "rgba(199,196,215,0.35)" }}>
                  {Math.round(s.score * 100)}% match
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.55)", lineHeight: 1.5, wordBreak: "break-word" }}>
                "…{s.excerpt.trim()}…"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────
export default function SmartChat() {
  const { user } = useContext(AuthContext);
  const userInitial = (user?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const studentId   = user?.student_id;

  const [chats,         setChats]         = useState([]);
  const [activeChatId,  setActiveChatId]  = useState(null);
  const [input,         setInput]         = useState("");
  const [pendingFiles,  setPendingFiles]  = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [editTitle,     setEditTitle]     = useState("");

  const fileInputRef   = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages   = activeChat?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  // ── Chat management ─────────────────────────────────────
  function createNewChat() {
    const id = Date.now();
    setChats(p => [{ id, sessionId: null, title: "New Chat", messages: [], documents: [] }, ...p]);
    setActiveChatId(id);
    setPendingFiles([]);
    setInput("");
  }

  function renameChat(id) {
    if (editTitle.trim()) {
      setChats(p => p.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c));
    }
    setEditingId(null);
  }

  function deleteChat(id, e) {
    e.stopPropagation();
    setChats(p => p.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(chats.find(c => c.id !== id)?.id || null);
  }

  // ── Send ────────────────────────────────────────────────
  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;
    if (loading) return;

    // Auto-create chat if none active
    let chatId = activeChatId;
    let currentChats = chats;
    if (!chatId) {
      const id = Date.now();
      const newChat = { id, sessionId: null, title: "New Chat", messages: [], documents: [] };
      currentChats = [newChat, ...chats];
      setChats(currentChats);
      setActiveChatId(id);
      chatId = id;
    }

    const chat       = currentChats.find(c => c.id === chatId);
    const isNew      = !chat?.sessionId;
    const promptText = text || "Please analyse this document";
    const files      = [...pendingFiles];

    const userMsg = {
      id: Date.now(),
      sender: "user",
      time: now(),
      text: promptText,
      attachments: files.map(f => f.name),
    };

    setChats(p => p.map(c => c.id !== chatId ? c : {
      ...c,
      title: c.title === "New Chat" ? promptText.slice(0, 32) + (promptText.length > 32 ? "…" : "") : c.title,
      messages: [...c.messages, userMsg],
    }));
    setInput("");
    setPendingFiles([]);
    setLoading(true);

    try {
      const data = await sendChatMessage({
        prompt: promptText,
        isNewChat: isNew,
        sessionId: chat?.sessionId,
        studentId,
        files,
      });

      const { reply, session_id, sources = [], uploaded_documents = [] } = data;
      const successDocs = uploaded_documents.filter(d => !d.skipped);
      const skippedDocs = uploaded_documents.filter(d => d.skipped);

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        time: now(),
        text: reply,
        sources,
        skipped: skippedDocs,
      };

      setChats(p => p.map(c => c.id !== chatId ? c : {
        ...c,
        sessionId: session_id ?? c.sessionId,
        messages: [...c.messages, aiMsg],
        documents: [
          ...c.documents.filter(d => !successDocs.some(u => u.file_name === d.file_name)),
          ...successDocs,
        ],
      }));
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Something went wrong. Please try again.";
      setChats(p => p.map(c => c.id !== chatId ? c : {
        ...c,
        messages: [...c.messages, {
          id: Date.now() + 1, sender: "ai", time: now(),
          text: errMsg, sources: [], isError: true,
        }],
      }));
    } finally {
      setLoading(false);
    }
  }

  // ── File handling ───────────────────────────────────────
  function onFileChange(e) {
    const files = Array.from(e.target.files || []);
    setPendingFiles(p => [...p, ...files.filter(f => !p.some(x => x.name === f.name))]);
    e.target.value = "";
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <Layout title="Smart AI Chat">

      {/* Inject typing-dot keyframe once */}
      <style>{`
        @keyframes typing-dot {
          0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
          40%          { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.doc,.docx"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR ───────────────────────────────── */}
        <aside style={{
          width: "272px", flexShrink: 0,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(5,18,32,0.85)",
        }}>
          {/* Actions */}
          <div style={{ padding: "14px 12px 10px", display: "flex", flexDirection: "column", gap: "7px" }}>
            <button onClick={createNewChat} style={btnPrimary}>
              <Icon name="add" size={15} /> New Chat
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={btnGhost}>
              <Icon name="attach_file" size={15} /> Upload Document
            </button>
          </div>

          {/* Chat history */}
          <p style={sectionLabel}>Sessions</p>
          <div style={{ flex: "0 0 auto", maxHeight: "200px", overflowY: "auto", padding: "0 8px 10px", display: "flex", flexDirection: "column", gap: "3px" }}>
            {chats.length === 0 ? (
              <p style={{ margin: "8px 6px", fontSize: "12px", color: "rgba(199,196,215,0.3)" }}>No sessions yet</p>
            ) : chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                  border: `1px solid ${activeChatId === chat.id ? "rgba(192,193,255,0.28)" : "transparent"}`,
                  background: activeChatId === chat.id ? "rgba(192,193,255,0.08)" : "transparent",
                  position: "relative",
                }}
              >
                <Icon name="chat_bubble" size={13} style={{ color: activeChatId === chat.id ? "#c0c1ff" : "rgba(199,196,215,0.35)", flexShrink: 0 }} />
                {editingId === chat.id ? (
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={() => renameChat(chat.id)}
                    onKeyDown={e => { if (e.key === "Enter") renameChat(chat.id); if (e.key === "Escape") setEditingId(null); }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    style={{ flex: 1, background: "rgba(0,0,0,0.5)", border: "1px solid #c0c1ff", color: "#d4e4fa", fontSize: "12px", borderRadius: "4px", padding: "2px 6px", outline: "none" }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: "12px", color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chat.title}
                  </span>
                )}
                <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(199,196,215,0.4)", padding: "2px", display: "flex" }}
                  >
                    <Icon name="edit_note" size={13} />
                  </button>
                  <button
                    onClick={e => deleteChat(chat.id, e)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,180,171,0.45)", padding: "2px", display: "flex" }}
                  >
                    <Icon name="delete" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Documents for active chat */}
          <p style={sectionLabel}>Documents</p>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {(activeChat?.documents || []).length === 0 ? (
              <p style={{ margin: "8px 6px", fontSize: "12px", color: "rgba(199,196,215,0.3)" }}>
                No documents — upload a PDF or TXT with your message
              </p>
            ) : (activeChat?.documents || []).map(doc => (
              <div key={doc.file_name} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 10px", borderRadius: "9px",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: "rgba(255,176,205,0.1)", border: "1px solid rgba(255,176,205,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="description" size={16} style={{ color: "#ffb0cd" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.file_name}
                  </p>
                  <p style={{ margin: 0, fontSize: "10px", color: "rgba(199,196,215,0.4)" }}>
                    {doc.chunks_indexed} chunks indexed
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Session status */}
          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ padding: "9px 11px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,183,131,0.05)" }}>
              <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "#ffb783" }}>Session</p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.45)", lineHeight: 1.4 }}>
                {activeChat?.sessionId
                  ? `ID: ${activeChat.sessionId} · ${activeChat.documents?.length || 0} doc(s)`
                  : "No active session"}
              </p>
            </div>
          </div>
        </aside>

        {/* ── CHAT AREA ──────────────────────────────────── */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Empty state */}
          {chats.length === 0 || !activeChatId ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "40px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(192,193,255,0.1)", border: "1px solid rgba(192,193,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="auto_awesome" size={26} style={{ color: "#c0c1ff" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#d4e4fa" }}>Start a conversation</p>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(199,196,215,0.4)" }}>
                  Click <strong style={{ color: "rgba(199,196,215,0.7)" }}>New Chat</strong> or type below to ask your AI study assistant anything.
                </p>
              </div>
            </div>
          ) : (
            /* Messages */
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "22px" }}>
              {messages.map(msg =>
                msg.sender === "ai" ? (
                  <div key={msg.id} style={{ display: "flex", gap: "12px", maxWidth: "800px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: msg.isError ? "rgba(255,180,171,0.12)" : "rgba(192,193,255,0.12)", border: `1px solid ${msg.isError ? "rgba(255,180,171,0.25)" : "rgba(192,193,255,0.22)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                      <Icon name="auto_awesome" size={14} style={{ color: msg.isError ? "#ffb4ab" : "#c0c1ff" }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ padding: "12px 16px", borderRadius: "12px", borderTopLeftRadius: "2px", background: msg.isError ? "rgba(255,180,171,0.06)" : "rgba(255,255,255,0.05)", border: `1px solid ${msg.isError ? "rgba(255,180,171,0.2)" : "rgba(255,255,255,0.09)"}`, fontSize: "14px", color: "rgba(199,196,215,0.88)" }}>
                        {renderText(msg.text)}
                      </div>
                      {!msg.isError && <SourcesPanel sources={msg.sources} />}
                      {msg.skipped?.length > 0 && (
                        <p style={{ margin: "5px 0 0 4px", fontSize: "11px", color: "#ffb783" }}>
                          ⚠ {msg.skipped.map(s => s.file_name).join(", ")} — unsupported type, skipped
                        </p>
                      )}
                      <p style={{ margin: "5px 0 0 4px", fontSize: "11px", color: "rgba(199,196,215,0.28)" }}>
                        AI · {msg.time}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} style={{ display: "flex", gap: "12px", maxWidth: "760px", marginLeft: "auto", flexDirection: "row-reverse" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", fontSize: "12px", fontWeight: 800, color: "#051424" }}>
                      {userInitial}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ padding: "12px 16px", borderRadius: "12px", borderTopRightRadius: "2px", background: "rgba(192,193,255,0.13)", border: "1px solid rgba(192,193,255,0.22)", fontSize: "14px", color: "#d4e4fa" }}>
                        {renderText(msg.text)}
                      </div>
                      {msg.attachments?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px", justifyContent: "flex-end" }}>
                          {msg.attachments.map(name => (
                            <span key={name} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: "rgba(255,176,205,0.1)", border: "1px solid rgba(255,176,205,0.2)", color: "#ffb0cd" }}>
                              📎 {name}
                            </span>
                          ))}
                        </div>
                      )}
                      <p style={{ margin: "5px 4px 0 0", fontSize: "11px", color: "rgba(199,196,215,0.28)", textAlign: "right" }}>
                        You · {msg.time}
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: "flex", gap: "12px", maxWidth: "800px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(192,193,255,0.12)", border: "1px solid rgba(192,193,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="auto_awesome" size={14} style={{ color: "#c0c1ff" }} />
                  </div>
                  <div style={{ padding: "0", borderRadius: "12px", borderTopLeftRadius: "2px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* ── INPUT AREA ─────────────────────────────── */}
          <div style={{ padding: "12px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

            {/* Staged files */}
            {pendingFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {pendingFiles.map(f => (
                  <span key={f.name} style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    fontSize: "11px", padding: "4px 10px", borderRadius: "999px",
                    background: "rgba(192,193,255,0.1)", border: "1px solid rgba(192,193,255,0.25)",
                    color: "#c0c1ff",
                  }}>
                    📎 {f.name}
                    <button
                      type="button"
                      onClick={() => setPendingFiles(p => p.filter(x => x.name !== f.name))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(192,193,255,0.6)", padding: 0, display: "flex", lineHeight: 1 }}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSend}
              style={{ display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "900px" }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                style={{ background: "none", border: "none", color: "rgba(199,196,215,0.4)", cursor: "pointer", padding: "8px", display: "flex", flexShrink: 0, transition: "color 0.2s" }}
                onMouseOver={e => e.currentTarget.style.color = "#c0c1ff"}
                onMouseOut={e => e.currentTarget.style.color = "rgba(199,196,215,0.4)"}
              >
                <Icon name="attach_file" size={20} />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask anything about your study materials…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                style={{
                  flex: 1, resize: "none", overflow: "hidden",
                  background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", padding: "10px 14px",
                  color: "#d4e4fa", fontSize: "14px", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.55,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(192,193,255,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />

              <button
                type="submit"
                disabled={loading || (!input.trim() && pendingFiles.length === 0)}
                style={{
                  width: "38px", height: "38px", borderRadius: "10px", border: "none", flexShrink: 0,
                  background: loading || (!input.trim() && pendingFiles.length === 0)
                    ? "rgba(255,255,255,0.08)"
                    : "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                  color: loading || (!input.trim() && pendingFiles.length === 0) ? "rgba(199,196,215,0.3)" : "#051424",
                  cursor: loading || (!input.trim() && pendingFiles.length === 0) ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <Icon name="send" size={17} />
              </button>
            </form>

            <p style={{ margin: "7px 0 0 44px", fontSize: "11px", color: "rgba(199,196,215,0.25)", fontStyle: "italic" }}>
              Shift+Enter for new line · Attach PDF, TXT, DOC files
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

const btnPrimary = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  padding: "9px", borderRadius: "9px", border: "1px solid rgba(192,193,255,0.4)",
  background: "linear-gradient(135deg,rgba(192,193,255,0.18),rgba(255,176,205,0.1))",
  color: "#d4e4fa", fontSize: "13px", fontWeight: 600, cursor: "pointer",
};
const btnGhost = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  padding: "9px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)", color: "rgba(199,196,215,0.6)",
  fontSize: "13px", fontWeight: 600, cursor: "pointer",
};
const sectionLabel = {
  margin: "8px 14px 6px", fontSize: "10px", fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(199,196,215,0.3)",
};
