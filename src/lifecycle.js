const timestamp=value=>Date.parse(value)||0;
export function lifecycle(home,now=Date.now()) {
  const members=home.members || [home];
  const newest=Math.max(...members.flatMap(x=>[x.lastSeen,x.availability?.lastListedAt,x.availability?.lastDetailAt,x.availability?.checkedAt].map(timestamp)));
  const days=newest?Math.max(0,(now-newest)/86400000):null;
  if(home.unavailable || members.some(x=>x.unavailable || x.availability?.status==='closed'))return {state:'closed',label:'原文明列已出租／下架',days,newest};
  if(members.some(x=>x.availability?.status==='page_missing'))return {state:'page_missing',label:'原文連結待確認',days,newest};
  if(days!=null&&days>=7)return {state:'stale',label:'7天以上未確認',days,newest};
  if(days!=null&&days>=3)return {state:'aging',label:'3天以上未確認',days,newest};
  return {state:'observed',label:'可租狀態需向出租方確認',days,newest};
}
