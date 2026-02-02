'use client';

import { useEffect, useRef } from 'react';
import { trackScrollDepth } from '../lib/tracking';

/**
 * Invisible component that tracks scroll depth
 * Fires events at 25%, 50%, 75%, 100% scroll depth
 * Tracks once per session to avoid spam
 */

export function ScrollDepthTracker() {
  const tracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollY = window.scrollY;
      
      // Calculate scroll percentage
      const scrollPercent = Math.floor(
        ((scrollY + windowHeight) / documentHeight) * 100
      );

      // Track milestones
      const milestones = [25, 50, 75, 100];
      
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !tracked.current.has(milestone)) {
          tracked.current.add(milestone);
          trackScrollDepth(milestone);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null; // Invisible component
}
