const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const round=(v,n=2)=>Number.isFinite(v)?Number(v.toFixed(n)):null;
export function calculateTechnicals(rows){
 const closes=rows.map(x=>x.close), highs=rows.map(x=>x.high), lows=rows.map(x=>x.low), volumes=rows.map(x=>x.volume);
 const sma=n=>closes.length>=n?mean(closes.slice(-n)):null;
 const ema=n=>{if(closes.length<n)return null;const k=2/(n+1);return closes.slice(1).reduce((e,v)=>v*k+e*(1-k),closes[0])};
 const changes=closes.slice(-15).map((v,i,a)=>i?v-a[i-1]:0).slice(1), gains=mean(changes.map(x=>Math.max(0,x))), losses=mean(changes.map(x=>Math.max(0,-x)));
 const rsi=losses===0?100:100-(100/(1+gains/losses));
 const logs=closes.slice(-21).map((v,i,a)=>i?Math.log(v/a[i-1]):null).slice(1), lm=mean(logs), variance=logs.length?mean(logs.map(x=>(x-lm)**2)):null;
 const trueRanges=rows.slice(-15).map((x,i,a)=>i?Math.max(x.high-x.low,Math.abs(x.high-a[i-1].close),Math.abs(x.low-a[i-1].close)):x.high-x.low);
 const high52=Math.max(...highs.slice(-252)), low52=Math.min(...lows.slice(-252)), last=closes.at(-1);
 const e12=ema(12),e26=ema(26),macd=e12!=null&&e26!=null?e12-e26:null;
 const result={sma20:sma(20),sma50:sma(50),sma100:sma(100),sma200:sma(200),ema20:ema(20),ema50:ema(50),rsi14:rsi,macd,atr14:mean(trueRanges),realizedVolatility:variance==null?null:Math.sqrt(variance)*Math.sqrt(252)*100,relativeVolume:volumes.length>=20?volumes.at(-1)/mean(volumes.slice(-20)):null,high52,low52,drawdownFromHigh:high52?((last/high52)-1)*100:null};
 const trend=result.sma200==null?'long-term trend unavailable':last>result.sma200?'above its 200-day average':'below its 200-day average';
 result.interpretation=`Price is ${trend}. RSI is ${result.rsi14==null?'unavailable':result.rsi14>70?'in an overbought zone':result.rsi14<30?'in an oversold zone':'neutral'}. These indicators describe conditions, not certainties.`;
 return Object.fromEntries(Object.entries(result).map(([k,v])=>[k,typeof v==='number'?round(v):v]));
}
export function returns(rows,days){if(rows.length<=days)return null;return (rows.at(-1).close/rows.at(-1-days).close-1)*100}
