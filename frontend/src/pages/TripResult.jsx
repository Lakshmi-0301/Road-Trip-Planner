import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { planTrip } from '../api/tripApi';
import styles from './TripResult.module.css';

// ── Fix Leaflet's broken default icon path in Vite ──────────────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Custom map markers ───────────────────────────────────────────────────────
const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};
      border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const SOURCE_ICON = makeIcon('#aa9371');
const DEST_ICON   = makeIcon('#6dbf8a');
const MID_ICON    = makeIcon('#d6c6ac');

// ── Helper: auto-fit map to polyline ────────────────────────────────────────
function MapFitter({ polyline }) {
  const map = useMap();
  useEffect(() => {
    if (polyline && polyline.length > 1) {
      const bounds = L.latLngBounds(polyline.map(([lat, lon]) => [lat, lon]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, polyline]);
  return null;
}

// ── Time formatter ───────────────────────────────────────────────────────────
function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

// ── Icon SVGs ────────────────────────────────────────────────────────────────
const Icons = {
  Back: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Clock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Route: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  Users: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Fuel: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9"/><path d="M5 22V10h8v12"/><path d="M17 14v-3a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  Restaurant: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  ),
  Hospital: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>
    </svg>
  ),
  Thermometer: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  Rain: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
    </svg>
  ),
  Wind: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function TripResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state?.formData;

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchTrip = useCallback(async () => {
    if (!formData) {
      navigate('/dashboard');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await planTrip({
        source:      formData.source,
        destination: formData.destination,
        date:        formData.startDate,
        passengers:  formData.people,
      });
      setTripData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formData, navigate]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Planning your route...</p>
        <p className={styles.loadingHint}>Fetching route data, stops &amp; weather</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorIcon}><Icons.AlertCircle /></div>
        <h2 className={styles.errorTitle}>Could not plan trip</h2>
        <p className={styles.errorMsg}>{error}</p>
        <div className={styles.errorActions}>
          <button className={styles.retryBtn} onClick={fetchTrip}>Try again</button>
          <button className={styles.backBtnError} onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        </div>
      </div>
    );
  }

  if (!tripData) return null;

  const { route, segments, summary, weather } = tripData;
  const polylineCoords = (route.polyline || []).map(([lat, lon]) => [lat, lon]);

  // Center for initial map view
  const centerCity = route.cities?.[Math.floor(route.cities.length / 2)] ?? route.cities?.[0];
  const mapCenter  = centerCity ? [centerCity.lat, centerCity.lon] : [12.97, 77.59];

  return (
    <div className={styles.page}>
      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
          <Icons.Back /> Dashboard
        </button>
        <div className={styles.routeHeading}>
          <span className={styles.cityName}>{route.source}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
          <span className={styles.cityName}>{route.destination}</span>
        </div>
        <div className={styles.dateChip}>{formData?.startDate}</div>
      </header>

      {/* ── Split Layout ─────────────────────────────────────────────── */}
      <div className={styles.splitLayout}>

        {/* LEFT — Map */}
        <div className={styles.mapPane}>
          <MapContainer
            center={mapCenter}
            zoom={7}
            className={styles.leafletMap}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {polylineCoords.length > 1 && (
              <>
                <Polyline
                  positions={polylineCoords}
                  pathOptions={{ color: '#aa9371', weight: 4, opacity: 0.9 }}
                />
                <MapFitter polyline={polylineCoords} />
              </>
            )}
            {route.cities?.map((city) => (
              <Marker
                key={city.name}
                position={[city.lat, city.lon]}
                icon={
                  city.role === 'source'
                    ? SOURCE_ICON
                    : city.role === 'destination'
                    ? DEST_ICON
                    : MID_ICON
                }
              >
                <Tooltip direction="top" offset={[0, -8]} permanent={city.role !== 'intermediate'}>
                  <span className={styles.tooltipLabel}>{city.name}</span>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className={styles.mapLegend}>
            <span className={styles.legendItem}>
              <span className={styles.dot} style={{ background: '#aa9371' }} /> Source
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dot} style={{ background: '#6dbf8a' }} /> Destination
            </span>
            <span className={styles.legendItem}>
              <span className={styles.dot} style={{ background: '#d6c6ac' }} /> Stop
            </span>
          </div>
        </div>

        {/* RIGHT — Details panel */}
        <div className={styles.detailPane}>
          <div className={styles.detailScroll}>

            {/* ── Route Summary ─────────────────────────────────── */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Icons.Route /> Route Info
              </h2>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Distance</span>
                  <span className={styles.summaryValue}>{route.total_distance_km} km</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Passengers</span>
                  <span className={styles.summaryValue}>
                    <Icons.Users /> {summary.passengers}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Travel Date</span>
                  <span className={styles.summaryValue}>{summary.date}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Segments</span>
                  <span className={styles.summaryValue}>{segments.length}</span>
                </div>
              </div>
            </section>

            {/* ── Time Breakdown ────────────────────────────────── */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Icons.Clock /> Time Breakdown
              </h2>
              <div className={styles.timeList}>
                <div className={styles.timeRow}>
                  <span className={styles.timeLabel}>Drive time</span>
                  <span className={styles.timeValue}>{formatMinutes(summary.travel_time_min)}</span>
                </div>
                <div className={styles.timeRow}>
                  <span className={styles.timeLabel}>Stop time</span>
                  <span className={styles.timeValue}>{formatMinutes(summary.stop_time_min)}</span>
                </div>
                <div className={`${styles.timeRow} ${styles.timeRowTotal}`}>
                  <span className={styles.timeLabel}>Total trip time</span>
                  <span className={styles.timeValueAccent}>{formatMinutes(summary.total_trip_time_min)}</span>
                </div>
              </div>
            </section>

            {/* ── Route Segments ────────────────────────────────── */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Icons.MapPin /> Route Segments
              </h2>
              <div className={styles.segmentList}>
                {segments.map((seg, idx) => (
                  <div key={idx} className={styles.segment}>
                    <div className={styles.segmentHeader}>
                      <span className={styles.segmentRoute}>
                        {seg.start} <span className={styles.arrow}>→</span> {seg.end}
                      </span>
                      <span className={styles.segmentDist}>{seg.distance_km} km</span>
                    </div>
                    <div className={styles.segmentMeta}>
                      <span>{formatMinutes(seg.travel_time_min)}</span>
                      <span>{seg.avg_speed_kmh} km/h</span>
                      <span
                        className={
                          seg.traffic_level === 'HIGH'
                            ? styles.tagDanger
                            : seg.traffic_level === 'MODERATE'
                            ? styles.tagWarn
                            : styles.tagOk
                        }
                      >
                        {seg.traffic_level}
                      </span>
                    </div>
                    <div className={styles.stopRow}>
                      <span className={styles.stopChip}>
                        <Icons.Fuel /> {seg.stops.fuel} fuel
                      </span>
                      <span className={styles.stopChip}>
                        <Icons.Restaurant /> {seg.stops.restaurants} restaurants
                      </span>
                      {seg.stops.hospitals > 0 && (
                        <span className={styles.stopChipHosp}>
                          <Icons.Hospital /> {seg.stops.hospitals} hospitals
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Weather ───────────────────────────────────────── */}
            {weather && weather.length > 0 && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <Icons.Thermometer /> Weather on {summary.date}
                </h2>
                <div className={styles.weatherGrid}>
                  {weather.map((w) => (
                    <div key={w.city} className={styles.weatherCard}>
                      <p className={styles.weatherCity}>{w.city}</p>
                      <div className={styles.weatherStats}>
                        <span className={styles.weatherStat}>
                          <Icons.Thermometer />
                          {w.temperature}&deg;C
                        </span>
                        <span className={styles.weatherStat}>
                          <Icons.Rain />
                          {w.precipitation_probability}%
                        </span>
                        <span className={styles.weatherStat}>
                          <Icons.Wind />
                          {w.windspeed} km/h
                        </span>
                      </div>
                      {w.note && <p className={styles.weatherNote}>{w.note}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
