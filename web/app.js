/* ================= 基础工具 ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = n => String(n).padStart(2, '0');
const fmtD = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtT = t => { const d = new Date(t); return `${fmtD(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const daysTo = s => {
  const now = new Date();
  return Math.round((Date.parse(s) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
};
const hoursAgo = h => Date.now() - h * 3600e3;
function rng(seed) { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const hashHex = (seed, n = 64) => { const r = rng(seed); let h = ''; while (h.length < n) h += Math.floor(r() * 16).toString(16); return h; };
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2800); }

/* ================= 业务线、成员与权限 ================= */
const LINES = { kj: '跨境电商', game: '游戏设计' };
const ROLES = { audit: '审核', ops: '运营', design: '设计', legal: '法务', admin: '系统管理员' };
const BIZ_ROLES = ['audit', 'ops', 'design'];
const USERS = [
  { id: 'u1', name: '林宁', role: 'audit', lines: ['kj'], color: '#3370FF', demo: '业务1 · 跨境电商' },
  { id: 'u2', name: '何琪', role: 'ops', lines: ['game'], color: '#2EA121', demo: '业务2 · 游戏设计' },
  { id: 'u3', name: '周岚', role: 'legal', lines: Object.keys(LINES), color: '#7B61FF', demo: '法务' },
  { id: 'u4', name: '王磊', role: 'admin', lines: Object.keys(LINES), color: '#FF8800', demo: '管理员' },
  { id: 'u5', name: '赵晴', role: 'ops', lines: ['kj'], color: '#00A3A3' },
  { id: 'u6', name: '陈卓', role: 'design', lines: ['kj'], color: '#B34FD6' },
  { id: 'u7', name: '刘洋', role: 'audit', lines: ['game'], color: '#F54A45' },
  { id: 'u8', name: '孙悦', role: 'design', lines: ['game'], color: '#DE7802' },
];
const PERMS = [
  ['view', '查看本业务线的素材与证据'],
  ['viewAll', '查看全部业务线'],
  ['upload', '上传素材 / 上传替换版本'],
  ['deleteDraft', '删除本人尚未提交法务的素材'],
  ['fix', '修正证据：排除误报来源、补框、重新检索'],
  ['submit', '提交法务审核'],
  ['replace', '标记需替换'],
  ['assign', '转交处理人'],
  ['ledger', '查看 / 维护授权台账'],
  ['legal', '法务审核：元素认定、放行高风险、要求补授权 / 替换'],
  ['rules', '调整阈值与风险规则（发布新版本）'],
  ['config', '管理来源域名、客户白名单与数据合规'],
  ['members', '管理成员与权限'],
  ['log', '查看操作日志'],
];
const GRANT = {
  audit: new Set(['view', 'upload', 'deleteDraft', 'fix', 'submit', 'replace', 'assign']),
  ops: new Set(['view', 'upload', 'deleteDraft', 'submit', 'replace', 'assign']),
  design: new Set(['view', 'upload', 'deleteDraft']),
  legal: new Set(['view', 'viewAll', 'fix', 'legal', 'ledger']),
  admin: new Set(['view', 'viewAll', 'rules', 'config', 'members', 'log']),
};
let me = USERS[0];
const can = p => GRANT[me.role].has(p);
const isBiz = (u = me) => BIZ_ROLES.includes(u.role);
const actor = () => `${me.name}（${ROLES[me.role]}）`;
const userBy = n => USERS.find(u => u.name === n);
const myLines = () => can('viewAll') ? Object.keys(LINES) : me.lines;
const lineOf = m => CLIENTS[m.client].line;
const canSee = m => !!m && myLines().includes(lineOf(m));
const handlers = line => USERS.filter(u => ['audit', 'ops'].includes(u.role) && u.lines.includes(line));
const opsOf = line => handlers(line)[0]?.name || '未指派';

/* ================= 客户与数据合规 ================= */
const ENGINES = {
  hy4: { n: '腾讯混元 Hy4 元素拆分', zone: '云端' },
  gemini: { n: 'Gemini 元素拆分', zone: '境外' },
  local: { n: '本地检查 / 参考库', zone: '本地' },
  google: { n: 'Google Vision 反搜', zone: '境外' },
  baidu: { n: '百度识图', zone: '境内' },
};
const CLIENTS = {
  fizzo: { name: 'Fizzo 饮品（跨境快消）', line: 'kj', domains: ['fizzo-drinks.com'], engines: ['gemini', 'google', 'baidu'], retain: 90, note: '' },
  arcana: { name: 'Arcana（出海手游）', line: 'game', domains: ['playarcana.com'], engines: ['gemini', 'google', 'baidu'], retain: 90, note: '' },
  sonique: { name: 'Sonique（消费电子）', line: 'kj', domains: ['sonique-audio.com'], engines: ['gemini', 'google', 'baidu'], retain: 90, note: '' },
  lumi: { name: 'Lumi Beauty（美妆护肤）', line: 'kj', domains: ['lumi-beauty.com'], engines: ['local', 'baidu'], retain: 30, note: '合同约定：未发布素材不得出境' },
  stridex: { name: 'Stridex（跨境电商 · 鞋服）', line: 'kj', domains: ['stridex.shop'], engines: ['gemini', 'google', 'baidu'], retain: 90, note: '' },
  pocketgo: { name: 'PocketGo（休闲手游）', line: 'game', domains: ['pocketgo.app'], engines: ['gemini', 'google', 'baidu'], retain: 90, note: '' },
};
function initializeHy4Policy() {
  for (const [id, client] of Object.entries(CLIENTS)) {
    if (client.hy4PolicyInitialized) continue;
    if (id !== 'lumi' && client.engines.includes('gemini') && !client.engines.includes('hy4')) client.engines.push('hy4');
    client.hy4PolicyInitialized = true;
  }
}
const CHANNELS = ['Meta', 'Meta · Instagram', 'TikTok', 'Google Ads', '其他'];
const REGIONS = ['全球', '北美', '欧洲', '东南亚', '中国大陆', '其他'];
const MATERIAL_LABELS = { party: '使用方', purpose: '使用目的' };
const purposeText = purpose => purpose || '未填写';
const LEDGER_CFG = { expiryDays: 60 }; // 授权到期提前提醒（天），在授权台账页设置

