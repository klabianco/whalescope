'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Shared types ──

export interface FilterTab {
  key: string;
  label: string;
  color?: string;
  count?: number;
}

export interface TradeCardProps {
  /** Follow button (rendered by each page with its own logic) */
  followButton?: React.ReactNode;
  /** Actor name (politician or wallet) */
  actor: string;
  /** Link for the actor */
  actorHref: string;
  /** Buy/Sell badge */
  badge: { label: string; bg: string; color: string };
  /** What was traded (ticker/token symbol) */
  asset: string;
  /** Dollar amount or amount range */
  amount: string;
  /** Date string */
  date: string;
  /** Optional transaction link URL */
  txUrl?: string;
  /** Extra badges after actor (committee correlation, etc.) */
  extras?: React.ReactNode;
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
  onChange,
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
  followButton,
  actor,
  actorHref,
  badge,
  asset,
  amount,
  date,
  txUrl,
  extras,
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
      {/* Row 1: Follow + Name + Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {followButton}
        <Link
          href={actorHref}
          style={{ color: '#fff', fontWeight: '600', textDecoration: 'none', fontSize: '15px' }}
        >
          {actor}
        </Link>
        <span style={{
          background: badge.bg,
          color: badge.color,
          padding: '3px 8px',
          borderRadius: '5px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.5px',
        }}>
          {badge.label}
        </span>
        {extras}
      </div>

      {/* Row 2: Asset | Amount | Date | Tx link */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '16px' }}>
          {asset}
        </span>
        <span style={{ color: '#fff', fontWeight: '500', fontSize: '14px' }}>
          {amount}
        </span>
        <span style={{ color: '#666', fontSize: '13px' }}>
          {date}
        </span>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none', marginLeft: 'auto' }}
          >
            View tx ↗
          </a>
        )}
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
