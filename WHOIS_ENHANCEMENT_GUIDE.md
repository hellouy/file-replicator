# WHOIS 服务器本地补充指南

## 概述

本项目现在支持**本地 WHOIS 服务器列表补充**机制，用于增强对更多域名后缀（TLD）的查询能力，包括 `.td`（乍得）和其他许多云端列表中缺失的国家代码 TLD。

## 架构

系统采用**分层查询策略**：

```
查询流程：
  ┌─────────────────┐
  │  查询 TLD: .td  │
  └────────┬────────┘
           │
           ▼
  ┌──────────────────────┐
  │ 1. 检查本地补充列表   │ ← src/lib/localWhoisServers.ts
  │    (前端 + Edge Func) │
  └────────┬─────────────┘
           │
        成功? 返回
           │
        否? 继续
           │
           ▼
  ┌──────────────────────┐
  │ 2. 查询 Supabase 数据库 │
  │    whois_servers 表  │
  └────────┬─────────────┘
           │
        成功? 返回
           │
        否? 继续
           │
           ▼
  ┌──────────────────────┐
  │ 3. 返回 null          │
  │    (不支持)          │
  └──────────────────────┘
```

## 文件结构

### 前端文件

#### 1. **`src/lib/localWhoisServers.ts`** - 本地 WHOIS 列表（前端）
- 包含所有本地补充的 TLD 和对应的 WHOIS 服务器地址
- 包含 100+ 个国家和地区的 TLD
- 提供工具函数：
  - `getWhoisServer(tld, supabaseServer)` - 获取 WHOIS 服务器
  - `hasLocalWhoisServer(tld)` - 检查 TLD 是否在本地列表
  - `getLocalTlds()` - 获取所有本地支持的 TLD

#### 2. **`src/lib/whoisServerManager.ts`** - WHOIS 服务器管理器
- 整合本地列表和 Supabase 数据库
- 提供统一的查询接口
- 包含内存缓存机制（TTL：1 小时）
- 主要函数：
  - `getWhoisServerAddress(tld)` - 获取服务器地址和来源信息
  - `getWhoisServersForTlds(tlds)` - 批量获取服务器
  - `clearWhoisServerCache()` - 清除缓存
  - `getWhoisServerCacheStats()` - 获取缓存统计

### Edge Function 文件

#### 3. **`supabase/functions/domain-lookup/local-whois-supplement.ts`** - 本地 WHOIS 列表（Edge Func）
- 与前端 `localWhoisServers.ts` 保持同步
- 供 Edge Function `domain-lookup` 使用
- 在 Supabase 数据库查询失败时作为备选
- 提供函数：
  - `getLocalWhoisServer(tld)` - 获取本地服务器
  - `hasLocalWhoisServer(tld)` - 检查是否支持

## 使用方式

### 前端使用

#### 方式 1：直接使用本地列表（快速）

```typescript
import { getWhoisServer, hasLocalWhoisServer } from '@/lib/localWhoisServers';

// 检查 TLD 是否支持
if (hasLocalWhoisServer('td')) {
  const server = getWhoisServer('td');
  // server = 'whois.nic.td'
}
```

#### 方式 2：使用管理器（推荐）

```typescript
import { getWhoisServerAddress } from '@/lib/whoisServerManager';

// 自动从本地或 Supabase 获取
const { server, source } = await getWhoisServerAddress('td');

console.log(server); // 'whois.nic.td'
console.log(source); // 'local' | 'supabase' | 'none'
```

#### 方式 3：批量获取

```typescript
const results = await getWhoisServersForTlds(['td', 'cf', 'ke']);

// results:
// {
//   'td': { server: 'whois.nic.td', source: 'local' },
//   'cf': { server: 'whois.nic.cf', source: 'local' },
//   'ke': { server: 'whois.kenic.or.ke', source: 'local' }
// }
```

### Edge Function 使用

在 `supabase/functions/domain-lookup/index.ts` 中：

```typescript
import { getLocalWhoisServer } from './local-whois-supplement';

// 获取 TLD 的 WHOIS 服务器
async function getWhoisServerForTld(tld: string): Promise<string | null> {
  // 首先尝试本地列表
  const localServer = getLocalWhoisServer(tld);
  if (localServer) {
    return localServer;
  }

  // 再尝试 Supabase 数据库
  const { data } = await supabase
    .from('whois_servers')
    .select('server')
    .eq('tld', tld)
    .single();

  return data?.server || null;
}
```

## 支持的 TLD 列表

### 按地区分类

