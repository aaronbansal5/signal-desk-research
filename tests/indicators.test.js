import test from 'node:test';import assert from 'node:assert/strict';import {calculateTechnicals,returns} from '../src/server/indicators.js';
const rows=Array.from({length:260},(_,i)=>({date:`2026-01-${String(i+1).padStart(2,'0')}`,open:100+i,high:102+i,low:98+i,close:100+i,volume:1000+i}));
test('calculates complete technical set without null-to-zero coercion',()=>{const t=calculateTechnicals(rows);assert.equal(t.sma20,349.5);assert.equal(t.sma200,259.5);assert.equal(t.rsi14,100);assert.ok(t.realizedVolatility>=0);assert.ok(t.atr14>0)});
test('calculates period return',()=>assert.equal(Math.round(returns(rows,5)*100)/100,1.41));
