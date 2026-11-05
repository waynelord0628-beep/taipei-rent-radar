import React, {useState} from 'react';
import {ChevronDown,ExternalLink} from 'lucide-react';
import {stationProfile,targetStations,pickupStations,transitMinutes,directions,metroReference} from './metro';

export default function Commute({item}) {
  const profile=stationProfile(item);
  const [origin,setOrigin]=useState(profile.origin || '民權西路'),[pickup,setPickup]=useState('民權西路');
  const minutes=transitMinutes(origin,pickup);
  return <details className="commute-panel"><summary><span>到接駁上車站 <small>民權西路優先</small></span><ChevronDown size={16}/></summary><p>{profile.label}</p><div className="commute-selects"><label>從哪站搭車<select aria-label="通勤起站" value={origin} onChange={e=>setOrigin(e.target.value)}>{targetStations.map(x=><option key={x.name}>{x.name}</option>)}</select></label><label>接駁上車站<select aria-label="接駁上車站" value={pickup} onChange={e=>setPickup(e.target.value)}>{pickupStations.map(x=><option key={x.name}>{x.name}</option>)}</select></label></div><strong className="commute-time">{minutes===0?'同站接駁，不需搭捷運':minutes==null?'旅程時間待確認':`${origin} → ${pickup}，北捷旅程約 ${minutes} 分鐘`}</strong><p className="hint">包含列車運行與站內轉乘步行；不含候車、房源到站及接駁車。接駁集合出口請再確認。{!item.location&&' 房源位置不足，起站是試算選擇，不能當作已確認最近車站。'}</p><div className="commute-links"><a className="secondary" href={directions(item,pickup)} target="_blank" rel="noreferrer">查到{pickup}站的步行路線<ExternalLink size={13}/></a><a href={metroReference.journeySources[origin]} target="_blank" rel="noreferrer">北捷官方資料</a></div><small className="hint">直線距離不是實際步行距離。資料查核：{metroReference.checkedAt}。</small></details>;
}
