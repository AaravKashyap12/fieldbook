export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = n => String(n).padStart(2, '0');
export const rise = i => `data-rise style="--i:${i}"`;
export const plural = (n, word = 'skill') => `${n} ${n === 1 ? word : `${word}s`}`;
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
export const countWord = n => WORDS[n] || String(n);
export const humanDate = iso => typeof iso !== 'string' ? 'Unavailable' : new Date(iso.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// 1234 -> "1.2K", 1051485 -> "1.05M". Exact values go in titles.
export function compact(n) {
  if (!Number.isSafeInteger(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(abs >= 1e7 ? 1 : 2).replace(/\.?0+$/, '')}M`;
  if (abs >= 1e4) return `${Math.round(n / 1e3)}K`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}
export const exact = n => (Number.isSafeInteger(n) ? n.toLocaleString('en-GB') : '');
export const signed = n => (!Number.isSafeInteger(n) ? '' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${compact(Math.abs(n))}`);
