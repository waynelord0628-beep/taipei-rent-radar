import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { money } from './data';
import { monthlyCost, costBreakdown } from './decision';
import {targetStations,primaryStations,metroReference} from './metro';

export default function MapView({ items, onOpen }) {
  const element = useRef(null), map = useRef(null), markers = useRef(null);
  useEffect(() => {
    const instance = L.map(element.current, {scrollWheelZoom:false}).setView([25.0628632,121.5197213],14);
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(instance);
    targetStations.forEach(station=>{
      const point=station.exits[0],primary=primaryStations.includes(station.name);
      L.circleMarker([point.lat,point.lng],{radius:primary?8:6,color:primary?'#a33e45':'#426587',fillColor:primary?'#a33e45':'#426587',fillOpacity:1,weight:2}).addTo(instance).bindTooltip(`${station.name}站${station.name==='大橋頭'?'（西側站界）':''}`,{permanent:primary,direction:'top',className:'station-tooltip'});
    });
    markers.current=L.layerGroup().addTo(instance);
    return () => {instance.remove();map.current=null;};
  },[]);
  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    const points=[];
    items.filter(x=>x.location).forEach(item=>{
      const {lat,lng}=item.location;points.push([lat,lng]);
      const label=document.createElement('div');label.className=`map-price ${item.assessment?.status || 'pending'}`;label.textContent=item.rent==null?'待確認':`${item.managementFee==null?'≥':''}$${money(monthlyCost(item))}`;
      const popup=document.createElement('div');popup.className='map-popup';
      const heading=document.createElement('strong');heading.textContent=item.title;
      const detail=document.createElement('p');detail.textContent=`${item.assessment?.status==='match'?'符合條件':item.assessment?.status==='pending'?'待確認':'已排除'} · ${item.district} · ${item.subsidy} · ${costBreakdown(item)} · ${item.location.label}`;
      const action=document.createElement('button');action.textContent='查看物件與照片';action.addEventListener('click',()=>onOpen(item));
      popup.append(heading,detail,action);
      L.marker([lat,lng],{title:item.title,icon:L.divIcon({className:'price-marker',html:label,iconSize:[90,32],iconAnchor:[45,16]})}).addTo(markers.current).bindPopup(popup);
    });
    if(points.length)map.current.fitBounds(L.latLngBounds([...points,[25.0628632,121.5197213]]),{padding:[45,45],maxZoom:15});
  },[items,onOpen]);
  const located=items.filter(x=>x.location).length;
  return <section className="map-shell" aria-label="房源地圖"><div className="map-caption"><strong>七站生活圈，民權西路／雙連優先</strong><span>{located}／{items.length} 筆有來源座標</span></div><div ref={element} className="map-canvas"/><p className="map-note">紅點是民權西路、雙連；藍點是其餘目標站，西側以大橋頭為站點界。標價為租金＋已知管理費，≥ 表示管理費待確認；水電與其他費用未加計。房源位置依來源提供，仍需確認門牌；直線站距不是步行距離。<a href={metroReference.coordinateSource} target="_blank" rel="noreferrer">北捷出入口資料</a>。地圖資料 © OpenStreetMap contributors。</p></section>;
}
