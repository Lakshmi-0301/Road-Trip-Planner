import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1600 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      let start = null;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.floor(ease * to));
        if (p < 1) requestAnimationFrame(step); else setVal(to);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── SVG Illustrations for route cards ────────────────────────────────────────
const Illustrations = {
  city: () => (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIllustration}>
      <rect width="200" height="120" fill="#0a0f1a"/>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1a2e"/>
          <stop offset="100%" stopColor="#1a2a1a"/>
        </linearGradient>
        <linearGradient id="bldg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e2836"/>
          <stop offset="100%" stopColor="#111820"/>
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sky1)"/>
      {/* Stars */}
      {[[20,15],[45,8],[80,20],[120,10],[155,18],[175,8]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#e8e0d5" opacity={0.4 + (i%3)*0.2}/>
      ))}
      {/* Moon */}
      <circle cx="170" cy="20" r="8" fill="#e8dcc8" opacity="0.8"/>
      <circle cx="174" cy="17" r="6" fill="#0d1a2e" opacity="0.9"/>
      {/* Buildings back */}
      <rect x="0" y="55" width="25" height="65" fill="#162030" rx="1"/>
      <rect x="5" y="40" width="15" height="80" fill="#1a2640" rx="1"/>
      <rect x="28" y="48" width="20" height="72" fill="#162030" rx="1"/>
      <rect x="55" y="35" width="18" height="85" fill="#1e2e44" rx="1"/>
      <rect x="80" y="50" width="22" height="70" fill="#162030" rx="1"/>
      <rect x="110" y="38" width="16" height="82" fill="#1a2640" rx="1"/>
      <rect x="135" y="52" width="24" height="68" fill="#162030" rx="1"/>
      <rect x="165" y="44" width="18" height="76" fill="#1e2e44" rx="1"/>
      {/* Windows */}
      {[[8,45],[8,55],[8,65],[15,45],[15,55],[32,52],[32,62],[60,40],[60,50],[60,60],[83,55],[83,65],[113,42],[113,52],[138,57],[138,67],[168,48],[168,58]].map(([x,y],i) => (
        <rect key={i} x={x} y={y} width="4" height="5" fill="#e09a4a" opacity={0.3 + (i%4)*0.15} rx="0.5"/>
      ))}
      {/* Road */}
      <rect x="0" y="100" width="200" height="20" fill="#0e1218"/>
      <rect x="0" y="98" width="200" height="3" fill="#1a2030"/>
      {/* Road markings */}
      {[0,40,80,120,160].map(x => (
        <rect key={x} x={x+5} y="108" width="28" height="2" fill="#aa9371" opacity="0.4" rx="1"/>
      ))}
      {/* Car */}
      <rect x="70" y="101" width="30" height="12" fill="#aa9371" rx="2"/>
      <rect x="74" y="95" width="18" height="9" fill="#c4aa86" rx="2"/>
      <circle cx="77" cy="114" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="1"/>
      <circle cx="93" cy="114" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="1"/>
      <rect x="100" y="104" width="5" height="3" fill="#fff8c0" opacity="0.8" rx="0.5"/>
    </svg>
  ),

  coastal: () => (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIllustration}>
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2240"/>
          <stop offset="100%" stopColor="#061528"/>
        </linearGradient>
        <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1e35"/>
          <stop offset="100%" stopColor="#1a3040"/>
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sky2)"/>
      {/* Stars */}
      {[[15,12],[50,6],[90,14],[140,8],[170,15]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#e8e0d5" opacity="0.5"/>
      ))}
      {/* Moon reflection */}
      <circle cx="160" cy="22" r="10" fill="#e8dcc8" opacity="0.7"/>
      <circle cx="164" cy="19" r="7.5" fill="#0d1e35" opacity="0.9"/>
      {/* Hills */}
      <ellipse cx="30" cy="85" rx="45" ry="30" fill="#122010"/>
      <ellipse cx="170" cy="88" rx="40" ry="25" fill="#0e1a0e"/>
      {/* Palm trees */}
      <rect x="28" y="55" width="2.5" height="32" fill="#2a1a0a" rx="1"/>
      <ellipse cx="25" cy="52" rx="12" ry="6" fill="#1e3a10" transform="rotate(-20 25 52)"/>
      <ellipse cx="32" cy="50" rx="13" ry="5" fill="#1a3a0c" transform="rotate(15 32 50)"/>
      <ellipse cx="29" cy="48" rx="10" ry="4" fill="#224a14" transform="rotate(-5 29 48)"/>
      <rect x="158" y="58" width="2.5" height="30" fill="#2a1a0a" rx="1"/>
      <ellipse cx="155" cy="55" rx="11" ry="5" fill="#1e3a10" transform="rotate(-15 155 55)"/>
      <ellipse cx="162" cy="53" rx="12" ry="4.5" fill="#1a3a0c" transform="rotate(20 162 53)"/>
      {/* Sea */}
      <rect x="0" y="88" width="200" height="32" fill="url(#sea)"/>
      {/* Waves */}
      <path d="M0 92 Q25 88 50 92 Q75 96 100 92 Q125 88 150 92 Q175 96 200 92" stroke="#5bc4c4" strokeWidth="1" fill="none" opacity="0.3"/>
      <path d="M0 97 Q30 94 60 97 Q90 100 120 97 Q150 94 180 97 Q195 99 200 97" stroke="#5bc4c4" strokeWidth="0.8" fill="none" opacity="0.2"/>
      {/* Road along coast */}
      <rect x="0" y="83" width="200" height="8" fill="#0e1218" opacity="0.9"/>
      {[0,35,70,110,150].map(x => (
        <rect key={x} x={x+4} y="86" width="22" height="1.5" fill="#aa9371" opacity="0.35" rx="1"/>
      ))}
      {/* Lighthouse */}
      <rect x="95" y="62" width="10" height="26" fill="#1e2e3e" rx="1"/>
      <polygon points="95,62 105,62 100,54" fill="#2a3a4a"/>
      <circle cx="100" cy="60" r="3" fill="#e09a4a" opacity="0.8"/>
      <rect x="93" y="86" width="14" height="4" fill="#162030" rx="1"/>
    </svg>
  ),

  heritage: () => (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIllustration}>
      <defs>
        <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0e0a"/>
          <stop offset="100%" stopColor="#2a1a10"/>
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sky3)"/>
      {[[20,10],[55,6],[100,14],[145,8],[175,12]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#e8dcc8" opacity="0.4"/>
      ))}
      {/* Palace/temple */}
      <rect x="60" y="55" width="80" height="55" fill="#2a1e14" rx="1"/>
      <rect x="55" y="50" width="90" height="10" fill="#3a2a1a" rx="1"/>
      {/* Arches */}
      {[68,88,108,128].map((x,i) => (
        <g key={i}>
          <rect x={x} y="75" width="12" height="20" fill="#1a1208" rx="1"/>
          <ellipse cx={x+6} cy="76" rx="6" ry="5" fill="#1a1208"/>
          <ellipse cx={x+6} cy="76" rx="4" ry="3.5" fill="#2a1e14"/>
        </g>
      ))}
      {/* Towers */}
      <rect x="58" y="30" width="18" height="30" fill="#3a2a1a" rx="1"/>
      <polygon points="58,30 76,30 67,18" fill="#4a3a24"/>
      <circle cx="67" cy="16" r="2.5" fill="#e09a4a" opacity="0.7"/>
      <rect x="124" y="30" width="18" height="30" fill="#3a2a1a" rx="1"/>
      <polygon points="124,30 142,30 133,18" fill="#4a3a24"/>
      <circle cx="133" cy="16" r="2.5" fill="#e09a4a" opacity="0.7"/>
      {/* Center dome */}
      <rect x="88" y="38" width="24" height="22" fill="#3a2a1a"/>
      <ellipse cx="100" cy="38" rx="12" ry="10" fill="#4a3a24"/>
      <rect x="97" y="25" width="6" height="15" fill="#3a2a1a"/>
      <circle cx="100" cy="23" r="3" fill="#e09a4a" opacity="0.8"/>
      {/* Gardens */}
      <rect x="0" y="100" width="200" height="20" fill="#0e1a0a"/>
      {[10,30,50,150,170,190].map((x,i) => (
        <g key={i}>
          <rect x={x} y="88" width="2" height="14" fill="#1e2e14"/>
          <ellipse cx={x+1} cy="86" rx="5" ry="8" fill="#1a2a10"/>
        </g>
      ))}
      {/* Path */}
      <rect x="85" y="100" width="30" height="20" fill="#1a1408" opacity="0.6"/>
      {/* Lamp posts */}
      {[75,125].map((x,i) => (
        <g key={i}>
          <rect x={x} y="88" width="1.5" height="14" fill="#2a2018"/>
          <circle cx={x+0.75} cy="87" r="2" fill="#e09a4a" opacity="0.6"/>
        </g>
      ))}
    </svg>
  ),

  beach: () => (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIllustration}>
      <defs>
        <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1e30"/>
          <stop offset="100%" stopColor="#183040"/>
        </linearGradient>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2010"/>
          <stop offset="100%" stopColor="#1a1608"/>
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sky4)"/>
      {[[10,10],[35,5],[70,12],[130,7],[165,13],[185,5]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1" fill="#e8e0d5" opacity="0.45"/>
      ))}
      {/* Milky way-ish streak */}
      <path d="M0 30 Q100 20 200 35" stroke="#e8e0d5" strokeWidth="0.5" opacity="0.06"/>
      {/* Ocean */}
      <rect x="0" y="72" width="200" height="48" fill="#061528"/>
      <path d="M0 75 Q20 71 40 75 Q60 79 80 75 Q100 71 120 75 Q140 79 160 75 Q180 71 200 75" stroke="#5bc4c4" strokeWidth="1.2" fill="none" opacity="0.4"/>
      <path d="M0 82 Q25 79 50 82 Q75 85 100 82 Q125 79 150 82 Q175 85 200 82" stroke="#5bc4c4" strokeWidth="0.8" fill="none" opacity="0.25"/>
      {/* Moon on water */}
      <path d="M90 72 L110 72" stroke="#e8dcc8" strokeWidth="0.5" opacity="0.3"/>
      <circle cx="150" cy="18" r="9" fill="#e8dcc8" opacity="0.75"/>
      <circle cx="154" cy="15" r="7" fill="#0a1e30" opacity="0.9"/>
      {/* Sand */}
      <rect x="0" y="86" width="200" height="34" fill="url(#sand)"/>
      {/* Waves on sand */}
      <path d="M0 88 Q40 84 80 88 Q120 92 160 88 Q185 85 200 88" fill="#0a1e30" opacity="0.5"/>
      {/* Parasols */}
      <line x1="40" y1="78" x2="40" y2="95" stroke="#4a3020" strokeWidth="1.5"/>
      <ellipse cx="40" cy="77" rx="16" ry="5" fill="#aa4040" opacity="0.8"/>
      <line x1="80" y1="80" x2="80" y2="95" stroke="#4a3020" strokeWidth="1.5"/>
      <ellipse cx="80" cy="79" rx="14" ry="4.5" fill="#aa9371" opacity="0.8"/>
      <line x1="155" y1="79" x2="155" y2="95" stroke="#4a3020" strokeWidth="1.5"/>
      <ellipse cx="155" cy="78" rx="15" ry="5" fill="#4a6a8a" opacity="0.8"/>
      {/* Boat silhouette */}
      <path d="M100 65 L130 65 L125 70 L105 70 Z" fill="#1a2a3a"/>
      <line x1="115" y1="50" x2="115" y2="65" stroke="#1a2a3a" strokeWidth="1"/>
      <path d="M115 50 L130 58 L115 58 Z" fill="#2a3a4a" opacity="0.7"/>
      {/* Road */}
      <rect x="0" y="93" width="200" height="6" fill="#0e1010" opacity="0.8"/>
    </svg>
  ),

  highway: () => (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIllustration}>
      <defs>
        <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#08100a"/>
          <stop offset="100%" stopColor="#101a10"/>
        </linearGradient>
        <linearGradient id="road5" x1="0" y1="1" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#0a0e10"/>
          <stop offset="100%" stopColor="#141820"/>
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sky5)"/>
      {/* Stars */}
      {[[12,8],[40,15],[75,5],[110,18],[148,9],[178,14]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1" fill="#e8e0d5" opacity="0.35"/>
      ))}
      {/* Rolling hills */}
      <ellipse cx="50" cy="95" rx="80" ry="35" fill="#0c180c"/>
      <ellipse cx="160" cy="98" rx="70" ry="30" fill="#0a140a"/>
      <ellipse cx="100" cy="88" rx="100" ry="20" fill="#0e1a0e"/>
      {/* Highway perspective */}
      <polygon points="100,45 60,120 140,120" fill="url(#road5)"/>
      <polygon points="100,45 80,120 120,120" fill="#0c1014" opacity="0.5"/>
      {/* Lane markings perspective */}
      {[[48,58,6],[45,68,8],[42,80,10],[38,95,13]].map(([y,w,h],i)=>(
        <rect key={i} x={100-w/2} y={y} width={w} height={h/4} fill="#aa9371" opacity="0.4" rx="0.5"/>
      ))}
      {/* Guard rails */}
      <line x1="70" y1="80" x2="60" y2="120" stroke="#2a3a2a" strokeWidth="1.5"/>
      <line x1="130" y1="80" x2="140" y2="120" stroke="#2a3a2a" strokeWidth="1.5"/>
      {/* Vehicles with headlights */}
      <rect x="87" y="95" width="28" height="14" fill="#1a2a1a" rx="1"/>
      <rect x="90" y="91" width="18" height="9" fill="#243424" rx="1"/>
      <rect x="113" y="97" width="4" height="4" fill="#fff8c0" opacity="0.9" rx="0.5"/>
      <rect x="83" y="97" width="4" height="4" fill="#fff8c0" opacity="0.3" rx="0.5"/>
      {/* Distant truck */}
      <rect x="94" y="65" width="12" height="7" fill="#1a2020" rx="0.5"/>
      <rect x="94" y="62" width="5" height="5" fill="#1a2020" rx="0.5"/>
      <rect x="104" y="67" width="2" height="2" fill="#fff8c0" opacity="0.6"/>
      {/* Trees lining road */}
      {[[55,75],[45,90],[150,78],[158,92]].map(([x,y],i)=>(
        <g key={i}>
          <rect x={x} y={y} width="2" height={120-y} fill="#1a2a10"/>
          <ellipse cx={x+1} cy={y-1} rx="5" ry="8" fill="#162210"/>
        </g>
      ))}
    </svg>
  ),

  ghats: () => (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.cardIllustration}>
      <defs>
        <linearGradient id="sky6" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060e0a"/>
          <stop offset="100%" stopColor="#0a1a0e"/>
        </linearGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a1a" stopOpacity="0"/>
          <stop offset="100%" stopColor="#1a2a1a" stopOpacity="0.6"/>
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sky6)"/>
      {[[8,8],[30,14],[60,6],[100,12],[145,7],[175,15]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1" fill="#e8e0d5" opacity="0.3"/>
      ))}
      {/* Mountains layered */}
      <polygon points="0,80 40,20 80,70 0,70" fill="#0a1a0a"/>
      <polygon points="30,80 80,15 130,65 30,65" fill="#0c1e0c"/>
      <polygon points="80,80 140,10 200,60 80,60" fill="#0e220e"/>
      <polygon points="120,80 180,25 200,55 120,55" fill="#102610"/>
      {/* Mist layer */}
      <rect x="0" y="55" width="200" height="30" fill="url(#mist)"/>
      {/* Dense forest */}
      <rect x="0" y="68" width="200" height="52" fill="#0a1a08"/>
      {/* Individual trees silhouette */}
      {[0,8,16,24,32,40,52,64,76,88,100,112,124,136,148,160,172,184,196].map((x,i)=>(
        <g key={i}>
          <rect x={x} y={60+(i%3)*4} width="2" height="60" fill="#0e1e0c"/>
          <ellipse cx={x+1} cy={58+(i%3)*4} rx={4+(i%2)*2} ry={10+(i%3)*3} fill="#081608"/>
        </g>
      ))}
      {/* Winding road */}
      <path d="M20 120 Q40 100 60 90 Q80 80 100 85 Q120 90 140 82 Q160 74 180 78 Q190 80 200 78" stroke="#1a2010" strokeWidth="6" fill="none"/>
      <path d="M20 120 Q40 100 60 90 Q80 80 100 85 Q120 90 140 82 Q160 74 180 78 Q190 80 200 78" stroke="#242c18" strokeWidth="4" fill="none"/>
      {/* Road markings */}
      <path d="M20 120 Q40 100 60 90 Q80 80 100 85 Q120 90 140 82 Q160 74 180 78" stroke="#aa9371" strokeWidth="0.8" fill="none" strokeDasharray="8 6" opacity="0.4"/>
      {/* Waterfall */}
      <path d="M50 25 Q52 35 50 45 Q48 55 50 65" stroke="#5bc4c4" strokeWidth="2" fill="none" opacity="0.4"/>
      <path d="M54 28 Q56 38 54 48 Q52 58 54 68" stroke="#5bc4c4" strokeWidth="1" fill="none" opacity="0.25"/>
      {/* Car on road */}
      <rect x="85" y="84" width="16" height="8" fill="#aa9371" rx="1"/>
      <rect x="87" y="81" width="10" height="5" fill="#c4aa86" rx="1"/>
      <circle cx="88" cy="93" r="2.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.5"/>
      <circle cx="99" cy="93" r="2.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.5"/>
    </svg>
  ),
};

