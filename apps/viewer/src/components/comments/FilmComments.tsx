import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Comment, Profile } from '../../types';

interface FilmCommentsProps {
  filmId: string;
  user: any;
  profile: Profile | null;
  onOpenAuth: () => void;
}

export const FilmComments: React.FC<FilmCommentsProps> = ({
  filmId,
  user,
  profile,
  onOpenAuth,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filmId);

  const fetchComments = useCallback(async () => {
    if (!isUuid) {
      setComments([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('comments')
        .select(`
          id, film_id, user_id, body, is_hidden, created_at,
          profile:user_id (
            id, role, display_name, avatar_url
          )
        `)
        .eq('film_id', filmId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setComments((data as unknown as Comment[]) || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filmId, isUuid]);

  useEffect(() => {
    fetchComments();

    if (!isUuid) return;

    // Listen for comments in realtime
    const channel = supabase
      .channel(`comments-${filmId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `film_id=eq.${filmId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filmId, fetchComments]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    const trimmed = newComment.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      setError(null);

      const { data, error: insertErr } = await supabase
        .from('comments')
        .insert({
          film_id: filmId,
          user_id: user.id,
          body: trimmed,
        })
        .select(`
          id, film_id, user_id, body, is_hidden, created_at
        `)
        .single();

      if (insertErr) throw insertErr;

      setNewComment('');
      // Optimistic append
      if (data) {
        setComments((prev) => [
          ...prev,
          {
            ...data,
            profile: profile || {
              id: user.id,
              role: 'viewer',
              display_name: user.email?.split('@')[0] || 'Viewer',
            },
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const { error: deleteErr } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteErr) throw deleteErr;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  return (
    <div className="space-y-4 pt-6 border-t border-white/10">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-signature" />
          <span>Audience Discussion ({comments.length})</span>
        </h4>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Comment Input */}
      {user ? (
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Share your thoughts on the film..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={1000}
            className="flex-1 bg-zinc-900/80 border border-white/15 focus:border-signature rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2.5 rounded-xl bg-signature hover:bg-[#F2B94F] disabled:opacity-50 text-black font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <Send className="h-3.5 w-3.5 text-black" />}
            <span>Post</span>
          </button>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 flex items-center justify-between">
          <p className="text-xs text-zinc-400">Sign in to participate in the conversation.</p>
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-6 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-zinc-500 italic text-center py-4">
            No thoughts yet. Be the first to leave a review!
          </p>
        ) : (
          comments.map((comment) => {
            const isOwner = user?.id === comment.user_id;
            return (
              <div
                key={comment.id}
                className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {comment.profile?.display_name || 'Audience Member'}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed break-words">
                    {comment.body}
                  </p>
                </div>

                {isOwner && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Delete Comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
