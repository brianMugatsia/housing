import { useState, useEffect } from "react";
import { MessageSquare, X, Send, User } from "lucide-react";
import api from "../services/api";

export default function ChatModal({ recipientId, recipientName, propertyId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/?user_id=${recipientId}`);
      setMessages(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [recipientId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post("/messages/", {
        recipient: recipientId,
        property: propertyId || null,
        content: content.trim(),
      });
      setContent("");
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[550px] border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
              {recipientName?.[0] || <User className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold">{recipientName || "Chat"}</h3>
              <span className="text-[10px] text-emerald-400 font-medium">Online</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="text-center py-20 text-xs font-bold text-slate-400">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-xs text-slate-400">No messages yet. Send a message to start chatting!</div>
          ) : (
            messages.map((m) => {
              // We check if sender is recipient to align left/right
              const isIncoming = m.sender === recipientId;
              return (
                <div key={m.id} className={`flex ${!isIncoming ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${!isIncoming ? "bg-slate-900 text-white rounded-br-xs" : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"}`}>
                    <p className="font-medium leading-relaxed">{m.content}</p>
                    <span className="block text-[9px] mt-1 text-right text-slate-400">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-900 font-medium"
          />
          <button type="submit" className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
