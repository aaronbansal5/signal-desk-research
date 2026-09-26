import YahooFinance from 'yahoo-finance2';
const yahoo=new YahooFinance({suppressNotices:['yahooSurvey']});
const API='https://www.alphavantage.co/query';
const nullable=v=>v==null||v===''||v==='None'||v==='-'?null:Number.isFinite(Number(v))?Number(v):v;
async function query(params,key){const url=new URL(API);Object.entries({...params,apikey:key}).forEach(([k,v])=>url.searchParams.set(k,v));const res=await fetch(url,{signal:AbortSignal.timeout(18000)});if(!res.ok)throw new Error(`Market data provider returned ${res.status}`);const body=await res.json();if(body.Note||body.Information)throw new Error('Market data provider rate limit reached');if(body['Error Message'])throw new Error('Ticker not found.');return body}
export async function fetchAlphaVantage(ticker,key){
 if(!key)throw new Error('Live research requires ALPHA_VANTAGE_API_KEY on the server.');
 const [overview,daily,news]=await Promise.all([query({function:'OVERVIEW',symbol:ticker},key),query({function:'TIME_SERIES_DAILY',symbol:ticker,outputsize:'full'},key),query({function:'NEWS_SENTIMENT',tickers:ticker,limit:'20',sort:'LATEST'},key).catch(()=>({feed:[]}))]);
 const series=daily['Time Series (Daily)']; if(!series||!Object.keys(series).length)throw new Error('Ticker not found.');
 const history=Object.entries(series).map(([date,x])=>({date,open:+x['1. open'],high:+x['2. high'],low:+x['3. low'],close:+x['4. close'],volume:+x['5. volume']})).sort((a,b)=>a.date.localeCompare(b.date));
 const last=history.at(-1),prev=history.at(-2);
 return {overview,history,market:{price:last.close,previousClose:prev?.close??null,changePercent:prev?(last.close/prev.close-1)*100:null,asOf:`${last.date}T20:00:00Z`,high52:Math.max(...history.slice(-252).map(x=>x.high)),low52:Math.min(...history.slice(-252).map(x=>x.low)),averageVolume:null},news:(news.feed||[]).map(x=>({headline:x.title,summary:x.summary,source:x.source,date:x.time_published?.slice(0,8).replace(/(\d{4})(\d{2})(\d{2})/,'$1-$2-$3'),url:x.url})).filter(x=>x.url)};
}
export function mapOverview(o={}){return{name:o.Name||o.Symbol||'Unknown security',exchange:o.Exchange||null,sector:o.Sector||null,industry:o.Industry||null,description:o.Description||null,valuation:{trailingPE:nullable(o.TrailingPE),forwardPE:nullable(o.ForwardPE),peg:nullable(o.PEGRatio),priceToSales:nullable(o.PriceToSalesRatioTTM),priceToBook:nullable(o.PriceToBookRatio),evRevenue:nullable(o.EVToRevenue),evEbitda:nullable(o.EVToEBITDA)},fundamentals:{marketCap:nullable(o.MarketCapitalization),revenueTTM:nullable(o.RevenueTTM),epsTTM:nullable(o.EPS),revenueGrowth:nullable(o.QuarterlyRevenueGrowthYOY),epsGrowth:nullable(o.QuarterlyEarningsGrowthYOY),grossMargin:nullable(o.GrossProfitTTM)&&nullable(o.RevenueTTM)?nullable(o.GrossProfitTTM)/nullable(o.RevenueTTM)*100:null,operatingMargin:nullable(o.OperatingMarginTTM)*100,netMargin:nullable(o.ProfitMargin)*100,roe:nullable(o.ReturnOnEquityTTM)*100,dividendYield:nullable(o.DividendYield)*100,nextEarningsDate:o.LatestQuarter||null}}}

