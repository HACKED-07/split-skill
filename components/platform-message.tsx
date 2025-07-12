"use client";
import { useState, useEffect } from "react";

export function PlatformMessage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin-messages")
      .then(res => res.json())
      .then(data => {
        setMessage(data.message || "");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !message) return null;

  return (
    <div className="bg-blue-900 border border-blue-700 text-blue-100 px-3 sm:px-4 py-3 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <span className="text-blue-300">📢</span>
        <span className="font-medium text-sm sm:text-base">Platform Message:</span>
      </div>
      <p className="mt-1 text-xs sm:text-sm">{message}</p>
    </div>
  );
} 