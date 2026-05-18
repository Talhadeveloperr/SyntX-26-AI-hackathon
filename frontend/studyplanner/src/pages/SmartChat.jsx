// frontend/studyplanner/src/pages/SmartChat.jsx
import { useState, useRef } from "react";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { ChatProvider, useChat } from "../context/ChatContext";
import { sendChatMessage } from "../api/chatApi";

// Explicit rendering template engine matching your typography rules
function renderText(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => (
    <p key={i} style={{ margin: i < text.split("\n").length - 1 ? "0 0 8px" : 0, lineHeight: 1.65 }}>
      {line.split(/\*\*(.+?)\*\*/).map((part, j) =>
        j % 2 === 1
          ? <strong key={j} style={{ color: "#d4e4fa", fontWeight: 600 }}>{part}</strong>
          : part
      )}
    </p>
  ));
}

function ChatDashboardContent() {
  // Consuming Local Shared State Engine safely 
  const { chats, setChats, documents, setDocuments, activeChatId, setActiveChatId } = useChat();

  // Local operational state structures
  const [input, setInput] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]); // Temporary file cache staging ground
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Compute targeted active records dynamically
  const currentChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = currentChat ? currentChat.messages : [];

  // Parse logged-in user profile initials gracefully 
  const storageData = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  const userDisplayName = storageData?.student?.full_name || "User";
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  function handleCreateNewChat() {
    const newId = Date.now();
    const newSession = {
      id: newId,
      title: `New Chat Session (${chats.length + 1})`,
      messages: [
        {
          id: Date.now() + 1,
          sender: "ai",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `Hi ${userDisplayName}, starting a fresh session. Send a message or stage documents to get started!`,
        }
      ]
    };
    setChats(prev => [newSession, ...prev]);
    setActiveChatId(newId);
    setSelectedFiles([]); // Flush uploaded cache states
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const typedText = input.trim();
    const userMessageTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = Date.now();

    // 1. Instantly render user message state to interaction feed
    const userMessage = {
      id: userMsgId,
      sender: "user",
      time: userMessageTime,
      text: typedText,
    };

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === activeChatId) {
          const updatedTitle = chat.title.startsWith("New Chat Session") 
            ? typedText.substring(0, 24) + (typedText.length > 24 ? "..." : "")
            : chat.title;

          return {
            ...chat,
            title: updatedTitle,
            messages: [...chat.messages, userMessage],
          };
        }
        return chat;
      })
    );

    setInput("");
    setIsLoading(true);

    try {
      // 2. Identify if the active session is empty/uninitialized to set is_new_chat flag
      const isNewChatSession = currentChat?.messages?.length <= 1;

      // 3. Dispatch data block downstream to actual remote AI Engine
      const apiResponse = await sendChatMessage({
        promptText: typedText,
        isNewChat: isNewChatSession,
        files: selectedFiles,
        studentId: storageData?.student?.id || "1"
      });

      // 4. Update and stitch operational states with values from API response
      const aiMessage = {
        id: Date.now() + 2,
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: apiResponse.reply,
      };

      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.id === activeChatId) {
            // Remap runtime assigned session ID from the database if applicable
            return {
              ...chat,
              id: apiResponse.session_id || chat.id,
              messages: [...chat.messages, aiMessage],
            };
          }
          return chat;
        })
      );

      // Force view context refocus on corrected dynamic server ID maps
      if (apiResponse.session_id) {
        setActiveChatId(apiResponse.session_id);
      }

      // 5. Append newly indexed documentation blocks inside structural file list interface
      if (apiResponse.uploaded_documents) {
        const parsedDocs = apiResponse.uploaded_documents
          .filter(d => !d.skipped)
          .map(d => ({
            name: d.file_name,
            size: `${d.chunks_indexed || 0} chunks`,
            pages: "AI Loaded",
            active: true
          }));
        
        // Remove duplicate items from the UI list if they exist
        setDocuments(prev => {
          const filtered = prev.filter(p => !parsedDocs.some(newD => newD.name === p.name));
          return [...filtered, ...parsedDocs];
        });
      }

      setSelectedFiles([]); // Clear staging queue upon success

    } catch (err) {
      console.error("Failed handling remote AI sequence stream:", err);
      // Append localized failure notifications for clear user awareness
      const errorMessage = {
        id: Date.now() + 3,
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: "🚨 *Network connection failure.* Could not communicate text tokens with target platform parsing worker.",
      };
      setChats(prevChats =>
        prevChats.map(chat => chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat)
      );
    } finally {
      setIsLoading(false);
    }
  }

  function triggerFileSelect() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleFileChange(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert file object references to list array formats
    const fileArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...fileArray]);

    const newDocs = fileArray.map(file => {
      const sizeInMB = file.size / (1024 * 1024);
      const sizeDisplay = sizeInMB < 0.1 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${sizeInMB.toFixed(1)} MB`;

      return {
        name: file.name,
        size: sizeDisplay,
        pages: "Staged to Upload", 
        active: false
      };
    });

    setDocuments(prev => [...prev, ...newDocs]);
    e.target.value = "";
  }

  function handleDeleteDocument(nameToDelete, e) {
    e.stopPropagation(); 
    setDocuments(prev => prev.filter(doc => doc.name !== nameToDelete));
    setSelectedFiles(prev => prev.filter(f => f.name !== nameToDelete));
  }

  function startRename(chatId, currentTitle, e) {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitleInput(currentTitle);
  }

  function saveRename(chatId) {
    if (editTitleInput.trim()) {
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editTitleInput.trim() } : c));
    }
    setEditingChatId(null);
  }

  return (
    <Layout title="Smart AI Chat">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        multiple 
        accept=".pdf,.doc,.docx,.txt"
        style={{ display: "none" }} 
      />

      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* Left panel: documents & history list */}
        <aside style={{
          width: "280px", flexShrink: 0,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(5,18,32,0.8)",
        }}>
          {/* Action Buttons */}
          <div style={{ padding: "16px 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              onClick={handleCreateNewChat}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                padding: "9px", borderRadius: "9px",
                border: "1px solid #c0c1ff", background: "linear-gradient(135deg, rgba(192,193,255,0.2), rgba(255,176,205,0.1))",
                color: "#d4e4fa", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              <Icon name="chat" size={16} />
              New Chat Session
            </button>
            <button 
              onClick={triggerFileSelect}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                padding: "9px", borderRadius: "9px",
                border: "1px solid rgba(192,193,255,0.25)", background: "rgba(192,193,255,0.07)",
                color: "#c0c1ff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              <Icon name="add" size={16} />
              Upload Document {selectedFiles.length > 0 && `(${selectedFiles.length} staged)`}
            </button>
          </div>

          {/* Previous Chats Section */}
          <p style={{ margin: "8px 14px 8px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(199,196,215,0.35)" }}>
            Recent History
          </p>
          <div style={{ maxHeight: "160px", overflowY: "auto", padding: "0 10px", display: "flex", flexDirection: "column", gap: "4px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}>
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px",
                  padding: "8px 12px", borderRadius: "8px",
                  border: `1px solid ${activeChatId === chat.id ? "rgba(192,193,255,0.3)" : "transparent"}`,
                  background: activeChatId === chat.id ? "rgba(192,193,255,0.08)" : "transparent",
                  cursor: "pointer", width: "100%", boxSizing: "border-box"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                  <Icon name="chat_bubble" size={14} style={{ color: activeChatId === chat.id ? "#c0c1ff" : "rgba(199,196,215,0.4)", flexShrink: 0 }} />
                  {editingChatId === chat.id ? (
                    <input
                      value={editTitleInput}
                      onChange={e => setEditTitleInput(e.target.value)}
                      onBlur={() => saveRename(chat.id)}
                      onKeyDown={e => { if (e.key === "Enter") saveRename(chat.id); }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      style={{
                        background: "rgba(0,0,0,0.4)", border: "1px solid #c0c1ff",
                        color: "#d4e4fa", fontSize: "12px", borderRadius: "4px",
                        padding: "2px 6px", width: "100%", outline: "none"
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "12px", color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chat.title}
                    </span>
                  )}
                </div>
                
                {editingChatId !== chat.id && (
                  <button
                    onClick={(e) => startRename(chat.id, chat.title, e)}
                    style={{ background: "none", border: "none", color: "rgba(199,196,215,0.4)", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
                    title="Rename Chat"
                  >
                    <Icon name="edit" size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Your Documents Section */}
          <p style={{ margin: "12px 14px 8px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(199,196,215,0.35)" }}>
            Your Documents
          </p>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {documents.map((doc, idx) => (
              <div
                key={`${doc.name}-${idx}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
                  padding: "10px 12px", borderRadius: "10px",
                  border: "1px solid transparent",
                  background: "rgba(255,255,255,0.02)",
                  width: "100%", boxSizing: "border-box"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="description" size={18} style={{ color: "#ffb0cd" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 500, color: "#d4e4fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.4)" }}>{doc.size} · {doc.pages}</p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleDeleteDocument(doc.name, e)}
                  style={{
                    background: "none", border: "none", color: "rgba(255,180,171,0.5)",
                    cursor: "pointer", display: "flex", alignItems: "center", padding: "6px",
                    borderRadius: "6px"
                  }}
                  title="Delete Document"
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* AI Context Footer Display */}
          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,183,131,0.06)" }}>
              <p style={{ margin: "0 0 3px", fontSize: "12px", fontWeight: 700, color: "#ffb783" }}>AI Context</p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(199,196,215,0.55)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Active Session Documents Attached ({documents.length})
              </p>
            </div>
          </div>
        </aside>

        {/* Right panel: chat content */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {messages.map(msg => (
              msg.sender === "ai" ? (
                <div key={msg.id} style={{ display: "flex", gap: "12px", maxWidth: "760px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(192,193,255,0.12)", border: "1px solid rgba(192,193,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <Icon name="auto_awesome" size={15} style={{ color: "#c0c1ff" }} />
                  </div>
                  <div>
                    <div style={{ padding: "12px 16px", borderRadius: "12px", borderTopLeftRadius: "2px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", fontSize: "14px", color: "rgba(199,196,215,0.85)" }}>
                      {renderText(msg.text)}
                    </div>
                    <p style={{ margin: "5px 0 0 4px", fontSize: "11px", color: "rgba(199,196,215,0.3)" }}>AI Assistant · {msg.time}</p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} style={{ display: "flex", gap: "12px", maxWidth: "760px", marginLeft: "auto", flexDirection: "row-reverse" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg,#c0c1ff,#ffb0cd)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", fontSize: "11px", fontWeight: 800, color: "#051424" }}>
                    {userInitial}
                  </div>
                  <div>
                    <div style={{ padding: "12px 16px", borderRadius: "12px", borderTopRightRadius: "2px", background: "rgba(192,193,255,0.14)", border: "1px solid rgba(192,193,255,0.22)", fontSize: "14px", color: "#d4e4fa" }}>
                      {renderText(msg.text)}
                    </div>
                    <p style={{ margin: "5px 4px 0 0", fontSize: "11px", color: "rgba(199,196,215,0.3)", textAlign: "right" }}>{userDisplayName} · {msg.time}</p>
                  </div>
                </div>
              )
            ))}
            
            {/* Real-time processing loading indicator */}
            {isLoading && (
              <div style={{ display: "flex", gap: "12px", maxWidth: "760px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(192,193,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="hourglass_empty" size={14} style={{ color: "#ffb0cd", animate: "spin 2s linear infinite" }} />
                </div>
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", fontSize: "13px", color: "rgba(199,196,215,0.4)", fontStyle: "italic" }}>
                  AI Engine parsing tokens & reading document chunks...
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{ padding: "14px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <form onSubmit={handleSend} style={{ display: "flex", alignItems: "flex-end", gap: "8px", maxWidth: "860px" }}>
              <button 
                type="button" 
                onClick={triggerFileSelect}
                disabled={isLoading}
                style={{ background: "none", border: "none", color: selectedFiles.length > 0 ? "#ffb0cd" : "rgba(199,196,215,0.4)", cursor: "pointer", padding: "8px", display: "flex", alignItems: "center", flexShrink: 0 }}
                title="Attach Document from System"
              >
                <Icon name={selectedFiles.length > 0 ? "task_check" : "attach_file"} size={20} />
              </button>
              <textarea
                rows={1}
                placeholder={selectedFiles.length > 0 ? `${selectedFiles.length} files staged. Send prompt to upload...` : "Ask anything about your study materials…"}
                value={input}
                disabled={isLoading}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                style={{
                  flex: 1, resize: "none", maxHeight: "120px",
                  background: "rgba(1,15,31,0.7)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", padding: "10px 14px",
                  color: "#d4e4fa", fontSize: "14px", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.5,
                  opacity: isLoading ? 0.6 : 1
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  width: "38px", height: "38px", borderRadius: "10px", border: "none",
                  background: (!input.trim() || isLoading) ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#c0c1ff,#ffb0cd)",
                  color: "#051424", cursor: (!input.trim() || isLoading) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Icon name="send" size={18} />
              </button>
            </form>
            <p style={{ margin: "8px 0 0 42px", fontSize: "11px", color: "rgba(199,196,215,0.3)", fontStyle: "italic" }}>
              Study AI can make mistakes. Verify important information.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Entry Wrapper Component: Satisfies context isolation without breaking app.jsx
export default function SmartChat() {
  return (
    <ChatProvider>
      <ChatDashboardContent />
    </ChatProvider>
  );
}