import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Film, AlertCircle, CheckCircle, Video, Loader2, Image as ImageIcon } from 'lucide-react';
import { Film as FilmType } from '../../types';
import { extractYouTubeId } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useReducedMotion, springSnappy, springNatural } from '../../lib/motion';

interface StepMediaProps {
  formData: Partial<FilmType>;
  onChange: (updates: Partial<FilmType>) => void;
  userId?: string;
}

export const StepMedia: React.FC<StepMediaProps> = ({ formData, onChange, userId }) => {
  const reduced = useReducedMotion();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0); // 0–100 simulated
  const [videoInput, setVideoInput] = useState(formData.video_ref || '');

  // Handle poster upload
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadError(null);
    setUploadProgress(0);

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Poster image must be smaller than 5 MB.');
      return;
    }

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a JPG, PNG, or WebP image.');
      return;
    }

    try {
      setUploading(true);
      // Animate progress to 40% quickly while preparing
      setUploadProgress(40);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${Date.now()}_${sanitizedName}`;

      // Animate to 70% while uploading
      setUploadProgress(70);

      const { error: uploadErr } = await supabase.storage
        .from('posters')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) {
        throw uploadErr;
      }

      // Near complete
      setUploadProgress(95);

      const { data: publicUrlData } = supabase.storage.from('posters').getPublicUrl(filePath);

      setUploadProgress(100);
      onChange({ poster_url: publicUrlData.publicUrl });
    } catch (err) {
      console.error('Poster upload failed:', err);
      setUploadError((err as Error).message || 'Failed to upload poster image.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
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

  return (
    <div className="space-y-6">
      {/* Poster Upload Section */}
      <div>
        <label className="form-label flex items-center justify-between">
          <span>Film Poster (WebP / JPG / PNG, Max 5MB) *</span>
          <AnimatePresence>
            {formData.poster_url && (
              <motion.span
                className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, transition: springSnappy }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <CheckCircle className="h-3 w-3" /> Uploaded
              </motion.span>
            )}
          </AnimatePresence>
        </label>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Poster preview or upload box */}
          <div className="sm:col-span-1">
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-white/10 bg-slate-900 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {formData.poster_url ? (
                  <motion.div
                    key="poster-preview"
                    className="absolute inset-0"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  >
                    <img
                      src={formData.poster_url}
                      alt="Poster Preview"
                      className="h-full w-full object-cover object-center"
                    />
                    <label
                      htmlFor="poster-upload"
                      className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold"
                    >
                      <Upload className="h-5 w-5 mb-1" />
                      Replace Poster
                    </label>
                  </motion.div>
                ) : (
                  <motion.label
                    key="poster-upload-label"
                    htmlFor="poster-upload"
                    className="h-full w-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-white/5 transition-colors text-slate-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 text-rose-500 animate-spin mb-2" />
                        <span className="text-xs font-medium">Uploading poster...</span>
                        {/* Animated progress bar — transform scaleX only */}
                        <div className="mt-3 w-full max-w-[80px] h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-rose-500 origin-left rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: uploadProgress / 100,
                              transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1">{uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-slate-500 mb-2" />
                        <span className="text-xs font-semibold text-slate-200">Click to upload poster</span>
                        <span className="text-[10px] text-slate-500 mt-1">1080 × 1600 px recommended</span>
                      </>
                    )}
                  </motion.label>
                )}
              </AnimatePresence>
              <input
                type="file"
                id="poster-upload"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>

          {/* Guidelines */}
          <div className="sm:col-span-2 flex flex-col justify-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-200">Poster Guidelines:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>High-resolution 2:3 vertical portrait ratio (e.g. 1200 x 1800).</li>
              <li>Clean typography without watermarks or festival laurels overlapping the title.</li>
              <li>Stored on encrypted cloud storage and served through global CDN.</li>
            </ul>
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
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
            <Video className="h-4 w-4 text-rose-500" />
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
          <p className="text-[11px] text-slate-500 mt-1.5">
            You can use an <strong>Unlisted</strong> YouTube link so the video is viewable only through TPF Cinemas.
          </p>
        </div>

        {/* Video Preview — iframe never wrapped in motion */}
        <AnimatePresence>
          {currentVideoId && (
            <motion.div
              className="mt-4 rounded-xl overflow-hidden border border-white/10 aspect-video bg-black max-w-lg"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {/* iframe is a plain child — not a motion element */}
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
