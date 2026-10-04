import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useReducedMotion, fadeOnly } from '../../lib/motion';

interface ViewerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextPrompt?: string;
}

function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

export const ViewerAuthModal: React.FC<ViewerAuthModalProps> = ({ isOpen, onClose, contextPrompt }) => {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      const { error: oAuthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oAuthErr) throw oAuthErr;
    } catch (err) {
      console.error('Google auth error:', err);
      setError((err as Error).message);
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
        onClose();
      } else {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || email.split('@')[0],
            },
          },
        });
        if (signUpErr) throw signUpErr;

        if (data.session) {
          onClose();
        } else {
          setSuccessMsg('Account created. Please verify your email before screening.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-canvas/85"
          {...fadeOnly(reduced)}
        >
          <motion.div
            className="relative w-full max-w-sm bg-[#12141a] rounded-2xl p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.95)]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted hover:text-ivory rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-left mb-6">
              {contextPrompt && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-signature/15 text-signature text-xs font-sans flex items-center gap-2">
                  <LogIn className="h-3.5 w-3.5 shrink-0" />
                  <span>{contextPrompt}</span>
                </div>
              )}
              <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-ivory mt-1 leading-tight">
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h3>
              <p className="text-xs text-muted mt-1.5 leading-[1.5]">
                {mode === 'signin'
                  ? 'Access your personal screening queue, synchronized history, and filmmaker discussions.'
                  : 'Join an independent audience supporting first-time directors worldwide.'}
              </p>
            </div>

            {/* Mode switch (Border-free modern pill) */}
            <div className="flex bg-white/[0.05] p-1 mb-4 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 font-display text-[11px] uppercase tracking-wider rounded-lg transition-all ${mode === 'signin'
                  ? 'bg-signature text-black font-bold shadow-sm'
                  : 'text-muted hover:text-ivory'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 font-display text-[11px] uppercase tracking-wider rounded-lg transition-all ${mode === 'signup'
                  ? 'bg-signature text-black font-bold shadow-sm'
                  : 'text-muted hover:text-ivory'
                  }`}
              >
                Register
              </button>
            </div>

            {/* Google Authentication Option */}
            <div className="mb-4">
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-60 border-none"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                ) : (
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <span className="relative px-3 bg-[#12141a] text-[10px] uppercase font-mono tracking-widest text-muted">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Error / success alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 p-3 bg-red-950/70 rounded-xl text-xs text-red-300 flex items-center gap-2 font-sans"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  className="mb-4 p-3 bg-emerald-950/70 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-sans"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block font-display text-[10px] uppercase tracking-wider text-muted mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Maya Sen"
                    className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] rounded-xl px-4 py-3 text-xs sm:text-sm text-ivory placeholder:text-muted/50 focus:outline-none transition-all font-sans"
                  />
                </div>
              )}

              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] rounded-xl px-4 py-3 text-xs sm:text-sm text-ivory placeholder:text-muted/50 focus:outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label className="block font-display text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] rounded-xl px-4 py-3 text-xs sm:text-sm text-ivory placeholder:text-muted/50 focus:outline-none transition-all font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-signature hover:bg-signature-hover text-black font-display font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:scale-[1.01] active:scale-[0.98] mt-4 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Sign Up</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
