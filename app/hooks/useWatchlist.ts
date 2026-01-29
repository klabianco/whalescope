'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';

const FREE_WATCHLIST_LIMIT = 3;

export function useWatchlist(isPro: boolean = false) {
  const { publicKey, connected } = useWallet();
  
  const storageKey = publicKey ? publicKey.toBase58() : null;

  const getFollowedWallets = useCallback((): string[] => {
    if (!storageKey) return [];
    try {
      return JSON.parse(localStorage.getItem(`wallets_${storageKey}`) || '[]');
    } catch {
      return [];
    }
  }, [storageKey]);

  const getFollowedPoliticians = useCallback((): string[] => {
    if (!storageKey) return [];
    try {
      return JSON.parse(localStorage.getItem(`politicians_${storageKey}`) || '[]');
    } catch {
      return [];
    }
  }, [storageKey]);

  const getTotalFollowed = useCallback((): number => {
    return getFollowedWallets().length + getFollowedPoliticians().length;
  }, [getFollowedWallets, getFollowedPoliticians]);

  const isAtLimit = useCallback((): boolean => {
    if (isPro) return false;
    return getTotalFollowed() >= FREE_WATCHLIST_LIMIT;
  }, [isPro, getTotalFollowed]);

  const toggleFollowWallet = useCallback((address: string): { list: string[]; blocked: boolean } => {
    if (!storageKey) return { list: [], blocked: false };
    const current = getFollowedWallets();
    
    // Unfollowing is always allowed
    if (current.includes(address)) {
      const newList = current.filter(w => w !== address);
      localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
      return { list: newList, blocked: false };
    }
    
    // Following — check limit
    if (!isPro && getTotalFollowed() >= FREE_WATCHLIST_LIMIT) {
      return { list: current, blocked: true };
    }
    
    const newList = [...current, address];
    localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
    return { list: newList, blocked: false };
  }, [storageKey, isPro, getFollowedWallets, getTotalFollowed]);

  const toggleFollowPolitician = useCallback((slug: string): { list: string[]; blocked: boolean } => {
    if (!storageKey) return { list: [], blocked: false };
    const current = getFollowedPoliticians();
    
    // Unfollowing is always allowed
    if (current.includes(slug)) {
      const newList = current.filter(s => s !== slug);
      localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
      return { list: newList, blocked: false };
    }
    
    // Following — check limit
    if (!isPro && getTotalFollowed() >= FREE_WATCHLIST_LIMIT) {
      return { list: current, blocked: true };
    }
    
    const newList = [...current, slug];
    localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
    return { list: newList, blocked: false };
  }, [storageKey, isPro, getFollowedPoliticians, getTotalFollowed]);

  return {
    connected,
    storageKey,
    isPro,
    isAtLimit,
    getTotalFollowed,
    getFollowedWallets,
    toggleFollowWallet,
    getFollowedPoliticians,
    toggleFollowPolitician,
    FREE_WATCHLIST_LIMIT,
  };
}
