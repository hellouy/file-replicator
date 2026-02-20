# WHOIS 服务器列表维护指南

本文档提供了维护和更新本地 WHOIS 服务器列表的详细说明。

## 📋 目录

1. [添加新 TLD](#添加新-tld)
2. [更新现有 TLD](#更新现有-tld)
3. [移除不可用的 TLD](#移除不可用的-tld)
4. [批量导入 TLD](#批量导入-tld)
5. [性能优化](#性能优化)
6. [监控和测试](#监控和测试)
7. [常见问题](#常见问题)

---

## 添加新 TLD

### 步骤 1：收集信息

首先收集新 TLD 的必要信息：

```bash
# 查询 WHOIS 服务器
nslookup whois.nic.xx
dig whois.nic.xx

# 测试连接
telnet whois.nic.xx 43
nc -zv whois.nic.xx 43
```

### 步骤 2：前端列表

编辑 `src/lib/localWhoisServers.ts`：

```typescript
// 找到对应的地区分类（或创建新的）
// ==================== 你的地区 ====================
'xx': 'whois.nic.xx',  // 国家名称 Country Name
'yy': 'whois.server.yy', // 另一个国家 Another Country
```

### 步骤 3：Edge Function 列表

编辑 `supabase/functions/domain-lookup/local-whois-supplement.ts`：

```typescript
// 在相同位置添加相同的条目
'xx': 'whois.nic.xx',  // 国家名称 Country Name
```

### 步骤 4：测试

```typescript
import { isTldInLocalList, getLocalTlds } from '@/lib/localWhoisServers';
import { getWhoisServerAddress } from '@/lib/whoisServerManager';

// 测试 1: 检查是否在列表中
console.assert(isTldInLocalList('xx'), '新 TLD 应在列表中');

// 测试 2: 获取服务器地址
const { server, source } = await getWhoisServerAddress('xx');
console.assert(server === 'whois.nic.xx', '应返回正确的服务器');
console.assert(source === 'local', '来源应该是 local');

// 测试 3: 检查总数
const allTlds = getLocalTlds();
console.log(`现在支持 ${allTlds.length} 个 TLD`);
```

### 步骤 5：提交

```bash
git add src/lib/localWhoisServers.ts
git add supabase/functions/domain-lookup/local-whois-supplement.ts
git commit -m "feat: 添加 .xx TLD 支持"
git push
```

---

## 更新现有 TLD

### 场景：服务器地址变更

假设 `.td` 的 WHOIS 服务器从 `whois.nic.td` 改为 `whois.new-server.td`：

#### 1. 验证新服务器

```bash
# 测试新服务器是否可用
nslookup whois.new-server.td
telnet whois.new-server.td 43

# 查询样本域名
echo "example.td" | nc whois.new-server.td 43
```

#### 2. 前端更新

```typescript
// src/lib/localWhoisServers.ts
'td': 'whois.new-server.td',  // ← 更新此处
```

#### 3. Edge Function 更新

```typescript
// supabase/functions/domain-lookup/local-whois-supplement.ts
'td': 'whois.new-server.td',  // ← 更新此处
```

#### 4. 清除缓存

```typescript
import { clearWhoisServerCache } from '@/lib/whoisServerManager';

// 在适当的地方调用
clearWhoisServerCache();
```

#### 5. 测试更新

```typescript
const { server } = await getWhoisServerAddress('td');
console.assert(server === 'whois.new-server.td', '服务器应该更新');
```

---

## 移除不可用的 TLD

### 标记为不可用

如果某个 TLD 的 WHOIS 服务器不再可用：

```typescript
// 选项 1: 移除 TLD
// 直接从两个文件中删除相应条目

// 选项 2: 注释说明原因
// 'xx': 'whois.nic.xx', // ❌ 不可用 - 服务器已关闭 (2024-02-19)

// 选项 3: 使用标记
// 不可用的 WHOIS 服务器 - 应使用 HTTP 兜底
const UNAVAILABLE_WHOIS_SERVERS = new Set([
  'whois.pnina.ps',  // .ps - 经常连接被拒绝
  'whois.nic.mm',    // .mm - 缅甸，超慢
]);
```

### 更新不可用列表

```typescript
// supabase/functions/domain-lookup/index.ts
const SLOW_WHOIS_SERVERS = new Set([
  'whois.nic.xx',  // 新添加的不可用服务器
  // ... 现有的 ...
]);
```

---

## 批量导入 TLD

### 从 JSON 导入

如果你有一个包含 TLD 信息的 JSON 文件：

```typescript
// scripts/import-whois-servers.ts

import fs from 'fs';

interface WhoisEntry {
  tld: string;
  server: string;
  region?: string;
  notes?: string;
}

function generateTypeScriptFile(data: WhoisEntry[]): string {
  const grouped = data.reduce((acc, entry) => {
    const region = entry.region || '其他';
    if (!acc[region]) acc[region] = [];
    acc[region].push(entry);
    return acc;
  }, {} as Record<string, WhoisEntry[]>);

  let code = 'export const LOCAL_WHOIS_SERVERS: Record<string, string> = {\n';

  for (const [region, entries] of Object.entries(grouped)) {
    code += `\n  // ==================== ${region} ====================\n`;
    for (const entry of entries) {
      const comment = entry.notes ? ` ${entry.notes}` : '';
      code += `  '${entry.tld}': '${entry.server}',${comment}\n`;
    }
  }

  code += '\n};\n';
  return code;
}

// 使用
const jsonData = JSON.parse(fs.readFileSync('whois-servers.json', 'utf-8'));
const tsCode = generateTypeScriptFile(jsonData);
console.log(tsCode);
```

运行脚本：

```bash
npx ts-node scripts/import-whois-servers.ts > src/lib/localWhoisServers.ts
```

---

## 性能优化

### 1. 代码分割

对于大型 TLD 列表，考虑分割为多个文件：

```typescript
// src/lib/whois-servers/africa.ts
export const AFRICA_WHOIS_SERVERS = {
  'td': 'whois.nic.td',
  'cf': 'whois.nic.cf',
  // ...
};

// src/lib/whois-servers/index.ts
import { AFRICA_WHOIS_SERVERS } from './africa';
import { ASIA_WHOIS_SERVERS } from './asia';

export const LOCAL_WHOIS_SERVERS = {
  ...AFRICA_WHOIS_SERVERS,
  ...ASIA_WHOIS_SERVERS,
};
```

### 2. 使用二进制搜索

对于大量 TLD，使用排序的数组和二进制搜索：

```typescript
class WhoisServerIndex {
  private sortedTlds: [string, string][] = [];

  constructor(servers: Record<string, string>) {
    this.sortedTlds = Object.entries(servers).sort(([a], [b]) => a.localeCompare(b));
  }

  get(tld: string): string | undefined {
    const idx = this.sortedTlds.findIndex(([t]) => t === tld);
    return idx >= 0 ? this.sortedTlds[idx][1] : undefined;
  }
}
```

### 3. 压缩存储

```typescript
// 使用简洁的编码格式
const WHOIS_SERVERS_COMPRESSED = {
  'af': ['AFG', 'whois.nic.af'],  // [国家代码, 服务器]
  'td': ['TCD', 'whois.nic.td'],
};

function decompressWhoisServers(compressed: Record<string, [string, string]>) {
  return Object.fromEntries(compressed.map(([tld, [, server]]) => [tld, server]));
}
```

---

## 监控和测试

### 1. 自动化测试

```typescript
// __tests__/whois-servers.test.ts

import { LOCAL_WHOIS_SERVERS, getLocalTlds } from '@/lib/localWhoisServers';

describe('WHOIS Servers', () => {
  test('每个 TLD 都有有效的服务器地址', () => {
    for (const [tld, server] of Object.entries(LOCAL_WHOIS_SERVERS)) {
      expect(server).toBeDefined();
      expect(server).toMatch(/^whois\./);
      expect(server.split('.').length).toBeGreaterThan(2);
    }
  });

  test('没有重复的 TLD', () => {
    const tlds = getLocalTlds();
    const uniqueTlds = new Set(tlds);
    expect(tlds.length).toBe(uniqueTlds.size);
  });

  test('TLD 按字母顺序排列（可选）', () => {
    const tlds = getLocalTlds();
    const sorted = [...tlds].sort();
    expect(tlds).toEqual(sorted);
  });

  test('支持的 TLD 数量达到目标', () => {
    const tlds = getLocalTlds();
    expect(tlds.length).toBeGreaterThanOrEqual(100);
  });
});
```

### 2. 连接性测试

```bash
#!/bin/bash
# scripts/test-whois-servers.sh

echo "测试 WHOIS 服务器连接..."

failures=0

# 测试样本 TLD
for tld in td cf ke ng br; do
  server=$(grep "'$tld'" src/lib/localWhoisServers.ts | grep -oP "whois\.[^\s']*")
  
  if [ -z "$server" ]; then
    echo "❌ $tld 未找到"
    ((failures++))
    continue
  fi
  
  if nc -zv -w 5 "$server" 43 > /dev/null 2>&1; then
    echo "✓ $tld ($server)"
  else
    echo "❌ $tld ($server) - 连接失败"
    ((failures++))
  fi
done

if [ $failures -eq 0 ]; then
  echo "✓ 所有测试通过"
  exit 0
else
  echo "❌ $failures 个 TLD 失败"
  exit 1
fi
```

### 3. 定期审计

```typescript
// scripts/audit-whois-servers.ts

import { getLocalTlds } from '@/lib/localWhoisServers';

async function auditWhoisServers() {
  const report = {
    timestamp: new Date().toISOString(),
    totalTlds: 0,
    byRegion: {} as Record<string, number>,
    issues: [] as string[],
  };

  const tlds = getLocalTlds();
  report.totalTlds = tlds.length;

  console.log(`\n📊 WHOIS 服务器审计报告`);
  console.log(`时间: ${report.timestamp}`);
  console.log(`总 TLD 数: ${report.totalTlds}`);
  
  console.log('\n✓ 审计完成');
  console.log(JSON.stringify(report, null, 2));
}

auditWhoisServers();
```

---

## 常见问题

### Q: 如何测试新添加的 WHOIS 服务器？

**A:** 

```bash
# 方法 1: 使用 nc/telnet
echo "example.td" | nc whois.nic.td 43

# 方法 2: 使用在线工具
curl https://whois.api.example.com?domain=example.td

# 方法 3: 在代码中测试
const result = await getWhoisServerAddress('td');
console.log(result.server); // 应该返回 whois.nic.td
```

### Q: 如何判断 WHOIS 服务器是否仍然可用？

**A:** 定期运行连接测试：

```bash
# 快速检查
timeout 5 bash -c "</dev/tcp/whois.nic.td/43" && echo "✓ 可用" || echo "❌ 不可用"

# 详细检查
nslookup whois.nic.td
whois -h whois.nic.td example.td
```

### Q: 两个列表文件之间如何同步？

**A:** 创建自动同步脚本：

```typescript
// scripts/sync-whois-lists.ts

import fs from 'fs';

const frontendFile = 'src/lib/localWhoisServers.ts';
const edgeFuncFile = 'supabase/functions/domain-lookup/local-whois-supplement.ts';

// 检查两个文件中的 TLD 是否相同
function syncWhoisLists() {
  const frontendContent = fs.readFileSync(frontendFile, 'utf-8');
  const edgeFuncContent = fs.readFileSync(edgeFuncFile, 'utf-8');

  const frontendTlds = new Set(
    (frontendContent.match(/'([a-z]{2})': '/g) || [])
      .map(m => m.replace(/[':]/g, ''))
  );

  const edgeFuncTlds = new Set(
    (edgeFuncContent.match(/'([a-z]{2})': '/g) || [])
      .map(m => m.replace(/[':]/g, ''))
  );

  const missingInEdgeFunc = [...frontendTlds].filter(t => !edgeFuncTlds.has(t));
  const missingInFrontend = [...edgeFuncTlds].filter(t => !frontendTlds.has(t));

  console.log('📊 同步检查结果:');
  if (missingInEdgeFunc.length > 0) {
    console.log(`⚠️  Edge Function 中缺失: ${missingInEdgeFunc.join(', ')}`);
  }
  if (missingInFrontend.length > 0) {
    console.log(`⚠️  前端中缺失: ${missingInFrontend.join(', ')}`);
  }
  if (missingInEdgeFunc.length === 0 && missingInFrontend.length === 0) {
    console.log('✓ 两个列表完全同步');
  }
}

syncWhoisLists();
```

运行同步检查：

```bash
npx ts-node scripts/sync-whois-lists.ts
```

### Q: 如何处理多个 WHOIS 服务器地址？

**A:** 某些 TLD 可能有多个 WHOIS 服务器，当某个失败时可以使用备用：

```typescript
// 使用备用列表
export const WHOIS_SERVERS_FALLBACK: Record<string, string[]> = {
  'com': [
    'whois.verisign-grs.com',
    'whois.crsnic.net',  // 备用
  ],
  'org': [
    'whois.pir.org',
    'whois2.pir.org',  // 备用
  ],
};

// 在查询时使用
async function queryWithFallback(domain: string, servers: string[]) {
  for (const server of servers) {
    try {
      return await queryWhois(domain, server);
    } catch (error) {
      console.warn(`${server} 失败，尝试下一个...`);
    }
  }
  throw new Error('所有服务器都不可用');
}
```

---

## 📝 维护清单

### 每周

- [ ] 检查错误日志中的连接失败
- [ ] 监控缓存性能统计

### 每月

- [ ] 运行连接性测试（`test-whois-servers.sh`）
- [ ] 审计 WHOIS 服务器列表
- [ ] 更新文档

### 每季度

- [ ] 检查新的国家代码 TLD
- [ ] 测试备用 WHOIS 服务器
- [ ] 性能基准测试

### 每年

- [ ] 完整的系统审计
- [ ] 考虑架构改进
- [ ] 更新最佳实践文档

---

**相关文件：**
- [快速参考](./WHOIS_QUICK_REFERENCE.md)
- [完整指南](./WHOIS_ENHANCEMENT_GUIDE.md)
- [集成示例](./WHOIS_INTEGRATION_EXAMPLES.md)
