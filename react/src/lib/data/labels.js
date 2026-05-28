// Default geographic label set, grouped by LOD (level of detail):
//   0 = always visible (continents, oceans)
//   1 = countries + seas, visible while camera distance < ~4.5
//   2 = mountains + cities, visible while camera distance < ~2.5
//   3 = individual peaks, visible while camera distance < ~1.7
//
// Override the entire list via the `labels` prop on <InteractiveGlobe />.
export const DEFAULT_LABELS = [
  // Continents (lod 0)
  { name: 'AFRICA',         lat: 5,    lon: 22,    type: 'continent', lod: 0 },
  { name: 'EUROPE',         lat: 54,   lon: 14,    type: 'continent', lod: 0 },
  { name: 'ASIA',           lat: 50,   lon: 90,    type: 'continent', lod: 0 },
  { name: 'NORTH AMERICA',  lat: 45,   lon: -100,  type: 'continent', lod: 0 },
  { name: 'SOUTH AMERICA',  lat: -15,  lon: -60,   type: 'continent', lod: 0 },
  { name: 'OCEANIA',        lat: -25,  lon: 135,   type: 'continent', lod: 0 },
  { name: 'ANTARCTICA',     lat: -82,  lon: 0,     type: 'continent', lod: 0 },

  // Oceans (lod 0)
  { name: 'Pacific Ocean',  lat: 0,    lon: -150,  type: 'ocean', lod: 0 },
  { name: 'Atlantic Ocean', lat: 10,   lon: -35,   type: 'ocean', lod: 0 },
  { name: 'Indian Ocean',   lat: -25,  lon: 78,    type: 'ocean', lod: 0 },
  { name: 'Arctic Ocean',   lat: 84,   lon: 0,     type: 'ocean', lod: 0 },
  { name: 'Southern Ocean', lat: -65,  lon: 30,    type: 'ocean', lod: 0 },

  // Countries (lod 1)
  { name: 'China',          lat: 35,   lon: 103,   type: 'country', lod: 1 },
  { name: 'India',          lat: 22,   lon: 79,    type: 'country', lod: 1 },
  { name: 'Russia',         lat: 62,   lon: 95,    type: 'country', lod: 1 },
  { name: 'United States',  lat: 39,   lon: -98,   type: 'country', lod: 1 },
  { name: 'Canada',         lat: 56,   lon: -106,  type: 'country', lod: 1 },
  { name: 'Brazil',         lat: -10,  lon: -55,   type: 'country', lod: 1 },
  { name: 'Argentina',      lat: -36,  lon: -64,   type: 'country', lod: 1 },
  { name: 'Australia',      lat: -25,  lon: 134,   type: 'country', lod: 1 },
  { name: 'Mongolia',       lat: 47,   lon: 104,   type: 'country', lod: 1 },
  { name: 'Kazakhstan',     lat: 48,   lon: 67,    type: 'country', lod: 1 },
  { name: 'Iran',           lat: 32,   lon: 53,    type: 'country', lod: 1 },
  { name: 'Saudi Arabia',   lat: 24,   lon: 45,    type: 'country', lod: 1 },
  { name: 'Egypt',          lat: 27,   lon: 30,    type: 'country', lod: 1 },
  { name: 'Algeria',        lat: 28,   lon: 2,     type: 'country', lod: 1 },
  { name: 'Sudan',          lat: 15,   lon: 30,    type: 'country', lod: 1 },
  { name: 'Nigeria',        lat: 10,   lon: 8,     type: 'country', lod: 1 },
  { name: 'DR Congo',       lat: -2,   lon: 23,    type: 'country', lod: 1 },
  { name: 'South Africa',   lat: -29,  lon: 24,    type: 'country', lod: 1 },
  { name: 'Indonesia',      lat: -2,   lon: 118,   type: 'country', lod: 1 },
  { name: 'Japan',          lat: 36,   lon: 138,   type: 'country', lod: 1 },
  { name: 'Turkey',         lat: 39,   lon: 35,    type: 'country', lod: 1 },
  { name: 'Mexico',         lat: 23,   lon: -102,  type: 'country', lod: 1 },
  { name: 'Greenland',      lat: 72,   lon: -40,   type: 'country', lod: 1 },
  { name: 'France',         lat: 46,   lon: 2,     type: 'country', lod: 1 },
  { name: 'Germany',        lat: 51,   lon: 10,    type: 'country', lod: 1 },
  { name: 'Spain',          lat: 40,   lon: -4,    type: 'country', lod: 1 },
  { name: 'UK',             lat: 54,   lon: -3,    type: 'country', lod: 1 },
  { name: 'Italy',          lat: 43,   lon: 12,    type: 'country', lod: 1 },

  // Seas (lod 1)
  { name: 'Mediterranean Sea', lat: 35, lon: 18,   type: 'ocean', lod: 1 },
  { name: 'Red Sea',           lat: 20, lon: 38,   type: 'ocean', lod: 1 },
  { name: 'Caribbean Sea',     lat: 15, lon: -75,  type: 'ocean', lod: 1 },
  { name: 'Caspian Sea',       lat: 42, lon: 50,   type: 'ocean', lod: 1 },
  { name: 'Black Sea',         lat: 43, lon: 35,   type: 'ocean', lod: 1 },
  { name: 'Arabian Sea',       lat: 15, lon: 65,   type: 'ocean', lod: 1 },
  { name: 'Bay of Bengal',     lat: 15, lon: 88,   type: 'ocean', lod: 1 },
  { name: 'South China Sea',   lat: 15, lon: 115,  type: 'ocean', lod: 1 },
  { name: 'Bering Sea',        lat: 58, lon: -178, type: 'ocean', lod: 1 },
  { name: 'Gulf of Mexico',    lat: 25, lon: -90,  type: 'ocean', lod: 1 },

  // Mountains (lod 2/3)
  { name: 'Himalayas',   lat: 28,    lon: 84,    type: 'mountain', lod: 2 },
  { name: 'Alps',        lat: 46,    lon: 9,     type: 'mountain', lod: 2 },
  { name: 'Andes',       lat: -20,   lon: -68,   type: 'mountain', lod: 2 },
  { name: 'Rockies',     lat: 44,    lon: -110,  type: 'mountain', lod: 2 },
  { name: 'Ural Mts.',   lat: 60,    lon: 60,    type: 'mountain', lod: 2 },
  { name: 'Atlas Mts.',  lat: 32,    lon: -5,    type: 'mountain', lod: 2 },
  { name: 'Caucasus',    lat: 43,    lon: 44,    type: 'mountain', lod: 2 },
  { name: 'Tian Shan',   lat: 42,    lon: 78,    type: 'mountain', lod: 2 },
  { name: 'Mt. Everest', lat: 27.99, lon: 86.92, type: 'mountain', lod: 3 },
  { name: 'Mt. Fuji',    lat: 35.36, lon: 138.73,type: 'mountain', lod: 3 },
  { name: 'Kilimanjaro', lat: -3.07, lon: 37.35, type: 'mountain', lod: 3 },
];
