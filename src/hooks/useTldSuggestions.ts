import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Common TLDs to prioritize in suggestions
const COMMON_TLDS = ['com', 'net', 'org', 'io', 'co', 'ai', 'app', 'dev', 'cn', 'rw'];

export const useTldSuggestions = () => {
  const [allTlds, setAllTlds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTlds = async () => {
      try {
        const { data, error } = await supabase
          .from('whois_servers')
          .select('tld')
          .order('tld');

        if (!error && data) {
          const tlds = data.map(item => item.tld);
          setAllTlds(tlds);
        }
      } catch (e) {
        console.error('Failed to fetch TLDs:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTlds();
  }, []);

  const getSuggestions = useMemo(() => {
    return (input: string, maxResults = 8): string[] => {
      if (!input.trim()) return [];

      const trimmed = input.trim().toLowerCase();
      
      // If input already contains a dot, suggest TLDs matching what's after the dot
      if (trimmed.includes('.')) {
        const parts = trimmed.split('.');
        const prefix = parts.slice(0, -1).join('.');
        const tldPart = parts[parts.length - 1];
        
        if (!prefix) return [];
        
        // Filter TLDs that start with the typed suffix
        const matchingTlds = allTlds
          .filter(tld => tld.startsWith(tldPart))
          .slice(0, maxResults);
        
        // Sort: common TLDs first, then alphabetically
        return matchingTlds
          .sort((a, b) => {
            const aCommon = COMMON_TLDS.indexOf(a);
            const bCommon = COMMON_TLDS.indexOf(b);
            if (aCommon !== -1 && bCommon === -1) return -1;
            if (aCommon === -1 && bCommon !== -1) return 1;
            if (aCommon !== -1 && bCommon !== -1) return aCommon - bCommon;
            return a.localeCompare(b);
          })
          .map(tld => `${prefix}.${tld}`);
      }
      
      // No dot - suggest common TLDs first
      const suggestions: string[] = [];
      
      // First add common TLDs
      COMMON_TLDS.forEach(tld => {
        if (allTlds.includes(tld)) {
          suggestions.push(`${trimmed}.${tld}`);
        }
      });
      
      // If input looks like a TLD prefix itself (e.g., "ai"), prioritize that TLD
      const matchingTld = allTlds.find(tld => tld === trimmed);
      if (matchingTld && !suggestions.some(s => s.endsWith(`.${matchingTld}`))) {
        suggestions.unshift(`${trimmed}.${matchingTld}`);
      }
      
      return suggestions.slice(0, maxResults);
    };
  }, [allTlds]);

  return { allTlds, getSuggestions, loading };
};

// Utility to auto-complete domain with .com if no TLD
export const autoCompleteDomain = (input: string, allTlds: string[]): string => {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return '';
  
  // Check if already has a valid TLD
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.');
    const lastPart = parts[parts.length - 1];
    
    // Check if the last part is a valid TLD
    if (allTlds.includes(lastPart)) {
      return trimmed;
    }
  }
  
  // No TLD or invalid TLD - append .com
  // Remove trailing dot if exists
  const cleanInput = trimmed.replace(/\.$/, '');
  return `${cleanInput}.com`;
};
