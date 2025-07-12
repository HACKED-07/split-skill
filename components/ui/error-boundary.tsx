"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] text-[#222] p-4">
          <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] shadow-lg max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
            <p className="text-[#444] mb-4 text-sm sm:text-base">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-2 px-4 rounded-xl w-full sm:w-auto"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorMessage({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-900 border border-red-700 text-red-100 px-3 sm:px-4 py-3 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <span className="text-red-300">⚠️</span>
        <span className="font-medium text-sm sm:text-base">Error:</span>
      </div>
      <p className="mt-1 text-xs sm:text-sm">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1 rounded w-full sm:w-auto"
        >
          Try Again
        </button>
      )}
    </div>
  );
} 