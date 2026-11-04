export const defaults = { districts: ['大同區', '中山區'], budget: 18000, kind: '獨立套房', subsidy: true, utilities: false, query: '' };
export const money = value => value == null ? '租金待確認' : Number(value).toLocaleString('zh-TW');
export const date = value => value ? new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }).format(new Date(value)) : '尚未更新';
export function assess(item, filters) {
  const no = [], pending = [];
  if (item.unavailable) no.push('已出租或下架');
  if (item.nonListing) no.push('非出租物件');
  if (filters.districts.length && !filters.districts.includes(item.district)) {
    (item.district === '待確認' ? pending : no).push('地區不符');
  }
  if (item.rent == null) pending.push('租金待確認');
  else if (item.rent > filters.budget) no.push('超出租金上限');
  if (filters.kind !== '全部房型' && item.kind !== filters.kind) {
    (item.kind === '待確認' ? pending : no).push('房型不符');
  }
  if (filters.subsidy && item.subsidy !== '可租補') {
    (item.subsidy === '不可租補' ? no : pending).push(item.subsidy === '不可租補' ? '不可租補' : '租補待確認');
  }
  if (filters.utilities && !(item.water === '台水' && item.electric === '台電')) pending.push('台水台電待確認');
  if (item.ambiguousPrice) pending.push('價格條件待確認');
  return { status: no.length ? 'excluded' : pending.length ? 'pending' : 'match', reasons: [...no, ...pending] };
}
export function sorted(items, sort) {
  return [...items].sort((a, b) => {
    const rank = x => ({match:0,pending:1,excluded:2}[x.assessment?.status] ?? 1);
    if (['station','utilities'].includes(sort) && rank(a)!==rank(b)) return rank(a)-rank(b);
    if (sort === 'station' && a.stationPriority !== b.stationPriority) return Number(b.stationPriority) - Number(a.stationPriority);
    if (['station', 'utilities'].includes(sort)) {
      const utility = x => Number(x.water === '台水' && x.electric === '台電');
      if (utility(a) !== utility(b)) return utility(b) - utility(a);
    }
    if (sort === 'rent') return (a.rent ?? Infinity) - (b.rent ?? Infinity);
    return new Date(b.firstSeen) - new Date(a.firstSeen);
  });
}
