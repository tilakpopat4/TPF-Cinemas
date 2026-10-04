import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Film, AlertCircle, CheckCircle, Video, Loader2, Image as ImageIcon, Monitor, Smartphone } from 'lucide-react';
import { Film as FilmType } from '../../types';
import { extractYouTubeId, getFilmArtworks } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useReducedMotion, springSnappy } from '../../lib/motion';

interface StepMediaProps {
  formData: Partial<FilmType>;
  onChange: (updates: Partial<FilmType>) => void;
  userId?: string;
}

export const StepMedia: React.FC<StepMediaProps> = ({ formData, onChange, userId }) => {
  const reduced = useReducedMotion();

  // Extract both artworks safely
  const currentArtworks = getFilmArtworks(formData);
  const portraitUrl = formData.poster_url && !formData.poster_url.trim().startsWith('{')
    ? formData.poster_url
    : currentArtworks.portrait !== 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop'
      ? currentArtworks.portrait
      : formData.poster_url || null;

  const backdropUrl = formData.backdrop_url || (
    currentArtworks.landscape !== 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop' &&
    currentArtworks.landscape !== portraitUrl
      ? currentArtworks.landscape
      : null
  );

  // Portrait upload state
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [portraitProgress, setPortraitProgress] = useState(0);

  // Landscape upload state
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [backdropError, setBackdropError] = useState<string | null>(null);
  const [backdropProgress, setBackdropProgress] = useState(0);

  // Video input state
  const [videoInput, setVideoInput] = useState(formData.video_ref || '');

  // Handle Portrait (2:3) upload
  async function handlePortraitSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setPortraitError(null);
    setPortraitProgress(0);

    if (file.size > 5 * 1024 * 1024) {
      setPortraitError('Portrait poster must be smaller than 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPortraitError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setUploadingPortrait(true);
      setPortraitProgress(35);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/portrait_${Date.now()}_${sanitizedName}`;

      setPortraitProgress(65);

      const { error: uploadErr } = await supabase.storage
        .from('posters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      setPortraitProgress(90);
      const { data: publicUrlData } = supabase.storage.from('posters').getPublicUrl(filePath);

      setPortraitProgress(100);
      onChange({ poster_url: publicUrlData.publicUrl });
    } catch (err) {
      console.error('Portrait upload failed:', err);
      setPortraitError((err as Error).message || 'Failed to upload portrait poster.');
      setPortraitProgress(0);
    } finally {
      setUploadingPortrait(false);
    }
  }

  // Handle Landscape (16:9) upload
  async function handleBackdropSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setBackdropError(null);
    setBackdropProgress(0);

    if (file.size > 5 * 1024 * 1024) {
      setBackdropError('Landscape backdrop must be smaller than 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setBackdropError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setUploadingBackdrop(true);
      setBackdropProgress(35);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/landscape_${Date.now()}_${sanitizedName}`;

      setBackdropProgress(65);

      const { error: uploadErr } = await supabase.storage
        .from('posters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      setBackdropProgress(90);
      const { data: publicUrlData } = supabase.storage.from('posters').getPublicUrl(filePath);

      setBackdropProgress(100);
      onChange({ backdrop_url: publicUrlData.publicUrl });
    } catch (err) {
      console.error('Landscape upload failed:', err);
      setBackdropError((err as Error).message || 'Failed to upload landscape backdrop.');
      setBackdropProgress(0);
    } finally {
      setUploadingBackdrop(false);
    }
  }

  // Handle YouTube input
  function handleVideoChange(val: string) {
    setVideoInput(val);
    const parsedId = extractYouTubeId(val);
    onChange({
      video_ref: parsedId || val,
      video_provider: 'youtube',
    });
  }

  const currentVideoId = extractYouTubeId(formData.video_ref || '');
  const hasPortrait = !!portraitUrl;
  const hasBackdrop = !!backdropUrl;

  return (
    <div className="space-y-8">
      {/* Compulsory Artworks Header Notice */}
      <div className="rounded-2xl bg-white/[0.04] p-5 text-xs text-zinc-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-signature shrink-0">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-white text-sm">
                Dual Theatrical Artworks
              </h4>
              <p className="text-[11px] text-muted">
                1 Portrait Poster (2:3) & 1 Landscape Banner (16:9) are required for every release.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-medium transition-colors flex items-center gap-1.5 ${
                hasPortrait && hasBackdrop
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-white/[0.08] text-muted'
              }`}
            >
              {hasPortrait && hasBackdrop ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" /> Both Artworks Uploaded
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" /> Required (
                  {[hasPortrait, hasBackdrop].filter(Boolean).length}/2 Complete)
                </>
              )}
            </span>
          </div>
        </div>

        <p className="pt-3 text-[11.5px] text-muted leading-relaxed">
          TPF Cinemas serves viewers across widescreen smart TVs, laptop cinema monitors, and mobile phones.
          Portrait artwork powers our theatrical rails and search cards, while landscape artwork elevates the 
          Cinematic Hero Billboard, Watchroom backdrop, and widescreen editorial spotlights.
        </p>
      </div>

      {/* Dual Upload Section: 2 Columns Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ============================================================ */}
        {/* POSTER 1: PORTRAIT POSTER (2:3)                              */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0f17]/90 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-muted" />
                <span>1. Portrait Poster (2:3)</span>
                <span className="text-rose-400">*</span>
              </label>

              <AnimatePresence>
                {hasPortrait ? (
                  <motion.span
                    className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, transition: springSnappy }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <CheckCircle className="h-3 w-3" /> Uploaded
                  </motion.span>
                ) : (
                  <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Compulsory
                  </span>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Standard theatrical key art. Used for catalog rails, cards, search results, and watchlist.
            </p>

            {/* Portrait Preview / Upload Box */}
            <div className="relative aspect-[2/3] w-full max-w-[240px] mx-auto rounded-xl overflow-hidden border border-white/10 bg-[#090b10] shadow-xl flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {portraitUrl ? (
                  <motion.div
                    key="portrait-preview"
                    className="absolute inset-0"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.3 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <img
                      src={portraitUrl}
                      alt="Portrait Poster Preview"
                      className="h-full w-full object-cover object-center"
                    />
                    <label
                      htmlFor="poster-upload-portrait"
                      className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold p-3 text-center"
                    >
                      <Upload className="h-5 w-5 mb-1.5 text-signature" />
                      Replace Portrait Poster
                    </label>
                  </motion.div>
                ) : (
                  <motion.label
                    key="portrait-upload-label"
                    htmlFor="poster-upload-portrait"
                    className="h-full w-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-white/5 transition-colors text-zinc-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    {uploadingPortrait ? (
                      <>
                        <Loader2 className="h-8 w-8 text-signature animate-spin mb-2" />
                        <span className="text-xs font-medium text-white">Uploading portrait...</span>
                        <div className="mt-3 w-full max-w-[100px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-signature origin-left rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: portraitProgress / 100,
                              transition: { duration: 0.4 },
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1">{portraitProgress}%</span>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mb-2">
                          <ImageIcon className="h-5 w-5 text-signature" />
                        </div>
                        <span className="text-xs font-semibold text-white">Upload Portrait Poster</span>
                        <span className="text-[10px] text-zinc-400 mt-1">1080 × 1600 px (2:3 aspect)</span>
                        <span className="text-[9px] text-zinc-500 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                      </>
                    )}
                  </motion.label>
                )}
              </AnimatePresence>
              <input
                type="file"
                id="poster-upload-portrait"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePortraitSelect}
                disabled={uploadingPortrait}
                className="hidden"
              />
            </div>
          </div>

          {/* Portrait Specs / Errors */}
          <div>
            <AnimatePresence>
              {portraitError && (
                <motion.div
                  className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center gap-2 text-xs"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{portraitError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ============================================================ */}
        {/* POSTER 2: LANDSCAPE BANNER / BACKDROP (16:9)                 */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0f17]/90 p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-muted" />
                <span>2. Landscape Banner (16:9)</span>
                <span className="text-rose-400">*</span>
              </label>

              <AnimatePresence>
                {hasBackdrop ? (
                  <motion.span
                    className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, transition: springSnappy }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    <CheckCircle className="h-3 w-3" /> Uploaded
                  </motion.span>
                ) : (
                  <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Compulsory
                  </span>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3">
              Widescreen cinematic backdrop. Used for Hero Billboard, cinema player backdrop, and previews.
            </p>

            {/* Landscape Preview / Upload Box */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/10 bg-[#090b10] shadow-xl flex flex-col items-center justify-center my-auto">
              <AnimatePresence mode="wait">
                {backdropUrl ? (
                  <motion.div
                    key="backdrop-preview"
                    className="absolute inset-0"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.3 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <img
                      src={backdropUrl}
                      alt="Landscape Backdrop Preview"
                      className="h-full w-full object-cover object-center"
                    />
                    <label
                      htmlFor="poster-upload-backdrop"
                      className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold p-3 text-center"
                    >
                      <Upload className="h-5 w-5 mb-1.5 text-signature" />
                      Replace Landscape Banner
                    </label>
                  </motion.div>
                ) : (
                  <motion.label
                    key="backdrop-upload-label"
                    htmlFor="poster-upload-backdrop"
                    className="h-full w-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-white/5 transition-colors text-zinc-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    {uploadingBackdrop ? (
                      <>
                        <Loader2 className="h-8 w-8 text-signature animate-spin mb-2" />
                        <span className="text-xs font-medium text-white">Uploading landscape...</span>
                        <div className="mt-3 w-full max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-signature origin-left rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: backdropProgress / 100,
                              transition: { duration: 0.4 },
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1">{backdropProgress}%</span>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mb-2">
                          <ImageIcon className="h-5 w-5 text-signature" />
                        </div>
                        <span className="text-xs font-semibold text-white">Upload Landscape Banner</span>
                        <span className="text-[10px] text-zinc-400 mt-1">1920 × 1080 px (16:9 aspect)</span>
                        <span className="text-[9px] text-zinc-500 mt-0.5">JPG, PNG, WebP up to 5MB</span>
                      </>
                    )}
                  </motion.label>
                )}
              </AnimatePresence>
              <input
                type="file"
                id="poster-upload-backdrop"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBackdropSelect}
                disabled={uploadingBackdrop}
                className="hidden"
              />
            </div>
          </div>

          {/* Landscape Specs / Errors */}
          <div>
            <AnimatePresence>
              {backdropError && (
                <motion.div
                  className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center gap-2 text-xs"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{backdropError}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Video Source Section */}
      <div className="border-t border-white/10 pt-6">
        <label className="form-label flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Video className="h-4 w-4 text-signature" />
            <span>Video Stream Source (YouTube Embed) *</span>
          </span>
          <AnimatePresence>
            {currentVideoId && (
              <motion.span
                className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, transition: springSnappy }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <CheckCircle className="h-3 w-3" /> Video Linked
              </motion.span>
            )}
          </AnimatePresence>
        </label>

        <div className="mt-2">
          <input
            type="text"
            required
            value={videoInput}
            onChange={(e) => handleVideoChange(e.target.value)}
            placeholder="Paste your YouTube video link (e.g., https://youtu.be/dQw4w9WgXcQ or video ID)"
            className="form-input"
          />
          <p className="text-[11px] text-zinc-400 mt-1.5">
            You can use an <strong>Unlisted</strong> YouTube link so the video is viewable only through TPF Cinemas.
          </p>
        </div>

        {/* Video Preview */}
        <AnimatePresence>
          {currentVideoId && (
            <motion.div
              className="mt-4 rounded-xl overflow-hidden border border-white/10 aspect-video bg-black max-w-lg shadow-xl"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?rel=0`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
