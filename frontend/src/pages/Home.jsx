import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, MapPin, Smile, Star, ArrowRight } from 'lucide-react';

export default function Home() {
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('all');
  const [propertyType, setPropertyType] = useState('all');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?city=${encodeURIComponent(city)}&gender=${gender}&property_type=${propertyType}`);
  };

  const featuredCities = [
    { name: 'Bangalore', hostels: '12+ Hostels', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400' },
    { name: 'Pune', hostels: '8+ Hostels', image: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&q=80&w=400' },
    { name: 'Delhi', hostels: '15+ Hostels', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=400' },
    { name: 'Mumbai', hostels: '10+ Hostels', image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(to bottom, var(--primary-light), transparent)',
        padding: '80px 20px 60px 20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', lineHeight: 1.2 }}>
            Find Your Safe Haven,<br />Book in <span className="gradient-text">Seconds</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '40px' }}>
            Explore verified student-friendly and professional co-living spaces, hostels, and PGs. Homely food, standard safety, and great environments.
          </p>

          {/* Search Card */}
          <form onSubmit={handleSearch} className="glass-card" style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '15px',
            alignItems: 'center', padding: '16px', maxWidth: '800px', margin: '0 auto',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '10px 15px' }}>
              <MapPin size={20} color="var(--primary)" />
              <input 
                type="text" 
                placeholder="Enter city or location (e.g. Bangalore)..." 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '10px 15px' }}>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">All Genders</option>
                <option value="boys">Boys PG</option>
                <option value="girls">Girls Hostel</option>
                <option value="co-living">Co-Living</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '10px 15px' }}>
              <select 
                value={propertyType} 
                onChange={(e) => setPropertyType(e.target.value)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">All Types</option>
                <option value="Hostel">Hostel</option>
                <option value="PG">Paying Guest (PG)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', height: '100%' }}>
              <Search size={18} /> Search
            </button>
          </form>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="container" style={{ marginTop: '60px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Popular Destinations</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Explore hostels in top student and commercial hubs across India.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {featuredCities.map((c) => (
            <div 
              key={c.name} 
              className="glass-card" 
              onClick={() => navigate(`/search?city=${c.name}`)}
              style={{
                position: 'relative', overflow: 'hidden', height: '200px', cursor: 'pointer', padding: 0,
                borderRadius: 'var(--radius-md)'
              }}
            >
              <img 
                src={c.image} 
                alt={c.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '20px', color: '#fff'
              }}>
                <h3 style={{ color: '#fff', fontSize: '1.4rem' }}>{c.name}</h3>
                <p style={{ opacity: 0.8, fontSize: '0.85rem' }}>{c.hostels}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features section */}
      <section className="container" style={{ marginTop: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2rem' }}>Why Choose HostelHub?</h2>
          <p style={{ color: 'var(--text-secondary)' }}>We offer more than just a list of beds. We offer peace of mind.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Shield size={28} />
            </div>
            <div>
              <h3 style={{ marginBottom: '8px' }}>Verified Owners Only</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Every PG and Hostel listing is double-checked by our admin team to prevent spam and scams.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--success-light)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
              <Star size={28} />
            </div>
            <div>
              <h3 style={{ marginBottom: '8px' }}>Honest Reviews & Ratings</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Read verified reviews from guests who actually stayed in the accommodation. No fake testimonials.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--info-light)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--info)' }}>
              <Smile size={28} />
            </div>
            <div>
              <h3 style={{ marginBottom: '8px' }}>Instant Communication</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Chat directly with hostel owners inside our secure interface. Agree on terms before checking in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container" style={{ marginTop: '80px' }}>
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, var(--primary), #9333ea)',
          color: '#fff', padding: '60px 40px', borderRadius: 'var(--radius-lg)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px'
        }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '10px' }}>List Your PG/Hostel With Us</h2>
            <p style={{ opacity: 0.9, maxWidth: '600px' }}>
              Are you a hostel owner? Reach thousands of verified students and young working professionals in India. List in minutes!
            </p>
          </div>
          <button 
            onClick={() => navigate('/auth?role=owner')} 
            className="btn btn-secondary" 
            style={{ background: '#fff', color: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          form { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
