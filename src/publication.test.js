import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationDate,publicationLabel} from './publication.js';
test('source time uses Taipei including year',()=>{
 const text=publicationDate('2026-11-01T18:30:00Z');
 assert.match(text,/2026/);assert.match(text,/11\/02/);assert.match(text,/02:30/);
});
test('unknown publication is never relabelled first seen',()=>{
 const text=publicationLabel({firstSeen:'2026-11-01T18:30:00Z'});
 assert.match(text,/發布：原文未提供/);assert.match(text,/首次收錄/);
 assert.equal(publicationDate('bad'),null);
});
