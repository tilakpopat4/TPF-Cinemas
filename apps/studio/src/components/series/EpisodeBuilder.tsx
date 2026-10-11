import React, { useState } from 'react';
import { Plus, Trash2, Play, Check, X } from 'lucide-react';
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
          title: 'Episode 1',
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

    // Auto-extract YouTube video ID if URL is pasted
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
      {/* Season Selection Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {seasons.map((s, idx) => {
            const isActive = activeSeasonIndex === idx;
            return (
              <div key={idx} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveSeasonIndex(idx)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-signature text-black font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {s.title || `Season ${s.season_number}`}
                  <span className="ml-1.5 text-[11px] opacity-70">
                    ({s.episodes.length})
                  </span>
                </button>
                {seasons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSeason(idx)}
                    className="p-1 text-white/30 hover:text-rose-400 transition-colors ml-0.5"
                    title="Remove Season"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddSeason}
          className="text-xs font-medium text-signature hover:text-signature-hover flex items-center gap-1 transition-colors px-2 py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Season</span>
        </button>
      </div>

      {/* Season Metadata (Clean Linear Flow) */}
      {currentSeason && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-white/50 mb-1">
              Season Title
            </label>
            <input
              type="text"
              value={currentSeason.title}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, title: e.target.value };
                onChange(updated);
              }}
              placeholder={`Season ${currentSeason.season_number}`}
              className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature focus:bg-white/[0.06] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/50 mb-1">
              Release Year
            </label>
            <input
              type="number"
              value={currentSeason.release_year || ''}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = {
                  ...currentSeason,
                  release_year: parseInt(e.target.value, 10) || 2026,
                };
                onChange(updated);
              }}
              className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs font-mono focus:border-signature focus:bg-white/[0.06] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-white/50 mb-1">
              Season Synopsis (Optional)
            </label>
            <input
              type="text"
              value={currentSeason.synopsis || ''}
              onChange={(e) => {
                const updated = [...seasons];
                updated[activeSeasonIndex] = { ...currentSeason, synopsis: e.target.value };
                onChange(updated);
              }}
              placeholder="Arc overview..."
              className="w-full px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature focus:bg-white/[0.06] outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Episodes Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/70">
            Episodes ({currentSeason?.episodes.length || 0})
          </span>

          <button
            type="button"
            onClick={handleAddEpisode}
            className="text-xs font-medium text-signature hover:text-signature-hover flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Episode</span>
          </button>
        </div>

        {/* Streamlined Scannable Episode Rows */}
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {currentSeason?.episodes.map((ep, idx) => {
            const cleanVideoId = ep.video_ref
              ? extractYouTubeId(ep.video_ref) || (ep.video_ref.trim().length === 11 ? ep.video_ref.trim() : '')
              : '';
            const hasValidVideo = cleanVideoId.length > 0;

            return (
              <div
                key={idx}
                className="p-3 rounded-md bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors space-y-2"
              >
                {/* Main Row: [E#] [Title] [Runtime] [Video Link] [Actions] */}
                <div className="flex items-center gap-2">
                  <span className="w-7 text-center font-mono text-[11px] font-semibold text-white/40 shrink-0">
                    E{ep.episode_number}
                  </span>

                  <input
                    type="text"
                    value={ep.title}
                    onChange={(e) => handleUpdateEpisode(idx, { title: e.target.value })}
                    placeholder="Episode Title *"
                    className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/10 text-white text-xs focus:border-signature outline-none"
                  />

                  <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-md px-2 py-1.5 shrink-0">
                    <input
                      type="number"
                      min="1"
                      max="240"
                      value={ep.runtime_minutes || ''}
                      onChange={(e) =>
                        handleUpdateEpisode(idx, { runtime_minutes: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-8 bg-transparent text-white text-xs font-mono text-right outline-none"
                    />
                    <span className="text-[10px] text-white/40 ml-1">m</span>
                  </div>

                  <div className="relative flex-1 min-w-[160px]">
                    <input
                      type="text"
                      value={ep.video_ref}
                      onChange={(e) => handleUpdateEpisode(idx, { video_ref: e.target.value })}
                      placeholder="YouTube link or ID *"
                      className={`w-full px-2.5 py-1.5 pr-7 rounded-md bg-white/[0.04] border text-white text-xs font-mono outline-none ${
                        hasValidVideo ? 'border-emerald-500/40 focus:border-emerald-400' : 'border-white/10 focus:border-signature'
                      }`}
                    />
                    {hasValidVideo && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <button
                          type="button"
                          onClick={() => setPreviewVideoId(cleanVideoId)}
                          className="text-white/40 hover:text-white transition-colors"
                          title="Preview Video"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    )}
                  </div>

                  {currentSeason.episodes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEpisode(idx)}
                      className="p-1.5 text-white/30 hover:text-rose-400 rounded transition-colors shrink-0"
                      title="Remove Episode"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Secondary Row: Synopsis input without heavy borders */}
                <input
                  type="text"
                  value={ep.synopsis}
                  onChange={(e) => handleUpdateEpisode(idx, { synopsis: e.target.value })}
                  placeholder="Episode synopsis (optional)..."
                  className="w-full pl-9 pr-3 py-1 rounded bg-transparent border-0 text-white/70 text-xs italic placeholder:text-white/20 focus:bg-white/[0.02] focus:ring-0 outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Clean Video Screening Modal */}
      {previewVideoId && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewVideoId(null)}
        >
          <div
            className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewVideoId(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/70 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${previewVideoId}?autoplay=1`}
              title="Episode Preview"
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
