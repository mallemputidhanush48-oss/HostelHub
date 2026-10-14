import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldAlert, Wifi, Coffee, Dumbbell, ShieldCheck, Heart, MapPin, MessageSquare, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { api } from '../utils/api';
import { UserContext } from '../App';

export default function HostelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // New review state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Chat initiation state
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMsgText, setChatMsgText] = useState('Hello! I am interested in booking a room. Are there any single sharing rooms available?');

  useEffect(() => {
    fetchHostelDetails();
  }, [id]);

  const fetchHostelDetails = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/hostels/${id}`);
      setHostel(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPhoto = () => {
    setActivePhotoIndex(prev => (prev === 0 ? hostel.photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIndex(prev => (prev === hostel.photos.length - 1 ? 0 : prev + 1));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      await api.post(`/hostels/${id}/reviews`, { rating: newRating, comment: newComment });
      setReviewSuccess('Thank you for your feedback! Review added.');
      setNewComment('');
      // Reload details to show review
      fetchHostelDetails();
    } catch (err) {
      setReviewError(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleInitiateChat = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    setSendingMsg(true);
    try {
      await api.post('/chat/send', {
        receiver_id: hostel.owner_id,
        hostel_id: hostel.id,
        message: chatMsgText
      });
      // Redirect to guest dashboard chat
      navigate('/dashboard/guest?tab=chat');
    } catch (err) {
      console.error(err);
      alert('Could not send message. Please try again.');
    } finally {
      setSendingMsg(false);
      setChatModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div className="skeleton" style={{ height: '350px', width: '100%' }}></div>
        <div className="skeleton" style={{ height: '30px', width: '50%' }}></div>
        <div className="skeleton" style={{ height: '80px', width: '100%' }}></div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center' }}>
        <h2>Hostel Not Found</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>Back Home</button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn btn-text" style={{ marginBottom: '20px', paddingLeft: 0 }}>
        &larr; Back to Listings
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Images, Descriptions, Amenities, Rooms, Reviews */}
        <div>
          {/* Images Carousel */}
          {hostel.photos && hostel.photos.length > 0 ? (
            <div style={{ position: 'relative', height: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
              <img 
                src={hostel.photos[activePhotoIndex]} 
                alt={hostel.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              {hostel.photos.length > 1 && (
                <>
                  <button onClick={handlePrevPhoto} style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={handleNextPhoto} style={{ position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Counter badge */}
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.8rem' }}>
                {activePhotoIndex + 1} / {hostel.photos.length}
              </div>
            </div>
          ) : (
            <div style={{ height: '300px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}></div>
          )}

          {/* Description Section */}
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem' }}>{hostel.name}</h1>
                <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                  <MapPin size={16} /> {hostel.address}, {hostel.city}
                </p>
              </div>

              {/* Badges container */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-info" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                  {hostel.gender_type}
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '6px 14px', color: '#fff', background: 'var(--primary)' }}>
                  {hostel.property_type || 'Hostel'}
                </span>
              </div>
            </div>

            <div className="glass-card" style={{ marginTop: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Description</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{hostel.description}</p>
            </div>
          </div>

          {/* Facilities */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Hostel Facilities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
              {hostel.facilities.map((fac) => (
                <div key={fac} className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ background: 'var(--primary-light)', padding: '6px', borderRadius: '6px', color: 'var(--primary)', display: 'flex' }}>
                    {fac === 'WiFi' && <Wifi size={16} />}
                    {fac === 'Food' && <Coffee size={16} />}
                    {fac === 'Gym' && <Dumbbell size={16} />}
                    {fac !== 'WiFi' && fac !== 'Food' && fac !== 'Gym' && <Check size={16} />}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Room Types */}
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Available Room Types</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {hostel.rooms && hostel.rooms.length > 0 ? (
                hostel.rooms.map((room) => (
                  <div key={room.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{room.room_type}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Capacity: {room.capacity} beds • Available: {room.availability} left
                      </p>
                      {/* Room amenities */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {room.amenities.map(a => (
                          <span key={a} style={{ fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Price per month</p>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{room.price_per_month}</h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => navigate(`/book/${hostel.id}/${room.id}`)}
                        className="btn btn-primary"
                        disabled={room.availability <= 0}
                        style={{ width: '100%' }}
                      >
                        {room.availability > 0 ? 'Book Bed' : 'Fully Booked'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                  No active rooms cataloged for this hostel.
                </div>
              )}
            </div>
          </div>

          {/* Hostel Rules */}
          {hostel.rules && hostel.rules.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Rules & Code of Conduct</h3>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {hostel.rules.map((rule, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Guest Reviews</h3>
            
            {/* Create review form */}
            {user ? (
              <form onSubmit={submitReview} className="glass-card" style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h4 style={{ fontSize: '1.1rem' }}>Write a Review</h4>
                
                {reviewError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{reviewError}</p>}
                {reviewSuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{reviewSuccess}</p>}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="form-label" style={{ marginBottom: 0 }}>Rating:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <button 
                        key={num} 
                        type="button" 
                        onClick={() => setNewRating(num)}
                        style={{ border: 'none', background: 'transparent' }}
                      >
                        <Star size={20} fill={num <= newRating ? 'var(--warning)' : 'none'} color="var(--warning)" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Describe your stay experience (food quality, room spacing, hygiene, owner cooperative behavior)..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <div className="glass-card" style={{ marginBottom: '25px', textAlign: 'center', padding: '20px' }}>
                Please <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/auth')}>sign in</span> to leave a review.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {hostel.reviews && hostel.reviews.length > 0 ? (
                hostel.reviews.map((rev) => (
                  <div key={rev.id} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 600 }}>{rev.user_name}</p>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={12} fill={n <= rev.rating ? 'var(--warning)' : 'none'} color="var(--warning)" />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                      "{rev.comment}"
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '10px' }}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                  No reviews posted yet. Be the first!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Map & Owner Card Sticky Panel */}
        <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Owner details card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Listed by Owner</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <img 
                src={hostel.owner?.profile_pic || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'} 
                alt={hostel.owner?.full_name} 
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontSize: '1.1rem' }}>{hostel.owner?.full_name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>HostelHub Registered Owner</p>
              </div>
            </div>
            
            <button 
              onClick={() => setChatModalOpen(true)}
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <MessageSquare size={18} /> Contact Owner
            </button>
          </div>

          {/* Map Location Integration Mock */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'var(--primary-light)' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} /> Location Map
              </h3>
            </div>
            <div style={{ height: '240px', background: 'var(--bg-tertiary)', position: 'relative' }}>
              {/* Styled iframe or static vector road map mockup */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)',
                backgroundSize: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {/* Fake map drawing representing city */}
                <div style={{ position: 'absolute', width: '70%', height: '8px', background: 'var(--border-color)', transform: 'rotate(25deg)' }}></div>
                <div style={{ position: 'absolute', width: '80%', height: '8px', background: 'var(--border-color)', transform: 'rotate(-40deg)' }}></div>
                
                {/* Target Pin */}
                <div style={{ zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    background: 'var(--danger)', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 600,
                    boxShadow: 'var(--card-shadow)', whiteSpace: 'nowrap'
                  }}>
                    {hostel.name}
                  </div>
                  <div style={{ width: '10px', height: '10px', background: 'var(--danger)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg) translate(3px, -3px)', border: '2px solid #fff', marginTop: '2px' }}></div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Latitude: {hostel.latitude || '12.9103'} • Longitude: {hostel.longitude || '77.6409'}
            </div>
          </div>
        </div>
      </div>

      {/* Chat contact Modal */}
      {chatModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Send Message to Owner</h3>
              <button onClick={() => setChatModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>Close</button>
            </div>
            
            <form onSubmit={handleInitiateChat} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Message Text</label>
                <textarea 
                  className="form-input" 
                  rows="4" 
                  value={chatMsgText} 
                  onChange={(e) => setChatMsgText(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setChatModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={sendingMsg}>
                  {sendingMsg ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
