"use client";
import { useState } from "react";
import { useRef } from "react";
import toast from "react-hot-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setSelectedFileName(file?.name || "");
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }

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
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, image: imageUrl, role: isAdmin ? "ADMIN" : undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed");
      toast.error(data.error || "Registration failed");
    } else {
      setSuccess("Registration successful! You can now log in.");
      toast.success("Registration successful! You can now log in.");
      setForm({ name: "", email: "", password: "", location: "", image: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-[#222]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6 border border-[#E5E7EB]"
      >
        <h2 className="text-2xl font-bold mb-4 text-[#111]">Register</h2>
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">{success}</div>}
        {/* Profile Photo Upload */}
        <div className="flex flex-col items-center mb-4">
          <Avatar className="w-24 h-24 border-4 border-[#F1F3F7] bg-white object-cover mb-2">
            <AvatarImage src={previewUrl || "/default-avatar.svg"} alt="Profile Photo" />
            <AvatarFallback>
              {form.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <label className="inline-block mt-2 cursor-pointer text-[#2563eb] font-semibold hover:underline">
            {selectedFileName ? selectedFileName : "Upload Photo"}
            <input
              className="hidden"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
        </div>
        <div>
          <label className="block mb-1 text-[#222] font-semibold">Name</label>
          <input
            className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-[#222] font-semibold">Email</label>
          <input
            className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-[#222] font-semibold">Password</label>
          <input
            className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-[#222] font-semibold">Location (optional)</label>
          <input
            className="w-full p-3 rounded-xl bg-[#F1F3F7] border border-[#E5E7EB] text-base text-[#222]"
            type="text"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={e => setIsAdmin(e.target.checked)}
              className="accent-blue-600"
            />
            <span className="text-[#222] font-medium">Register as admin</span>
          </label>
          {isAdmin && <div className="text-xs text-red-400 mt-1">Warning: This will give you admin privileges!</div>}
        </div>
        <button
          type="submit"
          className="w-full bg-[#F1F3F7] text-[#222] font-bold py-3 px-4 rounded-xl border border-[#E5E7EB] hover:bg-[#E5E7EB] disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
