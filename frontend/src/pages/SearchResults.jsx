import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Map, Grid, SlidersHorizontal, Star, ShieldCheck, Heart, MapPin, Coffee, Wifi, Dumbbell } from 'lucide-react';
import { api } from '../utils/api';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search parameter states
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [gender, setGender] = useState(searchParams.get('gender') || 'all');
  const [propertyType, setPropertyType] = useState(searchParams.get('property_type') || 'all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ac, setAc] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [food, setFood] = useState(false);
  const [gym, setGym] = useState(false);

  // UI display modes
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [hoveredHostelId, setHoveredHostelId] = useState(null);

  useEffect(() => {
    fetchHostels();
    fetchFavorites();
  }, [searchParams]);

  const fetchHostels = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      const cityParam = searchParams.get('city');
      const genderParam = searchParams.get('gender');
      const propertyTypeParam = searchParams.get('property_type');
      const minP = searchParams.get('minPrice');
      const maxP = searchParams.get('maxPrice');
      const acP = searchParams.get('ac');
      const wifiP = searchParams.get('wifi');
      const foodP = searchParams.get('food');
      const gymP = searchParams.get('gym');

      if (cityParam) q.append('city', cityParam);
      if (genderParam) q.append('gender', genderParam);
      if (propertyTypeParam) q.append('property_type', propertyTypeParam);
      if (minP) q.append('minPrice', minP);
      if (maxP) q.append('maxPrice', maxP);
      if (acP) q.append('ac', acP);
      if (wifiP) q.append('wifi', wifiP);
      if (foodP) q.append('food', foodP);
      if (gymP) q.append('gym', gymP);

      const list = await api.get(`/hostels?${q.toString()}`);
      setHostels(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem('hostelhub_token');
    if (!token) return;
    try {
      const favs = await api.get('/hostels/user/favorites');
      setFavorites(favs.map(f => f.id));
    } catch (e) {}
  };

  const toggleFavorite = async (e, hostelId) => {
    e.stopPropagation();
    const token = localStorage.getItem('hostelhub_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const isFav = favorites.includes(hostelId);
    try {
      if (isFav) {
        await api.delete(`/hostels/${hostelId}/favorite`);
        setFavorites(favorites.filter(id => id !== hostelId));
      } else {
        await api.post(`/hostels/${hostelId}/favorite`);
        setFavorites([...favorites, hostelId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const params = {};
    if (city) params.city = city;
    if (gender !== 'all') params.gender = gender;
    if (propertyType !== 'all') params.property_type = propertyType;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (ac) params.ac = 'true';
    if (wifi) params.wifi = 'true';
    if (food) params.food = 'true';
    if (gym) params.gym = 'true';
    
    setSearchParams(params);
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      
      {/* Header and Toggle Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Search Results</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Found {hostels.length} verified listings in {searchParams.get('city') || 'all cities'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setViewMode('grid')}
            className={`btn btn-secondary btn-sm ${viewMode === 'grid' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Grid size={16} /> Grid
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`btn btn-secondary btn-sm ${viewMode === 'map' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Map size={16} /> Map Split
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'map' ? '280px 1fr 1fr' : '280px 1fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Filter Form */}
        <div className="glass-card" style={{ padding: '20px', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} /> Filters
          </h3>

          <form onSubmit={applyFilters} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search city..." 
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender Restriction</label>
              <select 
                className="form-input" 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="all">All Genders</option>
                <option value="boys">Boys only</option>
                <option value="girls">Girls only</option>
                <option value="co-living">Co-living</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Accommodation Type</label>
              <select 
                className="form-input" 
                value={propertyType} 
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Hostel">Hostel</option>
                <option value="PG">Paying Guest (PG)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price Range (₹/mo)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Facilities</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={wifi} onChange={(e) => setWifi(e.target.checked)} /> WiFi
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={food} onChange={(e) => setFood(e.target.checked)} /> Food Included
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={gym} onChange={(e) => setGym(e.target.checked)} /> Gymnasium
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={ac} onChange={(e) => setAc(e.target.checked)} /> AC Rooms
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Apply Filters
            </button>
          </form>
        </div>

        {/* Middle/Right Side: Results List */}
        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'map' ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {loading ? (
            // Skeleton loadings
            [1, 2, 3].map(i => (
              <div key={i} className="glass-card" style={{ height: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="skeleton" style={{ height: '180px', width: '100%' }}></div>
                <div className="skeleton" style={{ height: '24px', width: '70%' }}></div>
                <div className="skeleton" style={{ height: '16px', width: '40%' }}></div>
              </div>
            ))
          ) : hostels.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center' }}>
              <SlidersHorizontal size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '20px' }} />
              <h3>No Listings Found</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>Try relaxing your search filter options.</p>
            </div>
          ) : (
            hostels.map(h => (
              <div 
                key={h.id} 
                className="glass-card" 
                onClick={() => navigate(`/hostel/${h.id}`)}
                onMouseEnter={() => setHoveredHostelId(h.id)}
                onMouseLeave={() => setHoveredHostelId(null)}
                style={{
                  padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  height: '100%', border: hoveredHostelId === h.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)'
                }}
              >
                {/* Photo Header */}
                <div style={{ position: 'relative', height: '170px' }}>
                  <img 
                    src={h.photos[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600'} 
                    alt={h.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <button 
                      onClick={(e) => toggleFavorite(e, h.id)}
                      style={{
                        background: 'rgba(0,0,0,0.4)', border: 'none', color: favorites.includes(h.id) ? 'var(--danger)' : '#fff',
                        padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)'
                      }}
                    >
                      <Heart size={16} fill={favorites.includes(h.id) ? 'var(--danger)' : 'none'} />
                    </button>
                  </div>
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize', padding: '2px 8px' }}>
                      {h.gender_type}
                    </span>
                    <span className="badge badge-warning" style={{ padding: '2px 8px', color: '#fff', background: 'var(--primary)' }}>
                      {h.property_type || 'Hostel'}
                    </span>
                    {h.verified === 1 && (
                      <span className="badge badge-success" style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ShieldCheck size={12} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Content body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1.1rem', lineHeight: 1.3 }}>{h.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, fontSize: '0.9rem' }}>
                        <Star size={14} fill="var(--warning)" color="var(--warning)" />
                        <span>{h.rating || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                      <MapPin size={12} /> {h.address}, {h.city}
                    </p>

                    {/* Facility Small Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {h.facilities.slice(0, 3).map((f) => (
                        <span key={f} style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {f === 'WiFi' && <Wifi size={10} />}
                          {f === 'Food' && <Coffee size={10} />}
                          {f === 'Gym' && <Dumbbell size={10} />}
                          {f}
                        </span>
                      ))}
                      {h.facilities.length > 3 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                          +{h.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Starting from
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{h.price_per_month || '4,500'}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Split: Mock Interactive Map */}
        {viewMode === 'map' && (
          <div className="glass-card animate-fade-in" style={{
            height: 'calc(100vh - 180px)', position: 'sticky', top: '100px', padding: 0, overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Visual Header */}
            <div style={{ background: 'var(--primary-light)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} /> Interactive Map View
              </span>
              <span className="badge badge-success">GPS Mock Enabled</span>
            </div>

            {/* Mock Vector Canvas Map */}
            <div style={{
              flexGrow: 1, position: 'relative', background: 'var(--bg-tertiary)',
              backgroundImage: 'radial-gradient(var(--border-color) 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px'
            }}>
              
              {/* Fake City Roads Vector Drawings */}
              <div style={{ position: 'absolute', top: '30%', left: 0, right: 0, height: '12px', background: 'var(--border-color)', transform: 'rotate(-5deg)' }}></div>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '40%', width: '12px', background: 'var(--border-color)', transform: 'rotate(15deg)' }}></div>
              <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: '12px', background: 'var(--border-color)', transform: 'rotate(5deg)' }}></div>

              {/* Pins Mapping */}
              {hostels.map((h, i) => {
                // Static distributed points for mock purposes
                const coordinates = [
                  { top: '35%', left: '48%' },
                  { top: '20%', left: '20%' },
                  { top: '55%', left: '72%' },
                  { top: '75%', left: '35%' }
                ];
                const pos = coordinates[i % coordinates.length];
                const isHovered = hoveredHostelId === h.id;

                return (
                  <div 
                    key={h.id} 
                    onClick={() => navigate(`/hostel/${h.id}`)}
                    style={{
                      position: 'absolute', top: pos.top, left: pos.left, cursor: 'pointer',
                      transform: isHovered ? 'scale(1.2) translateY(-5px)' : 'scale(1)',
                      transition: 'transform 0.2s', zIndex: isHovered ? 10 : 2
                    }}
                  >
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                      {/* Floating Mini card */}
                      <div style={{
                        background: 'var(--bg-secondary)', border: isHovered ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', whiteSpace: 'nowrap'
                      }}>
                        ₹{h.price_per_month || '4,500'}
                      </div>
                      {/* Pin Pointer */}
                      <div style={{
                        width: '12px', height: '12px', background: isHovered ? 'var(--primary)' : 'var(--text-secondary)',
                        borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg) translate(3px, -3px)',
                        border: '2px solid #fff', marginTop: '2px'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