/* ================= 来源域名字典 ================= */
const TYPE_N = { stock: '版权图库', creator: '社交 / 创作平台', news: '新闻媒体', other: '其他网站', client: '使用方自有' };
const TYPE_C = { stock: 'red', creator: 'purple', news: 'blue', other: 'gray', client: 'green' };
let DICT = [
  ...['com', 'co.uk', 'co.jp', 'com.au', 'com.br', 'ca', 'de', 'fr', 'es', 'it', 'nl', 'se', 'in', 'hk', 'dk', 'fi', 'no', 'be', 'pt', 'at', 'ae', 'com.mx', 'co.nz'].map(tld => ['gettyimages.' + tld, 'stock', 'Getty Images']),
  ['photo-static-api.fotomore.com', 'stock', '视觉中国 · Fotomore'], ['istock.com', 'stock', 'iStock（Getty 旗下）'], ['veer.com', 'stock', 'Veer'], ['unsplash.com', 'creator', 'Unsplash · 授权待确认'], ['istockphoto.com', 'stock', 'iStock（Getty 旗下）'], ['shutterstock.com', 'stock', 'Shutterstock'],
  ['vcg.com', 'stock', '视觉中国'], ['cfp.cn', 'stock', '视觉中国'], ['hellorf.com', 'stock', '站酷海洛'], ['quanjing.com', 'stock', '全景网'],
  ['stock.adobe.com', 'stock', 'Adobe Stock'], ['alamy.com', 'stock', 'Alamy'], ['123rf.com', 'stock', '123RF'], ['dreamstime.com', 'stock', 'Dreamstime'],
  ['depositphotos.com', 'stock', 'Depositphotos'], ['pngtree.com', 'stock', 'Pngtree'], ['freepik.com', 'stock', 'Freepik'],
  ['instagram.com', 'creator', 'Instagram'], ['pinterest.com', 'creator', 'Pinterest'], ['x.com', 'creator', 'X / Twitter'], ['facebook.com', 'creator', 'Facebook'],
  ['weibo.com', 'creator', '微博'], ['xiaohongshu.com', 'creator', '小红书'], ['douyin.com', 'creator', '抖音'], ['tiktok.com', 'creator', 'TikTok'],
  ['artstation.com', 'creator', 'ArtStation'], ['500px.com', 'creator', '500px'], ['behance.net', 'creator', 'Behance'],
  ['reuters.com', 'news', 'Reuters'], ['apnews.com', 'news', 'AP News'], ['variety.com', 'news', 'Variety'], ['xinhuanet.com', 'news', '新华网'],
  ['sina.com.cn', 'news', '新浪'], ['163.com', 'news', '网易'], ['thepaper.cn', 'news', '澎湃新闻'], ['bbc.com', 'news', 'BBC'],
];
const hostOf = url => { try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '') : ''; } catch { return ''; } };
const domainInput = value => hostOf(/^https?:\/\//i.test(value) ? value : 'https://' + value);
const domMatch = (host, d) => host === d || host.endsWith('.' + d);
function classify(url, mat) {
  if (url.startsWith('/reference/')) return { type: 'other', name: '本地参考库', host: '' };
  const host = hostOf(url);
  if (host === 'ak.picdn.net' && new URL(url).pathname.startsWith('/shutterstock/')) return {type: 'stock', name: 'Shutterstock', host: 'shutterstock.com'};
  if (host === 'embed.gettyimages.com') return {type: 'other', name: 'Getty Images · 嵌入链接', host};
  if ((CLIENTS[mat.client]?.domains || []).some(d => domMatch(host, d))) return { type: 'client', name: '使用方自有页面', host };
  const hit = DICT.filter(([d]) => domMatch(host, d)).sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? { type: hit[1], name: hit[2], host } : { type: 'other', name: host, host };
}
const STOCK_KW = [['gettyimages', 'Getty Images'], ['getty images', 'Getty Images'], ['istock', 'iStock'], ['shutterstock', 'Shutterstock'], ['vcg', '视觉中国'], ['视觉中国', '视觉中国'], ['adobe stock', 'Adobe Stock'], ['alamy', 'Alamy'], ['123rf', '123RF'], ['dreamstime', 'Dreamstime']];
const FREE_FONTS = ['思源黑体', '思源宋体', '阿里巴巴普惠体', '站酷高端黑', 'HarmonyOS Sans'];

/* ================= 授权台账 ================= */
const LICENSE_LABELS = { no: '授权编号', kind: '素材类型', vendor: '授权方', asset: '素材', client: '使用方', use: '使用用途', channels: '媒介渠道', regions: '授权地区', term: '授权期限', state: '状态', file: '授权凭证' };
let LICENSES = [
  { no: 'SS-2025-0412', kind: '图片', vendor: 'Shutterstock', domain: 'shutterstock.com', asset: '1934567890', client: 'stridex', use: '商业广告', channels: ['全部'], regions: ['全球'], start: '2025-12-01', end: '2026-12-31', holder: '代理商（我方）', file: 'SS-2025-0412_license.pdf' },
  { no: 'GT-2024-1187', kind: '图片', vendor: 'Getty Images', domain: 'gettyimages.com', asset: '1287654321', client: 'fizzo', use: '编辑用途', channels: ['全部'], regions: ['全球'], start: '2024-06-01', end: '2027-05-31', holder: '客户', file: 'GT-2024-1187_editorial.pdf' },
  { no: 'FZ-2025-0318', kind: '字体', vendor: '方正字库', domain: '', asset: '方正兰亭特黑', client: 'fizzo', use: '商业广告', channels: ['全部'], regions: ['全球'], start: '2025-03-01', end: '2027-02-28', holder: '客户', file: 'FZ-2025-0318.pdf' },
  { no: 'FZ-2025-0702', kind: '字体', vendor: '方正字库', domain: '', asset: '方正兰亭粗黑', client: 'lumi', use: '商业广告', channels: ['全部'], regions: ['全球'], start: '2025-12-21', end: '2026-12-20', holder: '客户', file: 'FZ-2025-0702.pdf' },
  { no: 'VCG-2025-2210', kind: '图片', vendor: '视觉中国', domain: 'vcg.com', asset: '1099887766', client: 'sonique', use: '商业广告', channels: ['Google Ads'], regions: ['中国大陆'], start: '2025-05-01', end: '2026-04-30', holder: '客户', file: 'VCG-2025-2210.pdf' },
].map(l => ({ ...l, demo: true, ...(l.kind === '图片' ? { preview: altThumb(l.no, '背景图'), demoPreview: true } : {}) }));
const assetOf = url => { try { return (new URL(url).pathname.match(/(?<!\d)\d{8,}(?!\d)/g) || []).pop(); } catch { return undefined; } };
function scopeIssues(l, m) {
  const out = [];
  if (l.use !== '商业广告') out.push(`${LICENSE_LABELS.use}为「${l.use}」，不可用于商业广告`);
  if (!l.channels.includes('全部') && !l.channels.some(c => m.channel.includes(c))) out.push(`${LICENSE_LABELS.channels}（${l.channels.join('、')}）不含 ${m.channel}`);
  if (!l.regions.includes('全球') && !l.regions.includes(m.region)) out.push(`${LICENSE_LABELS.regions}（${l.regions.join('、')}）不含 ${m.region}`);
  const useDate = [fmtD(Date.now()), m.launch].sort().pop();
  if (l.start > useDate) out.push(`${LICENSE_LABELS.term}从 ${l.start} 才开始`);
  if (l.end < useDate) out.push(`${LICENSE_LABELS.term}截止于 ${l.end}，不覆盖 ${useDate}`);
  return out;
}
// 同一资产可能有多条授权（如先有编辑类、后补购商用），优先取范围相符的那条
const bestLic = (mat, ls) => ls.find(l => !scopeIssues(l, mat).length) || ls[0];
const imgLic = (mat, host, url) => bestLic(mat, LICENSES.filter(l => l.kind === '图片' && (mat.demo || !l.demo) && l.client === mat.client && l.domain && domMatch(host, l.domain) && assetOf(url) === l.asset));
const fontLic = (mat, name) => bestLic(mat, LICENSES.filter(l => l.kind === '字体' && (mat.demo || !l.demo) && l.client === mat.client && l.asset === name));
function licUsage(l) { return materials.filter(m => m.status === 'done' && m.client === l.client && (l.kind === '字体' ? m.elements.some(e => e.font?.name === l.asset) : m.elements.some(e => e.matches.some(x => assetOf(x.url) === l.asset)))); }

/* ================= 风险规则（版本化） ================= */
const RULES = {
  active: 3,
  versions: [
    { v: 1, H: 85, M: 70, creatorHigh: false, portrait: false, font: false, fontHigh: false, by: '王磊（系统管理员）', at: '2026-09-01 10:00', note: '初始版本：按来源类型分级' },
    { v: 2, H: 85, M: 70, creatorHigh: false, portrait: false, font: true, fontHigh: false, by: '王磊（系统管理员）', at: '2026-10-15 14:20', note: '新增商用字体检测' },
    { v: 3, H: 85, M: 70, creatorHigh: true, portrait: true, font: true, fontHigh: false, by: '王磊（系统管理员）', at: '2026-11-20 09:30', note: '依据法务评审：个人创作者作品无公开授权渠道、真人肖像无法事后补救，命中即判高风险' },
  ],
};
const ruleOf = v => RULES.versions.find(r => r.v === v) || RULES.versions.find(r => r.v === RULES.active);
const activeRule = () => ruleOf(RULES.active);
const RULE_FIELDS = [
  ['creatorHigh', '社交 / 创作平台高度相似 → 高风险', '个人作品通常没有公开授权渠道，关闭时只判中风险'],
  ['portrait', '启用真人肖像检查', '画面有真人面部：外部同人像 → 高风险；未关联肖像授权 → 中风险'],
  ['font', '启用商用字体检测', 'OCR 识别字体后核对字体授权台账；免费商用字体自动通过'],
  ['fontHigh', '未授权商用字体 → 高风险', '默认中风险（可补购），开启后按高风险拦截'],
];

/* ================= 相似度 ================= */
// 综合相似度 = 0.5·CLIP 语义 + 0.3·pHash 结构 + 0.2·ORB 局部特征（仅作排序与阈值，界面上默认折叠）
const phSim = m => 1 - m.ph / 64, orbN = m => Math.min(m.orb / 150, 1);
const score = m => m.localScore ?? m.fallbackScore ?? Math.round(100 * (0.5 * m.clip + 0.3 * phSim(m) + 0.2 * orbN(m)));
const SAME = { 完全匹配: '为同一张图片', 局部匹配: '为同一张图片的局部（经裁剪 / 缩放）', 相似图: '高度相似（可能经调色或轻微修改）' };

/* ================= 判定 ================= */
const KIND = { copyright: ['著作权', 'red'], portrait: ['肖像权', 'purple'], font: ['字体版权', 'orange'], ip: ['影视 / IP', 'red'], trademark: ['商标', 'blue'] };
const REMEDY = { buy: ['可补购授权', 'green'], replace: ['建议替换', 'red'], verify: ['需核实授权', 'orange'] };
const LV = ['low', 'mid', 'high'], LVN = { low: '低风险', mid: '中风险', high: '高风险' };
const riskLabel = lv => LVN[LV[lv]] || '待人工核对';

function evalEl(e, mat, r = ruleOf(mat.ruleVer)) {
  if (e.status === 'searching') return { lv: -1, items: [], notes: ['检索中…'] };
  const items = [], notes = [];
  if (e.skip) notes.push(e.skip);
  if (e.searchNote) notes.push(e.searchNote);
  if (e.ocr) {
    const k = STOCK_KW.find(([kw]) => e.ocr.toLowerCase().includes(kw));
    if (k) items.push({ lv: 2, kind: 'copyright', remedy: 'buy', text: `画面中残留 ${k[1]} 相关文字「${e.ocr}」，需核对是否为预览水印及对应授权` });
  }
  if (e.font) {
    if (!r.font) notes.push(`规则 v${r.v} 未启用字体检测`);
    else if (FREE_FONTS.includes(e.font.name)) notes.push(`字体「${e.font.name}」为免费商用字体`);
    else {
      const l = fontLic(mat, e.font.name), iss = l ? scopeIssues(l, mat) : [];
      if (l && !iss.length) notes.push(`字体「${e.font.name}」已匹配授权 ${l.no}`);
      else items.push({ lv: r.fontHigh ? 2 : 1, kind: 'font', remedy: 'buy', text: l ? `字体「${e.font.name}」有授权 ${l.no}，但${iss.join('；')}` : `文字使用商用字体「${e.font.name}」（${e.font.vendor}），未找到该使用方的字体授权` });
    }
  }
  for (const m of e.matches) {
    const c = classify(m.url, mat), s = score(m);
    if (m.dismissed) { notes.push(`已排除 ${c.name}（${s}）：${m.dismissed.by} 认定非同一图片`); continue; }
    if (c.type === 'client') { notes.push(`命中使用方自有域名 ${c.host}（${s}），请按实际来源核对`); continue; }
    if (m.reference) {
      items.push({ lv: 1, kind: 'copyright', remedy: 'verify', m, text: `与本地参考「${m.reference}」的图像结构接近（pHash 距离 ${m.ph}），请核对来源及授权`, csvText: `与本地参考图「${m.reference}」相似，请核对来源和授权` });
      continue;
    }
    if (!mat.demo && m.mt === '相似图') { notes.push(`${c.name} 仅为视觉相似线索（${s}）`); continue; }
    const relation = mat.demo ? SAME[m.mt] : `被检索引擎标注为${m.mt}`;
    if (c.type === 'stock') {
      const l = imgLic(mat, c.host, m.url);
      if (l) {
        const iss = scopeIssues(l, mat);
        if (!iss.length) { notes.push(`${c.name} 图片 ${l.asset} 已匹配授权 ${l.no}，媒介渠道覆盖 ${mat.channel}，授权地区覆盖 ${mat.region}`); continue; }
        const scope = `虽有授权 ${l.no}，但${iss.join('；')}`;
        items.push({ lv: 2, kind: 'copyright', remedy: 'buy', m, text: `与 ${c.name} 图片 ${l.asset} ${relation}；${scope}`, csvText: `疑似使用 ${c.name} 图片 ${l.asset}；${scope}` });
        continue;
      }
    }
    let lv = 0, remedy = 'verify', tail = '';
    if (c.type === 'stock') { lv = s >= r.H ? 2 : s >= r.M ? 1 : 0; remedy = 'buy'; tail = '，未找到对应授权'; }
    else if (c.type === 'creator') { lv = s >= r.H ? (r.creatorHigh ? 2 : 1) : 0; remedy = 'replace'; tail = '，属个人作品，通常没有公开授权渠道'; }
    else lv = s >= r.H ? 1 : 0;
    if (lv) items.push({ lv, kind: 'copyright', remedy, m, text: `与${TYPE_N[c.type]}「${c.name}」上的图片${relation}（匹配分 ${s}）${tail}`, csvText: `疑似与「${c.name}」上的图片${m.mt === '局部匹配' ? '局部相同' : m.mt === '完全匹配' ? '相同' : '相似'}${tail}` });
    else if (s >= r.M) notes.push(`${c.name} 相似度 ${s}，未达该来源类型的风险阈值，仅作提示`);
    if (e.label === 'Logo' && s >= r.H) items.push({ lv: 2, kind: 'trademark', remedy: 'replace', m, text: `Logo 与 ${c.host} 上的标识一致，疑似使用他人商标` });
  }
  (e.flags || []).forEach(f => { if (!e.matches.some(m => m.dismissed && m.url.includes(f.host))) items.push({ lv: 2, kind: 'ip', remedy: 'replace', text: f.text }); });
  if (e.face && r.portrait) {
    const ext = e.matches.filter(m => !m.dismissed && classify(m.url, mat).type !== 'client' && !m.reference && (mat.demo || m.mt === '完全匹配' || m.mt === '局部匹配') && score(m) >= r.M);
    if (ext.length) items.push({ lv: 2, kind: 'portrait', remedy: 'replace', text: `画面中为真人面部，且同一人像出现在「${classify(ext[0].url, mat).name}」，需核对是否为同一人及是否有肖像授权` });
    else items.push({ lv: 1, kind: 'portrait', remedy: 'verify', text: '画面中为真人面部，需核对模特肖像授权（Model Release）' });
  }
  if (!items.length && !notes.length) notes.push(e.matches.length ? '疑似来源的相似度均低于阈值' : '未检索到高度相似来源');
  return { lv: items.reduce((a, it) => Math.max(a, it.lv), 0), items, notes };
}

function evalMat(mat, r = ruleOf(mat.ruleVer)) {
  if (mat.status !== 'done') return { lv: -1, items: [], sus: [] };
  let lv = 0; const items = [], sus = [];
  for (const e of mat.elements) {
    const ev = evalEl(e, mat, r);
    if (ev.lv > 0) { sus.push(e); ev.items.forEach(it => items.push({ ...it, e })); }
    lv = Math.max(lv, ev.lv);
  }
  for (const f of (mat.meta || [])) {
    if (f[2] === 'stock') {
      lv = Math.max(lv, 1); items.push({ lv: 1, kind: 'copyright', remedy: 'verify', meta: true, text: `文件元数据 ${f[0]} 含图库版权声明「${f[1]}」，说明原始文件来自图库`, csvText: `图片文件含图库版权声明「${f[1]}」，请核对来源和授权` });
    }
    if (f[2] === 'author') { lv = Math.max(lv, 1); items.push({ lv: 1, kind: 'copyright', remedy: 'verify', meta: true, text: `文件元数据含摄影师署名「${f[1]}」，需核实是否取得授权` }); }
  }
  items.sort((a, b) => b.lv - a.lv);
  if (!mat.demo && lv === 0 && mat.elements.some(e => !e.searchedWeb)) lv = -2;
  return { lv, items, sus };
}
function summary(ev) {
  if (ev.lv === -2) return '筛查覆盖有限，需人工核对';
  if (ev.lv <= 0) return '未发现需要处理的风险点';
  const n2 = ev.items.filter(i => i.lv === 2).length, buy = ev.items.filter(i => i.remedy === 'buy').length, rep = ev.items.filter(i => i.remedy === 'replace').length, ver = ev.items.filter(i => i.remedy === 'verify').length;
  return `共 ${ev.items.length} 个风险点${n2 ? `（高风险 ${n2}）` : ''}：` + [buy && `${buy} 项可补购授权`, rep && `${rep} 项建议替换`, ver && `${ver} 项需核实授权`].filter(Boolean).join('，');
}
const sigOf = mat => evalMat(mat).items.map(i => i.lv + ':' + i.text).sort().join('|'); // 风险点集合（含各自等级），与顺序无关
/* 素材状态：所有素材都须经法务审核。待提交法务（业务预筛）→ 法务审核中 → 可投放 / 待补授权 / 需替换（法务结论）→ 已替换（被新版本取代） */
const RS_C = { '待提交法务': 'blue', '法务审核中': 'purple', '待补授权': 'orange', '需替换': 'red', '可投放': 'green', '已替换': 'gray' };
const CONCLUDED = ['可投放', '待补授权', '需替换']; // 有结论，记录快照
const changed = m => m.status === 'done' && CONCLUDED.includes(m.review.status) && m.review.snap && (m.review.snap.lv !== evalMat(m).lv || m.review.snap.sig !== sigOf(m));
const bizOpen = m => m.status === 'done' && ['待提交法务', '待补授权', '需替换'].includes(m.review.status);
const legalOpen = m => m.status === 'done' && (m.review.status === '法务审核中' || (changed(m) && m.review.by === 'legal'));
const humanFinal = m => m.review.status === '已替换' || (['可投放', '需替换'].includes(m.review.status) && m.review.by === 'legal');
const expiringLic = l => daysTo(l.end) >= 0 && daysTo(l.end) <= LEDGER_CFG.expiryDays;
function expiring(m) { return m.status !== 'done' || m.review.status === '已替换' ? [] : LICENSES.filter(l => l.client === m.client && expiringLic(l) && licUsage(l).includes(m)); }
const riskEls = m => evalMat(m).sus;
const progress = m => { const s = riskEls(m); return { n: s.length, d: s.filter(e => e.dec).length }; };

/* ================= 日志 ================= */
const CONFIG_LOG = [
  { at: new Date('2026-11-20T09:30:00').getTime(), by: '王磊（系统管理员）', obj: '风险规则', act: '发布规则 v3', detail: RULES.versions[2].note },
  { at: new Date('2026-11-12T16:05:00').getTime(), by: '王磊（系统管理员）', obj: '客户配置', act: '修改数据合规', detail: 'Lumi Beauty：检索引擎限定为境内 / 本地（合同约定未发布素材不得出境）' },
  { at: new Date('2026-10-15T14:20:00').getTime(), by: '王磊（系统管理员）', obj: '风险规则', act: '发布规则 v2', detail: RULES.versions[1].note },
];
function logM(m, act, detail = '') { m.audit.unshift({ at: Date.now(), by: actor(), act, detail }); }
function logC(obj, act, detail = '') { CONFIG_LOG.unshift({ at: Date.now(), by: actor(), obj, act, detail }); }

/* ================= 示例数据 ================= */
const COLORS = { '整图': '#3370FF', '产品主体': '#3370FF', '人物': '#7B61FF', '背景图': '#00A3A3', 'Logo': '#FF8800', '水印': '#F54A45', '文字': '#B34FD6', '装饰元素': '#2EA121', '待标注': '#8F959E' };
const uid = () => 'e-' + crypto.randomUUID();
const E = (label, bbox, matches = [], more = {}) => ({ id: uid(), label, bbox, matches, source: 'auto', status: 'done', dec: null, ...more });
const mt = (url, type, clip, ph, orb, eng = 'Google Vision 反搜') => ({ url, mt: type, clip, ph, orb, eng });
const sys = (at, act, detail) => ({ at, by: '系统', act, detail });
function mk(o) {
  const m = { w: 800, h: 800, status: 'done', version: 1, prevId: null, audit: [], demo: true, ...o, src: svgURL(o.svg) };
  delete m.svg;
  m.engines = [...CLIENTS[m.client].engines];
  m.audit.push(sys(m.scanAt, '完成筛查', `规则 v${m.ruleVer} · ${m.engines.map(k => ENGINES[k].n).join(' / ')} · 耗时 ${m.time.total}s`));
  m.audit.push(sys(m.scanAt - 9e5, '上传素材', `${m.uploader} 上传 · ${MATERIAL_LABELS.purpose}：${purposeText(m.purpose)} · 处理人 ${m.review.assignee}`));
  return m;
}

const PURPOSE_PROMOTION = '黑五促销广告', PURPOSE_LAUNCH = '新品上线推广';
const materials = [
  mk({ id: 'm1', file: 'fizzo_beach_meta_1080.jpg', client: 'fizzo', channel: 'Meta', region: '北美', launch: '2026-11-28', purpose: PURPOSE_PROMOTION, uploader: '陈卓',
    svg: adFizzo(), time: { total: 8.4, split: 2.1, search: 4.9, cmp: 1.4 }, ruleVer: 3, scanAt: hoursAgo(26), review: { status: '待提交法务', assignee: '林宁' },
    elements: [
      E('背景图', [0, 0, 800, 800], [
        mt('https://www.gettyimages.com/detail/photo/tropical-beach-with-palm-tree-royalty-free-image/1287654321', '完全匹配', .96, 4, 168),
        mt('https://www.vcg.com/creative/1031287654', '完全匹配', .95, 6, 151, '百度识图'),
        mt('https://www.pinterest.com/pin/771234567890123456/', '局部匹配', .90, 12, 88)], { note: '已去除前景元素并补全（inpaint）后检索' }),
      E('水印', [200, 455, 400, 135], [], { ocr: 'gettyimages' }),
      E('人物', [125, 280, 180, 482], [mt('https://www.instagram.com/p/C8xYz12AbCd/', '相似图', .93, 9, 120)], { face: true }),
      E('产品主体', [478, 368, 134, 390], [mt('https://www.fizzo-drinks.com/products/sparkling-lime', '完全匹配', .97, 3, 175)]),
      E('Logo', [36, 36, 108, 108], [mt('https://www.fizzo-drinks.com/brand', '完全匹配', .98, 2, 120)]),
      E('文字', [120, 188, 560, 62], [], { font: { name: '方正兰亭特黑', vendor: '方正字库' } }),
      E('装饰元素', [625, 425, 105, 215], [mt('https://pngtree.com/freepng/summer-bubbles-element_8123456.html', '相似图', .89, 13, 70)]),
    ],
    meta: [['文件格式', 'JPEG · 1080×1080'], ['Software', 'Adobe Photoshop 26.1 (Macintosh)'], ['Exif:Model', 'Canon EOS 5D Mark IV', 'info'],
      ['XMP:Credit', 'Getty Images/iStockphoto', 'stock'], ['IPTC:CopyrightNotice', '© 2021 Getty Images', 'stock'], ['XMP:DocumentAncestors', '3 个嵌入图层来源', 'info']] }),

  mk({ id: 'm2', file: 'arcana_night_tiktok_v3.png', client: 'arcana', channel: 'TikTok', region: '全球', launch: '2026-12-01', purpose: PURPOSE_LAUNCH, uploader: '孙悦',
    svg: adArcana(), time: { total: 9.7, split: 2.4, search: 5.6, cmp: 1.7 }, ruleVer: 3, scanAt: hoursAgo(20), review: { status: '待补授权', assignee: '何琪', by: 'legal' },
    elements: [
      E('背景图', [0, 0, 800, 800], [
        mt('https://www.shutterstock.com/image-photo/neon-city-night-skyline-2251234567', '局部匹配', .94, 5, 150),
        mt('https://variety.com/2024/film/news/neon-city-sequel-first-look-1235987654/', '局部匹配', .90, 9, 110)],
        { note: '新闻媒体同图配文为电影首曝剧照', flags: [{ host: 'variety.com', text: 'Variety 同图配文显示为电影《Neon City 2》首曝剧照，涉及影视作品著作权，片方通常不对广告用途授权' }] }),
      E('人物', [295, 228, 280, 495], [
        mt('https://www.artstation.com/artwork/nE8xQ2', '完全匹配', .93, 7, 140),
        mt('https://www.pinterest.com/pin/7712345678901234/', '相似图', .90, 10, 95)], { note: '插画角色（非真人），按美术作品著作权判断' }),
      E('Logo', [212, 32, 376, 102], [mt('https://playarcana.com/press-kit', '完全匹配', .97, 3, 130)]),
      E('文字', [225, 738, 350, 48], [], { font: { name: '汉仪菱心体', vendor: '汉仪字库' } }),
      E('装饰元素', [600, 325, 130, 130], []),
    ],
    meta: [['文件格式', 'PNG · 1080×1080'], ['EXIF / XMP', '已被清除（合成导出常见，不作为降级依据）', 'info']] }),

  mk({ id: 'm3', file: 'sonique_alps_google_1200.jpg', client: 'sonique', channel: 'Google Ads', region: '全球', launch: '2026-11-27', purpose: PURPOSE_PROMOTION, uploader: '林宁',
    svg: adSonique(), time: { total: 7.9, split: 1.9, search: 4.7, cmp: 1.3 }, ruleVer: 3, scanAt: hoursAgo(25), review: { status: '法务审核中', assignee: '林宁' },
    elements: [
      E('背景图', [0, 0, 800, 800], [
        mt('https://www.vcg.com/creative/1028765432', '完全匹配', .95, 4, 160, '百度识图'),
        mt('https://500px.com/photo/1045678901/alpine-lake-at-dawn', '局部匹配', .91, 8, 120)], { note: '已去除前景元素并补全（inpaint）后检索' }),
      E('产品主体', [245, 322, 310, 275], [mt('https://www.sonique-audio.com/products/h7-pro', '完全匹配', .96, 4, 160)]),
      E('Logo', [42, 712, 240, 50], [mt('https://www.sonique-audio.com/', '完全匹配', .97, 2, 90)]),
      E('文字', [250, 70, 300, 64], [], { font: { name: '汉仪旗黑', vendor: '汉仪字库' } }),
      E('装饰元素', [545, 175, 130, 130], []),
    ],
    meta: [['文件格式', 'JPEG · 1200×1200'], ['Exif:Model', 'NIKON D850', 'info'], ['Exif:LensModel', '24.0-70.0 mm f/2.8', 'info'], ['IPTC:CopyrightNotice', 'VCG / 视觉中国', 'stock']] }),

  mk({ id: 'm4', file: 'lumi_portrait_ig_v2.jpg', client: 'lumi', channel: 'Meta · Instagram', region: '东南亚', launch: '2026-11-30', purpose: PURPOSE_LAUNCH, uploader: '陈卓',
    svg: adLumi(), time: { total: 8.8, split: 2.2, search: 5.1, cmp: 1.5 }, ruleVer: 3, scanAt: hoursAgo(30), review: { status: '待提交法务', assignee: '林宁' },
    elements: [
      E('人物', [120, 165, 365, 635], [
        mt('https://www.xiaohongshu.com/explore/65f1a2b3c4d5e6f7a8b9c0d1', '局部匹配', .92, 8, 115, '百度识图'),
        mt('https://fashion.sina.com.cn/b/2025-06-12/doc-inaxyzab1234567.shtml', '相似图', .86, 18, 40, '百度识图')], { face: true }),
      E('产品主体', [545, 472, 180, 175], [mt('https://lumi-beauty.com/shop/glow-cream', '完全匹配', .97, 3, 150, '百度识图')]),
      E('Logo', [500, 45, 250, 60], [mt('https://lumi-beauty.com/', '完全匹配', .98, 2, 80, '百度识图')]),
      E('文字', [505, 262, 262, 52], [], { font: { name: '方正兰亭粗黑', vendor: '方正字库' } }),
      E('装饰元素', [75, 75, 150, 150], []),
      E('背景图', [0, 0, 800, 800], [], { skip: '纯色 / 渐变背景，自动跳过检索（节省调用成本）' }),
    ],
    meta: [['文件格式', 'JPEG · 1080×1350'], ['Exif:Model', 'SONY ILCE-7M4', 'info'], ['Exif:Artist', 'Zhang Y. Photography', 'author']] }),

  mk({ id: 'm5', file: 'stridex_blackfriday_1080.jpg', client: 'stridex', channel: 'Meta', region: '北美', launch: '2026-11-26', purpose: PURPOSE_PROMOTION, uploader: '林宁',
    svg: adStride(), time: { total: 6.9, split: 1.8, search: 4.0, cmp: 1.1 }, ruleVer: 3, scanAt: hoursAgo(27), review: { status: '可投放', assignee: '林宁', by: 'legal' },
    elements: [
      E('背景图', [0, 0, 800, 800], [
        mt('https://www.shutterstock.com/image-photo/desert-road-sunset-1934567890', '完全匹配', .96, 3, 170),
        mt('https://www.istockphoto.com/photo/empty-highway-at-dusk-gm1122334455', '相似图', .80, 22, 20)], { note: '已去除前景元素并补全（inpaint）后检索' }),
      E('产品主体', [450, 550, 300, 165], [mt('https://stridex.shop/products/runner-x2', '完全匹配', .96, 4, 158)]),
      E('装饰元素', [55, 85, 190, 190], []),
      E('Logo', [555, 40, 195, 55], [mt('https://stridex.shop/', '完全匹配', .97, 2, 85)]),
    ],
    meta: [['文件格式', 'JPEG · 1080×1080'], ['XMP:Credit', 'Shutterstock', 'stock'], ['Software', 'Adobe Photoshop 26.0', 'info']] }),

  mk({ id: 'm6', file: 'pocketgo_install_tiktok.png', client: 'pocketgo', channel: 'TikTok', region: '东南亚', launch: '2026-12-05', purpose: PURPOSE_LAUNCH, uploader: '孙悦',
    svg: adPocket(), time: { total: 5.2, split: 1.6, search: 2.9, cmp: 0.7 }, ruleVer: 3, scanAt: hoursAgo(19), review: { status: '法务审核中', assignee: '何琪' },
    elements: [
      E('产品主体', [285, 135, 230, 450], []),
      E('装饰元素', [190, 630, 420, 80], []),
      E('Logo', [32, 40, 210, 55], []),
      E('文字', [220, 738, 360, 44], [], { font: { name: '思源黑体', vendor: 'Adobe / Google（OFL）' } }),
      E('背景图', [0, 0, 800, 800], [], { skip: '纯色 / 渐变背景，自动跳过检索（节省调用成本）' }),
    ],
    meta: [['文件格式', 'PNG · 1080×1080'], ['Software', 'Figma', 'info']] }),
];
// 历史处理记录与结论快照
(() => {
  const by = id => materials.find(m => m.id === id);
  const m2 = by('m2'), L = '周岚（法务）';
  m2.review.submit = { by: '何琪（运营）', at: hoursAgo(9), text: '背景城市图疑似电影剧照，人物插画命中 ArtStation，请法务判断能否投放。' };
  m2.audit.unshift({ at: hoursAgo(9), by: m2.review.submit.by, act: '提交法务审核', detail: m2.review.submit.text });
  m2.elements[0].dec = { v: '有风险', by: L, at: hoursAgo(5) }; m2.elements[1].dec = { v: '有风险', by: L, at: hoursAgo(5) };
  m2.review.legal = { v: '待补授权', by: L, at: hoursAgo(5), text: '背景城市图请提供 Shutterstock 采购记录，并确认与 Variety 剧照是否同一画面；角色插画需提供原画师授权书。补齐后重新提交。' };
  m2.audit.unshift({ at: hoursAgo(5), by: L, act: '法务结论：待补授权', detail: m2.review.legal.text + '（已飞书通知 何琪）' });
  const m3 = by('m3');
  m3.review.submit = { by: '林宁（审核）', at: hoursAgo(3), text: '背景图命中视觉中国，使用方称已采购但台账未录入；个人摄影师 500px 来源无法核实。计划 11-27 上线，请优先处理。' };
  m3.audit.unshift({ at: hoursAgo(3), by: m3.review.submit.by, act: '提交法务审核', detail: m3.review.submit.text });
  const m5 = by('m5');
  m5.review.submit = { by: '林宁（审核）', at: hoursAgo(24), text: '背景图命中 Shutterstock，台账已有采购记录，请法务确认。' };
  m5.audit.unshift({ at: hoursAgo(24), by: m5.review.submit.by, act: '提交法务审核', detail: m5.review.submit.text });
  m5.review.legal = { v: '可投放', by: L, at: hoursAgo(22), basis: '已取得授权', text: '背景图已匹配授权 SS-2025-0412（Shutterstock 图片 1934567890），媒介渠道覆盖 Meta，授权地区覆盖北美。' };
  m5.review.basis = '已取得授权';
  m5.audit.unshift({ at: hoursAgo(22), by: L, act: '法务结论：可投放', detail: '法务审核中 → 可投放（依据：已取得授权）：' + m5.review.legal.text });
  const m6 = by('m6');
  m6.review.submit = { by: '何琪（运营）', at: hoursAgo(2), text: '系统预筛未发现风险点，提交法务审核。' };
  m6.audit.unshift({ at: hoursAgo(2), by: m6.review.submit.by, act: '提交法务审核', detail: m6.review.submit.text });
  materials.forEach(m => { if (CONCLUDED.includes(m.review.status) && !m.review.snap) m.review.snap = { lv: evalMat(m).lv, sig: sigOf(m) }; });
})();

/* ================= 状态 ================= */
const state = { view: 'list', cur: null, sel: null, filter: 'mine', line: 'all', client: 'all', purpose: '', q: '', checked: new Set(), draw: false, hide: false, draft: null, ledgerKind: 'all' };
const batch = { total: 0, done: 0, start: 0 };
const cur = () => materials.find(m => m.id === state.cur);
const rk = (lv, big) => lv < 0 ? `<span class="rk none">${lv === -2 ? '待人工核对' : '处理中'}</span>` : `<span class="rk ${LV[lv]} ${big ? 'big' : ''}">${['●', '▲', '■'][lv]} ${LVN[LV[lv]]}</span>`;
const lvColor = lv => ['var(--low)', 'var(--mid)', 'var(--high)'][lv] || 'var(--line)';
const tg = (t, c = '', title = '') => `<span class="tg ${c}" ${title ? `title="${esc(title)}"` : ''}>${t}</span>`;
const reviewTag = m => tg(m.review.status, RS_C[m.review.status]);
const DEC_C = { '有风险': 'red', '无风险': 'green' };
const cName = id => CLIENTS[id]?.name || id;
const shortC = id => cName(id).replace(/（.*）/, '');
const lineN = m => LINES[lineOf(m)];
const lt = t => can('ledger') ? t : String(t).replace(/授权\s?[A-Z]{2,4}-\d{4}-\d{3,4}/g, '授权'); // 业务人员不展示授权台账编号
const editor = () => can('fix') && cur()?.review.status !== '已替换'; // 可修正证据（排除来源、补框、重新检索）

function cropDiv(mat, reg, size, filter = '') {
  const [x, y, w, h] = reg, s = size / Math.max(w, h);
  return `<div class="crop" style="width:${size}px;height:${size}px"><div style="width:${w * s}px;height:${h * s}px;background-image:url('${mat.src}');background-size:${mat.w * s}px ${mat.h * s}px;background-position:${-x * s}px ${-y * s}px;${filter ? 'filter:' + filter : ''}"></div></div>`;
}
function candRegion(mat, e, m) {
  if (m.mt !== '局部匹配') return e.bbox;
  const [x, y, w, h] = e.bbox, px = w * .15, py = h * .15;
  const nx = Math.max(0, x - px), ny = Math.max(0, y - py);
  return [nx, ny, Math.min(mat.w, x + w + px) - nx, Math.min(mat.h, y + h + py) - ny];
}
const candFilter = m => m.mt === '相似图' ? 'hue-rotate(18deg) saturate(.85) contrast(1.05)' : '';

/* ================= 导航 ================= */
const NAV = [
  ['list', '素材工作台', 'view'], ['ledger', '授权台账', 'ledger'],
  ['-', '设置'],
  ['rules', '规则与阈值', 'rules'], ['sources', '来源与客户', 'config'], ['members', '成员与权限', 'members'], ['log', '操作日志', 'log'],
];
const SETTINGS = ['rules', 'sources', 'members', 'log'];
const DISCLAIMER = '本工具为风险筛查辅助，不构成法律意见，最终侵权认定需法务确认。';
const canView = v => { const n = NAV.find(x => x[0] === v); return v === 'detail' ? can('view') : n ? can(n[2]) : false; };
const homeView = () => me.role === 'admin' ? (NAV.find(n => SETTINGS.includes(n[0]) && can(n[2])) || ['list'])[0] : 'list';
const visible = () => materials.filter(canSee);
function todoCount() { return visible().filter(FILTERS[defaultFilter()]?.[1] || (() => false)).length; }
function renderNav() {
  const items = NAV.filter(n => n[0] === '-' || can(n[2]));
  const hasSet = items.some(n => SETTINGS.includes(n[0]));
  const open = me.role === 'admin' ? 0 : todoCount();
  $('#nav').innerHTML = items.map(n => n[0] === '-' ? (hasSet ? `<span class="div"></span><span class="grp">${n[1]}</span>` : '') :
    `<a href="#${n[0]}" data-act="nav" data-view="${n[0]}" class="${state.view === n[0] || (state.view === 'detail' && n[0] === 'list') ? 'act' : ''}">${n[1]}${n[0] === 'list' && open ? `<span class="n" title="${filterLabel(defaultFilter())}">${open}</span>` : ''}</a>`).join('');
  $('#who').innerHTML = `<span class="muted">演示身份</span><select data-act="who">${USERS.map(u => `<option value="${u.id}" ${u === me ? 'selected' : ''}>${u.demo || u.lines.map(l => LINES[l]).join(' / ')}（${u.name} · ${ROLES[u.role]}）</option>`).join('')}</select><span class="av" style="background:${me.color}">${me.name[0]}</span>`;
  $('#runtime').textContent = runtime.google ? '本地工作台 · 可用云检索' : '本地工作台 · 云检索未配置';
  const bar = $('#discbar'); bar.hidden = false; bar.innerHTML = `<b>⚠️ ${DISCLAIMER}</b><span>风险等级由算法基于公开网络检索与图像比对生成，可能存在漏检或误报。</span>`;
}

/* ================= 视图：素材工作台 ================= */
const lvOf = m => evalMat(m).lv;
const FILTERS = {
  mine: ['待我处理', m => bizOpen(m) && (me.role === 'design' ? m.uploader === me.name : m.review.assignee === me.name)],
  legalq: ['法务审核中', m => legalOpen(m)],
  docs: ['待业务补授权', m => m.review.status === '待补授权'],
  expiring: ['授权即将到期', m => expiring(m).length > 0],
  pass: ['可投放', m => m.status === 'done' && m.review.status === '可投放' && !changed(m)],
  replaced: ['已替换', m => m.review.status === '已替换'],
  all: ['全部', () => true],
};
const workbenchStatus = status => me.role === 'legal' && status === '法务审核中' ? '待我审核' : status;
const filterLabel = key => workbenchStatus(FILTERS[key][0]);
const CARDS = () => me.role === 'legal' ? [['legalq', 'blue'], ['docs', 'mid'], ['expiring', 'mid']] : [['mine', 'blue'], ['legalq', 'blue'], ['expiring', 'mid']];
const WORKBENCH_HEADINGS = ['素材预览', '文件名', '业务线', MATERIAL_LABELS.party, MATERIAL_LABELS.purpose, '投放渠道', '投放地域', '计划上线日期', '系统预筛等级', '风险类型', '素材审核状态', '业务处理人', '法务审核人'];
const CHIPS = () => me.role === 'legal' ? ['pass', 'all'] : ['pass', 'replaced', 'all'];
const defaultFilter = () => me.role === 'legal' ? 'legalq' : me.role === 'admin' ? 'all' : 'mine';
function priority(m) {
  if (m.status !== 'done') return 1e3;
  const lv = lvOf(m); let p = 0;
  if (changed(m)) p += 300; if (me.role === 'legal' ? legalOpen(m) : bizOpen(m)) p += 200; p += lv * 40;
  return p;
}
function filtered() {
  const f = (FILTERS[state.filter] || FILTERS.all)[1], q = state.q.toLowerCase();
  return visible().filter(m => {
    if (state.line !== 'all' && lineOf(m) !== state.line) return false;
    if (state.client !== 'all' && m.client !== state.client) return false;
    if (state.purpose && purposeText(m.purpose) !== state.purpose) return false;
    if (q && ![m.file, m.relativePath, cName(m.client), m.channel, purposeText(m.purpose), m.uploader, lineN(m)].join(' ').toLowerCase().includes(q)) return false;
    return m.status !== 'done' ? ['all', 'mine'].includes(state.filter) : f(m);
  }).sort((a, b) => priority(b) - priority(a) || (a.launch < b.launch ? -1 : 1));
}
function renderList() {
  const vis = visible(), done = vis.filter(m => m.status === 'done');
  const cnt = k => done.filter(FILTERS[k][1]).length;
  const list = filtered(), purposes = [...new Set(vis.map(m => purposeText(m.purpose)))], lines = myLines(), clients = Object.entries(CLIENTS).filter(([, c]) => lines.includes(c.line));
  const batchActive = batchOn();
  const ck = state.checked; [...ck].forEach(id => { if (!vis.some(m => m.id === id)) ck.delete(id); });
  const ckm = vis.filter(m => ck.has(m.id)), canSubmit = ckm.filter(m => m.status === 'done' && m.review.status === '待提交法务'), canBulkPass = ckm.filter(m => legalOpen(m) && lvOf(m) === 0);
  $('#app').innerHTML = `
  <div class="pagehead"><h2>素材工作台</h2><div class="sp"></div>
    ${can('upload') ? `<button class="primary" data-act="upload-open">＋ 上传素材筛查</button>` : ''}</div>
  <div class="stats">
    ${CARDS().map(([k, cls]) => `<button type="button" class="stat ${cls} ${state.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}" aria-pressed="${state.filter === k}"><span class="k">${filterLabel(k)}</span><span class="v">${cnt(k)}</span></button>`).join('')}
  </div>
  ${batchActive ? `<div class="card progress show" id="batch-prog">${batchHTML()}</div>` : ''}
  <div class="toolbar">
    <div class="chips">${CHIPS().map(k => `<span class="chip ${state.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}">${filterLabel(k)}<b>${k === 'all' ? vis.length : cnt(k)}</b></span>`).join('')}</div>
    ${lines.length > 1 ? `<select data-act="fline"><option value="all">全部业务线</option>${lines.map(l => `<option value="${l}" ${state.line === l ? 'selected' : ''}>${LINES[l]}</option>`).join('')}</select>` : ''}
    <select data-act="fclient" aria-label="按${MATERIAL_LABELS.party}筛选"><option value="all">全部${MATERIAL_LABELS.party}</option>${clients.map(([k, c]) => `<option value="${k}" ${state.client === k ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <select data-act="fpurpose" aria-label="按${MATERIAL_LABELS.purpose}筛选"><option value="">全部${MATERIAL_LABELS.purpose}</option>${purposes.map(p => `<option value="${esc(p)}" ${state.purpose === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
    <input type="text" id="q" placeholder="搜索文件名、${MATERIAL_LABELS.party}、${MATERIAL_LABELS.purpose}或上传人" value="${esc(state.q)}">
    <div class="sp"></div>
    ${can('legal') ? `<a data-act="miss" class="muted" title="上线后收到投诉 / 律师函但系统未检出的素材">登记漏检案例</a>` : ''}
    <button data-act="csv">⤓ 导出 CSV（${ck.size ? '已选 ' + ck.size : '当前 ' + list.length} 条）</button>
  </div>
  ${ck.size ? `<div class="bulk">已选 <b>${ck.size}</b> 条
    ${can('submit') ? `<button class="sm" data-act="bulk-submit" ${canSubmit.length ? '' : 'disabled title="所选中没有「待提交法务」的素材"'}>提交法务审核（${canSubmit.length}）</button>` : ''}
    ${can('legal') ? `<button class="sm ok" data-act="bulk-pass" ${canBulkPass.length ? '' : 'disabled title="所选中没有「待我审核」且预筛无风险点的素材"'}>批量放行无风险点素材（${canBulkPass.length}）</button>` : ''}
    ${can('assign') ? `<span class="muted">转交给</span><select data-act="bulk-assign"><option value="">选择处理人…</option>${USERS.filter(u => ['audit', 'ops'].includes(u.role) && u.lines.some(l => myLines().includes(l))).map(u => `<option value="${u.name}">${u.name}（${ROLES[u.role]}）</option>`).join('')}</select>` : ''}
    <span style="flex:1"></span><a data-act="bulk-clear">取消选择</a></div>` : ''}
  <div class="tablewrap work-table"><table>
    <thead><tr><th scope="col" style="width:34px"><input type="checkbox" aria-label="选择当前列表的所有素材" data-act="ck-all" ${list.length && list.every(m => ck.has(m.id)) ? 'checked' : ''}></th>${WORKBENCH_HEADINGS.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
    <tbody>${list.map(rowHTML).join('') || `<tr><td colspan="${WORKBENCH_HEADINGS.length + 1}"><div class="empty"><div class="i">🔍</div>没有符合条件的素材</div></td></tr>`}</tbody>
  </table></div>
  <p class="muted" style="margin-top:10px">说明：带「示例」标签的素材用于演示流程。实际素材可在详情查看筛查覆盖范围和证据。</p>`;
}
function rowHTML(m) {
  const done = m.status === 'done', ev = evalMat(m);
  const st = { failed: '<span class="tg orange">筛查未完成</span>', queued: '<span class="muted">排队中</span>', splitting: '<span class="spin"></span> 元素拆分中', searching: '<span class="spin"></span> 逐元素检索中' }[m.status];
  const kinds = {}; ev.items.forEach(i => { kinds[i.kind] = Math.max(kinds[i.kind] || 0, i.lv); });
  const exp = done ? expiring(m) : [];
  const file = `${esc(m.file)} ${m.version > 1 ? tg('v' + m.version, 'blue') : ''} ${m.demo ? tg('示例', 'orange') : ''}`;
  const risks = done ? (Object.keys(kinds).length ? Object.entries(kinds).map(([k, lv]) => `<span class="tg ${KIND[k][1]}"><span class="dotlv" style="background:${lvColor(lv)}"></span>${KIND[k][0]}</span>`).join(' ') : '<span class="muted">—</span>') + (exp.length ? `<small class="sub2" style="color:var(--mid)">⏰ 授权 ${daysTo(exp[0].end)} 天后到期</small>` : '') : '';
  const status = done ? tg(workbenchStatus(m.review.status), RS_C[m.review.status]) + (changed(m) ? ' ' + tg('⚠ 结论后有变更', 'orange') : '') : '';
  const assignee = esc(m.review.assignee || '未指派'), lawyer = esc(m.review.legal?.by.replace(/（.*）/, '') || '');
  return `<tr class="row ${state.checked.has(m.id) ? 'ck' : ''}" data-act="open" data-id="${m.id}">
    <td data-act="noop"><input type="checkbox" aria-label="选择 ${esc(m.file)}" data-act="ck" data-id="${m.id}" ${state.checked.has(m.id) ? 'checked' : ''}></td>
    <td>${cropDiv(m, [0, 0, m.w, m.h], 48)}</td>
    <td class="fn"><a class="asset-link" href="#${m.id}" data-act="open" data-id="${m.id}">${file}</a>${m.relativePath ? `<small title="${esc(m.relativePath)}">${esc(m.relativePath.slice(0, m.relativePath.lastIndexOf('/')))}</small>` : ''}</td>
    <td>${esc(lineN(m))}</td><td>${esc(shortC(m.client))}</td><td>${esc(purposeText(m.purpose))}</td>
    <td>${esc(m.channel)}</td><td>${esc(m.region)}</td><td class="launch">${esc(m.launch)}</td>
    <td>${done ? rk(ev.lv) : st}</td><td>${risks}</td><td>${status}</td>
    <td>${assignee}</td><td>${lawyer || '—'}</td></tr>`;
}

/* ================= 视图：素材详情 ================= */
function navIds() { const ids = filtered().map(m => m.id); return ids.includes(state.cur) ? ids : visible().map(m => m.id); }
function canDeleteDraft(m) {
  if (!can('deleteDraft') || !canSee(m) || m.demo || m.uploaderId !== me.id) return false;
  const r = m.review;
  return !r.submit && !r.legal && (r.status === '待提交法务' || (r.status === '需替换' && r.by === 'biz'));
}
// 业务侧负责预筛，可投放只能由法务给出。
function bizGates(m) {
  if (!isBiz() || !canSee(m) || !(can('submit') || can('replace'))) return null;
  const s = m.review.status;
  const wait = m.elements.some(e => e.status === 'searching') ? '请等待元素检索完成' : s === '法务审核中' || legalOpen(m) ? '已提交法务，等待结论' : s === '需替换' ? '需替换：请上传新版本' : s === '可投放' ? '法务已放行' : '当前状态无需操作';
  return {
    submit: !can('submit') ? null : ['待提交法务', '待补授权'].includes(s) && !m.elements.some(e => e.status === 'searching') ? '' : wait,
    replace: !can('replace') ? null : s === '待提交法务' ? '' : wait,
  };
}
// 法务侧可做的动作
function legalGates(m) {
  if (!can('legal')) return null;
  const ev = evalMat(m), risky = ev.sus, undec = risky.filter(e => !e.dec), bad = risky.filter(e => e.dec?.v === '有风险');
  const active = legalOpen(m) || (changed(m) && m.review.by === 'legal');
  const no = active ? (m.elements.some(e => e.status === 'searching') ? '请等待正在进行的元素检索' : '') : m.review.status === '待提交法务' ? '业务尚未提交法务审核' : m.review.status === '待补授权' ? '等待业务补齐授权后重新提交' : '当前状态无需法务操作';
  return {
    active,
    release: no || (bad.length ? `有 ${bad.length} 个元素被认定有风险，不能放行` : undec.length ? `还有 ${undec.length} 个风险元素未认定` : ''),
    docs: no || (!ev.items.length ? '当前没有需要补授权的风险点' : ''),
    replace: no || (!bad.length && !ev.items.some(i => i.meta) ? '需先将至少一个元素认定为「有风险」' : ''),
  };
}
function nextHint(m) {
  const lv = lvOf(m), s = m.review.status;
  if (me.role === 'legal') return changed(m) && m.review.by === 'legal' ? '结论作出后证据、授权或规则有变化，请重新确认。' : legalOpen(m) ? (lv === 0 ? '系统预筛未发现风险点，核对后可直接放行。' : '逐个认定风险元素（误报请在来源上「排除」），再给出结论。') : '';
  if (legalOpen(m)) return changed(m) && s !== '法务审核中' ? '法务结论作出后证据或规则有变化，请由法务重新确认。' : '已提交法务，等待结论。';
  if (me.role === 'design') return s === '需替换' ? '请替换相关元素后上传新版本，新版本会自动重新筛查。' : s === '待提交法务' && lv > 0 ? '可提前换掉风险元素，再上传新版本自查。' : '';
  if (s === '待提交法务') return (lv === 2 ? '预筛为高风险：建议先替换风险元素；如需保留，请提交法务审核并说明情况。' : lv === 1 ? `预筛为中风险：${can('fix') ? '误报来源可先排除，' : ''}已采购的请附采购记录，提交法务审核。` : '预筛未发现风险点。') + '所有素材须经法务审核后方可投放。';
  if (s === '待补授权') return '按法务要求准备授权材料（采购记录 / 授权书），补齐后重新提交法务，由法务录入台账。';
  if (s === '需替换') return '请替换相关元素后上传新版本，新版本会自动重新筛查。';
  if (s === '可投放') return '法务已审核放行。';
  return '';
}
function renderDetail() {
  const mat = cur();
  if (!mat || !canSee(mat)) { state.view = 'list'; return render(); }
  const deleteButton = canDeleteDraft(mat) ? '<button type="button" class="danger" data-act="delete-draft">删除</button>' : '';
  if (mat.status === 'failed') {
    $('#app').innerHTML = `<div class="card empty"><b>${esc(mat.file)} 筛查未完成</b><p>${esc(mat.error)}</p><button data-act="back">‹ 返回工作台</button> ${can('upload') ? '<button class="primary" data-act="retry">重新筛查</button>' : ''} ${deleteButton}</div>`;
    return;
  }
  if (mat.status !== 'done') { $('#app').innerHTML = `<div class="card empty"><div class="i"><span class="spin"></span></div>${esc(mat.file)} 正在处理中…<br><br><button data-act="back">‹ 返回工作台</button> ${deleteButton}</div>`; return; }
  const ev = evalMat(mat), ro = !editor(), R = mat.review;
  const order = [...mat.elements].sort((a, b) => (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]));
  if (!mat.elements.find(e => e.id === state.sel)) state.sel = (ev.sus[0] || mat.elements[0])?.id;
  const sel = mat.elements.find(e => e.id === state.sel);
  const ids = navIds(), idx = ids.indexOf(mat.id), bg = bizGates(mat), lg = legalGates(mat), pg = progress(mat), exp = expiring(mat), hint = nextHint(mat);
  const prev = mat.prevId && materials.find(m => m.id === mat.prevId), next = materials.find(m => m.prevId === mat.id);
  const btn = (label, act, why, cls = '', extra = '') => `<button class="${cls}" data-act="${act}" ${extra} ${why ? `disabled title="${esc(why)}"` : ''}>${label}</button>`;
  const metaItems = ev.items.filter(i => i.meta), safeN = mat.elements.length - ev.sus.length;
  const flagged = (mat.meta || []).filter(f => f[2] === 'stock' || f[2] === 'author'), ocr = mat.elements.filter(e => e.ocr), other = (mat.meta || []).filter(f => f[2] !== 'stock' && f[2] !== 'author');
  const legalBanner = R.legal && R.status !== '法务审核中' && R.status !== '已替换' ? `<div class="banner ${R.legal.v === '可投放' ? 'info' : 'red'}">⚖️ <div><b>法务结论：${esc(R.legal.v)}</b>${R.legal.basis ? `（依据：${esc(R.legal.basis)}）` : ''} · ${esc(R.legal.by)} · ${fmtT(R.legal.at)}${R.legal.text ? `<br>${esc(lt(R.legal.text))}` : ''}</div></div>` : '';
  const acts = [];
  if (bg) {
    if (bg.submit !== null) acts.push(btn(R.status === '待补授权' ? '补齐后重新提交法务' : '提交法务审核', 'biz-submit', bg.submit, 'primary'));
    if (bg.replace !== null) acts.push(btn('标记需替换', 'biz-replace', bg.replace, 'danger'));
  }
  if (lg) {
    acts.push(btn('✓ 放行', 'legal', lg.release, 'ok', 'data-v="可投放"'));
    acts.push(btn('要求补授权', 'legal', lg.docs, '', 'data-v="待补授权"'));
    acts.push(btn('要求替换', 'legal', lg.replace, 'danger', 'data-v="需替换"'));
  }
  if (can('upload') && ['待提交法务', '需替换'].includes(R.status)) acts.push(`<button class="${R.status === '需替换' ? 'primary' : ''} full" data-act="upload-replace">⇪ 上传替换版本并重新筛查</button>`);
  $('#app').innerHTML = `
  <div class="dhead">
    <button data-act="back">‹ 返回工作台</button>
    <div><h2>${esc(mat.file)} ${mat.version > 1 ? tg('v' + mat.version, 'blue') : ''} ${mat.demo ? tg('示例', 'orange') : ''}</h2>
      <div class="meta">${esc(lineN(mat))} · ${MATERIAL_LABELS.party}：${esc(cName(mat.client))} · ${esc(mat.channel)} · ${esc(mat.region)} · 计划 ${mat.launch} 上线 · ${MATERIAL_LABELS.purpose}：${esc(purposeText(mat.purpose))} · 上传人 ${esc(mat.uploader)}</div></div>
    <div class="sp"></div>
    <span class="muted">${idx + 1} / ${ids.length}（按当前筛选）</span>
    <button data-act="nav-mat" data-d="-1" ${idx <= 0 ? 'disabled' : ''}>‹ 上一条</button>
    <button data-act="nav-mat" data-d="1" ${idx >= ids.length - 1 ? 'disabled' : ''}>下一条 ›</button>
  </div>
  ${changed(mat) ? `<div class="banner warn">⚠️ <b>结论后有变更：</b>「${R.status}」作出时为${riskLabel(R.snap.lv)}，此后证据、授权或规则有变化，当前为${riskLabel(ev.lv)}。请重新确认。</div>` : ''}
  ${R.status === '法务审核中' && R.submit ? `<div class="banner info">⚖️ <div><b>已提交法务审核</b> · ${esc(R.submit.by)} · ${fmtT(R.submit.at)}<br>${esc(R.submit.text)}</div></div>` : ''}
  ${legalBanner}
  ${mat.warnings?.length ? `<div class="banner warn"><div><b>筛查提示：</b>${mat.warnings.map(esc).join(' ')}</div></div>` : ''}
  ${exp.map(l => can('ledger') ? `<div class="banner warn">⏰ 授权 <b>${esc(l.no)}</b>（${esc(l.vendor)} · ${esc(l.asset)}）将于 <b>${l.end}</b> 到期（剩 ${daysTo(l.end)} 天）。请安排续购，或在到期前下线。<span class="sp"></span><a data-act="nav" data-view="ledger">去授权台账 ›</a></div>`
    : `<div class="banner warn">⏰ 本素材使用的${l.kind}授权（${esc(l.vendor)}）将于 <b>${l.end}</b> 到期（剩 ${daysTo(l.end)} 天）。请联系法务续购，或在到期前下线。</div>`).join('')}
  ${prev || next ? `<div class="banner info">🔗 版本链：${prev ? `替换自 <a data-act="open" data-id="${prev.id}">${esc(prev.file)}（v${prev.version}）</a>` : ''}${prev && next ? '　·　' : ''}${next ? `已被新版本替换 <a data-act="open" data-id="${next.id}">${esc(next.file)}（v${next.version}）</a>` : ''}</div>` : ''}
  <div class="card verdict" style="--c:${lvColor(ev.lv)}">
    <div>${rk(ev.lv, true)}<div class="muted" style="margin-top:6px;text-align:center">系统预筛 · 规则 v${mat.ruleVer}</div></div>
    <div>
      <div class="sum">${summary(ev)}</div>
      ${ev.sus.length || metaItems.length ? `<div class="muted" style="font-size:12px">点击风险元素，在下方查看证据：</div>
      <div class="relist">${ev.sus.map(e => { const ee = evalEl(e, mat); return `<span class="rechip ${e.id === state.sel ? 'sel' : ''}" data-act="sel" data-eid="${e.id}"><span class="dotlv" style="background:${lvColor(ee.lv)}"></span><b>${e.label}</b><span class="muted">${ee.items.map(i => REMEDY[i.remedy][0]).filter((v, i, a) => a.indexOf(v) === i).join(' / ')}</span>${e.dec ? tg('法务：' + e.dec.v, DEC_C[e.dec.v]) : ''}</span>`; }).join('')}
        ${metaItems.length ? `<span class="rechip static" title="${esc(metaItems.map(i => i.text).join('\n'))}"><span class="dotlv" style="background:${lvColor(Math.max(...metaItems.map(i => i.lv)))}"></span><b>元数据线索</b><span class="muted">${metaItems.length} 项 · 见左下</span></span>` : ''}</div>
      ${safeN ? `<div class="muted" style="font-size:12px;margin-top:6px">其余 ${safeN} 个元素未发现风险，可在图上点选查看</div>` : ''}`
      : `<div class="muted">${mat.elements.map(e => evalEl(e, mat).notes[0]).filter(Boolean).slice(0, 3).map(esc).join('；')}</div>`}
    </div>
    <div class="rv">
      <div class="row"><span class="k">状态</span>${reviewTag(mat)}${changed(mat) ? tg('有变更', 'orange') : ''}</div>
      <div class="row"><span class="k">处理人</span>${can('assign') ? `<select data-act="assign">${handlers(lineOf(mat)).map(u => `<option value="${u.name}" ${u.name === R.assignee ? 'selected' : ''}>${u.name}（${ROLES[u.role]}）</option>`).join('')}</select>` : esc(R.assignee || '未指派')}</div>
      ${me.role === 'legal' || pg.d ? `<div class="row"><span class="k">法务认定</span>${pg.n ? `<b>${pg.d} / ${pg.n}</b>&nbsp;<span class="muted">个风险元素</span>` : '<span class="muted">无风险元素</span>'}</div>` : ''}
      ${acts.length ? `<div class="acts">${acts.join('')}</div>` : `<div class="why">当前身份（${ROLES[me.role]}）只读。</div>`}
      ${hint ? `<div class="why" style="color:var(--sub)">👉 ${esc(hint)}</div>` : ''}
    </div>
  </div>
  <div class="grid2">
    <div>
      <div class="card">
        <h3>元素拆分 <span class="muted" style="font-weight:400">共 ${mat.elements.length} 个元素 · 点击框查看证据</span></h3>
        <div class="stagebar">
          <button class="${state.draw ? 'on' : ''}" data-act="draw" ${ro ? 'disabled title="当前身份不能修正证据"' : ''}>✎ ${state.draw ? '框选中：在图上拖拽' : '补框遗漏元素'}</button>
          <button class="${state.hide ? 'on' : ''}" data-act="hide">${state.hide ? '显示全部框' : '仅显示选中'}</button>
          <span class="hint">${ro ? '只读模式' : '拖动框可移动 · 右下角缩放 · 修改后自动重新检索'}</span>
        </div>
        <div class="stage ${state.draw ? 'draw' : ''} ${state.hide ? 'hideboxes' : ''} ${ro ? 'ro' : ''}" id="stage">
          <img src="${mat.src}" alt="">
          ${order.map(e => boxHTML(mat, e)).join('')}
        </div>
        ${CLIENTS[mat.client].note ? `<div class="note">🔒 ${esc(CLIENTS[mat.client].note)}：${mat.engines.length ? '已执行：' + mat.engines.map(k => ENGINES[k].n).join(' / ') : '已在本机提取元数据'}</div>` : ''}
      </div>
      <div class="card" style="margin-top:14px">
        <h3>元信息线索 <span class="r muted">EXIF / XMP / IPTC / OCR</span></h3>
        ${flagged.length || ocr.length ? `<table class="kv">${flagged.map(f => { const risky = ev.items.some(i => i.meta && i.text.includes(f[1])); return `<tr class="${risky ? 'flag' : 'lic'}"><td>${esc(f[0])}</td><td>${esc(f[1])}${f[2] === 'stock' ? (risky ? ' ⚠ 图库线索' : ' ✓ 已匹配有效授权') : ' ⚠ 摄影师署名'}</td></tr>`; }).join('')}
        ${ocr.map(e => `<tr class="flag"><td>OCR 水印文字</td><td>「${esc(e.ocr)}」⚠ 图库水印</td></tr>`).join('')}</table>` : '<div class="muted">当前提取范围内未发现版权线索</div>'}
        ${other.length ? `<details class="more"><summary>其他元数据（${other.length} 项）</summary><table class="kv">${other.map(f => `<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('')}</table></details>` : ''}
      </div>
    </div>
    <div class="card">${sel ? evidenceHTML(mat, sel) : '<div class="empty">请在图上选择一个元素</div>'}</div>
  </div>
  <div class="card" style="margin-top:14px"><h3>操作记录 <span class="r muted">全部操作留痕，不可删除 · 共 ${mat.audit.length} 条</span></h3>
    <ul class="audit">${mat.audit.map(a => `<li><span class="tm">${fmtT(a.at)}</span><span class="who2">${esc(a.by)}</span><span class="ac">${esc(a.act)}</span><span>${esc(a.detail)}</span></li>`).join('')}</ul></div>
  ${deleteButton ? `<div class="detail-footer">${deleteButton}</div>` : ''}`;
  bindStage(mat);
}
function boxHTML(mat, e) {
  const [x, y, w, h] = e.bbox, c = COLORS[e.label], ee = evalEl(e, mat), bg = ['背景图', '整图'].includes(e.label);
  const P = (v, t) => (v / t * 100).toFixed(3) + '%';
  return `<div class="box ${bg ? 'bgbox' : ''} ${e.label === '整图' ? 'whole-box' : ''} ${e.id === state.sel ? 'sel' : ''}" data-eid="${e.id}" style="--c:${c};left:${P(x, mat.w)};top:${P(y, mat.h)};width:${P(w, mat.w)};height:${P(h, mat.h)}">
    <span class="tag ${y / mat.h < .04 ? 'in' : ''}" ${bg ? `data-act="sel" data-eid="${e.id}"` : ''}>${e.label}${ee.lv < 0 ? ' <span class="spin" style="width:9px;height:9px;border-width:1.5px"></span>' : ee.lv > 0 ? ` <b class="${LV[ee.lv]}"></b>` : ''}</span>${bg || !editor() ? '' : '<i class="handle"></i>'}</div>`;
}
function altThumb(seed, label) {
  const r = rng(seed), h1 = Math.floor(r() * 360), h2 = (h1 + 40 + Math.floor(r() * 80)) % 360;
  const shape = label === '人物' ? `<circle cx="60" cy="36" r="14" fill="hsl(${h2} 40% 85%)"/><rect x="40" y="52" width="40" height="40" rx="14" fill="hsl(${h2} 50% 60%)"/>` : `<polygon points="0,80 30,${40 + r() * 20} 60,${55 + r() * 15} 90,${35 + r() * 20} 120,80" fill="hsl(${h2} 45% 45%)"/><circle cx="${30 + r() * 60}" cy="22" r="9" fill="#fff8" />`;
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h1} 60% 75%)"/><stop offset="1" stop-color="hsl(${h1} 50% 92%)"/></linearGradient></defs><rect width="120" height="80" fill="url(#a)"/>${shape}</svg>`);
}
function evidenceHTML(mat, e) {
  const ee = evalEl(e, mat), ro = !editor(), lg = legalGates(mat);
  const ms = [...e.matches].sort((a, b) => !!a.dismissed - !!b.dismissed || score(b) - score(a));
  const canBuy = ee.items.some(i => i.remedy === 'buy'), canRep = ee.items.some(i => i.remedy === 'replace') || (ee.lv > 0 && ['背景图', '人物', '装饰元素'].includes(e.label));
  const manual = e.source === 'manual';
  return `<div class="ev-head">
    ${cropDiv(mat, e.bbox, 110)}
    <div class="info">
      <div class="row1"><b style="font-size:16px">${manual ? '' : esc(e.label)}</b>
        ${manual ? `<select data-act="label" data-eid="${e.id}" ${ro ? 'disabled' : ''} title="人工补框的元素请选择类型">${Object.keys(COLORS).map(k => `<option ${k === e.label ? 'selected' : ''}>${k}</option>`).join('')}</select>` : ''}
        ${ee.lv >= 0 ? (!mat.demo && ee.lv === 0 && !e.searchedWeb ? rk(-2) : rk(ee.lv)) : '<span class="rk none"><span class="spin"></span> 检索中</span>'}
        ${manual ? tg('人工补框') : e.edited ? tg('人工修正') : ''}
        ${e.face ? tg('检测到真人面部', 'purple') : ''}
        ${e.font ? tg('识别字体：' + esc(e.font.name), 'line') : ''}
      </div>
      ${e.note ? `<div class="note">ℹ️ ${esc(e.note)}</div>` : ''}
      ${ro ? '' : `<div style="display:flex;gap:6px;margin-top:8px"><button class="sm" data-act="research" data-eid="${e.id}">↻ 重新检索</button>${manual ? `<button class="sm danger" data-act="del" data-eid="${e.id}" title="仅人工补框的元素可删除">删除此框</button>` : ''}</div>`}
    </div></div>
  ${ee.lv >= 0 ? `<div class="sect">判定结论</div><div class="concl"><ul class="items">${ee.items.map(it => `<li><span class="dotlv" style="background:${lvColor(it.lv)};margin-top:6px"></span><div class="t">${esc(lt(it.text))}</div><div class="tags">${tg(KIND[it.kind][0], KIND[it.kind][1])}${tg(REMEDY[it.remedy][0], REMEDY[it.remedy][1] + ' line')}</div></li>`).join('')}
    ${ee.notes.map(n => `<li><span class="dotlv" style="background:var(--line);margin-top:6px"></span><div class="t muted" style="font-size:12px">${esc(lt(n))}</div></li>`).join('')}</ul></div>` : ''}
  ${lg?.active && ee.lv > 0 ? `<div class="decbar"><span class="lab">法务认定：</span>
    ${['有风险', '无风险'].map(v => `<button class="sm ${e.dec?.v === v ? 'on' : ''}" data-act="dec" data-eid="${e.id}" data-v="${v}">${v}</button>`).join('')}
    ${e.dec ? `<span class="muted">${esc(e.dec.by)} · ${fmtT(e.dec.at)}${e.dec.note ? ' · ' + esc(e.dec.note) : ''}</span>` : '<span class="muted">尚未认定 · 若检出来源与素材不是同一作品，请在下方「排除此来源」</span>'}</div>`
    : e.dec ? `<div class="decbar"><span class="lab">法务认定：</span>${tg(e.dec.v, DEC_C[e.dec.v])}<span class="muted">${esc(e.dec.by)} · ${fmtT(e.dec.at)}${e.dec.note ? ' · ' + esc(e.dec.note) : ''}</span></div>` : ''}
  ${ee.lv > 0 && (canBuy || canRep) ? `<div class="sect">建议方案</div><div class="concl">
    ${canBuy ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:${canRep ? 10 : 0}px"><span class="tg green line">可补购授权</span>${can('ledger') ? `<span class="muted" style="flex:1">采购后录入授权凭证，系统会核对素材及授权范围。</span><button class="sm primary" data-act="link-lic" data-eid="${e.id}">录入授权</button>` : `<span class="muted" style="flex:1">如已采购或可采购，请在「提交法务审核」时附上采购记录和素材信息，由法务核对并录入授权台账。</span>`}</div>` : ''}
    ${canRep && !mat.demo ? '<div class="note">使用自有素材或替换为已经核对渠道、地域和期限的授权素材。</div>' : ''}
    ${canRep && mat.demo ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span class="tg red line">建议替换</span><span class="muted" style="flex:1">替换参考（示例）</span></div>
      <div class="fix">${[0, 1, 2].map(k => `<div class="alt"><img src="${altThumb(e.id + k, e.label)}" alt=""><div>${['Shutterstock', '站酷海洛', 'Adobe Stock'][k]} · 已购<br>ID ${hashHex(e.id + k, 10).replace(/[a-f]/g, d => d.charCodeAt(0) % 10)}</div></div>`).join('')}</div>` : ''}
  </div>` : ''}
  ${e.status === 'searching' ? `<div class="empty"><div class="i"><span class="spin"></span></div>正在检索该元素…</div>`
    : e.skip || e.font && !ms.length ? ''
    : ms.length ? `<div class="sect">疑似来源 <span class="r muted">${ms.length} 个 · 按相似度排序</span></div>` + ms.map(m => matchHTML(mat, e, m)).join('')
    : `<div class="empty"><div class="i">✅</div>${e.searchedWeb || mat.demo ? '未检索到高度相似来源' : '无已收集的来源证据'}</div>`}`;
}
function matchHTML(mat, e, m) {
  const c = classify(m.url, mat), s = score(m), r = ruleOf(mat.ruleVer), lic = c.type === 'stock' && imgLic(mat, c.host, m.url), ok = lic && !scopeIssues(lic, mat).length;
  const col = m.dismissed ? 'var(--mute)' : c.type === 'client' || ok ? 'var(--low)' : s >= r.H ? (['stock', 'creator'].includes(c.type) ? 'var(--high)' : 'var(--mid)') : s >= r.M ? (c.type === 'stock' ? 'var(--mid)' : 'var(--sub)') : 'var(--mute)';
  const i = e.matches.indexOf(m), snapAt = m.snapAt || mat.scanAt;
  return `<div class="match ${m.dismissed ? 'dis' : ''}">
    ${mat.demo ? cropDiv(mat, candRegion(mat, e, m), 96, candFilter(m)) : m.reference ? `<img class="match-preview" src="${esc(m.url)}" alt="本地参考图">` : '<div class="match-preview muted">外部来源</div>'}
    <div class="mi">
      <div class="src">${tg(TYPE_N[c.type], TYPE_C[c.type])}<b>${esc(c.name)}</b>${tg(m.mt)}${lic ? tg((ok ? '✓ 已匹配有效授权' : '⚠ 授权范围不符') + (can('ledger') ? ' ' + esc(lic.no) : '') + `（至 ${lic.end}）`, ok ? 'green' : 'orange') : ''}${m.dismissed ? tg('已排除：非同一作品', 'gray') : ''}</div>
      <div class="plain">${c.type === 'client' ? '来自使用方自有页面' : mat.demo ? '素材中的该元素与此来源' + SAME[m.mt] : m.reference ? '与本地参考的图像结构接近' : '检索引擎返回的匹配候选，需人工核对'}${assetOf(m.url) && c.type === 'stock' ? `，图片 ID <b>${assetOf(m.url)}</b>` : ''}</div>
      <a class="url" href="${esc(m.url)}" target="_blank" rel="noopener" title="${esc(m.url)}">🔗 ${esc(m.url)}</a>
      ${!mat.demo && m.imageUrl && m.imageUrl !== m.url ? `<a class="url" href="${esc(m.imageUrl)}" target="_blank" rel="noopener">查看候选原图</a>` : ''}
      <div class="snap">${mat.demo ? '示例快照' : esc(m.eng)} · ${fmtT(m.evidenceAt || snapAt)} · <button class="sm" data-act="snap" data-eid="${e.id}" data-i="${i}">${mat.demo ? '查看示例' : '查看检索记录'}</button></div>
      ${c.type !== 'client' && !ok ? `<div class="mrow">${m.dismissed ? `<span>${esc(m.dismissed.by)} 于 ${fmtT(m.dismissed.at)} 排除${m.dismissed.reason ? '：' + esc(m.dismissed.reason) : ''}</span>${editor() ? `<button class="sm" data-act="undismiss" data-eid="${e.id}" data-i="${i}">撤销排除</button>` : ''}` : editor() ? `<button class="sm" data-act="dismiss" data-eid="${e.id}" data-i="${i}">✕ 非同一作品（排除此来源）</button>` : ''}</div>` : ''}
    </div>
    <div class="score"><div class="n" style="color:${col}">${s}</div><div class="l">${m.fallbackScore != null ? '检索参考分' : m.localScore != null ? 'pHash 结构分' : '相似度'}</div></div>
  </div>`;
}

/* ================= 视图：授权台账 ================= */
function licState(l) {
  if (daysTo(l.start) > 0) return tg('未生效', 'gray');
  const d = daysTo(l.end);
  if (d < 0) return tg('已过期', 'gray');
  if (d <= LEDGER_CFG.expiryDays) return tg(`${d} 天后到期`, 'orange');
  return tg('有效', 'green');
}
function ledgerAssetHTML(l) {
  if (l.kind === '字体') return `<div class="ledger-asset"><span class="ledger-font" aria-hidden="true">字</span><span>${esc(l.asset)}</span></div>`;
  const preview = l.preview ? `<img src="${esc(l.preview)}" alt="${l.demoPreview ? '示例图片' : '素材图片'}">` : '<span class="ledger-no-preview">无预览</span>';
  return `<div class="ledger-asset">${preview}<span>图片 ID ${esc(l.asset)}${l.demoPreview ? '<small class="sub2">示例图片</small>' : ''}</span></div>`;
}
function renderLedger() {
  const mine = LICENSES.filter(l => myLines().includes(CLIENTS[l.client].line));
  const list = mine.filter(l => state.ledgerKind === 'all' || (state.ledgerKind === 'expiring' ? expiringLic(l) : l.kind === state.ledgerKind));
  const expN = mine.filter(expiringLic).length;
  $('#app').innerHTML = `
  <div class="pagehead"><h2>授权台账</h2><div class="sp"></div>
    ${can('ledger') ? `<button class="primary" data-act="lic-new">＋ 录入授权</button>` : '<span class="muted">只读</span>'}</div>
  <div class="toolbar"><div class="chips" role="group" aria-label="按${LICENSE_LABELS.kind}或${LICENSE_LABELS.state}筛选">${[['all', '全部'], ['图片', '图片'], ['字体', '字体'], ['expiring', `即将到期 <b>${expN}</b>`]].map(([k, n]) => `<span class="chip ${state.ledgerKind === k ? 'on' : ''}" data-act="lkind" data-k="${k}">${n}</span>`).join('')}</div>
    <div class="sp"></div><span class="muted">到期提前提醒</span><input type="number" min="7" max="180" value="${LEDGER_CFG.expiryDays}" data-act="lexp" style="width:70px" ${can('ledger') ? '' : 'disabled'}><span class="muted">天</span></div>
  <div class="tablewrap ledger-wrap"><table class="lvtable ledger-table">
    <thead><tr>${Object.values(LICENSE_LABELS).map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
    <tbody>${list.map(l => `<tr>
      <td><b>${esc(l.no)}</b>${l.demo ? ` ${tg('示例', 'orange')}` : ''}</td><td>${tg(l.kind)}</td><td>${esc(l.vendor)}</td><td>${ledgerAssetHTML(l)}</td><td>${esc(shortC(l.client))}<small class="sub2">${LINES[CLIENTS[l.client].line]}</small></td>
      <td>${l.use === '商业广告' ? esc(l.use) : tg(l.use, 'orange')}</td><td>${esc(l.channels.join('、'))}</td><td>${esc(l.regions.join('、'))}</td>
      <td class="ledger-term">${esc(l.start)} 至 ${esc(l.end)}</td><td>${licState(l)}${can('ledger') && daysTo(l.end) <= LEDGER_CFG.expiryDays ? `<button class="sm ledger-renew" data-act="lic-renew" data-no="${esc(l.no)}">登记续期</button>` : ''}</td>
      <td class="ledger-proof">${l.proof ? `<a href="${esc(l.proof)}" download>📎 ${esc(l.file)}</a>` : esc(l.file)}</td></tr>`).join('') || `<tr><td colspan="${Object.keys(LICENSE_LABELS).length}"><div class="empty">暂无记录</div></td></tr>`}</tbody></table></div>
  <div class="note" style="margin-top:10px">如果使用用途为「编辑用途」、媒介渠道或授权地区不覆盖本次投放，或授权期限已过，系统会提示商业广告投放风险，并在证据中写明原因。模特肖像授权（Model Release）由法务审核时核对。</div>`;
}
const licenseAssetPlaceholder = kind => kind === '字体' ? '填写字体名' : '填写图片 ID';
function licFormHTML(p = {}) {
  const labels = LICENSE_LABELS, kind = p.kind || '图片', isFont = kind === '字体';
  return `<div class="form">
    <label for="f-no">${labels.no}</label><input type="text" id="f-no" value="${esc(p.no || '')}" placeholder="如 SS-2026-0101">
    <label for="f-kind">${labels.kind}</label><select id="f-kind">${['图片', '字体'].map(k => `<option ${kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
    <label for="f-vendor">${labels.vendor}</label><input type="text" id="f-vendor" value="${esc(p.vendor || '')}" placeholder="如 Shutterstock 或方正字库">
    <label for="f-asset">${labels.asset}</label><div class="license-asset-field"><input type="text" id="f-asset" value="${esc(p.asset || '')}" placeholder="${licenseAssetPlaceholder(kind)}"><div id="f-preview-field" ${isFont ? 'hidden' : ''}><label for="f-preview">图片预览（选填）</label><input type="file" id="f-preview" accept="image/jpeg,image/png"></div></div>
    <label for="f-domain" id="f-domain-label" ${isFont ? 'hidden' : ''}>图库域名</label><input type="text" id="f-domain" ${isFont ? 'hidden' : ''} value="${esc(p.domain || '')}" placeholder="如 shutterstock.com">
    <label for="f-client">${labels.client}</label><select id="f-client">${Object.entries(CLIENTS).filter(([, c]) => myLines().includes(c.line)).map(([k, c]) => `<option value="${k}" ${p.client === k ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <label for="f-use">${labels.use}</label><select id="f-use">${['商业广告', '编辑用途'].map(k => `<option>${k}</option>`).join('')}</select>
    <label for="f-ch">${labels.channels}</label><select id="f-ch"><option>全部</option>${CHANNELS.map(c => `<option>${c}</option>`).join('')}</select>
    <label for="f-rg">${labels.regions}</label><select id="f-rg">${REGIONS.map(r => `<option>${r}</option>`).join('')}</select>
    <label for="f-end">${labels.term}</label><div class="license-end"><span class="muted">起始</span><input type="date" id="f-start" value="${esc(p.start || fmtD(Date.now()))}"><span class="muted">截止</span><input type="date" id="f-end" value="${esc(p.end || fmtD(Date.now() + 365 * 864e5))}"></div>
    <label for="f-holder">授权持有人</label><select id="f-holder"><option>客户</option><option>代理商（我方）</option></select>
    <label for="f-file">${labels.file}</label><input type="file" id="f-file" accept="application/pdf,image/jpeg,image/png">
    <span></span><div class="err" id="f-err"></div></div>`;
}
function readLic() {
  const v = id => $('#' + id).value.trim();
  const kind = v('f-kind'), isImage = kind === '图片', preview = isImage ? $('#f-preview').files[0] : null;
  const proof = $('#f-file').files[0];
  const l = { no: v('f-no'), kind, vendor: v('f-vendor'), domain: isImage ? domainInput(v('f-domain')) : '', asset: v('f-asset'), client: v('f-client'), use: v('f-use'), channels: [v('f-ch')], regions: [v('f-rg')], start: v('f-start'), end: v('f-end'), holder: v('f-holder'), file: proof?.name || '未上传授权凭证' };
  const err = !l.no ? '请填写授权编号' : LICENSES.some(x => x.no === l.no) ? '授权编号已存在' : !l.vendor ? '请填写授权方' : !l.asset ? `请${licenseAssetPlaceholder(kind)}` : isImage && !l.domain ? '图片类授权需填写有效的图库域名' : !l.start || !l.end || l.end < l.start ? '请填写有效的授权起止日期' : !proof || proof.size > MAX_IMAGE_BYTES ? '请上传不超过 20 MB 的 PDF / JPG / PNG 授权凭证' : preview && (!imageType(preview) || preview.size > MAX_IMAGE_BYTES) ? '图片预览仅支持不超过 20 MB 的 JPG 或 PNG 图片' : '';
  $('#f-err').textContent = err;
  return err ? null : { l, preview, proof };
}
function openLicModal(prefill, title, sub, onSaved) {
  openModal(`<h3>${title}</h3><div class="muted">${sub}</div>${licFormHTML(prefill)}
    <div class="foot"><button data-act="close">取消</button><button class="primary" data-act="lic-save">保存并重新核对</button></div>`);
  $('#f-kind').onchange = ev => {
    const kind = ev.target.value, isFont = kind === '字体';
    $('#f-asset').placeholder = licenseAssetPlaceholder(kind);
    for (const id of ['f-domain-label', 'f-domain', 'f-preview-field']) $('#' + id).hidden = isFont;
  };
  modalSave = async () => {
    const f = readLic(); if (!f) return;
    const btn = $('[data-act="lic-save"]'), err = $('#f-err');
    btn.disabled = true;
    try {
      const proof = await uploadBlob('/api/proofs', f.proof);
      f.l.proof = `/proof/${proof.key}/${proof.extension}/${encodeURIComponent(f.proof.name)}`;
      if (f.preview) f.l.preview = (await uploadBlob('/api/images', f.preview)).src;
      if (!btn.isConnected || $('#modal').classList.contains('hidden')) return;
      LICENSES.push(f.l);
      logC('授权台账', '录入授权', `${f.l.no} · ${f.l.vendor}`);
      closeModal(); onSaved(f.l); render();
    } catch (error) {
      err.textContent = error.message;
    } finally { btn.disabled = false; }
  };
}

/* ================= 设置：规则与阈值 ================= */
// 法务未定论的素材（待提交法务 / 法务审核中 / 待补授权 / 业务自行标记需替换）随规则更新重新判定；法务已定论的保持原判定
const affected = () => materials.filter(m => m.status === 'done' && !humanFinal(m));
function renderRules() {
  const act = activeRule(); if (!state.draft) state.draft = { ...act };
  const d = state.draft, dirty = RULE_KEYS.some(k => d[k] !== act[k]);
  const aff = affected(), frozen = materials.filter(m => m.status === 'done').length - aff.length;
  const rows = aff.map(m => ({ m, a: evalMat(m).lv, b: evalMat(m, d).lv })), diff = rows.filter(r => r.a !== r.b);
  const cnt = k => [0, 1, 2].map(l => rows.filter(r => r[k] === l).length);
  const ca = cnt('a'), cb = cnt('b');
  $('#app').innerHTML = `
  <div class="pagehead"><div><h2>规则与阈值</h2><p>修改先预览影响，再发布为新版本。发布后法务尚未定论的素材按新规则重新预筛；法务已定论的保持原判定，不被改写</p></div></div>
  <div class="cols"><div>
    <div class="card sec"><h3>编辑草稿 <span class="r muted">基于当前生效版本 v${act.v}</span></h3>
      <div class="rule"><label>高相似阈值（H）</label><input type="range" min="60" max="99" value="${d.H}" data-act="rH"><output>${d.H}</output></div>
      <div class="rule"><label>中相似阈值（M）</label><input type="range" min="40" max="95" value="${d.M}" data-act="rM"><output>${d.M}</output></div>
      ${RULE_FIELDS.map(([k, n, s]) => `<label class="switch"><input type="checkbox" data-act="rT" data-k="${k}" ${d[k] ? 'checked' : ''}><span>${n}<small>${s}</small></span></label>`).join('')}
      <div style="display:flex;gap:8px;margin-top:12px"><button data-act="r-reset" ${dirty ? '' : 'disabled'}>放弃修改</button><button class="primary" data-act="r-publish" ${dirty ? '' : 'disabled'}>发布为 v${RULES.versions.length + 1}…</button>
        <span class="muted" style="align-self:center">${dirty ? '草稿未发布，不影响任何判定' : '草稿与当前版本一致'}</span></div>
    </div>
    <div class="card sec"><h3>影响预览 <span class="r muted">未定论 ${aff.length} 条按草稿重新计算 · 已定论 ${frozen} 条不受影响</span></h3>
      <div style="display:flex;gap:16px;font-size:13px;margin-bottom:8px"><span>高风险 <b>${ca[2]}</b> → <b style="color:var(--high)">${cb[2]}</b></span><span>中风险 <b>${ca[1]}</b> → <b style="color:var(--mid)">${cb[1]}</b></span><span>低风险 <b>${ca[0]}</b> → <b style="color:var(--low)">${cb[0]}</b></span><span class="muted">等级变化 ${diff.length} 条</span></div>
      <table class="lvtable"><thead><tr><th>素材</th><th>当前</th><th>按草稿</th><th>复核状态</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="${r.a !== r.b ? 'chg' : ''}"><td>${esc(r.m.file)}</td><td>${rk(r.a)}</td><td>${rk(r.b)}</td><td>${reviewTag(r.m)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">暂无未定论素材</td></tr>'}</tbody></table>
    </div>
  </div><div>
    <div class="card sec"><h3>分级说明（当前 v${act.v}）</h3>
      <table class="lvtable"><thead><tr><th>等级</th><th>触发条件（任一满足）</th></tr></thead><tbody>
        <tr><td>${rk(2)}</td><td>版权图库相似度 ≥ H 且无有效授权；残留图库水印；${act.creatorHigh ? '社交 / 创作平台相似度 ≥ H；' : ''}${act.portrait ? '真人面部且外部有同一人像；' : ''}影视剧照 / IP；Logo 与他人标识一致；授权范围不符${act.fontHigh ? '；未授权商用字体' : ''}</td></tr>
        <tr><td>${rk(1)}</td><td>版权图库相似度在 M ~ H 之间；${act.creatorHigh ? '' : '社交 / 创作平台相似度 ≥ H；'}新闻 / 其他网站相似度 ≥ H；元数据含图库声明或摄影师署名${act.portrait ? '；真人面部未关联肖像授权' : ''}${act.font && !act.fontHigh ? '；未授权商用字体' : ''}</td></tr>
        <tr><td>${rk(0)}</td><td>无相似来源；仅命中使用方自有域名；已匹配有效授权（ID 与范围均符合）；免费商用字体</td></tr>
      </tbody></table>
      <div class="note">处置分类：<b>可补购授权</b>（图库、字体）· <b>建议替换</b>（个人作品、真人肖像、影视 IP、他人商标）· <b>需核实授权</b>（元数据线索、真人面部无外部来源）</div>
    </div>
    <div class="card sec"><h3>版本历史</h3>
      ${[...RULES.versions].reverse().map(v => { const p = ruleOf(v.v - 1), ch = v.v > 1 ? RULE_KEYS.filter(k => p[k] !== v[k]).map(k => `${RULE_LABEL[k]}：${fmtR(p[k])} → ${fmtR(v[k])}`) : [];
        return `<div class="ver ${v.v === RULES.active ? 'act' : ''}"><div class="h"><b>v${v.v}</b>${v.v === RULES.active ? tg('当前生效', 'blue') : ''}<span class="muted">${v.at} · ${esc(v.by)}</span></div><div class="d">${esc(v.note)}</div>${ch.length ? `<div class="d muted">${ch.map(esc).join('；')}</div>` : ''}</div>`; }).join('')}
    </div>
  </div></div>`;
}
const RULE_KEYS = ['H', 'M', 'creatorHigh', 'portrait', 'font', 'fontHigh'];
const RULE_LABEL = { H: '高阈值', M: '中阈值', ...Object.fromEntries(RULE_FIELDS.map(([k, n]) => [k, n])) };
const fmtR = v => v === true ? '开' : v === false ? '关' : v;

/* ================= 设置：来源与客户（来源域名字典 + 客户白名单 / 数据合规） ================= */
function renderSources() {
  $('#app').innerHTML = `<div class="pagehead"><div><h2>来源与客户</h2><p>决定命中来源属于哪一类：先看该客户的自有域名，再查公共来源字典，都未收录归为「其他网站」。修改即时生效并记录日志</p></div></div>
  <div class="cols"><div class="card"><h3>公共来源字典 <span class="r muted">对所有客户生效</span></h3>
    ${['stock', 'creator', 'news'].map(t => `<div style="margin-bottom:6px">${tg(TYPE_N[t], TYPE_C[t])} <span class="muted">${DICT.filter(d => d[1] === t).length} 个</span>
      <div class="dict">${DICT.filter(d => d[1] === t).map(d => `<span class="chip" title="${esc(d[0])}">${esc(d[2])} <span class="muted">${esc(d[0])}</span><span class="x" data-act="dict-del" data-d="${esc(d[0])}">×</span></span>`).join('')}</div></div>`).join('')}
  </div><div class="card"><h3>新增公共来源</h3>
    <div class="form" style="margin-top:0"><label>域名</label><input type="text" id="d-dom" placeholder="如 unsplash.com"><label>名称</label><input type="text" id="d-name" placeholder="如 Unsplash"><label>类型</label><select id="d-type">${['stock', 'creator', 'news'].map(t => `<option value="${t}">${TYPE_N[t]}</option>`).join('')}</select><span></span><div><button class="primary" data-act="dict-add">添加</button></div></div>
    <div class="note">Getty Images、Shutterstock、视觉中国为必选覆盖；iStock 归属 Getty。</div></div></div>
  <div class="card" style="margin-top:14px"><h3>客户配置 <span class="r muted">自有域名只对该客户的素材生效；引擎按合同约定，避免未发布素材违规出境</span></h3>
  <div class="tablewrap"><table class="lvtable"><thead><tr><th>客户</th><th>业务线</th><th>自有域名（命中视为客户提供）</th><th>允许使用的引擎</th><th>素材保留期</th><th>备注</th></tr></thead><tbody>
  ${Object.entries(CLIENTS).map(([k, c]) => `<tr><td><b>${esc(c.name)}</b></td><td>${LINES[c.line]}</td>
    <td><div class="dict" style="margin:0 0 6px">${c.domains.map(d => `<span class="chip">${esc(d)}<span class="x" data-act="wl-del" data-c="${k}" data-d="${esc(d)}">×</span></span>`).join('')}</div>
      <div style="display:flex;gap:6px"><input type="text" id="wl-${k}" placeholder="brand.com" style="min-width:0;width:140px"><button class="sm" data-act="wl-add" data-c="${k}">添加</button></div></td>
    <td>${Object.entries(ENGINES).map(([ek, en]) => `<label style="display:flex;gap:6px;align-items:center;font-size:12px"><input type="checkbox" data-act="eng" data-c="${k}" data-e="${ek}" ${(ek === 'baidu' || ek === 'local' || k === 'lumi') ? 'disabled' : ''} ${(ek === 'local' || (ek !== 'baidu' && k !== 'lumi' && c.engines.includes(ek))) ? 'checked' : ''}>${en.n}${ek === 'baidu' ? '（未接入）' : ek !== 'local' && !runtime[ek] ? '（未配置）' : ''} ${tg(en.zone, en.zone === '本地' ? 'green' : 'orange')}</label>`).join('')}</td>
    <td><select data-act="retain" data-c="${k}">${[30, 90, 180, 365].map(d => `<option value="${d}" ${c.retain === d ? 'selected' : ''}>${d} 天</option>`).join('')}</select></td>
    <td class="muted">${esc(c.note || '—')}</td></tr>`).join('')}</tbody></table></div>
  <div class="note" style="margin-top:10px">云服务需为该客户开启并在本机配置凭据。启用混元时优先由混元拆分，Gemini 可作后备；公网反搜由 Google Vision 提供。素材保留期用于登记，清理由工作区维护者执行。</div></div>`;
}

/* ================= 设置：成员与权限 ================= */
function renderMembers() {
  $('#app').innerHTML = `<div class="pagehead"><div><h2>成员与权限</h2><p>一套系统按角色授权：业务部门（审核 / 运营 / 设计）按业务线隔离数据，看不到授权台账；法务处理业务提交的中高风险素材并维护授权台账；管理员只管配置与日志，不处理素材</p></div></div>
  <div class="cols"><div class="card"><h3>角色权限 <span class="r muted">固定配置，如需调整请走变更评审</span></h3>
    <table class="matrix"><thead><tr><th>权限</th>${Object.values(ROLES).map(r => `<th>${r}</th>`).join('')}</tr></thead><tbody>
    ${PERMS.map(([p, n]) => `<tr><td>${n}</td>${Object.keys(ROLES).map(r => `<td>${GRANT[r].has(p) ? '<span class="yes">✓</span>' : '<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  <div class="card"><h3>成员</h3><table class="lvtable"><thead><tr><th>成员</th><th>角色</th><th>业务线</th><th>待处理</th></tr></thead><tbody>
    ${USERS.map(u => `<tr><td><span class="av" style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:${u.color};color:#fff;font-size:11px;margin-right:6px">${u.name[0]}</span>${u.name}</td>
      <td><select data-act="urole" data-u="${u.id}" ${u === me ? 'disabled title="不能修改自己的角色"' : ''}>${Object.entries(ROLES).map(([k, n]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${n}</option>`).join('')}</select></td>
      <td>${u.role === 'legal' || u.role === 'admin' ? '<span class="muted">全部</span>' : u.lines.map(l => tg(LINES[l])).join(' ')}</td>
      <td>${u.role === 'legal' ? materials.filter(legalOpen).length + ' 条待复核' : ['audit', 'ops'].includes(u.role) ? materials.filter(m => m.review.assignee === u.name && bizOpen(m)).length + ' 条' : u.role === 'design' ? materials.filter(m => m.uploader === u.name && bizOpen(m)).length + ' 条（本人上传）' : '—'}</td></tr>`).join('')}</tbody></table>
    <div class="note">正式版对接飞书通讯录与 SSO，业务线随组织架构同步；成员离职时其待处理素材需先转交。</div></div></div>`;
}

/* ================= 设置：操作日志 ================= */
function renderLog() {
  const all = [...CONFIG_LOG.map(l => ({ ...l })), ...materials.flatMap(m => m.audit.filter(a => a.by !== '系统').map(a => ({ ...a, obj: m.file })))].sort((a, b) => b.at - a.at);
  $('#app').innerHTML = `<div class="pagehead"><div><h2>操作日志</h2><p>素材复核与系统配置的全部变更，按时间倒序；不可编辑、不可删除</p></div></div>
  <div class="card"><ul class="audit">${all.map(a => `<li><span class="tm">${fmtT(a.at)}</span><span class="who2">${esc(a.by)}</span><span class="ac">${esc(a.act)}</span><span><span class="muted">${esc(a.obj)} · </span>${esc(a.detail)}</span></li>`).join('')}</ul></div>`;
}

/* ================= 弹窗 ================= */
let modalSave = null;
function openModal(html, wide) { $('#modal').innerHTML = `<div class="mbox" role="dialog" aria-modal="true" ${wide ? 'style="width:min(860px,94vw)"' : ''}>${html}</div>`; $('#modal').classList.remove('hidden'); }
function closeModal() { $('#modal').classList.add('hidden'); modalSave = null; }
function reasonModal(title, desc, okText, onOk, opts = {}) {
  openModal(`<h3>${title}</h3><div class="muted">${desc}</div>
    ${opts.pre || ''}<div style="margin-top:12px"><textarea id="rsn" placeholder="${esc(opts.ph || '请填写依据（必填），将写入操作记录')}"></textarea></div>
    ${opts.extra || ''}
    ${opts.date ? `<div class="form"><label for="rsn-date">新截止日期</label><input type="date" id="rsn-date" required></div>` : ''}
    <div class="err" id="rsn-err"></div>
    <div class="foot"><button data-act="close">取消</button><button class="${opts.danger ? 'danger' : 'primary'}" data-act="modal-ok">${okText}</button></div>`);
  modalSave = () => { const v = $('#rsn').value.trim(); if (!v && !opts.optional) { $('#rsn-err').textContent = '请填写依据'; return; } const x = $('#rsn-x')?.value, date = $('#rsn-date')?.value; if (opts.date && (!date || date <= opts.date)) { $('#rsn-err').textContent = '新的截止日期须晚于现有日期'; return; } closeModal(); onOk(v, x, date); render(); };
  setTimeout(() => $('#rsn')?.focus(), 30);
}
function showSnap(mat, e, m) {
  const c = classify(m.url, mat), at = m.evidenceAt || m.snapAt || mat.scanAt;
  if (!mat.demo) {
    openModal(`<h3>检索记录</h3><table class="kv">
      <tr><td>采集时间</td><td>${fmtT(at)}</td></tr><tr><td>检索引擎</td><td>${esc(m.eng)}</td></tr>
      <tr><td>匹配类型</td><td>${esc(m.mt)}</td></tr><tr><td>评分</td><td>${score(m)} · ${m.reference ? 'pHash 汉明距离 ' + m.ph : '按引擎匹配类型给出的参考分'}</td></tr>
      <tr><td>来源</td><td style="overflow-wrap:anywhere"><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.url)}</a></td></tr>
      </table><div class="foot"><button class="primary" data-act="close">关闭</button></div>`);
    return;
  }
  openModal(`<h3>网页快照（证据固化）</h3><div class="muted">此示例展示快照版式，以下页面、哈希与时间戳均为演示数据。</div>
    <div class="browser"><div class="bar2">🔒 <span>${esc(m.url)}</span></div>
      <div class="pg">${cropDiv(mat, candRegion(mat, e, m), 180, candFilter(m))}<div style="flex:1"><div style="font-weight:600;margin-bottom:10px">${esc(c.name)} · ${esc(c.host)}</div><div class="ln" style="width:90%"></div><div class="ln" style="width:75%"></div><div class="ln" style="width:82%"></div><div class="ln" style="width:40%"></div>${assetOf(m.url) ? `<div class="muted" style="margin-top:10px">图片 ID：${assetOf(m.url)}</div>` : ''}</div></div></div>
    <table class="kv" style="margin-top:12px"><tr><td>抓取时间</td><td>${fmtT(at)}（北京时间）</td></tr><tr><td>页面 SHA-256</td><td style="font-family:Menlo,monospace;font-size:11px;word-break:break-all">${hashHex(m.url)}</td></tr>
    <tr><td>可信时间戳</td><td>TSA 证书编号 ${hashHex('tsa' + m.url, 16).toUpperCase()}（演示）</td></tr><tr><td>存档</td><td>截图 PNG + 页面 HTML + 图片原文件</td></tr></table>
    <div class="foot"><button class="primary" data-act="close">关闭</button></div>`);
}

/* ================= 人工框选 / 拖动 / 缩放 ================= */
let drag = null;
function bindStage(mat) {
  const st = $('#stage'); if (!st) return;
  const pos = ev => { const r = st.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * mat.w, (ev.clientY - r.top) / r.height * mat.h]; };
  st.onpointerdown = ev => {
    const [px, py] = pos(ev), handle = ev.target.closest('.handle'), box = ev.target.closest('.box:not(.bgbox)');
    if (!editor()) { if (box) { state.sel = box.dataset.eid; render(); } return; }
    if (state.draw) {
      const g = document.createElement('div'); g.className = 'ghost'; st.appendChild(g);
      drag = { mode: 'draw', x0: px, y0: py, g };
    } else if (handle || box) {
      const e = mat.elements.find(x => x.id === (handle || box).closest('.box').dataset.eid);
      if (e.status === 'searching') return;
      state.sel = e.id;
      drag = { mode: handle ? 'resize' : 'move', e, x0: px, y0: py, b0: [...e.bbox], el: (handle || box).closest('.box') };
    } else return;
    ev.preventDefault(); st.setPointerCapture(ev.pointerId);
  };
  st.onpointermove = ev => {
    if (!drag) return;
    const [px, py] = pos(ev), dx = px - drag.x0, dy = py - drag.y0, P = (v, t) => (v / t * 100) + '%';
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (drag.mode === 'draw') {
      const x = Math.max(0, Math.min(px, drag.x0)), y = Math.max(0, Math.min(py, drag.y0));
      const w = Math.min(mat.w, Math.max(px, drag.x0)) - x, h = Math.min(mat.h, Math.max(py, drag.y0)) - y;
      drag.box = [x, y, w, h]; Object.assign(drag.g.style, { left: P(x, mat.w), top: P(y, mat.h), width: P(w, mat.w), height: P(h, mat.h) });
    } else {
      const [x, y, w, h] = drag.b0;
      if (drag.mode === 'move') drag.e.bbox = [Math.max(0, Math.min(mat.w - w, x + dx)), Math.max(0, Math.min(mat.h - h, y + dy)), w, h];
      else drag.e.bbox = [x, y, Math.min(mat.w - x, Math.max(1, w + dx)), Math.min(mat.h - y, Math.max(1, h + dy))];
      const b = drag.e.bbox; Object.assign(drag.el.style, { left: P(b[0], mat.w), top: P(b[1], mat.h), width: P(b[2], mat.w), height: P(b[3], mat.h) });
    }
  };
  st.onpointercancel = () => {
    if (!drag) return;
    if (drag.e) drag.e.bbox = drag.b0;
    drag = null;
    render();
  };
  st.onpointerup = () => {
    if (!drag) return; const d = drag; drag = null;
    if (d.mode === 'draw') {
      d.g.remove();
      if (d.box && d.box[2] >= Math.min(15, mat.w / 5) && d.box[3] >= Math.min(15, mat.h / 5)) {
        const e = E('待标注', d.box.map(Math.round), [], { source: 'manual' });
        mat.elements.push(e); state.sel = e.id; state.draw = false;
        logM(mat, '人工框选新增元素', `坐标 [${e.bbox.join(', ')}]`);
        research(mat, e);
        toast('已新增人工框选元素，正在独立检索…可在右侧修改元素类型');
      }
    } else if (d.moved) { d.e.edited = true; d.e.boxChanged = true; d.e.bbox = d.e.bbox.map(Math.round); logM(mat, '修正元素框', `「${d.e.label}」→ [${d.e.bbox.join(', ')}]`); research(mat, d.e); }
    render();
  };
}
async function research(mat, e) {
  if (e.status === 'searching') return;
  const previous = e.matches;
  if (mat.demo) {
    if (e.edited || e.source === 'manual') e.matches = [];
    e.searchNote = '示例素材没有原始文件，补框结果请使用实际素材筛查。';
    render(); return;
  }
  if (e.dec) { logM(mat, '元素认定失效', `「${e.label}」需重新认定`); e.dec = null; }
  e.matches = [];
  e.searchedWeb = false;
  e.status = 'searching';
  const user = me.id;
  render();
  try {
    await saveWorkspace();
    const result = await api('/api/research', { material: mat.id, user, bbox: e.bbox, label: e.label,
      foreground: mat.elements.filter(e => !['整图', '背景图'].includes(e.label)).map(e => e.bbox) });
    const oldByUrl = new Map(previous.map(m => [m.url, m.dismissed]));
    if (!e.boxChanged) result.matches.forEach(m => { if (oldByUrl.get(m.url)) m.dismissed = oldByUrl.get(m.url); });
    Object.assign(e, { searchNote: '', boxChanged: false, ...result });
    logM(mat, '重新检索完成', `「${e.label}」· ${e.matches.length} 个候选来源`);
  } catch (error) {
    e.searchNote = error.message;
    logM(mat, '重新检索未完成', e.searchNote);
  } finally {
    e.status = 'done';
    render();
  }
}

/* ================= CSV ================= */
function exportCSV() {
  const ms = (state.checked.size ? visible().filter(m => state.checked.has(m.id)) : filtered());
  const rows = [['文件名', '记录类型', '业务线', MATERIAL_LABELS.party, MATERIAL_LABELS.purpose, '投放渠道', '投放地域', '计划上线日期', '素材审核状态', '业务处理人', '素材预筛等级', '涉及元素', '风险类型', '风险点等级', '风险原因', '建议处理方式', '疑似来源', '来源链接', '法务元素认定']];
  ms.forEach(m => {
    const ev = evalMat(m);
    const screened = m.status === 'done';
    const screening = m.status === 'failed' ? '筛查未完成' : screened ? riskLabel(ev.lv) : '筛查中';
    const status = screened ? (m.review.by === 'legal' && changed(m) ? '待法务重新确认' : m.review.status) : screening;
    const base = [m.file, m.demo ? '示例' : '实际素材', lineN(m), cName(m.client), purposeText(m.purpose), m.channel, m.region, m.launch, status, m.review.assignee, screening];
    if (!ev.items.length) {
      const reason = m.status === 'failed' ? '请回工作台重新筛查' : !screened ? '请等待筛查完成' : ev.lv === -2 ? '筛查覆盖有限，请人工核对来源和授权' : '当前未发现风险点';
      rows.push([...base, '', '', '', reason, '', '', '', '']);
    }
    ev.items.forEach(i => {
      const c = i.m && classify(i.m.url, m);
      rows.push([...base, i.e?.label || '图片文件信息', KIND[i.kind][0], riskLabel(i.lv), lt(i.csvText || i.text), REMEDY[i.remedy][0], c?.name, i.m?.reference ? '' : i.m?.url, i.e?.dec?.v || '']);
    });
  });
  const cell = value => {
    const str = String(value ?? '');
    const plain = typeof value === 'string' && /^[\s\x00-\x1f]*[=+@-]/.test(str) ? "'" + str : str;
    return '"' + plain.replace(/"/g, '""') + '"';
  };
  const csv = rows.map(r => r.map(cell).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `素材版权风险清单_${fmtD(Date.now())}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`已导出 ${ms.length} 条素材`);
}

/* ================= 上传与筛查队列 ================= */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const imageType = file => /^(image\/jpeg|image\/png)$/.test(file.type) ? file.type :
  (!file.type || file.type === 'application/octet-stream') ? (/\.jpe?g$/i.test(file.name) ? 'image/jpeg' : /\.png$/i.test(file.name) ? 'image/png' : '') : '';
let pendingFiles = [], uploadCtx = null;
const activeUploadZone = () => $('#modal').classList.contains('hidden') ? null : $('#u-drop');
function updateUploadSelection(entries, failed = 0, folders = 0) {
  pendingFiles = entries.filter(({ file }) => imageType(file) && file.size > 0 && file.size <= MAX_IMAGE_BYTES);
  const tooMany = uploadCtx && pendingFiles.length > 1;
  if (tooMany) pendingFiles = [];
  const skipped = tooMany ? 0 : entries.length - pendingFiles.length;
  const names = pendingFiles.slice(0, 3).map(({ file, path }) => path || file.name);
  $('#u-files').textContent = pendingFiles.length ? `已选 ${pendingFiles.length} 张图片：${names.join('、')}${pendingFiles.length > names.length ? '…' : ''}` : '支持 JPG、JPEG 和 PNG 图片，单张不超过 20 MB';
  $('#u-err').textContent = [
    tooMany ? '每个版本只能替换为一张图片。' : !pendingFiles.length ? '未找到可筛查的图片，请重新选择。' : '',
    skipped ? `已跳过 ${skipped} 个格式不支持或超过 20 MB 的文件。` : '',
    failed ? `有 ${failed} 个文件或文件夹未能读取。` : '',
    folders ? '请直接选择替换图片。' : '',
  ].filter(Boolean).join(' ');
  $('[data-act="u-go"]').disabled = !pendingFiles.length;
}
function uploadModal(replaceOf = null) {
  pendingFiles = []; uploadCtx = replaceOf;
  const p = replaceOf || {};
  openModal(`<h3>${replaceOf ? '上传替换版本' : '上传素材筛查'}</h3><div class="muted">${replaceOf ? `替换 ${esc(replaceOf.file)}（v${replaceOf.version}），新版本将与旧版本关联并自动重新筛查` : '使用方与投放范围用于白名单和授权核对。筛查完成后请核对预筛结果并提交法务审核，所有素材须经法务审核后方可投放'}</div>
    <div class="form upload-form">
      <label for="u-client">${MATERIAL_LABELS.party}</label><select id="u-client" ${replaceOf ? 'disabled' : ''}>${Object.entries(CLIENTS).filter(([, c]) => myLines().includes(c.line)).map(([k, c]) => `<option value="${k}" ${p.client === k ? 'selected' : ''}>${esc(c.name)} · ${LINES[c.line]}</option>`).join('')}</select>
      <label>投放渠道</label><select id="u-ch">${CHANNELS.map(c => `<option ${p.channel === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <label>投放地域</label><select id="u-rg">${REGIONS.map(c => `<option ${p.region === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <label>计划上线日期</label><input type="date" id="u-date" value="${p.launch || fmtD(Date.now() + 7 * 864e5)}" style="width:170px">
      <label for="u-purpose">${MATERIAL_LABELS.purpose}</label><input type="text" id="u-purpose" value="${esc(p.purpose)}" placeholder="如：黑五促销广告">
      <div class="full upload-drop" id="u-drop" role="group" aria-label="选择或拖入素材">
        <strong>${replaceOf ? '把替换图片拖到这里' : '把图片或文件夹拖到这里'}</strong>
        <div class="upload-buttons"><button data-act="u-pick">选择图片</button>${replaceOf ? '' : '<button data-act="u-folder">选择文件夹</button>'}</div>
        <span class="upload-selection" id="u-files" aria-live="polite">${replaceOf ? '' : '自动包含子文件夹中的图片。'}支持 JPG、JPEG 和 PNG 图片，单张不超过 20 MB</span>
      </div>
      <div class="err full" id="u-err" aria-live="polite"></div>
    </div>
    <div class="foot"><button data-act="close">取消</button><button class="primary" data-act="u-go" disabled>开始筛查</button></div>`);
}
function fileSelection(files) {
  return Array.from(files, file => ({ file, path: file.webkitRelativePath || '' }));
}
async function droppedSelection(transfer, allowFolders) {
  // 在 drop 事件中取出文件条目，异步读取时拖放数据已经不可访问。
  const roots = Array.from(transfer.items || []).filter(item => item.kind === 'file').map(item => ({
    entry: item.getAsEntry?.() || item.webkitGetAsEntry?.(), file: item.getAsFile(),
  }));
  const fallback = fileSelection(transfer.files);
  if (!roots.some(({ entry }) => entry)) return { entries: fallback, failed: 0 };
  const entries = [];
  let failed = 0, folders = 0;
  async function read(entry, parent = '') {
    try {
      if (entry.isFile) {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        entries.push({ file, path: parent ? `${parent}${file.name}` : '' });
      } else if (entry.isDirectory && allowFolders) {
        const reader = entry.createReader(), prefix = `${parent}${entry.name}/`;
        while (true) {
          const children = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
          if (!children.length) break;
          for (const child of children) await read(child, prefix);
        }
      } else if (entry.isDirectory) folders++;
    } catch { failed++; }
  }
  for (const { entry, file } of roots) {
    if (entry) await read(entry);
    else if (file) entries.push({ file, path: '' });
    else failed++;
  }
  return { entries, failed, folders };
}
const queue = [];
let running = 0;
let uploading = false;
function startBatch() {
  if (!running && !queue.length && batch.done === batch.total) {
    Object.assign(batch, { total: 0, done: 0, start: Date.now(), doneAt: 0 });
  }
}
const batchOn = () => batch.total > 0 && (uploading || batch.done < batch.total);
function batchHTML() {
  const pct = batch.total ? Math.round(batch.done / batch.total * 100) : 0;
  const sec = Math.max(0, Math.floor((Date.now() - batch.start) / 1000));
  const el = sec >= 60 ? `${Math.floor(sec / 60)}分${String(sec % 60).padStart(2, '0')}秒` : `${sec}秒`;
  const wait = batch.total - batch.done - running;
  return `<div style="display:flex;justify-content:space-between;font-size:13px"><b>批量筛查进度 · ${pct}%</b><span class="muted">已完成 ${batch.done}/${batch.total}${running ? ` · 筛查中 ${running}` : ''}${wait > 0 ? ` · 排队 ${wait}` : ''}${uploading ? ' · 上传中' : ''} · 已用时 ${el}</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>`;
}
let batchTimer = 0;
function tickBatch() {
  const box = document.getElementById('batch-prog');
  if (!batchOn()) {
    clearInterval(batchTimer); batchTimer = 0;
    if (box) box.remove();
    return;
  }
  if (box) box.innerHTML = batchHTML();
  if (!batchTimer) batchTimer = setInterval(tickBatch, 1000);
}
async function addFiles(entries, ctx) {
  if (uploading || !myLines().includes(CLIENTS[ctx.client]?.line)) return;
  const uploader = me, by = actor();
  const assignee = ['audit', 'ops'].includes(uploader.role) ? uploader.name : opsOf(CLIENTS[ctx.client].line);
  uploading = true;
  let accepted = 0, skipped = 0, error = '';
  startBatch();
  try {
    for (const { file, path } of entries) {
      try {
        const input = await uploadBlob('/api/images', file);
        if (ctx.prev && !materials.includes(ctx.prev)) throw new Error('原素材已删除，请作为新素材上传');
        const m = { id: 'u-' + crypto.randomUUID(), file: file.name, relativePath: path, client: ctx.client, channel: ctx.channel, region: ctx.region, launch: ctx.launch, purpose: ctx.purpose, uploader: uploader.name, uploaderId: uploader.id,
          src: input.src, asset: input.key, w: input.w, h: input.h, status: 'queued', review: { status: '待提交法务', assignee }, elements: [], meta: [],
          ruleVer: RULES.active, engines: [], version: ctx.prev ? ctx.prev.version + 1 : 1, prevId: ctx.prev?.id || null, audit: [], scanAt: Date.now() };
        m.audit.unshift({ at: Date.now(), by, act: ctx.prev ? '上传替换版本' : '上传素材', detail: `${MATERIAL_LABELS.purpose}：${purposeText(ctx.purpose)} · 处理人 ${assignee}${ctx.prev ? ` · 替换 ${ctx.prev.file}（v${ctx.prev.version}）` : ''}` });
        if (ctx.prev) {
          const old = ctx.prev.review.status;
          ctx.prev.review.status = '已替换';
          ctx.prev.audit.unshift({ at: Date.now(), by, act: '已上传替换版本', detail: `${old} → 已替换：新版本 ${m.file}（v${m.version}）` });
        }
        materials.unshift(m); queue.push({ m, user: uploader.id }); batch.total++; accepted++;
        render(); pump();
      } catch (err) {
        error = err.message;
        skipped++;
      }
    }
  } finally {
    uploading = false;
    render();
  }
  toast(accepted ? `已加入 ${accepted} 张图片${skipped ? `；${skipped} 张未加入：${error}` : ''}` : error || '请选择可读取的图片');
}
function pump() {
  while (running < 4 && queue.length) {
    const { m, user } = queue.shift();
    if (!materials.includes(m)) {
      batch.done++;
      if (batch.done === batch.total) batch.doneAt = Date.now();
      continue;
    }
    running++;
    processOne(m, user).finally(() => {
      running--; batch.done++;
      if (batch.done === batch.total) batch.doneAt = Date.now();
      render(); pump();
    });
  }
}
async function processOne(m, user) {
  m.status = 'searching';
  delete m.error;
  render();
  try {
    await saveWorkspace();
    const result = await api('/api/analyze', { material: m.id, user });
    Object.assign(m, result, { status: 'done', scanAt: Date.now(), ruleVer: RULES.active });
    m.elements = result.elements.map(e => E(e.label, e.bbox, e.matches, e));
    m.audit.unshift(sys(m.scanAt, '完成筛查', `规则 v${m.ruleVer} · ${m.engines.map(k => ENGINES[k].n).join(' / ') || '本地元数据检查'} · 耗时 ${m.time.total}s`));
  } catch (error) {
    m.status = 'failed';
    m.error = error.message;
    m.audit.unshift(sys(Date.now(), '筛查未完成', m.error));
  }
}

/* ================= 本机工作区 ================= */
let runtime = {}, apiToken = '', revision = 0, ready = false;
let lastSaved = '', scheduled = '', saveTail = Promise.resolve();
const contents = () => ({ materials, clients: CLIENTS, users: USERS, rules: RULES, licenses: LICENSES, dictionary: DICT, configLog: CONFIG_LOG, ledgerConfig: LEDGER_CFG });
async function api(path, body, method = body ? 'POST' : 'GET', keepalive = false) {
  const headers = body ? { 'Content-Type': 'application/json', 'X-Radar-Token': apiToken } : {};
  const response = await fetch(path, { method, headers, body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined, keepalive });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '本地服务未能完成请求');
  return data;
}
async function uploadBlob(path, file) {
  const response = await fetch(path, { method: 'POST', headers: { 'X-Radar-Token': apiToken }, body: file });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '文件未能保存');
  return data;
}
function saveWorkspace() {
  if (!ready) return Promise.resolve();
  const snapshot = JSON.stringify(contents());
  if (snapshot === scheduled) return saveTail;
  scheduled = snapshot;
  saveTail = saveTail.catch(() => {}).then(async () => {
    if (snapshot === lastSaved) return;
    const body = `{"revision":${revision},"workspace":${snapshot}}`;
    ({ revision } = await api('/api/workspace', body, 'PUT', new Blob([body]).size < 60000));
    lastSaved = snapshot;
  }).catch(error => {
    if (scheduled === snapshot) scheduled = '';
    toast('保存失败：' + error.message);
    throw error;
  });
  saveTail.catch(() => {});
  return saveTail;
}
async function deleteDraft(mat, button) {
  if (!canDeleteDraft(mat)) return;
  const index = materials.indexOf(mat);
  if (index < 0) return;
  button.disabled = true;
  const prev = materials.find(m => m.id === mat.prevId && m.review.status === '已替换');
  let restoreLog;
  if (prev) {
    const replacement = prev.audit.find(a => a.act === '已上传替换版本');
    prev.review.status = replacement?.detail.startsWith('需替换 →') ? '需替换' : '待提交法务';
    logM(prev, '恢复上一版本', `替换版本 v${mat.version} 已删除，恢复为「${prev.review.status}」`);
    restoreLog = prev.audit[0];
  }
  const logs = [{ at: Date.now(), by: actor(), obj: mat.file, act: '删除素材', detail: '尚未提交法务' },
    ...mat.audit.filter(a => a.by !== '系统').map(a => ({ ...a, obj: mat.file }))];
  CONFIG_LOG.unshift(...logs);
  materials.splice(index, 1);
  try {
    await saveWorkspace();
  } catch {
    materials.splice(index, 0, mat);
    if (prev) {
      prev.review.status = '已替换';
      prev.audit.splice(prev.audit.indexOf(restoreLog), 1);
    }
    for (const log of logs) CONFIG_LOG.splice(CONFIG_LOG.indexOf(log), 1);
    render();
    return;
  }
  state.checked.delete(mat.id);
  if (state.cur === mat.id) {
    state.cur = null;
    state.sel = null;
    state.draw = false;
    if (state.view === 'detail') go('list');
    else render();
  } else render();
  toast('素材已删除');
}
async function bootstrap() {
  $('#app').innerHTML = '<div class="card empty"><span class="spin"></span> 正在打开本地工作区…</div>';
  try {
    const data = await api('/api/workspace');
    ({ token: apiToken, revision, capabilities: runtime } = data);
    const work = data.workspace;
    if (work) {
      materials.splice(0, materials.length, ...work.materials);
      Object.assign(CLIENTS, work.clients);
      USERS.splice(0, USERS.length, ...work.users);
      Object.assign(RULES, work.rules);
      LICENSES = work.licenses;
      DICT = work.dictionary;
      CONFIG_LOG.splice(0, CONFIG_LOG.length, ...work.configLog);
      Object.assign(LEDGER_CFG, work.ledgerConfig);
      lastSaved = scheduled = JSON.stringify(contents());
      for (const m of materials) {
        if (m.status !== 'done' && m.status !== 'failed') { m.status = 'failed'; m.error = '浏览器离开后筛查中断，请重新筛查。'; }
        for (const e of m.elements) if (e.status === 'searching') { e.status = 'done'; e.searchNote = '检索中断，请重新检索。'; }
      }
    }
    initializeHy4Policy();
    me = USERS.find(u => u.id === sessionStorage.getItem('radar-user')) || USERS[0];
    state.filter = defaultFilter();
    state.view = homeView();
    readRoute();
    ready = true;
    render();
  } catch (error) {
    $('#app').innerHTML = `<div class="card empty"><b>无法打开本地工作区</b><p>${esc(error.message)}</p><button data-act="reload">重新加载</button></div>`;
  }
}

/* ================= 渲染与事件 ================= */
function render() {
  if (!ready) return;
  if (drag) return;
  saveWorkspace();
  if (!canView(state.view)) state.view = homeView();
  if (!FILTERS[state.filter]) state.filter = defaultFilter();
  renderNav();
  ({ list: renderList, detail: renderDetail, ledger: renderLedger, rules: renderRules, sources: renderSources, members: renderMembers, log: renderLog })[state.view]();
  tickBatch();
  const h = state.view === 'detail' ? state.cur : state.view;
  if (location.hash.slice(1) !== h) history.replaceState(null, '', '#' + h);
}
const go = v => { state.view = v; render(); scrollTo(0, 0); };
const basisSel = opts => `<div class="form" style="grid-template-columns:90px minmax(0,1fr);margin-top:10px"><label>依据</label><select id="rsn-x">${opts.map(o => `<option>${o}</option>`).join('')}</select></div>`;
function setStatus(mat, v, by, extra = {}) {
  const old = mat.review.status;
  Object.assign(mat.review, { status: v, by, ...extra });
  if (CONCLUDED.includes(v)) mat.review.snap = { lv: evalMat(mat).lv, sig: sigOf(mat) };
  return old;
}
function bizSubmit(mats) {
  mats = mats.filter(m => canSee(m) && m.status === 'done' && bizGates(m)?.submit === '');
  if (!mats.length) return;
  const one = mats.length === 1, mat = mats[0], re = one && mat.review.status === '待补授权';
  reasonModal(re ? '补齐后重新提交法务' : one ? '提交法务审核' : `批量提交法务审核（${mats.length} 条）`, re ? '说明已补充的授权材料，法务将重新给出结论。' : '所有素材都须经法务审核。请说明预筛情况和需要法务判断的问题（如：使用方称已采购、来源能否用于商业投放）。', '提交', r => {
    mats.forEach(m => { const old = setStatus(m, '法务审核中', 'biz', { submit: { by: actor(), at: Date.now(), text: r } }); logM(m, re ? '重新提交法务' : '提交法务审核', `${old} → 法务审核中：${r}`); });
    toast(`已提交法务 ${mats.length} 条`); state.checked.clear();
  }, { ph: re ? '如：已在台账录入 SS-2026-0101，媒介渠道为 TikTok，授权地区为全球' : '如：使用方称背景图已在视觉中国采购，但未提供授权凭证' });
}
function bizReplace(mat) {
  reasonModal('标记需替换', '确认不使用当前素材中的风险元素，替换后上传新版本（新版本会自动重新筛查）。', '标记需替换', r => {
    const old = setStatus(mat, '需替换', 'biz'); logM(mat, '标记需替换', `${old} → 需替换：${r}`); toast('已标记需替换');
  }, { danger: true, ph: '写明需替换的元素与原因' });
}
// 法务结论
function legalConclude(mat, v) {
  const ev = evalMat(mat);
  const cfg = {
    '可投放': ['放行素材', `确认「${esc(mat.file)}」可以投放。${ev.lv === 2 ? '系统判定为高风险，请写明放行依据。' : ''}`, '确认放行', { pre: basisSel(ev.lv === 0 ? ['未发现风险'] : ev.lv === -2 ? ['人工复核已确认授权或自有来源', '其他（在下方说明）'] : ['误报（检出来源非同一作品）', '已取得授权', '合理使用 / 风险可接受', '其他（在下方说明）']), ph: ev.lv === 0 ? '补充说明（选填）' : '依据说明（必填），将写入操作记录', optional: ev.lv === 0 }],
    '待补授权': ['要求补授权', '列出需要业务补充的授权材料。业务补齐并重新提交后，你会再次收到复核。', '发送要求', { ph: '如：请提供 Shutterstock 图片 2251234567 的采购记录与授权协议' }],
    '需替换': ['要求替换素材', `确认素材存在侵权风险，需要业务替换后上传新版本。`, '确认要求替换', { danger: true, ph: '写明需替换的元素与原因' }],
  }[v];
  reasonModal(cfg[0], cfg[1], cfg[2], (r, basis) => {
    const legal = { v, by: actor(), at: Date.now(), text: r, basis: v === '可投放' ? basis : null };
    const old = setStatus(mat, v, 'legal', { legal, basis: legal.basis });
    logM(mat, `法务结论：${v}`, `${old} → ${v}${legal.basis ? `（依据：${legal.basis}）` : ''}${r ? '：' + r : ''}`);
    toast(`已给出结论「${v}」`);
  }, cfg[3]);
}
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-act]'); if (!t) return;
  if (t.matches('a[href^="#"]')) ev.preventDefault();
  const a = t.dataset.act, mat = cur(), el = mat && mat.elements.find(e => e.id === t.dataset.eid);
  if (a === 'reload') location.reload();
  else if (!ready) return;
  else if (a === 'delete-draft') deleteDraft(mat, t);
  else if (a === 'retry' && mat?.status === 'failed' && can('upload') && canSee(mat)) {
    startBatch(); mat.status = 'queued'; batch.total++;
    queue.push({ m: mat, user: me.id }); pump();
  }
  else if (a === 'nav') go(t.dataset.view);
  else if (a === 'open') { state.cur = t.dataset.id; state.sel = null; state.draw = false; closeModal(); go('detail'); }
  else if (a === 'back') go('list');
  else if (a === 'nav-mat') { const ids = navIds(), i = ids.indexOf(mat.id) + +t.dataset.d; if (ids[i]) { state.cur = ids[i]; state.sel = null; render(); scrollTo(0, 0); } }
  else if (a === 'filter') { state.filter = t.dataset.f; state.checked.clear(); render(); }
  else if (a === 'ck') { ev.stopPropagation(); state.checked.has(t.dataset.id) ? state.checked.delete(t.dataset.id) : state.checked.add(t.dataset.id); render(); }
  else if (a === 'ck-all') { const ids = filtered().map(m => m.id), all = ids.every(id => state.checked.has(id)); ids.forEach(id => all ? state.checked.delete(id) : state.checked.add(id)); render(); }
  else if (a === 'bulk-clear') { state.checked.clear(); render(); }
  else if (a === 'bulk-submit') bizSubmit(materials.filter(m => state.checked.has(m.id) && m.review.status === '待提交法务'));
  else if (a === 'bulk-pass') { const ms = materials.filter(m => state.checked.has(m.id) && legalOpen(m) && lvOf(m) === 0); reasonModal(`批量放行 ${ms.length} 条素材`, '以下素材系统预筛未发现风险点，确认放行后状态变为「可投放」。<br>' + ms.map(m => esc(m.file)).join('、'), '确认放行', r => { ms.forEach(m => { const legal = { v: '可投放', by: actor(), at: Date.now(), basis: '未发现风险', text: r }; const old = setStatus(m, '可投放', 'legal', { legal, basis: '未发现风险' }); logM(m, '法务结论：可投放', `${old} → 可投放（依据：未发现风险 · 批量）${r ? '：' + r : ''}`); }); state.checked.clear(); toast(`已放行 ${ms.length} 条`); }, { optional: true, ph: '补充说明（选填）' }); }
  else if (a === 'sel') { state.sel = t.dataset.eid; render(); }
  else if (a === 'draw') { state.draw = !state.draw; render(); if (state.draw) toast('在图片上拖拽，框出遗漏的元素'); }
  else if (a === 'hide') { state.hide = !state.hide; render(); }
  else if (a === 'del' && el) { if (el.source !== 'manual') return; reasonModal('删除人工补框', `删除补框的「${el.label}」（坐标 [${el.bbox.join(', ')}]），其检索结果不再参与判定。自动拆分的元素不能删除。`, '确认删除', r => { mat.elements = mat.elements.filter(e => e !== el); state.sel = null; logM(mat, '删除人工补框', `「${el.label}」：${r}`); toast('已删除'); }, { danger: true, ph: '原因（必填），如：框错位置' }); }
  else if (a === 'research' && el && editor() && el.status !== 'searching') { logM(mat, '手动重新检索', `「${el.label}」`); research(mat, el); }
  else if (a === 'dec' && el) {
    const v = t.dataset.v;
    if (el.dec?.v === v) return;
    const doIt = note => { el.dec = { v, by: actor(), at: Date.now(), note }; logM(mat, '法务元素认定', `「${el.label}」→ ${v}${note ? '：' + note : ''}`); render(); };
    if (v === '有风险') doIt(''); else reasonModal(`认定「${el.label}」为无风险`, '确认该元素不构成侵权风险。如检出来源与素材根本不是同一作品，请使用「疑似来源」中的「排除此来源」。', '确认', doIt, { ph: '依据（必填），如：已取得模特肖像授权 Model Release、属合理使用等' });
  }
  else if (a === 'dismiss' || a === 'undismiss') {
    const m = el.matches[+t.dataset.i], c = classify(m.url, mat);
    if (a === 'undismiss') { m.dismissed = null; logM(mat, '撤销排除来源', `「${el.label}」· ${c.name}`); render(); }
    else reasonModal('排除此来源', `认定「${esc(el.label)}」与 ${esc(c.name)} 上的图片不是同一作品，该来源不再参与判定（可撤销，操作留痕）。`, '确认排除', r => { m.dismissed = { by: actor(), at: Date.now(), reason: r }; logM(mat, '排除来源（非同一作品）', `「${el.label}」· ${c.name} ${m.url}：${r}`); }, { ph: '如：构图相似但拍摄地点、细节不同' });
  }
  else if (a === 'biz-submit') bizSubmit([mat]);
  else if (a === 'biz-replace' && mat && bizGates(mat)?.replace === '') bizReplace(mat);
  else if (a === 'legal' && mat && canSee(mat)) {
    const gate = { '可投放': 'release', '待补授权': 'docs', '需替换': 'replace' }[t.dataset.v];
    if (gate && legalGates(mat)?.[gate] === '') legalConclude(mat, t.dataset.v);
  }
  else if (a === 'link-lic' && el) {
    const it = evalEl(el, mat).items.find(i => i.remedy === 'buy'), m = it?.m, c = m && classify(m.url, mat);
    const pre = el.font ? { kind: '字体', vendor: el.font.vendor, asset: el.font.name, client: mat.client } : { kind: '图片', vendor: c?.name.replace(/（.*）/, '') || '', domain: c?.host || '', asset: m ? assetOf(m.url) || '' : '', client: mat.client };
    openLicModal(pre, '录入授权', `为「${esc(el.label)}」录入授权凭证。本次投放的媒介渠道为 ${esc(mat.channel)}，授权地区需覆盖 ${esc(mat.region)}。`, l => {
      logM(mat, '录入授权', `${l.no} · ${l.vendor} ${l.asset} · ${l.use} · 媒介渠道：${l.channels.join('、')} · 授权地区：${l.regions.join('、')} · 授权期限：${l.start} 至 ${l.end}`);
      const ok = !scopeIssues(l, mat).length; toast(ok ? '授权已录入，系统已重新核对风险' : '授权已录入，范围与本次投放不符');
    });
  }
  else if (a === 'snap' && el) showSnap(mat, el, el.matches[+t.dataset.i]);
  else if (a === 'close') closeModal();
  else if (a === 'modal-ok' || a === 'lic-save') modalSave && modalSave();
  else if (a === 'upload-open') uploadModal();
  else if (a === 'upload-replace') uploadModal(mat);
  else if (a === 'u-pick') $('#fileInput').click();
  else if (a === 'u-folder') $('#folderInput').click();
  else if (a === 'u-go') {
    if (!pendingFiles.length || !activeUploadZone() || !can('upload') || uploading) return;
    const p = uploadCtx, ctx = { client: p ? p.client : $('#u-client').value, channel: $('#u-ch').value, region: $('#u-rg').value, launch: $('#u-date').value, purpose: $('#u-purpose').value.trim(), prev: p };
    if (!ctx.launch) { $('#u-err').textContent = '请填写计划上线日期'; return; }
    const entries = pendingFiles; pendingFiles = []; closeModal();
    state.filter = 'mine';
    if (state.view !== 'list') go('list'); else render();
    toast(`正在读取 ${entries.length} 张图片`);
    addFiles(entries, ctx);
  }
  else if (a === 'csv') exportCSV();
  else if (a === 'lkind') { state.ledgerKind = t.dataset.k; render(); }
  else if (a === 'lic-new') openLicModal({}, '录入授权', '填写授权信息和授权凭证。', l => toast(`已录入 ${l.no}`));
  else if (a === 'lic-renew' && can('ledger')) {
    const l = LICENSES.find(x => x.no === t.dataset.no);
    if (!l) return;
    reasonModal(`登记续期：${esc(l.no)}`, `当前授权期限为 ${esc(l.start)} 至 ${esc(l.end)}。`, '确认续期', (r, basis, date) => {
      const old = l.end;
      l.end = date;
      licUsage(l).forEach(m => logM(m, '授权续期', `${l.no}：${old} → ${date}`));
      logC('授权台账', '登记续期', `${l.no}：${old} → ${date} · ${r}`);
      toast('已续期');
    }, { date: l.end, ph: '填写授权凭证编号或续期说明' });
  }
  else if (a === 'r-reset') { state.draft = null; render(); }
  else if (a === 'r-publish') {
    const d = state.draft, act = activeRule(), ch = RULE_KEYS.filter(k => d[k] !== act[k]).map(k => `${RULE_LABEL[k]}：${fmtR(act[k])} → ${fmtR(d[k])}`);
    reasonModal(`发布规则 v${RULES.versions.length + 1}`, `变更：${ch.join('；')}。发布后新上传和未定论的素材按新版本判定；法务已定论的保持原判定。`, '确认发布', note => {
      const v = RULES.versions.length + 1; RULES.versions.push({ ...d, v, by: actor(), at: fmtT(Date.now()), note }); RULES.active = v; state.draft = null;
      const aff = affected(); let chg = 0;
      aff.forEach(m => {
        const o = evalMat(m).lv, os = sigOf(m), ov = m.ruleVer; m.ruleVer = v; const nl = evalMat(m).lv; if (o !== nl || os !== sigOf(m)) chg++;
        m.audit.unshift({ at: Date.now(), by: '系统', act: '规则更新后重新判定', detail: `v${ov} → v${v}：${riskLabel(o)} → ${riskLabel(nl)}` });
      });
      logC('风险规则', `发布规则 v${v}`, `${ch.join('；')} · ${note}`); toast(`已发布 v${v}：${aff.length} 条未定论素材已重新判定，${chg} 条风险点有变化`);
    }, { ph: '变更原因（必填，如：法务评审意见）' });
  }
  else if (a === 'dict-del') { const d = t.dataset.d; DICT = DICT.filter(x => x[0] !== d); logC('来源字典', '删除域名', d); render(); }
  else if (a === 'dict-add') { const dom = domainInput($('#d-dom').value.trim()), n = $('#d-name').value.trim() || dom, ty = $('#d-type').value; if (!dom) return toast('请填写域名'); if (DICT.some(x => x[0] === dom)) return toast('该域名已存在'); DICT.push([dom, ty, n]); logC('来源字典', '新增域名', `${dom}（${n} · ${TYPE_N[ty]}）`); render(); toast('已添加'); }
  else if (a === 'wl-add') { const k = t.dataset.c, v = domainInput($('#wl-' + k).value.trim()); if (v && !CLIENTS[k].domains.includes(v)) { CLIENTS[k].domains.push(v); logC('客户配置', '新增自有域名', `${CLIENTS[k].name}：${v}`); render(); toast(`已添加，仅对 ${shortC(k)} 的素材生效`); } }
  else if (a === 'wl-del') { const k = t.dataset.c; CLIENTS[k].domains = CLIENTS[k].domains.filter(d => d !== t.dataset.d); logC('客户配置', '删除自有域名', `${CLIENTS[k].name}：${t.dataset.d}`); render(); }
  else if (a === 'miss' && can('legal')) reasonModal('登记漏检案例', '上线后收到投诉 / 律师函但系统未检出的素材，将回流用于规则与模型调优。', '登记', r => { logC('漏检回流', '登记漏检案例', r); toast('已登记'); }, { ph: '素材、投诉方、侵权内容' });
});
document.addEventListener('change', ev => {
  const t = ev.target, a = t.dataset.act, mat = cur();
  if (a === 'who') { me = USERS.find(u => u.id === t.value) || me; sessionStorage.setItem('radar-user', me.id); closeModal(); state.draft = null; state.checked.clear(); state.filter = defaultFilter(); state.line = 'all'; state.client = 'all'; state.purpose = ''; if (me.role === 'admin' || !canView(state.view) || (state.view === 'detail' && !canSee(cur()))) state.view = homeView(); render(); toast(`已切换为 ${me.name}（${ROLES[me.role]}）`); }
  else if (a === 'label') { const e = mat.elements.find(x => x.id === t.dataset.eid), o = e.label; e.label = t.value; logM(mat, '标注补框类型', `${o} → ${t.value}`); render(); }
  else if (a === 'assign') { const o = mat.review.assignee; mat.review.assignee = t.value; logM(mat, '转交处理人', `${o} → ${t.value}`); toast(`已转交给 ${t.value}`); render(); }
  else if (a === 'bulk-assign' && t.value) { const ms = materials.filter(m => state.checked.has(m.id)); ms.forEach(m => { const o = m.review.assignee; m.review.assignee = t.value; logM(m, '转交处理人', `${o} → ${t.value}（批量）`); }); toast(`已将 ${ms.length} 条转交给 ${t.value}`); state.checked.clear(); render(); }
  else if (a === 'fline') { state.line = t.value; state.client = 'all'; render(); }
  else if (a === 'fclient') { state.client = t.value; render(); }
  else if (a === 'fpurpose') { state.purpose = t.value; render(); }
  else if (a === 'rH' || a === 'rM') render();
  else if (a === 'rT') { state.draft[t.dataset.k] = t.checked; render(); }
  else if (a === 'lexp') { const o = LEDGER_CFG.expiryDays; LEDGER_CFG.expiryDays = Math.max(7, Math.min(180, +t.value || 60)); logC('授权台账', '修改到期提醒', `${o} → ${LEDGER_CFG.expiryDays} 天`); render(); }
  else if (a === 'eng') {
    const c = CLIENTS[t.dataset.c], e = t.dataset.e, next = t.checked ? [...c.engines, e] : c.engines.filter(x => x !== e);
    if (!can('config') || e === 'baidu' || e === 'local' || t.dataset.c === 'lumi') return render();
    c.engines = next; logC('客户配置', '修改数据合规', `${c.name}：${t.checked ? '启用' : '停用'} ${ENGINES[e].n}（${ENGINES[e].zone}）`); render();
  }
  else if (a === 'retain') { const c = CLIENTS[t.dataset.c]; logC('客户配置', '修改保留期', `${c.name}：${c.retain} → ${t.value} 天`); c.retain = +t.value; render(); }
  else if (a === 'urole') { const u = USERS.find(x => x.id === t.dataset.u), o = u.role; if (o === 'admin' && USERS.filter(x => x.role === 'admin').length === 1) { toast('至少保留一名系统管理员'); return render(); } u.role = t.value; if (['legal', 'admin'].includes(u.role)) u.lines = Object.keys(LINES); logC('成员', '修改角色', `${u.name}：${ROLES[o]} → ${ROLES[u.role]}`); render(); }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'q') { state.q = t.value; const p = t.selectionStart; render(); const q = $('#q'); q.focus(); q.setSelectionRange(p, p); }
  if (t.dataset.act === 'rH' || t.dataset.act === 'rM') {
    state.draft[t.dataset.act === 'rH' ? 'H' : 'M'] = +t.value;
    if (state.draft.M > state.draft.H) state.draft.M = state.draft.H;
    for (const [control, key] of [['rH', 'H'], ['rM', 'M']]) {
      const input = $(`[data-act="${control}"]`);
      input.value = state.draft[key];
      input.nextElementSibling.value = state.draft[key];
    }
  }
});
$('#modal').addEventListener('click', ev => { if (ev.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeModal(); });
for (const input of [$('#fileInput'), $('#folderInput')]) {
  input.addEventListener('change', () => {
    const entries = fileSelection(input.files); input.value = '';
    if (activeUploadZone() && entries.length) updateUploadSelection(entries);
  });
}
const fileDrag = transfer => transfer && (Array.from(transfer.types || []).includes('Files') || transfer.files?.length || Array.from(transfer.items || []).some(item => item.kind === 'file'));
const workbenchDrop = () => state.view === 'list' && $('#modal').classList.contains('hidden');
document.addEventListener('dragover', ev => {
  const zone = activeUploadZone();
  if (!can('upload') || !fileDrag(ev.dataTransfer) || !(zone || workbenchDrop())) return;
  ev.preventDefault();
  const overZone = zone?.contains(ev.target);
  zone?.classList.toggle('is-dragover', overZone && !zone.dataset.reading);
  ev.dataTransfer.dropEffect = !zone || (overZone && !zone.dataset.reading) ? 'copy' : 'none';
});
document.addEventListener('dragleave', ev => {
  const zone = activeUploadZone();
  if (zone?.contains(ev.target) && !zone.contains(ev.relatedTarget)) zone.classList.remove('is-dragover');
});
document.addEventListener('drop', async ev => {
  let zone = activeUploadZone();
  if (!can('upload') || !fileDrag(ev.dataTransfer) || !(zone || workbenchDrop())) return;
  ev.preventDefault();
  if (zone && (!zone.contains(ev.target) || zone.dataset.reading)) return;
  if (!zone) { uploadModal(); zone = activeUploadZone(); }
  zone.classList.remove('is-dragover');
  zone.dataset.reading = '1';
  pendingFiles = [];
  const buttons = [...zone.querySelectorAll('button')];
  buttons.forEach(button => { button.disabled = true; });
  $('[data-act="u-go"]').disabled = true;
  $('#u-files').textContent = '正在读取拖入的素材…';
  $('#u-err').textContent = '';
  let result;
  try { result = await droppedSelection(ev.dataTransfer, !uploadCtx); }
  catch { result = { entries: [], failed: 1 }; }
  if (activeUploadZone() !== zone) return;
  delete zone.dataset.reading;
  buttons.forEach(button => { button.disabled = false; });
  updateUploadSelection(result.entries, result.failed, result.folders);
});

function readRoute() {
  const path = location.hash.slice(1);
  if (materials.some(m => m.id === path && canSee(m))) { state.cur = path; state.view = 'detail'; }
  else if (NAV.some(n => n[0] === path && canView(path))) state.view = path;
}
window.addEventListener('hashchange', () => { if (ready) { readRoute(); render(); } });
bootstrap();
