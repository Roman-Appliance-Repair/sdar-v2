// src/data/reviews-hcp.ts
//
// REAL customer reviews — the only reviews any city or county page may show
// (city stage 1, 2026-10-08). Source: the Housecall Pro review e-mails received by
// the branch mailboxes, matched to the HCP customer record for city and appliance
// (scratchpad audit reviews.csv, 37 usable positive reviews; "Richard" excluded —
// no customer record, so no city). Replaces 246 unsourced, undated testimonials that
// lived inside the 82 city pages, many of them paraphrasing the page's own
// "recent repair" cases.
//
// RULES
//   - `text` is VERBATIM, typos included. The single edit: Trey F.'s sentence about
//     where he found us is cut and marked with "…" (owner rule: that directory is
//     never mentioned on the site).
//   - `place` is the customer's REAL city / LA neighborhood. A review is never
//     relabelled to the page it sits on.
//   - `page` = the city hub that is this customer's own city/neighborhood. When the
//     customer's city has no page (Pico Rivera, Whittier, Lakewood, Montebello,
//     Covina, La Habra, La Mirada, Garden Grove) `page` is null and `hostPage` is
//     the nearest city hub by distance (src/data/city-geo.ts); the review is shown
//     there and on its county page, under a "nearby" heading, labelled with its
//     real city.
//   - LA neighborhoods without a page (Van Nuys, Palms, Century City, ZIPs 90016 /
//     90043) sit on /los-angeles/.
//   - No ratings are rendered and no Review / AggregateRating markup is emitted.

import type { CountySlug } from './cities';

export interface HcpReview {
  name: string;
  /** ISO date the review was left. */
  date: string;
  text: string;
  /** Real customer city or LA neighborhood, as printed under the quote. */
  place: string;
  county: CountySlug;
  /** City hub of the customer's own city / neighborhood, or null if it has none. */
  page: string | null;
  /** Only when page is null: the nearest city hub that shows this review. */
  hostPage?: string;
  /** Appliance from the job record, when known. */
  appliance?: string;
  /** Approximate location of the customer's city / ZIP — for "nearest reviews". */
  lat: number;
  lng: number;
}

