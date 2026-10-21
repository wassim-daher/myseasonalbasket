/* eslint-disable @next/next/no-img-element -- product photos come from the farm's storage, any host */

// A product or basket photo. Until the farm uploads photos, a simple drawn
// placeholder in the product's tint stands in, so no fake photo is ever shown.

const tints = ['var(--tint-1)', 'var(--tint-2)', 'var(--tint-3)', 'var(--tint-4)'];

function tintFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return tints[hash % tints.length];
}

export function Picture({ src, alt, seed, kind, wide = false }: { src: string; alt: string; seed: string; kind: 'product' | 'basket'; wide?: boolean }) {
  const className = wide ? 'picture picture-wide' : 'picture';
  if (src) {
    return (
      <div className={className}>
        <img src={src} alt={alt} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={className} style={{ background: tintFor(seed) }} role="img" aria-label={alt}>
      {kind === 'basket' ? <BasketMark /> : <LeafMark />}
    </div>
  );
}

function BasketMark() {
  return (
    <svg width="38%" viewBox="0 0 120 100" aria-hidden="true">
      <circle cx="42" cy="38" r="16" fill="#b9d38a" />
      <circle cx="66" cy="34" r="14" fill="#e0a868" />
      <circle cx="84" cy="42" r="12" fill="#8fb36a" />
      <path d="M20 46h80l-8 38a6 6 0 0 1-6 5H34a6 6 0 0 1-6-5z" fill="#3e5a2b" />
      <path d="M30 58h60M33 70h54" stroke="#f4f6ef" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function LeafMark() {
  return (
    <svg width="30%" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 88C50 60 58 30 86 14c4 30-8 60-36 74z" fill="#3e5a2b" />
      <path d="M50 88C48 64 36 44 14 36c-2 26 12 46 36 52z" fill="#8fb36a" />
      <path d="M50 88V58" stroke="#f4f6ef" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
