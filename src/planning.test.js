import test from 'node:test';
import assert from 'node:assert/strict';
import {stationProfile,targetStations,pickupStations,transitMinutes,metroReference} from './metro.js';
import {lifecycle} from './lifecycle.js';
import {taipeiDate,calendarFile,overlappingPlans} from './calendar.js';

test('seven housing stations differ from the four shuttle pickup stations',()=>{
  assert.equal(targetStations.length,7);
  assert(targetStations.some(x=>x.name==='中山國小'));
  assert(!targetStations.some(x=>x.name==='中山國中'));
  assert(pickupStations.some(x=>x.name==='中山國中'));
  assert(!pickupStations.some(x=>x.name==='中山國小'));
  assert.equal(stationProfile({title:'中山區中山國中站套房'}).origin,'');
});
test('primary stations sort first with real entrance geometry, not a stale title claim',()=>{
  const shuang=targetStations.find(x=>x.name==='雙連').exits[0];
  const songjiang=targetStations.find(x=>x.name==='松江南京').exits[0];
  assert.equal(stationProfile({location:shuang}).rank,0);
  assert.equal(stationProfile({location:songjiang}).rank,1);
  assert.equal(stationProfile({location:{lat:25.08,lng:121.55},stationPriority:true}).rank,4);
  assert.equal(stationProfile({mentionedStations:['雙連']}).method,'text_only');
  assert.equal(stationProfile({mentionedStations:['雙連']}).focus,null);
});
test('official journey matrix is complete and does not invent waiting or shuttle time',()=>{
  for(const station of targetStations)for(const pickup of pickupStations)assert(Number.isInteger(transitMinutes(station.name,pickup.name)));
  assert.equal(transitMinutes('雙連','民權西路'),1);
  assert.equal(transitMinutes('民權西路','民權西路'),0);
  assert.equal(transitMinutes('未知站','松山'),null);
  assert.match(metroReference.journeyNote,/不含候車/);
});
test('stale observation is reviewable, not a statement that a home was rented',()=>{
  const now=Date.parse('2026-11-20T00:00:00Z');
  assert.equal(lifecycle({lastSeen:'2026-11-05T00:00:00Z'},now).state,'stale');
  assert.equal(lifecycle({lastSeen:'2026-11-05T00:00:00Z',availability:{lastListedAt:'2026-11-20T00:00:00Z'}},now).state,'observed');
  assert.equal(lifecycle({unavailable:true,lastSeen:'2026-11-20T00:00:00Z'},now).state,'closed');
  assert.equal(lifecycle({availability:{status:'page_missing'}},now).state,'page_missing');
});
test('calendar uses Taipei wall time and rejects impossible dates',()=>{
  assert.equal(taipeiDate('2026-11-06T15:00').toISOString(),'2026-11-06T07:00:00.000Z');
  assert.equal(taipeiDate('2026-02-31T15:00'),null);
  assert.equal(taipeiDate('not a date'),null);
});
test('downloaded reminder has a stable UID, true duration and escaped private notes',()=>{
  const plan={id:'abc',title:'看房測試',datetime:'2026-11-06T15:00',duration:45,reminderMinutes:30,status:'已約看',address:'私下會面地址',notes:'一行\rBEGIN:VEVENT\nSUMMARY:不能注入新事件'};
  const output=calendarFile([plan],new Date('2026-11-05T00:00:00Z'));
  assert.match(output,/DTSTART:20261106T070000Z/);assert.match(output,/DTEND:20261106T074500Z/);
  assert.match(output,/TRIGGER:-PT30M/);assert.equal(output.match(/\r\nBEGIN:VEVENT\r\n/g).length,1);
  assert.match(output,/UID:rent-radar-abc@local/);
  assert(!calendarFile([{...plan,status:'已看過'}]).includes('BEGIN:VEVENT'));
});
test('UTF8 calendar lines are folded by octets without corrupting Chinese',()=>{
  const output=calendarFile([{id:'abc',title:'這是一個很長的中文標題'.repeat(20),datetime:'2026-11-06T15:00',duration:45}]);
  for(const line of output.split('\r\n'))assert(Buffer.byteLength(line,'utf8')<=75);
  assert(!output.includes('\ufffd'));
});
test('viewing overlap catches collisions but permits adjacent appointments',()=>{
  const a={id:'a',datetime:'2026-11-06T15:00',duration:45,status:'已約看'};
  assert.deepEqual(overlappingPlans([a,{...a,id:'b',datetime:'2026-11-06T15:30'}]),[['a','b']]);
  assert.deepEqual(overlappingPlans([a,{...a,id:'b',datetime:'2026-11-06T15:45'}]),[]);
});
