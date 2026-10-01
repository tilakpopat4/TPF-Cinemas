import React, { useState } from 'react';
import { Film, Sparkles, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingBannerProps {
  onBecomeFilmmaker: () => Promise<{ success: boolean; error?: string }>;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({ onBecomeFilmmaker }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    const res = await onBecomeFilmmaker();
    if (!res.success) {
      setError(res.error || 'Failed to upgrade account');
    }
    setLoading(false);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 p-8 shadow-2xl backdrop-blur-xl mb-8">
      {/* Glow highlight */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>TPF Indie Creator Network</span>
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Share your film with audiences worldwide.
        </h2>

        <p className="mt-3 text-base text-slate-300 leading-relaxed">
          TPF Cinemas is built for indie creators and debut directors. Retain 100% of your copyright
          with our non-exclusive licence, submit via YouTube embed or direct stream, and reach thousands of cinema lovers.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Non-exclusive licensing (keep festival rights)</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>No submission or hosting fees</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Direct curator review & feedback</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleJoin}
            disabled={loading}
            className="btn btn-primary px-6 py-3 text-base flex items-center gap-2 shadow-xl shadow-rose-600/30"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Activating Filmmaker Studio...</span>
              </>
            ) : (
              <>
                <span>Become a Filmmaker</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
