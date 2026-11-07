import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyCost, questions, costBreakdown } from './decision.js';
import { assess, defaults, sorted } from './data.js';

test('monthly subtotal adds management once and never guesses extra fees',()=>{
  assert.equal(monthlyCost({rent:13500,managementFee:500,extraFee:'同一筆500元'}),14000);
  assert.equal(monthlyCost({rent:16500,managementFee:0}),16500);
  assert.equal(monthlyCost({rent:12000,managementFee:null}),12000);
  assert.equal(monthlyCost({rent:null}),null);
  assert.equal(costBreakdown({rent:null}),'租金待確認');
  assert.match(costBreakdown({rent:12000,managementFee:null}),/管理費待確認/);
});
test('station mention alone never becomes verified distance',()=>{
  const item={subsidy:'可租補',managementFee:0,water:'台水',electric:'台電',stationPriority:true,washingMachine:'獨立專用',rooftopAddition:'否'};
  assert.deepEqual(questions({...item,stationText:'原文明列民權西路站，距離待確認'}),['民權西路站實際距離']);
  assert.deepEqual(questions({...item,stationText:'原文明列距民權西路 300 公尺'}),[]);
});
test('strict utilities distinguishes unknown from a known different tariff',()=>{
  const item={district:'大同區',kind:'獨立套房',rent:16000,managementFee:0,fixedFeesStatus:'已知費用可計算',rooftopAddition:'否',subsidy:'可租補',water:'台水'};
  const filters={...defaults,utilities:true};
  assert.equal(assess({...item,electric:'每度5元'},filters).status,'excluded');
  assert.equal(assess({...item,electric:'待確認'},filters).status,'pending');
  assert.equal(assess({...item,electric:'台電'},filters).status,'match');
});
test('monthly sorting includes disclosed management',()=>{
  assert.deepEqual(sorted([{id:'a',rent:12000,managementFee:2000},{id:'b',rent:13000,managementFee:0}],'monthly').map(x=>x.id),['b','a']);
});
