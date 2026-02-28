'use client';

import { useState, useEffect, useRef } from 'react';
import { LoadScript, StandaloneSearchBox, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';

interface PlaceResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface Schedule {
  _id: string;
  email: string;
  source: { address: string };
  destination: { address: string };
  days: string[];
  usualStartTime: string;
  lastNotifiedDate?: string;
}

const libraries: ('places')[] = ['places'];

/* ── Location Input ──────────────────────────────── */
const LocationInput = ({
  label,
  placeholder,
  onPlaceSelected,
}: {
  label: string;
  placeholder: string;
  onPlaceSelected: (p: PlaceResult) => void;
}) => {
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry?.location && place.place_id && place.formatted_address) {
          onPlaceSelected({
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id,
          });
        }
      }
    }
  };

  return (
    <div>
      <label className="form-label">{label}</label>
      <StandaloneSearchBox onLoad={setSearchBox} onPlacesChanged={onPlacesChanged}>
        <input type="text" placeholder={placeholder} className="input-field" />
      </StandaloneSearchBox>
    </div>
  );
};

/* ── Custom Time Picker Component ────────────────── */
const CustomTimePicker = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse 24h string "HH:mm"
  const [h24, m24] = value.split(':').map(Number);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const displayHour = h24 % 12 || 12;
  const displayMin = m24;

  const updateTime = (newH: number, newM: number, newP: 'AM' | 'PM') => {
    let finalH = newH % 12;
    if (newP === 'PM') finalH += 12;
    const hStr = finalH.toString().padStart(2, '0');
    const mStr = newM.toString().padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeHour = (delta: number) => {
    let nextH = displayHour + delta;
    if (nextH > 12) nextH = 1;
    if (nextH < 1) nextH = 12;
    updateTime(nextH, displayMin, period);
  };

  const changeMin = (delta: number) => {
    let nextM = displayMin + delta;
    if (nextM >= 60) nextM = 0;
    if (nextM < 0) nextM = 59;
    updateTime(displayHour, nextM, period);
  };

  const handleWheel = (e: React.WheelEvent, type: 'h' | 'm') => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    if (type === 'h') changeHour(delta);
    else changeMin(delta);
  };

  const handleManualEntry = (val: string, type: 'h' | 'm') => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    if (isNaN(num)) return;

    if (type === 'h') {
      let finalH = num;
      if (finalH > 12) finalH = 12;
      if (finalH < 1) finalH = 1;
      updateTime(finalH, displayMin, period);
    } else {
      let finalM = num;
      if (finalM > 59) finalM = 59;
      if (finalM < 0) finalM = 0;
      updateTime(displayHour, finalM, period);
    }
  };

  const getNeighbor = (base: number, delta: number, max: number, startAtOne = false) => {
    let n = base + delta;
    if (startAtOne) {
      if (n > max) n = 1;
      if (n < 1) n = max;
    } else {
      if (n >= max) n = 0;
      if (n < 0) n = max - 1;
    }
    return n.toString().padStart(2, '0');
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    width: '45px',
    textAlign: 'center',
    color: 'inherit',
    font: 'inherit',
    padding: 0,
    outline: 'none',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <label className="form-label">Usual Start Time</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input-field"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <span style={{ fontSize: '18px', fontWeight: 700 }}>
          {displayHour.toString().padStart(2, '0')} : {displayMin.toString().padStart(2, '0')}
        </span>
        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800 }}>{period}</span>
      </div>

      {isOpen && (
        <div className="time-picker-popover fade-up" style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>

          <div className="time-toggle-group">
            <button
              type="button"
              className={`time-toggle-btn ${period === 'AM' ? 'active' : ''}`}
              onClick={() => updateTime(displayHour, displayMin, 'AM')}
            >AM</button>
            <button
              type="button"
              className={`time-toggle-btn ${period === 'PM' ? 'active' : ''}`}
              onClick={() => updateTime(displayHour, displayMin, 'PM')}
            >PM</button>
          </div>

          <div className="picker-wheel-container">
            <div className="selection-glow"></div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '8px' }}>
                <span className="neighbor-time" style={{ width: '45px', textAlign: 'center' }}>{getNeighbor(displayHour, -1, 12, true)}</span>
                <span style={{ opacity: 0 }}>:</span>
                <span className="neighbor-time" style={{ width: '45px', textAlign: 'center' }}>{getNeighbor(displayMin, -1, 60)}</span>
              </div>

              <div className="selection-capsule" style={{ cursor: 'ns-resize' }}>
                <input
                  type="text"
                  value={displayHour.toString().padStart(2, '0')}
                  onChange={(e) => handleManualEntry(e.target.value, 'h')}
                  onWheel={(e) => handleWheel(e, 'h')}
                  style={inputStyle}
                  maxLength={2}
                />
                <span style={{ opacity: 0.2 }}>:</span>
                <input
                  type="text"
                  value={displayMin.toString().padStart(2, '0')}
                  onChange={(e) => handleManualEntry(e.target.value, 'm')}
                  onWheel={(e) => handleWheel(e, 'm')}
                  style={inputStyle}
                  maxLength={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginTop: '8px' }}>
                <span className="neighbor-time" style={{ width: '45px', textAlign: 'center' }}>{getNeighbor(displayHour, 1, 12, true)}</span>
                <span style={{ opacity: 0 }}>:</span>
                <span className="neighbor-time" style={{ width: '45px', textAlign: 'center' }}>{getNeighbor(displayMin, 1, 60)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <button type="button" onClick={() => changeMin(-5)} style={{ fontSize: '10px', color: '#64748b', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>-5m</button>
              <button type="button" onClick={() => changeMin(5)} style={{ fontSize: '10px', color: '#64748b', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>+5m</button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            Set Time
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Map Panel (Right Side) ──────────────────────── */
function MapPanel({ source, destination }: { source: PlaceResult; destination: PlaceResult }) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [routeName, setRouteName] = useState('');

  useEffect(() => {
    if (source && destination && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: source.lat, lng: source.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            const leg = result.routes[0].legs[0];
            setDistance(leg.distance?.text || '');
            setDuration(leg.duration?.text || '');
            setRouteName(result.routes[0].summary || '');
          }
        }
      );
    }
  }, [source, destination]);

  if (!directions) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center', color: '#475569' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
          <div style={{ fontSize: '14px' }}>Loading route...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-control" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Route Info Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', gap: '28px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Distance</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>{distance}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Duration</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#a78bfa' }}>{duration}</div>
          </div>
        </div>
        {routeName && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Via</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{routeName}</div>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
              { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
              { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
              { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
            ],
          }}
        >
          <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />
        </GoogleMap>
      </div>

      {/* Route details bar */}
      <div style={{
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: '8px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 500 }}>{source.address.split(',')[0]}</span>
        <span style={{ color: '#475569', fontSize: '12px' }}>→</span>
        <span style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 500 }}>{destination.address.split(',')[0]}</span>
      </div>
    </div>
  );
}

/* ── Empty Map State ─────────────────────────────── */
function EmptyMapState() {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.01)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '240px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>🗺️</div>
        <p style={{ color: '#475569', fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>Route Preview</p>
        <p style={{ color: '#334155', fontSize: '13px', lineHeight: 1.5 }}>
          Enter your starting location and destination to see the route on the map
        </p>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
export default function Home() {
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [usualStartTime, setUsualStartTime] = useState('09:00');
  const [days, setDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // UI States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hideMap, setHideMap] = useState(false);

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayFull: Record<string, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
  };

  const fetchSchedules = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/schedules/${userEmail}`);
      if (res.ok) setSchedules(await res.json());
    } catch (e) { }
  };

  // Load email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('commute_sync_email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  useEffect(() => {
    if (email.includes('@') && email.includes('.')) {
      localStorage.setItem('commute_sync_email', email);
      fetchSchedules(email);
    } else {
      setSchedules([]);
    }
  }, [email]);

  const toggleDay = (short: string) => {
    const full = dayFull[short];
    setDays(prev => prev.includes(full) ? prev.filter(d => d !== full) : [...prev, full]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (!email || !source || !destination || days.length === 0 || !usualStartTime) {
      setError('Please fill all fields and select at least one day.');
      setLoading(false); return;
    }

    try {
      const res = await fetch(`/api/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, destination, days, usualStartTime }),
      });

      if (!res.ok) throw new Error('Failed to save schedule');

      const saved = await res.json();
      setSuccess('🎉 Alert created! Analyzing traffic and sending email...');

      // Update the list immediately so the user sees the new alert
      fetchSchedules(email);

      // Trigger immediate analysis in the background
      try {
        await fetch(`/api/schedules/${saved._id}/trigger`, {
          method: 'POST',
        });
        // Refetch to show the "Email sent" badge
        fetchSchedules(email);
      } catch (triggerErr) {
        console.warn('Immediate trigger failed:', triggerErr);
        fetchSchedules(email);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (res.ok) fetchSchedules(email);
    } catch (e) { }
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapDataReady = source && destination;
  const showMap = mapDataReady && !hideMap;

  return (
    <div className="gradient-bg" style={{ height: '100vh', overflow: 'hidden', display: 'flex', position: 'relative', zIndex: 10 }}>
      {/* Sidebar Toggle Button (Floating) */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{
          position: 'absolute',
          left: sidebarCollapsed ? '12px' : '272px',
          top: '24px',
          zIndex: 100,
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          color: '#38bdf8',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
        }}
        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <span style={{ transition: 'transform 0.3s ease' }}>
          {sidebarCollapsed ? '→' : '←'}
        </span>
      </button>

      <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>

        {/* ── LEFT SIDEBAR: Active Commutes ── */}
        <div style={{
          width: sidebarCollapsed ? '0' : '320px',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRight: sidebarCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          padding: sidebarCollapsed ? '24px 0' : '24px 16px',
          zIndex: 20,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          opacity: sidebarCollapsed ? 0 : 1,
        }}>
          <div style={{ marginBottom: '28px', paddingLeft: '8px', minWidth: '280px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>My Commutes</h2>
            <p style={{ fontSize: '11px', color: '#64748b' }}>Manage your active traffic alerts</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '280px' }}>
            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '12px', color: '#475569' }}>No active commutes found for this email.</p>
              </div>
            ) : (
              schedules.map(s => {
                const todayStr = new Date().toISOString().slice(0, 10);
                const isNotifiedToday = s.lastNotifiedDate === todayStr;

                return (
                  <div key={s._id} className="route-card" style={{ padding: '12px 14px', position: 'relative' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ color: '#38bdf8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.source.address.split(',')[0]}</span>
                        <span style={{ color: '#475569', flexShrink: 0 }}>→</span>
                        <span style={{ color: '#a78bfa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.destination.address.split(',')[0]}</span>
                      </p>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>
                        {s.usualStartTime} · {s.days.map(d => d.slice(0, 3)).join(', ')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      {isNotifiedToday ? (
                        <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }}></span>
                          Email sent
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic' }}>Pending today</div>
                      )}

                      <button
                        onClick={() => deleteSchedule(s._id)}
                        className="btn-delete"
                        style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Email Persistence Indicator */}
          {email && (
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.1)', minWidth: '280px' }}>
              <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Account</p>
              <p style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 500, wordBreak: 'break-all' }}>{email}</p>
            </div>
          )}
        </div>

        {/* ── MAIN WORKSPACE: Form + Map ── */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0, position: 'relative' }}>

          {/* Map Toggle Button */}
          {mapDataReady && (
            <button
              onClick={() => setHideMap(!hideMap)}
              style={{
                position: 'absolute',
                right: '24px',
                top: '24px',
                zIndex: 100,
                background: hideMap ? 'rgba(167, 139, 250, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                border: hideMap ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid rgba(56, 189, 248, 0.2)',
                color: hideMap ? '#a78bfa' : '#38bdf8',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span>{hideMap ? '🗺️ Show Map' : '🙈 Hide Map'}</span>
            </button>
          )}

          {/* Form Panel */}
          <div style={{
            width: showMap ? '460px' : '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <div className="fade-up" style={{ width: '100%', maxWidth: '380px' }}>

              {/* Hero */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '999px', padding: '4px 12px',
                  fontSize: '10px', color: '#38bdf8', fontWeight: 500, marginBottom: '8px'
                }}>
                  <span className="pulse-dot"></span>
                  Smart Traffic Intelligence
                </div>

                <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px', lineHeight: 1.1 }}>
                  <span className="gradient-text">CommuteSync</span>
                </h1>

                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, maxWidth: '300px', margin: '0 auto' }}>
                  The optimal departure time, delivered to your inbox.
                </p>
              </div>

              {/* Form Card */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <p className="section-heading" style={{ marginBottom: '16px' }}>Create Commute Alert</p>

                {success && <div className="alert-success" style={{ marginBottom: '20px', fontSize: '13px' }}>{success}</div>}
                {error && <div className="alert-error" style={{ marginBottom: '20px', fontSize: '13px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <LocationInput label="Starting Location" placeholder="Home or origin address" onPlaceSelected={setSource} />
                  <LocationInput label="Destination" placeholder="Office or destination" onPlaceSelected={setDestination} />

                  {/* Days */}
                  <div>
                    <label className="form-label">Days you Commute</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
                      {allDays.map(short => (
                        <button
                          key={short}
                          type="button"
                          onClick={() => toggleDay(short)}
                          className={`day-pill ${days.includes(dayFull[short]) ? 'active' : ''}`}
                        >
                          {short}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Time Picker */}
                  <CustomTimePicker value={usualStartTime} onChange={setUsualStartTime} />

                  <div>
                    <label className="form-label">Notification Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !apiKey}
                    className="btn-primary"
                    style={{ marginTop: '8px' }}
                  >
                    {loading ? 'Analyzing & Saving...' : '+ Create Alert'}
                  </button>
                </form>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span style={{ fontSize: '12px', color: '#475569' }}>Powered by Google Maps Platform</span>
              </div>
            </div>
          </div>

          {/* Map Panel (Right) */}
          <div style={{
            flex: showMap ? 1 : 0,
            height: '100vh',
            borderLeft: showMap ? '1px solid rgba(255,255,255,0.06)' : 'none',
            display: mapDataReady ? 'block' : 'none',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: showMap ? 1 : 0,
          }}>
            {mapDataReady && (
              <MapPanel source={source!} destination={destination!} />
            )}
          </div>

        </div>

      </LoadScript>
    </div>
  );
}