// ── Route card data ──────────────────────────────────────────────────────────
const ROUTES = [
  { from: 'Chennai', to: 'Bangalore', km: 290, time: '4h 40m', mood: 'City to City', color: '#aa9371', Illustration: Illustrations.city, tag: 'Popular' },
  { from: 'Kochi', to: 'Coimbatore', km: 142, time: '2h 17m', mood: 'Coastal Hills', color: '#5bc4c4', Illustration: Illustrations.coastal, tag: 'Scenic' },
  { from: 'Bangalore', to: 'Mysore', km: 148, time: '2h 22m', mood: 'Heritage Drive', color: '#e09a4a', Illustration: Illustrations.heritage, tag: 'Must do' },
  { from: 'Chennai', to: 'Puducherry', km: 160, time: '2h 35m', mood: 'Beach Road', color: '#6dbf8a', Illustration: Illustrations.beach, tag: 'Relaxed' },
  { from: 'Hyderabad', to: 'Bangalore', km: 570, time: '8h 30m', mood: 'Long Haul', color: '#9b8ec4', Illustration: Illustrations.highway, tag: 'Epic' },
  { from: 'Coimbatore', to: 'Kochi', km: 142, time: '2h 17m', mood: 'Western Ghats', color: '#6dbf8a', Illustration: Illustrations.ghats, tag: 'Adventure' },
];

