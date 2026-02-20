# WHOIS 服务器管理集成示例

本文档提供了在实际应用中集成本地 WHOIS 服务器管理的代码示例。

## 1. 在 React 组件中使用

### 基础示例：单个 TLD 查询

```typescript
import { useState, useEffect } from 'react';
import { getWhoisServerAddress, isTldInLocalList } from '@/lib/whoisServerManager';

export function TldWhoisChecker({ tld }: { tld: string }) {
  const [whoisInfo, setWhoisInfo] = useState<{
    server: string | null;
    source: string;
  } | null>(null);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    const fetchWhoisServer = async () => {
      const info = await getWhoisServerAddress(tld);
      setWhoisInfo(info);
      setIsLocal(isTldInLocalList(tld));
    };

    fetchWhoisServer();
  }, [tld]);

  if (!whoisInfo) return <div>Loading...</div>;

  return (
    <div>
      <p>TLD: .{tld}</p>
      <p>Server: {whoisInfo.server || 'Not found'}</p>
      <p>Source: {whoisInfo.source}</p>
      {isLocal && <span className="badge">本地支持</span>}
    </div>
  );
}
```

### 高级示例：TLD 建议器

```typescript
import { useMemo } from 'react';
import { getLocalTlds } from '@/lib/localWhoisServers';
import { getWhoisServerAddress } from '@/lib/whoisServerManager';

export function TldSuggestions({ input }: { input: string }) {
  const suggestions = useMemo(() => {
    const localTlds = getLocalTlds();
    // 根据输入过滤 TLD
    return localTlds
      .filter(tld => tld.includes(input.toLowerCase()))
      .slice(0, 10);
  }, [input]);

  return (
    <ul>
      {suggestions.map(tld => (
        <li key={tld}>.{tld}</li>
      ))}
    </ul>
  );
}
```

## 2. 在 Hook 中使用

### 自定义 Hook：useWhoisServer

```typescript
import { useState, useEffect } from 'react';
import { getWhoisServerAddress } from '@/lib/whoisServerManager';

interface UseWhoisServerResult {
  server: string | null;
  source: 'local' | 'supabase' | 'none';
  loading: boolean;
  error: Error | null;
}

export function useWhoisServer(tld: string): UseWhoisServerResult {
  const [server, setServer] = useState<string | null>(null);
  const [source, setSource] = useState<'local' | 'supabase' | 'none'>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = await getWhoisServerAddress(tld);
        setServer(result.server);
        setSource(result.source);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [tld]);

  return { server, source, loading, error };
}

// 使用示例
function MyComponent() {
  const { server, source, loading } = useWhoisServer('td');
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Server: {server}</p>
      <p>Source: {source}</p>
    </div>
  );
}
```

## 3. 在 API 路由中使用

### Next.js API 路由示例

```typescript
// pages/api/whois/server/[tld].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getWhoisServerAddress } from '@/lib/whoisServerManager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tld } = req.query;

  if (!tld || typeof tld !== 'string') {
    return res.status(400).json({ error: 'TLD parameter required' });
  }

  try {
    const result = await getWhoisServerAddress(tld);
    
    return res.status(200).json({
      tld,
      server: result.server,
      source: result.source,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch WHOIS server' });
  }
}

// 使用方式：GET /api/whois/server/td
// 响应：
// {
//   "tld": "td",
//   "server": "whois.nic.td",
//   "source": "local"
// }
```

### 批量查询 API

```typescript
// pages/api/whois/servers.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getWhoisServersForTlds } from '@/lib/whoisServerManager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tlds } = req.query;

  if (!tlds || typeof tlds !== 'string') {
    return res.status(400).json({ error: 'TLDs parameter required' });
  }

  try {
    const tldArray = tlds.split(',').map(t => t.trim());
    const results = await getWhoisServersForTlds(tldArray);
    
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch WHOIS servers' });
  }
}

// 使用方式：GET /api/whois/servers?tlds=td,cf,ke
// 响应：
// {
//   "td": { "server": "whois.nic.td", "source": "local" },
//   "cf": { "server": "whois.nic.cf", "source": "local" },
//   "ke": { "server": "whois.kenic.or.ke", "source": "local" }
// }
```

## 4. 在页面中使用

### 域名查询增强示例

```typescript
import { useState } from 'react';
import { useWhoisServer } from '@/hooks/useWhoisServer';
import { isTldInLocalList } from '@/lib/whoisServerManager';

export function EnhancedDomainLookup() {
  const [domain, setDomain] = useState('');
  const tld = domain.split('.').pop() || '';
  
  const { server, source } = useWhoisServer(tld);
  const isSupported = isTldInLocalList(tld);

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="输入域名，如 example.td"
      />

      {tld && (
        <div className="info-box">
          <p>TLD: .{tld}</p>
          {isSupported ? (
            <div className="success">
              <p>✓ 支持本地查询</p>
              <p>WHOIS 服务器: {server}</p>
              <p>来源: {source === 'local' ? '本地列表' : 'Supabase'}</p>
            </div>
          ) : (
            <div className="warning">
              <p>⚠ 可能不支持此 TLD</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### TLD 支持情况统计

```typescript
import { useEffect, useState } from 'react';
import { getLocalTlds } from '@/lib/localWhoisServers';

