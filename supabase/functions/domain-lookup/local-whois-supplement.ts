/**
 * WHOIS 服务器本地补充列表 - 用于 Supabase Edge Function
 * 与前端的 localWhoisServers.ts 保持同步
 * 用于补充 Supabase 数据库中的缺失 TLD 支持
 */

export const LOCAL_WHOIS_SERVERS_SUPPLEMENT: Record<string, string> = {
  // ==================== 非洲国家代码 TLD (补充缺失的) ====================
  'td': 'whois.nic.td',        // 乍得 Chad
  'cf': 'whois.nic.cf',        // 中非共和国 Central African Republic
  'ga': 'whois.nic.ga',        // 加蓬 Gabon
  'gm': 'whois.nic.gm',        // 冈比亚 Gambia
  'gh': 'whois.nic.gh',        // 加纳 Ghana
  'gn': 'whois.nic.gn',        // 几内亚 Guinea
  'gw': 'whois.nic.gw',        // 几内亚比绍 Guinea-Bissau
  'ke': 'whois.kenic.or.ke',   // 肯尼亚 Kenya
  'lr': 'whois.nic.lr',        // 利比里亚 Liberia
  'ls': 'whois.nic.ls',        // 莱索托 Lesotho
  'mg': 'whois.nic.mg',        // 马达加斯加 Madagascar
  'mw': 'whois.nic.mw',        // 马拉维 Malawi
  'ml': 'whois.nic.ml',        // 马里 Mali
  'mr': 'whois.nic.mr',        // 毛里塔尼亚 Mauritania
  'mu': 'whois.nic.mu',        // 毛里求斯 Mauritius
  'ma': 'whois.nic.ma',        // 摩洛哥 Morocco
  'mz': 'whois.nic.mz',        // 莫桑比克 Mozambique
  'na': 'whois.nic.na',        // 纳米比亚 Namibia
  'ne': 'whois.nic.ne',        // 尼日尔 Niger
  'ng': 'whois.nic.ng',        // 尼日利亚 Nigeria
  'rw': 'whois.nic.rw',        // 卢旺达 Rwanda
  'st': 'whois.nic.st',        // 圣多美和普林西比 Sao Tome and Principe
  'sn': 'whois.nic.sn',        // 塞内加尔 Senegal
  'sc': 'whois2.afilias-grs.net', // 塞舌尔 Seychelles
  'sl': 'whois.nic.sl',        // 塞拉利昂 Sierra Leone
  'so': 'whois.nic.so',        // 索马里 Somalia
  'ss': 'whois.nic.ss',        // 南苏丹 South Sudan
  'sd': 'whois.nic.sd',        // 苏丹 Sudan
  'sz': 'whois.nic.sz',        // 斯威士兰 Eswatini
  'tz': 'whois.tznic.or.tz',   // 坦桑尼亚 Tanzania
  'tg': 'whois.nic.tg',        // 多哥 Togo
  'tn': 'whois.nic.tn',        // 突尼斯 Tunisia
  'ug': 'whois.nic.ug',        // 乌干达 Uganda
  'zm': 'whois.nic.zm',        // 赞比亚 Zambia
  'zw': 'whois.nic.zw',        // 津巴布韦 Zimbabwe
  
  // ==================== 太平洋岛国 ====================
  'ki': 'whois.nic.ki',        // 基里巴斯 Kiribati
  'pw': 'whois.nic.pw',        // 帕劳 Palau
  'pg': 'whois.nic.pg',        // 巴布亚新几内亚 Papua New Guinea
  'sb': 'whois.nic.sb',        // 所罗门群岛 Solomon Islands
  'tk': 'whois.nic.tk',        // 托克劳 Tokelau
  'to': 'whois.nic.to',        // 汤加 Tonga
  'tv': 'whois.nic.tv',        // 图瓦卢 Tuvalu
  'vu': 'whois.nic.vu',        // 瓦努阿图 Vanuatu
  'ws': 'whois.nic.ws',        // 萨摩亚 Samoa
  'fj': 'whois.nic.fj',        // 斐济 Fiji
  
  // ==================== 南美洲 ====================
  'sr': 'whois.nic.sr',        // 苏里南 Suriname
  'gf': 'whois.nic.gf',        // 法属圭亚那 French Guiana
  'gy': 'whois.nic.gy',        // 圭亚那 Guyana
  'fk': 'whois.nic.fk',        // 福克兰群岛 Falkland Islands
  'gs': 'whois.nic.gs',        // 南乔治亚和南桑威奇群岛 South Georgia
  
  // ==================== 中亚和高加索 ====================
  'kg': 'whois.nic.kg',        // 吉尔吉斯斯坦 Kyrgyzstan
  'tj': 'whois.nic.tj',        // 塔吉克斯坦 Tajikistan
  'tm': 'whois.nic.tm',        // 土库曼斯坦 Turkmenistan
  'uz': 'whois.nic.uz',        // 乌兹别克斯坦 Uzbekistan
  'ab': 'whois.nic.ab',        // 阿布哈兹 Abkhazia
  'os': 'whois.nic.os',        // 南奥塞梯 South Ossetia
  
  // ==================== 中东和西亚 ====================
  'af': 'whois.nic.af',        // 阿富汗 Afghanistan
  'ps': 'whois.pnina.ps',      // 巴勒斯坦 Palestine
  'ye': 'whois.nic.ye',        // 也门 Yemen
  'om': 'whois.nic.om',        // 阿曼 Oman
  'qa': 'whois.registry.qa',   // 卡塔尔 Qatar
  'bh': 'whois.nic.bh',        // 巴林 Bahrain
  'kw': 'whois.nic.kw',        // 科威特 Kuwait
  'jo': 'whois.nic.jo',        // 约旦 Jordan
  'lb': 'whois.nic.lb',        // 黎巴嫩 Lebanon
  'sy': 'whois.nic.sy',        // 叙利亚 Syria
  'iq': 'whois.nic.iq',        // 伊拉克 Iraq
  'kp': 'whois.nic.kp',        // 朝鲜 North Korea
  'ir': 'whois.nic.ir',        // 伊朗 Iran
  
  // ==================== 南亚 ====================
  'bt': 'whois.nic.bt',        // 不丹 Bhutan
  'mv': 'whois.nic.mv',        // 马尔代夫 Maldives
  'np': 'whois.nic.np',        // 尼泊尔 Nepal
  'lk': 'whois.nic.lk',        // 斯里兰卡 Sri Lanka
  'bd': 'whois.nic.bd',        // 孟加拉 Bangladesh
  'pk': 'whois.nic.pk',        // 巴基斯坦 Pakistan
  
  // ==================== 东南亚 ====================
  'mm': 'whois.nic.mm',        // 缅甸 Myanmar
  'la': 'whois.nic.la',        // 老挝 Laos
  'kh': 'whois.nic.kh',        // 柬埔寨 Cambodia
  'bn': 'whois.nic.bn',        // 文莱 Brunei
  'tl': 'whois.nic.tl',        // 东巴布亚 East Timor
  
  // ==================== 中亚欧洲边境 ====================
  'az': 'whois.nic.az',        // 阿塞拜疆 Azerbaijan
  'ge': 'whois.nic.ge',        // 格鲁吉亚 Georgia
  'am': 'whois.nic.am',        // 亚美尼亚 Armenia
  
  // ==================== 北欧 ====================
  'is': 'whois.isnic.is',      // 冰岛 Iceland
  'fo': 'whois.nic.fo',        // 法罗群岛 Faroe Islands
  'gl': 'whois.nic.gl',        // 格陵兰 Greenland
  
  // ==================== 中欧和东欧 ====================
  'md': 'whois.nic.md',        // 摩尔多瓦 Moldova
  'by': 'whois.nic.by',        // 白俄罗斯 Belarus
  
  // ==================== 加勒比地区 ====================
  'bs': 'whois.nic.bs',        // 巴哈马 Bahamas
  'bb': 'whois.nic.bb',        // 巴巴多斯 Barbados
  'bz': 'whois.nic.bz',        // 伯利兹 Belize
  'ky': 'whois.nic.ky',        // 开曼群岛 Cayman Islands
  'cr': 'whois.nic.cr',        // 哥斯达黎加 Costa Rica
  'do': 'whois.nic.do',        // 多米尼加共和国 Dominican Republic
  'sv': 'whois.nic.sv',        // 萨尔瓦多 El Salvador
  'gd': 'whois.nic.gd',        // 格林纳达 Grenada
  'gt': 'whois.nic.gt',        // 危地马拉 Guatemala
  'ht': 'whois.nic.ht',        // 海地 Haiti
  'hn': 'whois.nic.hn',        // 洪都拉斯 Honduras
  'jm': 'whois.nic.jm',        // 牙买加 Jamaica
  'ni': 'whois.nic.ni',        // 尼加拉瓜 Nicaragua
  'pa': 'whois.nic.pa',        // 巴拿马 Panama
  'tt': 'whois.nic.tt',        // 特立尼达和多巴哥 Trinidad and Tobago
  'vc': 'whois.nic.vc',        // 圣文森特和格林纳丁斯 Saint Vincent
  'lc': 'whois.nic.lc',        // 圣露西亚 Saint Lucia
  'kn': 'whois.nic.kn',        // 圣基茨和尼维斯 Saint Kitts and Nevis
  'ag': 'whois.nic.ag',        // 安提瓜和巴布达 Antigua and Barbuda
  'dm': 'whois.nic.dm',        // 多米尼克 Dominica
  'vg': 'whois.nic.vg',        // 英属维京群岛 British Virgin Islands
  'vi': 'whois.nic.vi',        // 美属维京群岛 US Virgin Islands
  'pr': 'whois.nic.pr',        // 波多黎各 Puerto Rico
  'tc': 'whois.nic.tc',        // 特克斯和凯科斯群岛 Turks and Caicos Islands
  'ai': 'whois2.afilias-grs.net', // 安圭拉 Anguilla
  'bm': 'whois.nic.bm',        // 百慕大 Bermuda
  
  // ==================== 其他特殊TLD ====================
  'hk': 'whois.hkirc.hk',      // 香港 Hong Kong (备用服务器)
  'mo': 'whois.monic.mo',      // 澳门 Macau
  'io': 'whois.nic.io',        // 英属印度洋领土 British Indian Ocean Territory
  'sh': 'whois.nic.sh',        // 圣赫勒拿 Saint Helena
  'ac': 'whois.nic.ac',        // 阿松森岛 Ascension Island
  'bi': 'whois.nic.bi',        // 布隆迪 Burundi
};

/**
 * 从本地补充列表获取 WHOIS 服务器
 * 用于 Edge Function 中的查询
 */
export function getLocalWhoisServer(tld: string): string | null {
  const cleanTld = tld.toLowerCase().replace(/^\./, '');
  return LOCAL_WHOIS_SERVERS_SUPPLEMENT[cleanTld] || null;
}

/**
 * 检查 TLD 是否在本地补充列表中
 */
export function hasLocalWhoisServer(tld: string): boolean {
  const cleanTld = tld.toLowerCase().replace(/^\./, '');
  return cleanTld in LOCAL_WHOIS_SERVERS_SUPPLEMENT;
}
