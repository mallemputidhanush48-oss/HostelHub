import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ShieldAlert, Sparkles, Receipt, Home } from 'lucide-react';
import { api } from '../utils/api';
import { UserContext } from '../App';

export default function Booking() {
  const { hostelId, roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [hostel, setHostel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [checkInDate, setCheckInDate] = useState('');
  const [duration, setDuration] = useState(1); // months
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingContext();
  }, [hostelId, roomId]);

  const fetchBookingContext = async () => {
    setLoading(true);
    try {
      const hDetails = await api.get(`/hostels/${hostelId}`);
      setHostel(hDetails);
      const rDetails = hDetails.rooms.find(r => r.id === parseInt(roomId));
      setRoom(rDetails);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    const code = coupon.toUpperCase().trim();
    if (code === 'WELCOME10') {
      setDiscountPercent(10);
      setCouponSuccess('Promo codeWELCOME10 applied! You saved 10%.');
    } else if (code === 'STUDENT5') {
      setDiscountPercent(5);
      setCouponSuccess('Promo code STUDENT5 applied! You saved 5%.');
    } else {
      setCouponError('Invalid promo coupon code.');
      setDiscountPercent(0);
    }
  };

  // Calculations
  const basePrice = room ? room.price_per_month * duration : 0;
  const discountAmount = Math.round((basePrice * discountPercent) / 100);
  const maintenanceFee = 500; // Flat fee
  const totalAmount = basePrice - discountAmount + maintenanceFee;

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!checkInDate) {
      setError('Please select a check-in date.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const response = await api.post('/bookings', {
        hostel_id: parseInt(hostelId),
        room_id: parseInt(roomId),
        check_in_date: checkInDate,
        duration_months: parseInt(duration)
      });
      // Redirect to Guest Dashboard booking tab
      navigate('/dashboard/guest?booking_success=true');
    } catch (err) {
      setError(err.message || 'Error processing booking request.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div className="skeleton" style={{ height: '80px', width: '100%' }}></div>
        <div className="skeleton" style={{ height: '250px', width: '100%' }}></div>
      </div>
    );
  }

  if (!hostel || !room) {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center' }}>
        <h2>Invalid Booking Context</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>Back Home</button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px', maxWidth: '900px' }}>
      
      <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Confirm Your Booking Request</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Configure check-in configurations and submit for owner review. No payments required yet.
      </p>

      {error && (
        <div className="badge badge-danger" style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: 'var(--radius-sm)', width: '100%', marginBottom: '20px', textTransform: 'none' }}>
          <ShieldAlert size={18} /> <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left Form Panel */}
        <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> Stay Specifications
            </h3>

            {/* Check in Date */}
            <div className="form-group">
              <label className="form-label">Check-In Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Cannot check in in past
                required
              />
            </div>

            {/* Duration Selector */}
            <div className="form-group">
              <label className="form-label">Stay Duration</label>
              <select 
                className="form-input" 
                value={duration} 
                onChange={(e) => setDuration(parseInt(e.target.value))}
              >
                <option value="1">1 Month</option>
                <option value="2">2 Months</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months (Long term)</option>
              </select>
            </div>
          </div>

          {/* Promo code integration */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} /> Apply Promo Coupon
            </h3>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="E.g. WELCOME10, STUDENT5" 
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <button type="button" onClick={applyCoupon} className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                Apply
              </button>
            </div>

            {couponError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '6px' }}>{couponError}</p>}
            {couponSuccess && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '6px' }}>{couponSuccess}</p>}

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '10px', marginTop: '15px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Tip: Use <b>WELCOME10</b> to get 10% off stay charges.
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '50px' }} disabled={submitting}>
            {submitting ? 'Submitting Request...' : 'Send Booking Request'}
          </button>
        </form>

        {/* Right Checkout Bill Summary Panel */}
        <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hostel Summary Info */}
          <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <img 
              src={hostel.photos[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=150'} 
              alt={hostel.name} 
              style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
            />
            <div>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{hostel.name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{room.room_type}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Home size={10} /> ₹{room.price_per_month}/month
              </p>
            </div>
          </div>

          {/* Pricing breakdown card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} /> Pricing Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Room Rent (₹{room.price_per_month} &times; {duration} mo)</span>
                <span style={{ fontWeight: 600 }}>₹{basePrice}</span>
              </div>
              
              {discountPercent > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Discount ({discountPercent}%)</span>
                  <span>- ₹{discountAmount}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Maintenance / Amenities Fee</span>
                <span style={{ fontWeight: 600 }}>₹{maintenanceFee}</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800 }}>
                <span>Total Amount</span>
                <span className="gradient-text">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
