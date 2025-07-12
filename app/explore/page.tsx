"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PlatformMessage } from "@/components/platform-message";
import { ErrorMessage } from "@/components/ui/error-boundary";
import { Button } from "@/components/ui/button";
import { UserProfileCard } from "@/components/user-profile-card";

interface Skill {
  id: string;
  name: string;
  type: "OFFERED" | "WANTED";
}
interface User {
  id: string;
  name: string;
  image?: string;
  location?: string;
  availability?: string;
  skills: Skill[];
  avgRating?: number | null;
  feedbackCount?: number;
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [offeredSkill, setOfferedSkill] = useState<string>("");
  const [wantedSkill, setWantedSkill] = useState<string>("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const USERS_PER_PAGE = 9;
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    setFetchError("");
    fetch(`/api/public-users${search ? `?skill=${encodeURIComponent(search)}` : ""}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setHasMore(data.length >= USERS_PER_PAGE);
        setLoading(false);
      })
      .catch(err => {
        setFetchError(err.message);
        setLoading(false);
      });
    if (session?.user?.id) {
      fetch(`/api/skills?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => setMySkills(data))
        .catch(() => {
          // Silently handle skills fetch error
        });
    }
  }, [search, session]);

  const loadMoreUsers = () => {
    if (loading || !hasMore) return;
    setLoading(true);
    fetch(`/api/public-users?page=${currentPage + 1}${search ? `&skill=${encodeURIComponent(search)}` : ""}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setUsers(prev => [...prev, ...data]);
          setCurrentPage(prev => prev + 1);
          setHasMore(data.length >= USERS_PER_PAGE);
        } else {
          setHasMore(false);
        }
        setLoading(false);
      });
  };

  function openRequestModal(user: User) {
    if (!session?.user) {
      setModalOpen(false);
      setSelectedUser(null);
      setError("");
      setSuccess("");
      toast.error("You need to be logged in to request a swap.");
      // Show a modal similar to homepage
      setShowAuthModal(true);
      return;
    }
    setSelectedUser(user);
    setModalOpen(true);
    setOfferedSkill("");
    setWantedSkill("");
    setMessage("");
    setError("");
    setSuccess("");
  }

  async function handleRequestSwap(e: React.FormEvent) {
    e.preventDefault();
    if (!offeredSkill || !wantedSkill) {
      setError("Select both skills");
      toast.error("Please select both skills");
      return;
    }
    setError("");
    setSuccess("");
    const res = await fetch("/api/swaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromUserId: session?.user?.id,
        toUserId: selectedUser?.id,
        offeredSkillId: offeredSkill,
        wantedSkillId: wantedSkill,
        message,
      }),
    });
    if (res.ok) {
      setSuccess("Swap request sent!");
      setModalOpen(false);
      toast.success("Swap request sent successfully!");
    } else {
      setError("Failed to send request");
      toast.error("Failed to send swap request");
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#222]">
      <PlatformMessage />
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">Split Skill: Browse Public Profiles</h1>
        <p className="text-[#6B7280] text-base sm:text-lg font-medium mb-6">Discover people to swap skills with on Split Skill. Search, connect, and grow together!</p>
      </header>
      {fetchError && (
        <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] rounded-xl px-4 py-3 mb-6 flex items-center gap-2 max-w-xl mx-auto">
          <span className="font-bold text-lg">!</span>
          <span className="font-medium">{fetchError}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
        <input
          className="flex-1 h-12 px-8 pl-12 rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] font-semibold placeholder:text-[#A0AEC0] focus:ring-0 focus:border-[#2563eb] !m-0 !p-0 !box-border"
          style={{ minWidth: 0 }}
          placeholder="Search by skill..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button
          variant="outline"
          className="h-12 px-6 rounded-xl border border-[#E5E7EB] bg-white text-[#222] font-semibold flex items-center justify-center !m-0"
          style={{ minWidth: '120px' }}
          onClick={() => setCurrentPage(1)}
        >
          Search
        </Button>
      </div>
      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-8 sm:gap-10">
          {users.map(user => (
            <div key={user.id} className="transition-shadow hover:shadow-lg rounded-2xl">
              <UserProfileCard
                id={user.id}
                name={user.name}
                skillsOffered={user.skills.filter(s => s.type === "OFFERED").map(s => ({ id: s.id, name: s.name }))}
                skillsWanted={user.skills.filter(s => s.type === "WANTED").map(s => ({ id: s.id, name: s.name }))}
                rating={user.avgRating ? `${user.avgRating.toFixed(1)}/5` : "No rating"}
                avatarSrc={user.image || "/default-avatar.svg"}
                onRequestClick={() => openRequestModal(user)}
              />
            </div>
          ))}
        </div>
      )}
      {users.length > 0 && hasMore && !loading && (
        <div className="flex justify-center mt-10">
          <Button
            variant="outline"
            className="px-8 py-3 rounded-xl font-semibold text-base shadow-sm border border-[#E5E7EB] bg-white hover:bg-[#F1F3F7]"
            onClick={loadMoreUsers}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
      {/* Modal for swap request */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 bg-[#F8F9FB]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-[#E5E7EB] relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-[#A0AEC0] hover:text-[#222] p-2" onClick={() => setModalOpen(false)}>&times;</button>
            <h2 className="text-lg sm:text-xl font-bold mb-4 pr-8 text-[#111]">Request Swap with {selectedUser.name}</h2>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-500 mb-2">{success}</div>}
            <form onSubmit={handleRequestSwap} className="space-y-4">
              <div>
                <label className="block mb-1 text-[#222] font-semibold">Choose one of your offered skills</label>
                <select
                  className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
                  value={offeredSkill}
                  onChange={e => setOfferedSkill(e.target.value)}
                  required
                >
                  <option value="">Select skill</option>
                  {mySkills.filter(s => s.type === "OFFERED").map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[#222] font-semibold">Choose one of their wanted skills</label>
                <select
                  className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
                  value={wantedSkill}
                  onChange={e => setWantedSkill(e.target.value)}
                  required
                >
                  <option value="">Select skill</option>
                  {selectedUser.skills.filter(s => s.type === "WANTED").map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[#222] font-semibold">Message (optional)</label>
                <textarea
                  className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </div>
        </div>
      )}
      {/* Authentication Modal (copied from homepage) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[#F8F9FB]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-[#E5E7EB] relative">
            <button 
              className="absolute top-4 right-4 text-[#A0AEC0] hover:text-[#222]"
              onClick={() => setShowAuthModal(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#111]">Sign in to Request Swaps</h2>
            <p className="text-[#6B7280] mb-6">
              You need to be logged in to request skill swaps with other users.
            </p>
            <div className="flex flex-col gap-3">
              <a href="/login">
                <Button className="w-full" size="lg">
                  Sign In
                </Button>
              </a>
              <a href="/register">
                <Button variant="outline" className="w-full" size="lg">
                  Create Account
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
