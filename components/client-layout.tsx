"use client";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import Link from "next/link";
import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Menu, X } from "lucide-react";
import { LoadingSpinner } from "./ui/loading-spinner";

function NavLinks({ isMobile = false, onClose }: { isMobile?: boolean; onClose?: () => void }) {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div className="flex items-center justify-center h-12 w-full"><LoadingSpinner size="sm" /></div>;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Logged out successfully");
    onClose?.();
  };

  const linkClasses = isMobile 
    ? "block w-full text-left py-3 px-4 text-[#222] hover:bg-[#F1F3F7] border-b border-[#E5E7EB]"
    : "text-[#222] hover:underline";

  return (
    <>
      <Link href="/" className={`text-xl font-bold text-[#2563eb] ${isMobile ? "block py-3 px-4 border-b border-[#E5E7EB]" : ""}`}>
        Split Skill
      </Link>
      <Link href="/explore" className={linkClasses} onClick={onClose}>Explore</Link>
      {session?.user ? (
        <>
          <Link href="/profile" className={linkClasses} onClick={onClose}>Profile</Link>
          <Link href="/swaps" className={linkClasses} onClick={onClose}>Swaps</Link>
          {session.user.role === "ADMIN" && (
            <Link href="/admin" className={linkClasses} onClick={onClose}>Admin</Link>
          )}
          <button 
            onClick={handleLogout}
            className={linkClasses}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={linkClasses} onClick={onClose}>Login</Link>
          <Link href="/register" className={linkClasses} onClick={onClose}>Register</Link>
        </>
      )}
    </>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SessionProvider>
      <Toaster position="top-right" />
      <nav className="w-full bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-8 py-5">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 font-semibold text-base">
            <NavLinks />
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#2563eb] p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg mx-2">
            <NavLinks isMobile={true} onClose={() => setMobileMenuOpen(false)} />
          </div>
        )}
      </nav>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {children}
      </div>
    </SessionProvider>
  );
}
