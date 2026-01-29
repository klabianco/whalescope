'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Shared types ──

export interface FilterTab {
  key: string;
  label: string;
  /** Optional accent color override (default: #4ade80) */
  color?: string;
  /** Optional count badge */
  count?: number;
}

export interface TradeCardProps {
  /** Left badge */
  badge: { label: string; bg: string; color: string };
  /** Primary actor name */
  actor: string;
  /** Link for the actor */
  actorHref: string;
  /** Secondary info next to actor (party, wallet value, etc.) */
  actorMeta?: React.ReactNode;
  /** Extra badges/components after actor line */
  extras?: React.ReactNode;
  /** Right side of header row (date, filed time) */
  timestamp: string;
  /** Main highlight text (ticker, token symbol) */
  highlight: string;
  /** Text next to highlight (company name, token amount) */
  highlightMeta?: string;
  /** Right side of bottom row */
  bottomRight?: React.ReactNode;
  /** Card background override */
  background?: string;
  /** Card border override */
  border?: string;
}

// ── Shared components ──

const TRADES_PER_PAGE = 25;

export function FilterTabs({ 
  tabs, 
  active, 
  onChange 
}: { 
  tabs: FilterTab[]; 
  active: string; 
  onChange: (key: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const accentColor = tab.color || '#4ade80';
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              padding: '8px 16px',
              background: isActive ? accentColor : '#222',
              color: isActive ? '#000' : '#888',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                background: isActive ? 'rgba(0,0,0,0.2)' : '#333',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ProUpsellBanner({ 
  count, 
  label = 'trade',
  description = 'Pro members see new trades instantly. Free users get a 24h delay.',
}: { 
  count: number; 
  label?: string;
  description?: string;
}) {
  if (count <= 0) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <div>
        <p style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600', margin: 0 }}>
          🔒 {count} {label}{count > 1 ? 's' : ''} in the last 24h
        </p>
        <p style={{ color: '#71717a', fontSize: '13px', margin: '4px 0 0' }}>
          {description}
        </p>
      </div>
      <Link href="/pricing" style={{ textDecoration: 'none' }}>
        <button style={{
          background: '#22c55e',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          Upgrade to Pro
        </button>
      </Link>
    </div>
  );
}

export function TradeCard({
  badge,
  actor,
  actorHref,
  actorMeta,
  extras,
  timestamp,
  highlight,
  highlightMeta,
  bottomRight,
  background,
  border,
}: TradeCardProps) {
  return (
    <div style={{
      background: background || '#111118',
      border: border || '1px solid #222',
      borderRadius: '12px',
      padding: '16px 20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            background: badge.bg,
            color: badge.color,
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
          }}>
            {badge.label}
          </span>
          <div>
            <Link
              href={actorHref}
              style={{ color: '#fff', fontWeight: '600', textDecoration: 'none' }}
            >
              {actor}
            </Link>
            {actorMeta && (
              <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                {actorMeta}
              </span>
            )}
          </div>
          {extras}
        </div>
        <span style={{ color: '#666', fontSize: '13px', whiteSpace: 'nowrap' }}>
          {timestamp}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '18px' }}>
            {highlight}
          </span>
          {highlightMeta && (
            <span style={{ color: '#888', marginLeft: '8px' }}>
              {highlightMeta}
            </span>
          )}
        </div>
        {bottomRight}
      </div>
    </div>
  );
}

export function ShowMoreButton({
  remaining,
  onClick,
}: {
  remaining: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#1a1a2e',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '14px',
        color: '#4ade80',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '8px',
        width: '100%',
      }}
    >
      Show More ({remaining} remaining)
    </button>
  );
}

export function ProPaywall({ hiddenCount }: { hiddenCount: number }) {
  if (hiddenCount <= 0) return null;
  return (
    <Link href="/pricing" style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, #111118 100%)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        marginTop: '8px',
      }}>
        <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: '600', margin: '0 0 4px' }}>
          🔒 {hiddenCount} more trade{hiddenCount > 1 ? 's' : ''} available with Pro
        </p>
        <p style={{ color: '#71717a', fontSize: '13px', margin: 0 }}>
          Get full trade history, real-time alerts, and analytics →
        </p>
      </div>
    </Link>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      background: '#111118',
      padding: '40px',
      borderRadius: '12px',
      textAlign: 'center',
      color: '#666',
    }}>
      {message}
    </div>
  );
}

/**
 * Generic paginated trade feed with pro gating.
 * Pass renderCard to customise each row.
 */
export function TradeFeedList<T>({
  trades,
  isPro,
  renderCard,
  emptyMessage = 'No trades found.',
}: {
  trades: T[];
  isPro: boolean;
  renderCard: (trade: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(TRADES_PER_PAGE);
  const FREE_TRADE_LIMIT = 25;

  const visibleTrades = isPro ? trades : trades.slice(0, FREE_TRADE_LIMIT);
  const hiddenTradeCount = isPro ? 0 : Math.max(0, trades.length - FREE_TRADE_LIMIT);

  if (trades.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {visibleTrades.slice(0, visibleCount).map((trade, i) => renderCard(trade, i))}
      {visibleCount < visibleTrades.length && (
        <ShowMoreButton
          remaining={visibleTrades.length - visibleCount}
          onClick={() => setVisibleCount(v => v + TRADES_PER_PAGE)}
        />
      )}
      {!isPro && hiddenTradeCount > 0 && visibleCount >= visibleTrades.length && (
        <ProPaywall hiddenCount={hiddenTradeCount} />
      )}
    </div>
  );
}
