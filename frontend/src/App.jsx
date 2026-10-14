import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Sun, Moon, User, LogOut, LayoutDashboard, Search, Heart, 
  Bell, MessageSquare, Compass, ShieldAlert, CheckCircle, Menu, X
} from 'lucide-react';
import { api } from './utils/api';

// Create Contexts
export const UserContext = createContext();
export const ThemeContext = createContext();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return children;
};

// Navbar Component
const Navbar = () => {
  const { user, logout } = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="glass-card" style={{
      position: 'sticky', top: 0, zIndex: 100, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
      borderRadius: 0, padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem'
        }}>
          H
        </div>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          Hostel<span className="gradient-text">Hub</span>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="desktop-menu" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/search" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
          <Compass size={18} /> Explore
        </Link>

        {user ? (
          <>
            <Link to={`/dashboard/${user.role}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
              <User size={18} /> Profile
            </Link>
            <button onClick={logout} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="btn btn-primary btn-sm">Sign In</Link>
        )}

        <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ padding: '8px', borderRadius: '50%' }}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Mobile Toggle */}
      <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none' }}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

// Footer Component
const Footer = () => (
  <footer className="glass-card" style={{
    borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderRadius: 0,
    padding: '40px 20px', marginTop: '60px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)'
  }}>
    <div className="container">
      <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '10px' }}>HostelHub</p>
      <p style={{ marginBottom: '20px' }}>Your ultimate home away from home booking partner.</p>
      <p>© {new Date().getFullYear()} HostelHub. Built with precision and elegance.</p>
    </div>
  </footer>
);

// Import page placeholders (we will define pages in pages/ directory)
import Home from './pages/Home';
import Auth from './pages/Auth';
import SearchResults from './pages/SearchResults';
import HostelDetails from './pages/HostelDetails';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import GuestDashboard from './pages/GuestDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Load User and Theme on Startup
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('hostelhub_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Profile check
    const checkUser = async () => {
      const token = localStorage.getItem('hostelhub_token');
      if (token) {
        try {
          const profile = await api.get('/auth/profile');
          setUser(profile);
        } catch (err) {
          console.error('Invalid token, logging out.');
          localStorage.removeItem('hostelhub_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('hostelhub_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('hostelhub_token');
    setUser(null);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('hostelhub_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, loading, refreshProfile: async () => {
      try {
        const profile = await api.get('/auth/profile');
        setUser(profile);
      } catch (e) {}
    } }}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <Router>
          <div className="app-container">
            <Navbar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/hostel/:id" element={<HostelDetails />} />
                
                {/* Protected Routes */}
                <Route path="/book/:hostelId/:roomId" element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                } />
                <Route path="/pay/:bookingId" element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Dashboard Role Protections */}
                <Route path="/dashboard/guest" element={
                  <ProtectedRoute allowedRoles={['guest', 'admin']}>
                    <GuestDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/owner" element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Catch-all redirection */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </Router>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}
