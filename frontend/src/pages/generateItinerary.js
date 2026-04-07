/**
 * generateItinerary.js  —  Road Trip Planner
 * 2-page detailed itinerary, dark background, bright readable colours
 */

import { jsPDF } from 'jspdf';
import {
  calcFuelCost, estimateToll, calcCarbon,
  riskScore, riskLabel,
  getEmergencyContacts, buildChecklist,
} from './tripUtils';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:     [13,  13,  13],
  card:   [24,  24,  22],
  card2:  [34,  33,  30],
  tan:    [200, 172, 130],   // brighter tan — readable on dark
  tanD:   [150, 128, 96],
  gold:   [230, 195, 120],   // for key numbers
  cream:  [242, 234, 218],
  white:  [255, 255, 255],
  muted:  [155, 150, 140],   // lighter muted — was too dark
  border: [50,  47,  42],
  green:  [110, 200, 140],
  amber:  [230, 165, 75],
  red:    [220, 90,  90],
  blue:   [110, 165, 220],
};

const W = 210, H = 297, ML = 13, MR = 13, CW = W - ML - MR;

// ─── Primitives ──────────────────────────────────────────────────────────────
const sf = (d,c) => d.setFillColor(c[0],c[1],c[2]);
const sd = (d,c) => d.setDrawColor(c[0],c[1],c[2]);
const st = (d,c) => d.setTextColor(c[0],c[1],c[2]);

function box(d, x, y, w, h, c, r=0) {
  sf(d,c);
  r > 0 ? d.roundedRect(x,y,w,h,r,r,'F') : d.rect(x,y,w,h,'F');
}

function stroke(d, x, y, w, h, c, r=0, lw=0.3) {
  sd(d,c); d.setLineWidth(lw);
  r > 0 ? d.roundedRect(x,y,w,h,r,r,'S') : d.rect(x,y,w,h,'S');
}

function ln(d, x1, y1, x2, y2, c, lw=0.25) {
  sd(d,c); d.setLineWidth(lw); d.line(x1,y1,x2,y2);
}

