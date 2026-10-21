'use client';

/* eslint-disable @next/next/no-img-element -- banner images come from the farm's storage */
import Link from 'next/link';
import { useState } from 'react';
import { format, type Locale } from '@/lib/i18n';

export type Slide = { key: string; headlineAr: string; title: string; cta: string; href: string; imagePath: string; theme: 'olive' | 'earth' | 'leaf' };
type Labels = { prev: string; next: string; slide: string; region: string };

/** The home page banner: one slide at a time, changed with the arrows or dots (no autoplay). */
export function Banner({ slides, locale, labels }: { slides: Slide[]; locale: Locale; labels: Labels }) {
  const [index, setIndex] = useState(0);
  if (slides.length === 0) return null;
  const i = Math.min(index, slides.length - 1);
  const slide = slides[i];
  const go = (n: number) => setIndex((n + slides.length) % slides.length);

  return (
    <section className={`banner banner-${slide.theme}`} aria-roledescription="carousel" aria-label={labels.region}>
      <div className="container banner-inner" aria-live="polite">
        <div className="banner-art">
          {slide.imagePath ? <img src={slide.imagePath} alt="" /> : <BannerArt theme={slide.theme} />}
        </div>
        <div className="banner-copy">
          {slide.headlineAr && <p className="banner-headline" lang="ar" dir="rtl">{slide.headlineAr}</p>}
          <h1 className="banner-title">{slide.title}</h1>
          {slide.cta && <Link href={slide.href || `/${locale}`} className="pill">{slide.cta}</Link>}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button type="button" className="banner-arrow banner-prev" aria-label={labels.prev} onClick={() => go(i - 1)}>‹</button>
          <button type="button" className="banner-arrow banner-next" aria-label={labels.next} onClick={() => go(i + 1)}>›</button>
          <div className="banner-dots">
            {slides.map((s, n) => (
              <button key={s.key} type="button" aria-label={format(labels.slide, { n: n + 1 })} aria-current={n === i ? 'true' : undefined} onClick={() => go(n)}>
                <span className={n === i ? 'dot active' : 'dot'} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function BannerArt({ theme }: { theme: Slide['theme'] }) {
  if (theme === 'olive') {
    return (
      <svg viewBox="0 0 300 260" aria-hidden="true">
        <ellipse cx="150" cy="240" rx="120" ry="10" fill="#000" opacity="0.12" />
        <path d="M128 40h44v26l18 22v134a12 12 0 0 1-12 12h-56a12 12 0 0 1-12-12V88l18-22z" fill="#5e6b2a" />
        <rect x="126" y="22" width="48" height="22" rx="4" fill="#2b4019" />
        <rect x="112" y="120" width="76" height="70" fill="#f4efe2" />
        <path d="M150 132c10 8 12 22 0 34-12-12-10-26 0-34z" fill="#3e5a2b" />
        <circle cx="226" cy="196" r="16" fill="#3e5a2b" /><circle cx="246" cy="214" r="13" fill="#5e6b2a" />
        <circle cx="64" cy="204" r="14" fill="#3e5a2b" />
        <path d="M40 170c18-10 40-8 56 6" fill="none" stroke="#7a8a3a" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }
  if (theme === 'earth') {
    return (
      <svg viewBox="0 0 300 260" aria-hidden="true">
        <ellipse cx="150" cy="240" rx="130" ry="10" fill="#000" opacity="0.12" />
        <circle cx="104" cy="104" r="30" fill="#8fb36a" /><circle cx="146" cy="88" r="28" fill="#e0a868" />
        <circle cx="186" cy="106" r="26" fill="#6c2b4a" /><circle cx="214" cy="120" r="20" fill="#d1342b" />
        <path d="M50 120h200l-20 104a12 12 0 0 1-12 10H82a12 12 0 0 1-12-10z" fill="#a8743f" />
        <path d="M62 150h176M68 180h164M74 208h152" stroke="#8a5c2e" strokeWidth="5" />
        <path d="M86 120c0-56 28-90 64-90s64 34 64 90" fill="none" stroke="#7a5128" strokeWidth="8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 300 260" aria-hidden="true">
      <ellipse cx="150" cy="240" rx="130" ry="10" fill="#000" opacity="0.12" />
      <circle cx="92" cy="180" r="44" fill="#d1342b" />
      <path d="M92 136c-6-10-2-20 8-24" stroke="#3e5a2b" strokeWidth="5" fill="none" />
      <circle cx="196" cy="184" r="40" fill="#f2cf7a" /><circle cx="150" cy="200" r="32" fill="#8fb36a" />
      <path d="M196 144c8-16 26-20 40-16-6 14-22 22-40 16z" fill="#3e5a2b" />
      <circle cx="236" cy="126" r="18" fill="#6c2b4a" /><circle cx="256" cy="146" r="16" fill="#6c2b4a" />
    </svg>
  );
}
