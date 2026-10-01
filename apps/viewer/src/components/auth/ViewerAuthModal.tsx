import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, AlertCircle, Loader2, Film, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useReducedMotion, fadeOnly, scaleModal, springSnappy } from '../../lib/motion';

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
          setSuccessMsg('Account created! Please check your email to verify your address before signing in.');
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          {...fadeOnly(reduced)}
        >
          <motion.div
            className="relative w-full max-w-md bg-[#0d1017] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl"
            {...scaleModal(reduced)}
          >
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
              whileTap={reduced ? {} : { scale: 0.88, transition: springSnappy }}
            >
              <X className="h-5 w-5" />
            </motion.button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
                <Film className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                {mode === 'signin' ? 'Welcome Back to TPF Cinemas' : 'Create Viewer Account'}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {mode === 'signin'
                  ? 'Sign in to access your watchlist, resume streams, and join discussions.'
                  : 'Join the community of cinema lovers streaming independent cinema.'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-zinc-900/80 p-1 border border-white/5 mb-6">
              <motion.button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'signin'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                whileTap={reduced ? {} : { scale: 0.97, transition: springSnappy }}
              >
                Sign In
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'signup'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                whileTap={reduced ? {} : { scale: 0.97, transition: springSnappy }}
              >
                Create Account
              </motion.button>
            </div>

            {/* Error / success alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {successMsg && (
                <motion.div
                  className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form fields — signup-only field slides in */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence initial={false}>
                {mode === 'signup' && (
                  <motion.div
                    key="display-name"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                  >
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Maya Sen"
                      className="w-full bg-zinc-900/80 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full bg-zinc-900/80 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/80 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                whileTap={reduced ? {} : { scale: 0.97, transition: springSnappy }}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to TPF Cinemas</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Register Viewer Account</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
