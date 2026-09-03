'use client';

import { useState, useEffect, useRef } from 'react';
import { apiUrl } from './api-client';

interface IncidentPin {
  id: string;
  title: string;
  category: 'water' | 'roads' | 'energy' | 'transport' | 'waste' | 'healthcare';
  severity: 'critical' | 'urgent' | 'high' | 'medium' | 'minor';
  lat: number;
  lng: number;
  location: string;
  location_code: string;
  time: string;
  device: string;
  pressure?: string;
  temp?: string;
  status: string;
  population_affected: number;
  routed_agency: string;
  sla_hours: number;
  image_url: string;
  details: string;
}

// Extensive All-India Coordinates lookup dictionary
const cityCoordinates: Record<string, { lat: number; lng: number; label: string }> = {
  // All India Center
  india: { lat: 20.5937, lng: 78.9629, label: 'All India' },

  // Kerala
  thrissur: { lat: 10.5276, lng: 76.2144, label: 'Thrissur' },
  kochi: { lat: 9.967, lng: 76.2458, label: 'Kochi' },
  ernakulam: { lat: 9.9816, lng: 76.2999, label: 'Ernakulam' },
  trivandrum: { lat: 8.5241, lng: 76.9366, label: 'Trivandrum' },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, label: 'Trivandrum' },
  palakkad: { lat: 10.7867, lng: 76.6548, label: 'Palakkad' },
  calicut: { lat: 11.2588, lng: 75.7804, label: 'Kozhikode' },
  kozhikode: { lat: 11.2588, lng: 75.7804, label: 'Kozhikode' },
  wayanad: { lat: 11.6854, lng: 76.1320, label: 'Wayanad' },

  // All-India Metro & Capital Cities
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' },
  bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' },
  mumbai: { lat: 19.0760, lng: 72.8777, label: 'Mumbai' },
  delhi: { lat: 28.7041, lng: 77.1025, label: 'Delhi' },
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai' },
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata' },
  hyderabad: { lat: 17.3850, lng: 78.4867, label: 'Hyderabad' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune' },
  jaipur: { lat: 26.9124, lng: 75.7873, label: 'Jaipur' },
  guwahati: { lat: 26.1445, lng: 91.7362, label: 'Guwahati' },
  lucknow: { lat: 26.8467, lng: 80.9462, label: 'Lucknow' },
};

const initialAllIndiaDemoPins: IncidentPin[] = [
  {
    id: 'PIN-TS322',
    title: 'SUBSTATION TRANSFORMER TRIP',
    category: 'energy',
    severity: 'critical',
    lat: 10.5276,
    lng: 76.2144,
    location: 'Thrissur, Kerala',
    location_code: 'TS04/W14',
    time: '16:32',
    device: 'M 322',
    pressure: 'N/A',
    temp: '42°C',
    status: 'TRANSFORMER TRIP',
    population_affected: 8500,
    routed_agency: 'Electricity Board (KSEB)',
    sla_hours: 4,
    image_url: '/images/power_outage.png',
    details: 'Substation sub-grid high voltage trip near Thrissur commercial district.',
  },
  {
    id: 'PIN-VA234',
    title: 'PIPE BREAKAGE',
    category: 'water',
    severity: 'urgent',
    lat: 9.967,
    lng: 76.2458,
    location: 'Kochi, Kerala',
    location_code: 'F01/D32',
    time: '14:32',
    device: 'M 31',
    pressure: '50 Psi',
    temp: '17°C / 62°F',
    status: 'ACTIVE LEAK',
    population_affected: 4200,
    routed_agency: 'Water Authority (KWA)',
    sla_hours: 2,
    image_url: '/images/pipe_breakage.png',
    details: 'Main supply valve pressure spike near Fort Kochi water line.',
  },
  {
    id: 'PIN-BLR101',
    title: 'TRAFFIC GRIDLOCK & POTHOLE',
    category: 'roads',
    severity: 'critical',
    lat: 12.9716,
    lng: 77.5946,
    location: 'Bengaluru, Karnataka',
    location_code: 'BLR/ORR-04',
    time: '09:15',
    device: 'R 88',
    pressure: 'N/A',
    temp: '26°C',
    status: 'SUBSIDENCE',
    population_affected: 14500,
    routed_agency: 'BBMP Infrastructure Division',
    sla_hours: 6,
    image_url: '/images/road_damage.png',
    details: 'Outer Ring Road asphalt collapse blocking IT corridor transit.',
  },
  {
    id: 'PIN-DEL505',
    title: 'POWER GRID VOLTAGE FLUP',
    category: 'energy',
    severity: 'high',
    lat: 28.7041,
    lng: 77.1025,
    location: 'Delhi NCR',
    location_code: 'DEL/N22',
    time: '13:10',
    device: 'P 505',
    pressure: 'N/A',
    temp: '38°C',
    status: 'VOLTAGE DROP',
    population_affected: 18200,
    routed_agency: 'Delhi Transco Limited',
    sla_hours: 3,
    image_url: '/images/power_outage.png',
    details: 'North Delhi high voltage line fluctuation affecting residential sectors.',
  },
  {
    id: 'PIN-BOM88',
    title: 'WATER PIPELINE LEAK',
    category: 'water',
    severity: 'urgent',
    lat: 19.0760,
    lng: 72.8777,
    location: 'Mumbai, Maharashtra',
    location_code: 'MUM/W08',
    time: '15:20',
    device: 'M 88',
    pressure: '65 Psi',
    temp: '29°C',
    status: 'BURST LEAK',
    population_affected: 22000,
    routed_agency: 'BMC Hydraulic Engineer Dept',
    sla_hours: 4,
    image_url: '/images/pipe_breakage.png',
    details: 'Major trunk water main fracture near Dadar junction.',
  },
];

