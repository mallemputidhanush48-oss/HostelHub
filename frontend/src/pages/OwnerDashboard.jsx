import React, { useState, useEffect, useContext } from 'react';
import { 
  Building, Calendar, PlusCircle, BarChart3, MessageSquare, 
  Trash2, ShieldCheck, Check, X, DollarSign, Users, Award, Send
} from 'lucide-react';
import { api } from '../utils/api';
import { UserContext } from '../App';

export default function OwnerDashboard() {
  const { user } = useContext(UserContext);

  // Tab state
  const [activeTab, setActiveTab] = useState('analytics');

  // Stats state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Add Hostel form state
  const [hName, setHName] = useState('');
  const [hAddress, setHAddress] = useState('');
  const [hCity, setHCity] = useState('');
  const [hDesc, setHDesc] = useState('');
  const [hGender, setHGender] = useState('co-living');
  const [hPropertyType, setHPropertyType] = useState('Hostel');
  const [hRules, setHRules] = useState('');
  const [hPhotos, setHPhotos] = useState('');
  const [hFacilities, setHFacilities] = useState({ WiFi: true, Food: true, Gym: false, Laundry: false, CCTV: true });
  const [addingHostel, setAddingHostel] = useState(false);
  const [hostelSuccess, setHostelSuccess] = useState('');
  const [hostelError, setHostelError] = useState('');

  // Room management states
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [rType, setRType] = useState('Double Sharing');
  const [rCapacity, setRCapacity] = useState(10);
  const [rPrice, setRPrice] = useState(6000);
  const [rAvail, setRAvail] = useState(10);
  const [rAmenities, setRAmenities] = useState({ AC: false, AttachedWashroom: true, StudyDesk: true, Balcony: false });
  const [addingRoom, setAddingRoom] = useState(false);
  const [roomSuccess, setRoomSuccess] = useState('');
  const [roomError, setRoomError] = useState('');

  // Chats state
  const [chats, setChats] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [activeChatHostelId, setActiveChatHostelId] = useState(null);
  const [activeChatUserName, setActiveChatUserName] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [chatsLoading, setChatsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchBookings();
    fetchChats();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await api.get('/analytics/owner');
      setAnalytics(data);
      if (data.hostelsSummary && data.hostelsSummary.length > 0) {
        setSelectedHostelId(data.hostelsSummary[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await api.get('/bookings');
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchChats = async () => {
    try {
      const data = await api.get('/chat/list');
      setChats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchChatMessages = async (userId, hostelId) => {
    try {
      const queryStr = hostelId ? `?hostel_id=${hostelId}` : '';
      const list = await api.get(`/chat/history/${userId}${queryStr}`);
      setChatMessages(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    // action: 'accepted' or 'rejected'
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: action });
      fetchBookings();
      fetchAnalytics(); // Refresh totals and occupancy
    } catch (e) {
      alert(e.message || 'Error processing action.');
    }
  };

  const handleAddHostel = async (e) => {
    e.preventDefault();
    setHostelError('');
    setHostelSuccess('');
    setAddingHostel(true);

    const photosList = hPhotos.trim() ? hPhotos.split('\n') : [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800'
    ];
    const rulesList = hRules.trim() ? hRules.split('\n') : ['No curfew', 'Maintain clean rooms'];
    const facilitiesList = Object.keys(hFacilities).filter(k => hFacilities[k]);

    try {
      await api.post('/hostels', {
        name: hName,
        address: hAddress,
        city: hCity,
        description: hDesc,
        gender_type: hGender,
        property_type: hPropertyType,
        rules: rulesList,
        photos: photosList,
        facilities: facilitiesList
      });

      setHostelSuccess('PG/Hostel listing submitted for Admin Approval!');
      setHName('');
      setHAddress('');
      setHCity('');
      setHDesc('');
      setHRules('');
      setHPhotos('');
      fetchAnalytics(); // reload owner list
    } catch (err) {
      setHostelError(err.message || 'Error creating hostel.');
    } finally {
      setAddingHostel(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setRoomError('');
    setRoomSuccess('');
    if (!selectedHostelId) {
      setRoomError('Please choose a hostel to attach rooms to.');
      return;
    }
    setAddingRoom(true);

    const amenitiesList = Object.keys(rAmenities).filter(k => rAmenities[k]);

    try {
      await api.post(`/hostels/${selectedHostelId}/rooms`, {
        room_type: rType,
        capacity: parseInt(rCapacity),
        price_per_month: parseFloat(rPrice),
        availability: parseInt(rAvail),
        amenities: amenitiesList
      });

      setRoomSuccess(`Room type (${rType}) configured successfully!`);
      setRPrice(6000);
      setRCapacity(10);
      setRAvail(10);
      fetchAnalytics(); // Refresh capacity stats
    } catch (err) {
      setRoomError(err.message || 'Error configuring rooms.');
    } finally {
      setAddingRoom(false);
    }
  };

  const handleSelectChat = (chatUser) => {
    setActiveChatUserId(chatUser.user_id);
    setActiveChatUserName(chatUser.full_name);
    setActiveChatHostelId(chatUser.hostel_id);
    setChatMessages([]);
    fetchChatMessages(chatUser.user_id, chatUser.hostel_id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsgText.trim() || !activeChatUserId) return;

    try {
      const sent = await api.post('/chat/send', {
        receiver_id: activeChatUserId,
        hostel_id: activeChatHostelId,
        message: newMsgText
      });
      setChatMessages([...chatMessages, sent]);
      setNewMsgText('');
      fetchChats();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <h3 className="sidebar-text" style={{ paddingLeft: '18px', marginBottom: '20px', fontSize: '1rem', color: 'var(--text-tertiary)' }}>
          OWNER DESK
        </h3>

        <button onClick={() => setActiveTab('analytics')} className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span className="sidebar-text">Analytics Summary</span>
        </button>

        <button onClick={() => setActiveTab('listings')} className={`sidebar-nav-item ${activeTab === 'listings' ? 'active' : ''}`}>
          <Building size={18} />
          <span className="sidebar-text">My PGs & Rooms</span>
        </button>

        <button onClick={() => setActiveTab('bookings')} className={`sidebar-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}>
          <Calendar size={18} />
          <span className="sidebar-text">Guest Bookings</span>
          {bookings.filter(b => b.status === 'pending').length > 0 && (
            <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '0.65rem', marginLeft: 'auto' }}>
              {bookings.filter(b => b.status === 'pending').length}
            </span>
          )}
        </button>

        <button onClick={() => setActiveTab('chat')} className={`sidebar-nav-item ${activeTab === 'chat' ? 'active' : ''}`}>
          <MessageSquare size={18} />
          <span className="sidebar-text">Guest Chats</span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="dashboard-content">
        
        {/* Tab 1: Analytics summary */}
        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Business Performance Analytics</h2>
            
            {loadingAnalytics ? (
              <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
            ) : !analytics ? (
              <p>No statistics loaded.</p>
            ) : (
              <>
                {/* Stats grid cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}>
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Earnings</p>
                      <h3 style={{ fontSize: '1.6rem' }}>₹{analytics.totalRevenue}</h3>
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
                      <Award size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Occupancy Rate</p>
                      <h3 style={{ fontSize: '1.6rem' }}>{analytics.occupancyRate}%</h3>
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--info-light)', color: 'var(--info)', padding: '12px', borderRadius: '12px' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Bookings</p>
                      <h3 style={{ fontSize: '1.6rem' }}>{analytics.totalBookings}</h3>
                    </div>
                  </div>
                </div>

                {/* Earnings Monthly CSS Graphic Chart */}
                <div className="glass-card" style={{ padding: '30px', marginBottom: '40px' }}>
                  <h3>Monthly Earnings Graph (₹)</h3>
                  {analytics.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
                    <div className="chart-container">
                      {analytics.monthlyRevenue.map((data, index) => {
                        const heights = [30, 50, 75, 95];
                        const ht = heights[index % heights.length];
                        return (
                          <div key={data.month} className="chart-bar-wrapper">
                            <div className="chart-bar" style={{ height: `${ht}%` }}>
                              <div className="chart-tooltip">₹{data.amount}</div>
                            </div>
                            <div className="chart-label">{data.month}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '20px' }}>
                      No payments received yet to populate the revenue chart.
                    </p>
                  )}
                </div>

                {/* Hostels Summary grid list */}
                <h3 style={{ marginBottom: '15px' }}>Listed Properties Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {analytics.hostelsSummary.map(h => (
                    <div key={h.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', gap: '20px', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{h.name}</h4>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{h.gender_type}</span>
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem', color: '#fff', background: 'var(--primary)' }}>{h.property_type || 'Hostel'}</span>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</p>
                        <span className={`badge ${h.verified === 1 ? 'badge-success' : 'badge-warning'}`}>
                          {h.verified === 1 ? 'Approved' : 'Pending Verification'}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Capacity Occupancy</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${h.occupancyPercent}%`, height: '100%', background: 'var(--success)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{h.occupancyPercent}%</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rating</div>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                          <Star size={12} fill="var(--warning)" color="var(--warning)" /> {h.rating || '0.0'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: PG & Room Listings & Creation panel */}
        {activeTab === 'listings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
            {/* Add Hostel form */}
            <form onSubmit={handleAddHostel} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Add New PG/Hostel Listing</h3>
              
              {hostelSuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{hostelSuccess}</p>}
              {hostelError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{hostelError}</p>}

              <div className="form-group">
                <label className="form-label">Hostel/PG Name</label>
                <input type="text" className="form-input" placeholder="e.g. Cozy Corner Girls PG" value={hName} onChange={(e) => setHName(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" placeholder="Line 24, Road sector" value={hAddress} onChange={(e) => setHAddress(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" placeholder="e.g. Bangalore" value={hCity} onChange={(e) => setHCity(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" placeholder="Provide general facilities info, close landmarks..." value={hDesc} onChange={(e) => setHDesc(e.target.value)}></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Allowed Gender</label>
                  <select className="form-input" value={hGender} onChange={(e) => setHGender(e.target.value)}>
                    <option value="co-living">Co-Living</option>
                    <option value="boys">Boys only</option>
                    <option value="girls">Girls only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select className="form-input" value={hPropertyType} onChange={(e) => setHPropertyType(e.target.value)}>
                    <option value="Hostel">Hostel</option>
                    <option value="PG">Paying Guest (PG)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rules List (One per line)</label>
                <textarea className="form-input" rows="2" placeholder="e.g. Curfew at 10 PM" value={hRules} onChange={(e) => setHRules(e.target.value)}></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Photos URLs (One per line)</label>
                <textarea className="form-input" rows="2" placeholder="e.g. https://image-url.com" value={hPhotos} onChange={(e) => setHPhotos(e.target.value)}></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={addingHostel}>
                {addingHostel ? 'Listing...' : 'Submit Hostel Listing'}
              </button>
            </form>

            {/* Room Management Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleAddRoom} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Add/Configure Room Types</h3>
                
                {roomSuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{roomSuccess}</p>}
                {roomError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{roomError}</p>}

                <div className="form-group">
                  <label className="form-label">Select Hostel/PG</label>
                  <select 
                    className="form-input"
                    value={selectedHostelId}
                    onChange={(e) => setSelectedHostelId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Hostel --</option>
                    {analytics?.hostelsSummary.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Room Type</label>
                    <select className="form-input" value={rType} onChange={(e) => setRType(e.target.value)}>
                      <option value="Single Sharing">Single Sharing</option>
                      <option value="Double Sharing">Double Sharing</option>
                      <option value="Triple Sharing">Triple Sharing</option>
                      <option value="Dormitory">Dormitory</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pricing (₹/month)</label>
                    <input type="number" className="form-input" value={rPrice} onChange={(e) => setRPrice(e.target.value)} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Bed Capacity</label>
                    <input type="number" className="form-input" value={rCapacity} onChange={(e) => setRCapacity(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available Slots</label>
                    <input type="number" className="form-input" value={rAvail} onChange={(e) => setRAvail(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={addingRoom}>
                  {addingRoom ? 'Configuring...' : 'Add Room Configuration'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Guest Bookings lists */}
        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Guest Booking Requests</h2>
            
            {loadingBookings ? (
              <div className="skeleton" style={{ height: '100px', width: '100%' }}></div>
            ) : bookings.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <Calendar size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '15px' }} />
                <h3>No Booking Requests</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>When guests request booking, it will show up here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {bookings.map(b => (
                  <div key={b.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{b.hostel_name}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Guest: <b>{b.guest_name}</b> ({b.guest_email} • {b.guest_phone || 'No phone'})
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Type: {b.room_type} • Duration: {b.duration_months} mo • Check-in: {b.check_in_date}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Request Total</p>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{b.total_amount}</h4>
                      <span className={`badge ${
                        b.status === 'paid' ? 'badge-success' : 
                        b.status === 'accepted' ? 'badge-info' : 
                        b.status === 'rejected' ? 'badge-danger' : 
                        b.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                      }`} style={{ marginTop: '4px' }}>
                        {b.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      {b.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleBookingAction(b.id, 'accepted')}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '8px', borderRadius: '50%' }}
                            title="Accept Request"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => handleBookingAction(b.id, 'rejected')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '8px', borderRadius: '50%' }}
                            title="Reject Request"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Processed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Guest Chats */}
        {activeTab === 'chat' && (
          <div className="glass-card" style={{
            display: 'grid', gridTemplateColumns: '240px 1fr', height: 'calc(100vh - 180px)',
            padding: 0, overflow: 'hidden'
          }}>
            
            {/* Chats Contacts List */}
            <div style={{ borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>
                Conversations
              </div>
              <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                {chatsLoading ? (
                  <div className="skeleton" style={{ height: '40px', margin: '10px' }}></div>
                ) : chats.length === 0 ? (
                  <p style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No messages received yet.
                  </p>
                ) : (
                  chats.map(chat => (
                    <div 
                      key={chat.user_id} 
                      onClick={() => handleSelectChat(chat)}
                      style={{
                        padding: '16px', cursor: 'pointer', borderBottom: '1px solid var(--bg-primary)',
                        background: activeChatUserId === chat.user_id ? 'var(--primary-light)' : 'transparent',
                        color: activeChatUserId === chat.user_id ? 'var(--primary)' : 'inherit'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{chat.full_name}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
                        {chat.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Conversation Messages Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {activeChatUserId ? (
                <>
                  {/* Chat User Header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
                    Chatting with {activeChatUserName}
                  </div>

                  {/* Messages Flow Area */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {chatMessages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div 
                          key={msg.id}
                          style={{
                            maxWidth: '70%', alignSelf: isMe ? 'flex-end' : 'flex-start',
                            background: isMe ? 'var(--primary)' : 'var(--bg-tertiary)',
                            color: isMe ? '#fff' : 'var(--text-primary)',
                            padding: '10px 14px', borderRadius: '12px',
                            borderBottomRightRadius: isMe ? '2px' : '12px',
                            borderBottomLeftRadius: isMe ? '12px' : '2px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <p style={{ fontSize: '0.9rem' }}>{msg.message}</p>
                          <span style={{ fontSize: '0.65rem', opacity: 0.7, display: 'block', textAlign: 'right', marginTop: '4px' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Text Input Panel */}
                  <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Type reply here..." 
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '12px' }}>
                      <Send size={16} />
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
                  Select a guest conversation to chat with them.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
