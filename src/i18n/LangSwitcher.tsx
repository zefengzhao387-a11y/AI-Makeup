import React from 'react';
import { useLang, LANG_OPTIONS, type Lang } from './index';

export function LangSwitcher({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [lang, setLangState] = useLang();
  return (
    <select
      className={`lang-select${className ? ` ${className}` : ''}`}
      style={style}
      value={lang}
      onChange={e => setLangState(e.target.value as Lang)}
      aria-label="Language"
    >
      {LANG_OPTIONS.map(o => (
        <option key={o.code} value={o.code}>{o.flag} {o.native}</option>
      ))}
    </select>
  );
}
