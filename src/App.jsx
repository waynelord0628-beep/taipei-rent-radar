import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { RefreshCw, ChevronDown, SlidersHorizontal, ArrowUpRight, CheckCircle2, WifiOff } from 'lucide-react';
import { defaults, sorted, date } from './data';
import { Brand, Filters, EmptyHouse, ListingRow, Detail } from './components';
import { Shortlist, CompareTray, Compare } from './Personal';
import { buildHomes, assessHome, containsId, activity } from './homes';
import {stationProfile} from './metro';
import {lifecycle} from './lifecycle';
import {personalRecommendations} from './preferences';
import PushSettings from './PushSettings';
import {loadPlans,ViewingBoard} from './Viewings';

const MapView = lazy(() => import('./MapView.jsx'));

export default function App() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaults), [tab, setTab] = useState('match'), [sort, setSort] = useState('station');
  const [view,setView] = useState('list');
  const [shownStatuses,setShownStatuses] = useState({match:true,pending:true});
  const [mobileFilters, setMobileFilters] = useState(false), [selected, setSelected] = useState(null), [limit, setLimit] = useState(20);
  const [favorites, setFavorites] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('rent-radar-favorites') || '[]'); return Array.isArray(saved) ? saved : []; } catch { return []; } });
  const [comparison, setComparison] = useState(() => { try { const saved=JSON.parse(localStorage.getItem('rent-radar-compare-v1') || '[]'); return Array.isArray(saved) ? saved.filter(x=>typeof x==='string').slice(0,3) : []; } catch { return []; } });
  const [compareOpen,setCompareOpen] = useState(false);
  const [activityMode,setActivityMode] = useState('all');
  const [showStale,setShowStale] = useState(false);
  const [plans,setPlans] = useState(loadPlans);
  function changePlan(id,value) {
    const next={...plans};if(value)next[id]=value;else delete next[id];
    try{localStorage.setItem('rent-radar-viewings-v1',JSON.stringify(next));setPlans(next);return true;}catch{return false;}
  }
  async function load() {
    setLoading(true); setError('');
    try { const res = await fetch(`${import.meta.env.BASE_URL}data/listings.json?t=${Date.now()}`, { cache: 'no-store' }); if (!res.ok) throw new Error('資料暫時無法讀取'); const next = await res.json(); if (!Array.isArray(next.listings)) throw new Error('資料格式無法讀取'); setData(next); }
    catch (e) { setError(`${e.message}，請稍後重試。`); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); const timer = setInterval(load, 300000); return () => clearInterval(timer); }, []);
  useEffect(() => { try { localStorage.setItem('rent-radar-favorites', JSON.stringify(favorites)); } catch {} }, [favorites]);
  useEffect(() => { try { localStorage.setItem('rent-radar-compare-v1', JSON.stringify(comparison)); } catch {} }, [comparison]);
  useEffect(() => { setLimit(20); }, [tab, filters, sort, shownStatuses, activityMode]);
  const homes=useMemo(()=>{
    const names=new Map((data?.sources || []).map(x=>[x.id,x.name]));
    return buildHomes((data?.listings || []).map(x=>({...x,sourceLabel:names.get(x.sourceId)||x.sourceName})));
  },[data]);
  const assessed = useMemo(() => homes.map(item => ({ ...item, station:stationProfile(item), assessment: assessHome(item, filters) })), [homes, filters]);
  const toggleFavorite = id => {
    const home=assessed.find(x=>x.memberIds.includes(id));
    if(home)setFavorites(ids=>containsId(home,ids)?ids.filter(x=>!home.memberIds.includes(x)):[...ids,home.id]);
  };
  const toggleCompare = id => {
    const home=assessed.find(x=>x.memberIds.includes(id));
    if(home)setComparison(ids=>containsId(home,ids)?ids.filter(x=>!home.memberIds.includes(x)):comparisonItems.length<3?[...ids,home.id]:ids);
  };
  const counts = useMemo(() => ({match: assessed.filter(x => x.assessment.status === 'match').length, pending: assessed.filter(x => x.assessment.status === 'pending').length, all: assessed.length, favorites: assessed.filter(x => containsId(x,favorites)).length}), [assessed, favorites]);
  const visible = useMemo(() => sorted(assessed.filter(item => {
    if (tab === 'favorites') { if (!containsId(item,favorites)) return false; }
    if (tab !== 'all' && tab !== 'favorites' && !shownStatuses[item.assessment.status]) return false;
    if(tab!=='all'&&tab!=='favorites') {
      if(!showStale&&lifecycle(item).state==='stale')return false;
      if(filters.nearby&&!(item.station.distances[0]?.meters<=800))return false;
    }
    if(activityMode!=='all') {
      const change=activity(item);
      if(!change || (activityMode==='changed' ? !['changed','price_drop'].includes(change.kind) : change.kind!==activityMode))return false;
    }
    return !filters.query || `${item.title} ${item.district} ${item.street} ${item.stationText} ${item.sourceName}`.includes(filters.query.trim());
  }), sort), [assessed, tab, favorites, filters.query, sort, shownStatuses, activityMode, showStale, filters.nearby]);
  const comparisonItems=useMemo(()=>assessed.filter(x=>containsId(x,comparison)),[comparison,assessed]);
  const shortlist=useMemo(()=>personalRecommendations(visible),[visible]);
  useEffect(()=>{if(comparisonItems.length<2)setCompareOpen(false);},[comparisonItems]);
  const rows = (items, compact=false) => items.map(item => <ListingRow key={item.id} item={item} assessment={item.assessment} favorite={containsId(item,favorites)} onFavorite={toggleFavorite} onOpen={setSelected} compact={compact} compared={containsId(item,comparison)} compareDisabled={comparisonItems.length>=3&&!containsId(item,comparison)} onCompare={toggleCompare}/>);
  const selectedHome=selected && (assessed.find(x=>x.memberIds.includes(selected.id)) || selected);
  const emptyCopy = activityMode !== 'all' ? ['近7天沒有這類更新','建立基準以前的變化不會補造；你仍可查看全部已收錄物件。'] : tab === 'favorites' ? ['收藏一間，慢慢比較。','點選房源旁的愛心，就能在這裡找到它。'] : tab === 'all' ? ['沒有找到這個關鍵字','試試路名、捷運站，或清除搜尋條件。'] : tab === 'pending' ? ['暫時沒有待確認的物件','資料不足的房源會放在這裡，與符合條件的清楚分開。'] : ['目前沒有顯示的物件','開啟物件類型，或調整找房條件看看。'];
  return <><header className="site-header"><div className="header-inner"><Brand/><nav aria-label="主要導覽"><button className={!['favorites','viewings'].includes(tab) ? 'active' : ''} onClick={() => setTab('match')}>找房</button><button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}>我的收藏{counts.favorites > 0 && <span>{counts.favorites}</span>}</button><button className={tab==='viewings'?'active':''} onClick={()=>{setTab('viewings');setMobileFilters(false);}}>看房行程{Object.keys(plans).length>0&&<span>{Object.keys(plans).length}</span>}</button></nav><button className="secondary refresh" onClick={load} disabled={loading}><RefreshCw size={18} className={loading ? 'spinning' : ''}/><span>{loading ? '讀取中' : '更新資料'}</span></button></div></header>
    <main className="page"><section className="intro"><h1>找到一間，剛好適合你的房。</h1><p>大同・中山，每月固定費 18,000 元內、可租補的獨立套房。</p><div className="intro-foot"><span>民權西路、雙連優先，七站生活圈一起看。</span><span className="updated">資料更新 {date(data?.lastCollectedAt)}</span></div></section>
    <PushSettings/>{error && <div className="error-message" role="alert"><WifiOff size={18}/>{error}<button onClick={load}>重試</button></div>}
    {['paused','partial'].includes(data?.collector?.state) && <div className="error-message" role="status"><WifiOff size={18}/><span>{data.collector.message} 最近收錄 {date(data.lastCollectedAt)}</span></div>}
    <div className={`workspace ${tab==='viewings'?'viewing-mode':''}`}><Filters filters={filters} setFilters={setFilters} sources={data?.sources || []} total={data?.totalCollected || 0} lastCollectedAt={data?.lastCollectedAt} open={mobileFilters} close={() => setMobileFilters(false)}/>{mobileFilters && <button className="mobile-shade" aria-label="關閉篩選面板" onClick={() => setMobileFilters(false)}/>}
    <section className="results-area" aria-label={tab==='viewings'?'看房行程':'房源搜尋結果'}>{tab==='viewings'?<ViewingBoard plans={plans} homes={assessed} onOpen={setSelected} onChange={changePlan}/>:<>{tab==='match' && view==='list' && <Shortlist items={shortlist} onOpen={setSelected}/>}<div className="results-toolbar"><div className="status-controls" aria-label="顯示的物件類型">{[['match','符合條件'],['pending','接近／待確認']].map(([key,label])=><label key={key} className={`status-toggle ${key}`}><input type="checkbox" checked={shownStatuses[key]} onChange={e=>{setShownStatuses(v=>({...v,[key]:e.target.checked}));if(tab==='all')setTab('match');}}/>{label}<span>{counts[key]}</span></label>)}<button className="all-data-toggle" aria-pressed={tab==='all'} onClick={()=>setTab(tab==='all'?'match':'all')}>全部資料<span>{counts.all}</span></button></div><div className="view-switch" aria-label="顯示方式"><button aria-pressed={view==='list'} onClick={()=>setView('list')}>清單</button><button aria-pressed={view==='map'} onClick={()=>setView('map')}>地圖</button></div><div className="sort-select"><select aria-label="排序方式" value={sort} onChange={e=>setSort(e.target.value)}><option value="station">近站優先（民權／雙連）</option><option value="utilities">台水台電優先</option><option value="latest">最新收錄</option><option value="rent">租金低到高</option><option value="monthly">已知每月低到高</option><option value="changes">最近觀察更新</option></select><ChevronDown size={15}/></div></div>
    <div className="status-legend" aria-label="物件狀態圖例"><span><i className="legend-dot match"/>綠色：符合刊登條件</span><span><i className="legend-dot pending"/>黃色：接近條件或資訊待確認</span>{tab==='all'&&<span><i className="legend-dot excluded"/>灰色：已知不符合</span>}<small>待確認物件會標示需要核對的資訊；開關同時套用清單與地圖。</small></div>
    <div className="activity-toolbar"><label className="stale-control"><input type="checkbox" checked={showStale} onChange={e=>setShowStale(e.target.checked)}/>包含7天未確認</label><span>{data?.listings?.length || 0} 則刊登 · 合併後 {homes.length} 組{data?.historyTrackingStartedAt && <small>觀察紀錄自 {date(data.historyTrackingStartedAt)}</small>}</span><label>房源動態<select aria-label="房源動態" value={activityMode} onChange={e=>setActivityMode(e.target.value)}><option value="all">全部動態</option><option value="new">近7天新收錄</option><option value="price_drop">近7天租金下降</option><option value="changed">近7天條件更新</option></select></label></div>
    <button className="secondary mobile-filter-button" onClick={()=>setMobileFilters(true)}><SlidersHorizontal size={17}/>調整找房條件</button>
    {tab==='favorites'&&<p className="hint">收藏會保留已不符合或已出租的物件，讓你看見狀態變化。</p>}<div className="result-content" aria-live="polite">{view==='map' ? <Suspense fallback={<div className="loading-state">正在載入地圖</div>}><MapView items={visible} onOpen={setSelected}/></Suspense> : loading && !data ? <div className="loading-state"><RefreshCw className="spinning" size={28}/><h2>正在讀取你的找房清單</h2></div> : visible.length ? <><div className="list-heading"><h2>{tab==='favorites'?'我的收藏':tab==='match'?'為你篩選的房源':tab==='pending'?'這些資訊還需要確認':'已收錄的房源'}</h2><span>{visible.length} 筆</span></div><div className="listing-list">{rows(visible.slice(0,limit))}</div>{limit<visible.length&&<button className="secondary load-more" onClick={()=>setLimit(n=>n+20)}>再看 20 筆</button>}</> : <div className="empty-state"><EmptyHouse/><h2>{emptyCopy[0]}</h2><p>{emptyCopy[1]}</p><button className="primary" onClick={()=>{setTab('all');setActivityMode('all');setFilters(f=>({...f,query:''}));}}>查看全部資料</button></div>}</div>
    <div className="priorities"><strong>你的優先條件</strong><span>民權西路／雙連優先 · 台電必要 · 台水／獨洗加分 · 非頂加 · 可租補</span></div>
    {tab==='match' && assessed.length>0 && <section className="recent"><div className="recent-heading"><div><h2>最近收錄</h2><span>已依你的條件篩選</span></div><button className="text-button" onClick={()=>setTab('all')}>查看全部<ArrowUpRight size={16}/></button></div><div className="listing-list">{rows(sorted(visible,'latest').slice(0,3),true)}</div></section>}
    <p className="data-note"><CheckCircle2 size={14}/>{data?.totalCollected || 0} 篇已讀取 · 摘要依原文整理，站距另以來源位置與北捷出入口座標估算，非步行距離。</p></>}</section></div>
    <footer><span>物件狀態、租補資格與費用請以原文及出租方確認。</span><span>住這裡 · 專心找到適合你的房</span></footer></main>
    <CompareTray items={comparisonItems} onOpen={()=>setCompareOpen(true)} onClear={()=>setComparison([])}/>{compareOpen&&<Compare items={comparisonItems} onRemove={toggleCompare} close={()=>setCompareOpen(false)}/>}
    {selectedHome&&<Detail key={selectedHome.id} item={selectedHome} assessment={assessHome(selectedHome,filters)} favorite={containsId(selectedHome,favorites)} onFavorite={toggleFavorite} plans={plans} onPlanChange={changePlan} close={()=>setSelected(null)}/>}
  </>;
}
