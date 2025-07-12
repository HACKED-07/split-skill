"use client";
import { useEffect, useState } from "react";
import React from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PlatformMessage } from "@/components/platform-message";
import { SwapChat } from "@/components/SwapChat";

interface Skill {
  id: string;
  name: string;
  type: "OFFERED" | "WANTED";
}
interface User {
  id: string;
  name: string;
  image?: string;
}
interface Swap {
  id: string;
  fromUser: User;
  toUser: User;
  offeredSkill: Skill;
  wantedSkill: Skill;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  message?: string;
  feedback?: { rating: number; comment?: string } | null;
  createdAt: string;
}

// Star icon for rating
const Star = ({ filled }: { filled: boolean }) => (
  <span style={{ color: filled ? '#fbbf24' : '#E5E7EB', fontSize: '1.3em', cursor: 'pointer', transition: 'color 0.2s' }}>★</span>
);

// Star rating component with half-star support
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = React.useState<number | null>(null);
  return (
    <div className="flex items-center gap-1 mb-1">
      {[1,2,3,4,5].map((star, i) => {
        const filled = (hover ?? value) >= star;
        const half = !filled && (hover ?? value) >= star - 0.5;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', width: 24, height: 24 }}
            onMouseMove={e => {
              const x = e.nativeEvent.offsetX;
              if (x < 12) setHover(star - 0.5);
              else setHover(star);
            }}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(hover ?? star)}
            >
            {filled ? (
              <span style={{ color: '#fbbf24', fontSize: '1.3em' }}>★</span>
            ) : half ? (
              <span style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id={`half-star-${i}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#E5E7EB" />
                    </linearGradient>
                  </defs>
                  <text x="0" y="20" fontSize="24" fontFamily="Arial" fill={`url(#half-star-${i})`}>★</text>
                </svg>
              </span>
            ) : (
              <span style={{ color: '#E5E7EB', fontSize: '1.3em' }}>★</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function SwapsPage() {
  const { data: session } = useSession();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<{ [swapId: string]: { rating: number; comment: string } }>({});
  const [success, setSuccess] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [activeSwapId, setActiveSwapId] = useState<string | null>(null);
  // Track which swaps have been vouched for in this session
  const [vouchedSwaps, setVouchedSwaps] = useState<{ [swapId: string]: boolean }>({});

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    fetch(`/api/swaps?userId=${session.user.id}`)
      .then(res => res.json())
      .then(data => {
        setSwaps(data);
        setLoading(false);
      });
  }, [session]);

  async function handleAction(swapId: string, action: "ACCEPTED" | "REJECTED" | "CANCELLED") {
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/swaps", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swapId, status: action }),
    });
    setLoading(false);
    if (res.ok) {
      setSwaps(swaps => swaps.map(s => s.id === swapId ? { ...s, status: action } : s));
      setSuccess("Status updated");
      toast.success(`Swap ${action.toLowerCase()}`);
    } else {
      setError("Failed to update status");
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(swapId: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/swaps", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swapId }),
    });
    setLoading(false);
    if (res.ok) {
      setSwaps(swaps => swaps.filter(s => s.id !== swapId));
      setSuccess("Swap deleted");
      toast.success("Swap deleted");
    } else {
      setError("Failed to delete swap");
      toast.error("Failed to delete swap");
    }
  }

  async function handleFeedback(swapId: string) {
    const { rating, comment } = feedback[swapId] || {};
    if (!rating) return;
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/swaps", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ swapId, feedback: true, rating, comment }),
    });
    setLoading(false);
    if (res.ok) {
      setSwaps(swaps => swaps.map(s => s.id === swapId ? { ...s, feedback: { rating, comment } } : s));
      setSuccess("Feedback submitted");
      setFeedback(fb => ({ ...fb, [swapId]: { rating: 0, comment: "" } }));
      toast.success("Feedback submitted successfully");
    } else {
      setError("Failed to submit feedback");
      toast.error("Failed to submit feedback");
    }
  }

  async function handleVouch(swap: Swap, otherUserId: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/swaps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucherId: session?.user?.id,
          vouchedId: otherUserId,
          swapId: swap.id,
        }),
      });
      setLoading(false);
      if (res.ok) {
        setVouchedSwaps(vs => ({ ...vs, [swap.id]: true }));
        setSuccess("Vouch submitted!");
        toast.success("You vouched for this user!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to vouch");
        toast.error(data.error || "Failed to vouch");
      }
    } catch (e) {
      setLoading(false);
      setError("Failed to vouch");
      toast.error("Failed to vouch");
    }
  }

  function ensureFeedbackInit(swapId: string) {
    if (!feedback[swapId]) {
      setFeedback(fb => ({ ...fb, [swapId]: { rating: 3, comment: "" } }));
    }
  }

  if (!session?.user?.id) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-[#222]">Please log in to view swaps.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5faff] to-white text-[#222]">
      <PlatformMessage />
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-[#222]">Your Swap Requests</h1>
          <p className="text-[#6B7280] text-base sm:text-lg font-medium mb-8">Manage your skill swap requests, chat, and leave feedback.</p>
        </header>
      {error && <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] rounded-xl px-4 py-3 mb-6 flex items-center gap-2 max-w-xl mx-auto"><span className="font-bold text-lg">!</span><span className="font-medium">{error}</span></div>}
      {success && <div className="bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-xl px-4 py-3 mb-6 flex items-center gap-2 max-w-xl mx-auto"><span className="font-bold text-lg">✓</span><span className="font-medium">{success}</span></div>}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        swaps.length === 0 ? (
          <div className="text-center text-[#A0AEC0] py-16 text-lg font-medium">No swaps yet. Start connecting with others to swap skills!</div>
        ) : (
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
          {swaps.map(swap => {
            const isSender = swap.fromUser.id === session.user.id;
            const otherUser = isSender ? swap.toUser : swap.fromUser;
            // Ensure feedback state is initialized for this swap
            ensureFeedbackInit(swap.id);
            return (
              <div key={swap.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={otherUser.image || "/default-avatar.svg"}
                    alt={otherUser.name}
                    className="w-12 h-12 rounded-full border border-[#E5E7EB] bg-white object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg truncate text-[#111]">{otherUser.name}</div>
                    <div className="text-xs text-[#A0AEC0]">{isSender ? "You" : "Them"} • {isSender ? "sent" : "received"}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-semibold border select-none ${
                    swap.status === "ACCEPTED" ? "bg-[#DCFCE7] border-[#22C55E] text-[#166534]" :
                    swap.status === "REJECTED" ? "bg-[#FEE2E2] border-[#F87171] text-[#B91C1C]" :
                    swap.status === "CANCELLED" ? "bg-[#F1F3F7] border-[#E5E7EB] text-[#A0AEC0]" :
                    "bg-[#F1F3F7] border-[#E5E7EB] text-[#6B7280]"
                  }`}>
                    {swap.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-[#6B7280]">Offered: <span className="font-medium text-[#2563eb]">{swap.offeredSkill.name}</span></div>
                  <div className="text-xs text-[#6B7280]">Wanted: <span className="font-medium text-[#2563eb]">{swap.wantedSkill.name}</span></div>
                  {swap.message && <div className="text-xs text-[#444] mt-1">Message: <span className="font-medium">{swap.message}</span></div>}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {swap.status === "PENDING" && !isSender && (
                    <>
                      <button title="Accept" className="bg-[#22c55e] hover:bg-[#16a34a] px-4 py-1.5 rounded text-xs text-white font-semibold transition-colors" onClick={() => handleAction(swap.id, "ACCEPTED")}>Accept</button>
                      <button title="Reject" className="bg-[#ef4444] hover:bg-[#b91c1c] px-4 py-1.5 rounded text-xs text-white font-semibold transition-colors" onClick={() => handleAction(swap.id, "REJECTED")}>Reject</button>
                    </>
                  )}
                  {swap.status === "PENDING" && isSender && (
                    <button title="Delete" className="bg-[#6B7280] hover:bg-[#374151] px-4 py-1.5 rounded text-xs text-white font-semibold transition-colors" onClick={() => handleDelete(swap.id)}>Delete</button>
                  )}
                  {swap.status === "ACCEPTED" && (
                    <button
                      title="Open Chat"
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] px-4 py-1.5 rounded text-xs text-white font-semibold transition-colors"
                      onClick={() => { setActiveSwapId(swap.id); setChatOpen(true); }}
                    >
                      Chat
                    </button>
                  )}
                  {/* Vouch button for completed swaps */}
                  {swap.status === "ACCEPTED" && !vouchedSwaps[swap.id] && (
                    <button
                      title="Vouch for this user"
                      className="bg-[#fbbf24] hover:bg-[#f59e42] px-4 py-1.5 rounded text-xs text-white font-semibold transition-colors"
                      onClick={() => handleVouch(swap, otherUser.id)}
                      disabled={vouchedSwaps[swap.id] || loading}
                    >
                      {vouchedSwaps[swap.id] ? "Vouched" : "Vouch"}
                    </button>
                  )}
                  {swap.status === "ACCEPTED" && vouchedSwaps[swap.id] && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-semibold border border-[#fbbf24] bg-[#fef3c7] text-[#b45309] select-none">Vouched</span>
                  )}
                </div>
                {/* Feedback */}
                {swap.status === "ACCEPTED" && !swap.feedback && isSender && (
                  <form onSubmit={e => { e.preventDefault(); handleFeedback(swap.id); }} className="mt-2 flex flex-col gap-2">
                    <label className="text-xs text-[#222] font-semibold mb-1">Rating: <span className="ml-2 text-[#2563eb] font-bold">{feedback[swap.id]?.rating?.toFixed(1) ?? '3.0'}</span></label>
                    <StarRating value={feedback[swap.id]?.rating ?? 3} onChange={v => setFeedback(fb => ({ ...fb, [swap.id]: { ...fb[swap.id], rating: v } }))} />
                    <textarea
                      className="w-full p-2 rounded bg-[#F1F3F7] border border-[#E5E7EB] text-xs text-[#222]"
                      placeholder="Leave a comment (optional)"
                      value={feedback[swap.id]?.comment || ""}
                      onChange={e => setFeedback(fb => ({ ...fb, [swap.id]: { ...fb[swap.id], comment: e.target.value } }))}
                      rows={2}
                    />
                    <button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8] px-4 py-1.5 rounded text-xs text-white font-semibold transition-colors w-full sm:w-auto">Submit Feedback</button>
                  </form>
                )}
                {swap.feedback && (
                  <div className="mt-2 text-xs text-[#22c55e] font-semibold bg-[#DCFCE7] border border-[#22C55E] rounded px-3 py-1">Feedback: {swap.feedback.rating}★ {swap.feedback.comment}</div>
                )}
              </div>
            );
          })}
        </div>
        )
      )}
      </div>
      {/* SwapChat modal */}
      {chatOpen && activeSwapId && (
        <SwapChat
          swapId={activeSwapId}
          currentUser={{
            id: session.user.id,
            name: session.user.name || "",
            image: session.user.image || ""
          }}
          open={chatOpen}
          onClose={() => { setChatOpen(false); setActiveSwapId(null); }}
        />
      )}
    </div>
  );
}
