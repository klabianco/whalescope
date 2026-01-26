'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';

export function useWatchlist() {
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

  const toggleFollowWallet = useCallback((address: string): string[] => {
    if (!storageKey) return [];
    const current = getFollowedWallets();
    const newList = current.includes(address)
      ? current.filter(w => w !== address)
      : [...current, address];
    localStorage.setItem(`wallets_${storageKey}`, JSON.stringify(newList));
    return newList;
  }, [storageKey, getFollowedWallets]);

  const getFollowedPoliticians = useCallback((): string[] => {
    if (!storageKey) return [];
    try {
      return JSON.parse(localStorage.getItem(`politicians_${storageKey}`) || '[]');
    } catch {
      return [];
    }
  }, [storageKey]);

  const toggleFollowPolitician = useCallback((slug: string): string[] => {
    if (!storageKey) return [];
    const current = getFollowedPoliticians();
    const newList = current.includes(slug)
      ? current.filter(s => s !== slug)
      : [...current, slug];
    localStorage.setItem(`politicians_${storageKey}`, JSON.stringify(newList));
    return newList;
  }, [storageKey, getFollowedPoliticians]);

  return {
    connected,
    storageKey,
    getFollowedWallets,
    toggleFollowWallet,
    getFollowedPoliticians,
    toggleFollowPolitician,
  };
}
