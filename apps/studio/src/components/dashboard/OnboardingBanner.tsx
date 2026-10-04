import React, { useState } from 'react';
import { Film, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

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
    <div className="relative overflow-hidden rounded-3xl bg-[#0c0e14] p-8 sm:p-10 shadow-2xl mb-8">
      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-ivory mb-4">
          <Film className="h-3.5 w-3.5 text-signature" />
          <span>TPF Filmmaker Network</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black italic text-white font-display uppercase tracking-wide">
          Share your film with audiences worldwide.
        </h2>

        <p className="mt-3 text-sm text-muted leading-relaxed font-sans">
          TPF Cinemas is built for indie creators and debut directors. Retain 100% of your copyright
          with our non-exclusive licence, submit via YouTube embed or direct stream, and reach thousands of cinema lovers.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-zinc-300">
          <div className="flex items-center gap-2.5 bg-white/[0.04] p-3.5 rounded-xl">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Non-exclusive licensing (retain festival rights)</span>
          </div>
          <div className="flex items-center gap-2.5 bg-white/[0.04] p-3.5 rounded-xl">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>No submission or screening fees</span>
          </div>
          <div className="flex items-center gap-2.5 bg-white/[0.04] p-3.5 rounded-xl">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Direct curator review & feedback</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleJoin}
            disabled={loading}
            className="btn btn-primary px-6 py-3 text-xs uppercase font-mono tracking-wider font-bold flex items-center gap-2 shadow-xl shadow-signature/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
