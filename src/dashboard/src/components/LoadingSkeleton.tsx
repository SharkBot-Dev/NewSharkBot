"use client";

export default function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-4">
      <div className="animate-pulse bg-slate-200 h-48 w-full rounded-lg"></div>
      
      <div className="space-y-3">
        <div className="animate-pulse bg-slate-200 h-6 w-3/4 rounded"></div>
        <div className="space-y-2">
          <div className="animate-pulse bg-slate-200 h-4 w-full rounded"></div>
          <div className="animate-pulse bg-slate-200 h-4 w-5/6 rounded"></div>
        </div>
      </div>
    </div>
  );
}