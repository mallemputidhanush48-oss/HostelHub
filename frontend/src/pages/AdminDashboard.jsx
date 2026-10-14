import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutGrid, Users, DollarSign, Calendar, 
  Trash2, Eye, Ban, CheckCircle, AlertCircle
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const stats = await api.get('/analytics/admin');
      setData(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveHostel = async (id, status) => {
    // status: 1 (approve), -1 (reject/block)
    const phrase = status === 1 ? 'approve' : 'block/reject';
    if (!window.confirm(`Are you sure you want to ${phrase} this hostel?`)) return;
    
    try {
      await api.put(`/hostels/${id}/verify`, { verified: status });
      fetchAdminData();
    } catch (e) {
      alert(e.message || 'Error executing verification update.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? All associated items will be deleted.')) return;
    try {
      await api.delete(`/analytics/admin/users/${userId}`);
      fetchAdminData();
    } catch (e) {
      alert(e.message || 'Error deleting user.');
    }
  };

  return (
    <div className="dashboard-layout animate-fade-in">
      
      {/* Sidebar navigation */}
      <div className="dashboard-sidebar">
        <h3 className="sidebar-text" style={{ paddingLeft: '18px', marginBottom: '20px', fontSize: '1rem', color: 'var(--text-tertiary)' }}>
          ADMIN SECURITY
        </h3>

        <button onClick={() => setActiveTab('overview')} className={`sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
          <LayoutGrid size={18} />
          <span className="sidebar-text">System Overview</span>
        </button>

        <button onClick={() => setActiveTab('verifications')} className={`sidebar-nav-item ${activeTab === 'verifications' ? 'active' : ''}`}>
          <ShieldCheck size={18} />
          <span className="sidebar-text">Verification Queue</span>
          {data?.hostels.filter(h => h.verified === 0).length > 0 && (
            <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '0.65rem', marginLeft: 'auto' }}>
              {data.hostels.filter(h => h.verified === 0).length}
            </span>
          )}
        </button>

        <button onClick={() => setActiveTab('listings')} className={`sidebar-nav-item ${activeTab === 'listings' ? 'active' : ''}`}>
          <Eye size={18} />
          <span className="sidebar-text">Manage Listings</span>
        </button>

        <button onClick={() => setActiveTab('users')} className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}>
          <Users size={18} />
          <span className="sidebar-text">Manage Users</span>
        </button>
      </div>

      {/* Main panel content */}
      <div className="dashboard-content">
        
        {loading ? (
          <div className="skeleton" style={{ height: '300px', width: '100%' }}></div>
        ) : !data ? (
          <p>No statistics loaded.</p>
        ) : (
          <>
            {/* Tab 1: System Overview */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>System Control Overview</h2>
                
                {/* Stats cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                  <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}>
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System Revenue</p>
                      <h3 style={{ fontSize: '1.6rem' }}>₹{data.totalRevenue}</h3>
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bookings Logged</p>
                      <h3 style={{ fontSize: '1.6rem' }}>{data.totalBookings}</h3>
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--info-light)', color: 'var(--info)', padding: '12px', borderRadius: '12px' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Guests</p>
                      <h3 style={{ fontSize: '1.6rem' }}>{data.userStats.guest}</h3>
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '12px', borderRadius: '12px' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Owners</p>
                      <h3 style={{ fontSize: '1.6rem' }}>{data.userStats.owner}</h3>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                  {/* Verification Quick Alert */}
                  <div className="glass-card">
                    <h3>Hostels Statistics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Approved & Live Hostels</span>
                        <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>{data.hostelStats.approved} Live</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Pending Verification</span>
                        <span className="badge badge-warning" style={{ fontSize: '0.9rem' }}>{data.hostelStats.pending} Pending</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Blocked / Flagged Hostels</span>
                        <span className="badge badge-danger" style={{ fontSize: '0.9rem' }}>{data.hostelStats.blocked} Blocked</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'var(--primary-light)', border: 'none' }}>
                    <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '15px' }} />
                    <h3>System Health: OK</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem', maxWidth: '300px' }}>
                      All databases are operational. System handles encrypted transactions and automated occupancy calculations in real-time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Verification Queue */}
            {activeTab === 'verifications' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Listing Verification Queue</h2>
                
                {data.hostels.filter(h => h.verified === 0).length === 0 ? (
                  <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <CheckCircle size={40} style={{ color: 'var(--success)', marginBottom: '15px' }} />
                    <h3>Verification Queue Empty</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>No properties are currently awaiting authorization.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {data.hostels.filter(h => h.verified === 0).map(h => (
                      <div key={h.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{h.name}</h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Location: {h.address}, {h.city}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Owner: <b>{h.owner_name}</b> ({h.owner_email})
                          </p>
                        </div>
                        
                        <div>
                          <span className="badge badge-warning">Awaiting Approval</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleApproveHostel(h.id, 1)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            onClick={() => handleApproveHostel(h.id, -1)}
                            className="btn btn-danger btn-sm"
                            style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Ban size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Manage Listings */}
            {activeTab === 'listings' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>All Hostel Listings</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {data.hostels.map(h => (
                    <div key={h.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{h.name}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>City: {h.city} • Owner: {h.owner_name}</p>
                      </div>
                      
                      <div>
                        <span className={`badge ${h.verified === 1 ? 'badge-success' : h.verified === -1 ? 'badge-danger' : 'badge-warning'}`}>
                          {h.verified === 1 ? 'Approved/Live' : h.verified === -1 ? 'Blocked/Faked' : 'Pending'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        {h.verified === 1 ? (
                          <button 
                            onClick={() => handleApproveHostel(h.id, -1)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Ban size={14} /> Block PG
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleApproveHostel(h.id, 1)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <CheckCircle size={14} /> Unblock/Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Manage Users */}
            {activeTab === 'users' && (
              <div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Registered User Directory</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.users.map(u => (
                    <div key={u.id} className="glass-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{u.full_name}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Email: {u.email} {u.phone && `• Phone: ${u.phone}`}
                        </p>
                      </div>
                      
                      <div>
                        <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'owner' ? 'badge-info' : 'badge-success'}`}>
                          {u.role}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {u.role !== 'admin' ? (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn btn-danger btn-sm"
                            style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Trash2 size={14} /> Delete User
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Protected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
