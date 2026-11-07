import {stationProfile} from './metro.js';
import {monthlyCost,costUncertain} from './costs.js';
export const defaults = { districts: ['大同區', '中山區'], budget: 18000, kind: '獨立套房', subsidy: true, utilities: false, taipower:true, washer:false, noRoof:true, totalBudget:true, nearby:false, query: '' };
export const money = value => value == null ? '租金待確認' : Number(value).toLocaleString('zh-TW');
export const date = value => value ? new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }).format(new Date(value)) : '尚未更新';
export function assess(item, filters) {
  const no = [], pending = [];
  if (item.unavailable) no.push('已出租或下架');
  if (item.nonListing) no.push('非出租物件');
  if (filters.districts.length && !filters.districts.includes(item.district)) {
    (item.district === '待確認' ? pending : no).push(item.district === '待確認' ? '地區待確認' : '地區不符');
  }
  if (item.rent == null) pending.push('租金待確認');
  else if (item.rent > filters.budget) no.push('超出租金上限');
  if(filters.totalBudget) {
    if(monthlyCost(item)!=null&&monthlyCost(item)>filters.budget)no.push('租金加已知固定月費超過預算');
    if(costUncertain(item))pending.push('固定月費待確認');
  }
  if(filters.washer&&item.washingMachine!=='獨立專用') {
    (['共用／投幣','未提供'].includes(item.washingMachine)?no:pending).push(item.washingMachine==='共用／投幣'?'共用／投幣洗衣機':item.washingMachine==='未提供'?'未提供獨立洗衣機':'洗衣機是否獨立專用待確認');
  }
  if(filters.noRoof&&item.rooftopAddition!=='否') {
    (item.rooftopAddition==='是'?no:pending).push(item.rooftopAddition==='是'?'頂樓加蓋':'是否頂樓加蓋待確認');
  }
  if (filters.kind !== '全部房型' && item.kind !== filters.kind) {
    (item.kind === '待確認' ? pending : no).push('房型不符');
  }
  if (filters.subsidy && item.subsidy !== '可租補') {
    (item.subsidy === '不可租補' ? no : pending).push(item.subsidy === '不可租補' ? '不可租補' : '租補待確認');
  }
  if(filters.taipower&&item.electric!=='台電') {
    pending.push(Number.isFinite(item.electricRate)?`電費每度${item.electricRate}元（扣分，非台電帳單資訊）`:item.electric&&item.electric!=='待確認'?'非台電計費（扣分）':'台電計費待確認');
  }
  if (filters.utilities && !(item.water === '台水' && item.electric === '台電')) {
    const different = (item.water && item.water !== '待確認' && item.water !== '台水') || (item.electric && item.electric !== '待確認' && item.electric !== '台電');
    (different ? no : pending).push(different ? '水電計費不符' : '台水台電待確認');
  }
  if (item.ambiguousPrice) pending.push('價格條件待確認');
  return { status: no.length ? 'excluded' : pending.length ? 'pending' : 'match', reasons: [...no, ...pending] };
}
export function sorted(items, sort) {
  return [...items].sort((a, b) => {
    const rank = x => ({match:0,pending:1,excluded:2}[x.assessment?.status] ?? 1);
    if (['station','utilities'].includes(sort) && rank(a)!==rank(b)) return rank(a)-rank(b);
    if(sort==='station') {
      const first=a.station || stationProfile(a),second=b.station || stationProfile(b);
      if(first.rank!==second.rank)return first.rank-second.rank;
      const comfort=x=>Number(x.electric==='台電')*8+Number(x.washingMachine==='獨立專用')*3+Number(x.water==='台水')*2-Number(Number.isFinite(x.electricRate))*8;
      if(comfort(a)!==comfort(b))return comfort(b)-comfort(a);
      if(first.focus&&second.focus&&first.focus.meters!==second.focus.meters)return first.focus.meters-second.focus.meters;
    }
    if (['station', 'utilities'].includes(sort)) {
      const utility = x => Number(x.water === '台水' && x.electric === '台電');
      if (utility(a) !== utility(b)) return utility(b) - utility(a);
    }
    if (sort === 'changes') return new Date(b.lastChangedAt || b.firstSeen) - new Date(a.lastChangedAt || a.firstSeen);
    if (sort === 'monthly') return (monthlyCost(a) ?? Infinity) - (monthlyCost(b) ?? Infinity);
    if (sort === 'rent') return (a.rent ?? Infinity) - (b.rent ?? Infinity);
    return new Date(b.firstSeen) - new Date(a.firstSeen);
  });
}
