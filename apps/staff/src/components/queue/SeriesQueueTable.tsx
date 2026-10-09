import React, { useState } from 'react';
import { Search, Tv, Film, Eye, CheckCircle2, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Series } from '../../types';
import { formatDate } from '../../lib/utils';

interface SeriesQueueTableProps {
  seriesList: Series[];
  onSelectSeries: (series: Series) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const SeriesQueueTable: React.FC<SeriesQueueTableProps> = ({
  seriesList,
  onSelectSeries,
  onRefresh,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'submitted' | 'approved' | 'published' | 'changes_requested' | 'rejected' | 'all'>('submitted');

  const filtered = seriesList.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchFilmmaker = s.profiles?.display_name?.toLowerCase().includes(q);
      const matchLanguage = s.language.toLowerCase().includes(q);
      const matchGenre = s.series_genres?.some((sg) => sg.genres?.name.toLowerCase().includes(q));
      if (!matchTitle && !matchFilmmaker && !matchLanguage && !matchGenre) {
        return false;
      }
    }

    return true;
  });

  const submittedCount = seriesList.filter((s) => s.status === 'submitted').length;
  const approvedCount = seriesList.filter((s) => s.status === 'approved').length;
  const publishedCount = seriesList.filter((s) => s.status === 'published').length;
  const changesCount = seriesList.filter((s) => s.status === 'changes_requested').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Published
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-400">
            Approved
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-amber-500/10 text-amber-400">
            <Clock className="h-3 w-3" /> In Queue
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-300">
            <AlertTriangle className="h-3 w-3" /> Changes Requested
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold bg-white/5 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              statusFilter === 'submitted'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Awaiting Review</span>
            {submittedCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'submitted' ? 'bg-black/30 text-black font-bold' : 'bg-amber-500/20 text-amber-400'}`}>
                {submittedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              statusFilter === 'approved'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Approved</span>
            {approvedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300">
                {approvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              statusFilter === 'published'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Live Published</span>
            {publishedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
                {publishedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('changes_requested')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              statusFilter === 'changes_requested'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Changes Requested</span>
            {changesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                {changesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            All ({seriesList.length})
          </button>
        </div>

        {/* Search input & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shows, creators..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={onRefresh}
            title="Refresh Series Queue"
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Series Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0c0d12] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Web Series</th>
                <th className="py-3.5 px-4">Showrunner / Filmmaker</th>
                <th className="py-3.5 px-4">Format</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    No web series submissions found matching current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const posterImg = s.poster_url || s.backdrop_url;
                  const totalEpisodes = (s.seasons || []).reduce((acc, season) => acc + (season.episodes?.length || 0), 0) || s.episode_count || 0;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => onSelectSeries(s)}
                    >
                      {/* Show title & poster */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-10 rounded-lg bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {posterImg ? (
                              <img src={posterImg} alt={s.title} className="h-full w-full object-cover" />
                            ) : (
                              <Tv className="h-4 w-4 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                              {s.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {s.language} {s.age_rating && `· ${s.age_rating}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Filmmaker */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">
                          {s.profiles?.display_name || 'Independent Creator'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {s.profiles?.city || 'India'}
                        </div>
                      </td>

                      {/* Format */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/90">
                          <Tv className="w-3 h-3 text-amber-500" />
                          <span>{s.seasons?.length || s.total_seasons || 1} Seasons</span>
                          <span className="text-white/40">·</span>
                          <Film className="w-3 h-3 text-amber-500" />
                          <span>{totalEpisodes} Eps</span>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {formatDate(s.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(s.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSeries(s);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
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