const val=v=>v==null||!Number.isFinite(Number(v))?null:Number(v);
const pctv=v=>val(v)==null?null:val(v)*100;
export async function fetchYahoo(ticker){
 const isIndia=ticker.endsWith('.NS')||ticker.endsWith('.BO');
 const modules=['price','quoteType','summaryDetail','defaultKeyStatistics','financialData','assetProfile','earningsTrend','calendarEvents','fundProfile','fundPerformance','topHoldings'];
 let [summary,chart,search]=await Promise.all([
  yahoo.quoteSummary(ticker,{modules}),
  yahoo.chart(ticker,{period1:new Date(Date.now()-400*86400000),interval:'1d'}),
  yahoo.search(ticker,{quotesCount:1,newsCount:20,region:isIndia?'IN':'US',lang:isIndia?'en-IN':'en-US'}).catch(()=>({news:[]})),
 ]);
 if(!summary?.price?.regularMarketPrice||!chart?.quotes?.length)throw new Error('Ticker not found.');
 const p=summary.price,s=summary.summaryDetail||{},k=summary.defaultKeyStatistics||{},f=summary.financialData||{},a=summary.assetProfile||{};
 if(isIndia&&!search.news?.length&&(p.longName||p.shortName))search=await yahoo.search(p.longName||p.shortName,{quotesCount:0,newsCount:20,region:'IN',lang:'en-IN'}).catch(()=>search);
 const history=chart.quotes.filter(x=>x.close!=null).map(x=>({date:new Date(x.date).toISOString().slice(0,10),open:val(x.open),high:val(x.high),low:val(x.low),close:val(x.close),volume:val(x.volume)}));
 const rawHoldings=summary.topHoldings?.holdings||[];
 const enriched=await Promise.all(rawHoldings.slice(0,20).map(async h=>{try{const q=await yahoo.quoteSummary(h.symbol,{modules:['price','summaryDetail','defaultKeyStatistics','financialData']});return{ticker:h.symbol,name:h.holdingName,weight:h.holdingPercent*100,price:val(q.price?.regularMarketPrice),trailingPE:val(q.summaryDetail?.trailingPE),forwardPE:val(q.summaryDetail?.forwardPE||q.defaultKeyStatistics?.forwardPE),trailingEps:val(q.defaultKeyStatistics?.trailingEps),forwardEps:val(q.defaultKeyStatistics?.forwardEps),epsGrowth:val(q.financialData?.earningsGrowth)*100,revenueGrowth:val(q.financialData?.revenueGrowth)*100}}catch{return{ticker:h.symbol,name:h.holdingName,weight:h.holdingPercent*100}}}));
 return{overview:{Symbol:ticker,Name:p.longName||p.shortName,AssetType:p.quoteType,Exchange:p.exchangeName||p.exchange,Sector:a.sector,Industry:a.industry},history,market:{price:p.regularMarketPrice,previousClose:p.regularMarketPreviousClose,changePercent:pctv(p.regularMarketChangePercent),asOf:new Date(p.regularMarketTime||Date.now()).toISOString(),high52:s.fiftyTwoWeekHigh,low52:s.fiftyTwoWeekLow,averageVolume:p.averageDailyVolume3Month,currency:p.currency||s.currency||(isIndia?'INR':'USD'),country:isIndia?'India':'United States',locale:isIndia?'en-IN':'en-US'},valuation:{trailingPE:val(s.trailingPE),forwardPE:val(s.forwardPE||k.forwardPE),peg:val(k.pegRatio),priceToSales:val(s.priceToSalesTrailing12Months),priceToBook:val(k.priceToBook),evRevenue:val(k.enterpriseToRevenue),evEbitda:val(k.enterpriseToEbitda)},fundamentals:{marketCap:val(p.marketCap||s.marketCap),enterpriseValue:val(k.enterpriseValue),revenueTTM:val(f.totalRevenue),epsTTM:val(k.trailingEps),forwardEps:val(k.forwardEps),revenueGrowth:pctv(f.revenueGrowth),epsGrowth:pctv(f.earningsGrowth),grossMargin:pctv(f.grossMargins),operatingMargin:pctv(f.operatingMargins),netMargin:pctv(f.profitMargins),freeCashFlow:val(f.freeCashflow),roe:pctv(f.returnOnEquity),debt:val(f.totalDebt),cash:val(f.totalCash),debtToEquity:val(f.debtToEquity),dividendYield:pctv(s.dividendYield),nextEarningsDate:summary.calendarEvents?.earnings?.earningsDate?.[0]||null},fund:{issuer:summary.fundProfile?.family||k.fundFamily,expenseRatio:pctv(summary.fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio),aum:val(s.totalAssets||k.totalAssets),nav:val(s.navPrice),distributionYield:pctv(s.yield||k.yield),inceptionDate:k.fundInceptionDate||null,sectors:(summary.topHoldings?.sectorWeightings||[]).flatMap(x=>Object.entries(x).map(([name,weight])=>({name:name.replaceAll('_',' '),weight:weight*100})))},holdings:enriched,news:(search.news||[]).map(x=>({headline:x.title,summary:x.publisher?`Reported by ${x.publisher}.`:null,source:x.publisher||'Yahoo Finance',date:x.providerPublishTime?new Date(x.providerPublishTime).toISOString().slice(0,10):null,url:x.link})).filter(x=>x.url)};
}

