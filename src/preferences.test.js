import test from 'node:test';
import assert from 'node:assert/strict';
import {personalRecommendations} from './preferences.js';
test('only explicit positive feedback becomes personal recommendations; other homes stay untouched',()=>{
  const home=(id,status='match')=>({id,memberIds:[id],assessment:{status}});
  const all=[home('unknown'),home('3781e4b8f4a55659'),home('f5e24a1efecc84cd','pending')];
  assert.deepEqual(personalRecommendations(all).map(x=>x.id),['f5e24a1efecc84cd','3781e4b8f4a55659']);
  assert.equal(all.length,3);
  assert.equal(personalRecommendations([home('f5e24a1efecc84cd','excluded')]).length,0);
});
