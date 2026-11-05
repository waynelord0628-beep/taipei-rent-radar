import { assess } from './data.js';

export const fieldLabels = {district:'行政區',street:'路段',kind:'房型',rent:'租金',managementFee:'管理費',extraFee:'其他費用',water:'水費',electric:'電費',subsidy:'租補',stationText:'捷運資訊',unavailable:'出租狀態',ambiguousPrice:'價格待確認'};
const known = value => value != null && value !== '' && value !== '待確認';
const time = value => Date.parse(value) || 0;
const conflictFields = ['rent','managementFee','water','electric','subsidy','unavailable'];

export function buildHomes(listings) {
  const parents=listings.map((_,i)=>i), keys=new Map();
  const find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));
  const membersOf=root=>listings.filter((_,i)=>find(i)===root);
  const compatible=(a,b)=>['district','kind'].every(k=>!known(a[k])||!known(b[k])||a[k]===b[k]);
  listings.forEach((item,i)=>{
    for (const evidence of item.identityEvidence || []) {
      // Only the backend's explicit evidence types can merge advertisements.
      if (!['same_591_listing','same_text','same_ad_except_price'].includes(evidence.type) || !evidence.key) continue;
      const candidates=keys.get(evidence.key) || [];
      for (const prior of candidates) {
        const a=find(i),b=find(prior);
        if (a!==b && membersOf(a).every(x=>membersOf(b).every(y=>compatible(x,y)))) parents[a]=b;
      }
      keys.set(evidence.key,[...candidates,i]);
    }
  });
  const groups=new Map();
  listings.forEach((item,i)=>{const root=find(i);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(item);});
  return [...groups.values()].map(members=>{
    const oldest=[...members].sort((a,b)=>time(a.firstSeen)-time(b.firstSeen)||a.id.localeCompare(b.id));
    const primary=[...members].sort((a,b)=>time(b.lastSeen)-time(a.lastSeen)||a.id.localeCompare(b.id))[0];
    const conflicts=conflictFields.filter(k=>new Set(members.map(x=>x[k]).filter(known)).size>1);
    const evidence=[...new Set(members.flatMap(x=>(x.identityEvidence || []).map(e=>e.type)))];
    const changes=members.flatMap(x=>x.history?.events || []).filter(x=>x.type!=='baseline').map(x=>x.time).sort((a,b)=>time(b)-time(a));
    return {...primary,id:oldest[0].id,primaryId:primary.id,memberIds:members.map(x=>x.id),members,conflicts,
      firstSeen:oldest[0].firstSeen,lastSeen:primary.lastSeen,
      lastChangedAt:changes[0] || null,
      // An explicit rented signal is never hidden by a newer unmarked post.
      unavailable:members.some(x=>x.unavailable),ambiguousPrice:members.some(x=>x.ambiguousPrice),
      mergeReason:evidence.includes('same_591_listing')?'連至同一591物件':evidence.includes('same_ad_except_price')?'完整刊登內容相同，僅標示價格可不同':'相同完整貼文'};
  });
}

export function assessHome(home, filters) {
  const result=assess(home,filters);
  if (home.conflicts.length) return {status:result.status==='match'?'pending':result.status,reasons:[...result.reasons,'不同來源條件不一致，請核對原文']};
  return result;
}

export const containsId = (home, ids) => home.memberIds.some(id=>ids.includes(id));
export const historyEvents = home => home.members.flatMap(member=>(member.history?.events || []).map(event=>({...event,sourceId:member.id,sourceName:member.sourceName,url:member.url}))).sort((a,b)=>time(b.time)-time(a.time)||b.id-a.id);

export function activity(home, now=Date.now()) {
  const oldest=Math.min(...home.members.map(x=>time(x.history?.firstObservedAt)).filter(Boolean));
  for (const event of historyEvents(home)) {
    const age=now-time(event.time);
    if (age<0 || age>7*86400000 || event.type==='baseline') continue;
    if (event.type==='new') {
      if(time(event.time)>oldest) continue; // A repost is not a newly found home.
      return {kind:'new',label:'新收錄',event};
    }
    if (event.type==='interpretation') return {kind:'changed',label:'資料辨識更新',event};
    const rent=event.changes.find(x=>x.field==='rent');
    if (rent && Number.isFinite(rent.before) && Number.isFinite(rent.after) && rent.after<rent.before)
      return {kind:'price_drop',label:`${home.members.length>1?'來源':''}租金下降 $${(rent.before-rent.after).toLocaleString('zh-TW')}`,event};
    const completed=event.changes.length && event.changes.every(x=>!known(x.before)&&known(x.after));
    return {kind:'changed',label:completed?'資訊補齊':'條件更新',event};
  }
  return null;
}
