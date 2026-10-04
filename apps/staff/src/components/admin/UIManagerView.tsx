import React, { useState } from 'react';
import { 
  Sliders, 
  Layers, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Sparkles,
  Film,
  Grid,
  ListOrdered,
  Clock
} from 'lucide-react';
import { useStaffUIManager, UISectionConfig } from '../../hooks/useStaffUIManager';

export const UIManagerView: React.FC = () => {
  const {
    sections,
    tabTitles,
    heroConfig,
    addSection,
    updateSection,
    removeSection,
    toggleSectionEnabled,
    moveSectionUp,
    moveSectionDown,
    updateTabTitle,
    setHeroConfig,
    resetToDefaults,
  } = useStaffUIManager();

  const [activeSubTab, setActiveSubTab] = useState<'sections' | 'hero' | 'tabs'>('sections');
  const [showAddModal, setShowAddModal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // New section form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newType, setNewType] = useState<UISectionConfig['type']>('rail');
  const [newFilterType, setNewFilterType] = useState<UISectionConfig['filterType']>('genre');
  const [newGenre, setNewGenre] = useState('drama');
  const [newLimit, setNewLimit] = useState(10);

  const triggerToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addSection({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      type: newType,
      filterType: newFilterType,
      genreSlug: newFilterType === 'genre' ? newGenre : undefined,
      limit: Number(newLimit) || 10,
      enabled: true,
    });

    setNewTitle('');
    setNewSubtitle('');
    setShowAddModal(false);
    triggerToast();
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signature animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-signature font-bold">
              Admin Exclusive Console
            </span>
          </div>
          <h2 className="text-2xl font-editorial font-bold text-ivory tracking-wide mt-1">
            Viewer UI & Catalogue Management
          </h2>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Live-configure the viewer audience portal layout: homepage rails, hero billboard branding, and navigation taxonomy.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (window.confirm('Reset all viewer layouts and rails back to factory defaults?')) {
                resetToDefaults();
                triggerToast();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] text-muted hover:text-ivory text-xs font-mono uppercase tracking-wider transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          {activeSubTab === 'sections' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-signature hover:bg-signature-hover text-black font-semibold text-xs uppercase tracking-wider shadow-lg shadow-signature/10 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Rail</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        <button
          onClick={() => setActiveSubTab('sections')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
            activeSubTab === 'sections'
              ? 'bg-signature/15 text-signature font-bold border border-signature/30'
              : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Homepage Rails ({sections.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hero')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
            activeSubTab === 'hero'
              ? 'bg-signature/15 text-signature font-bold border border-signature/30'
              : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Hero Billboard Branding</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tabs')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
            activeSubTab === 'tabs'
              ? 'bg-signature/15 text-signature font-bold border border-signature/30'
              : 'text-muted hover:text-ivory hover:bg-white/[0.04]'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Navigation Labels</span>
        </button>
      </div>

      {/* Saved Toast Notification */}
      {savedToast && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-signature/20 border border-signature/40 text-signature text-xs font-mono uppercase tracking-wider shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="h-4 w-4" />
          <span>Viewer configuration updated successfully in real-time.</span>
        </div>
      )}

      {/* 1. SECTIONS TAB */}
      {activeSubTab === 'sections' && (
        <div className="space-y-3">
          {sections.map((section: UISectionConfig, idx: number) => (
            <div
              key={section.id}
              className={`p-4 rounded-xl border transition-all ${
                section.enabled
                  ? 'bg-graphite/40 border-hairline hover:border-white/20'
                  : 'bg-canvas/50 border-white/[0.04] opacity-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    {section.type === 'top10' && <ListOrdered className="h-4 w-4 text-signature" />}
                    {section.type === 'continue_watching' && <Clock className="h-4 w-4 text-signature" />}
                    {section.type === 'spotlight' && <Sparkles className="h-4 w-4 text-signature" />}
                    {section.type === 'rail' && <Film className="h-4 w-4 text-signature" />}
                    {section.type === 'grid' && <Grid className="h-4 w-4 text-signature" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-ivory">
                        {section.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/[0.06] text-muted border border-white/[0.06]">
                        {section.type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-signature/10 text-signature border border-signature/20">
                        filter: {section.filterType} {section.genreSlug ? `(${section.genreSlug})` : ''}
                      </span>
                    </div>

                    {section.subtitle && (
                      <p className="text-xs text-muted mt-1 font-sans">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Reorder, Toggle, Remove */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => {
                      moveSectionUp(section.id);
                      triggerToast();
                    }}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-muted hover:text-ivory disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      moveSectionDown(section.id);
                      triggerToast();
                    }}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-muted hover:text-ivory disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      toggleSectionEnabled(section.id);
                      triggerToast();
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                      section.enabled
                        ? 'bg-white/[0.06] text-ivory hover:bg-white/[0.12]'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {section.enabled ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-red-400" />}
                    <span>{section.enabled ? 'Live' : 'Hidden'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete rail "${section.title}"?`)) {
                        removeSection(section.id);
                        triggerToast();
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                    title="Delete Rail"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. HERO BILLBOARD TAB */}
      {activeSubTab === 'hero' && (
        <div className="bg-graphite/40 border border-hairline rounded-xl p-6 space-y-6 max-w-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-semibold text-ivory">Hero Billboard Status</h3>
              <p className="text-xs text-muted mt-0.5">Toggle full-bleed cinematic video billboard on the viewer homepage</p>
            </div>
            <button
              onClick={() => {
                setHeroConfig({ ...heroConfig, enabled: !heroConfig.enabled });
                triggerToast();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                heroConfig.enabled
                  ? 'bg-signature text-black font-bold'
                  : 'bg-white/10 text-muted'
              }`}
            >
              {heroConfig.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted block">
              Default Tagline Badge
            </label>
            <input
              type="text"
              value={heroConfig.tagline || ''}
              onChange={(e) => setHeroConfig({ ...heroConfig, tagline: e.target.value })}
              onBlur={triggerToast}
              placeholder="e.g. Director Debut Spotlight • Official Selection"
              className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature"
            />
            <p className="text-[11px] text-muted">
              Displayed in the amber golden badge directly above the featured film title in the hero area.
            </p>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION LABELS TAB */}
      {activeSubTab === 'tabs' && (
        <div className="bg-graphite/40 border border-hairline rounded-xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-base font-semibold text-ivory pb-2 border-b border-white/[0.06]">
            Viewer Navigation Taxonomy
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-muted block">Home Tab</label>
              <input
                type="text"
                value={tabTitles.home}
                onChange={(e) => updateTabTitle('home', e.target.value)}
                onBlur={triggerToast}
                className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-muted block">Browse Tab</label>
              <input
                type="text"
                value={tabTitles.browse}
                onChange={(e) => updateTabTitle('browse', e.target.value)}
                onBlur={triggerToast}
                className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-muted block">Watchlist Tab</label>
              <input
                type="text"
                value={tabTitles.watchlist}
                onChange={(e) => updateTabTitle('watchlist', e.target.value)}
                onBlur={triggerToast}
                className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-muted block">History Tab</label>
              <input
                type="text"
                value={tabTitles.history}
                onChange={(e) => updateTabTitle('history', e.target.value)}
                onBlur={triggerToast}
                className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Rail Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121319] border border-white/[0.12] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-editorial font-bold text-ivory">Create New Homepage Rail</h3>
            <form onSubmit={handleCreateSection} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                  Rail Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Festival Winners & Masterpieces"
                  className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                  Subtitle / Editorial Note
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Celebrated cinema from across independent circuits"
                  className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                    Display Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-xs font-mono uppercase focus:outline-none"
                  >
                    <option value="rail">Horizontal Rail</option>
                    <option value="spotlight">Spotlight Card</option>
                    <option value="grid">Grid</option>
                    <option value="top10">Ranked Top 10</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                    Content Filter
                  </label>
                  <select
                    value={newFilterType}
                    onChange={(e) => setNewFilterType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-xs font-mono uppercase focus:outline-none"
                  >
                    <option value="all">All Published</option>
                    <option value="debut">Debut Directors Only</option>
                    <option value="featured">Featured Selections</option>
                    <option value="genre">Specific Genre</option>
                  </select>
                </div>
              </div>

              {newFilterType === 'genre' && (
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted block mb-1">
                    Genre Slug
                  </label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value.toLowerCase())}
                    placeholder="drama, thriller, documentary, comedy, animation"
                    className="w-full px-3.5 py-2 rounded-xl bg-canvas border border-hairline text-ivory text-sm focus:outline-none focus:border-signature font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider text-muted hover:text-ivory transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-signature hover:bg-signature-hover text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all"
                >
                  Save Rail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
