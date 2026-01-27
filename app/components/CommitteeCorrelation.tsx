'use client';

import { useMemo } from 'react';

interface Trade {
  politician: string;
  party: 'D' | 'R' | 'I';
  chamber: 'House' | 'Senate';
  ticker: string;
  company: string;
  type: 'Purchase' | 'Sale';
  amount: string;
  filed: string;
  traded: string;
}

interface CommitteeData {
  committees: Record<string, {
    sectors: string[];
    tickers: string[];
  }>;
  members: Record<string, string[]>;
}

interface Props {
  trade: Trade;
  committeeData: CommitteeData;
  showBadge?: boolean;
}

export default function CommitteeCorrelation({ trade, committeeData, showBadge = true }: Props) {
  const analysis = useMemo(() => {
    const memberCommittees = committeeData.members[trade.politician] || [];
    
    if (memberCommittees.length === 0) {
      return { committees: [], isCorrelated: false, correlatedCommittee: null };
    }
    
    // Check if the traded ticker is in any of the member's committee sectors
    let correlatedCommittee: string | null = null;
    
    for (const committee of memberCommittees) {
      const committeeInfo = committeeData.committees[committee];
      if (committeeInfo?.tickers.includes(trade.ticker)) {
        correlatedCommittee = committee;
        break;
      }
    }
    
    return {
      committees: memberCommittees,
      isCorrelated: correlatedCommittee !== null,
      correlatedCommittee
    };
  }, [trade, committeeData]);

  if (analysis.committees.length === 0) {
    return null;
  }

  if (showBadge && !analysis.isCorrelated) {
    return null;
  }

  // Badge-only mode (for trade lists)
  if (showBadge) {
    return (
      <span 
        style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: '#000',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          marginLeft: '8px'
        }}
        title={`${trade.politician} sits on ${analysis.correlatedCommittee} committee`}
      >
        ⚠️ Committee
      </span>
    );
  }

  // Full display mode (for detail pages)
  return (
    <div style={{
      background: analysis.isCorrelated 
        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
        : '#111118',
      border: analysis.isCorrelated ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid #222',
      borderRadius: '12px',
      padding: '16px 20px',
      marginTop: '16px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '18px' }}>🏛️</span>
        <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>
          Committee Assignments
        </h4>
        {analysis.isCorrelated && (
          <span style={{
            background: '#fbbf24',
            color: '#000',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '700'
          }}>
            POTENTIAL CONFLICT
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: analysis.isCorrelated ? '16px' : 0 }}>
        {analysis.committees.map((committee) => (
          <span
            key={committee}
            style={{
              background: committee === analysis.correlatedCommittee ? '#fbbf24' : '#222',
              color: committee === analysis.correlatedCommittee ? '#000' : '#888',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: committee === analysis.correlatedCommittee ? '600' : '400'
            }}
          >
            {committee}
          </span>
        ))}
      </div>

      {analysis.isCorrelated && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px'
        }}>
          <p style={{ color: '#fbbf24', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
            ⚠️ <strong>{trade.politician}</strong> sits on the <strong>{analysis.correlatedCommittee}</strong> committee 
            and traded <strong>{trade.ticker}</strong>, which falls under that committee&apos;s oversight. 
            This could represent a potential conflict of interest.
          </p>
        </div>
      )}
    </div>
  );
}

// Standalone component to show committee info without trade context
export function CommitteeInfo({ 
  politician, 
  committeeData 
}: { 
  politician: string; 
  committeeData: CommitteeData;
}) {
  const committees = committeeData.members[politician] || [];
  
  if (committees.length === 0) {
    return (
      <div style={{
        background: '#111118',
        border: '1px solid #222',
        borderRadius: '12px',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>🏛️</span>
          <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>
            Committee Assignments
          </h4>
        </div>
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
          No committee data available for this politician.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #222',
      borderRadius: '12px',
      padding: '16px 20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>🏛️</span>
        <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: 0 }}>
          Committee Assignments
        </h4>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {committees.map((committee) => {
          const info = committeeData.committees[committee];
          return (
            <div key={committee}>
              <div style={{
                background: '#1a1a2e',
                padding: '10px 14px',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#fff', fontWeight: '500', marginBottom: '4px' }}>
                  {committee}
                </div>
                {info && (
                  <div style={{ color: '#666', fontSize: '11px' }}>
                    Sectors: {info.sectors.slice(0, 4).join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Utility function to check correlation for a list of trades
export function analyzeTradesForCorrelation(
  trades: Trade[],
  committeeData: CommitteeData
): { trade: Trade; isCorrelated: boolean; committee: string | null }[] {
  return trades.map(trade => {
    const memberCommittees = committeeData.members[trade.politician] || [];
    
    for (const committee of memberCommittees) {
      const committeeInfo = committeeData.committees[committee];
      if (committeeInfo?.tickers.includes(trade.ticker)) {
        return { trade, isCorrelated: true, committee };
      }
    }
    
    return { trade, isCorrelated: false, committee: null };
  });
}
