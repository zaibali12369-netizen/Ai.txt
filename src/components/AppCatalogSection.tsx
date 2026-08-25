import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppItem, fetchLiveApps } from '../services/appDataService';
import { AppCard } from './AppCard';
import { PremiumUnlockModal } from './PremiumUnlockModal';
import { DownloadDetailModal } from './DownloadDetailModal';
import { audioEngine } from '../utils/audioSynthesizer';
import { 
  Search, 
  Filter, 
  RotateCw, 
  DownloadCloud, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  X,
  ArrowDownUp,
  Zap,
  Lock,
  RefreshCw
} from 'lucide-react';

export const AppCatalogSection: React.FC = () => {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAccess, setSelectedAccess] = useState<'all' | 'normal' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'name-asc' | 'size-desc'>('date-desc');

  // Modals
  const [selectedDetailApp, setSelectedDetailApp] = useState<AppItem | null>(null);
  const [selectedUnlockApp, setSelectedUnlockApp] = useState<AppItem | null>(null);

  // Track previous apps JSON to prevent unnecessary state re-renders
  const appsJsonRef = useRef<string>('');

  // Live Refresh Countdown State (3s -> 2s -> 1s -> Just now)
  const [secondsUntilSync, setSecondsUntilSync] = useState<number>(3);
  const [isJustNow, setIsJustNow] = useState<boolean>(true);
  const lastSyncCompletedRef = useRef<number>(Date.now());

  // Load apps with silent background sync
  const loadApps = async (isBackground: boolean = false, force: boolean = false) => {
    if (!isBackground) {
      if (force) setIsManualSyncing(true);
      else if (apps.length === 0) setIsLoading(true);
    } else {
      setIsAutoSyncing(true);
    }

    try {
      const res = await fetchLiveApps(force);
      if (res.error && res.apps.length === 0) {
        if (!isBackground) setError(res.error);
      } else {
        const newJson = JSON.stringify(res.apps);
        // Only update apps array if data changed to preserve smooth UI
        if (newJson !== appsJsonRef.current) {
          appsJsonRef.current = newJson;
          setApps(res.apps);
          setCategories(res.categories);
        }
        setLastSyncTime(res.lastUpdated);
        setError(null);

        // Reset the live countdown to "Just now" upon successful synchronization
        lastSyncCompletedRef.current = Date.now();
        setIsJustNow(true);
        setSecondsUntilSync(3);
      }
    } catch (err: any) {
      if (!isBackground && apps.length === 0) {
        setError(err.message || 'Unable to load repository files. Please retry.');
      }
    } finally {
      setIsLoading(false);
      setIsManualSyncing(false);
      setIsAutoSyncing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadApps(false, false);
  }, []);

  // 3-second automatic live background sync interval + 1-second countdown ticker
  useEffect(() => {
    // 3-second live sync interval
    const syncInterval = setInterval(() => {
      if (!document.hidden) {
        loadApps(true, true);
      }
    }, 3000);

    // 1-second countdown ticker for smooth UI display (Just now -> 3s -> 2s -> 1s -> Just now)
    const tickerInterval = setInterval(() => {
      const elapsedMs = Date.now() - lastSyncCompletedRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);

      if (elapsedSec < 1) {
        setIsJustNow(true);
        setSecondsUntilSync(3);
      } else {
        setIsJustNow(false);
        const remaining = Math.max(1, 4 - elapsedSec);
        setSecondsUntilSync(remaining);
      }
    }, 500);

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        loadApps(true, true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(syncInterval);
      clearInterval(tickerInterval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, []);

  const handleManualSync = () => {
    audioEngine.triggerPulseChirp();
    loadApps(false, true);
  };

  // Filter and Sort Logic
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch = 
        !searchQuery.trim() ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.fileType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'All' || 
        app.fileType.toUpperCase() === selectedCategory.toUpperCase();

      const matchesAccess = 
        selectedAccess === 'all' || 
        (selectedAccess === 'normal' && app.accessType !== 'premium') ||
        (selectedAccess === 'premium' && app.accessType === 'premium');

      return matchesSearch && matchesCategory && matchesAccess;
    }).sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'size-desc') {
        const sizeA = parseFloat(a.fileSize) || 0;
        const sizeB = parseFloat(b.fileSize) || 0;
        return sizeB - sizeA;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [apps, searchQuery, selectedCategory, selectedAccess, sortBy]);

  const totalFreeApps = apps.filter((a) => a.accessType !== 'premium').length;
  const totalVipApps = apps.filter((a) => a.accessType === 'premium').length;

  return (
    <section id="downloads" className="pt-2 sm:pt-4 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 scroll-mt-20">
      
      {/* 1. Header & Live Repository Status Banner (Modern 3D Black Downlink Matrix) */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#0b0f1a]/95 via-[#070a12]/95 to-[#04060a] border border-white/10 hover:border-orange-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(249,115,22,0.06)] backdrop-blur-2xl overflow-hidden transition-all duration-300">
        {/* Subtle Neon Glass Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/80 to-transparent" />

        {/* Ambient Tech Glow Accents */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono tracking-wider shadow-sm">
              <DownloadCloud size={14} className="text-orange-400 animate-pulse" />
              <span className="font-semibold">MTube LIVE DOWNLINK MATRIX</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
              DOWNLOAD APPLICATION REPOSITORY
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-tech leading-relaxed">
              Live synchronized application repository with verified cryptographic integrity, zero bandwidth throttling, and instant download downlink.
            </p>
          </div>

          {/* Top action area */}
          <div className="flex items-center gap-3">
          </div>
        </div>

        {/* 2. Four Live Dynamic Downloading-App Statistics Cards */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 mt-6 border-t border-white/10">
          
          {/* STAT 1: Premium Files (Live VIP Count) */}
          <div className="group relative bg-gradient-to-b from-[#18130b]/80 via-[#0e111a]/85 to-[#060810]/95 border border-amber-500/25 hover:border-amber-400/60 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.18)] transition-all duration-300 card-premium-glow">
            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/35 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Lock size={18} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Premium Files
              </div>
              <div className="text-lg sm:text-2xl font-extrabold font-mono text-amber-400 tracking-tight flex items-baseline gap-1.5">
                <span>{totalVipApps}</span>
                <span className="text-[10px] font-normal text-amber-300/70 uppercase">VIP</span>
              </div>
            </div>
          </div>

          {/* STAT 2: Normal Files (Live Free Count) */}
          <div className="group relative bg-gradient-to-b from-[#0c1424]/80 via-[#080e1a]/85 to-[#050711]/95 border border-cyan-500/25 hover:border-cyan-400/60 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(6,182,212,0.18)] transition-all duration-300 card-normal-glow">
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Normal Files
              </div>
              <div className="text-lg sm:text-2xl font-extrabold font-mono text-emerald-400 tracking-tight flex items-baseline gap-1.5">
                <span>{totalFreeApps}</span>
                <span className="text-[10px] font-normal text-emerald-300/70 uppercase">Free</span>
              </div>
            </div>
          </div>

          {/* STAT 3: Total Files (Live Total Count = Premium + Normal) */}
          <div className="group relative bg-gradient-to-b from-[#14101d]/80 via-[#0d0c18]/85 to-[#060710]/95 border border-orange-500/25 hover:border-orange-400/60 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(249,115,22,0.18)] transition-all duration-300">
            <div className="p-2.5 sm:p-3 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/35 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Layers size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Total Files
              </div>
              <div className="text-lg sm:text-2xl font-extrabold font-mono text-orange-400 tracking-tight flex items-baseline gap-1.5">
                <span>{apps.length}</span>
                <span className="text-[10px] font-normal text-orange-300/70 uppercase">Assets</span>
              </div>
            </div>
          </div>

          {/* STAT 4: Live Sync (Live 3-Second Refresh Countdown) */}
          <div className="group relative bg-gradient-to-b from-[#08151b]/80 via-[#060f16]/85 to-[#04080e]/95 border border-cyan-500/25 hover:border-emerald-400/60 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3.5 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.18)] transition-all duration-300">
            <div className="p-2.5 sm:p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/35 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Zap size={18} className="animate-pulse text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                Live Sync
              </div>
              <div className="text-base sm:text-xl font-extrabold font-mono text-emerald-400 tracking-tight flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {isJustNow ? (
                  <span className="text-emerald-300 transition-all duration-200">Just now</span>
                ) : (
                  <span className="text-cyan-300 font-mono transition-all duration-200">{secondsUntilSync}s</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Search & Filter Controls Bar */}
      <div className="bg-gradient-to-r from-[#0c111c] to-[#070a10] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search apps, tools, or packages by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/15 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-tech placeholder:text-slate-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Access Type Filter Tabs */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                setSelectedAccess('all');
                audioEngine.triggerPulseChirp();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedAccess === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL ({apps.length})
            </button>
            <button
              onClick={() => {
                setSelectedAccess('normal');
                audioEngine.triggerPulseChirp();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedAccess === 'normal'
                  ? 'bg-emerald-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FREE ({totalFreeApps})
            </button>
            <button
              onClick={() => {
                setSelectedAccess('premium');
                audioEngine.triggerPulseChirp();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedAccess === 'premium'
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VIP ({totalVipApps})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-black/60 px-3.5 py-2 rounded-xl border border-white/10 shrink-0">
            <ArrowDownUp size={14} className="text-orange-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-mono text-slate-300 outline-none cursor-pointer"
            >
              <option value="date-desc" className="bg-[#0c111c] text-white">Latest Added</option>
              <option value="name-asc" className="bg-[#0c111c] text-white">Name (A-Z)</option>
              <option value="size-desc" className="bg-[#0c111c] text-white">File Size</option>
            </select>
          </div>
        </div>

        {/* Dynamic Category Chips */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
            <span className="text-[11px] font-mono text-slate-500 uppercase shrink-0 mr-1 flex items-center gap-1">
              <Filter size={12} /> File Types:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  audioEngine.triggerPulseChirp();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory.toUpperCase() === cat.toUpperCase()
                    ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/50 shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/15'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Main Apps Grid / States */}
      {isLoading && apps.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-14 bg-white/10 rounded-full" />
                  <div className="h-5 w-20 bg-white/10 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
                <div className="h-4 w-full bg-white/10 rounded-lg" />
                <div className="h-4 w-2/3 bg-white/10 rounded-lg" />
              </div>
              <div className="h-10 w-full bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error && apps.length === 0 ? (
        <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-display text-white">
              Unable to load files. Please try again.
            </h3>
            <p className="text-xs text-rose-300 font-mono">
              Live endpoint did not respond or network is interrupted.
            </p>
          </div>
          <button
            onClick={() => loadApps(false, true)}
            className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs tracking-wider transition-all shadow-lg shadow-rose-500/20 active:scale-95"
          >
            RETRY LIVE SYNC
          </button>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/5 border border-white/10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
            <Search size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-display text-white">
              No Matching Apps Found
            </h3>
            <p className="text-xs text-slate-400 font-tech">
              No files match your query "{searchQuery}". Try clearing filters or searching another keyword.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedAccess('all');
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs font-mono transition-all"
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onOpenDetails={(a) => setSelectedDetailApp(a)}
              onOpenUnlockModal={(a) => setSelectedUnlockApp(a)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <DownloadDetailModal
        app={selectedDetailApp}
        isOpen={Boolean(selectedDetailApp)}
        onClose={() => setSelectedDetailApp(null)}
        onUnlockRequest={(a) => setSelectedUnlockApp(a)}
      />

      <PremiumUnlockModal
        app={selectedUnlockApp}
        isOpen={Boolean(selectedUnlockApp)}
        onClose={() => setSelectedUnlockApp(null)}
        onUnlocked={(unlockedApp) => {
          // Keep modal open so the user can view the Authorized Premium Download Card and click Download
        }}
      />
    </section>
  );
};