export function WhoisStatsPanel() {
  const [stats, setStats] = useState({
    localCount: 0,
    regions: {} as Record<string, number>,
  });

  useEffect(() => {
    const localTlds = getLocalTlds();
    const regionStats: Record<string, number> = {
      '非洲': 0,
      '太平洋': 0,
      '南美': 0,
      '中亚': 0,
      '中东': 0,
      '南亚': 0,
      '东南亚': 0,
      '加勒比': 0,
      '其他': 0,
    };

    // 简单的分类逻辑（实际应用中可更复杂）
    localTlds.forEach(tld => {
      // 这只是示例，实际应该有更完善的分类
      if (['td', 'cf', 'ga', 'ke', 'mg'].includes(tld)) {
        regionStats['非洲']++;
      } else {
        regionStats['其他']++;
      }
    });

    setStats({
      localCount: localTlds.length,
      regions: regionStats,
    });
  }, []);

  return (
    <div className="stats-panel">
      <h3>WHOIS 服务器支持统计</h3>
      <p>本地支持 TLD 数: {stats.localCount}</p>
      <div className="region-breakdown">
        {Object.entries(stats.regions).map(([region, count]) => (
          count > 0 && (
            <p key={region}>
              {region}: {count}
            </p>
          )
        ))}
      </div>
    </div>
  );
}
```

## 5. 在 Supabase Edge Function 中使用

### 完整的查询函数示例

```typescript
// supabase/functions/domain-lookup/index.ts 中的片段

import { getLocalWhoisServer } from './local-whois-supplement';

// ... 现有代码 ...

async function queryWhoisServer(
  tld: string,
  domain: string
): Promise<string | null> {
  // 第一步：检查本地补充列表
  const localServer = getLocalWhoisServer(tld);
  if (localServer) {
    console.log(`[WHOIS] Using local server for .${tld}: ${localServer}`);
    return queryWhois(domain, localServer);
  }

  // 第二步：从 Supabase 查询
  try {
    const { data, error } = await supabase
      .from('whois_servers')
      .select('server')
      .eq('tld', tld)
      .single();

    if (!error && data?.server) {
      console.log(`[WHOIS] Using Supabase server for .${tld}: ${data.server}`);
      return queryWhois(domain, data.server);
    }
  } catch (err) {
    console.error(`[WHOIS] Supabase query failed for .${tld}:`, err);
  }

  // 第三步：降级处理
  console.warn(`[WHOIS] No server found for .${tld}, using HTTP fallback`);
  return queryWhoisViaHttp(domain);
}

// 主处理函数
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { domain } = await req.json();
  const tld = domain.split('.').pop();

  if (!tld) {
    return new Response(
      JSON.stringify({ error: 'Invalid domain' }),
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // 使用新的查询函数
    const whoisData = await queryWhoisServer(tld, domain);
    
    return new Response(
      JSON.stringify({
        domain,
        tld,
        whoisData,
        source: 'whois-lookup',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
```

## 6. 测试示例

### Jest 单元测试

```typescript
// __tests__/whoisServerManager.test.ts

import {
  getWhoisServerAddress,
  isTldInLocalList,
  getLocalTlds,
  clearWhoisServerCache,
} from '@/lib/whoisServerManager';

describe('whoisServerManager', () => {
  beforeEach(() => {
    clearWhoisServerCache();
  });

  test('should get local WHOIS server for supported TLD', async () => {
    const result = await getWhoisServerAddress('td');
    expect(result.server).toBe('whois.nic.td');
    expect(result.source).toBe('local');
  });

  test('should identify local TLDs correctly', () => {
    expect(isTldInLocalList('td')).toBe(true);
    expect(isTldInLocalList('cf')).toBe(true);
  });

  test('should return cached results on subsequent calls', async () => {
    const result1 = await getWhoisServerAddress('ke');
    const result2 = await getWhoisServerAddress('ke');
    
    expect(result1).toEqual(result2);
  });

  test('should return all local TLDs', () => {
    const tlds = getLocalTlds();
    expect(tlds.length).toBeGreaterThan(50);
    expect(tlds).toContain('td');
    expect(tlds).toContain('cf');
  });

  test('should handle unsupported TLD gracefully', async () => {
    const result = await getWhoisServerAddress('xyz123');
    // 应该从 Supabase 查询或返回 null
    expect(result).toBeDefined();
  });
});
```

## 7. 性能优化示例

### 批量预加载

```typescript
import { getWhoisServersForTlds } from '@/lib/whoisServerManager';

// 在应用初始化时预加载常用 TLD
export async function preloadCommonTlds() {
  const commonTlds = ['com', 'org', 'net', 'co', 'io', 'td', 'cf', 'ke'];
  
  try {
    const servers = await getWhoisServersForTlds(commonTlds);
    console.log('Preloaded WHOIS servers:', servers);
  } catch (error) {
    console.error('Failed to preload WHOIS servers:', error);
  }
}

// 在 App 初始化时调用
import { useEffect } from 'react';

export function App() {
  useEffect(() => {
    preloadCommonTlds();
  }, []);

  return <YourApp />;
}
```

### 缓存统计和监控

```typescript
import { getWhoisServerCacheStats } from '@/lib/whoisServerManager';

export function WhoisCacheMonitor() {
  const handleCheckStats = () => {
    const stats = getWhoisServerCacheStats();
    console.table({
      '缓存条目数': stats.size,
      '缓存详情': stats.entries,
    });
  };

  return (
    <button onClick={handleCheckStats}>
      查看 WHOIS 缓存统计
    </button>
  );
}
```

## 总结

这些示例展示了如何在不同的场景中集成 WHOIS 服务器管理系统。关键点：

1. **优先级**：本地列表 > Supabase 数据库 > 无法获取
2. **缓存**：自动缓存查询结果，提高性能
3. **灵活性**：可以轻松添加新的 TLD
4. **可维护性**：中央管理 WHOIS 服务器地址

更多信息请参考 `WHOIS_ENHANCEMENT_GUIDE.md`。
