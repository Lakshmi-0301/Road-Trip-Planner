export function fmt(min) {
  if (!min || min <= 0) return '—';
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
function h(s) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) & 0xffffffff; return v >>> 0; }
export const fakeRating  = n => (3.5 + (h(n) % 15) / 10).toFixed(1);
export const fakeReviews = n => 12 + (h(n + 'r') % 280);
export const isOpen      = n => h(n + 'o') % 5 !== 0;
export const starBar     = r => { const f = Math.floor(r), half = r - f >= 0.5; return '★'.repeat(f) + (half ? '½' : '') + '☆'.repeat(5 - f - (half ? 1 : 0)); };

export function closestIdx(poly, lat, lon) {
  let best = 0, bd = Infinity;
  poly.forEach(([la, lo], i) => { const d = Math.hypot(la - lat, lo - lon); if (d < bd) { bd = d; best = i; } });
  return best;
}

export function interpolate(poly, a, b, n) {
  if (!poly || poly.length < 2 || n === 0) return [];
  const pts = poly.slice(a, b + 1);
  if (pts.length < 2) return [];
  let total = 0;
  const segs = pts.slice(1).map((p, i) => { const d = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]); total += d; return d; });
  const step = total / (n + 1);
  const out = []; let cum = 0, target = step;
  for (let i = 0; i < segs.length && out.length < n; i++) {
    const nxt = cum + segs[i];
    while (target <= nxt && out.length < n) {
      const t = (target - cum) / segs[i];
      out.push([pts[i][0] + t * (pts[i+1][0] - pts[i][0]), pts[i][1] + t * (pts[i+1][1] - pts[i][1])]);
      target += step;
    }
    cum = nxt;
  }
  return out;
}

export async function fetchOverpass(lat, lon, radiusKm, tag, limit = 20) {
  const q = `[out:json][timeout:15];(node${tag}(around:${radiusKm * 1000},${lat},${lon});way${tag}(around:${radiusKm * 1000},${lat},${lon}););out center ${limit};`;
  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.elements || []).map(el => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      if (!lat || !lon) return null;
      return {
        id: el.id, 
        lat, 
        lon,
        name:  el.tags?.name || el.tags?.['name:en'] || 'Unnamed',
        phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
        website: el.tags?.website || el.tags?.['contact:website'] || el.tags?.url || null,
        brand: el.tags?.brand || null,
        fee:   el.tags?.fee || null,
        hours: el.tags?.opening_hours || null,
        email: el.tags?.email || el.tags?.['contact:email'] || null,
        wheelchair: el.tags?.wheelchair || null,
        cuisine: el.tags?.cuisine || null,
        operator: el.tags?.operator || null,
      };
    }).filter(Boolean);
  } catch (err) { 
    console.warn(`Overpass fetch failed for ${lat},${lon}:`, err);
    return []; 
  }
}

export async function fetchElevation(polyline, samples = 60) {
  if (!polyline || polyline.length < 2) return [];
  const step = Math.max(1, Math.floor(polyline.length / samples));
  const pts  = polyline.filter((_, i) => i % step === 0);
  try {
    const res  = await fetch('https://api.open-elevation.com/api/v1/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: pts.map(([lat, lon]) => ({ latitude: lat, longitude: lon })) }),
    });
    const data = await res.json();
    return (data.results || []).map((r, i) => ({ lat: pts[i][0], lon: pts[i][1], elevation: r.elevation }));
  } catch { return []; }
}

export const calcFuelCost = (dist, mileage = 15, price = 103) => {
  const litres = dist / mileage;
  return { litres: +litres.toFixed(2), cost: Math.round(litres * price) };
};
export const estimateToll = (dist, veh = 'car') =>
  Math.round(dist * ({ car: 1.2, suv: 1.8, bike: 0.6, bus: 3.0 }[veh] || 1.2));
