import React, { useState } from 'react';
import {
  Edit3,
  Send,
  MessageSquareQuote,
  Clock,
  Loader2,
  Film as FilmIcon,
  LayoutGrid,
  List,
  Search,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { Film } from '../../types';
import { formatDuration, formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { RightsUndertakingModal } from '../legal/RightsUndertakingModal';

interface FilmsListProps {
  films: Film[];
  onEdit: (film: Film) => void;
  onViewFeedback: (film: Film) => void;
  onRefresh: () => void;
}

export const FilmsList: React.FC<FilmsListProps> = ({
  films,
  onEdit,
  onViewFeedback,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rightsModalFilm, setRightsModalFilm] = useState<Film | null>(null);

  // Filter by search query
  const filteredFilms = films.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.synopsis?.toLowerCase().includes(q) ||
      f.language?.toLowerCase().includes(q) ||
      f.film_genres?.some((fg) => fg.genres?.name.toLowerCase().includes(q))
    );
  });

  async function handleSubmitFilm(film: Film) {
    setSubmittingId(film.id);
    setSubmitError(null);

    // Pre-flight checks on client side
    if (!film.video_ref || !film.poster_url || !film.backdrop_url) {
      setSubmitError(`"${film.title}" requires a portrait poster, landscape banner, and a video link before submitting.`);
      setSubmittingId(null);
      return;
    }

    if (!film.licence_agreements) {
      setSubmitError(`"${film.title}" requires a signed non-exclusive licence agreement.`);
      setSubmittingId(null);
      return;
    }

    try {
      const { error } = await supabase.rpc('submit_film', {
        p_film_id: film.id,
      });

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError((err as Error).message);
    } finally {
      setSubmittingId(null);
    }
  }

  const getStatusBadge = (status: string, ipHold?: boolean) => {
    if (ipHold) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Lock className="h-3 w-3" />
          IP Hold
        </span>
      );
    }
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live on Platform
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-signature/10 text-signature">
            <Clock className="h-3 w-3" />
            In Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-500/10 text-rose-400">
            <AlertCircle className="h-3 w-3" />
            Changes Requested
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-rose-500/10 text-rose-400">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-white/[0.06] text-muted">
            Draft
          </span>
        );
    }
  };

  if (films.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0E1015] p-12 text-center my-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] text-muted mb-4 shadow-xl">
          <FilmIcon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white font-display">No films submitted yet</h3>
        <p className="mt-2 text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          Begin your journey on TPF Cinemas by submitting your short film or indie feature. Our curation team will review your work for official festival and platform streaming.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {submitError && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{submitError}</span>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            className="text-xs font-bold underline hover:text-white ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar: Search and View Mode Switcher */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search your submissions by title, genre, language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f131c] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/10">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Table View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {filteredFilms.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0f131c]/60 p-12 text-center my-4 backdrop-blur-md">
          <FilmIcon className="h-8 w-8 mx-auto text-zinc-500 mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-white font-display">No submissions match this view</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Try adjusting your search query or switching to another filter tab above.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFilms.map((film) => {
            const isSubmitting = submittingId === film.id;
            const hasFeedback = film.status === 'changes_requested' || film.status === 'rejected';

            return (
              <div
                key={film.id}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f131c]/90 backdrop-blur-md shadow-lg transition-all hover:border-white/20 hover:shadow-2xl flex flex-col"
              >
                {/* Poster Banner — uses landscape backdrop when available, falls back to portrait */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/60 border-b border-white/[0.06]">
                  {(film.backdrop_url || film.poster_url) ? (
                    <img
                      src={film.backdrop_url || film.poster_url!}
                      alt={film.title}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-zinc-600">
                      <FilmIcon className="h-10 w-10 mb-1 opacity-40" />
                      <span className="text-[11px] font-medium">No poster uploaded</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f131c] via-transparent to-transparent opacity-80" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <div>{getStatusBadge(film.status, film.ip_hold)}</div>
                    {film.is_debut && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-md">
                        Debut
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-white tracking-tight leading-snug group-hover:text-rose-400 transition-colors">
                        {film.title}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-white/10 bg-white/5 text-zinc-300 shrink-0">
                        {film.age_rating}
                      </span>
                    </div>

                    {film.ip_hold && (
                      <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Copyright IP Hold Active</span>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          {film.ip_hold_reason || 'Withheld from public catalogue following a copyright complaint under IT Act 2000 §79.'}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Contact <a href="mailto:legal@tpfcinemas.com" className="underline text-rose-300 hover:text-white">legal@tpfcinemas.com</a> within 14 days with proof of rights.
                        </p>
                      </div>
                    )}

                    {film.status === 'changes_requested' && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-signature/10 text-[11px] text-signature flex items-center justify-between gap-2">
                        <span className="font-medium">Curator requested changes</span>
                        <button
                          onClick={() => onViewFeedback(film)}
                          className="font-bold underline text-ivory hover:text-signature"
                        >
                          View Notes
                        </button>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {film.synopsis || 'No synopsis provided yet.'}
                    </p>

                    {/* Metadata chips */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        {formatDuration(film.runtime_minutes || 0)}
                      </span>
                      <span>•</span>
                      <span>{film.language}</span>
                      <span>•</span>
                      <span>{film.release_year}</span>
                    </div>

                    {/* Genres */}
                    {film.film_genres && film.film_genres.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {film.film_genres.map((fg) => (
                          <span
                            key={fg.genre_id}
                            className="px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 text-[10px] font-medium border border-white/5"
                          >
                            {fg.genres?.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      {(film.status === 'draft' || film.status === 'changes_requested') && (
                        <button
                          onClick={() => onEdit(film)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Curator Feedback Button */}
                      {hasFeedback && (
                        <button
                          onClick={() => onViewFeedback(film)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors"
                        >
                          <MessageSquareQuote className="h-3.5 w-3.5" />
                          <span>Feedback</span>
                        </button>
                      )}

                      {/* Official Rights Undertaking & Legal Deed */}
                      {film.licence_agreements && (
                        <button
                          onClick={() => setRightsModalFilm(film)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="View & Print Official Legal Deed of Rights & Undertaking"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          <span>Rights Deed</span>
                        </button>
                      )}
                    </div>

                    {/* Submit Button */}
                    {(film.status === 'draft' || film.status === 'changes_requested') && (
                      <button
                        onClick={() => handleSubmitFilm(film)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Submit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Data Table View */
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f131c]/90 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-[11px] uppercase font-bold text-zinc-400 tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="px-5 py-3.5">Film</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Runtime</th>
                  <th className="px-4 py-3.5">Language</th>
                  <th className="px-4 py-3.5">Licence</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                {filteredFilms.map((film) => {
                  const isSubmitting = submittingId === film.id;
                  return (
                    <tr key={film.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-14 rounded-lg bg-black/60 overflow-hidden shrink-0 border border-white/10">
                            {film.poster_url ? (
                              <img src={film.poster_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-zinc-600">
                                <FilmIcon className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white font-display text-sm">{film.title}</p>
                            <p className="text-[11px] text-zinc-400 truncate max-w-xs">{film.synopsis || 'No synopsis'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(film.status, film.ip_hold)}</td>
                      <td className="px-4 py-3.5">{formatDuration(film.runtime_minutes || 0)}</td>
                      <td className="px-4 py-3.5 capitalize">{film.language}</td>
                      <td className="px-4 py-3.5">
                        {film.licence_agreements ? (
                          <button
                            onClick={() => setRightsModalFilm(film)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors"
                            title="Click to view & print official OTT Rights Undertaking"
                          >
                            <FileCheck2 className="h-3.5 w-3.5" />
                            <span>Signed (Print)</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted font-mono">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500 text-[11px]">{formatDate(film.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {film.licence_agreements && (
                            <button
                              onClick={() => setRightsModalFilm(film)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition-colors"
                              title="Print Official Legal Rights Undertaking"
                            >
                              <FileCheck2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {(film.status === 'draft' || film.status === 'changes_requested') && (
                            <>
                              <button
                                onClick={() => onEdit(film)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                title="Edit Film"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleSubmitFilm(film)}
                                disabled={isSubmitting}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1"
                              >
                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                <span>Submit</span>
                              </button>
                            </>
                          )}
                          {film.status === 'published' && (
                            <span className="text-[11px] font-semibold text-emerald-400">Live</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official OTT Format Legal Rights Undertaking Modal */}
      {rightsModalFilm && (
        <RightsUndertakingModal
          film={rightsModalFilm}
          onClose={() => setRightsModalFilm(null)}
        />
      )}
    </div>
  );
};
