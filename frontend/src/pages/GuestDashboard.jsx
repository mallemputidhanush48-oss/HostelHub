import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Heart, Bell, MessageSquare, ShieldCheck, 
  Trash2, FileText, Send, AlertCircle, Clock
} from 'lucide-react';
import { api } from '../utils/api';
import { UserContext } from '../App';

export default function GuestDashboard() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected tab
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'bookings');

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Favorites state
  const [favorites, setFavorites] = useState([]);
  const [favsLoading, setFavsLoading] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  // Chat states
  const [chats, setChats] = useState([]);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [activeChatHostelId, setActiveChatHostelId] = useState(null);
  const [activeChatUserName, setActiveChatUserName] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [chatsLoading, setChatsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    fetchFavorites();
    fetchNotifications();
    fetchChats();
  }, []);

  // Set chat active if parameter matches
  useEffect(() => {
    if (activeTab === 'chat' && chats.length > 0 && !activeChatUserId) {
      // Pick first chat
      setActiveChatUserId(chats[0].user_id);
      setActiveChatUserName(chats[0].full_name);
      setActiveChatHostelId(chats[0].hostel_id);
      fetchChatMessages(chats[0].user_id, chats[0].hostel_id);
    }
  }, [activeTab, chats]);

  const fetchBookings = async () => {
    try {
      const data = await api.get('/bookings');
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const data = await api.get('/hostels/user/favorites');
      setFavorites(data);
    } catch (e) {
      console.error(e);
    } finally {
      setFavsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/bookings/notifications');
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setNotifLoading(false);
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

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      fetchBookings();
    } catch (e) {
      alert(e.message || 'Error cancelling booking.');
    }
  };

  const handleRemoveFavorite = async (e, hostelId) => {
    e.stopPropagation();
    try {
      await api.delete(`/hostels/${hostelId}/favorite`);
      setFavorites(favorites.filter(f => f.id !== hostelId));
    } catch (e) {}
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await api.put(`/bookings/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: 1 } : n));
    } catch (e) {}
  };

  const handleMarkAllNotifRead = async () => {
    try {
      await api.put('/bookings/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: 1 })));
    } catch (e) {}
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
      fetchChats(); // Update chats list preview
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectChat = (chatUser) => {
    setActiveChatUserId(chatUser.user_id);
    setActiveChatUserName(chatUser.full_name);
    setActiveChatHostelId(chatUser.hostel_id);
    setChatMessages([]);
    fetchChatMessages(chatUser.user_id, chatUser.hostel_id);
  };

  // Receipt download mock
  const handleDownloadReceipt = async (bookingId) => {
    try {
      const bookingDetail = await api.get(`/bookings/${bookingId}/receipt`);
      const receiptContent = `
=========================================
          HOSTELHUB RECEIPT
=========================================
Transaction ID: ${bookingDetail.transaction_id || 'MOCK_TXN'}
Booking ID:     HH-B-${bookingDetail.id}
Date:           ${new Date(bookingDetail.created_at).toLocaleDateString()}
-----------------------------------------
GUEST INFORMATION
Name:           ${bookingDetail.guest_name}
Email:          ${bookingDetail.guest_email}
Phone:          ${bookingDetail.guest_phone || 'N/A'}
-----------------------------------------
ACCOMMODATION DETAILS
Hostel:         ${bookingDetail.hostel_name}
Address:        ${bookingDetail.hostel_address}, ${bookingDetail.hostel_city}
Room:           ${bookingDetail.room_type}
Check-In Date:  ${bookingDetail.check_in_date}
Duration:       ${bookingDetail.duration_months} Month(s)
-----------------------------------------
PAYMENT SUMMARY
Payment Method: ${bookingDetail.payment_method || 'UPI'}
Status:         PAID (Success)
-----------------------------------------
TOTAL PAID:     INR ${bookingDetail.total_amount}/-
=========================================
Thank you for booking with HostelHub!
=========================================
      `;

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_HH-B-${bookingId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Error fetching receipt.');
    }
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      
      {/* Sidebar navigation */}
      <div className="dashboard-sidebar">
        <h3 className="sidebar-text" style={{ paddingLeft: '18px', marginBottom: '20px', fontSize: '1rem', color: 'var(--text-tertiary)' }}>
          GUEST CENTER
        </h3>

        <button 
          onClick={() => setActiveTab('bookings')} 
          className={`sidebar-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
        >
          <Calendar size={18} />
          <span className="sidebar-text">My Bookings</span>
        </button>

        <button 
          onClick={() => setActiveTab('favorites')} 
          className={`sidebar-nav-item ${activeTab === 'favorites' ? 'active' : ''}`}
        >
          <Heart size={18} />
          <span className="sidebar-text">Favorites</span>
        </button>

        <button 
          onClick={() => setActiveTab('notifications')} 
          className={`sidebar-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
        >
          <Bell size={18} />
          <span className="sidebar-text">Notifications</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="badge badge-danger" style={{ padding: '2px 6px', fontSize: '0.65rem', marginLeft: 'auto' }}>
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('chat')} 
          className={`sidebar-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          <span className="sidebar-text">Chats</span>
        </button>
      </div>

      {/* Main dashboard content */}
      <div className="dashboard-content">
        
        {/* Tab 1: Bookings Panel */}
        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>My Accommodation Bookings</h2>
            
            {bookingsLoading ? (
              <div className="skeleton" style={{ height: '120px', width: '100%' }}></div>
            ) : bookings.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <Clock size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '15px' }} />
                <h3>No Bookings Cataloged</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '5px', marginBottom: '20px' }}>Explore premium hostels and send your initial request.</p>
                <button onClick={() => navigate('/search')} className="btn btn-primary btn-sm">Explore PGs</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {bookings.map(b => (
                  <div key={b.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '120px 2.5fr 1.5fr', gap: '20px', alignItems: 'center' }}>
                    <img 
                      src={b.hostel_photos[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=150'} 
                      alt={b.hostel_name} 
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{b.hostel_name}</h3>
                        <span className={`badge ${
                          b.status === 'paid' ? 'badge-success' : 
                          b.status === 'accepted' ? 'badge-info' : 
                          b.status === 'rejected' ? 'badge-danger' : 
                          b.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Room: <b>{b.room_type}</b> • Stay: <b>{b.duration_months} mo</b> • In: <b>{b.check_in_date}</b>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Total Amount: ₹{b.total_amount}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'stretch' }}>
                      {b.status === 'accepted' && (
                        <button onClick={() => navigate(`/pay/${b.id}`)} className="btn btn-primary btn-sm">
                          Complete Payment
                        </button>
                      )}
                      
                      {b.status === 'paid' && (
                        <button onClick={() => handleDownloadReceipt(b.id)} className="btn btn-secondary btn-sm" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <FileText size={14} /> Download Receipt
                        </button>
                      )}

                      {['pending', 'accepted'].includes(b.status) && (
                        <button onClick={() => handleCancelBooking(b.id)} className="btn btn-danger btn-sm" style={{ color: '#fff' }}>
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Favorites Panel */}
        {activeTab === 'favorites' && (
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>My Saved Accommodations</h2>
            
            {favsLoading ? (
              <div className="skeleton" style={{ height: '120px', width: '100%' }}></div>
            ) : favorites.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <Heart size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '15px' }} />
                <h3>No Favorites Saved</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>Save hostels to access them easily.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {favorites.map(h => (
                  <div key={h.id} className="glass-card" onClick={() => navigate(`/hostel/${h.id}`)} style={{ padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: '150px' }}>
                      <img src={h.photos[0] || ''} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={(e) => handleRemoveFavorite(e, h.id)}
                        className="btn btn-secondary btn-sm" 
                        style={{ position: 'absolute', top: '10px', right: '10px', padding: '6px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '1.1rem' }}>{h.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{h.city}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Notifications Panel */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.8rem' }}>Inbox Notifications</h2>
              {notifications.filter(n => !n.read).length > 0 && (
                <button onClick={handleMarkAllNotifRead} className="btn btn-secondary btn-sm">
                  Mark all as read
                </button>
              )}
            </div>

            {notifLoading ? (
              <div className="skeleton" style={{ height: '60px', width: '100%' }}></div>
            ) : notifications.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <Bell size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '15px' }} />
                <h3>Inbox Clear</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>We will notify you when things require action.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className="glass-card animate-fade-in"
                    onClick={() => handleMarkNotifRead(n.id)}
                    style={{
                      padding: '16px 20px', borderLeft: n.read ? '1px solid var(--border-color)' : '4px solid var(--primary)',
                      background: n.read ? 'var(--bg-secondary)' : 'var(--primary-light)', cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: n.read ? 600 : 800 }}>{n.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Chat Panel */}
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
                    No conversations initiated. Contact owners directly from their hostel pages.
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
                      placeholder="Type message here..." 
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
                  Select a contact conversation to review history.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