export const calcCarbon = (dist, veh = 'car') => {
  const g = dist * ({ car: 120, suv: 180, bike: 80, bus: 65 }[veh] || 120);
  return g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${Math.round(g)} g`;
};
export const riskScore = (t, w) =>
  Math.min(10, ({ LOW: 1, MODERATE: 4, HIGH: 8 }[t] ?? 4) + ({ LOW: 0, MEDIUM: 2, HIGH: 4 }[w] ?? 0));
export const riskColor = s => s <= 3 ? '#6dbf8a' : s <= 6 ? '#e09a4a' : '#e05c5c';
export const riskLabel = s => s <= 3 ? 'Low risk' : s <= 6 ? 'Moderate risk' : 'High risk';

export function departureAdvice(segs) {
  if (segs.some(s => s.traffic_level === 'HIGH'))
    return { msg: 'Leave before 7:00 AM or after 8:00 PM to avoid heavy traffic on this route.', color: '#e05c5c', suggestedTime: '06:30' };
  if (segs.some(s => s.traffic_level === 'MODERATE'))
    return { msg: 'Leave before 9:00 AM for a smoother drive — moderate traffic expected midday.', color: '#e09a4a', suggestedTime: '08:00' };
  return { msg: 'Road conditions look clear. Any departure time works well.', color: '#6dbf8a', suggestedTime: '09:00' };
}

export function staySuggestion(cities, totalMin) {
  if (totalMin < 300 || cities.length < 3) return null;
  return {
    city: cities[Math.floor(cities.length / 2)],
    note: `Consider halting overnight here — roughly the halfway point of this long journey.`,
  };
}

const EM = {
  Chennai:    { state: 'Tamil Nadu',    highway: '1033', police: '100', ambulance: '108' },
  Bangalore:  { state: 'Karnataka',    highway: '1033', police: '100', ambulance: '108' },
  Mysore:     { state: 'Karnataka',    highway: '1033', police: '100', ambulance: '108' },
  Coimbatore: { state: 'Tamil Nadu',    highway: '1033', police: '100', ambulance: '108' },
  Puducherry: { state: 'Puducherry UT', highway: '1033', police: '100', ambulance: '108' },
  Hyderabad:  { state: 'Telangana',    highway: '1033', police: '100', ambulance: '108' },
  Kochi:      { state: 'Kerala',       highway: '1033', police: '100', ambulance: '112' },
};
export function getEmergencyContacts(cities) {
  const seen = new Set();
  return cities.map(c => EM[c]).filter(e => { if (!e || seen.has(e.state)) return false; seen.add(e.state); return true; });
}

export function buildChecklist(segs) {
  return segs.map(s => ({
    segment: `${s.start} → ${s.end}`,
    items: [
      s.stops?.fuel > 0            && `${s.stops.fuel} fuel stations on this leg — tank up`,
      s.traffic_level === 'HIGH'   && 'Heavy traffic — leave extra buffer time',
      s.weather_risk  === 'HIGH'   && 'Rain likely — carry gear and slow down',
      s.stops?.restaurants > 0     && `${s.stops.restaurants} restaurants along this segment`,
      s.stops?.hospitals > 0       && `${s.stops.hospitals} hospitals on route`,
    ].filter(Boolean),
  }));
}

export const TRAFFIC_COLORS = { LOW: '#6dbf8a', MODERATE: '#e09a4a', HIGH: '#e05c5c' };

export const POI_CONFIG = {
  fuel:        { color: '#D4A574', bg: 'rgba(212,165,116,0.12)', label: 'Fuel',        overpassTag: '[amenity=fuel]',            icon: 'fuel'       },
  restaurants: { color: '#C97C7C', bg: 'rgba(201,124,124,0.12)', label: 'Restaurants', overpassTag: '[amenity=restaurant][cuisine!=temple]',       icon: 'restaurant' },
  hospitals:   { color: '#D97070', bg: 'rgba(217,112,112,0.12)', label: 'Hospitals',   overpassTag: '[amenity=hospital]',         icon: 'hospital'   },
  hotels:      { color: '#A89BC4', bg: 'rgba(168,155,196,0.12)', label: 'Hotels',      overpassTag: '[tourism=hotel]',            icon: 'hotel'      },
  atm:         { color: '#6DBFBF', bg: 'rgba(109,191,191,0.12)', label: 'ATMs',        overpassTag: '[amenity=atm]',              icon: 'atm'        },
  pharmacy:    { color: '#7FD87F', bg: 'rgba(127,216,127,0.12)', label: 'Pharmacies',  overpassTag: '[amenity=pharmacy]',         icon: 'pharmacy'   },
  police:      { color: '#7BA8D1', bg: 'rgba(123,168,209,0.12)', label: 'Police',      overpassTag: '[amenity=police]',           icon: 'police'     },
  viewpoint:   { color: '#D9A85C', bg: 'rgba(217,168,92,0.12)',  label: 'Viewpoints',  overpassTag: '[tourism=viewpoint]',        icon: 'viewpoint'  },
  ev:          { color: '#6FD9A3', bg: 'rgba(111,217,163,0.12)', label: 'EV Charging', overpassTag: '[amenity=charging_station]', icon: 'ev'         },
  restarea:    { color: '#D9915C', bg: 'rgba(217,145,92,0.12)',  label: 'Rest Areas',  overpassTag: '[amenity=rest_area]',        icon: 'restarea'   },
};