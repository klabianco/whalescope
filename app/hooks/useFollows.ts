'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const FREE_FOLLOW_LIMIT = 3;

interface FollowsData {
  whales: string[];
  politicians: string[];
}

function getStorageKey(walletKey: string | null): string | null {
  if (walletKey) return walletKey;
  if (typeof window === 'undefined') return null;
  let anonId = localStorage.getItem('whales_anon_id');
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('whales_anon_id', anonId);
  }
  return anonId;
}

function loadFollows(key: string): FollowsData {
  try {
    // Try unified key first
    const unified = localStorage.getItem(`follows_${key}`);
    if (unified) {
      // Clean up any lingering old keys
      localStorage.removeItem(`whales_${key}`);
      localStorage.removeItem(`politicians_${key}`);
      localStorage.removeItem('congress_following');
      return JSON.parse(unified);
    }
    
    // Migrate from old keys — only take up to FREE_FOLLOW_LIMIT total
    const whales: string[] = JSON.parse(localStorage.getItem(`whales_${key}`) || '[]');
    const oldPols1: string[] = JSON.parse(localStorage.getItem(`politicians_${key}`) || '[]');
    const oldPols2: string[] = JSON.parse(localStorage.getItem('congress_following') || '[]');
    // Dedupe politicians from both old keys
    const politicians = [...new Set([...oldPols1, ...oldPols2])];
    
    // Only migrate up to the limit
    const combined: FollowsData = { whales: [], politicians: [] };
    let count = 0;
    for (const w of whales) {
      if (count >= FREE_FOLLOW_LIMIT) break;
      combined.whales.push(w);
      count++;
    }
    for (const p of politicians) {
      if (count >= FREE_FOLLOW_LIMIT) break;
      combined.politicians.push(p);
      count++;
    }
    
    if (combined.whales.length > 0 || combined.politicians.length > 0) {
      localStorage.setItem(`follows_${key}`, JSON.stringify(combined));
    }
    // Always clean up old keys
    localStorage.removeItem(`whales_${key}`);
    localStorage.removeItem(`politicians_${key}`);
    localStorage.removeItem('congress_following');
    return combined;
  } catch {}
  return { whales: [], politicians: [] };
}

function saveFollows(key: string, data: FollowsData) {
  localStorage.setItem(`follows_${key}`, JSON.stringify(data));
}

export function useFollows() {
  const { publicKey } = useWallet();
  const walletKey = publicKey?.toBase58() || null;
  const storageKey = useMemo(() => getStorageKey(walletKey), [walletKey]);

  const [follows, setFollows] = useState<FollowsData>({ whales: [], politicians: [] });
  const [limitHit, setLimitHit] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  const totalFollows = follows.whales.length + follows.politicians.length;

  // Load on mount / key change
  useEffect(() => {
    if (!storageKey) return;
    setFollows(loadFollows(storageKey));
  }, [storageKey]);

  // Migrate anonymous follows to wallet on connect
  useEffect(() => {
    if (!walletKey) return;
    const anonId = localStorage.getItem('whales_anon_id');
    if (!anonId) return;
    try {
      const anonData = loadFollows(anonId);
      const walletData = loadFollows(walletKey);
      if (anonData.whales.length > 0 || anonData.politicians.length > 0) {
        const merged: FollowsData = {
          whales: [...new Set([...walletData.whales, ...anonData.whales])],
          politicians: [...new Set([...walletData.politicians, ...anonData.politicians])],
        };
        saveFollows(walletKey, merged);
        localStorage.removeItem(`follows_${anonId}`);
        setFollows(merged);
      }
    } catch {}
  }, [walletKey]);

  function showToast(message: string) {
    setToast({ message, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }

  const toggleWhale = useCallback((address: string) => {
    if (!storageKey) return;
    setFollows(prev => {
      const isFollowing = prev.whales.includes(address);
      let next: FollowsData;
      if (isFollowing) {
        next = { ...prev, whales: prev.whales.filter(a => a !== address) };
        showToast('Removed from your watchlist');
        setLimitHit(false);
      } else {
        const total = prev.whales.length + prev.politicians.length;
        if (total >= FREE_FOLLOW_LIMIT) {
          setLimitHit(true);
          showToast(`Free limit reached (${FREE_FOLLOW_LIMIT}). Upgrade for unlimited.`);
          return prev;
        }
        next = { ...prev, whales: [...prev.whales, address] };
        showToast(`Following! ${next.whales.length + next.politicians.length} of ${FREE_FOLLOW_LIMIT} free slots used.`);
      }
      saveFollows(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const togglePolitician = useCallback((slug: string) => {
    if (!storageKey) return;
    setFollows(prev => {
      const isFollowing = prev.politicians.includes(slug);
      let next: FollowsData;
      if (isFollowing) {
        next = { ...prev, politicians: prev.politicians.filter(s => s !== slug) };
        showToast('Removed from your watchlist');
        setLimitHit(false);
      } else {
        const total = prev.whales.length + prev.politicians.length;
        if (total >= FREE_FOLLOW_LIMIT) {
          setLimitHit(true);
          showToast(`Free limit reached (${FREE_FOLLOW_LIMIT}). Upgrade for unlimited.`);
          return prev;
        }
        next = { ...prev, politicians: [...prev.politicians, slug] };
        showToast(`Following! ${next.whales.length + next.politicians.length} of ${FREE_FOLLOW_LIMIT} free slots used.`);
      }
      saveFollows(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const isFollowingWhale = useCallback((address: string) => follows.whales.includes(address), [follows.whales]);
  const isFollowingPolitician = useCallback((slug: string) => follows.politicians.includes(slug), [follows.politicians]);

  return {
    follows,
    totalFollows,
    limitHit,
    toast,
    toggleWhale,
    togglePolitician,
    isFollowingWhale,
    isFollowingPolitician,
    FREE_FOLLOW_LIMIT,
  };
}
