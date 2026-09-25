import test from 'node:test';import assert from 'node:assert/strict';import {mapOverview} from '../src/server/provider.js';
test('maps missing metrics to null, never zero',()=>{const x=mapOverview({Symbol:'AAPL',TrailingPE:'None'});assert.equal(x.valuation.trailingPE,null);assert.equal(x.valuation.forwardPE,null)});
test('maps compatible ratios',()=>{const x=mapOverview({TrailingPE:'24.5',ForwardPE:'20',PEGRatio:'1.8'});assert.deepEqual([x.valuation.trailingPE,x.valuation.forwardPE,x.valuation.peg],[24.5,20,1.8])});
