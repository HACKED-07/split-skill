"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react"
import { UserProfileCard } from "@/components/user-profile-card"
import { useState, useEffect } from "react"
import { LoadingSpinner, HydrationBars } from "@/components/ui/loading-spinner"
import { useSession } from "next-auth/react"
import Link from "next/link"
import toast from "react-hot-toast"

interface User {
  id: string;
  name: string;
  image?: string;
  location?: string;
  availability?: string;
  skills: Array<{
    id: string;
    name: string;
    type: "OFFERED" | "WANTED";
  }>;
  avgRating?: number;
  feedbackCount: number;
}

export default function SkillSwapPlatform() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [offeredSkill, setOfferedSkill] = useState("");
  const [wantedSkill, setWantedSkill] = useState("");
  const [message, setMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [mySkills, setMySkills] = useState<any[]>([]);
  const PAGE_SIZE = 9;
  const totalPages = users.length === PAGE_SIZE ? currentPage + 1 : currentPage;
  const AVAILABILITY_OPTIONS = [
    "Any",
    "Weekdays",
    "Weekends",
    "Evenings",
    "Mornings",
    "Remote",
    "On-site",
  ];

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, availabilityFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchTerm && { skill: searchTerm }),
        ...(availabilityFilter && availabilityFilter !== 'Any' ? { availability: availabilityFilter } : {}),
      });
      const response = await fetch(`/api/public-users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      setError("");
    } catch (err) {
      setError("Failed to load users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleAvailabilityFilter = (availability: string) => {
    setAvailabilityFilter(availability);
    setCurrentPage(1);
  };

  const handleRequestClick = async (user: User) => {
    if (!session?.user) {
      setShowAuthModal(true);
      setMySkills([]);
    } else {
      setSelectedUser(user);
      setShowRequestModal(true);
      setOfferedSkill("");
      setWantedSkill("");
      setMessage("");
      // Fetch logged-in user's skills
      try {
        const res = await fetch("/api/my-skills");
        if (res.ok) {
          const data = await res.json();
          setMySkills(data.skills || []);
        } else {
          setMySkills([]);
        }
      } catch {
        setMySkills([]);
      }
    }
  };

  const handleSendRequest = async () => {
    if (!offeredSkill || !wantedSkill) {
      toast.error("Please select both skills.");
      return;
    }
    setRequestLoading(true);
    try {
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
        toast.success("Swap request sent!");
        setShowRequestModal(false);
      } else {
        toast.error("Failed to send request");
      }
    } catch (e) {
      toast.error("Failed to send request");
    } finally {
      setRequestLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]"><HydrationBars style={{ maxWidth: 320 }} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#222]">
      <header className="mb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">Split Skill</h1>
            <p className="text-[#6B7280] text-base sm:text-lg font-medium">Find people to swap skills with on Split Skill. Search, connect, and grow together!</p>
          </div>
          {!session?.user && (
            <Link href="/login">
              <Button
                variant="outline"
                className="border-[#E5E7EB] text-[#222] hover:bg-[#F1F3F7] px-6 py-2 bg-white"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </header>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
        <div className="w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-6 rounded-xl border border-[#E5E7EB] bg-white text-[#222] font-semibold flex items-center"
              >
                {availabilityFilter || 'Any'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {AVAILABILITY_OPTIONS.map(option => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleAvailabilityFilter(option)}
                  className={option === availabilityFilter ? 'font-bold text-[#2563eb]' : ''}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Input
          type="text"
          placeholder="Search by skill..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 h-12 px-6 rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] font-semibold placeholder:text-[#A0AEC0] focus:ring-0 focus:border-[#2563eb]"
          style={{ minWidth: 0 }}
        />
        <Button
          variant="outline"
          className="h-12 px-6 rounded-xl border border-[#E5E7EB] bg-white text-[#222] font-semibold"
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>
      {error && (
        <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] rounded-xl px-4 py-3 mb-6 flex items-center gap-2 max-w-xl mx-auto">
          <X className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid gap-8 sm:gap-10">
            {users.map((user) => {
              const skillsOffered = user.skills.filter(s => s.type === "OFFERED");
              const skillsWanted = user.skills.filter(s => s.type === "WANTED");
              const rating = user.avgRating ? `${user.avgRating.toFixed(1)}/5` : "No rating";
              return (
                <div key={user.id} className="transition-shadow hover:shadow-lg rounded-2xl">
                  <UserProfileCard
                    id={user.id}
                    name={user.name}
                    skillsOffered={skillsOffered.map(s => ({ id: s.id, name: s.name }))}
                    skillsWanted={skillsWanted.map(s => ({ id: s.id, name: s.name }))}
                    rating={rating}
                    avatarSrc={user.image || "/default-avatar.svg"}
                    onRequestClick={() => handleRequestClick(user)}
                  />
                </div>
              );
            })}
          </div>
          {users.length === 0 && !loading && (
            <div className="text-center text-[#A0AEC0] py-8 text-lg font-medium">
              No users found. Try adjusting your search criteria.
            </div>
          )}
          {/* Pagination with page numbers */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-12 text-[#A0AEC0]">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#A0AEC0] hover:text-[#222]"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "ghost"}
                className={`text-lg ${page === currentPage ? "text-[#222] font-bold bg-[#F1F3F7] border border-[#E5E7EB]" : "text-[#A0AEC0] hover:text-[#222]"} rounded-xl px-4`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="text-[#A0AEC0] hover:text-[#222]"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={users.length < PAGE_SIZE}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </>
      )}
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[#F8F9FB]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-[#E5E7EB] relative">
            <button 
              className="absolute top-4 right-4 text-[#A0AEC0] hover:text-[#222]"
              onClick={() => setShowAuthModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#111]">Sign in to Request Swaps</h2>
            <p className="text-[#6B7280] mb-6">
              You need to be logged in to request skill swaps with other users.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full" size="lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Request Modal for logged-in users */}
      {showRequestModal && selectedUser && (
        <div className="fixed inset-0 bg-[#F8F9FB]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-[#E5E7EB] relative">
            <button 
              className="absolute top-4 right-4 text-[#A0AEC0] hover:text-[#222]"
              onClick={() => setShowRequestModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#111]">Request Swap with {selectedUser.name}</h2>
            <form onSubmit={e => { e.preventDefault(); handleSendRequest(); }} className="space-y-4">
              <div>
                <label className="block mb-1 text-[#222] font-semibold">Choose one of your offered skills</label>
                <select
                  className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
                  value={offeredSkill}
                  onChange={e => setOfferedSkill(e.target.value)}
                  required
                >
                  <option value="">Select skill</option>
                  {mySkills
                    .filter(s => s.type === "OFFERED")
                    .map(s => (
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
                  {selectedUser.skills
                    .filter(s => s.type === "WANTED")
                    .map(s => (
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
                disabled={requestLoading}
              >
                {requestLoading ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
