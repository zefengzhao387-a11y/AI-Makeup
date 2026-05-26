import React from 'react';
import { en } from './locales/en';
import { zh } from './locales/zh';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { de } from './locales/de';
import { pt } from './locales/pt';

export type Lang = 'en' | 'zh' | 'ja' | 'ko' | 'fr' | 'es' | 'de' | 'pt';
export type TranslationKey = keyof typeof en;

export const LANGS: Lang[] = ['en', 'zh', 'ja', 'ko', 'fr', 'es', 'de', 'pt'];

export const LANG_OPTIONS: { code: Lang; native: string; flag: string }[] = [
  { code: 'en', native: 'English', flag: '🇺🇸' },
  { code: 'zh', native: '中文', flag: '🇨🇳' },
  { code: 'ja', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', native: '한국어', flag: '🇰🇷' },
  { code: 'fr', native: 'Français', flag: '🇫🇷' },
  { code: 'es', native: 'Español', flag: '🇪🇸' },
  { code: 'de', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', native: 'Português', flag: '🇧🇷' },
];

export const I18N: Record<Lang, Record<string, string>> = { en, zh, ja, ko, fr, es, de, pt };

const BROWSER_LANG_MAP: Record<string, Lang> = {
  en: 'en', zh: 'zh', ja: 'ja', ko: 'ko', fr: 'fr', es: 'es', de: 'de', pt: 'pt',
};

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved && LANGS.includes(saved)) return saved;
  } catch {}
  if (typeof navigator !== 'undefined') {
    const full = navigator.language?.toLowerCase() || '';
    const base = full.split('-')[0];
    if (BROWSER_LANG_MAP[full]) return BROWSER_LANG_MAP[full];
    if (BROWSER_LANG_MAP[base]) return BROWSER_LANG_MAP[base];
  }
  return 'en';
}

const _langListeners = new Set<() => void>();
let _currentLang: Lang = detectLang();

function getLang(): Lang { return _currentLang; }

export function setLang(l: Lang) {
  if (!LANGS.includes(l)) return;
  _currentLang = l;
  try { localStorage.setItem('lang', l); } catch {}
  _langListeners.forEach(fn => fn());
}

export function useLang(): [Lang, (l: Lang) => void] {
  const subscribe = (cb: () => void) => { _langListeners.add(cb); return () => _langListeners.delete(cb); };
  const lang = React.useSyncExternalStore(subscribe, getLang, getLang);
  return [lang, setLang];
}

export function useT() {
  const [lang] = useLang();
  return (key: string, vars?: Record<string, string | number>): string => {
    let s = I18N[lang][key] ?? I18N.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
}

export function tCat(t: (k: string) => string, c: string): string {
  return t(`cat.${c}`) || c;
}

export function makeupStyleLabel(style: { name: string; name_en: string }, lang: Lang): string {
  return lang === 'zh' ? style.name : style.name_en;
}
