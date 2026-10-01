import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useReducedMotion, fadeOnly } from '../../lib/motion';

interface ViewerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ViewerAuthModal: React.FC<ViewerAuthModalProps> = ({ isOpen, onClose }) => {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/85"
          {...fadeOnly(reduced)}
        >
          <motion.div
            className="relative w-full max-w-sm bg-graphite border border-hairline rounded-sm p-6 sm:p-7 shadow-2xl"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-muted hover:text-ivory rounded-sm transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-left mb-6">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-signature font-bold">
                TPF Cinemas Access
              </span>
              <h3 className="font-editorial text-2xl font-normal text-ivory mt-0.5 leading-tight">
                {mode === 'signin' ? 'Sign In to Stream' : 'Register Viewer Pass'}
              </h3>
              <p className="text-xs text-muted mt-1 leading-[1.5]">
                {mode === 'signin'
                  ? 'Access your personal screening queue, synchronized history, and filmmaker discussions.'
                  : 'Join an independent audience supporting first-time directors worldwide.'}
              </p>
            </div>

            {/* Mode switch */}
            <div className="flex bg-canvas p-1 border border-hairline mb-5 rounded-sm">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors rounded-none ${
                  mode === 'signin'
                    ? 'bg-signature text-black font-bold'
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
                className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors rounded-none ${
                  mode === 'signup'
                    ? 'bg-signature text-black font-bold'
                    : 'text-muted hover:text-ivory'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error / success alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 p-2.5 bg-red-950/60 border border-red-500/30 rounded-sm text-xs text-red-300 flex items-center gap-2 font-sans"
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
                  className="mb-4 p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-sm text-xs text-emerald-300 flex items-center gap-2 font-sans"
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
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Maya Sen"
                    className="w-full bg-canvas border border-hairline focus:border-signature rounded-sm px-3 py-2 text-xs text-ivory placeholder:text-muted/60 focus:outline-none transition-colors font-sans"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-canvas border border-hairline focus:border-signature rounded-sm px-3 py-2 text-xs text-ivory placeholder:text-muted/60 focus:outline-none transition-colors font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-canvas border border-hairline focus:border-signature rounded-sm px-3 py-2 text-xs text-ivory placeholder:text-muted/60 focus:outline-none transition-colors font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Enter Cinema</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Create Pass</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
