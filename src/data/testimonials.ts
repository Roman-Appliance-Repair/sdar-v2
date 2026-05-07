// src/data/testimonials.ts
//
// Customer testimonials for the homepage Reviews section.
// 5 verified-looking entries from preview-homepage.html cards 1-5
// (4 Google + 1 Thumbtack). Cards 6-20 from preview were excluded as
// potential placeholder content per the Step 9 review.
//
// Per Step 4.75 policy, NO numerical ratings appear here or in any visible
// content rendered from this data. Stars on the cards are decorative ★ chars.

export type TestimonialSource = 'google' | 'thumbtack';

export interface Testimonial {
  id: string;
  /** Reviewer display name as it appears on the source platform */
  name: string;
  /** Relative date string copied verbatim from preview ("7 days ago", etc.) */
  date: string;
  source: TestimonialSource;
  /** CSS gradient string used as the avatar disc background. From preview. */
  avatarGradient: string;
  /** Full quote text */
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'martha-lov',
    name: 'Martha LOV',
    date: '7 days ago',
    source: 'google',
    avatarGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    quote:
      'Called them n they had a tech in my home within 90 mins! Professional service and great communication throughout the repair process.'
  },
  {
    id: 'david-b',
    name: 'David B',
    date: '2 months ago',
    source: 'google',
    avatarGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    quote:
      'Was looking for a good appliance repair company in Los Angeles. Technician came on time to fix my dryer and I ended up hiring him again for my BBQ.'
  },
  {
    id: 'anastasia-klenova',
    name: 'Anastasia Klenova',
    date: '3 months ago',
    source: 'google',
    avatarGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    quote:
      "We called Same Day Appliance Repair several times over a couple of years to fix a refrigerator that was leaking and a dryer that wasn't working. Always reliable."
  },
  {
    id: 'farinoush-gaminchi',
    name: 'Farinoush Gaminchi',
    date: '2 months ago',
    source: 'google',
    avatarGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    quote:
      'Roman was great! We hired him to remove our over-the-range vent hood and reinstall it after repairs to the electrical outlet. Very knowledgeable.'
  },
  {
    id: 'umidkhon-sharapat',
    name: 'Umidkhon Sharapat',
    date: '2 months ago',
    source: 'thumbtack',
    avatarGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    quote:
      'Called them for my LG dryer repair. Technician was polite and professional. Showed the issue to me and fixed it the same day. I recommend!'
  }
];

/** Tab-pill filters. No numerical aggregate ratings — Step 4.75 policy. */
export type ReviewTabId = 'all' | 'google' | 'thumbtack';

export interface ReviewTab {
  id: ReviewTabId;
  label: string;
}

export const REVIEW_TABS: ReviewTab[] = [
  { id: 'all', label: 'All Reviews' },
  { id: 'google', label: 'Google' },
  { id: 'thumbtack', label: 'Thumbtack' }
];
