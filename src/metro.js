import reference from './metro-data.js';

export const targetStations=reference.stations.filter(x=>x.target);
export const pickupStations=reference.stations.filter(x=>x.pickup);
export const primaryStations=['民權西路','雙連'];
export const metroReference=reference;

export function metersBetween(a,b) {
  const rad=n=>n*Math.PI/180;
  const dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

export function stationProfile(item) {
  const point=item.location;
  const valid=point && Number.isFinite(point.lat)&&Number.isFinite(point.lng)&&point.lat>24.9&&point.lat<25.3&&point.lng>121.3&&point.lng<121.8;
  const mentions=[...(item.mentionedStations || targetStations.map(x=>x.name).filter(name=>new RegExp(`${name}(?:捷運)?站|${name}捷運|捷運\\s*${name}(?!國小|國中)|距${name}\\s*\\d+公尺`).test(`${item.title || ''} ${item.stationText || ''}`)))];
  if(!mentions.length&&item.stationPriority)mentions.push('民權西路');
  if(valid) {
    const distances=targetStations.map(station=>({...station,meters:Math.min(...station.exits.map(exit=>metersBetween(point,exit)))})).sort((a,b)=>a.meters-b.meters);
    const preferred=distances.filter(x=>primaryStations.includes(x.name)).sort((a,b)=>a.meters-b.meters)[0];
    const focus=preferred.meters<=800?preferred:distances[0];
    return {rank:preferred.meters<=800?0:focus.meters<=800?1:4,focus,distances,origin:focus.name,
      label:`${focus.name}站 · 出入口直線約 ${Math.round(focus.meters/25)*25} 公尺`,method:'source_coordinates'};
  }
  const focus=primaryStations.find(x=>mentions.includes(x)) || mentions.find(x=>targetStations.some(s=>s.name===x));
  return {rank:focus?(primaryStations.includes(focus)?2:3):5,origin:focus || '',focus:null,distances:[],
    label:focus?`原文提及${focus}站，距離待確認`:'尚無足夠資訊判斷站距',method:'text_only'};
}

export function transitMinutes(origin,pickup) {return reference.journeys[origin]?.[pickup] ?? null;}
export function directions(item,pickup,mode='walking') {
  const params=new URLSearchParams({api:'1',destination:`台北捷運${pickup}站`,travelmode:mode});
  if(item.location)params.set('origin',`${item.location.lat},${item.location.lng}`);
  return `https://www.google.com/maps/dir/?${params}`;
}
