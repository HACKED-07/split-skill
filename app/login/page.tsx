"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
      toast.error("Login failed. Please check your credentials.");
    } else {
      toast.success("Login successful!");
      router.push("/");
    }
  }

  return (
    <div className="relative bg-[#F8F9FB] text-[#222] w-full h-screen">
      <form
        onSubmit={handleSubmit}
        className="absolute inset-0 m-auto bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6 border border-[#E5E7EB] flex flex-col justify-center"
        style={{ top: 0, bottom: 0, left: 0, right: 0, height: 'fit-content' }}
      >
        <h2 className="text-2xl font-bold mb-4 text-[#111]">Login</h2>
        {error && <div className="text-red-500">{error}</div>}
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
        <button
          type="submit"
          className="w-full bg-[#F1F3F7] text-[#222] font-bold py-3 px-4 rounded-xl border border-[#E5E7EB] hover:bg-[#E5E7EB] disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
