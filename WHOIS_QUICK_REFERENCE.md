# WHOIS 服务器本地补充 - 快速参考

## 🚀 快速开始

### 1. 检查 TLD 是否支持
```typescript
import { isTldInLocalList } from '@/lib/whoisServerManager';

if (isTldInLocalList('td')) {
  console.log('✓ .td 支持本地查询');
}
```

### 2. 获取 WHOIS 服务器地址
```typescript
import { getWhoisServerAddress } from '@/lib/whoisServerManager';

const { server, source } = await getWhoisServerAddress('td');
// server: 'whois.nic.td'
// source: 'local' | 'supabase' | 'none'
```

### 3. 批量获取多个 TLD
```typescript
import { getWhoisServersForTlds } from '@/lib/whoisServerManager';

const results = await getWhoisServersForTlds(['td', 'cf', 'ke']);
```

---

## 📋 API 参考

### 函数列表

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getWhoisServerAddress()` | `tld: string` | `Promise<{server, source}>` | 获取单个 TLD 的服务器 |
| `getWhoisServersForTlds()` | `tlds: string[]` | `Promise<Record<string, ...>>` | 批量获取多个 TLD |
| `isTldInLocalList()` | `tld: string` | `boolean` | 检查 TLD 是否在本地列表 |
| `getLocalTlds()` | 无 | `string[]` | 获取所有本地支持的 TLD |
| `clearWhoisServerCache()` | 无 | `void` | 清除内存缓存 |
| `getWhoisServerCacheStats()` | 无 | `{size, entries}` | 获取缓存统计信息 |

---

## 🌍 支持的地区（按字母顺序）

### 按首字母快速查找

**A**: `.ac` `.af` `.ag` `.ai` `.am` `.as` `.az`

**B**: `.bd` `.bh` `.bi` `.bm` `.bn` `.bs` `.bt` `.bz`

**C**: `.cf` `.cr` `.cu` `.cw`

**D**: `.dm` `.do`

**E**: `.eh`

**F**: `.fj` `.fk` `.fo`

**G**: `.ga` `.gd` `.gf` `.gh` `.gl` `.gm` `.gn` `.gs` `.gt` `.gw` `.gy`

**H**: `.hk` `.hn` `.ht`

**I**: `.io` `.iq` `.ir` `.is`

**J**: `.jm` `.jo`

**K**: `.ke` `.kh` `.ki` `.kg` `.kn` `.kp` `.kw`

**L**: `.la` `.lb` `.lc` `.lr` `.ls` `.lk`

**M**: `.ma` `.mg` `.ml` `.mm` `.mo` `.mr` `.mu` `.mv` `.mw` `.mz`

**N**: `.na` `.ne` `.ni` `.np`

**O**: `.om` `.os`

**P**: `.pa` `.pg` `.pk` `.ps` `.pw`

**Q**: `.qa`

**R**: `.rw`

**S**: `.sb` `.sc` `.sd` `.sh` `.sl` `.so` `.sr` `.ss` `.sv` `.sy` `.sz`

**T**: `.td` `.tg` `.tj` `.tk` `.tl` `.tn` `.to` `.tt` `.tv` `.tz`

**U**: `.ug` `.uz`

**V**: `.vc` `.vg` `.vi` `.vu`

**W**: `.ws`

**Y**: `.ye`

**Z**: `.zm` `.zw`

---

## 📊 按地区分类

| 地区 | TLD 数量 | 示例 |
|------|---------|------|
| 非洲 | 35+ | `.td`, `.cf`, `.ke`, `.ng`, `.za` |
| 太平洋 | 15+ | `.fj`, `.ws`, `.to`, `.vu`, `.tv` |
| 南美洲 | 5+ | `.br`, `.ar`, `.cl`, `.co`, `.pe` |
| 中亚 | 6+ | `.kg`, `.tj`, `.tm`, `.uz`, `.kz` |
| 中东 | 15+ | `.ir`, `.kp`, `.ye`, `.om`, `.qa` |
| 南亚 | 6+ | `.bd`, `.bt`, `.lk`, `.mv`, `.np` |
| 东南亚 | 5+ | `.kh`, `.la`, `.mm`, `.bn`, `.tl` |
| 加勒比 | 20+ | `.bs`, `.bb`, `.dm`, `.do`, `.jm` |

---

## 🔧 常见用法

### 验证域名 TLD 支持

```typescript
function isDomainTldSupported(domain: string): boolean {
  const tld = domain.split('.').pop();
  return tld ? isTldInLocalList(tld) : false;
}