export const HCP_REVIEWS: HcpReview[] = [
  { name: 'Stanley K.', date: '2026-08-06', place: 'Van Nuys', county: 'los-angeles', page: 'los-angeles', lat: 34.1867, lng: -118.4490,
    text: 'Abdulla was Awesome!!' },
  { name: 'Douglas S.', date: '2026-08-04', place: 'Long Beach', county: 'los-angeles', page: 'long-beach', appliance: 'Refrigerator', lat: 33.7701, lng: -118.1937,
    text: 'Abdullah was very friendly, courteous and professional. He arrived early, diagnosed and explained the problem being the compressor. Very efficient and professional.  Thanks' },
  { name: 'Emily', date: '2026-07-31', place: 'Westlake Village', county: 'ventura', page: 'westlake-village', lat: 34.1458, lng: -118.8059,
    text: 'Very thorough and good description of  issues.' },
  { name: 'Brooks H.', date: '2026-07-25', place: 'Pasadena', county: 'los-angeles', page: 'pasadena', appliance: 'Viking refrigerator', lat: 34.1478, lng: -118.1445,
    text: 'Mike was at my house within 4 hours of calling SAME DAY APPLIANCE. Viking fridge is now ice cold. A bit pricey but worth it.' },
  { name: 'Ruven B.', date: '2026-07-22', place: 'Palms', county: 'los-angeles', page: 'los-angeles', lat: 34.0215, lng: -118.4054,
    text: "As the name of the company states they came on the same day. The Technician's name was Alex. He was very friendly and knowledgeable. I would definitely recommend this company." },
  { name: 'Abrahim', date: '2026-07-18', place: 'Silver Lake / Echo Park', county: 'los-angeles', page: 'silver-lake', lat: 34.0780, lng: -118.2606,
    text: 'Great and friendly service. Knew what he was doing and took the time to fixed the problem.' },
  { name: 'Oslavdo', date: '2026-07-16', place: 'Whittier', county: 'los-angeles', page: null, hostPage: 'monterey-park', lat: 33.9792, lng: -118.0328,
    text: 'The person was great!' },
  { name: 'Calvin', date: '2026-07-11', place: 'Lakewood', county: 'los-angeles', page: null, hostPage: 'long-beach', lat: 33.8536, lng: -118.1340,
    text: "The company was very responsive to my calls prior to the service tech's arrival.  They agreed to help me on the same day.  Abdullah, the service tech, was a true professional.  He arrived at my home and quickly diagnosed the problem and solved it right away.  He was in and out in less than 45 minutes.  He was very engaging and personable too.  Keeping the business number for future issues.  Thank you!!!" },
  { name: 'Joseph D.', date: '2026-07-03', place: 'Pasadena', county: 'los-angeles', page: 'pasadena', appliance: 'Ice maker', lat: 34.1478, lng: -118.1445,
    text: 'Excellent service call . The Technician arrived right on time.  Installed the Ice maker straight on.' },
  { name: 'Aaron M.', date: '2026-06-29', place: 'Long Beach', county: 'los-angeles', page: 'long-beach', lat: 33.7701, lng: -118.1937,
    text: 'Fixed everything we needed. Friendly customer service.' },
  { name: 'Lenore S.', date: '2026-06-26', place: 'Montebello', county: 'los-angeles', page: null, hostPage: 'monterey-park', appliance: 'Dryer', lat: 34.0165, lng: -118.1138,
    text: 'Technician arrived on time, was able to repair dryer that day, in a timely manner and cleaned the area when he was finished.  I would be happy to recommend Same Day Appliance Repair to my friends and family.' },
  { name: 'Cheryl B.', date: '2026-06-26', place: 'Camarillo', county: 'ventura', page: 'camarillo', lat: 34.2164, lng: -119.0376,
    text: 'Amazing service prompt on time courteous will definitely recommend  to my friends!!!' },
  { name: 'Kim R.', date: '2026-06-05', place: 'Covina', county: 'los-angeles', page: null, hostPage: 'monrovia', lat: 34.0900, lng: -117.8903,
    text: 'Amazing fast and punctual repair, will definitely hire again' },
  { name: 'Janina B.', date: '2026-06-04', place: 'Santa Ana', county: 'orange', page: 'santa-ana', appliance: 'Refrigerator / ice maker', lat: 33.7455, lng: -117.8677,
    text: 'Excellent service. Very professional and he fixed the refrigerator. Now its producing the ice cubes, no water leaking. Im happy with the service' },
  { name: 'Fred K.', date: '2026-06-03', place: 'Irvine', county: 'orange', page: 'irvine', lat: 33.6846, lng: -117.8265,
    text: "Very professional. My technician Abdula was great. He address all my issues and did his best to fix them. I'm very satisfied with the service. Thank you" },
  { name: 'Daphne', date: '2026-05-14', place: 'Pico Rivera', county: 'los-angeles', page: null, hostPage: 'monterey-park', appliance: 'Refrigerator', lat: 33.9831, lng: -118.0967,
    text: 'I was glad to call these guys for my refrigerator. They knew on the spot what was the matter and gave us yhe best options what to do for our repairs and replacement. Thank you so much for your help!' },
  { name: 'Lily R.', date: '2026-02-18', place: 'Pacific Palisades', county: 'los-angeles', page: 'pacific-palisades', lat: 34.0481, lng: -118.5265,
    text: 'Excellent customer service thank you' },
  { name: 'Elizabeth I.', date: '2026-01-31', place: 'Long Beach', county: 'los-angeles', page: 'long-beach', lat: 33.7701, lng: -118.1937,
    text: 'Very kind & took his time. Explained very well. Was such a gentleman, his name was Russell . Loved the Service' },
  { name: 'Luis F.', date: '2026-01-21', place: 'Pico Rivera', county: 'los-angeles', page: null, hostPage: 'monterey-park', appliance: 'Dryer', lat: 33.9831, lng: -118.0967,
    text: 'Mike did a great job cleaning up our dryer. I recommend this company.' },
  { name: 'Maria R.', date: '2026-01-14', place: 'Sherman Oaks', county: 'los-angeles', page: 'sherman-oaks', lat: 34.1508, lng: -118.4490,
    text: 'Very professional and quick. Thank you for your service.' },
  { name: 'Eric', date: '2026-01-04', place: 'Woodland Hills', county: 'los-angeles', page: 'woodland-hills', lat: 34.1683, lng: -118.6059,
    text: 'They did a good job and in a reasonable amount of time. The Tech was Vitaly, he was great id use him again.' },
  { name: 'Luyanda M.', date: '2026-01-04', place: 'North Hollywood', county: 'los-angeles', page: 'north-hollywood', appliance: 'Refrigerator', lat: 34.1870, lng: -118.3813,
    text: "Super friendly when consulting on the phone. They came fast to view the fridge and diagnosed the problem quickly. Took 7 days to repair as they were waitinG for parts to be shipped. It was also during holiday season so I'm sure they could be faster during normal times. Great experience with Same day." },
  { name: 'Michael L.', date: '2026-01-01', place: 'West Hollywood', county: 'los-angeles', page: 'west-hollywood', lat: 34.0900, lng: -118.3780,
    text: 'Abdullah Rocks!' },
  { name: 'Ivan R.', date: '2025-12-30', place: 'Fullerton', county: 'orange', page: 'fullerton', lat: 33.8704, lng: -117.9242,
    text: 'Very professional and on time' },
  { name: 'Michael L.', date: '2025-12-29', place: 'West Hollywood', county: 'los-angeles', page: 'west-hollywood', lat: 34.0900, lng: -118.3780,
    text: 'Abdullah was friendly , efficient and kind .... Excellent choice !' },
  { name: 'Joel S.', date: '2025-12-28', place: 'Whittier', county: 'los-angeles', page: null, hostPage: 'monterey-park', lat: 33.9792, lng: -118.0328,
    text: 'Very professional and knowledgeable' },
  { name: 'Eric S.', date: '2025-12-27', place: 'Garden Grove', county: 'orange', page: null, hostPage: 'anaheim', lat: 33.7743, lng: -117.9380,
    text: 'Excellent Excellent Customer Servise!!! FAST AND CLEAN JOB DONE. GREAT PRICE! Our Technician was Awesome' },
  { name: 'Nathan', date: '2025-12-25', place: 'Century City', county: 'los-angeles', page: 'los-angeles', lat: 34.0557, lng: -118.4166,
    text: 'Amazing work done by both the technician and the person the call they did work in no time and answered to any request I had they work quick and make sure everything is done correctly and their assessments are so accurate you have to reasons to worry after the job' },
  { name: 'Sheryl H.', date: '2025-12-24', place: 'Silver Lake / Echo Park', county: 'los-angeles', page: 'silver-lake', appliance: 'Gas fireplace', lat: 34.0780, lng: -118.2606,
    text: 'Walter was delightful - he problem solved the gas supply issue to the fireplace and we have a fire for Christmas! He was thoughtful, thorough, timely and the office was terrific.' },
  { name: 'Vicky T.', date: '2025-12-23', place: 'La Habra', county: 'orange', page: null, hostPage: 'fullerton', appliance: 'Dishwasher', lat: 33.9319, lng: -117.9461,
    text: "Mike came to my home yesterday to see why my dishwasher wasn't working. He was punctual, courteous very knowledgeable and even cleaned up after himself. I highly recommend using this company. I will use them for every appliance need in the future." },
  { name: 'Trey F.', date: '2025-12-20', place: 'Pasadena', county: 'los-angeles', page: 'pasadena', appliance: 'Refrigerator', lat: 34.1478, lng: -118.1445,
    text: 'Showed up the same day and on time, diagnosed the problem with the refrigerator quickly (blocked freon tube), replaced the section that was causing the issue, put new freon in the system, cleaned it all up, and everything is working beautifully. The whole affair took two and a half to three hours. Very pleasant experience. … Will use them again if I need repairs. I recommend this company. The manager explained everything clearly on the phone about the repair and cost, and was both professional and friendly.' },
  { name: 'Iris G.', date: '2025-12-20', place: 'West Hollywood', county: 'los-angeles', page: 'west-hollywood', lat: 34.0900, lng: -118.3617,
    text: 'The technician was very knowledgeable, timely, caring and courteous. His work was very clean!  I recommend Same Day Appliance Repair without heaitation' },
  { name: 'Lori H.', date: '2025-12-18', place: 'La Mirada', county: 'los-angeles', page: null, hostPage: 'fullerton', lat: 33.9172, lng: -118.0120,
    text: 'Very good service' },
  { name: 'Sandra E.', date: '2025-12-11', place: 'Los Angeles', county: 'los-angeles', page: 'los-angeles', lat: 33.9880, lng: -118.3350,
    text: 'The technician was very courteous and checked all areas that were needed.  Excellent service' },
  { name: 'Eddie', date: '2025-12-11', place: 'Los Angeles', county: 'los-angeles', page: 'los-angeles', appliance: 'Washer', lat: 34.0290, lng: -118.3530,
    text: "I was very impressed with the technician Abdullah. He arrived on time and repaired the washing machine in 45 minutes. We had a Home warranty with Sears and have been waiting for this repair since December 1. Needless to say, I'm canceling it, and look forward to calling you again, Should I need your services and would highly recommend you?" },
  { name: 'Chris L.', date: '2023-12-27', place: 'Pasadena', county: 'los-angeles', page: 'pasadena', lat: 34.1478, lng: -118.1445,
    text: 'very thorough and did a great job' }
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "August 2026" — month and year only, the way the review is cited on the page. */
export function reviewMonth(r: Pick<HcpReview, 'date'>): string {
  const [y, m] = r.date.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}
