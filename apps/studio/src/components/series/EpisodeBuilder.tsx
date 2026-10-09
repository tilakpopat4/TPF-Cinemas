import React, { useState } from 'react';
import { Plus, Trash2, Film, Clock, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractYouTubeId } from '../../lib/utils';

export interface DraftEpisode {
  id?: string;
  episode_number: number;
  title: string;
  synopsis: string;
  runtime_minutes: number;
  video_ref: string;
  thumbnail_url?: string;
}

export interface DraftSeason {
  id?: string;
  season_number: number;
  title: string;
  synopsis: string;
  release_year: number;
  episodes: DraftEpisode[];
}

interface EpisodeBuilderProps {
  seasons: DraftSeason[];
  onChange: (seasons: DraftSeason[]) => void;
}

export const EpisodeBuilder: React.FC<EpisodeBuilderProps> = ({ seasons, onChange }) => {
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  const currentSeason = seasons[activeSeasonIndex] || seasons[0];

  function handleAddSeason() {
    const nextSeasonNum = seasons.length + 1;
    const newSeason: DraftSeason = {
      season_number: nextSeasonNum,
      title: `Season ${nextSeasonNum}`,
      synopsis: '',
      release_year: new Date().getFullYear(),
      episodes: [
        {
          episode_number: 1,
          title: `Episode 1`,
          synopsis: '',
          runtime_minutes: 25,
          video_ref: '',
        },
      ],
    };
    const updated = [...seasons, newSeason];
    onChange(updated);
    setActiveSeasonIndex(updated.length - 1);
  }

  function handleRemoveSeason(indexToRemove: number) {
    if (seasons.length <= 1) return;
    const updated = seasons
      .filter((_, idx) => idx !== indexToRemove)
      .map((s, idx) => ({ ...s, season_number: idx + 1 }));
    onChange(updated);
    setActiveSeasonIndex(Math.max(0, indexToRemove - 1));
  }

  function handleAddEpisode() {
    if (!currentSeason) return;
    const nextEpNum = currentSeason.episodes.length + 1;
    const newEp: DraftEpisode = {
      episode_number: nextEpNum,
      title: `Episode ${nextEpNum}`,
      synopsis: '',
      runtime_minutes: 25,
      video_ref: '',
    };
    const updatedSeasons = [...seasons];
    updatedSeasons[activeSeasonIndex] = {
      ...currentSeason,
      episodes: [...currentSeason.episodes, newEp],
    };
    onChange(updatedSeasons);
  }

  function handleRemoveEpisode(epIdxToRemove: number) {
    if (!currentSeason || currentSeason.episodes.length <= 1) return;
    const updatedEps = currentSeason.episodes
      .filter((_, idx) => idx !== epIdxToRemove)
      .map((ep, idx) => ({ ...ep, episode_number: idx + 1 }));
    const updatedSeasons = [...seasons];
    updatedSeasons[activeSeasonIndex] = {
      ...currentSeason,
      episodes: updatedEps,
    };
    onChange(updatedSeasons);
  }

  function handleUpdateEpisode(epIdx: number, patch: Partial<DraftEpisode>) {
    if (!currentSeason) return;
    const updatedEps = [...currentSeason.episodes];
    const ep = { ...updatedEps[epIdx], ...patch };

    // If video_ref changed, extract ID and auto-generate thumbnail
    if (patch.video_ref !== undefined) {
      const extracted = extractYouTubeId(patch.video_ref) || patch.video_ref.trim();
      ep.video_ref = extracted;
      if (extracted && extracted.length >= 6) {
        ep.thumbnail_url = `https://img.youtube.com/vi/${extracted}/hqdefault.jpg`;
      }
    }

    updatedEps[epIdx] = ep;
    const updatedSeasons = [...seasons];
    updatedSeasons[activeSeasonIndex] = {
      ...currentSeason,
      episodes: updatedEps,
    };
    onChange(updatedSeasons);
  }

  return (
    <div className="space-y-6">
      {/* Season Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {seasons.map((s, idx) => (
            <div key={idx} className="flex items-center">
              <button
                type="button"
                onClick={() => setActiveSeasonIndex(idx)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeSeasonIndex === idx
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                <span>{s.title || `Season ${s.season_number}`}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  activeSeasonIndex === idx ? 'bg-black/30 text-black' : 'bg-white/10 text-white/60'
                }`}>
                  {s.episodes.length} eps
                </span>
              </button>
              {seasons.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSeason(idx)}
                  className="p-1.5 ml-1 text-white/30 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                  title="Delete Season"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddSeason}
          className="px-3 py-1.5 rounded-lg border border-white/15 hover:border-amber-500/50 bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white font-medium flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-amber-500" />
          <span>Add Season</span>
        </button>
      </div>

      {/* Current Season Header */}
      {currentSeason && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Season Title</label>
            <input
              type="text"
              value={currentSeason.title}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, title: e.target.value };
                onChange(updated);
              }}
              placeholder={`Season ${currentSeason.season_number}`}
              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Release Year</label>
            <input
              type="number"
              value={currentSeason.release_year || ''}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, release_year: parseInt(e.target.value, 10) || 2026 };
                onChange(updated);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50">Season Synopsis (Optional)</label>
            <input
              type="text"
              value={currentSeason.synopsis || ''}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, synopsis: e.target.value };
                onChange(updated);
              }}
              placeholder="Arc summary for this season..."
              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Episodes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
              Episodes ({currentSeason?.episodes.length || 0})
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddEpisode}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Episode</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {currentSeason?.episodes.map((ep, idx) => {
            const hasValidVideo = ep.video_ref && ep.video_ref.trim().length >= 6;

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono text-xs font-bold">
                      {ep.episode_number}
                    </span>
                    <input
                      type="text"
                      value={ep.title}
                      onChange={(e) => handleUpdateEpisode(idx, { title: e.target.value })}
                      placeholder="Episode Title"
                      className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold focus:border-amber-500 outline-none w-64 sm:w-80"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                      <Clock className="w-3 h-3 text-white/50" />
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={ep.runtime_minutes || ''}
                        onChange={(e) => handleUpdateEpisode(idx, { runtime_minutes: parseInt(e.target.value, 10) || 1 })}
                        className="w-10 bg-transparent text-white text-xs font-mono text-right outline-none"
                      />
                      <span className="text-[10px] text-white/40 font-mono">min</span>
                    </div>

                    {currentSeason.episodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEpisode(idx)}
                        className="p-1.5 text-white/30 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                        title="Delete Episode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Link & Thumbnail Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-red-500 fill-current" />
                        <span>YouTube Video URL or Video ID</span>
                      </span>
                      {hasValidVideo ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-amber-400/80 flex items-center gap-1 text-[10px]">
                          <AlertCircle className="w-3 h-3" /> Required
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={ep.video_ref}
                      onChange={(e) => handleUpdateEpisode(idx, { video_ref: e.target.value })}
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or dQw4w9WgXcQ"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-mono focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Thumbnail / Test Player Preview */}
                  <div className="h-16 rounded-lg bg-black/50 border border-white/10 overflow-hidden relative flex items-center justify-center">
                    {hasValidVideo ? (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${ep.video_ref}/hqdefault.jpg`}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewVideoId(ep.video_ref)}
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors group/play"
                          title="Screen Episode Preview"
                        >
                          <Play className="w-5 h-5 fill-current text-amber-500 group-hover/play:scale-110 transition-transform" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-white/30 text-center px-2">
                        Enter video link to preview
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Episode Synopsis */}
                <div>
                  <textarea
                    rows={1}
                    value={ep.synopsis}
                    onChange={(e) => handleUpdateEpisode(idx, { synopsis: e.target.value })}
                    placeholder="Short episode synopsis (optional)..."
                    className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/5 text-white/80 text-xs focus:border-amber-500 outline-none resize-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Screening Modal */}
      {previewVideoId && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setPreviewVideoId(null)}
        >
          <div
            className="w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
              title="Episode Preview Screening"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};
