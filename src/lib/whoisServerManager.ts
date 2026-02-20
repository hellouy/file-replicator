/**
 * WHOIS 服务器管理器
 * 整合本地补充列表和 Supabase 云端列表
 * 提供统一的查询接口
 */

import { getWhoisServer, hasLocalWhoisServer } from './localWhoisServers';
import { supabase } from '@/integrations/supabase/client';

interface WhoisServerCache {
  tld: string;
  server: string | null;
  source: 'local' | 'supabase' | 'none';
  timestamp: number;
}

// 在内存中缓存查询结果，避免重复请求数据库
const whoisServerCache = new Map<string, WhoisServerCache>();
const CACHE_TTL = 3600000; // 1 小时

/**
 * 获取 WHOIS 服务器
 * 优先级：本地列表 > Supabase 数据库 > 返回 null
 */
export async function getWhoisServerAddress(tld: string): Promise<{
  server: string | null;
  source: 'local' | 'supabase' | 'none';
}> {
  const cleanTld = tld.toLowerCase().replace(/^\./, '');
  
  // 检查内存缓存
  const cached = whoisServerCache.get(cleanTld);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      server: cached.server,
      source: cached.source,
    };
  }

  // 优先使用本地列表
  const localServer = getWhoisServer(cleanTld);
  if (localServer) {
    const result = {
      server: localServer,
      source: 'local' as const,
    };
    whoisServerCache.set(cleanTld, {
      tld: cleanTld,
      server: localServer,
      source: 'local',
      timestamp: Date.now(),
    });
    return result;
  }

  // 从 Supabase 查询
  try {
    const { data, error } = await supabase
      .from('whois_servers')
      .select('server')
      .eq('tld', cleanTld)
      .single();

    if (!error && data) {
      const result = {
        server: data.server,
        source: 'supabase' as const,
      };
      whoisServerCache.set(cleanTld, {
        tld: cleanTld,
        server: data.server,
        source: 'supabase',
        timestamp: Date.now(),
      });
      return result;
    }
  } catch (error) {
    console.log('[WhoisServerManager] Supabase query failed:', error);
  }

  // 都没有找到
  const result = {
    server: null,
    source: 'none' as const,
  };
  whoisServerCache.set(cleanTld, {
    tld: cleanTld,
    server: null,
    source: 'none',
    timestamp: Date.now(),
  });
  return result;
}

/**
 * 批量获取 WHOIS 服务器（用于预加载）
 */
export async function getWhoisServersForTlds(tlds: string[]): Promise<
  Record<string, { server: string | null; source: 'local' | 'supabase' | 'none' }>
> {
  const results: Record<string, { server: string | null; source: 'local' | 'supabase' | 'none' }> = {};
  
  for (const tld of tlds) {
    results[tld] = await getWhoisServerAddress(tld);
  }
  
  return results;
}

/**
 * 清空缓存（用于手动刷新）
 */
export function clearWhoisServerCache(): void {
  whoisServerCache.clear();
}

/**
 * 获取缓存统计信息
 */
export function getWhoisServerCacheStats(): {
  size: number;
  entries: Array<{ tld: string; source: string }>;
} {
  const entries = Array.from(whoisServerCache.entries()).map(([tld, data]) => ({
    tld,
    source: data.source,
  }));
  
  return {
    size: whoisServerCache.size,
    entries,
  };
}

/**
 * 检查 TLD 是否在本地列表中
 */
export function isTldInLocalList(tld: string): boolean {
  return hasLocalWhoisServer(tld);
}
