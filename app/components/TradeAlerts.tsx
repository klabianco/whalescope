'use client';

import { useState, useEffect } from 'react';

interface AlertPreferences {
  politicians: string[];
  sectors: string[];
  minAmount: string;
  unusualActivity: boolean;
}

interface Subscription {
  email: string;
  preferences: AlertPreferences;
  subscribedAt: string;
}

const SECTORS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Energy',
  'Defense',
  'Consumer',
  'Real Estate',
  'Industrials'
];

const AMOUNT_THRESHOLDS = [
  { label: 'Any amount', value: '0' },
  { label: '$15,000+', value: '15000' },
  { label: '$50,000+', value: '50000' },
  { label: '$100,000+', value: '100000' },
  { label: '$500,000+', value: '500000' },
];

interface Props {
  politicians?: string[];
  defaultPolitician?: string;
  compact?: boolean;
}

export default function TradeAlerts({ politicians = [], defaultPolitician, compact = false }: Props) {
  const [email, setEmail] = useState('');
  const [selectedPoliticians, setSelectedPoliticians] = useState<string[]>(
    defaultPolitician ? [defaultPolitician] : []
  );
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState('0');
  const [unusualActivity, setUnusualActivity] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(!compact);
  const [existingSubscription, setExistingSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    // Check for existing subscription in localStorage
    const saved = localStorage.getItem('whalescope_alerts');
    if (saved) {
      try {
        const data = JSON.parse(saved) as Subscription;
        setExistingSubscription(data);
        setEmail(data.email);
        setSelectedPoliticians(data.preferences.politicians);
        setSelectedSectors(data.preferences.sectors);
        setMinAmount(data.preferences.minAmount);
        setUnusualActivity(data.preferences.unusualActivity);
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Save to localStorage for MVP
    const subscription: Subscription = {
      email,
      preferences: {
        politicians: selectedPoliticians,
        sectors: selectedSectors,
        minAmount,
        unusualActivity
      },
      subscribedAt: new Date().toISOString()
    };

    localStorage.setItem('whalescope_alerts', JSON.stringify(subscription));
    
    // In production, this would POST to a backend API
    console.log('Subscription saved:', subscription);
    
    setSubscribed(true);
    setExistingSubscription(subscription);
  };

  const handleUnsubscribe = () => {
    localStorage.removeItem('whalescope_alerts');
    setExistingSubscription(null);
    setSubscribed(false);
    setEmail('');
    setSelectedPoliticians([]);
    setSelectedSectors([]);
    setMinAmount('0');
    setUnusualActivity(true);
  };

  const togglePolitician = (name: string) => {
    setSelectedPoliticians(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const toggleSector = (sector: string) => {
    setSelectedSectors(prev =>
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    );
  };

  if (subscribed && !showAdvanced) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
        padding: compact ? '16px 20px' : '24px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
        <p style={{ color: '#fff', fontWeight: '600', marginBottom: '8px' }}>
          You&apos;re subscribed!
        </p>
        <p style={{ color: '#86efac', fontSize: '13px' }}>
          We&apos;ll notify you at {email}
        </p>
        <button
          onClick={() => setShowAdvanced(true)}
          style={{
            marginTop: '12px',
            background: 'transparent',
            border: '1px solid #444',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Edit Preferences
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
      padding: compact ? '20px' : '32px',
      borderRadius: '16px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: compact ? '20px' : '24px', marginBottom: '8px', color: '#fff' }}>
          🔔 Trade Alerts
        </h3>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Get notified when politicians make moves
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#111118',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

        {/* Advanced Options Toggle */}
        {compact && !showAdvanced && (
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#60a5fa',
              fontSize: '13px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ⚙️ Customize alerts
          </button>
        )}

        {/* Advanced Options */}
        {showAdvanced && (
          <>
            {/* Politicians */}
            {politicians.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>
                  Watch specific politicians:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {politicians.slice(0, 10).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => togglePolitician(name)}
                      style={{
                        padding: '6px 12px',
                        background: selectedPoliticians.includes(name) ? '#333' : '#222',
                        color: selectedPoliticians.includes(name) ? '#000' : '#888',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {name.split(' ').slice(-1)[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sectors */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>
                Sectors of interest:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SECTORS.map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => toggleSector(sector)}
                    style={{
                      padding: '6px 12px',
                      background: selectedSectors.includes(sector) ? '#60a5fa' : '#222',
                      color: selectedSectors.includes(sector) ? '#000' : '#888',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '13px', marginBottom: '8px' }}>
                Minimum trade size:
              </label>
              <select
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#222',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {AMOUNT_THRESHOLDS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Unusual Activity Toggle */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={unusualActivity}
                onChange={(e) => setUnusualActivity(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#666' }}
              />
              <span style={{ color: '#ccc', fontSize: '14px' }}>
                Alert me about unusual trading activity
              </span>
            </label>
          </>
        )}

        {/* Error Message */}
        {error && (
          <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {existingSubscription ? 'Update Preferences' : 'Subscribe to Alerts'}
        </button>

        {/* Unsubscribe */}
        {existingSubscription && (
          <button
            type="button"
            onClick={handleUnsubscribe}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              background: 'transparent',
              color: '#666',
              border: '1px solid #333',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Unsubscribe
          </button>
        )}
      </form>

      {/* MVP Notice */}
      <p style={{ 
        color: '#666', 
        fontSize: '11px', 
        textAlign: 'center', 
        marginTop: '16px' 
      }}>
        🔒 Stored locally. Production version coming soon.
      </p>
    </div>
  );
}
