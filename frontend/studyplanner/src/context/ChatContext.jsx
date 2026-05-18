//frontend/studyplanner/src/context/ChatContext.jsx
import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

const INITIAL_CHATS = [
  {
    id: 1,
    title: "Biology Notes Discussion",
    messages: [
      {
        id: 1,
        sender: "ai",
        time: "09:41 AM",
        text: "Hello! I've analyzed your **Biology_Notes.pdf**. It covers Cellular Respiration in significant detail. How can I help? I can generate a summary, create flashcards, or quiz you on the Krebs cycle section.",
      },
      {
        id: 2,
        sender: "user",
        time: "09:42 AM",
        text: "Can you explain the difference between aerobic and anaerobic respiration based on the notes on page 4?",
      },
      {
        id: 3,
        sender: "ai",
        time: "09:43 AM",
        text: "According to page 4 of your notes:\n\n• **Aerobic Respiration** occurs in the presence of oxygen and produces ~36–38 ATP per glucose molecule.\n\n• **Anaerobic Respiration** occurs in the absence of oxygen, yields only 2 ATP per glucose, and produces lactic acid in animals.",
      },
    ]
  },
  {
    id: 2,
    title: "Calculus Ch3 Problems",
    messages: [
      {
        id: 1,
        sender: "ai",
        time: "11:15 AM",
        text: "Hi! I see you are working on **Calculus_Ch3.pdf**. Ready to tackle limits and derivatives together?",
      }
    ]
  }
];

const INITIAL_DOCUMENTS = [
  { name: "Biology_Notes.pdf",      size: "2.4 MB", pages: 12, active: true  },
  { name: "Calculus_Ch3.pdf",       size: "1.8 MB", pages: 8,  active: false },
  { name: "Historical_Context.pdf", size: "4.1 MB", pages: 24, active: false },
];

export function ChatProvider({ children }) {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [activeChatId, setActiveChatId] = useState(1);

  return (
    <ChatContext.Provider value={{ 
      chats, 
      setChats, 
      documents, 
      setDocuments, 
      activeChatId, 
      setActiveChatId 
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}