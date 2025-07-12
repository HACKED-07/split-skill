import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

interface User {
  id: string;
  name: string;
  image?: string;
}

interface Message {
  id: string;
  swapId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: User;
}

interface SwapChatProps {
  swapId: string;
  currentUser: User;
  open: boolean;
  onClose: () => void;
}

export function SwapChat({ swapId, currentUser, open, onClose }: SwapChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch chat history
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/swaps/${swapId}/messages`)
      .then(res => res.json())
      .then((data: Message[]) => {
        setMessages(data);
        setLoading(false);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }, [swapId, open]);

  // Socket.IO connection
  useEffect(() => {
    if (!open) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("joinRoom", { swapId });
    socket.on("chatMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => {
      socket.disconnect();
    };
  }, [swapId, open]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    // POST to API for persistence
    const res = await fetch(`/api/swaps/${swapId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input }),
    });
    if (res.ok) {
      const msg: Message = await res.json();
      // Emit to socket for real-time
      socketRef.current?.emit("chatMessage", { swapId, message: msg });
      setMessages((prev) => [...prev, msg]);
      setInput("");
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setSending(false);
  };

  if (!open) return null;

  // Find the other user from messages (if available)
  const otherUser = messages.find(m => m.senderId !== currentUser.id)?.sender;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col h-[70vh]">
        {/* Header with avatars */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <img src={currentUser.image || "/default-avatar.svg"} alt="me" className="w-8 h-8 rounded-full border border-[#E5E7EB]" />
            <span className="font-bold text-base text-[#2563eb]">You</span>
            <span className="mx-2 text-[#A0AEC0]">↔</span>
            {otherUser && <><img src={otherUser.image || "/default-avatar.svg"} alt={otherUser.name} className="w-8 h-8 rounded-full border border-[#E5E7EB]" /><span className="font-bold text-base text-[#2563eb]">{otherUser.name}</span></>}
          </div>
          <button onClick={onClose} className="text-[#A0AEC0] hover:text-[#222] text-2xl">×</button>
        </div>
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F8F9FB]">
          {loading ? (
            <div className="text-center text-[#A0AEC0]">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-[#A0AEC0]">No messages yet.</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[70%] rounded-3xl px-4 py-2 text-base shadow-sm transition-all duration-150 ${msg.senderId === currentUser.id ? "bg-[#2563eb] text-white rounded-br-2xl" : "bg-white border border-[#E5E7EB] text-[#222] rounded-bl-2xl"}`}>
                  <div className="text-xs font-semibold mb-1 flex items-center gap-2">
                    <img src={msg.sender?.image || "/default-avatar.svg"} alt="avatar" className="w-5 h-5 rounded-full inline-block mr-1" />
                    {msg.sender?.name || "You"}
                  </div>
                  <div>{msg.content}</div>
                  <div className="text-[10px] text-[#A0AEC0] mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        {/* Input area sticky at bottom */}
        <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-4 border-t border-[#E5E7EB] bg-white sticky bottom-0">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
            autoFocus
          />
          <Button type="submit" disabled={sending || !input.trim()} className="h-12 px-6 rounded-xl font-semibold">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
} 