const supportedResult=x=>x?.isYahooFinance&&['EQUITY','ETF','MUTUALFUND'].includes(x.quoteType);
const marketOf=x=>x.symbol?.endsWith('.NS')||x.symbol?.endsWith('.BO')||['NSE','Bombay'].includes(x.exchDisp)?'India':'United States';
export async function searchSecurities(raw){
 const query=String(raw||'').trim().slice(0,64);if(!query||!/^[\p{L}\p{N} .&'()-]+$/u.test(query))return[];
 const one=/^[A-Za-z]$/.test(query);const requests=[
  yahoo.search(query,{quotesCount:12,newsCount:0,region:'US',enableFuzzyQuery:true,enableCb:false,enableNavLinks:false}),
  yahoo.search(query,{quotesCount:12,newsCount:0,region:'IN',lang:'en-IN',enableFuzzyQuery:true,enableCb:false,enableNavLinks:false}),
 ];
 if(one){requests.push(yahoo.search(`${query} inc`,{quotesCount:12,newsCount:0,region:'US',enableFuzzyQuery:true,enableCb:false,enableNavLinks:false}));requests.push(yahoo.search(`${query} limited`,{quotesCount:12,newsCount:0,region:'IN',lang:'en-IN',enableFuzzyQuery:true,enableCb:false,enableNavLinks:false}))}
 const settled=await Promise.allSettled(requests),all=settled.flatMap(x=>x.status==='fulfilled'?x.value.quotes:[]).filter(supportedResult),seen=new Set(),q=query.toUpperCase();
 const mapped=all.filter(x=>{const market=marketOf(x);return market==='India'||['NASDAQ','NYSE','NYSEArca','NYSE American','OTC Markets','Cboe US'].some(e=>(x.exchDisp||'').includes(e))||['NMS','NYQ','PCX','ASE','PNK','BTS'].includes(x.exchange)}).filter(x=>!one||x.symbol.startsWith(q)).map(x=>({symbol:x.symbol,name:x.longname||x.shortname||x.symbol,type:x.typeDisp||x.quoteType,exchange:x.exchDisp||x.exchange,market:marketOf(x),score:x.score||0})).filter(x=>{if(seen.has(x.symbol))return false;seen.add(x.symbol);return true}).sort((a,b)=>{const ae=a.symbol===q?1:0,be=b.symbol===q?1:0,an=a.name.toUpperCase()===q?1:0,bn=b.name.toUpperCase()===q?1:0;return(be+bn)-(ae+an)||b.score-a.score});
 const normalizedName=query.toUpperCase().replace(/[^A-Z0-9 ]/g,'').trim(),nameStarts=!one&&normalizedName.length>2?mapped.filter(x=>x.name.toUpperCase().replace(/[^A-Z0-9 ]/g,'').startsWith(normalizedName)):[];
 return(nameStarts.length?nameStarts:mapped).slice(0,10);
}
