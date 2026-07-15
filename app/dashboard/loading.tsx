import * as React from "react"
import { 
  Home, 
  FileText, 
  ArrowLeftRight, 
  FileSpreadsheet, 
  Lock, 
  Settings, 
  LogOut, 
  Bell, 
  ChevronDown 
} from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
      {/* 1. SIDEBAR SKELETON */}
      <aside className="w-64 bg-slate-900 text-slate-400 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-8">
          {/* Logo and Tier Skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse flex items-center justify-center font-black text-slate-300 text-sm">
              IS
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 bg-slate-800 rounded-md animate-pulse" />
              <div className="h-2.5 w-16 bg-slate-800 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6">
            {/* Group: MENU */}
            <div className="space-y-2">
              <div className="h-2 w-10 bg-slate-800 rounded-sm animate-pulse mb-3 pl-1" />
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 text-slate-300">
                <Home className="w-4 h-4 text-slate-500" />
                <div className="h-3 w-16 bg-slate-700/60 rounded-md" />
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500">
                <FileText className="w-4 h-4 text-slate-650" />
                <div className="h-3 w-20 bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>

            {/* Group: FINANCIAL */}
            <div className="space-y-2">
              <div className="h-2 w-16 bg-slate-800 rounded-sm animate-pulse mb-3 pl-1" />
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <ArrowLeftRight className="w-4 h-4" />
                <div className="h-3 w-24 bg-slate-800 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <FileSpreadsheet className="w-4 h-4" />
                <div className="h-3 w-20 bg-slate-800 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <Lock className="w-3.5 h-3.5" />
                <div className="h-3 w-24 bg-slate-800 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <Lock className="w-3.5 h-3.5" />
                <div className="h-3 w-20 bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>

            {/* Group: TOOLS */}
            <div className="space-y-2">
              <div className="h-2 w-12 bg-slate-800 rounded-sm animate-pulse mb-3 pl-1" />
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <Lock className="w-3.5 h-3.5" />
                <div className="h-3 w-14 bg-slate-800 rounded-md animate-pulse" />
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 text-slate-500">
                <Settings className="w-4 h-4" />
                <div className="h-3 w-20 bg-slate-800 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom logout skeleton */}
        <div className="flex items-center gap-3 px-3 py-2.5 text-slate-550 border-t border-slate-800/60 pt-4">
          <LogOut className="w-4 h-4 text-slate-600" />
          <div className="h-3 w-16 bg-slate-800 rounded-md animate-pulse" />
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA SKELETON */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Top Header Skeleton */}
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-15">
          <div className="space-y-1.5">
            <div className="h-4.5 w-24 bg-slate-200 rounded-md animate-pulse" />
            <div className="h-2.5 w-36 bg-slate-100 rounded-md animate-pulse" />
          </div>

          <div className="flex items-center gap-4">
            {/* Quick search input skeleton */}
            <div className="h-9 w-52 bg-slate-50 border border-slate-200/60 rounded-xl animate-pulse hidden md:block" />
            
            {/* Action button skeleton */}
            <div className="h-9 w-36 bg-slate-200 rounded-xl animate-pulse hidden sm:block" />
            
            {/* Bell icon */}
            <div className="w-9 h-9 flex items-center justify-center text-slate-300">
              <Bell className="w-4.5 h-4.5" />
            </div>

            {/* Profile skeleton */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200/60">
              <div className="w-8 h-8 rounded-xl bg-slate-200 animate-pulse shrink-0" />
              <div className="space-y-1 hidden lg:block">
                <div className="h-3 w-20 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-2 w-14 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 hidden lg:block" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          
          {/* Card Indicator Row Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4 h-24">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-4.5 w-28 bg-slate-350 rounded-md animate-pulse" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4 h-24">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-4.5 w-20 bg-slate-350 rounded-md animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4 h-24">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-4.5 w-16 bg-slate-350 rounded-md animate-pulse" />
              </div>
            </div>
          </div>

          {/* Charts area skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart placeholder (2/3 width) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between h-[340px]">
              <div className="flex items-center justify-between pb-4">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-slate-200 rounded-md animate-pulse" />
                  <div className="h-2.5 w-48 bg-slate-100 rounded-md animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="h-2 w-1/3 bg-slate-200 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Category breakdown (1/3 width) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between h-[340px]">
              <div className="space-y-1.5 pb-4">
                <div className="h-3.5 w-28 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-2.5 w-36 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse flex items-center justify-center relative">
                {/* Simulated pie chart ring */}
                <div className="w-24 h-24 rounded-full border-[10px] border-slate-150 animate-pulse flex items-center justify-center">
                  <div className="h-2.5 w-8 bg-slate-200 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Invoices List Table Skeleton */}
          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 bg-slate-200 rounded-md animate-pulse" />
                <div className="h-2.5 w-44 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
            </div>

            {/* Row Skeletons */}
            <div className="space-y-3.5 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-36 bg-slate-200 rounded-md animate-pulse" />
                      <div className="h-2.5 w-16 bg-slate-100 rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3.5 w-24 bg-slate-250 rounded-md animate-pulse hidden sm:block" />
                  <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse mr-8" />
                  <div className="h-3.5 w-20 bg-slate-250 rounded-md animate-pulse text-right" />
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