#### 非洲（35+ TLD）
`.td` `.cf` `.ga` `.gm` `.gh` `.gn` `.gw` `.ke` `.lr` `.ls` `.mg` `.mw` `.ml` `.mr` `.mu` `.ma` `.mz` `.na` `.ne` `.ng` `.rw` `.st` `.sn` `.sc` `.sl` `.so` `.ss` `.sd` `.sz` `.tz` `.tg` `.tn` `.ug` `.zm` `.zw`

#### 太平洋岛国（15+ TLD）
`.ki` `.pw` `.pg` `.sb` `.tk` `.to` `.tv` `.vu` `.ws` `.fj` `.gu` `.mh` `.mp` `.as`

#### 南美洲（5+ TLD）
`.sr` `.gf` `.gy` `.fk` `.gs`

#### 中亚和高加索（6+ TLD）
`.kg` `.tj` `.tm` `.uz` `.ab` `.os`

#### 中东和西亚（15+ TLD）
`.af` `.ps` `.ye` `.om` `.qa` `.bh` `.kw` `.jo` `.lb` `.sy` `.iq` `.kp` `.ir`

#### 南亚（6+ TLD）
`.bt` `.mv` `.np` `.lk` `.bd` `.pk`

#### 东南亚（5+ TLD）
`.mm` `.la` `.kh` `.bn` `.tl`

#### 加勒比地区（20+ TLD）
`.bs` `.bb` `.bz` `.ky` `.cr` `.do` `.sv` `.gd` `.gt` `.ht` `.hn` `.jm` `.ni` `.pa` `.tt` `.vc` `.lc` `.kn` `.ag` `.dm`

#### 其他特殊地区（10+ TLD）
`.hk` `.mo` `.io` `.sh` `.ac` `.bi`

## 添加新的 TLD

### 步骤 1：更新前端列表

编辑 `src/lib/localWhoisServers.ts`，在合适的分类中添加：

```typescript
'xx': 'whois.nic.xx',  // 国家名称
```

### 步骤 2：同步到 Edge Function

编辑 `supabase/functions/domain-lookup/local-whois-supplement.ts`，添加相同的条目以保持同步。

### 步骤 3：（可选）更新 Supabase 数据库

如果需要将 WHOIS 服务器永久存储在数据库中，运行：

```sql
INSERT INTO whois_servers (tld, server, updated_at)
VALUES ('xx', 'whois.nic.xx', NOW())
ON CONFLICT (tld) DO UPDATE
SET server = 'whois.nic.xx', updated_at = NOW();
```

## 缓存机制

### 前端缓存

使用 `whoisServerManager.ts` 中的内存缓存：
- **TTL：1 小时**
- **作用**：避免重复查询数据库
- **清除**：调用 `clearWhoisServerCache()` 或等待 TTL 过期

### 获取缓存统计

```typescript
import { getWhoisServerCacheStats } from '@/lib/whoisServerManager';

const stats = getWhoisServerCacheStats();
console.log(stats.size);    // 缓存中的条目数
console.log(stats.entries); // 具体条目列表
```

## 性能考虑

1. **本地查询**：O(1) 时间复杂度，无网络延迟
2. **数据库查询**：首次 O(n)，后续受缓存保护
3. **缓存命中率**：经常查询的 TLD 会被缓存

## 故障排除

### 问题：仍然无法查询某个 TLD（如 `.td`）

**解决方案：**
1. 检查 `localWhoisServers.ts` 中是否包含该 TLD
2. 检查 `local-whois-supplement.ts` 是否也包含该条目
3. 验证 WHOIS 服务器地址的正确性
4. 检查网络连接和防火墙设置

### 问题：性能下降

**解决方案：**
1. 检查缓存是否过大：`getWhoisServerCacheStats()`
2. 考虑增加缓存 TTL
3. 检查数据库查询性能

### 问题：本地列表与 Supabase 不一致

**解决方案：**
1. 确保 `local-whois-supplement.ts` 与 `localWhoisServers.ts` 同步
2. 本地列表具有较高优先级，会覆盖数据库值
3. 如需统一，在 Supabase 中更新该 TLD 的记录

## 维护

### 定期更新

本地 WHOIS 服务器列表应定期审查和更新：
- 每季度检查一次缓慢/失效的服务器
- 监控错误日志中的连接失败
- 根据用户反馈添加新的 TLD

### 备选策略

如果特定 WHOIS 服务器不可用：
1. 使用备选服务器（如适用）
2. 从另一个可靠的来源获取数据
3. 回退到 HTTP 基础的查询（如有）

## 相关文件

- 前端查询组件：`src/components/DomainLookup.tsx`
- Edge Function：`supabase/functions/domain-lookup/index.ts`
- Supabase 同步：`supabase/functions/sync-whois-servers/index.ts`
- 类型定义：`src/integrations/supabase/types.ts`

## 许可证

本项目遵循原项目许可证。

---

**最后更新：** 2024 年  
**维护者：** 项目团队