const categoryFilters = [
  { id: 'all', label: 'Places (All India)', icon: '📍' },
  { id: 'roads', label: 'Road Ways', icon: '🛣️' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'waste', label: 'Waste', icon: '🗑️' },
  { id: 'healthcare', label: 'Public Realm', icon: '🏛️' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'security', label: 'Security', icon: '🛡️' },
];

export default function MapDashboard() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [allPins, setAllPins] = useState<IncidentPin[]>(initialAllIndiaDemoPins);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPin, setSelectedPin] = useState<IncidentPin | null>(initialAllIndiaDemoPins[0]);
  const [valveToggle, setValveToggle] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [peopleCount, setPeopleCount] = useState<number>(67600);

  // Fetch live citizen requests from Backend API to plot dynamic pins across India
  useEffect(() => {
    async function fetchLiveRequests() {
      try {
        const response = await fetch(apiUrl('/requests')).catch(() => null);
        if (response && response.ok) {
          const liveData = await response.json();
          if (Array.isArray(liveData) && liveData.length > 0) {
            const mappedLivePins: IncidentPin[] = liveData.map((req: any) => {
              const locLower = (req.location || 'india').toLowerCase();
              const coord = cityCoordinates[locLower] || { lat: req.latitude || 20.5937, lng: req.longitude || 78.9629 };

              return {
                id: req.request_id || `PIN-${Math.floor(Math.random() * 9000 + 1000)}`,
                title: (req.category || 'CIVIC ISSUE').toUpperCase(),
                category: (req.category?.toLowerCase() || 'roads') as any,
                severity: req.severity || 'high',
                lat: req.latitude || coord.lat,
                lng: req.longitude || coord.lng,
                location: req.location || req.administrative_region || 'India',
                location_code: `CIV-${req.id || '01'}`,
                time: new Date(req.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                device: 'SENS-AI',
                pressure: 'Normal',
                temp: '28°C',
                status: req.status?.toUpperCase() || 'SUBMITTED',
                population_affected: req.population_affected || 3500,
                routed_agency: req.routed_agency || 'Municipal Administration',
                sla_hours: req.sla_hours || 24,
                image_url: req.category === 'Drinking Water' ? '/images/pipe_breakage.png' : req.category === 'Electricity' ? '/images/power_outage.png' : '/images/road_damage.png',
                details: req.translated_text || req.original_text || 'Citizen reported infrastructure incident.',
              };
            });

            // Combine live pins with demo pins
            setAllPins((prev) => {
              const combined = [...mappedLivePins, ...initialAllIndiaDemoPins];
              const unique = Array.from(new Map(combined.map((pin) => [pin.id, pin])).values());
              return unique;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch live request pins:', err);
      }
    }

    fetchLiveRequests();
  }, []);

  // Filtered list based on active dock category
  const filteredPins = allPins.filter((pin) => {
    if (activeCategory === 'all' || activeCategory === 'analytics' || activeCategory === 'security') return true;
    return pin.category === activeCategory || (activeCategory === 'water' && pin.category === 'drinking water' as any);
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let L: any;
    import('leaflet').then((leafletModule) => {
      L = leafletModule.default || leafletModule;

      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current) {
        // Initialize Map centered on All-India overview (20.5937, 78.9629) at Zoom 5
        const map = L.map(mapContainerRef.current, {
          center: [20.5937, 78.9629],
          zoom: 5,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers & polylines
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // Add neon route polylines connecting regional nodes
      const routeCoordinates: [number, number][] = filteredPins.map((pin) => [pin.lat, pin.lng]);
      if (routeCoordinates.length > 1) {
        const neonPolyline = L.polyline(routeCoordinates, {
          color: '#06b6d4',
          weight: 2,
          opacity: 0.6,
          dashArray: '6, 10',
        }).addTo(map);
        markersRef.current.push(neonPolyline);
      }

      // Render glowing pins for each incident node across India
      filteredPins.forEach((pin) => {
        const isSelected = selectedPin?.id === pin.id;
        const pinHtml = `
          <div style="
            position: relative;
            width: 38px;
            height: 38px;
            background: ${isSelected ? '#22c55e' : pin.severity === 'critical' ? '#ef4444' : pin.severity === 'urgent' ? '#f97316' : '#06b6d4'};
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            box-shadow: 0 0 20px ${isSelected ? 'rgba(34, 197, 94, 0.95)' : 'rgba(6, 182, 212, 0.8)'};
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            ${pin.category === 'water' || (pin.category as any) === 'drinking water' ? '💧' : pin.category === 'roads' ? '🛣️' : pin.category === 'energy' || (pin.category as any) === 'electricity' ? '⚡' : '🏥'}
            <div style="
              position: absolute;
              bottom: -3px;
              right: -3px;
              width: 12px;
              height: 12px;
              background: #22c55e;
              border-radius: 50%;
              border: 2px solid #000;
            "></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: pinHtml,
          className: 'custom-div-icon',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedPin(pin);
          map.flyTo([pin.lat, pin.lng], 13, { duration: 1.2 });
        });

        markersRef.current.push(marker);
      });
    });
  }, [activeCategory, selectedPin, allPins]);

  const handleSelectPin = (pin: IncidentPin) => {
    setSelectedPin(pin);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([pin.lat, pin.lng], 13, { duration: 1.2 });
    }
  };

  const handleCityJump = (cityKey: string) => {
    const city = cityCoordinates[cityKey];
    if (city && mapInstanceRef.current) {
      const zoom = cityKey === 'india' ? 5 : 12;
      mapInstanceRef.current.flyTo([city.lat, city.lng], zoom, { duration: 1.2 });
      
      const matchingPin = allPins.find((p) => p.location.toLowerCase().includes(cityKey));
      if (matchingPin) {
        setSelectedPin(matchingPin);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.trim().toLowerCase();
    const city = cityCoordinates[term];

    if (city && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 13, { duration: 1.2 });
      return;
    }

    // Check matching pin in list
    const matchingPin = allPins.find((p) => p.location.toLowerCase().includes(term) || p.title.toLowerCase().includes(term));
    if (matchingPin && mapInstanceRef.current) {
      setSelectedPin(matchingPin);
      mapInstanceRef.current.flyTo([matchingPin.lat, matchingPin.lng], 13, { duration: 1.2 });
    } else {
      alert(`Searching place '${searchQuery}' across India... Fly camera to target region.`);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '85vh', borderRadius: 16, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', background: '#090d16', color: '#f8fafc' }}>
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Top Header Bar Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 10,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ background: '#0284c7', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>
            🇮🇳
          </div>
          <div>
            <span style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: 14, color: '#f8fafc' }}>CIVICAI INDIA TWIN</span>
            <span style={{ fontSize: 10, display: 'block', color: '#38bdf8', fontWeight: 600 }}>ALL-INDIA GEOSPATIAL MAP ENGINE</span>
          </div>
        </div>

        {/* Dynamic City Quick-Jump Shortcuts & Search */}
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(12px)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', overflowX: 'auto', maxWidth: '40vw' }}>
            <button onClick={() => handleCityJump('india')} style={{ background: 'rgba(255,255,255,0.1)', color: '#38bdf8', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              🇮🇳 All India
            </button>
            <button onClick={() => handleCityJump('thrissur')} style={{ background: selectedPin?.location.toLowerCase().includes('thrissur') ? '#0284c7' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              📍 Thrissur
            </button>
            <button onClick={() => handleCityJump('kochi')} style={{ background: selectedPin?.location.toLowerCase().includes('kochi') ? '#0284c7' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              📍 Kochi
            </button>
            <button onClick={() => handleCityJump('bengaluru')} style={{ background: selectedPin?.location.toLowerCase().includes('bengaluru') ? '#0284c7' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              📍 Bengaluru
            </button>
            <button onClick={() => handleCityJump('delhi')} style={{ background: selectedPin?.location.toLowerCase().includes('delhi') ? '#0284c7' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              📍 Delhi
            </button>
            <button onClick={() => handleCityJump('mumbai')} style={{ background: selectedPin?.location.toLowerCase().includes('mumbai') ? '#0284c7' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              📍 Mumbai
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search any place in India..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 13, outline: 'none', width: 170 }}
            />
          </form>
        </div>
      </div>

      {/* Left Overlay Control Panel (Glassmorphism) */}
      <div
        style={{
          position: 'absolute',
          top: 76,
          left: 16,
          bottom: 84,
          width: 320,
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 14,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Total People Metric */}
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px 0' }}>All-India Affected Citizens</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>{peopleCount.toLocaleString()}</p>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#cbd5e1' }}>● Active Incidents</span>
                <span style={{ fontWeight: 'bold' }}>{filteredPins.length} Nodes</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: '#0284c7', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: 0 }} />

        {/* High Energy & Incident Alerts Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '0.03em' }}>
              All-India Infrastructure Incidents
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                onClick={() => handleSelectPin(pin)}
                style={{
                  background: selectedPin?.id === pin.id ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.5)',
                  border: selectedPin?.id === pin.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: 10,
                  display: 'flex',
                  gap: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <img
                  src={pin.image_url}
                  alt={pin.title}
                  style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>{pin.title}</span>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: pin.severity === 'critical' ? '#ef4444' : pin.severity === 'urgent' ? '#f97316' : '#eab308',
                        color: 'white',
                      }}
                    >
                      {pin.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', margin: '0 0 2px 0' }}>📍 {pin.location}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>Code: {pin.location_code} | Time: {pin.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Node Detail Popup Card */}
      {selectedPin && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            right: 24,
            zIndex: 10,
            width: 300,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 14,
            padding: 16,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <div>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'white', display: 'block' }}>{selectedPin.title}</span>
                <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>📍 {selectedPin.location} ({selectedPin.id})</span>
              </div>
            </div>

            {/* Toggle Switch */}
            <div
              onClick={() => setValveToggle(!valveToggle)}
              style={{
                width: 38,
                height: 20,
                background: valveToggle ? '#22c55e' : '#64748b',
                borderRadius: 10,
                padding: 2,
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: 'white',
                  borderRadius: '50%',
                  transform: valveToggle ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.3s',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 2px 0' }}>SLA Window</p>
              <p style={{ fontSize: 13, fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>{selectedPin.sla_hours} Hours</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 2px 0' }}>Impacted</p>
              <p style={{ fontSize: 13, fontWeight: 'bold', margin: 0, color: '#10b981' }}>{selectedPin.population_affected.toLocaleString()}</p>
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.4, margin: '0 0 10px 0' }}>{selectedPin.details}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px 0' }}><strong>Assigned Agency:</strong> {selectedPin.routed_agency}</p>

          <a
            href="#details"
            onClick={(e) => {
              e.preventDefault();
              alert(`Exact GPS Coordinates: [${selectedPin.lat}, ${selectedPin.lng}]\nPlace: ${selectedPin.location}\nTitle: ${selectedPin.title}\nAssigned Agency: ${selectedPin.routed_agency}`);
            }}
            style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            View GPS Telemetry ↗
          </a>
        </div>
      )}

      {/* Bottom Floating Sector Filter Dock */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 30,
          padding: '6px 12px',
          display: 'flex',
          gap: 6,
          boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
          overflowX: 'auto',
          maxWidth: '92vw',
        }}
      >
        {categoryFilters.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: isActive ? '#0284c7' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: 20,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
