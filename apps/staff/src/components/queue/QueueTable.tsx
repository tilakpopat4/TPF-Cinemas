import React, { useState } from 'react';
import { Search, Film as FilmIcon, Sparkles, Eye, CheckCircle2, Clock, AlertTriangle, FileCheck2, ArrowRight } from 'lucide-react';
import { Film } from '../../types';
import { formatDuration, formatDate } from '../../lib/utils';

interface QueueTableProps {
  films: Film[];
  onSelectFilm: (film: Film) => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({ films, onSelectFilm }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'submitted' | 'approved' | 'published' | 'changes_requested' | 'rejected' | 'all'>('submitted');

  // Filtered list
  const filtered = films.filter((f) => {
    if (statusFilter !== 'all' && f.status !== statusFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchFilmmaker = f.profiles?.display_name?.toLowerCase().includes(q);
      const matchLanguage = f.language.toLowerCase().includes(q);
      const matchGenre = f.film_genres?.some((fg) => fg.genres?.name.toLowerCase().includes(q));
      if (!matchTitle && !matchFilmmaker && !matchLanguage && !matchGenre) {
        return false;
      }
    }

    return true;
  });

  const submittedCount = films.filter((f) => f.status === 'submitted').length;
  const approvedCount = films.filter((f) => f.status === 'approved').length;
  const publishedCount = films.filter((f) => f.status === 'published').length;
  const changesCount = films.filter((f) => f.status === 'changes_requested').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
            <Clock className="h-3 w-3" />
            Needs Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/25">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
            <AlertTriangle className="h-3 w-3" />
            Revisions
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Curation KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Needs Review */}
        <div
          onClick={() => setStatusFilter('submitted')}
          className={`cursor-pointer rounded-2xl border p-4 backdrop-blur-md transition-all ${
            statusFilter === 'submitted'
              ? 'border-sky-500/50 bg-sky-950/30 shadow-lg shadow-sky-950/40 scale-[1.01]'
              : 'border-white/[0.08] bg-[#0f131c]/80 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
              Needs Curation
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white font-display">{submittedCount}</p>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Pending curator inspection</span>
        </div>

        {/* Ready to Publish */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`cursor-pointer rounded-2xl border p-4 backdrop-blur-md transition-all ${
            statusFilter === 'approved'
              ? 'border-purple-500/50 bg-purple-950/30 shadow-lg shadow-purple-950/40 scale-[1.01]'
              : 'border-white/[0.08] bg-[#0f131c]/80 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              Ready to Publish
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white font-display">{approvedCount}</p>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Approved & licence cleared</span>
        </div>

        {/* Live on Platform */}
        <div
          onClick={() => setStatusFilter('published')}
          className={`cursor-pointer rounded-2xl border p-4 backdrop-blur-md transition-all ${
            statusFilter === 'published'
              ? 'border-emerald-500/50 bg-emerald-950/30 shadow-lg shadow-emerald-950/40 scale-[1.01]'
              : 'border-white/[0.08] bg-[#0f131c]/80 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Live Catalogue
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <FilmIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white font-display">{publishedCount}</p>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Currently streaming live</span>
        </div>

        {/* Changes Requested */}
        <div
          onClick={() => setStatusFilter('changes_requested')}
          className={`cursor-pointer rounded-2xl border p-4 backdrop-blur-md transition-all ${
            statusFilter === 'changes_requested'
              ? 'border-rose-500/50 bg-rose-950/30 shadow-lg shadow-rose-950/40 scale-[1.01]'
              : 'border-white/[0.08] bg-[#0f131c]/80 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Revisions
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white font-display">{changesCount}</p>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Sent back with curator notes</span>
        </div>
      </div>

      {/* Toolbar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'submitted'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/35 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Needs Review</span>
            {submittedCount > 0 && (
              <span className="rounded-full bg-sky-500 text-black px-1.5 text-[10px] font-black">
                {submittedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/35 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'published'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Live ({publishedCount})
          </button>

          <button
            onClick={() => setStatusFilter('changes_requested')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'changes_requested'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            In Revision ({changesCount})
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Films ({films.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title, filmmaker, genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f131c] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Table Data Grid */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f131c]/90 backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-[11px] uppercase font-bold text-zinc-400 tracking-wider border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-3.5">Film Title & Artwork</th>
                <th className="px-4 py-3.5">Filmmaker</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Runtime / Lang</th>
                <th className="px-4 py-3.5">Licence Rights</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-5 py-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-zinc-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <FilmIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold text-zinc-400">No films match this curation filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((film) => {
                  const licence = film.licence_agreements;
                  const isVerified = !!licence?.verified_at;

                  return (
                    <tr
                      key={film.id}
                      onClick={() => onSelectFilm(film)}
                      className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-16 rounded-lg bg-black/80 overflow-hidden shrink-0 border border-white/10 shadow-sm">
                            {film.poster_url ? (
                              <img src={film.poster_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-zinc-600">
                                <FilmIcon className="h-4 w-4" />
                              </div>
                            )}
                            {film.is_debut && (
                              <span className="absolute top-0.5 left-0.5 px-1 rounded text-[8px] font-black uppercase bg-amber-500 text-black">
                                Debut
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white font-display text-sm group-hover:text-amber-400 transition-colors">
                                {film.title}
                              </p>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold border border-white/10 bg-white/5 text-zinc-300">
                                {film.age_rating}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                              {film.film_genres && film.film_genres.length > 0 && (
                                <span>{film.film_genres.map((fg) => fg.genres?.name).join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-zinc-200">
                          {film.profiles?.display_name || 'Independent Filmmaker'}
                        </p>
                        {film.profiles?.city && (
                          <p className="text-[11px] text-zinc-500">{film.profiles.city}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">{getStatusBadge(film.status)}</td>

                      <td className="px-4 py-3.5">
                        <p className="text-zinc-200 font-medium">{formatDuration(film.runtime_minutes || 0)}</p>
                        <p className="text-[11px] text-zinc-500 capitalize">{film.language}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        {licence ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                isVerified ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              <FileCheck2 className="h-3.5 w-3.5" />
                              <span>{isVerified ? 'Verified Rights' : 'Signed (Unverified)'}</span>
                            </span>
                            <p className="text-[10px] text-zinc-500">
                              {licence.music_cleared ? 'Music Cleared' : 'Music Pending'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-rose-400 font-medium">Missing Agreement</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-400 text-[11px]">
                        {formatDate(film.created_at)}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFilm(film);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