function tx(d, str, x, y, c, size, bold=false, align='left') {
  st(d,c);
  d.setFont('helvetica', bold ? 'bold' : 'normal');
  d.setFontSize(size);
  d.text(String(str ?? '—'), x, y, { align });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rupee = n => (n == null || isNaN(+n)) ? 'N/A' : `Rs.${Math.round(+n).toLocaleString('en-IN')}`;
const nn    = (n, d=1) => (n == null || isNaN(+n)) ? '0' : (+n).toFixed(d);

function fmtTime(mins) {
  const m = Math.round(+mins || 0);
  if (!m) return '—';
  const h = Math.floor(m/60), r = m%60;
  return h > 0 ? `${h}h ${r > 0 ? r+'m' : ''}`.trim() : `${r}m`;
}

function riskC(s)  { return s<=3 ? C.green : s<=6 ? C.amber : C.red; }
function riskBg(s) { return s<=3 ? [14,30,18] : s<=6 ? [34,24,10] : [34,12,12]; }

const FP = { Petrol:103, Diesel:90, Electric:12, CNG:78 };

// ─── Section label ───────────────────────────────────────────────────────────
function sLabel(d, text, y) {
  tx(d, text, ML, y, C.tan, 7, true);
  ln(d, ML, y+2.5, W-MR, y+2.5, C.tanD, 0.4);
  return y + 8;
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function footer(d, pg, tot, src, dst) {
  const y = H - 8;
  ln(d, ML, y-3, W-MR, y-3, C.border);
  tx(d, 'Road Trip Planner  |  South India', ML, y, C.muted, 6.5);
  tx(d, `${src}  to  ${dst}`, W/2, y, C.muted, 6.5, false, 'center');
  tx(d, `${pg} / ${tot}`, W-MR, y, C.muted, 6.5, false, 'right');
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAGE 1  —  Overview + Route + Weather
// ═══════════════════════════════════════════════════════════════════════════
function page1(d, D) {
  const { src, dst, fd, route, segments, weather, summary,
          totalDist, totalTime, fuelCost, fuelLitres, toll,
          carbon, fuelPrice, vehicle, pax, risk, mileage } = D;

  box(d, 0, 0, W, H, C.bg);

  // ── TOP HEADER ────────────────────────────────────────────────────────────
  box(d, 0, 0, W, 64, C.card);
  box(d, 0, 60, W, 4, C.tan);

  // Brand line
  tx(d, 'ROAD TRIP PLANNER', ML, 10, C.tan, 7, true);
  tx(d, `Generated ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`,
     W-MR, 10, C.muted, 6.5, false, 'right');

  // Big city names
  tx(d, src.toUpperCase(), ML, 38, C.white, 28, true);
  const arrowX = ML + Math.min(src.length * 7, 90);
  tx(d, 'to', arrowX + 3, 38, C.tan, 16, false);
  tx(d, dst.toUpperCase(), arrowX + 16, 38, C.cream, 28, true);

  // Sub-info row
  const routeLabel = (fd?.route || 'balanced').charAt(0).toUpperCase() + (fd?.route||'balanced').slice(1);
  tx(d, `${fd?.startDate||'—'}   |   Departs ${fd?.departureTime||'08:00'}   |   ${pax} ${pax===1?'person':'people'}   |   ${routeLabel} route`,
     ML, 52, C.muted, 7.5);

  // ── HERO STATS STRIP ─────────────────────────────────────────────────────
  const stats = [
    { l:'DISTANCE',    v:`${Math.round(totalDist)} km`,    c:C.gold },
    { l:'DURATION',    v:fmtTime(totalTime),                c:C.gold },
    { l:'FUEL COST',   v:rupee(fuelCost),                  c:C.cream },
    { l:'TOLLS',       v:rupee(toll),                      c:C.cream },
    { l:'TOTAL COST',  v:rupee(fuelCost+toll),             c:C.tan },
    { l:'PER PERSON',  v:rupee((fuelCost+toll)/pax),       c:C.tan },
  ];
  const sw = CW / 6;
  stats.forEach(({ l, v, c }, i) => {
    const x = ML + i * sw;
    box(d, x, 68, sw-1.5, 22, i%2===0 ? C.card : C.card2, 2);
    tx(d, l, x+3, 75, C.muted, 5.5, true);
    tx(d, v, x+3, 83, c, 8.5, true);
  });

  // ── RISK + FUEL DETAIL BAND ───────────────────────────────────────────────
  const ry = 96;
  const rc = riskC(risk);
  box(d, ML, ry, CW, 20, riskBg(risk), 2);
  box(d, ML, ry, 3, 20, rc);

  // Risk left
  tx(d, 'ROUTE RISK', ML+6, ry+7, rc, 6.5, true);
  tx(d, `${risk}/10  —  ${(riskLabel(risk)||'Moderate').toUpperCase()}`, ML+6, ry+16, rc, 10, true);
  // Risk bar
  const brX = ML+70, brW = 45;
  box(d, brX, ry+8, brW, 4, C.border, 1);
  box(d, brX, ry+8, brW*(risk/10), 4, rc, 1);

  ln(d, ML+120, ry+3, ML+120, ry+17, C.border);

  // Fuel detail right
  tx(d, 'FUEL BREAKDOWN', ML+124, ry+7, C.muted, 6.5, true);
  tx(d, `${nn(fuelLitres)}L  x  Rs.${fuelPrice}/L  =  ${rupee(fuelCost)}  |  ${nn(fuelCost/(fuelCost+toll)*100,0)}% of total`,
     ML+124, ry+16, C.cream, 7.5, true);

  // ── CARBON + MILEAGE ─────────────────────────────────────────────────────
  const cy = 122;
  const hw = (CW-3)/3;
  [
    { l:'CARBON FOOTPRINT', v:`${nn(carbon)} kg CO2`, s:`${(vehicle||'car').toUpperCase()} over ${Math.round(totalDist)} km` },
    { l:'FUEL EFFICIENCY',  v:`${mileage} km/L`,      s:`${nn(fuelLitres)} L total consumption` },
    { l:'STOP ESTIMATE',    v:fmtTime(summary?.stop_time_min), s:`Drive: ${fmtTime(summary?.travel_time_min||totalTime)}` },
  ].forEach(({ l, v, s }, i) => {
    const x = ML + i*(hw+1.5);
    box(d, x, cy, hw, 18, C.card2, 2);
    box(d, x, cy, hw, 2.5, i===0?C.green:i===1?C.blue:C.amber);
    tx(d, l, x+4, cy+9, C.muted, 6, true);
    tx(d, v, x+4, cy+16, C.white, 8.5, true);
    tx(d, s, x+hw-3, cy+16, C.muted, 6, false, 'right');
  });

  // ── ROUTE SEGMENTS ────────────────────────────────────────────────────────
  let y = 147;
  y = sLabel(d, 'ROUTE SEGMENTS', y);

  const segs = segments.length > 0 ? segments : [{
    start: src, end: dst,
    distance_km: totalDist, travel_time_min: totalTime,
    avg_speed: 62, traffic_level: 'MODERATE', weather_risk: 'LOW',
    fuel_stops: 0, restaurants: 0, hospitals: 0,
  }];

  segs.forEach((seg, i) => {
    if (y > 215) return;
    const sh = 21;
    const tl = (seg.traffic_level || 'MODERATE').toUpperCase();
    const tc = tl==='HIGH' ? C.red : tl==='LOW' ? C.green : C.amber;
    // Use .start/.end (TripResult format) with fallback to .segment_start/.segment_end
    const sCity = seg.start || seg.segment_start || src;
    const eCity = seg.end   || seg.segment_end   || dst;
    const segRisk = riskScore(seg.traffic_level, seg.weather_risk);
    const segRc   = riskC(segRisk);

    box(d, ML, y, CW, sh, C.card, 2);
    box(d, ML, y, 3, sh, tc);

    // Number badge
    box(d, ML+5, y+5, 9, 9, C.card2, 1.5);
    tx(d, String(i+1), ML+9.5, y+11.5, tc, 7, true, 'center');

    // Cities
    tx(d, sCity, ML+17, y+8, C.white, 9.5, true);
    const sCityW = Math.min(sCity.length * 4.8, 40);
    tx(d, '->', ML+17+sCityW+1, y+8, C.tan, 8, true);
    tx(d, eCity, ML+17+sCityW+10, y+8, C.white, 9.5, true);

    // Meta row
    tx(d, `${Math.round(seg.distance_km||0)} km`, ML+17, y+16, C.gold, 7.5, true);
    tx(d, `|`, ML+17+22, y+16, C.border, 7);
    tx(d, fmtTime(seg.travel_time_min), ML+17+26, y+16, C.cream, 7.5, true);
    tx(d, `|`, ML+17+26+18, y+16, C.border, 7);
    tx(d, `${seg.avg_speed||62} km/h avg`, ML+17+26+22, y+16, C.muted, 7);

    // Risk + traffic badges
    box(d, W-MR-56, y+5, 26, 8, tc.map(v=>Math.max(0,v-130)), 1.5);
    tx(d, tl, W-MR-43, y+10.5, tc, 6, true, 'center');
    box(d, W-MR-28, y+5, 26, 8, riskBg(segRisk), 1.5);
    tx(d, `RISK ${segRisk}/10`, W-MR-15, y+10.5, segRc, 6, true, 'center');

    // POI counts
    tx(d, `Fuel: ${seg.fuel_stops||0}   Food: ${seg.restaurants||0}   Hospitals: ${seg.hospitals||0}`,
       W-MR-56, y+17, C.muted, 6);

    y += sh + 3;
  });

  // ── WEATHER ───────────────────────────────────────────────────────────────
  if (weather.length > 0 && y < 228) {
    y += 2;
    y = sLabel(d, 'WEATHER FORECAST', y);

    const wCount = Math.min(weather.length, 5);
    const ww = (CW - (wCount-1)*2) / wCount;

    weather.slice(0, wCount).forEach((w, i) => {
      if (y + 36 > H - 14) return;
      const wx = ML + i*(ww+2);
      const rainPct = w.precipitation_probability ?? 0;
      const wind    = w.windspeed ?? 0;
      const cond    = rainPct > 60 ? 'RAINY' : rainPct > 30 ? 'CLOUDY' : wind > 40 ? 'WINDY' : 'CLEAR';
      const condC   = rainPct > 60 ? C.blue : rainPct > 30 ? C.muted : C.gold;

      box(d, wx, y, ww, 34, C.card, 2);
      box(d, wx, y, ww, 11, C.card2, 2);
      box(d, wx, y+9, ww, 2, C.card2);
      tx(d, (w.city||'').toUpperCase(), wx+ww/2, y+9, C.tan, 6.5, true, 'center');
      tx(d, cond, wx+ww/2, y+18, condC, 7.5, true, 'center');
      tx(d, `${w.temperature??'—'}C`, wx+ww/2, y+25, C.white, 9, true, 'center');
      tx(d, `Rain ${rainPct}%`, wx+ww/2, y+31, C.muted, 6, false, 'center');
      tx(d, `Wind ${wind} km/h`, wx+ww/2, y+36, C.muted, 6, false, 'center');
    });
  }

  footer(d, 1, 2, src, dst);
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAGE 2  —  Safety, Emergency Contacts, Checklist
// ═══════════════════════════════════════════════════════════════════════════
function page2(d, D) {
  const { src, dst, fd, risk, segments, route } = D;

  box(d, 0, 0, W, H, C.bg);

  // ── HEADER ────────────────────────────────────────────────────────────────
  box(d, 0, 0, W, 22, C.card);
  box(d, 0, 19, W, 3, C.tan);
  tx(d, 'SAFETY, CONTACTS & CHECKLIST', ML, 14, C.white, 12, true);
  tx(d, `${src}  to  ${dst}`, W-MR, 14, C.muted, 7.5, false, 'right');

  let y = 30;

  // ── RISK BANNER ───────────────────────────────────────────────────────────
  const rc  = riskC(risk);
  box(d, ML, y, CW, 22, riskBg(risk), 2);
  box(d, ML, y, 4, 22, rc);
  tx(d, 'OVERALL ROUTE RISK', ML+8, y+8, rc, 7, true);
  tx(d, `${risk}/10  —  ${(riskLabel(risk)||'Moderate').toUpperCase()}`, ML+8, y+18, rc, 13, true);
  const barX = ML+88, barW = CW-92;
  box(d, barX, y+8, barW, 5, C.border, 1);
  box(d, barX, y+8, barW*(risk/10), 5, rc, 1);
  tx(d, '1', barX, y+18, C.muted, 6);
  tx(d, '5', barX+barW/2, y+18, C.muted, 6, false, 'center');
  tx(d, '10', barX+barW, y+18, C.muted, 6, false, 'right');
  y += 30;

  // ── EMERGENCY CONTACTS ───────────────────────────────────────────────────
  y = sLabel(d, 'EMERGENCY CONTACTS', y);

  const orderedCities = route?.ordered_cities || [src, dst];
  let contacts = [];
  try { contacts = getEmergencyContacts(orderedCities) || []; } catch(_) {}

  // Always ensure at least 2 contact groups
  if (!contacts.length) {
    contacts = [
      { state:'Tamil Nadu', items:[
        { label:'Highway Helpline', number:'1033' },
        { label:'Police',           number:'100'  },
        { label:'Ambulance',        number:'108'  },
        { label:'Fire',             number:'101'  },
      ]},
      { state:'Karnataka', items:[
        { label:'Highway Helpline', number:'1033' },
        { label:'Police',           number:'100'  },
        { label:'Ambulance',        number:'108'  },
        { label:'Fire',             number:'101'  },
      ]},
    ];
  }

  const cols  = Math.min(contacts.length, 3);
  const cw3   = (CW - (cols-1)*3) / cols;
  let maxCardH = 0;

  contacts.slice(0,3).forEach((grp, i) => {
    const gx    = ML + i*(cw3+3);
    const items = Array.isArray(grp.items) ? grp.items : [];
    const gh    = 14 + items.length * 11 + 3;
    maxCardH    = Math.max(maxCardH, gh);

    box(d, gx, y, cw3, gh, C.card, 2);
    box(d, gx, y, cw3, 11, C.card2, 2);
    box(d, gx, y+9,  cw3, 2, C.card2);
    // State name in tan
    tx(d, (grp.state||'Emergency').toUpperCase(), gx+cw3/2, y+9.5, C.tan, 7, true, 'center');

    let iy = y+19;
    items.forEach(({ label, number }) => {
      tx(d, String(label||''), gx+5, iy, C.muted, 7.5);
      tx(d, String(number||''), gx+cw3-5, iy, C.white, 9, true, 'right');
      ln(d, gx+4, iy+2, gx+cw3-4, iy+2, C.border, 0.2);
      iy += 11;
    });
  });
  y += maxCardH + 8;

  // ── DRIVING TIPS ─────────────────────────────────────────────────────────
  y = sLabel(d, 'ROUTE DRIVING TIPS', y);

  const tipCols = ['LEFT', 'RIGHT'];
  const tips = [
    'Stay hydrated — carry at least 2L of water per person',
    'Refuel when tank hits 1/4 — stations may be sparse',
    'Check tyre pressure at every major fuel stop',
    'Avoid overtaking on ghat sections — blind curves ahead',
    'Switch on headlights in forest/tunnel zones even in daytime',
    'Keep emergency numbers saved offline on your phone',
  ];

  const tipW = (CW-3)/2;
  tips.forEach((tip, i) => {
    const tx2 = ML + (i%2)*(tipW+3);
    const ty  = y + Math.floor(i/2)*10;
    if (ty > H - 55) return;
    box(d, tx2, ty, tipW, 8.5, C.card, 1.5);
    box(d, tx2, ty, 2.5, 8.5, C.tanD);
    tx(d, tip, tx2+5, ty+6, C.cream, 6.5);
  });
  y += Math.ceil(tips.length/2)*10 + 6;

  // ── PRE-DEPARTURE CHECKLIST ───────────────────────────────────────────────
  if (y < H - 70) {
    y = sLabel(d, 'PRE-DEPARTURE CHECKLIST', y);

    let rawList = [];
    try { rawList = buildChecklist(segments) || []; } catch(_) {}

    const checklist = rawList.length > 0
      ? rawList.map(item =>
          typeof item === 'string' ? item
          : String(item.text || item.label || item.item || item.task || Object.values(item)[0] || ''))
      : [
          'Tyre pressure checked — including spare',
          'Fuel tank full before departure',
          'Engine oil and coolant levels normal',
          'Offline maps downloaded for route',
          'Driving licence and RC book in car',
          'Vehicle insurance documents packed',
          'First aid kit and medicines ready',
          'Emergency contacts saved on all phones',
          'Itinerary shared with someone at home',
          'Water and snacks packed for journey',
          'Phone charger and power bank charged',
          'Weather forecast checked for route',
        ];

    const half = Math.ceil(checklist.length / 2);
    const col1 = checklist.slice(0, half);
    const col2 = checklist.slice(half);
    const cW2  = CW/2 - 2;
    const iH   = 10;

    [col1, col2].forEach((col, ci) => {
      const cx = ML + ci*(cW2+4);
      col.forEach((item, ii) => {
        const iy = y + ii*iH;
        if (iy + iH > H - 22) return;
        box(d, cx, iy, cW2, iH-1.5, C.card, 1.5);
        // Checkbox
        sd(d, C.tanD); d.setLineWidth(0.4);
        d.roundedRect(cx+3, iy+2.5, 4.5, 4.5, 0.8, 0.8, 'S');
        tx(d, String(item), cx+10, iy+7, C.cream, 6.5);
      });
    });
  }

  // ── SIGN OFF ─────────────────────────────────────────────────────────────
  const signY = H - 22;
  box(d, ML, signY, CW, 15, C.card2, 2);
  box(d, ML, signY, CW, 3, C.tan);
  tx(d, 'Have a safe and wonderful journey!', W/2, signY+10, C.gold, 11, true, 'center');
  tx(d,
    `${src}  to  ${dst}  |  ${fd?.startDate||''}  |  ${fd?.people||1} traveller${Number(fd?.people||1)>1?'s':''}`,
    W/2, signY+17, C.muted, 6.5, false, 'center');

  footer(d, 2, 2, src, dst);
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════
export async function generateItinerary({ tripData, formData: fd, realPOIs }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const route    = tripData?.route    || {};
  const segments = tripData?.segments || [];
  const weather  = tripData?.weather  || [];
  const summary  = tripData?.summary  || {};

  const src = fd?.source      || route?.ordered_cities?.[0]             || 'Source';
  const dst = fd?.destination || route?.ordered_cities?.slice(-1)?.[0]  || 'Destination';
  const pax = Math.max(1, Number(fd?.people || 1));

  const totalDist = Number(route.total_distance_km)
    || segments.reduce((s, sg) => s + Number(sg.distance_km||0), 0) || 0;

  const totalTime = Number(summary.total_trip_time_min || route.total_time_min)
    || segments.reduce((s, sg) => s + Number(sg.travel_time_min||0), 0) || 0;

  // Read saved prefs
  let mileage = 15, fuelPrice = 103, vehicle = 'car';
  try {
    const uid   = JSON.parse(localStorage.getItem('user') || '{}').id;
    const prefs = JSON.parse(localStorage.getItem(uid ? `userPrefs_${uid}` : 'userPrefs') || '{}');
    mileage   = Number(prefs.mileage)   || 15;
    vehicle   = (prefs.vehicleType || 'Car').toLowerCase();
    fuelPrice = FP[prefs.fuelType] || 103;
  } catch (_) {}

  // calcFuelCost returns { cost, litres } — destructure properly
  const fuelResult  = calcFuelCost(totalDist, mileage, fuelPrice);
  const fuelCost    = typeof fuelResult === 'object' ? (fuelResult.cost   || 0) : (fuelResult || 0);
  const fuelLitres  = typeof fuelResult === 'object' ? (fuelResult.litres || totalDist/mileage) : (totalDist/mileage);

  const toll   = estimateToll(totalDist, vehicle);
  const carbon = calcCarbon(totalDist, vehicle);

  const risk = segments.length > 0
    ? Math.round(segments.reduce((a, s) => a + riskScore(s.traffic_level, s.weather_risk), 0) / segments.length)
    : 3;

  const D = {
    src, dst, fd, route, segments, weather, summary,
    totalDist, totalTime,
    fuelCost, fuelLitres, toll, carbon,
    fuelPrice, vehicle, mileage, pax, risk,
  };

  page1(doc, D);
  doc.addPage();
  page2(doc, D);

  doc.save(`Itinerary_${src}_to_${dst}_${fd?.startDate || 'trip'}.pdf`);
}