import React from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { date, money } from './data';
import { fieldLabels, historyEvents, activity } from './homes';

export function ActivityBadge({home}) {
  const current=activity(home);
  return current ? <span className={`activity-badge ${current.kind}`}>{current.label}</span> : null;
}

export function factValue(field, value) {
  if (value == null || value==='') return '待確認／未明列';
  if (field==='unavailable') return value?'原文明列已出租':'未見已出租標示';
  if (field==='ambiguousPrice') return value?'價格需核對':'未見價格歧義';
  return typeof value==='number'?`${money(value)} 元／月`:String(value);
}

export function SourceHistory({home,selectedSourceId,onSelect}) {
  const members=home.members || [home];
  const events=historyEvents({...home,members});
  const total=members.reduce((sum,x)=>sum+(x.history?.totalEvents || 0),0);
  return <><section className="listing-sources" aria-label="所有刊登來源"><h3>{members.length>1?`${members.length} 則刊登已合併`:'刊登來源'}</h3>{members.length>1&&<p className="hint">合併依據：{home.mergeReason}。這是刊登去重，屋況與可租狀態仍須核對。摘要不混用各來源欄位。</p>}{home.conflicts?.length>0&&<p className="source-conflict">來源的{home.conflicts.map(k=>fieldLabels[k]).join('、')}不一致，已列為待確認或排除，請逐則核對。</p>}<div className="source-options">{members.map(member=><article key={member.id} className={member.id===selectedSourceId?'selected':''}><div><strong>{member.sourceLabel || member.sourceName}</strong><a href={member.url} target="_blank" rel="noreferrer">原文<ExternalLink size={13}/></a></div><p>{member.rent==null?'租金待確認':`租金 $${money(member.rent)}`} · {member.subsidy}</p><small>最近讀取 {date(member.lastSeen)} · {member.images?.length || 0} 張來源照片</small>{members.length>1&&<button className="text-button" aria-pressed={member.id===selectedSourceId} onClick={()=>onSelect(member.id)}>{member.id===selectedSourceId?'正在顯示這則資料':'查看這則資料與照片'}</button>}</article>)}</div></section>
  <details className="history-panel"><summary><span>變動紀錄 <small>{total} 筆觀察紀錄</small></span><ChevronDown size={16}/></summary><p className="hint">從 {date(members.find(x=>x.history)?.history.trackingStartedAt)} 開始記錄。未抓到貼文不代表已出租；資料辨識更新與租金變動分開標示。</p>{events.length?<ol>{events.slice(0,20).map(event=><li key={`${event.sourceId}-${event.id}`}><div><strong>{{baseline:'建立基準（既有資料）',new:'新收錄',update:'觀察到條件更新',interpretation:'資料辨識更新'}[event.type] || '資料更新'}</strong><time>{date(event.time)}</time></div><small>{members.find(x=>x.id===event.sourceId)?.sourceLabel || event.sourceName}</small>{event.initial&&<p>起始租金：{factValue('rent',event.initial.rent)}；管理費：{factValue('managementFee',event.initial.managementFee)}</p>}{event.changes.length>0&&<ul>{event.changes.map(change=><li key={change.field}>{fieldLabels[change.field] || change.field}：<span>{factValue(change.field,change.before)}</span><b aria-label="變更為"> → </b><span>{factValue(change.field,change.after)}</span></li>)}</ul>}</li>)}</ol>:<p className="hint">尚未建立追蹤基準，之後會顯示實際觀察到的變化。</p>}{total>20&&<p className="hint">此處顯示最近20筆；完整紀錄保留在雲端。</p>}</details></>;
}