// 使用
if (isDomainTldSupported('example.td')) {
  console.log('✓ 支持');
}
```

### 获取 TLD 的完整信息

```typescript
async function getTldInfo(tld: string) {
  const isLocal = isTldInLocalList(tld);
  const { server, source } = await getWhoisServerAddress(tld);
  
  return {
    tld,
    isSupported: !!server,
    isLocal,
    server,
    source,
  };
}
```

### 预加载常用 TLD

```typescript
async function initializeWhoisCache() {
  const commonTlds = ['com', 'org', 'net', 'co', 'io', 'td', 'cf'];
  await getWhoisServersForTlds(commonTlds);
}

// 在应用启动时调用
useEffect(() => {
  initializeWhoisCache();
}, []);
```

---

## ⚡ 性能提示

1. **使用缓存**：第一次查询后，后续查询将自动缓存
2. **批量查询**：使用 `getWhoisServersForTlds()` 而不是多次调用单个查询
3. **预加载**：在应用启动时预加载常用 TLD
4. **监控缓存**：定期检查 `getWhoisServerCacheStats()` 以优化性能

### 缓存 TTL

- **默认 TTL**：1 小时（3,600,000 毫秒）
- **修改缓存**：编辑 `whoisServerManager.ts` 中的 `CACHE_TTL`
- **手动清除**：调用 `clearWhoisServerCache()`

---

## 🐛 故障排除

### 问题 1：无法查询特定 TLD

**检查清单：**
- [ ] TLD 在 `localWhoisServers.ts` 中吗？
- [ ] WHOIS 服务器地址正确吗？
- [ ] 网络连接是否正常？
- [ ] 防火墙是否阻止了连接？

**解决方案：**
```typescript
// 检查本地列表
import { getLocalTlds } from '@/lib/localWhoisServers';
const allTlds = getLocalTlds();
console.log('你的 TLD 在列表中吗？', allTlds.includes('td'));

// 获取服务器信息
const { server, source } = await getWhoisServerAddress('td');
console.log('服务器:', server, '来源:', source);
```

### 问题 2：查询缓慢

**优化建议：**
```typescript
// 1. 检查缓存状态
const stats = getWhoisServerCacheStats();
console.log('缓存大小:', stats.size);

// 2. 预加载常用 TLD
await getWhoisServersForTlds(['com', 'org', 'net', 'td', 'cf']);

// 3. 增加缓存 TTL
// 编辑 whoisServerManager.ts，将 CACHE_TTL 改为更大的值
```

### 问题 3：本地列表与数据库不一致

**说明**：本地列表优先级更高，会覆盖数据库中的值

**解决方案**：
- 确保 `localWhoisServers.ts` 与 `local-whois-supplement.ts` 同步
- 需要更新时，编辑本地列表文件

---

## 📝 文件映射

| 文件 | 用途 | 访问方式 |
|------|------|---------|
| `src/lib/localWhoisServers.ts` | 前端本地列表 | `import { ... } from '@/lib/localWhoisServers'` |
| `src/lib/whoisServerManager.ts` | 前端管理器 | `import { ... } from '@/lib/whoisServerManager'` |
| `supabase/functions/domain-lookup/local-whois-supplement.ts` | Edge Function 列表 | `import { ... } from './local-whois-supplement'` |
| `WHOIS_ENHANCEMENT_GUIDE.md` | 完整文档 | 详细说明和设计 |
| `WHOIS_INTEGRATION_EXAMPLES.md` | 代码示例 | 实际使用示例 |

---

## 💡 最佳实践

### ✅ DO

- ✅ 使用 `getWhoisServerAddress()` 获取服务器信息
- ✅ 在应用启动时预加载常用 TLD
- ✅ 定期检查缓存统计信息
- ✅ 添加新 TLD 时同步两个列表文件
- ✅ 使用批量查询而不是逐个查询

### ❌ DON'T

- ❌ 直接从 `localWhoisServers.ts` 访问（使用管理器函数）
- ❌ 频繁清除缓存（让 TTL 自动处理）
- ❌ 在组件每次渲染时查询（使用 useEffect 或 useMemo）
- ❌ 硬编码 WHOIS 服务器地址
- ❌ 忘记在 Edge Function 中更新 `local-whois-supplement.ts`

---

## 🔗 相关链接

- [完整指南](./WHOIS_ENHANCEMENT_GUIDE.md)
- [代码示例](./WHOIS_INTEGRATION_EXAMPLES.md)
- [Supabase 文档](https://supabase.com/docs)
- [WHOIS 协议规范](https://www.rfc-editor.org/rfc/rfc3912)

---

**最后更新**: 2024 年  
**版本**: 1.0  
**状态**: ✅ 生产就绪
