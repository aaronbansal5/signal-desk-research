import test from 'node:test';import assert from 'node:assert/strict';import {classify} from '../src/server/classifier.js';import {normalizeTicker} from '../src/server/research.js';
test('classifies AAPL as company',()=>assert.equal(classify('AAPL',{Symbol:'AAPL',AssetType:'Common Stock'}).type,'COMMON_STOCK'));
test('classifies standard ETF',()=>assert.equal(classify('SPY',{Name:'SPDR S&P 500 ETF Trust'}).type,'EQUITY_ETF'));
test('classifies CHAT override',()=>assert.equal(classify('CHAT',{}).type,'ACTIVELY_MANAGED_ETF'));
test('classifies FNGU as leveraged ETN',()=>{const x=classify('FNGU',{});assert.equal(x.type,'LEVERAGED_ETN');assert.equal(x.leveraged,true)});
test('rejects injection-like ticker input',()=>assert.throws(()=>normalizeTicker('AAPL; rm -rf'),/Ticker not found/));
