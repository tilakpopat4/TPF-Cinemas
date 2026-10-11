import React, { useState } from 'react';
import { Plus, Trash2, Film, Clock, Play, AlertCircle, CheckCircle2, X } from 'lucide-react';
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

    // Auto-extract YouTube video ID if full URL pasted
    if (patch.video_ref) {
      const cleanId = extractYouTubeId(patch.video_ref);
      if (cleanId) {
        ep.video_ref = cleanId;
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
      <div className="flex items-center justify-between border-b border-hairline pb-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {seasons.map((s, idx) => (
            <div key={idx} className="flex items-center">
              <button
                type="button"
                onClick={() => setActiveSeasonIndex(idx)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeSeasonIndex === idx
                    ? 'bg-signature text-black font-bold shadow-sm'
                    : 'bg-graphite text-ivory/70 hover:text-ivory border border-hairline hover:bg-white/5'
                }`}
              >
                <span>{s.title || `Season ${s.season_number}`}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-sm text-[10px] font-mono ${
                    activeSeasonIndex === idx ? 'bg-black/25 text-black' : 'bg-white/10 text-ivory/60'
                  }`}
                >
                  {s.episodes.length} eps
                </span>
              </button>
              {seasons.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSeason(idx)}
                  className="p-1.5 ml-1 text-muted hover:text-rose-400 rounded-sm hover:bg-white/5 transition-colors"
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
          className="px-3 py-1.5 rounded-sm border border-hairline hover:border-signature/40 bg-graphite hover:bg-white/5 text-xs text-ivory/90 hover:text-ivory font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-signature" />
          <span>Add Season</span>
        </button>
      </div>

      {/* Current Season Header */}
      {currentSeason && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-graphite/50 p-4 rounded-sm border border-hairline">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Season Title</label>
            <input
              type="text"
              value={currentSeason.title}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, title: e.target.value };
                onChange(updated);
              }}
              placeholder={`Season ${currentSeason.season_number}`}
              className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Release Year</label>
            <input
              type="number"
              value={currentSeason.release_year || ''}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, release_year: parseInt(e.target.value, 10) || 2026 };
                onChange(updated);
              }}
              className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs font-mono focus:border-signature outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Season Synopsis (Optional)</label>
            <input
              type="text"
              value={currentSeason.synopsis || ''}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, synopsis: e.target.value };
                onChange(updated);
              }}
              placeholder="Arc summary for this season..."
              className="w-full px-3 py-2 rounded-sm bg-canvas border border-hairline text-ivory text-xs focus:border-signature outline-none"
            />
          </div>
        </div>
      )}

      {/* Episodes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-signature" />
            <span className="text-xs font-display uppercase tracking-wider text-ivory">
              Episodes Archive ({currentSeason?.episodes.length || 0})
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddEpisode}
            className="px-3 py-1.5 rounded-sm bg-signature hover:bg-signature-hover text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Add Episode</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
          {currentSeason?.episodes.map((ep, idx) => {
            const cleanVideoId = ep.video_ref ? (extractYouTubeId(ep.video_ref) || (ep.video_ref.trim().length === 11 ? ep.video_ref.trim() : '')) : '';
            const hasValidVideo = cleanVideoId.length > 0;

            return (
              <div
                key={idx}
                className="p-4 rounded-sm bg-graphite/40 border border-hairline hover:border-hairline-accent transition-all space-y-3 relative group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <span className="flex items-center justify-center px-2 py-0.5 rounded-sm bg-signature/15 border border-hairline-signature text-signature font-mono text-xs font-bold">
                      E{ep.episode_number}
                    </span>
                    <input
                      type="text"
                      value={ep.title}
                      onChange={(e) => handleUpdateEpisode(idx, { title: e.target.value })}
                      placeholder="Episode Title"
                      className="px-3 py-1.5 rounded-sm bg-canvas border border-hairline text-ivory text-xs font-medium focus:border-signature outline-none flex-1 max-w-md"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-canvas px-2.5 py-1 rounded-sm border border-hairline">
                      <Clock className="w-3 h-3 text-muted" />
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={ep.runtime_minutes || ''}
                        onChange={(e) => handleUpdateEpisode(idx, { runtime_minutes: parseInt(e.target.value, 10) || 1 })}
                        className="w-10 bg-transparent text-ivory text-xs font-mono text-right outline-none"
                      />
                      <span className="text-[10px] text-muted font-mono">min</span>
                    </div>

                    {currentSeason.episodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEpisode(idx)}
                        className="p-1.5 text-muted hover:text-rose-400 rounded-sm hover:bg-white/5 transition-colors"
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
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-signature fill-current" />
                        <span>YouTube Stream URL or Video ID</span>
                      </span>
                      {hasValidVideo ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-signature/80 flex items-center gap-1 text-[10px] font-mono">
                          <AlertCircle className="w-3 h-3" /> Required for review
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={ep.video_ref}
                      onChange={(e) => handleUpdateEpisode(idx, { video_ref: e.target.value })}
                      placeholder="e.g. https://www.youtube.com/watch?v=... or ID"
                      className="w-full px-3 py-1.5 rounded-sm bg-canvas border border-hairline text-ivory text-xs font-mono focus:border-signature outline-none"
                    />
                  </div>

                  {/* Thumbnail / Test Player Preview */}
                  <div className="h-16 rounded-sm bg-black/60 border border-hairline overflow-hidden relative flex items-center justify-center">
                    {hasValidVideo ? (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewVideoId(cleanVideoId)}
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-ivory transition-colors group/play"
                          title="Screen Episode Preview"
                        >
                          <Play className="w-5 h-5 fill-current text-signature group-hover/play:scale-110 transition-transform" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-muted/60 text-center px-2">
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
                    className="w-full px-3 py-1.5 rounded-sm bg-canvas/70 border border-hairline text-ivory/90 text-xs font-editorial italic focus:border-signature outline-none resize-none"
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
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          onClick={() => setPreviewVideoId(null)}
        >
          <div
            className="w-full max-w-3xl aspect-video bg-black rounded-sm overflow-hidden border border-hairline shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewVideoId(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-sm bg-black/70 text-ivory hover:text-white border border-hairline"
            >
              <X className="w-4 h-4" />
            </button>
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
