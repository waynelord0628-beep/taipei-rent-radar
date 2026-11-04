import React, { useEffect, useRef, useState } from 'react';
import { Heart, Search, X, ExternalLink, ChevronDown, MapPin, TrainFront, Check, Home, SlidersHorizontal } from 'lucide-react';
import { money, date } from './data';
import { monthlyCost, costBreakdown, questions } from './decision';
import { Inquiry } from './Personal';

export function Brand() {
  return <a className="brand" href="#" aria-label="住這裡首頁"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 21 24 4l20 17M8 19v25h32V19"/><path d="M24 17a7 7 0 0 0-7 7c0 5 7 12 7 12s7-7 7-12a7 7 0 0 0-7-7Z"/><circle cx="24" cy="24" r="1.4"/></svg><span>住這裡<small>RENT RADAR</small></span></a>;
}
export function EmptyHouse() {
  return <svg className="empty-house" viewBox="0 0 250 130" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 116h226M66 58l27-29h72l28 29H66Zm8 0v58h110V58M107 116V78h29v38M151 74h20v23h-20V74Zm10 0v23"/><path fill="#edf4ef" d="M19 115c-9-14 0-23 10-20-2-16 18-23 24-10 9-5 19 5 13 15 10-1 14 8 11 15H19Zm174 0c-6-12 2-20 10-17-2-14 16-18 21-7 11-2 17 13 9 24h-40Z"/><path d="m181 10 6-12m8 24 12-10m-1 27 14-4"/></g></svg>;
}
export function Filters({ filters, setFilters, sources, total, lastCollectedAt, open, close }) {
  const change = (key, value) => setFilters(f => ({ ...f, [key]: value }));
  return <aside className={`filters ${open ? 'mobile-open' : ''}`} aria-label="找房條件">
    <div className="filter-title"><h2>找房條件</h2><button className="text-button" onClick={() => setFilters({ districts: ['大同區', '中山區'], budget: 18000, kind: '獨立套房', subsidy: true, utilities: false, query: '' })}>重設</button><button className="icon-button mobile-close" onClick={close} aria-label="關閉篩選"><X size={20}/></button></div>
    <fieldset><legend>地點 <span>（可複選）</span></legend>{['大同區', '中山區'].map(d => <label className="check-row" key={d}><input type="checkbox" checked={filters.districts.includes(d)} onChange={e => change('districts', e.target.checked ? [...filters.districts, d] : filters.districts.filter(x => x !== d))}/>{d}</label>)}</fieldset>
    <fieldset><legend className="rent-label">租金上限 <strong>{money(filters.budget)} 元</strong></legend><input aria-label="租金上限" type="range" min="7000" max="30000" step="500" value={filters.budget} onChange={e => change('budget', Number(e.target.value))}/><div className="range-labels"><span>7,000 元</span><span>30,000 元</span></div></fieldset>
    <fieldset><legend>房型</legend><div className="select-wrap"><select aria-label="房型" value={filters.kind} onChange={e => change('kind', e.target.value)}><option>獨立套房</option><option>全部房型</option></select><ChevronDown size={16}/></div></fieldset>
    <fieldset className="checks"><label className="check-row"><input type="checkbox" checked={filters.subsidy} onChange={e => change('subsidy', e.target.checked)}/>可申請租屋補助</label><label className="check-row"><input type="checkbox" checked={filters.utilities} onChange={e => change('utilities', e.target.checked)}/>只看台水台電</label><p className="hint">預設優先民權西路站、台水台電。</p></fieldset>
    <fieldset><legend>關鍵字搜尋</legend><div className="search-input"><Search size={18}/><input aria-label="關鍵字搜尋" placeholder="搜尋路名、捷運站" value={filters.query} onChange={e => change('query', e.target.value)}/></div></fieldset>
    <details className="source-details"><summary>資料來源 <ChevronDown size={16}/></summary><p className="hint">已讀取 {total} 篇，僅整理房源摘要。</p>{sources.map(s => <a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.name}<ExternalLink size={12}/></a>)}<p className="hint">最近收錄：{date(lastCollectedAt)}</p></details>
    <button className="primary mobile-apply" onClick={close}>查看結果</button>
  </aside>;
}
export function ListingRow({ item, assessment, favorite, onFavorite, onOpen, compact = false, compared, compareDisabled, onCompare }) {
  const status = { match: '符合條件', pending: '待確認', excluded: '已排除' }[assessment.status];
  return <article className={`listing-row status-${assessment.status} ${compact ? 'compact' : ''}`}>
    <div className={`status ${assessment.status}`}>{status}</div>
    {item.images?.length > 0 && <button className="listing-photo" onClick={() => onOpen(item)} aria-label={`查看${item.title}的照片`}><img src={`${import.meta.env.BASE_URL}${item.images[0]}`} alt={`${item.title}的房間原圖`} loading="lazy"/><span>{item.images.length} 張</span></button>}
    <button className="listing-main" onClick={() => onOpen(item)}><h3>{item.title}</h3><p>{item.district} · {item.kind}{item.stationPriority && <span className="station-note"> · 民權西路站</span>}</p><div className="row-tags"><span>{item.subsidy}</span>{item.water === '台水' && item.electric === '台電' && <span>台水台電</span>}<span>{item.sourceName}</span></div></button>
    <div className="listing-price"><strong>{item.rent == null ? '待確認' : `${item.managementFee == null ? '至少 ' : ''}$${money(monthlyCost(item))}`}</strong><span>已知每月</span><small>{costBreakdown(item)}</small></div>
    <div className="listing-meta"><span>{item.electric === '待確認' ? '水電資訊待確認' : `電費：${item.electric}`}</span><span className="question-note">{assessment.reasons[0] || (questions(item).length ? `待確認：${questions(item).slice(0,2).join('、')}` : '可租狀態待確認')}</span></div>
    <button className={`icon-button favorite ${favorite ? 'selected' : ''}`} aria-label={favorite ? '取消收藏' : '收藏物件'} aria-pressed={favorite} onClick={() => onFavorite(item.id)}><Heart size={22} fill={favorite ? 'currentColor' : 'none'}/></button>
    {onCompare && <label className="compare-pick"><input type="checkbox" aria-label={`比較 ${item.title}`} checked={compared} disabled={compareDisabled} onChange={()=>onCompare(item.id)}/>比較</label>}
  </article>;
}
export function Detail({ item, assessment, favorite, onFavorite, close }) {
  const ref = useRef(null);
  const [photo, setPhoto] = useState(0);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="detail-dialog" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }}><div className="detail-content"><div className="dialog-heading"><span className={`status ${assessment.status}`}>{{match:'符合條件',pending:'待確認',excluded:'已排除'}[assessment.status]}</span><button onClick={close} className="icon-button" aria-label="關閉物件詳情"><X size={22}/></button></div><h2>{item.title}</h2><p className="detail-location"><MapPin size={17}/>{item.district}{item.street ? ` · ${item.street}` : ''}</p>{item.images?.length>0 ? <section className="photo-gallery" aria-label="房間照片"><img className="gallery-main" src={`${import.meta.env.BASE_URL}${item.images[photo]}`} alt={`${item.title}的第 ${photo+1} 張房間原圖`}/><div className="gallery-thumbs">{item.images.map((src,i)=><button key={src} className={photo===i?'selected':''} onClick={()=>setPhoto(i)} aria-label={`查看第 ${i+1} 張照片`} aria-pressed={photo===i}><img src={`${import.meta.env.BASE_URL}${src}`} alt="" loading="lazy"/></button>)}</div><p className="hint">照片來自此房源原文，保留來源浮水印。</p></section> : <p className="no-photo">尚未取得此物件照片，可前往原文查看。</p>}<div className="detail-price">{item.rent == null ? '租金待確認' : `NT$${money(item.rent)}`}<small>／月</small></div><dl>{[['房型',item.kind],['租屋補助',item.subsidy],['管理費',item.managementFee == null ? '待確認' : item.managementFee === 0 ? '已含／免管理費' : `${money(item.managementFee)} 元／月`],['水費',item.water],['電費',item.electric],['其他固定費',item.extraFee || '貼文未明列，需向出租方確認'],['捷運資訊',item.stationText || '未明列，尚未推算距離'],['資料來源',item.sourceName],['首次收錄',date(item.firstSeen)],['最近讀取',date(item.lastSeen)]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>{assessment.reasons.length > 0 && <div className="detail-reasons"><strong>需要留意</strong><p>{assessment.reasons.join('；')}</p></div>}<p className="hint">這是貼文摘要，並非屋況或可租狀態保證。請回原文核對租補資格、水電計費、費用與是否仍可看房。</p><Inquiry item={item}/><div className="dialog-actions"><button className="secondary" onClick={() => onFavorite(item.id)}><Heart size={17}/>{favorite ? '已收藏' : '收藏物件'}</button><a className="primary" href={item.url} target="_blank" rel="noreferrer">查看{item.sourceName === '591' ? ' 591 ' : ' FB '}原文<ExternalLink size={16}/></a></div></div></dialog>;
}
