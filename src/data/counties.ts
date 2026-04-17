export interface County {
  name: string;
  slug: string;
  cities: string[];
}

export const counties: County[] = [
  {
    name: "Los Angeles County",
    slug: "los-angeles-county",
    cities: [
      "Agoura Hills", "Alhambra", "Arcadia", "Atwater Village",
      "Bel Air", "Beverly Hills", "Brentwood", "Burbank",
      "Calabasas", "Culver City", "Eagle Rock", "El Segundo",
      "Encino", "Glassell Park", "Glendale", "Hollywood",
      "Long Beach", "Los Angeles", "Malibu", "Manhattan Beach",
      "Monrovia", "Monterey Park", "North Hollywood", "Pasadena",
      "Redondo Beach", "San Gabriel", "San Marino", "Santa Monica",
      "Sherman Oaks", "Studio City", "Tarzana", "Toluca Lake",
      "Torrance", "West Hollywood", "West Los Angeles",
      "Westwood", "Woodland Hills"
    ]
  },
  {
    name: "Orange County",
    slug: "orange-county",
    cities: [
      "Anaheim", "Costa Mesa", "Dana Point", "Fullerton",
      "Huntington Beach", "Irvine", "Laguna Beach", "Laguna Niguel",
      "Mission Viejo", "Newport Beach", "San Clemente", "Santa Ana",
      "Tustin", "Villa Park", "Yorba Linda"
    ]
  },
  {
    name: "Ventura County",
    slug: "ventura-county",
    cities: [
      "Camarillo", "Moorpark", "Newbury Park", "Oak Park",
      "Ojai", "Oxnard", "Simi Valley", "Thousand Oaks", "Ventura"
    ]
  },
  {
    name: "San Bernardino County",
    slug: "san-bernardino-county",
    cities: [
      "Chino Hills", "Fontana", "Loma Linda", "Ontario",
      "Rancho Cucamonga", "Redlands", "San Bernardino", "Upland"
    ]
  },
  {
    name: "Riverside County",
    slug: "riverside-county",
    cities: [
      "Corona", "Hemet", "Lake Elsinore", "Menifee",
      "Moreno Valley", "Murrieta", "Riverside", "Temecula"
    ]
  }
];

// Helper: city name → URL slug
export function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
}
