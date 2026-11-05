import React,{useState} from 'react';
import {CalendarDays,ChevronDown,ExternalLink} from 'lucide-react';
import {date} from './data';
import {taipeiDate,downloadCalendar,overlappingPlans} from './calendar';

export const planStatuses=['想看','已詢問','已約看','已看過','不考慮'];
export function loadPlans() {
  try {
    const raw=JSON.parse(localStorage.getItem('rent-radar-viewings-v1') || '{}');
    if(!raw || typeof raw!=='object' || Array.isArray(raw))return {};
    return Object.fromEntries(Object.entries(raw).filter(([id,p])=>/^[a-zA-Z0-9_-]{1,80}$/.test(id)&&p&&typeof p==='object').map(([id,p])=>[id,{...p,id,status:planStatuses.includes(p.status)?p.status:'想看',notes:String(p.notes || '').slice(0,4000),address:String(p.address || '').slice(0,300)}]));
  }catch{return {};}
}

export function ViewingEditor({home,plans,onChange}) {
  const key=home.memberIds?.find(id=>plans[id]) || home.id,existing=plans[key];
  const [draft,setDraft]=useState(()=>({status:'想看',datetime:'',duration:45,reminderMinutes:30,address:'',notes:'',...existing}));
  const [message,setMessage]=useState('');
  const change=(key,value)=>{setDraft(x=>({...x,[key]:value}));setMessage('');};
  const canExport=Boolean(taipeiDate(draft.datetime))&&Number(draft.duration)>=15&&Number(draft.duration)<=180&&!['已看過','不考慮'].includes(draft.status);
  const prepare=()=>({...draft,id:key,title:home.title,url:home.url,homeId:home.id,updatedAt:new Date().toISOString()});
  function save(event) {
    event.preventDefault();
    if((draft.datetime&&!taipeiDate(draft.datetime)) || (draft.status==='已約看'&&!draft.datetime)){setMessage('請填寫有效的看房日期時間（台北時間）。');return;}
    const ok=onChange(key,prepare());setMessage(ok?'已儲存在這個瀏覽器。':'儲存失敗，請檢查瀏覽器儲存空間。');
  }
  return <details className="viewing-editor"><summary><span>安排看房 <small>{existing?.datetime?date(taipeiDate(existing.datetime)?.toISOString()):existing?.status || '加入自己的看房清單'}</small></span><ChevronDown size={16}/></summary><form onSubmit={save}><div className="viewing-form-grid"><label>看房進度<select aria-label="看房進度" value={draft.status} onChange={e=>change('status',e.target.value)}>{planStatuses.map(x=><option key={x}>{x}</option>)}</select></label><label>日期時間（台北）<input aria-label="看房日期時間" type="datetime-local" value={draft.datetime} onChange={e=>change('datetime',e.target.value)}/></label><label>預留時間（分鐘）<input aria-label="看房預留時間" type="number" min="15" max="180" step="15" value={draft.duration} onChange={e=>change('duration',Number(e.target.value))}/></label><label>日曆提前提醒<select aria-label="看房提醒時間" value={draft.reminderMinutes} onChange={e=>change('reminderMinutes',Number(e.target.value))}><option value="10">10分鐘</option><option value="30">30分鐘</option><option value="60">1小時</option></select></label></div><label>會面地址<input aria-label="看房會面地址" maxLength="300" placeholder="填出租方確認的會面位置" value={draft.address} onChange={e=>change('address',e.target.value)}/></label><label>自己的看房筆記<textarea aria-label="看房筆記" maxLength="4000" rows="3" placeholder="採光、噪音、潮濕、兩人入住與費用問題…" value={draft.notes} onChange={e=>change('notes',e.target.value)}/></label><p className="hint">行程與筆記只存這個瀏覽器，不上傳公開網站。下載並匯入手機日曆後，才會由日曆提醒；網站不會自行傳送訊息或背景叫醒你。</p><div className="viewing-actions"><button className="primary" type="submit">儲存看房安排</button><button className="secondary" type="button" disabled={!canExport} onClick={()=>downloadCalendar([prepare()])}><CalendarDays size={15}/>下載日曆提醒</button>{existing&&<button className="text-button" type="button" onClick={()=>{if(onChange(key,null)){setDraft({status:'想看',datetime:'',duration:45,reminderMinutes:30,address:'',notes:''});setMessage('已移除這筆行程。');}}}>移除行程</button>}</div><p role="status" className="hint">{message}</p></form></details>;
}

export function ViewingBoard({plans,homes,onOpen,onChange}) {
  const entries=Object.entries(plans).map(([id,p])=>({...p,id,home:homes.find(h=>h.memberIds.includes(id))})).sort((a,b)=>(taipeiDate(a.datetime)?.getTime() || Infinity)-(taipeiDate(b.datetime)?.getTime() || Infinity));
  const upcoming=entries.filter(x=>taipeiDate(x.datetime)?.getTime()>Date.now()&&!['已看過','不考慮'].includes(x.status));
  const overlaps=overlappingPlans(upcoming);
  return <section className="viewing-board" aria-label="看房行程"><div className="list-heading"><div><h2>把值得看的房，排進生活裡。</h2><p className="hint">按已約時間排序；交通移動請另外預留。行程只存在這個瀏覽器；已匯入日曆的安排，變更或取消也需在日曆調整。</p></div><button className="secondary" disabled={!upcoming.length} onClick={()=>downloadCalendar(upcoming)}><CalendarDays size={16}/>匯出未來行程</button></div>{overlaps.length>0&&<p className="source-conflict" role="status">有 {overlaps.length} 組看房時段重疊，請調整時間。</p>}{entries.length?entries.map(plan=><article className="viewing-card" key={plan.id}><div><span className="status">{plan.status}</span><strong>{plan.datetime?date(taipeiDate(plan.datetime)?.toISOString()):'尚未約定時間'}</strong>{plan.datetime&&taipeiDate(plan.datetime)?.getTime()<Date.now()&&!['已看過','不考慮'].includes(plan.status)&&<small>日期已過，記得回填看房結果</small>}</div><h3>{plan.home?.title || plan.title}</h3><p>{plan.address || '會面地址待確認'}</p>{plan.notes&&<p className="viewing-note">{plan.notes}</p>}{plan.home?.unavailable&&<p className="source-conflict">來源已標記出租／下架，出發前先確認是否取消。</p>}<div className="viewing-actions">{plan.home&&<button className="primary" onClick={()=>onOpen(plan.home)}>查看／調整安排</button>}<a className="secondary" href={plan.url} target="_blank" rel="noreferrer">原文<ExternalLink size={13}/></a><button className="text-button" onClick={()=>onChange(plan.id,null)}>移除行程</button></div></article>):<div className="empty-state"><CalendarDays size={40}/><h2>先選一間想看的房</h2><p>點開房源，在「安排看房」儲存進度、時間與筆記。</p></div>}</section>;
}
