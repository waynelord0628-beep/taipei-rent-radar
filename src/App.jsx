import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { RefreshCw, ChevronDown, SlidersHorizontal, ArrowUpRight, CheckCircle2, WifiOff } from 'lucide-react';
import { defaults, assess, sorted, date } from './data';
import { Brand, Filters, EmptyHouse, ListingRow, Detail } from './components';

const MapView = lazy(() => import('./MapView.jsx'));

export default function App() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaults), [tab, setTab] = useState('match'), [sort, setSort] = useState('station');
  const [view,setView] = useState('list');
  const [mobileFilters, setMobileFilters] = useState(false), [selected, setSelected] = useState(null), [limit, setLimit] = useState(20);
  const [favorites, setFavorites] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('rent-radar-favorites') || '[]'); return Array.isArray(saved) ? saved : []; } catch { return []; } });
  async function load() {
    setLoading(true); setError('');
    try { const res = await fetch(`${import.meta.env.BASE_URL}data/listings.json?t=${Date.now()}`, { cache: 'no-store' }); if (!res.ok) throw new Error('資料暫時無法讀取'); const next = await res.json(); if (!Array.isArray(next.listings)) throw new Error('資料格式無法讀取'); setData(next); }
    catch (e) { setError(`${e.message}，請稍後重試。`); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); const timer = setInterval(load, 300000); return () => clearInterval(timer); }, []);
  useEffect(() => { try { localStorage.setItem('rent-radar-favorites', JSON.stringify(favorites)); } catch {} }, [favorites]);
  useEffect(() => { setLimit(20); }, [tab, filters, sort]);
  const toggleFavorite = id => setFavorites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  const assessed = useMemo(() => (data?.listings || []).map(item => ({ ...item, assessment: assess(item, filters) })), [data, filters]);
  const counts = useMemo(() => ({match: assessed.filter(x => x.assessment.status === 'match').length, pending: assessed.filter(x => x.assessment.status === 'pending').length, all: assessed.length, favorites: assessed.filter(x => favorites.includes(x.id)).length}), [assessed, favorites]);
  const visible = useMemo(() => sorted(assessed.filter(item => {
    if (tab === 'favorites') { if (!favorites.includes(item.id)) return false; }
    else if (tab !== 'all' && item.assessment.status !== tab) return false;
    return !filters.query || `${item.title} ${item.district} ${item.street} ${item.stationText} ${item.sourceName}`.includes(filters.query.trim());
  }), sort), [assessed, tab, favorites, filters.query, sort]);
  const rows = (items, compact=false) => items.map(item => <ListingRow key={item.id} item={item} assessment={item.assessment} favorite={favorites.includes(item.id)} onFavorite={toggleFavorite} onOpen={setSelected} compact={compact}/>);
  const emptyCopy = tab === 'favorites' ? ['收藏一間，慢慢比較。','點選房源旁的愛心，就能在這裡找到它。'] : tab === 'all' ? ['沒有找到這個關鍵字','試試路名、捷運站，或清除搜尋條件。'] : tab === 'pending' ? ['暫時沒有待確認的物件','資料不足的房源會放在這裡，與符合條件的清楚分開。'] : ['還沒有完全符合的物件','新房源會持續更新，先替你把不適合的篩掉。'];
  return <><header className="site-header"><div className="header-inner"><Brand/><nav aria-label="主要導覽"><button className={tab !== 'favorites' ? 'active' : ''} onClick={() => setTab('match')}>找房</button><button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}>我的收藏{favorites.length > 0 && <span>{favorites.length}</span>}</button></nav><button className="secondary refresh" onClick={load} disabled={loading}><RefreshCw size={18} className={loading ? 'spinning' : ''}/><span>{loading ? '讀取中' : '更新資料'}</span></button></div></header>
    <main className="page"><section className="intro"><h1>找到一間，剛好適合你的房。</h1><p>大同・中山，月租 18,000 元內、可租補的獨立套房。</p><div className="intro-foot"><span>民權西路站附近優先，台水台電更好。</span><span className="updated">資料更新 {date(data?.generatedAt)}</span></div></section>
    {error && <div className="error-message" role="alert"><WifiOff size={18}/>{error}<button onClick={load}>重試</button></div>}
    {data?.collector?.state === 'paused' && <div className="error-message" role="status"><WifiOff size={18}/><span>{data.collector.message} 最近收錄 {date(data.lastCollectedAt)}</span></div>}
    <div className="workspace"><Filters filters={filters} setFilters={setFilters} sources={data?.sources || []} total={data?.totalCollected || 0} lastCollectedAt={data?.lastCollectedAt} open={mobileFilters} close={() => setMobileFilters(false)}/>{mobileFilters && <button className="mobile-shade" aria-label="關閉篩選面板" onClick={() => setMobileFilters(false)}/>}
    <section className="results-area" aria-label="房源搜尋結果"><div className="results-toolbar"><div className="result-tabs" role="tablist" aria-label="物件狀態">{[['match','符合條件'],['pending','待確認'],['all','全部資料']].map(([key,label])=><button key={key} role="tab" aria-selected={tab===key} className={tab===key?'selected':''} onClick={()=>setTab(key)}>{label}<span>{counts[key]}</span></button>)}</div><div className="view-switch" aria-label="顯示方式"><button aria-pressed={view==='list'} onClick={()=>setView('list')}>清單</button><button aria-pressed={view==='map'} onClick={()=>setView('map')}>地圖</button></div><div className="sort-select"><select aria-label="排序方式" value={sort} onChange={e=>setSort(e.target.value)}><option value="station">民權西路站優先</option><option value="utilities">台水台電優先</option><option value="latest">最新收錄</option><option value="rent">租金低到高</option></select><ChevronDown size={15}/></div></div>
    <button className="secondary mobile-filter-button" onClick={()=>setMobileFilters(true)}><SlidersHorizontal size={17}/>調整找房條件</button>
    <div className="result-content" aria-live="polite">{view==='map' ? <Suspense fallback={<div className="loading-state">正在載入地圖</div>}><MapView items={visible} onOpen={setSelected}/></Suspense> : loading && !data ? <div className="loading-state"><RefreshCw className="spinning" size={28}/><h2>正在讀取你的找房清單</h2></div> : visible.length ? <><div className="list-heading"><h2>{tab==='favorites'?'我的收藏':tab==='match'?'為你篩選的房源':tab==='pending'?'這些資訊還需要確認':'已收錄的房源'}</h2><span>{visible.length} 筆</span></div><div className="listing-list">{rows(visible.slice(0,limit))}</div>{limit<visible.length&&<button className="secondary load-more" onClick={()=>setLimit(n=>n+20)}>再看 20 筆</button>}</> : <div className="empty-state"><EmptyHouse/><h2>{emptyCopy[0]}</h2><p>{emptyCopy[1]}</p><button className="primary" onClick={()=>{setTab('all');setFilters(f=>({...f,query:''}));}}>查看全部資料</button></div>}</div>
    <div className="priorities"><strong>你的優先條件</strong><span>民權西路站 · 大同／中山 · 獨立套房 · 可租補 · 台水台電優先</span></div>
    {tab==='match' && assessed.length>0 && <section className="recent"><div className="recent-heading"><div><h2>最近收錄</h2><span>已依你的條件篩選</span></div><button className="text-button" onClick={()=>setTab('all')}>查看全部<ArrowUpRight size={16}/></button></div><div className="listing-list">{rows(sorted(assessed,'latest').slice(0,3),true)}</div></section>}
    <p className="data-note"><CheckCircle2 size={14}/>{data?.totalCollected || 0} 篇已讀取 · 摘要依原文整理，距離僅採用來源明列資訊。</p></section></div>
    <footer><span>物件狀態、租補資格與費用請以原文及出租方確認。</span><span>住這裡 · 專心找到適合你的房</span></footer></main>
    {selected&&<Detail key={selected.id} item={selected} assessment={assess(selected,filters)} favorite={favorites.includes(selected.id)} onFavorite={toggleFavorite} close={()=>setSelected(null)}/>}
  </>;
}
