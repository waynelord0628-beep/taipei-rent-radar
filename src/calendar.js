export function taipeiDate(value) {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || ''))return null;
  const date=new Date(value+'+08:00');
  return Number.isFinite(date.getTime())&&new Date(date.getTime()+8*3600000).toISOString().slice(0,16)===value?date:null;
}
const escapeText=value=>String(value ?? '').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const utc=value=>value.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
function fold(line) {
  const encoder=new TextEncoder();let result='',part='',length=0;
  for(const char of line) {
    const size=encoder.encode(char).length;
    if(length+size>75){result+=part+'\r\n';part=' ';length=1;}
    part+=char;length+=size;
  }
  return result+part;
}
export function calendarFile(plans,now=new Date()) {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Rent Radar//Viewing Planner//ZH-TW','CALSCALE:GREGORIAN'];
  for(const plan of plans) {
    const start=taipeiDate(plan.datetime);
    if(!start || ['不考慮','已看過'].includes(plan.status))continue;
    const duration=Number(plan.duration)||45;
    if(duration<15||duration>180)continue;
    const uid=String(plan.id).replace(/[^a-zA-Z0-9_-]/g,'');
    if(!plan.id || !uid)continue;
    lines.push('BEGIN:VEVENT',`UID:rent-radar-${uid}@local`,`DTSTAMP:${utc(now)}`,`DTSTART:${utc(start)}`,`DTEND:${utc(new Date(start.getTime()+duration*60000))}`,`SUMMARY:${escapeText('看房：'+plan.title)}`,`LOCATION:${escapeText(plan.address || '請向出租方確認地址')}`,`DESCRIPTION:${escapeText([plan.notes,plan.url,'房源狀態與會面位置請事先確認。'].filter(Boolean).join('\n'))}`);
    const reminder=Number(plan.reminderMinutes);
    if([10,30,60].includes(reminder))lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:看房提醒',`TRIGGER:-PT${reminder}M`,'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
export function downloadCalendar(plans) {
  const blob=new Blob([calendarFile(plans)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='看房行程.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function overlappingPlans(plans) {
  const scheduled=plans.map(x=>({...x,start:taipeiDate(x.datetime)})).filter(x=>x.start&&!['不考慮','已看過'].includes(x.status));
  return scheduled.flatMap((a,i)=>scheduled.slice(i+1).filter(b=>a.start.getTime()<b.start.getTime()+Number(b.duration||45)*60000&&b.start.getTime()<a.start.getTime()+Number(a.duration||45)*60000).map(b=>[a.id,b.id]));
}
