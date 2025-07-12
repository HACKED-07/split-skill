"use client";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { use } from 'react';

// Add types for skills and user
interface Skill {
  id: string;
  name: string;
  type: string;
}

interface UserProfile {
  id: string;
  name: string;
  image?: string;
  location?: string;
  availability?: string;
  skills: Skill[];
  avgRating?: number;
}

interface Achievements {
  level: number;
  vouchesReceived: number;
  swapsCompleted: number;
  achievements: string[];
}

async function getUserProfile(id: string): Promise<UserProfile | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/public-users?id=${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const users = await res.json();
  return users && users.length > 0 ? users[0] : null;
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const { id } = use(params);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [offeredSkill, setOfferedSkill] = useState("");
  const [wantedSkill, setWantedSkill] = useState("");
  const [message, setMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [achievements, setAchievements] = useState<Achievements | null>(null);

  useEffect(() => {
    getUserProfile(id).then((u) => {
      setUser(u);
      setLoading(false);
    });
    // Fetch achievements/level
    fetch(`/api/user/${id}/achievements`).then(res => res.json()).then(setAchievements);
  }, [id]);

  const handleRequestClick = async () => {
    if (!session?.user) {
      setShowAuthModal(true);
      setMySkills([]);
    } else {
      setShowRequestModal(true);
      setOfferedSkill("");
      setWantedSkill("");
      setMessage("");
      setError("");
      setSuccess("");
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
      setError("Please select both skills.");
      return;
    }
    setRequestLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: session?.user?.id,
          toUserId: user?.id,
          offeredSkillId: offeredSkill,
          wantedSkillId: wantedSkill,
          message,
        }),
      });
      if (res.ok) {
        setSuccess("Swap request sent!");
        setShowRequestModal(false);
      } else {
        setError("Failed to send request");
      }
    } catch (e) {
      setError("Failed to send request");
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-[#2563eb] text-xl font-bold">Loading...</div>;
  }
  if (!user) return notFound();

  const skillsOffered = user.skills.filter((s) => s.type === "OFFERED");
  const skillsWanted = user.skills.filter((s) => s.type === "WANTED");
  const rating = user.avgRating ? `${user.avgRating.toFixed(1)}/5` : "No rating";

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-10 flex flex-col gap-10">
        {/* Achievements & Level Card */}
        {achievements && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-[#E5E7EB] mb-8 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-[#2563eb]">Level {achievements.level}</span>
              <span className="inline-block bg-[#DCFCE7] text-[#166534] border border-[#22C55E] rounded px-3 py-1 text-xs font-semibold">{achievements.vouchesReceived} Vouches</span>
              <span className="inline-block bg-[#F1F3F7] text-[#2563eb] border border-[#E5E7EB] rounded px-3 py-1 text-xs font-semibold">{achievements.swapsCompleted} Swaps</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {achievements.achievements.length > 0 ? achievements.achievements.map((ach, i) => (
                <span key={i} className="inline-block bg-[#fbbf24] text-[#b45309] border border-[#fbbf24] rounded px-3 py-1 text-xs font-semibold shadow-sm">🏆 {ach}</span>
              )) : <span className="text-[#A0AEC0] text-xs">No achievements yet.</span>}
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center md:items-start">
          {/* Left Side: Profile Photo */}
          <div className="flex flex-col items-center w-full md:w-auto">
            <Avatar className="h-48 w-48 border-4 border-[#F1F3F7] bg-white shadow-lg">
              <AvatarImage src={user.image || "/default-avatar.svg"} alt={`${user.name}'s profile photo`} />
              <AvatarFallback className="text-4xl font-bold">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Right Side: Info, Skills, Request */}
          <div className="flex-1 flex flex-col gap-6 items-start w-full">
            <div className="text-3xl font-extrabold text-[#111] mb-1">{user.name}</div>
            <div className="text-[#6B7280] text-lg mb-2">{user.location || "Location not set"}</div>
            <div className="mb-4">
              <div className="text-xl font-bold text-[#111] mb-2">Skills Offered</div>
              <div className="flex flex-wrap gap-3">
                {skillsOffered.length > 0 ? skillsOffered.map((skill) => (
                  <span key={skill.id} className="inline-block border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] rounded-xl px-4 py-1 text-base font-medium">{skill.name}</span>
                )) : <span className="text-[#A0AEC0]">None</span>}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xl font-bold text-[#111] mb-2">Skills Wanted</div>
              <div className="flex flex-wrap gap-3">
                {skillsWanted.length > 0 ? skillsWanted.map((skill) => (
                  <span key={skill.id} className="inline-block border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] rounded-xl px-4 py-1 text-base font-medium">{skill.name}</span>
                )) : <span className="text-[#A0AEC0]">None</span>}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-lg text-[#6B7280]">Availability: <span className="text-[#222] font-semibold">{user.availability || "Not specified"}</span></div>
            </div>
            <Button
              className="mt-2 px-10 py-3 text-lg rounded-xl font-bold shadow-md bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              size="lg"
              onClick={handleRequestClick}
            >
              Request
            </Button>
          </div>
        </div>
        {/* Rating and Feedback Centered Below */}
        <div className="flex flex-col items-center mt-8">
          <div className="text-xl font-bold text-[#111] mb-2">Rating and Feedback</div>
          <div className="text-yellow-500 text-3xl font-bold mb-2">★ {rating}</div>
          {/* TODO: Show feedback list if available */}
        </div>
      </div>
      {/* Auth Modal */}
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
      {showRequestModal && user && (
        <div className="fixed inset-0 bg-[#F8F9FB]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-[#E5E7EB] relative">
            <button 
              className="absolute top-4 right-4 text-[#A0AEC0] hover:text-[#222]"
              onClick={() => setShowRequestModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#111]">Request Swap with {user.name}</h2>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-500 mb-2">{success}</div>}
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
                  {user.skills
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