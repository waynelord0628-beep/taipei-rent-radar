const formatter=new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Taipei'});
export const publicationDate=value=>value&&Number.isFinite(Date.parse(value))?formatter.format(new Date(value)):null;
export function publicationLabel(item) {
  const published=publicationDate(item.publishedAt);
  if(published)return `發布：${published}`;
  const first=publicationDate(item.firstSeen);
  return `發布：原文未提供${first?` · 首次收錄：${first}`:''}`;
}
