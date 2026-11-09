import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHomes,assessHome,containsId,activity} from './homes.js';
import {defaults} from './data.js';

const base={id:'a',url:'https://rent.591.com.tw/123',sourceName:'591',district:'大同區',kind:'獨立套房',rent:17000,subsidy:'可租補',firstSeen:'2026-11-04T00:00:00Z',lastSeen:'2026-11-05T00:00:00Z'};
const evidence={type:'same_591_listing',key:'591:123'};

test('missing source page is excluded without claiming the home was rented',()=>{
  const [home]=buildHomes([{...base,availability:{status:'page_missing'},unavailable:false}]);
  assert.equal(assessHome(home,defaults).status,'excluded');
  assert.equal(home.unavailable,false);
  assert.ok(assessHome(home,defaults).reasons.includes('原文頁面失效待確認'));
});
test('cross-source evidence merges while preserving every variant and old favorite',()=>{
  const [home]=buildHomes([{...base,identityEvidence:[evidence]},{...base,id:'b',sourceName:'Facebook',url:'https://www.facebook.com/groups/demo/posts/123/',identityEvidence:[evidence],firstSeen:'2026-11-05T00:00:00Z'}]);
  assert.equal(home.members.length,2);assert.equal(home.id,'a');assert.equal(containsId(home,['b']),true);
});
test('same street and price without proof are never merged',()=>{
  assert.equal(buildHomes([base,{...base,id:'b'}]).length,2);
  assert.equal(buildHomes([{...base,identityEvidence:[evidence]},{...base,id:'b',district:'中山區',identityEvidence:[evidence]}]).length,2);
});
test('transitive evidence cannot bridge incompatible homes',()=>{
  const text={type:'same_text',key:'text:abc'};
  const homes=buildHomes([{...base,identityEvidence:[evidence]},{...base,id:'b',district:'待確認',identityEvidence:[evidence,text]},{...base,id:'c',district:'中山區',identityEvidence:[text]}]);
  assert.equal(homes.length,2);
});
test('conflicting source prices cannot remain green or synthesize mixed facts',()=>{
  const [home]=buildHomes([{...base,water:'台水',identityEvidence:[evidence]},{...base,id:'b',rent:16000,electric:'台電',lastSeen:'2026-11-05T01:00:00Z',identityEvidence:[evidence]}]);
  assert.equal(home.rent,16000);assert.equal(home.water,undefined);
  assert.equal(assessHome(home,defaults).status,'pending');
  assert.deepEqual(home.conflicts,['rent']);
});
test('rented source is not hidden in a merged green home',()=>{
  const [home]=buildHomes([{...base,identityEvidence:[evidence],unavailable:true},{...base,id:'b',identityEvidence:[evidence],unavailable:false}]);
  assert.equal(assessHome(home,defaults).status,'excluded');
});
const now=Date.parse('2026-11-05T03:00:00Z');
function withEvent(event){return buildHomes([{...base,history:{firstObservedAt:'2026-11-05T00:00:00Z',events:[{id:1,time:'2026-11-05T02:00:00Z',changes:[],...event}]}}])[0];}
test('badges distinguish observed price cuts, completion and parser changes',()=>{
  assert.equal(activity(withEvent({type:'baseline'}),now),null);
  assert.equal(activity(withEvent({type:'update',changes:[{field:'rent',before:null,after:16000}]}),now).label,'資訊補齊');
  assert.equal(activity(withEvent({type:'update',changes:[{field:'rent',before:17000,after:16000}]}),now).kind,'price_drop');
  assert.equal(activity(withEvent({type:'interpretation',changes:[{field:'rent',before:17000,after:16000}]}),now).kind,'changed');
});
test('new crosspost to an existing observed home does not trigger new-home badge',()=>{
  const [home]=buildHomes([{...base,identityEvidence:[evidence],history:{firstObservedAt:'2026-11-05T00:00:00Z',events:[]}},{...base,id:'b',identityEvidence:[evidence],history:{firstObservedAt:'2026-11-05T02:00:00Z',events:[{id:2,time:'2026-11-05T02:00:00Z',type:'new',changes:[]}]}}]);
  assert.equal(activity(home,now),null);
});
