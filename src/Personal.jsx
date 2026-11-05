import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X, Scale, Copy, Check } from 'lucide-react';
import { money, date } from './data';
import { monthlyCost, costBreakdown, questions, advantages, inquiry } from './decision';

export function Shortlist({ items, onOpen }) {
  if (!items.length) return null;
  return <section className="shortlist" aria-label="優先看房清單"><div className="shortlist-heading"><h2>先看這幾間</h2><span>依目前條件，民權西路／雙連優先</span></div><div className="shortlist-items">{items.map(item => <button key={item.id} className="shortlist-item" onClick={() => onOpen(item)}>{item.images?.length > 0 && <img src={`${import.meta.env.BASE_URL}${item.images[0]}`} alt="" loading="lazy"/>}<span><strong>{item.street || item.district} · {item.kind}</strong><b>{item.managementFee == null ? '至少 ' : ''}${money(monthlyCost(item))}<small>已知每月</small></b><em>{advantages(item).join(' · ')}</em><small>{questions(item).length ? `待確認：${questions(item).slice(0,2).join('、')}` : '可租狀態與看房時間待確認'}</small></span><ArrowUpRight size={15}/></button>)}</div><p>金額為租金＋已知管理費；水電與其他費用另確認。站名出現在原文，不代表已核實步行距離。</p></section>;
}

export function Inquiry({ item }) {
  const [copied,setCopied] = useState(false), [fallback,setFallback] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(inquiry(item)); setCopied(true); }
    catch { setFallback(true); }
  }
  return <section className="inquiry"><div><h3>看房前，先問清楚</h3><button className="secondary" onClick={copy}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? '已複製詢問文字' : '複製詢問文字'}</button></div><p>{questions(item).length ? questions(item).join(' · ') : '可租狀態 · 兩人入住 · 看房時間'}</p>{fallback && <textarea readOnly aria-label="詢問文字，可選取複製" value={inquiry(item)} rows={6}/>}<small>只產生文字，由你決定是否傳送；兩人入住須向出租方確認。</small></section>;
}

export function CompareTray({ items, onOpen, onClear }) {
  if (!items.length) return null;
  return <aside className="compare-tray" aria-label="房源比較"><span><Scale size={18}/>已選 {items.length} 間<span className="tray-hint">，最多 3 間</span></span><button className="primary" disabled={items.length < 2} onClick={onOpen}>比較房源</button><button className="text-button" onClick={onClear}>清除</button></aside>;
}

export function Compare({ items, onRemove, close }) {
  const ref=useRef(null);
  useEffect(()=>{ref.current.showModal();},[]);
  const rows=[['已知每月',x=>`${x.managementFee == null ? '至少 ' : ''}$${money(monthlyCost(x))}`],['租金／管理費',costBreakdown],['地點與房型',x=>`${x.district} ${x.street || ''} · ${x.kind}`],['租補',x=>x.subsidy],['水費',x=>x.water || '待確認'],['電費',x=>x.electric || '待確認'],['其他固定費',x=>x.extraFee || '原文未明列'],['捷運',x=>x.stationText || '原文未明列'],['待確認',x=>questions(x).join('、') || '可租狀態與看房時間'],['最近讀取',x=>date(x.lastSeen)]];
  return <dialog ref={ref} className="compare-dialog" onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="compare-heading"><div><h2>哪一間，更適合你？</h2><p>並排看費用與缺少的資訊，不用來回切換。</p></div><button className="icon-button" aria-label="關閉房源比較" onClick={close}><X size={22}/></button></div><div className="compare-scroll"><table><thead><tr><th scope="col">比較項目</th>{items.map(x=><th scope="col" key={x.id}>{x.images?.length>0&&<img src={`${import.meta.env.BASE_URL}${x.images[0]}`} alt={`${x.title}房間原圖`}/>}<strong>{x.title}</strong><button className="text-button" onClick={()=>onRemove(x.id)}>移除</button></th>)}</tr></thead><tbody>{rows.map(([label,value])=><tr key={label}><th scope="row">{label}</th>{items.map(x=><td key={x.id}>{value(x)}</td>)}</tr>)}<tr><th scope="row">原文核對</th>{items.map(x=><td key={x.id}><a className="secondary" href={x.url} target="_blank" rel="noreferrer">查看 {x.sourceName}<ArrowUpRight size={14}/></a></td>)}</tr></tbody></table></div><p className="hint">已知每月只加計明列管理費；未推算水電、租補金額或步行距離。刊登條件仍須向出租方確認。</p></dialog>;
}
