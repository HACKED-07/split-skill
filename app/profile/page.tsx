"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Skill {
  id: string;
  name: string;
  type: "OFFERED" | "WANTED";
  approved: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    name: "",
    location: "",
    image: "",
    availability: "",
    isPublic: true,
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState({ name: "", type: "OFFERED" as "OFFERED" | "WANTED" });
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<{ level: number; vouchesReceived: number; swapsCompleted: number; achievements: string[] } | null>(null);

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
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.id) {
      setLoading(true);
      fetch(`/api/user/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setForm({
            name: data.name || "",
            location: data.location || "",
            image: data.image || "",
            availability: data.availability || "",
            isPublic: data.isPublic ?? true,
          });
        });
      fetch(`/api/skills?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setSkills(data);
          setLoading(false);
        });
      fetch(`/api/feedback?userId=${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setFeedbacks(data.feedbacks);
          setAvgRating(data.avgRating);
        });
      // Fetch achievements/level
      fetch(`/api/user/${session.user.id}/achievements`)
        .then(res => res.json())
        .then(data => setAchievements(data));
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    let imageUrl = form.image;
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      const data = new FormData();
      data.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: data });
      const uploadJson = await uploadRes.json();
      if (uploadRes.ok) {
        imageUrl = uploadJson.url;
      } else {
        setError("Photo upload failed");
        setLoading(false);
        return;
      }
    }
    const res = await fetch(`/api/user/${session?.user?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, image: imageUrl }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Update failed");
      toast.error(data.error || "Update failed");
    } else {
      setSuccess("Profile updated!");
      toast.success("Profile updated!");
      setForm(f => ({ ...f, image: imageUrl }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkill.name.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session?.user?.id,
        name: newSkill.name,
        type: newSkill.type,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not add skill");
      toast.error(data.error || "Could not add skill");
    } else {
      setSkills(skills => [...skills, data]);
      setNewSkill({ name: "", type: "OFFERED" });
      toast.success("Skill added!");
    }
  }

  async function handleEditSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSkill) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/skills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skillId: editingSkill.id,
        name: editingSkill.name,
        type: editingSkill.type,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not update skill");
      toast.error(data.error || "Could not update skill");
    } else {
      setSkills(skills => skills.map(s => (s.id === editingSkill.id ? data : s)));
      setEditingSkill(null);
      toast.success("Skill updated!");
    }
  }

  async function handleDeleteSkill(skillId: string) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId }),
    });
    setLoading(false);
    if (res.ok) {
      setSkills(skills => skills.filter(s => s.id !== skillId));
      toast.success("Skill deleted!");
    } else {
      setError("Could not delete skill");
      toast.error("Could not delete skill");
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-[#222]">
      <LoadingSpinner size="lg" />
    </div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-[#222] p-4">
      <div className="w-full max-w-lg">
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
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-2xl shadow-2xl w-full space-y-8 border border-[#E5E7EB]"
        >
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-1 text-[#111]">Your Profile</h2>
            <p className="text-[#6B7280] text-base sm:text-lg font-medium">Update your details and manage your skills.</p>
          </div>
          {error && <div className="bg-[#FEE2E2] border border-[#F87171] text-[#B91C1C] rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><span className="font-bold text-lg">!</span><span className="font-medium">{error}</span></div>}
          {success && <div className="bg-[#DCFCE7] border border-[#22C55E] text-[#166534] rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><span className="font-bold text-lg">✓</span><span className="font-medium">{success}</span></div>}
          <div className="flex flex-col items-center mb-6">
            <img
              src={form.image || "/placeholder.svg?height=80&width=80"}
              alt="Profile Photo"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#F1F3F7] object-cover mb-2 bg-white shadow"
            />
            <label className="inline-block mt-2 cursor-pointer text-[#2563eb] font-semibold hover:underline">
              {selectedFileName ? selectedFileName : "Upload New Photo"}
              <input
                className="hidden"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={e => setSelectedFileName(e.target.files?.[0]?.name || "")}
              />
            </label>
          </div>
          <div className="space-y-4">
            <input
              className="w-full h-12 px-4 rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] font-semibold placeholder:text-[#A0AEC0] focus:ring-0 focus:border-[#2563eb]"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="w-full h-12 px-4 rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] font-semibold placeholder:text-[#A0AEC0] focus:ring-0 focus:border-[#2563eb]"
              placeholder="Location"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
            <div className="mb-4">
              <label className="block mb-1 text-[#222] font-semibold">Availability</label>
              <select
                className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
                value={form.availability}
                onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
              >
                <option value="">Select availability</option>
                {AVAILABILITY_OPTIONS.filter(opt => opt !== 'Any').map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                className="accent-[#2563eb] w-5 h-5 rounded border border-[#E5E7EB]"
                id="isPublic"
              />
              <label htmlFor="isPublic" className="text-[#222] font-medium">Public Profile</label>
            </div>
          </div>
          <button
            type="submit"
            className="w-full h-12 mt-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl transition-colors shadow-sm"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
        {/* Skills Section (outside main form) */}
        <div className="bg-white mt-8 p-8 rounded-2xl shadow-xl border border-[#E5E7EB]">
          <h3 className="text-lg font-bold mb-3 text-[#111]">Your Skills</h3>
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-semibold text-[#2563eb] mb-1">Offered</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.filter(s => s.type === "OFFERED").map(skill => (
                  <span key={skill.id} className="inline-block border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] rounded-xl px-4 py-1 text-base font-medium">
                    {skill.name}
                    <button type="button" className="ml-2 text-[#F87171] hover:text-[#B91C1C] font-bold" onClick={() => handleDeleteSkill(skill.id)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-[#2563eb] mb-1">Wanted</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.filter(s => s.type === "WANTED").map(skill => (
                  <span key={skill.id} className="inline-block border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] rounded-xl px-4 py-1 text-base font-medium">
                    {skill.name}
                    <button type="button" className="ml-2 text-[#F87171] hover:text-[#B91C1C] font-bold" onClick={() => handleDeleteSkill(skill.id)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Add/Edit Skill Form (outside main form) */}
          <form onSubmit={editingSkill ? handleEditSkill : handleAddSkill} className="flex flex-col sm:flex-row gap-2 mt-4">
            <input
              className="flex-1 h-12 px-4 rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] font-semibold placeholder:text-[#A0AEC0] focus:ring-0 focus:border-[#2563eb]"
              placeholder={editingSkill ? "Edit skill name" : "Add new skill"}
              value={editingSkill ? editingSkill.name : newSkill.name}
              onChange={e => editingSkill ? setEditingSkill(s => s && { ...s, name: e.target.value }) : setNewSkill(s => ({ ...s, name: e.target.value }))}
              required
            />
            <select
              className="h-12 px-4 rounded-xl border border-[#E5E7EB] bg-[#F1F3F7] text-[#222] font-semibold focus:ring-0 focus:border-[#2563eb]"
              value={editingSkill ? editingSkill.type : newSkill.type}
              onChange={e => editingSkill ? setEditingSkill(s => s && { ...s, type: e.target.value as "OFFERED" | "WANTED" }) : setNewSkill(s => ({ ...s, type: e.target.value as "OFFERED" | "WANTED" }))}
            >
              <option value="OFFERED">Offered</option>
              <option value="WANTED">Wanted</option>
            </select>
            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold shadow-sm"
              disabled={loading}
            >
              {editingSkill ? "Save" : "Add"}
            </button>
            {editingSkill && (
              <button
                type="button"
                className="h-12 px-6 rounded-xl bg-[#FEE2E2] text-[#B91C1C] font-semibold border border-[#F87171] shadow-sm"
                onClick={() => setEditingSkill(null)}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
        {/* Feedback Section */}
        <div className="bg-white mt-8 p-8 rounded-2xl shadow-xl border border-[#E5E7EB]">
          <h3 className="text-lg font-bold mb-3 text-[#111]">Feedback & Rating</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-500 text-xl font-bold">★</span>
            <span className="text-lg font-semibold">{avgRating ? avgRating.toFixed(1) : "No rating yet"}</span>
          </div>
          {feedbacks.length > 0 ? (
            <ul className="space-y-2 mt-2">
              {feedbacks.map((fb, i) => (
                <li key={i} className="bg-[#F1F3F7] border border-[#E5E7EB] rounded-xl px-4 py-2 text-[#222]">
                  <span className="font-semibold text-[#2563eb]">{fb.fromUserName}:</span> {fb.comment} <span className="text-yellow-500">({fb.rating}★)</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[#A0AEC0]">No feedback yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
