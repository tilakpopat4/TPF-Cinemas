import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UISectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: 'rail' | 'top10' | 'continue_watching' | 'grid' | 'spotlight';
  filterType: 'all' | 'debut' | 'featured' | 'genre' | 'language' | 'manual';
  genreSlug?: string;
  language?: string;
  manualFilmIds?: string[];
  limit?: number;
  enabled: boolean;
}

export interface TabTitles {
  home: string;
  browse: string;
  watchlist: string;
  history: string;
  uiManager: string;
}

export interface HeroConfig {
  enabled: boolean;
  tagline?: string;
}

export const DEFAULT_UI_SECTIONS: UISectionConfig[] = [
  {
    id: 'continue_watching',
    title: 'Continue Watching',
    subtitle: 'Pick up where you left off',
    type: 'continue_watching',
    filterType: 'all',
    enabled: true,
  },
  {
    id: 'top10',
    title: 'Top 10 in India',
    subtitle: 'Most watched independent cinema today',
    type: 'top10',
    filterType: 'all',
    limit: 10,
    enabled: true,
  },
  {
    id: 'debut_directors',
    title: 'New Filmmakers Spotlight',
    subtitle: 'Uncompromising vision from emerging debut auteurs • Screening the beginner dreams',
    type: 'spotlight',
    filterType: 'debut',
    enabled: true,
  },
  {
    id: 'official_selections',
    title: 'Official Selections',
    subtitle: 'Curated festival premieres and notable releases',
    type: 'rail',
    filterType: 'all',
    enabled: true,
  },
  {
    id: 'drama',
    title: 'Human Geographies & Drama',
    subtitle: 'Intimate studies of relationships and quiet conflicts',
    type: 'rail',
    filterType: 'genre',
    genreSlug: 'drama',
    enabled: true,
  },
  {
    id: 'thriller',
    title: 'Suspense & Noir',
    subtitle: 'Tension, moral ambiguity, and atmospheric rhythm',
    type: 'rail',
    filterType: 'genre',
    genreSlug: 'thriller',
    enabled: true,
  },
  {
    id: 'documentary',
    title: 'Non-Fiction Archives',
    subtitle: 'Endangered architectures, oral traditions, and real lives',
    type: 'rail',
    filterType: 'genre',
    genreSlug: 'documentary',
    enabled: true,
  },
];

export const DEFAULT_TAB_TITLES: TabTitles = {
  home: 'Curated',
  browse: 'Catalogue',
  watchlist: 'Queue',
  history: 'Screening Log',
  uiManager: 'UI Studio',
};

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  enabled: true,
  tagline: 'Director Debut Spotlight',
};

const SECTIONS_STORAGE_KEY = 'tpf_cinemas_ui_sections_v2';
const TABS_STORAGE_KEY = 'tpf_cinemas_ui_tabs_v1';
const HERO_STORAGE_KEY = 'tpf_cinemas_ui_hero_v1';

