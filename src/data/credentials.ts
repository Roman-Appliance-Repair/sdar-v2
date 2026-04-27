// src/data/credentials.ts
//
// 8 trust credentials shown in the homepage Credentials section.
// Mirrors public/preview-homepage.html Section 07 (lines 1962-2075).
//
// SVG icon markup is copied verbatim from the preview — gold (#D4AF37) strokes
// with red (#C8102E) accents on a transparent fill. Rendered via `set:html`
// from Credentials.astro.

export interface Credential {
  /** Stable id used for the .map key */
  id: string;
  /** Card title (h3) */
  title: string;
  /** Card description (p) */
  description: string;
  /** Preview's preferred slug for /credentials/{slug}/ link.
   *  Build-time resolver in Credentials.astro falls back to a variation
   *  (or the /credentials/ hub) if no matching page exists. */
  preferredSlug: string;
  /** Inline SVG markup, 64×64 viewBox */
  iconSvg: string;
}

export const CREDENTIALS: Credential[] = [
  {
    id: 'background-checked',
    title: 'Background Checked',
    description: 'All technicians undergo rigorous background screening for your safety.',
    preferredSlug: 'background-checked-appliance-repair',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" stroke="#D4AF37" stroke-width="2"/>
  <path d="M32 16L38 22L32 28L26 22L32 16Z" fill="#D4AF37"/>
  <rect x="22" y="30" width="20" height="16" rx="2" stroke="#D4AF37" stroke-width="2"/>
  <path d="M27 38L30 41L37 34" stroke="#C8102E" stroke-width="2" stroke-linecap="round"/>
</svg>`,
  },
  {
    id: 'bbb-accredited',
    title: 'BBB Accredited',
    description: 'A+ rating from the Better Business Bureau.',
    preferredSlug: 'bbb-accredited',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="16" width="40" height="32" rx="4" stroke="#D4AF37" stroke-width="2"/>
  <text x="32" y="38" text-anchor="middle" font-family="Cinzel" font-size="20" font-weight="700" fill="#D4AF37">A+</text>
</svg>`,
  },
  {
    id: 'epa-certified',
    title: 'EPA Certified',
    description: 'EPA 608 certified for safe refrigerant handling.',
    preferredSlug: 'epa-608-certified',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="28" stroke="#D4AF37" stroke-width="2"/>
  <text x="32" y="36" text-anchor="middle" font-family="Montserrat" font-size="14" font-weight="700" fill="#D4AF37">EPA</text>
  <text x="32" y="50" text-anchor="middle" font-family="Montserrat" font-size="10" fill="#888888">608</text>
</svg>`,
  },
  {
    id: 'insured',
    title: 'Insured',
    description: 'Fully insured for your peace of mind and property protection.',
    preferredSlug: 'insured',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 12L44 18V32C44 42 32 52 32 52C32 52 20 42 20 32V18L32 12Z" stroke="#D4AF37" stroke-width="2" fill="none"/>
  <path d="M27 32L30 35L37 28" stroke="#C8102E" stroke-width="2" stroke-linecap="round"/>
</svg>`,
  },
  {
    id: 'licensed',
    title: 'Licensed',
    description: 'California BHGS #A49573 licensed for appliance & HVAC repair.',
    preferredSlug: 'licensed',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="20" width="32" height="24" rx="2" stroke="#D4AF37" stroke-width="2"/>
  <circle cx="32" cy="28" r="4" stroke="#D4AF37" stroke-width="2"/>
  <text x="32" y="42" text-anchor="middle" font-family="Montserrat" font-size="8" fill="#888888">BHGS</text>
</svg>`,
  },
  {
    id: 'oem-parts',
    title: 'OEM Parts',
    description: 'Only genuine OEM parts — no aftermarket substitutes.',
    preferredSlug: 'oem-parts',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="16" width="24" height="32" rx="2" stroke="#D4AF37" stroke-width="2"/>
  <path d="M26 24H38M26 32H38M26 40H34" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
</svg>`,
  },
  {
    id: 'osha-certified',
    title: 'OSHA Certified',
    description: 'OSHA-trained technicians for workplace safety compliance.',
    preferredSlug: 'osha-certified',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 14L42 20L42 34L32 40L22 34L22 20L32 14Z" stroke="#D4AF37" stroke-width="2" fill="none"/>
  <text x="32" y="32" text-anchor="middle" font-family="Montserrat" font-size="10" font-weight="700" fill="#D4AF37">OSHA</text>
</svg>`,
  },
  {
    id: 'same-day-service',
    title: 'Same Day Service',
    description: '7 days a week — appointments available same day or next day.',
    preferredSlug: 'same-day-service',
    iconSvg: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="20" stroke="#D4AF37" stroke-width="2"/>
  <path d="M32 20V32L40 36" stroke="#C8102E" stroke-width="2" stroke-linecap="round"/>
</svg>`,
  },
];