// ── Icon components ───────────────────────────────────────────────────────────
const Icons = {
  Map: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Route: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
  Weather: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M16 16l2 2 4-4"/></svg>,
  Pin: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Shield: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Cost: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12m-3-6h6"/></svg>,
  ML: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v10M7 18l5-9 5 9"/></svg>,
  ChevRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ArrowR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>,
};

// ── Animated road strip ───────────────────────────────────────────────────────
function RoadStrip() {
  return (
    <div className={styles.roadStrip} aria-hidden="true">
      <div className={styles.roadSurface}>
        <div className={styles.roadDash}/>
        <div className={styles.roadDash} style={{ animationDelay: '-0.8s' }}/>
      </div>
      {/* Animated car */}
      <div className={styles.stripCarWrap}>
        <div className={styles.stripCar}>
          <div className={styles.stripCarRoof}/>
          <div className={styles.stripCarWin}/>
          <div className={styles.stripCarLight}/>
          <div className={styles.stripCarWheel} style={{ left: 7 }}/>
          <div className={styles.stripCarWheel} style={{ right: 7 }}/>
          <div className={styles.stripCarExhaust}/>
        </div>
      </div>
      {/* Trees */}
      {[5,13,22,32,44,58,72,84,91].map((pct, i) => (
        <div key={i} className={styles.stripTree} style={{ left: `${pct}%`, height: `${20 + (i % 3) * 8}px`, animationDelay: `${i * 0.3}s` }}/>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function Home() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const sliderRef = useRef(null);
  const autoRef = useRef(null);

  const VISIBLE = 3;
  const maxSlide = ROUTES.length - VISIBLE;

  const goTo = useCallback((idx) => {
    setSlide(Math.max(0, Math.min(idx, maxSlide)));
  }, [maxSlide]);

  // Auto-advance
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setSlide(s => s >= maxSlide ? 0 : s + 1);
    }, 3500);
    return () => clearInterval(autoRef.current);
  }, [maxSlide]);

  const resetAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setSlide(s => s >= maxSlide ? 0 : s + 1);
    }, 3500);
  };

  const onDragStart = (e) => {
    setDragging(true);
    setDragStart(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onDragEnd = (e) => {
    if (!dragging) return;
    setDragging(false);
    const end = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = dragStart - end;
    if (Math.abs(diff) > 40) { goTo(slide + (diff > 0 ? 1 : -1)); resetAuto(); }
  };

  return (
    <div className={styles.page}>

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <Icons.Map/>
          <span>Road Trip Planner</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how" className={styles.navLink}>How it works</a>
          <a href="#routes" className={styles.navLink}>Routes</a>
        </div>
        <div className={styles.navActions}>
          <button className={styles.ghostBtn} onClick={() => navigate('/login')}>Sign in</button>
          <button className={styles.fillBtn} onClick={() => navigate('/register')}>Get started</button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden>
          <div className={styles.heroBgGlow1}/>
          <div className={styles.heroBgGlow2}/>
          <div className={styles.heroBgGrid}/>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}/>
            South India · ML-powered routing
          </div>
          <h1 className={styles.heroH1}>
            Every great journey<br/>
            starts with a <span className={styles.heroAccent}>plan.</span>
          </h1>
          <p className={styles.heroSub}>
            Smart routes, live weather, real stops — built for the highways, ghats,
            and coastlines of South India.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.heroPrimary} onClick={() => navigate('/register')}>
              <Icons.Route/>
              Plan your first trip
            </button>
            <button className={styles.heroSecondary} onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>
          <div className={styles.heroMeta}>
            <span><svg width="10" height="10" viewBox="0 0 24 24" fill="#6dbf8a" stroke="none"><circle cx="12" cy="12" r="10"/></svg> Free to use</span>
            <span><svg width="10" height="10" viewBox="0 0 24 24" fill="#6dbf8a" stroke="none"><circle cx="12" cy="12" r="10"/></svg> No signup required to explore</span>
            <span><svg width="10" height="10" viewBox="0 0 24 24" fill="#6dbf8a" stroke="none"><circle cx="12" cy="12" r="10"/></svg> Real-time data</span>
          </div>
        </div>

        {/* Hero right — animated map pin + stats */}
        <div className={styles.heroVisual}>
          <div className={styles.heroMapCard}>
            <div className={styles.heroMapTop}>
              <div className={styles.heroMapDot} style={{ background: '#aa9371' }}/>
              <span className={styles.heroMapCity}>Chennai</span>
              <div className={styles.heroMapLine}/>
              <Icons.ArrowR/>
              <div className={styles.heroMapLine}/>
              <div className={styles.heroMapDot} style={{ background: '#6dbf8a' }}/>
              <span className={styles.heroMapCity}>Bangalore</span>
            </div>
            <div className={styles.heroMapStats}>
              <div className={styles.heroMapStat}><span className={styles.heroMapStatVal}>290</span><span className={styles.heroMapStatLbl}>km</span></div>
              <div className={styles.heroMapStatDiv}/>
              <div className={styles.heroMapStat}><span className={styles.heroMapStatVal}>4h 40m</span><span className={styles.heroMapStatLbl}>duration</span></div>
              <div className={styles.heroMapStatDiv}/>
              <div className={styles.heroMapStat}><span className={styles.heroMapStatVal}>₹2,200</span><span className={styles.heroMapStatLbl}>est. cost</span></div>
            </div>
            <div className={styles.heroMapWeather}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e09a4a" strokeWidth="2" strokeLinecap="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
              <span>32°C · 15% rain · Good conditions</span>
            </div>
            <div className={styles.heroMapSegments}>
              <div className={styles.heroMapSeg} style={{ background: '#6dbf8a' }}/>
              <div className={styles.heroMapSeg} style={{ background: '#6dbf8a' }}/>
              <div className={styles.heroMapSeg} style={{ background: '#e09a4a' }}/>
            </div>
            {/* Floating chips */}
            <div className={styles.floatChip} style={{ top: -14, right: 16, animationDelay: '0s' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#aa9371" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              3 fuel stops
            </div>
            <div className={styles.floatChip} style={{ bottom: -14, left: 16, animationDelay: '0.6s' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6dbf8a" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Risk: Low
            </div>
          </div>
        </div>
      </section>

      {/* ── Animated road ────────────────────────────────────────────── */}
      <RoadStrip/>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        {[
          { val: 7,    suffix: '',  label: 'Cities connected' },
          { val: 42,   suffix: '+', label: 'Routes mapped' },
          { val: 2400, suffix: '+', label: 'Live POIs tracked' },
          { val: 82,   suffix: '%', label: 'ML model accuracy' },
        ].map(s => (
          <div key={s.label} className={styles.statBox}>
            <div className={styles.statNum}><Counter to={s.val} suffix={s.suffix}/></div>
            <div className={styles.statLbl}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.pill}>Features</div>
          <h2 className={styles.sectionTitle}>Everything your trip needs</h2>
          <p className={styles.sectionSub}>From ML-predicted travel times to live weather — planned for real South Indian roads.</p>
        </div>
        <div className={styles.featGrid}>
          {[
            { Icon: Icons.Route,   color: '#aa9371', title: 'ML Route Optimization',    desc: 'RandomForest model trained on real traffic data — not just distance ÷ speed. Predicts your drive time with 82% accuracy.' },
            { Icon: Icons.Weather, color: '#5bc4c4', title: 'Live Weather per City',     desc: 'Real-time Open-Meteo forecasts for every city on your route. Know about rain and wind before you leave.' },
            { Icon: Icons.Pin,     color: '#6dbf8a', title: 'Smart POI Discovery',       desc: 'Fuel, food, hospitals, ATMs — fetched live from OpenStreetMap along your exact route as you zoom in.' },
            { Icon: Icons.Shield,  color: '#e09a4a', title: 'Road Risk Score',            desc: 'Each segment scores 1–10 based on traffic and weather. Get departure time advice that actually helps.' },
            { Icon: Icons.Cost,    color: '#9b8ec4', title: 'Instant Cost Estimate',      desc: 'Fuel cost, toll charges, and per-person split calculated live. Change vehicle type and mileage on the fly.' },
            { Icon: Icons.ML,      color: '#e05c5c', title: 'Spark MLlib Pipeline',       desc: 'Kafka traffic streams → Spark consumer → Cassandra → ML model. Real big-data stack behind every prediction.' },
          ].map(({ Icon, color, title, desc }, i) => (
            <div key={i} className={styles.featCard} style={{ animationDelay: `${i * 0.07}s` }}>
              <div className={styles.featIcon} style={{ background: `${color}14`, color }}>
                <Icon/>
              </div>
              <h3 className={styles.featTitle}>{title}</h3>
              <p className={styles.featDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how" className={styles.howSection}>
        <div className={styles.sectionHead}>
          <div className={styles.pill}>How it works</div>
          <h2 className={styles.sectionTitle}>Three steps to the open road</h2>
        </div>
        <div className={styles.howGrid}>
          {[
            {
              n: '01', title: 'Pick your cities',
              desc: 'Choose source and destination from 7 South Indian cities. We work out the best stops in between.',
              visual: (
                <div className={styles.howVisual}>
                  <div className={styles.howCityPill} style={{ background: 'rgba(170,147,113,.12)', borderColor: 'rgba(170,147,113,.3)', color: '#aa9371' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="#aa9371"><circle cx="12" cy="12" r="10"/></svg>
                    Chennai
                  </div>
                  <div className={styles.howDotLine}>
                    {[0,1,2,3,4].map(i => <div key={i} className={styles.howDot} style={{ animationDelay: `${i*0.15}s` }}/>)}
                  </div>
                  <div className={styles.howCityPill} style={{ background: 'rgba(109,191,138,.1)', borderColor: 'rgba(109,191,138,.28)', color: '#6dbf8a' }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="#6dbf8a"><circle cx="12" cy="12" r="10"/></svg>
                    Bangalore
                  </div>
                </div>
              )
            },
            {
              n: '02', title: 'We build your plan',
              desc: 'ML model + real-time data builds your full route: time, cost, weather, risk, and POIs — in under 3 seconds.',
              visual: (
                <div className={styles.howVisual}>
                  <div className={styles.howBarsWrap}>
                    {[
                      { label: 'Route', w: '100%', color: '#aa9371' },
                      { label: 'Weather', w: '85%', color: '#5bc4c4' },
                      { label: 'Risk', w: '70%', color: '#6dbf8a' },
                      { label: 'POIs', w: '90%', color: '#e09a4a' },
                    ].map((b, i) => (
                      <div key={i} className={styles.howBar}>
                        <span className={styles.howBarLbl}>{b.label}</span>
                        <div className={styles.howBarTrack}>
                          <div className={styles.howBarFill} style={{ width: b.w, background: b.color, animationDelay: `${i * 0.2}s` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              n: '03', title: 'Hit the road',
              desc: 'Follow your plan on the interactive map. Adjust vehicle, check departure advice, save trips for later.',
              visual: (
                <div className={styles.howVisual}>
                  <div className={styles.howMapMini}>
                    <svg viewBox="0 0 120 70" width="100%" fill="none">
                      <rect width="120" height="70" fill="#0e0e0e" rx="6"/>
                      <path d="M10 60 Q30 40 60 35 Q90 30 110 20" stroke="#aa9371" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="10" cy="60" r="4" fill="#aa9371"/>
                      <circle cx="110" cy="20" r="4" fill="#6dbf8a"/>
                      <circle cx="60" cy="35" r="3" fill="#e09a4a"/>
                      <circle cx="55" cy="36" r="5" fill="#aa9371" opacity="0.3">
                        <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                  </div>
                </div>
              )
            },
          ].map((step, i) => (
            <div key={i} className={styles.howCard} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className={styles.howNum}>{step.n}</div>
              {step.visual}
              <h3 className={styles.howTitle}>{step.title}</h3>
              <p className={styles.howDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular Routes slider ─────────────────────────────────────── */}
      <section id="routes" className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.pill}>Popular Routes</div>
          <h2 className={styles.sectionTitle}>Favourite drives across South India</h2>
          <p className={styles.sectionSub}>Drag or use arrows to browse. Click any to start planning.</p>
        </div>

        <div className={styles.sliderWrap}>
          <button className={styles.sliderBtn} onClick={() => { goTo(slide - 1); resetAuto(); }} disabled={slide === 0}>
            <Icons.ChevLeft/>
          </button>

          <div
            ref={sliderRef}
            className={styles.slider}
            onMouseDown={onDragStart}
            onMouseUp={onDragEnd}
            onTouchStart={onDragStart}
            onTouchEnd={onDragEnd}
          >
            <div
              className={styles.sliderTrack}
              style={{ transform: `translateX(calc(-${slide * (100 / VISIBLE)}%))` }}
            >
              {ROUTES.map((r, i) => (
                <div
                  key={i}
                  className={styles.routeCard}
                  onClick={() => navigate('/register')}
                >
                  <div className={styles.routeCardImg}>
                    <r.Illustration/>
                    <div className={styles.routeCardTag} style={{ borderColor: r.color, color: r.color, background: `${r.color}14` }}>
                      {r.tag}
                    </div>
                  </div>
                  <div className={styles.routeCardBody}>
                    <div className={styles.routeCardMood} style={{ color: r.color }}>{r.mood}</div>
                    <div className={styles.routeCardRoute}>
                      <span className={styles.routeCardCity}>{r.from}</span>
                      <div className={styles.routeCardArrow} style={{ background: `${r.color}18`, color: r.color }}>
                        <Icons.ArrowR/>
                      </div>
                      <span className={styles.routeCardCity}>{r.to}</span>
                    </div>
                    <div className={styles.routeCardMeta}>
                      <span>{r.km} km</span>
                      <span className={styles.routeMetaDot}/>
                      <span>{r.time}</span>
                    </div>
                  </div>
                  <div className={styles.routeCardBar} style={{ background: r.color }}/>
                </div>
              ))}
            </div>
          </div>

          <button className={styles.sliderBtn} onClick={() => { goTo(slide + 1); resetAuto(); }} disabled={slide >= maxSlide}>
            <Icons.ChevRight/>
          </button>
        </div>

        {/* Dots */}
        <div className={styles.sliderDots}>
          {Array.from({ length: maxSlide + 1 }).map((_, i) => (
            <button key={i} className={`${styles.sliderDot} ${i === slide ? styles.sliderDotActive : ''}`} onClick={() => { goTo(i); resetAuto(); }}/>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} aria-hidden/>
        <RoadStrip/>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to plan your trip?</h2>
          <p className={styles.ctaSub}>Create a free account and plan your first route in under a minute.</p>
          <div className={styles.ctaBtns}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/register')}>Create free account</button>
            <button className={styles.ctaGhost} onClick={() => navigate('/login')}>Already have one? Sign in</button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Icons.Map/>
          Road Trip Planner
        </div>
        <div className={styles.footerStack}>
          FastAPI · React · Spark MLlib · Cassandra · OpenStreetMap
        </div>
        <div className={styles.footerLinks}>
          <span className={styles.footerLink} onClick={() => navigate('/login')}>Sign in</span>
          <span className={styles.footerLink} onClick={() => navigate('/register')}>Register</span>
        </div>
      </footer>
    </div>
  );
}