export function useStaffUIManager() {
  const [sections, setSections] = useState<UISectionConfig[]>(() => {
    try {
      const saved = localStorage.getItem(SECTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse UI sections from localStorage', e);
    }
    return DEFAULT_UI_SECTIONS;
  });

  const [tabTitles, setTabTitles] = useState<TabTitles>(() => {
    try {
      const saved = localStorage.getItem(TABS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_TAB_TITLES, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse UI tab titles from localStorage', e);
    }
    return DEFAULT_TAB_TITLES;
  });

  const [heroConfig, setHeroConfigState] = useState<HeroConfig>(() => {
    try {
      const saved = localStorage.getItem(HERO_STORAGE_KEY);
      if (saved) return { ...DEFAULT_HERO_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse Hero config from localStorage', e);
    }
    return DEFAULT_HERO_CONFIG;
  });

  // 1. Initial Load from Supabase app_settings
  useEffect(() => {
    async function loadSettingsFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');

        if (error) {
          console.warn('Supabase app_settings fetch notice:', error.message);
          return;
        }

        if (data && data.length > 0) {
          data.forEach((row) => {
            if (row.key === 'ui_sections' && Array.isArray(row.value)) {
              setSections(row.value);
              localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(row.value));
            } else if (row.key === 'hero_config' && row.value) {
              setHeroConfigState(row.value);
              localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(row.value));
            } else if (row.key === 'tab_titles' && row.value) {
              setTabTitles(row.value);
              localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(row.value));
            }
          });
        }
      } catch (err) {
        console.error('Failed to sync app_settings with Supabase:', err);
      }
    }

    loadSettingsFromSupabase();

    // 2. Realtime listener
    const channel = supabase
      .channel('staff_app_settings_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        (payload: any) => {
          const newRow = payload.new;
          if (!newRow) return;

          if (newRow.key === 'ui_sections' && Array.isArray(newRow.value)) {
            setSections(newRow.value);
            localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(newRow.value));
          } else if (newRow.key === 'hero_config' && newRow.value) {
            setHeroConfigState(newRow.value);
            localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(newRow.value));
          } else if (newRow.key === 'tab_titles' && newRow.value) {
            setTabTitles(newRow.value);
            localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(newRow.value));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper to persist to Supabase
  const persistSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) {
        console.error('CRITICAL: Supabase app_settings write failed:', error);
        alert(`Failed to save to database: ${error.message}`);
      } else {
        console.log(`Successfully synced ${key} to Supabase`);
      }
    } catch (e) {
      console.error('Network error saving app_settings to Supabase', e);
    }
  };

  const setHeroConfig = useCallback((newConfig: HeroConfig) => {
    setHeroConfigState(newConfig);
    localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(newConfig));
    persistSetting('hero_config', newConfig);
  }, []);

  const addSection = useCallback((newSection: Omit<UISectionConfig, 'id'>) => {
    const id = `section_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setSections((prev) => {
      const updated = [...prev, { ...newSection, id }];
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(updated));
      persistSetting('ui_sections', updated);
      return updated;
    });
  }, []);

  const updateSection = useCallback((id: string, updates: Partial<UISectionConfig>) => {
    setSections((prev) => {
      const updated = prev.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec));
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(updated));
      persistSetting('ui_sections', updated);
      return updated;
    });
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => {
      const updated = prev.filter((sec) => sec.id !== id);
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(updated));
      persistSetting('ui_sections', updated);
      return updated;
    });
  }, []);

  const toggleSectionEnabled = useCallback((id: string) => {
    setSections((prev) => {
      const updated = prev.map((sec) => (sec.id === id ? { ...sec, enabled: !sec.enabled } : sec));
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(updated));
      persistSetting('ui_sections', updated);
      return updated;
    });
  }, []);

  const moveSectionUp = useCallback((id: string) => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index <= 0) return prev;
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(next));
      persistSetting('ui_sections', next);
      return next;
    });
  }, []);

  const moveSectionDown = useCallback((id: string) => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1 || index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(next));
      persistSetting('ui_sections', next);
      return next;
    });
  }, []);

  const updateTabTitle = useCallback((key: keyof TabTitles, value: string) => {
    setTabTitles((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(updated));
      persistSetting('tab_titles', updated);
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setSections(DEFAULT_UI_SECTIONS);
    setTabTitles(DEFAULT_TAB_TITLES);
    setHeroConfigState(DEFAULT_HERO_CONFIG);
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_UI_SECTIONS));
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(DEFAULT_TAB_TITLES));
    localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(DEFAULT_HERO_CONFIG));
    persistSetting('ui_sections', DEFAULT_UI_SECTIONS);
    persistSetting('hero_config', DEFAULT_HERO_CONFIG);
    persistSetting('tab_titles', DEFAULT_TAB_TITLES);
  }, []);

  return {
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
  };
}
