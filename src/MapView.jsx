import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { money } from './data';

export default function MapView({ items, onOpen }) {
  const element = useRef(null), map = useRef(null), markers = useRef(null);
  useEffect(() => {
    const instance = L.map(element.current, {scrollWheelZoom:false}).setView([25.0628632,121.5197213],14);
    map.current = instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(instance);
    L.circleMarker([25.0628632,121.5197213], {radius:8,color:'#a33e45',fillColor:'#a33e45',fillOpacity:1,weight:2}).addTo(instance).bindTooltip('民權西路站', {permanent:true,direction:'top',className:'station-tooltip'});
    markers.current=L.layerGroup().addTo(instance);
    return () => {instance.remove();map.current=null;};
  },[]);
  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    const points=[];
    items.filter(x=>x.location).forEach(item=>{
      const {lat,lng}=item.location;points.push([lat,lng]);
      const label=document.createElement('div');label.className='map-price';label.textContent=item.rent==null?'待確認':`$${money(item.rent)}`;
      const popup=document.createElement('div');popup.className='map-popup';
      const heading=document.createElement('strong');heading.textContent=item.title;
      const detail=document.createElement('p');detail.textContent=`${item.district} · ${item.subsidy} · ${item.location.label}`;
      const action=document.createElement('button');action.textContent='查看物件與照片';action.addEventListener('click',()=>onOpen(item));
      popup.append(heading,detail,action);
      L.marker([lat,lng],{title:item.title,icon:L.divIcon({className:'price-marker',html:label,iconSize:[90,32],iconAnchor:[45,16]})}).addTo(markers.current).bindPopup(popup);
    });
    if(points.length)map.current.fitBounds(L.latLngBounds([...points,[25.0628632,121.5197213]]),{padding:[45,45],maxZoom:15});
  },[items,onOpen]);
  const located=items.filter(x=>x.location).length;
  return <section className="map-shell" aria-label="房源地圖"><div className="map-caption"><strong>在地圖上找房</strong><span>{located}／{items.length} 筆有來源座標</span></div><div ref={element} className="map-canvas"/><p className="map-note">紅點是民權西路站。房源位置依來源提供，仍需確認門牌；無座標物件保留在清單。地圖資料 © OpenStreetMap contributors。</p></section>;
}
