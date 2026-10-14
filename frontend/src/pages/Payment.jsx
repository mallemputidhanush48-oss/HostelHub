import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, ShieldAlert, Sparkles, Smartphone, Landmark, FileText, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment configuration
  const [method, setMethod] = useState('upi'); // 'upi', 'phonepe', 'gpay', 'card'
  
  // Card Inputs
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI Input
  const [upiId, setUpiId] = useState('');

  // Gateway Simulation State
  const [simulationState, setSimulationState] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
  const [processingMessage, setProcessingMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/bookings/${bookingId}/receipt`);
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (method === 'upi' && !upiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. user@ybl)');
      return;
    }
    
    setSimulationState('processing');
    setProcessingMessage('Connecting securely with bank gateways...');
    
    // Stage 1
    setTimeout(() => {
      setProcessingMessage('Awaiting 3D Secure verification protocol...');
    }, 1500);

    // Stage 2
    setTimeout(() => {
      setProcessingMessage('Updating HostelHub secure database ledgers...');
    }, 3000);

    // Stage 3: Success
    setTimeout(async () => {
      const txnId = `TXN${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      setTransactionId(txnId);
      
      try {
        await api.post(`/bookings/${bookingId}/pay`, {
          payment_method: method.toUpperCase(),
          transaction_id: txnId,
          amount: booking.total_amount
        });
        
        setSimulationState('success');
      } catch (err) {
        console.error(err);
        setSimulationState('failed');
      }
    }, 4500);
  };

  // Mock Receipt Download File
  const handleDownloadReceipt = () => {
    const receiptContent = `
=========================================
          HOSTELHUB RECEIPT
=========================================
Transaction ID: ${transactionId}
Booking ID:     HH-B-${booking.id}
Date:           ${new Date().toLocaleDateString()}
-----------------------------------------
GUEST INFORMATION
Name:           ${booking.guest_name}
Email:          ${booking.guest_email}
Phone:          ${booking.guest_phone || 'N/A'}
-----------------------------------------
ACCOMMODATION DETAILS
Hostel:         ${booking.hostel_name}
Address:        ${booking.hostel_address}, ${booking.hostel_city}
Room:           ${booking.room_type}
Check-In Date:  ${booking.check_in_date}
Duration:       ${booking.duration_months} Month(s)
-----------------------------------------
PAYMENT SUMMARY
Payment Method: ${method.toUpperCase()}
Status:         PAID (Success)
-----------------------------------------
TOTAL PAID:     INR ${booking.total_amount}/-
=========================================
Thank you for booking with HostelHub!
=========================================
    `;

    // Trigger local file download
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HostelHub_Receipt_HH-B-${booking.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div className="skeleton" style={{ height: '200px', width: '100%' }}></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center' }}>
        <h2>Booking Details Not Found</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>Back Home</button>
      </div>
    );
  }

  // Handle gateway overlay render
  if (simulationState === 'processing') {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
      }}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '20px' }}></div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>Processing Payment Securely</h2>
        <p style={{ color: 'var(--text-secondary)', animation: 'pulse 1.5s infinite' }}>{processingMessage}</p>
        
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (simulationState === 'success') {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: '550px', marginTop: '60px', textAlign: 'center' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px' }}>
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '20px', borderRadius: '50%' }}>
            <CheckCircle2 size={60} />
          </div>
          
          <h2 style={{ fontSize: '2rem' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your booking at <b>{booking.hostel_name}</b> has been completed and confirmed.
          </p>

          <div style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
            width: '100%', padding: '16px', borderRadius: 'var(--radius-sm)',
            textAlign: 'left', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div><b>Transaction ID:</b> {transactionId}</div>
            <div><b>Amount Paid:</b> ₹{booking.total_amount}</div>
            <div><b>Check-In Date:</b> {booking.check_in_date}</div>
          </div>

          <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '10px' }}>
            <button onClick={handleDownloadReceipt} className="btn btn-secondary" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <FileText size={18} /> Receipt
            </button>
            <button onClick={() => navigate('/dashboard/guest')} className="btn btn-primary" style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center' }}>
              Dashboard <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px', maxWidth: '850px' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Secure Checkout Portal</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Select gateway and execute payment transaction.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* Left Side: Gateways selectors */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Select Payment Method</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* UPI Option */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: method === 'upi' ? 'var(--primary-light)' : 'transparent',
              borderColor: method === 'upi' ? 'var(--primary)' : 'var(--border-color)'
            }}>
              <input type="radio" name="paymethod" checked={method === 'upi'} onChange={() => setMethod('upi')} />
              <Smartphone size={20} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 600 }}>UPI Payments (GPay, PhonePe, Bhim)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Instant transfer using virtual ID</div>
              </div>
            </label>

            {/* Debit Card Option */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: method === 'card' ? 'var(--primary-light)' : 'transparent',
              borderColor: method === 'card' ? 'var(--primary)' : 'var(--border-color)'
            }}>
              <input type="radio" name="paymethod" checked={method === 'card'} onChange={() => setMethod('card')} />
              <CreditCard size={20} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 600 }}>Credit / Debit Cards</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Visa, Mastercard, RuPay processed securely</div>
              </div>
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }}></div>

          {/* Conditional Form Rendering */}
          <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {method === 'upi' ? (
              <div className="form-group">
                <label className="form-label">UPI ID (VPA)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. amit@ybl" 
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Amit Patel" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="4111 2222 3333 4444" 
                    maxLength="19"
                    value={cardNum}
                    onChange={(e) => setCardNum(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="MM/YY" 
                      maxLength="5"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="•••" 
                      maxLength="3"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '50px', marginTop: '10px' }}>
              Authorize Payment of ₹{booking.total_amount}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Bill Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hostel</span>
                <span style={{ fontWeight: 600 }}>{booking.hostel_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Room Type</span>
                <span style={{ fontWeight: 600 }}>{booking.room_type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
                <span style={{ fontWeight: 600 }}>{booking.duration_months} Month(s)</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '5px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
                <span>Payable Amount</span>
                <span className="gradient-text">₹{booking.total_amount}</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'var(--primary-light)', border: 'none' }}>
            <Landmark size={20} color="var(--primary)" />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              PCI-DSS Security Protocol Compliant. Your bank information is fully encrypted and processed directly via standard security modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
