import React, { useState, useEffect } from 'react';
import './OrgCarbonCredits.css';
import { API_ENDPOINTS } from '../../config/api.config';

const OrgCarbonCredits = () => {
  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState({
    balance: 0,
    earned: 0,
    used: 0,
    totalCost: 0,
    transactions: [],
  });
  const [emissionData, setEmissionData] = useState({
    totalEmissions: 0,
    allowedLimit: 100, // Default 100 tCO2e
    excessEmissions: 0,
    creditsRequired: 0,
  });
  
  // Modal states
  const [showEarnModal, setShowEarnModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  
  // Form states
  const [earnForm, setEarnForm] = useState({
    credits: '',
    source: 'Solar Power',
    description: '',
    verified: true,
  });
  const [purchaseForm, setPurchaseForm] = useState({
    credits: '',
    pricePerCredit: 1500,
  });
  const [useForm, setUseForm] = useState({
    credits: '',
    reason: '',
  });
  
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // Fetch carbon credits
      const creditsResponse = await fetch(API_ENDPOINTS.ORG.CARBON_CREDITS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setCreditData(creditsData);
      }
      
      // Fetch dashboard stats for emissions
      const dashboardResponse = await fetch(API_ENDPOINTS.ORG.DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (dashboardResponse.ok) {
        const dashData = await dashboardResponse.json();
        const excess = Math.max(0, dashData.totalEmissions - dashData.allowedLimit);
        setEmissionData({
          totalEmissions: dashData.totalEmissions,
          allowedLimit: dashData.allowedLimit,
          excessEmissions: excess,
          creditsRequired: excess,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleEarnCredits = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ORG.CARBON_CREDITS}/earn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(earnForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', data.message);
        setShowEarnModal(false);
        setEarnForm({ credits: '', source: 'Solar Power', description: '', verified: true });
        fetchData();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to earn credits');
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchaseCredits = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ORG.CARBON_CREDITS}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', data.message);
        setShowPurchaseModal(false);
        setPurchaseForm({ credits: '', pricePerCredit: 1500 });
        fetchData();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to purchase credits');
    } finally {
      setProcessing(false);
    }
  };

  const handleUseCredits = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ORG.CARBON_CREDITS}/use`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(useForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', data.message);
        setShowUseModal(false);
        setUseForm({ credits: '', reason: '' });
        fetchData();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to use credits');
    } finally {
      setProcessing(false);
    }
  };

  const getComplianceStatus = () => {
    if (creditData.balance >= emissionData.creditsRequired) {
      return { status: 'Good', color: '#10b981', icon: '✅' };
    } else if (creditData.balance >= emissionData.creditsRequired * 0.5) {
      return { status: 'Warning', color: '#f59e0b', icon: '⚠️' };
    } else {
      return { status: 'Deficit', color: '#ef4444', icon: '❌' };
    }
  };

  const compliance = getComplianceStatus();

  if (loading) {
    return (
      <div className="org-carbon-credits">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading carbon credits data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="org-carbon-credits">
      {/* Header */}
      <div className="credits-header">
        <div>
          <h1>🪙 Carbon Credits</h1>
          <p>Manage your organization's carbon offset strategy</p>
        </div>
        <div className="header-actions">
          <button className="btn-earn" onClick={() => setShowEarnModal(true)}>
            🌱 Earn Credits
          </button>
          <button className="btn-purchase" onClick={() => setShowPurchaseModal(true)}>
            💰 Purchase Credits
          </button>
          <button className="btn-use" onClick={() => setShowUseModal(true)}>
            ♻️ Use Credits
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card balance">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <div className="stat-label">Credit Balance</div>
            <div className="stat-value">{creditData.balance.toFixed(2)}</div>
            <div className="stat-unit">credits available</div>
          </div>
        </div>

        <div className="stat-card emissions">
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <div className="stat-label">Total Emissions</div>
            <div className="stat-value">{emissionData.totalEmissions.toFixed(2)}</div>
            <div className="stat-unit">tCO₂e</div>
          </div>
        </div>

        <div className="stat-card required">
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <div className="stat-label">Credits Required</div>
            <div className="stat-value">{emissionData.creditsRequired.toFixed(2)}</div>
            <div className="stat-unit">to offset excess</div>
          </div>
        </div>

        <div className="stat-card compliance" style={{ borderColor: compliance.color }}>
          <div className="stat-icon">{compliance.icon}</div>
          <div className="stat-content">
            <div className="stat-label">Compliance Status</div>
            <div className="stat-value" style={{ color: compliance.color }}>
              {compliance.status}
            </div>
            <div className="stat-unit">
              {creditData.balance >= emissionData.creditsRequired 
                ? 'Fully compliant' 
                : `Need ${(emissionData.creditsRequired - creditData.balance).toFixed(2)} more`}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="info-grid">
        <div className="info-card">
          <h3>📊 Credit Summary</h3>
          <div className="info-row">
            <span>Credits Earned:</span>
            <strong>{creditData.earned.toFixed(2)}</strong>
          </div>
          <div className="info-row">
            <span>Credits Used:</span>
            <strong>{creditData.used.toFixed(2)}</strong>
          </div>
          <div className="info-row">
            <span>Total Spent:</span>
            <strong>₹{creditData.totalCost.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="info-card">
          <h3>🎯 Emission Limits</h3>
          <div className="info-row">
            <span>Allowed Limit:</span>
            <strong>{emissionData.allowedLimit.toFixed(2)} tCO₂e</strong>
          </div>
          <div className="info-row">
            <span>Current Emissions:</span>
            <strong>{emissionData.totalEmissions.toFixed(2)} tCO₂e</strong>
          </div>
          <div className="info-row">
            <span>Excess Emissions:</span>
            <strong style={{ color: emissionData.excessEmissions > 0 ? '#ef4444' : '#10b981' }}>
              {emissionData.excessEmissions.toFixed(2)} tCO₂e
            </strong>
          </div>
        </div>

        <div className="info-card">
          <h3>💡 How It Works</h3>
          <ul className="info-list">
            <li>1 credit = 1 tCO₂e offset</li>
            <li>Earn credits from verified projects</li>
            <li>Purchase at ₹500-₹3,000/credit</li>
            <li>Use credits to offset emissions</li>
          </ul>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-section">
        <h2>📜 Transaction History</h2>
        {creditData.transactions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="transaction-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Credits</th>
                  <th>Source/Reason</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {creditData.transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      {new Date(transaction.transactionDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className={`type-badge ${transaction.transactionType}`}>
                        {transaction.transactionType === 'earned' ? '🌱' : 
                         transaction.transactionType === 'purchased' ? '💰' : '♻️'}
                        {' ' + transaction.transactionType}
                      </span>
                    </td>
                    <td className="credits-cell">
                      <strong>{transaction.credits.toFixed(2)}</strong>
                    </td>
                    <td>{transaction.source || transaction.description}</td>
                    <td>
                      {transaction.totalCost 
                        ? `₹${transaction.totalCost.toLocaleString('en-IN')}`
                        : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${transaction.verified ? 'verified' : 'pending'}`}>
                        {transaction.verified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals will be added in next part */}
      
      {/* Earn Modal */}
      {showEarnModal && (
        <div className="modal-overlay" onClick={() => setShowEarnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🌱 Earn Carbon Credits</h2>
              <button className="modal-close" onClick={() => setShowEarnModal(false)}>×</button>
            </div>
            <form onSubmit={handleEarnCredits}>
              <div className="form-group">
                <label>Reduction Source *</label>
                <select 
                  value={earnForm.source}
                  onChange={(e) => setEarnForm({ ...earnForm, source: e.target.value })}
                  required
                >
                  <option value="Solar Power">Solar Power</option>
                  <option value="Wind Power">Wind Power</option>
                  <option value="Energy Efficiency">Energy Efficiency</option>
                  <option value="Waste-to-Energy">Waste-to-Energy</option>
                  <option value="Methane Capture">Methane Capture</option>
                  <option value="Tree Plantation">Tree Plantation</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Credits to Earn (tCO₂e) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={earnForm.credits}
                  onChange={(e) => setEarnForm({ ...earnForm, credits: e.target.value })}
                  placeholder="Enter reduction amount"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={earnForm.description}
                  onChange={(e) => setEarnForm({ ...earnForm, description: e.target.value })}
                  placeholder="Describe the reduction project..."
                  rows="3"
                />
              </div>

              <div className="form-info">
                ℹ️ Credits from verified projects only. Submit documentation for verification.
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEarnModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={processing}>
                  {processing ? 'Processing...' : 'Earn Credits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Purchase Carbon Credits</h2>
              <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>×</button>
            </div>
            <form onSubmit={handlePurchaseCredits}>
              <div className="form-group">
                <label>Number of Credits *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={purchaseForm.credits}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, credits: e.target.value })}
                  placeholder="Enter number of credits"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Price per Credit (₹500 - ₹3,000) *</label>
                <input
                  type="number"
                  min="500"
                  max="3000"
                  value={purchaseForm.pricePerCredit}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, pricePerCredit: parseInt(e.target.value) })}
                  required
                />
              </div>

              {purchaseForm.credits && (
                <div className="total-cost">
                  <span>Total Cost:</span>
                  <strong>₹{(purchaseForm.credits * purchaseForm.pricePerCredit).toLocaleString('en-IN')}</strong>
                </div>
              )}

              <div className="form-info">
                ℹ️ Simulation only. No actual payment will be processed.
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPurchaseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={processing}>
                  {processing ? 'Processing...' : 'Purchase Credits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Use Modal */}
      {showUseModal && (
        <div className="modal-overlay" onClick={() => setShowUseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>♻️ Use Carbon Credits</h2>
              <button className="modal-close" onClick={() => setShowUseModal(false)}>×</button>
            </div>
            <form onSubmit={handleUseCredits}>
              <div className="balance-info">
                Available Balance: <strong>{creditData.balance.toFixed(2)} credits</strong>
              </div>

              <div className="form-group">
                <label>Credits to Use *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={creditData.balance}
                  value={useForm.credits}
                  onChange={(e) => setUseForm({ ...useForm, credits: e.target.value })}
                  placeholder="Enter credits to use"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Reason for Offset</label>
                <textarea
                  value={useForm.reason}
                  onChange={(e) => setUseForm({ ...useForm, reason: e.target.value })}
                  placeholder="Describe why you're using these credits..."
                  rows="3"
                />
              </div>

              <div className="form-info">
                ℹ️ Using credits will reduce your excess emissions and improve compliance status.
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowUseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={processing}>
                  {processing ? 'Processing...' : 'Use Credits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgCarbonCredits;