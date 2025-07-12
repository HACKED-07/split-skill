import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6 sm:w-8 sm:h-8", 
    lg: "w-10 h-10 sm:w-12 sm:h-12"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}></div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 flex items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  );
} 

export function HydrationBars({ className = "", style = {} }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div className={`w-full flex flex-col gap-2 ${className}`} style={style}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-3 rounded bg-gradient-to-r from-[#e0e7ef] via-[#f1f5fa] to-[#e0e7ef]"
          style={{ width: `${80 + i * 10}%`, minWidth: 80, maxWidth: '100%' }}
        />
      ))}
    </div>
  );
} 