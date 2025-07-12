"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import toast from "react-hot-toast";

const TABS = [
  "Skills Review",
  "User Management",
  "Swap Monitoring",
  "Platform Messages",
  "Reports",
  "Vouch Management",
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState(TABS[0]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-[#222]">
    <LoadingSpinner size="lg" />
  </div>;
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl font-bold bg-[#F8F9FB]">Access denied: Admins only</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#222] p-2 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Admin Dashboard</h1>
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8 border-b border-[#E5E7EB] pb-2">
        {TABS.map(t => (
          <button
            key={t}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-semibold transition-colors duration-150 ${tab === t ? "bg-[#2563eb] text-white shadow" : "bg-[#F1F3F7] text-[#222] border border-[#E5E7EB] hover:bg-[#e0e7ff]"}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 min-h-[300px] shadow-sm">
        {tab === "Skills Review" && <SkillsReview />}
        {tab === "User Management" && <UserManagement />}
        {tab === "Swap Monitoring" && <SwapMonitoring />}
        {tab === "Platform Messages" && <PlatformMessages />}
        {tab === "Reports" && <Reports />}
        {tab === "Vouch Management" && <VouchManagement />}
      </div>
    </div>
  );
}

function SkillsReview() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin-skills")
      .then(res => res.json())
      .then(data => { setSkills(data); setLoading(false); });
  }, []);

  async function handleApprove(skillId: string, approved: boolean) {
    if (!window.confirm(`Are you sure you want to ${approved ? 'approve' : 'reject'} this skill?`)) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin-skills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId, approved }),
    });
    if (res.ok) {
      setSkills(skills => skills.map(s => s.id === skillId ? { ...s, approved } : s));
      toast.success(`Skill ${approved ? 'approved' : 'rejected'}`);
    } else {
      setError("Failed to update skill");
      toast.error("Failed to update skill");
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Skills Review</h2>
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2">{error}</div>}
      {loading ? <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div> : (
        skills.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No skills to review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB]">
                  <th className="py-2 px-2 text-left">User</th>
                  <th className="px-2 text-left">Skill</th>
                  <th className="px-2 text-left">Type</th>
                  <th className="px-2 text-left">Status</th>
                  <th className="px-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map(skill => (
                  <tr key={skill.id} className="border-b border-[#E5E7EB] hover:bg-[#F1F3F7]">
                    <td className="py-2 px-2 flex items-center gap-2">
                      {skill.user?.image && <img src={skill.user.image} alt="avatar" className="w-7 h-7 rounded-full border" />}
                      <span>{skill.user?.name}</span>
                      <span className="text-xs text-gray-400">({skill.user?.email})</span>
                    </td>
                    <td className="px-2">{skill.name}</td>
                    <td className="px-2">{skill.type}</td>
                    <td className="px-2">{skill.approved ? <span className="text-green-600 font-medium">Approved</span> : <span className="text-yellow-600 font-medium">Pending</span>}</td>
                    <td className="px-2 flex gap-2">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded disabled:opacity-50"
                        disabled={skill.approved || loading}
                        onClick={() => handleApprove(skill.id, true)}
                      >Approve</button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded disabled:opacity-50"
                        disabled={!skill.approved || loading}
                        onClick={() => handleApprove(skill.id, false)}
                      >Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin-users")
      .then(res => res.json())
      .then(data => { setUsers(data); setLoading(false); });
  }, []);

  async function handleBan(userId: string, banned: boolean) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin-users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned }),
    });
    if (res.ok) {
      setUsers(users => users.map(u => u.id === userId ? { ...u, banned } : u));
      toast.success(`User ${banned ? 'banned' : 'unbanned'}`);
    } else {
      setError("Failed to update user");
      toast.error("Failed to update user");
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">User Management</h2>
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2">{error}</div>}
      {loading ? <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div> : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB]">
              <th className="py-2 px-2 text-left">Name</th>
              <th className="px-2 text-left">Email</th>
              <th className="px-2 text-left">Role</th>
              <th className="px-2 text-left">Status</th>
              <th className="px-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-[#E5E7EB] hover:bg-[#F1F3F7]">
                <td className="py-2 px-2">{user.name}</td>
                <td className="px-2">{user.email}</td>
                <td className="px-2">{user.role}</td>
                <td className="px-2">{user.banned ? <span className="text-red-600 font-medium">Banned</span> : <span className="text-green-600 font-medium">Active</span>}</td>
                <td className="px-2 flex gap-2">
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded disabled:opacity-50"
                    disabled={user.banned || loading}
                    onClick={() => handleBan(user.id, true)}
                  >Ban</button>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded disabled:opacity-50"
                    disabled={!user.banned || loading}
                    onClick={() => handleBan(user.id, false)}
                  >Unban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SwapMonitoring() {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin-swaps")
      .then(res => res.json())
      .then(data => { setSwaps(data); setLoading(false); });
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Swap Monitoring</h2>
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2">{error}</div>}
      {loading ? <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div> : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB]">
              <th className="py-2 px-2 text-left">From</th>
              <th className="px-2 text-left">To</th>
              <th className="px-2 text-left">Offered Skill</th>
              <th className="px-2 text-left">Wanted Skill</th>
              <th className="px-2 text-left">Status</th>
              <th className="px-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {swaps.map(swap => (
              <tr key={swap.id} className="border-b border-[#E5E7EB] hover:bg-[#F1F3F7]">
                <td className="py-2 px-2 flex items-center gap-2">
                  {swap.fromUser?.image && <img src={swap.fromUser.image} alt="avatar" className="w-7 h-7 rounded-full border" />}
                  <span>{swap.fromUser?.name}</span>
                  <span className="text-xs text-gray-400">({swap.fromUser?.email})</span>
                </td>
                <td className="px-2 flex items-center gap-2">
                  {swap.toUser?.image && <img src={swap.toUser.image} alt="avatar" className="w-7 h-7 rounded-full border" />}
                  <span>{swap.toUser?.name}</span>
                  <span className="text-xs text-gray-400">({swap.toUser?.email})</span>
                </td>
                <td className="px-2">{swap.offeredSkill?.name}</td>
                <td className="px-2">{swap.wantedSkill?.name}</td>
                <td className="px-2">{swap.status}</td>
                <td className="px-2">{new Date(swap.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PlatformMessages() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin-messages")
      .then(res => res.json())
      .then(data => { setMessage(data.message || ""); setLoading(false); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/admin-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess("Message updated!");
      toast.success("Platform message updated!");
    } else {
      setError("Failed to update message");
      toast.error("Failed to update platform message");
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-lg font-semibold mb-3">Platform Messages</h2>
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 px-3 py-2 rounded mb-2">{success}</div>}
      <label className="block font-semibold">Current Platform Message:</label>
      <textarea
        className="w-full p-2 rounded bg-gray-800 border border-gray-700"
        rows={4}
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Enter a message to show to all users..."
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Message"}
      </button>
    </form>
  );
}

function Reports() {
  function download(type: string) {
    window.open(`/api/admin-reports?type=${type}`, "_blank");
  }
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Reports</h2>
      <div className="flex flex-wrap gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => download("users")}>Download Users Report</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => download("swaps")}>Download Swaps Report</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => download("feedback")}>Download Feedback Report</button>
      </div>
    </div>
  );
}

function VouchManagement() {
  const [vouches, setVouches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin-vouches")
      .then(res => res.json())
      .then(data => { setVouches(data); setLoading(false); });
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Vouch Management</h2>
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2">{error}</div>}
      {loading ? <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div> : (
        vouches.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No vouches found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB]">
                  <th className="py-2 px-2 text-left">Voucher</th>
                  <th className="px-2 text-left">Vouched For</th>
                  <th className="px-2 text-left">Skill Taught</th>
                  <th className="px-2 text-left">Skill Learned</th>
                  <th className="px-2 text-left">Swap ID</th>
                  <th className="px-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {vouches.map(vouch => {
                  // Determine who taught what: offeredSkill is what voucher taught to vouched
                  return (
                    <tr key={vouch.id} className="border-b border-[#E5E7EB] hover:bg-[#F1F3F7]">
                      <td className="py-2 px-2">{vouch.voucher?.name || vouch.voucherId}</td>
                      <td className="px-2">{vouch.vouched?.name || vouch.vouchedId}</td>
                      <td className="px-2">{vouch.swap?.offeredSkill?.name} ({vouch.swap?.offeredSkill?.type})</td>
                      <td className="px-2">{vouch.swap?.wantedSkill?.name} ({vouch.swap?.wantedSkill?.type})</td>
                      <td className="px-2">{vouch.swap?.id}</td>
                      <td className="px-2">{new Date(vouch.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
