import { useState, useContext, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { AuthContext } from "../context/AuthContext";
import { sendChatMessage } from "../api/chatApi";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderText(text) {
  return text.split("\n").map((line, i, arr) => (
    <p key={i} style={{ margin: i < arr.length - 1 ? "0 0 7px" : 0, lineHeight: 1.7 }}>
      {line.split(/\*\*(.+?)\*\*/).map((part, j) =>
        j % 2 === 1
          ? <strong key={j} style={{ color: "var(--primary-light)", fontWeight: 700 }}>{part}</strong>
          : part
      )}
    </p>
  ));
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "5px", padding: "14px 18px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={{ scale: [0.7, 1, 0.7], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "var(--primary-light)",
            display: "inline-block",
          }}
        />
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
          fontSize: "11px", color: "var(--text-4)",
        }}
      >
        <Icon name="description" size={13} style={{ color: "var(--text-3)" }} />
        {sources.length} source{sources.length > 1 ? "s" : ""}
        <Icon name={open ? "expand_less" : "expand_more"} size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px", overflow: "hidden" }}
          >
            {sources.map((s, i) => (
              <div key={i} style={{
                padding: "9px 12px", borderRadius: "8px",
                background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary-light)" }}>{s.file_name}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-4)" }}>{Math.round(s.score * 100)}% match</span>
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)", lineHeight: 1.5, wordBreak: "break-word" }}>
                  "…{s.excerpt.trim()}…"
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SmartChat() {
  const { user } = useContext(AuthContext);
  const userInitial = (user?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const studentId   = user?.student_id;

  const [chats,        setChats]        = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input,        setInput]        = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [editingId,    setEditingId]    = useState(null);
  const [editTitle,    setEditTitle]    = useState("");

  const fileInputRef   = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages   = activeChat?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

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

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;
    if (loading) return;

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
      id: Date.now(), sender: "user", time: now(),
      text: promptText, attachments: files.map(f => f.name),
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
      const data = await sendChatMessage({ prompt: promptText, isNewChat: isNew, sessionId: chat?.sessionId, studentId, files });
      const { reply, session_id, sources = [], uploaded_documents = [] } = data;
      const successDocs = uploaded_documents.filter(d => !d.skipped);
      const skippedDocs = uploaded_documents.filter(d => d.skipped);
      const aiMsg = { id: Date.now() + 1, sender: "ai", time: now(), text: reply, sources, skipped: skippedDocs };
      setChats(p => p.map(c => c.id !== chatId ? c : {
        ...c,
        sessionId: session_id ?? c.sessionId,
        messages: [...c.messages, aiMsg],
        documents: [...c.documents.filter(d => !successDocs.some(u => u.file_name === d.file_name)), ...successDocs],
      }));
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Something went wrong. Please try again.";
      setChats(p => p.map(c => c.id !== chatId ? c : {
        ...c,
        messages: [...c.messages, { id: Date.now() + 1, sender: "ai", time: now(), text: errMsg, sources: [], isError: true }],
      }));
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(e) {
    const files = Array.from(e.target.files || []);
    setPendingFiles(p => [...p, ...files.filter(f => !p.some(x => x.name === f.name))]);
    e.target.value = "";
  }

  const canSend = !loading && (input.trim().length > 0 || pendingFiles.length > 0);

  return (
    <Layout title="Smart AI Chat">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={onFileChange} />

      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: "272px", flexShrink: 0,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(124,58,237,0.12)",
          background: "rgba(6,6,17,0.92)",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ padding: "14px 12px 10px", display: "flex", flexDirection: "column", gap: "7px" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={createNewChat}
              style={btnPrimary}
            >
              <Icon name="add" size={15} /> New Chat
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fileInputRef.current?.click()}
              style={btnGhost}
            >
              <Icon name="attach_file" size={15} /> Upload Document
            </motion.button>
          </div>

          <p style={sectionLabel}>Sessions</p>
          <div style={{ flex: "0 0 auto", maxHeight: "200px", overflowY: "auto", padding: "0 8px 10px", display: "flex", flexDirection: "column", gap: "3px" }}>
            {chats.length === 0 ? (
              <p style={{ margin: "8px 6px", fontSize: "12px", color: "var(--text-4)" }}>No sessions yet</p>
            ) : chats.map(chat => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setActiveChatId(chat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                  border: `1px solid ${activeChatId === chat.id ? "rgba(124,58,237,0.4)" : "transparent"}`,
                  background: activeChatId === chat.id ? "rgba(124,58,237,0.1)" : "transparent",
                  position: "relative",
                  transition: "all 0.2s",
                }}
              >
                <Icon name="chat_bubble" size={13} style={{ color: activeChatId === chat.id ? "var(--primary-light)" : "var(--text-4)", flexShrink: 0 }} />
                {editingId === chat.id ? (
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={() => renameChat(chat.id)}
                    onKeyDown={e => { if (e.key === "Enter") renameChat(chat.id); if (e.key === "Escape") setEditingId(null); }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    style={{ flex: 1, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(124,58,237,0.5)", color: "var(--text-1)", fontSize: "12px", borderRadius: "4px", padding: "2px 6px", outline: "none" }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: "12px", color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {chat.title}
                  </span>
                )}
                <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", padding: "2px", display: "flex" }}
                  >
                    <Icon name="edit_note" size={13} />
                  </button>
                  <button
                    onClick={e => deleteChat(chat.id, e)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(248,113,113,0.5)", padding: "2px", display: "flex" }}
                  >
                    <Icon name="delete" size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <p style={sectionLabel}>Documents</p>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {(activeChat?.documents || []).length === 0 ? (
              <p style={{ margin: "8px 6px", fontSize: "12px", color: "var(--text-4)" }}>
                No documents — upload a PDF or TXT with your message
              </p>
            ) : (activeChat?.documents || []).map(doc => (
              <motion.div
                key={doc.file_name}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 10px", borderRadius: "9px",
                  background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)",
                }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: "rgba(232,121,249,0.1)", border: "1px solid rgba(232,121,249,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="description" size={16} style={{ color: "var(--pink)" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.file_name}
                  </p>
                  <p style={{ margin: 0, fontSize: "10px", color: "var(--text-4)" }}>
                    {doc.chunks_indexed} chunks indexed
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(124,58,237,0.1)" }}>
            <div style={{ padding: "9px 11px", borderRadius: "9px", border: "1px solid rgba(124,58,237,0.15)", background: "rgba(124,58,237,0.06)" }}>
              <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: "var(--primary-light)" }}>Session</p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-4)", lineHeight: 1.4 }}>
                {activeChat?.sessionId
                  ? `ID: ${activeChat.sessionId} · ${activeChat.documents?.length || 0} doc(s)`
                  : "No active session"}
              </p>
            </div>
          </div>
        </aside>

        {/* ── CHAT AREA ── */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(6,6,17,0.5)" }}>

          {chats.length === 0 || !activeChatId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "40px" }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "72px", height: "72px", borderRadius: "20px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}
              >
                <Icon name="auto_awesome" size={32} style={{ color: "var(--primary-light)" }} />
              </motion.div>
              <div style={{ textAlign: "center", maxWidth: "360px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "var(--text-1)", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em" }}>
                  Your AI Study Assistant
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)", lineHeight: 1.65 }}>
                  Click <strong style={{ color: "var(--primary-light)" }}>New Chat</strong> to start a session, or upload documents to ask questions about your study materials.
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", maxWidth: "480px" }}>
                {["Summarise my notes", "Quiz me on this topic", "Explain a concept", "Help me study"].map(s => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.04, borderColor: "rgba(124,58,237,0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { createNewChat(); setTimeout(() => setInput(s), 50); }}
                    style={{ padding: "7px 16px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(12,12,30,0.6)", color: "var(--text-2)", fontSize: "13px", cursor: "pointer", fontFamily: "Plus Jakarta Sans, sans-serif" }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
              <AnimatePresence initial={false}>
                {messages.map(msg =>
                  msg.sender === "ai" ? (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: "flex", gap: "14px", maxWidth: "820px" }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        style={{ width: "34px", height: "34px", borderRadius: "50%", background: msg.isError ? "rgba(248,113,113,0.12)" : "rgba(124,58,237,0.15)", border: `1px solid ${msg.isError ? "rgba(248,113,113,0.3)" : "rgba(124,58,237,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", boxShadow: msg.isError ? "none" : "0 0 16px rgba(124,58,237,0.2)" }}
                      >
                        <Icon name="auto_awesome" size={15} style={{ color: msg.isError ? "var(--red)" : "var(--primary-light)" }} />
                      </motion.div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ padding: "14px 18px", borderRadius: "14px", borderTopLeftRadius: "3px", background: msg.isError ? "rgba(248,113,113,0.06)" : "rgba(18,18,40,0.8)", border: `1px solid ${msg.isError ? "rgba(248,113,113,0.2)" : "rgba(124,58,237,0.12)"}`, fontSize: "14px", color: "var(--text-2)", backdropFilter: "blur(8px)" }}>
                          {renderText(msg.text)}
                        </div>
                        {!msg.isError && <SourcesPanel sources={msg.sources} />}
                        {msg.skipped?.length > 0 && (
                          <p style={{ margin: "5px 0 0 4px", fontSize: "11px", color: "var(--gold)" }}>
                            ⚠ {msg.skipped.map(s => s.file_name).join(", ")} — unsupported type, skipped
                          </p>
                        )}
                        <p style={{ margin: "5px 0 0 4px", fontSize: "11px", color: "var(--text-4)" }}>AI · {msg.time}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: "flex", gap: "14px", maxWidth: "760px", marginLeft: "auto", flexDirection: "row-reverse" }}
                    >
                      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,var(--primary),var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", fontSize: "13px", fontWeight: 800, color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>
                        {userInitial}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ padding: "14px 18px", borderRadius: "14px", borderTopRightRadius: "3px", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", fontSize: "14px", color: "var(--text-1)", backdropFilter: "blur(8px)" }}>
                          {renderText(msg.text)}
                        </div>
                        {msg.attachments?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px", justifyContent: "flex-end" }}>
                            {msg.attachments.map(name => (
                              <span key={name} style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "999px", background: "rgba(232,121,249,0.1)", border: "1px solid rgba(232,121,249,0.2)", color: "var(--pink)" }}>
                                📎 {name}
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{ margin: "5px 4px 0 0", fontSize: "11px", color: "var(--text-4)", textAlign: "right" }}>You · {msg.time}</p>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: "14px", maxWidth: "820px" }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(124,58,237,0.2)" }}>
                    <Icon name="auto_awesome" size={15} style={{ color: "var(--primary-light)" }} />
                  </div>
                  <div style={{ borderRadius: "14px", borderTopLeftRadius: "3px", background: "rgba(18,18,40,0.8)", border: "1px solid rgba(124,58,237,0.12)", backdropFilter: "blur(8px)" }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* ── INPUT ── */}
          <div style={{ padding: "12px 24px 20px", borderTop: "1px solid rgba(124,58,237,0.1)", background: "rgba(6,6,17,0.7)", backdropFilter: "blur(12px)" }}>
            <AnimatePresence>
              {pendingFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px", overflow: "hidden" }}
                >
                  {pendingFiles.map(f => (
                    <span key={f.name} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "var(--primary-light)" }}>
                      📎 {f.name}
                      <button type="button" onClick={() => setPendingFiles(p => p.filter(x => x.name !== f.name))} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(167,139,250,0.6)", padding: 0, display: "flex", lineHeight: 1 }}>
                        <Icon name="close" size={12} />
                      </button>
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} style={{ display: "flex", alignItems: "flex-end", gap: "10px", maxWidth: "900px" }}>
              <motion.button
                type="button"
                whileHover={{ color: "var(--primary-light)", scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: "8px", display: "flex", flexShrink: 0 }}
              >
                <Icon name="attach_file" size={20} />
              </motion.button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask anything about your study materials…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                style={{
                  flex: 1, resize: "none", overflow: "hidden",
                  background: "rgba(12,12,30,0.8)", border: "1px solid rgba(124,58,237,0.2)",
                  borderRadius: "12px", padding: "11px 16px",
                  color: "var(--text-1)", fontSize: "14px", outline: "none",
                  fontFamily: "Plus Jakarta Sans, sans-serif", lineHeight: 1.6,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(124,58,237,0.2)"; e.target.style.boxShadow = "none"; }}
              />

              <motion.button
                type="submit"
                disabled={!canSend}
                whileHover={canSend ? { scale: 1.05, boxShadow: "0 4px 20px rgba(124,58,237,0.4)" } : {}}
                whileTap={canSend ? { scale: 0.95 } : {}}
                style={{
                  width: "42px", height: "42px", borderRadius: "12px", border: "none", flexShrink: 0,
                  background: canSend ? "linear-gradient(135deg,#7c3aed,#a78bfa)" : "rgba(255,255,255,0.06)",
                  color: canSend ? "#fff" : "var(--text-4)",
                  cursor: canSend ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <Icon name="send" size={17} />
              </motion.button>
            </form>

            <p style={{ margin: "7px 0 0 50px", fontSize: "11px", color: "var(--text-4)", fontStyle: "italic" }}>
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
  padding: "10px", borderRadius: "10px", border: "1px solid rgba(124,58,237,0.4)",
  background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(167,139,250,0.1))",
  color: "var(--primary-light)", fontSize: "13px", fontWeight: 700, cursor: "pointer",
  fontFamily: "Plus Jakarta Sans, sans-serif",
};
const btnGhost = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
  padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)", color: "var(--text-3)",
  fontSize: "13px", fontWeight: 600, cursor: "pointer",
  fontFamily: "Plus Jakarta Sans, sans-serif",
};
const sectionLabel = {
  margin: "8px 14px 6px", fontSize: "10px", fontWeight: 700,
  letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-4)",
};
