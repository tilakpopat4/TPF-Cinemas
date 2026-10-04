import { useState, useEffect, useCallback } from 'react';
import { Film } from '../types';

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

export function getFilmsForSection(
  section: UISectionConfig,
  allFilms: Film[],
  inProgressFilms: Film[],
  top10Films: Film[]
): Film[] {
  if (section.type === 'continue_watching') {
    return inProgressFilms;
  }
  if (section.type === 'top10') {
    return top10Films.slice(0, section.limit || 10);
  }

  let list = allFilms;
  switch (section.filterType) {
    case 'debut':
      list = allFilms.filter((f) => f.is_debut);
      break;
    case 'featured':
      list = allFilms.filter((f) => f.is_featured);
      break;
    case 'genre':
      if (section.genreSlug) {
        const slug = section.genreSlug.toLowerCase();
        list = allFilms.filter((f) =>
          f.film_genres?.some(
            (fg) => fg.genres?.slug?.toLowerCase() === slug || fg.genres?.name?.toLowerCase() === slug
          )
        );
      }
      break;
    case 'language':
      if (section.language) {
        const lang = section.language.toLowerCase();
        list = allFilms.filter((f) => f.language?.toLowerCase() === lang);
      }
      break;
    case 'manual':
      if (section.manualFilmIds && section.manualFilmIds.length > 0) {
        list = allFilms.filter((f) => section.manualFilmIds!.includes(f.id));
      }
      break;
    case 'all':
    default:
      list = allFilms;
      break;
  }

  if (section.limit && section.limit > 0) {
    list = list.slice(0, section.limit);
  }
  return list;
}

export function useUIManager() {
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

  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => {
    try {
      const saved = localStorage.getItem(HERO_STORAGE_KEY);
      if (saved) return { ...DEFAULT_HERO_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse Hero config from localStorage', e);
    }
    return DEFAULT_HERO_CONFIG;
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
    } catch (e) {
      console.warn('Failed to save UI sections to localStorage', e);
    }
  }, [sections]);

  useEffect(() => {
    try {
      localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabTitles));
    } catch (e) {
      console.warn('Failed to save UI tab titles to localStorage', e);
    }
  }, [tabTitles]);

  useEffect(() => {
    try {
      localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(heroConfig));
    } catch (e) {
      console.warn('Failed to save Hero config to localStorage', e);
    }
  }, [heroConfig]);

  const addSection = useCallback((newSection: Omit<UISectionConfig, 'id'>) => {
    const id = `section_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setSections((prev) => [...prev, { ...newSection, id }]);
  }, []);

  const updateSection = useCallback((id: string, updates: Partial<UISectionConfig>) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec))
    );
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((sec) => sec.id !== id));
  }, []);

  const toggleSectionEnabled = useCallback((id: string) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, enabled: !sec.enabled } : sec))
    );
  }, []);

  const moveSectionUp = useCallback((id: string) => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index <= 0) return prev;
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
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
      return next;
    });
  }, []);

  const updateTabTitle = useCallback((key: keyof TabTitles, value: string) => {
    setTabTitles((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSections(DEFAULT_UI_SECTIONS);
    setTabTitles(DEFAULT_TAB_TITLES);
    setHeroConfig(DEFAULT_HERO_CONFIG);
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
