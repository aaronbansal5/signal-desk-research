import { useEffect, useMemo, useState } from 'react';
import { PriceChart, BarChart } from './components/Charts.jsx';

const money = v => v == null ? '—' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);
const num = (v, suffix='') => v == null || Number.isNaN(v) ? '—' : `${Number(v).toFixed(2)}${suffix}`;
const pct = v => num(v, '%');
const cleanTicker = value => value.toUpperCase().trim().replace(/[^A-Z0-9.-]/g,'').slice(0,12);

function Metric({label,value,detail}) { return <div className="metric"><span>{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</div> }
function Badge({children,tone=''}) { return <span className={`badge ${tone}`}>{children}</span> }

function Home({navigate}) {
  const [ticker,setTicker]=useState(''); const [recent,setRecent]=useState([]);
  useEffect(()=>{ fetch('/api/recent').then(r=>r.ok?r.json():[]).then(setRecent).catch(()=>{}); },[]);
  const submit=e=>{e.preventDefault(); const t=cleanTicker(ticker); if(t) navigate(`/ticker/${t}`)};
  return <main>
    <section className="hero"><p className="eyebrow">AUTOMATED PUBLIC RESEARCH</p><h1>Research Any Stock, ETF, or ETN</h1><p>Evidence-first valuation, fundamentals, holdings, technicals, news and model ratings—with uncertainty kept visible.</p>
      <form className="search" onSubmit={submit}><input value={ticker} onChange={e=>setTicker(e.target.value)} placeholder="AAPL, NVDA, SPY, QQQ, CHAT, FNGU" aria-label="Ticker"/><button>Run research <span>→</span></button></form>
    </section>
    <section><div className="section-title"><div><p className="eyebrow">7:00 AM ET · DAILY</p><h2>Default Daily Research</h2></div></div><div className="cards">{['CHAT','FNGU'].map((t,i)=><button className="feature-card" onClick={()=>navigate(`/ticker/${t}`)} key={t}><div><Badge tone={i?'amber':'blue'}>{i?'LEVERAGED ETN':'ACTIVE ETF'}</Badge><span className="arrow">↗</span></div><h3>{t}</h3><p>{i?'3× daily FANG+ exposure, evaluated tactically.':'AI portfolio look-through and earnings engine.'}</p></button>)}</div></section>
    <section><div className="section-title"><div><p className="eyebrow">DISCOVERY</p><h2>Recently Researched</h2></div></div>{recent.length?<div className="recent">{recent.map(r=><button key={r.ticker} onClick={()=>navigate(`/ticker/${r.ticker}`)}><b>{r.ticker}</b><span>{r.name}</span><Badge>{r.rating}</Badge><small>{new Date(r.generatedAt).toLocaleString()}</small></button>)}</div>:<div className="empty">No reports yet. Search a ticker to create the first one.</div>}</section>
  </main>
}

function Report({ticker,date,navigate}) {
  const [state,setState]=useState({loading:true});
  const [refreshing,setRefreshing]=useState(false);
  const load=async(force=false)=>{setRefreshing(force);setState(s=>({...s,loading:!force,error:null}));try{const q=new URLSearchParams({ticker,...(date?{date}:{}),...(force?{refresh:'true'}:{})});const r=await fetch(`/api/research?${q}`,{method:force?'POST':'GET'});const body=await r.json();if(!r.ok)throw new Error(body.error||'Research failed');setState({loading:false,data:body});}catch(e){setState({loading:false,error:e.message});}finally{setRefreshing(false)}};
  useEffect(()=>{load()},[ticker,date]);
  if(state.loading)return <main className="loading"><div className="pulse"/><h2>Building {ticker} research</h2><p>Checking cache, market data and security-specific analytics…</p></main>;
  if(state.error)return <main><div className="error"><Badge tone="red">UNAVAILABLE</Badge><h2>{state.error}</h2><p>No figures have been inferred. Confirm the ticker and server-side provider key.</p><button onClick={()=>navigate('/')}>Back to search</button></div></main>;
  const r=state.data; const tech=r.technicals||{}; const val=r.valuation||{}; const isFund=r.classification.category!=='STOCK';
  return <main className="report">
    <section className="report-head"><div><div className="crumb"><button onClick={()=>navigate('/')}>Research</button><span>/</span><span>{r.ticker}</span></div><div className="title-row"><h1>{r.ticker}</h1><div><h2>{r.name}</h2><p>{r.exchange||'—'} · {r.classification.label}</p></div></div></div><button className="secondary" onClick={()=>load(true)} disabled={refreshing}>{refreshing?'Refreshing…':'↻ Refresh analysis'}</button></section>
    <section className="summary-grid"><div className="price-block"><p className="eyebrow">LAST PRICE</p><strong>{money(r.market.price)}</strong><span className={(r.market.changePercent||0)>=0?'positive':'negative'}>{pct(r.market.changePercent)} today</span><small>As of {new Date(r.market.asOf).toLocaleString()}</small></div><div className="rating-block"><p className="eyebrow">MODEL RATING · {r.recommendation.score}/100</p><strong className={`rating ${r.recommendation.rating.replaceAll(' ','-').toLowerCase()}`}>{r.recommendation.rating}</strong><p>{r.recommendation.confidence} confidence · {r.recommendation.horizon}</p></div><Metric label={isFund?'Look-through P/E':'Trailing P/E'} value={num(val.trailingPE,'×')} detail={val.trailingPE?'Reported/calculated as labeled':'Not available'}/><Metric label="Forward P/E" value={num(val.forwardPE,'×')}/><Metric label="PEG" value={num(val.peg,'×')}/><Metric label="Data quality" value={r.dataQuality.status} detail={r.dataQuality.notes[0]||'Validated'}/></section>
    {r.dataQuality.status!=='GOOD'&&<div className="notice"><b>{r.dataQuality.status} coverage.</b> {r.dataQuality.notes.join(' ')}</div>}
    <div className="layout"><div className="primary">
      <Section title="Recommendation" kicker="MODEL OUTPUT"><p className="lead">{r.recommendation.thesis}</p><div className="two-col"><Callout label="Key catalyst" text={r.recommendation.catalyst}/><Callout label="Key risk" text={r.recommendation.risk}/><Callout label="Upgrade trigger" text={r.recommendation.upgrade}/><Callout label="Downgrade trigger" text={r.recommendation.downgrade}/></div></Section>
      <Section title="What Changed Since Yesterday?" kicker="STRUCTURED COMPARISON">{r.changes.length?r.changes.map((c,i)=><div className="change" key={i}><b>{c.label}</b><span>{c.before} → {c.after}</span><p>{c.reason}</p></div>):<p className="muted">No prior daily snapshot is available for comparison.</p>}</Section>
      <Section title="Price & Trend" kicker="TECHNICAL ANALYSIS"><PriceChart data={r.history}/><div className="metric-strip"><Metric label="SMA 20" value={money(tech.sma20)}/><Metric label="SMA 50" value={money(tech.sma50)}/><Metric label="SMA 200" value={money(tech.sma200)}/><Metric label="RSI (14)" value={num(tech.rsi14)}/><Metric label="Realized vol." value={pct(tech.realizedVolatility)}/><Metric label="Drawdown" value={pct(tech.drawdownFromHigh)}/></div><p>{tech.interpretation}</p></Section>
      {r.holdings?.length>0&&<Section title={r.classification.leveraged?'Underlying Constituents':'Holdings'} kicker={r.classification.leveraged?'NYSE FANG+ LAYER':'PORTFOLIO LOOK-THROUGH'}><BarChart data={r.holdings.slice(0,10)}/><div className="table-wrap"><table><thead><tr><th>Ticker</th><th>Name</th><th>Weight</th><th>P/E</th><th>Forward P/E</th></tr></thead><tbody>{r.holdings.slice(0,20).map(h=><tr key={h.ticker}><td><b>{h.ticker}</b></td><td>{h.name}</td><td>{pct(h.weight)}</td><td>{num(h.trailingPE,'×')}</td><td>{num(h.forwardPE,'×')}</td></tr>)}</tbody></table></div><p className="caption">Coverage: {pct(r.portfolio?.coverage)} · excluded weight: {pct(r.portfolio?.excludedWeight)}. Negative or missing earnings are excluded and disclosed, never converted to zero.</p></Section>}
      {r.etfAnalysis&&<><Section title="ETF Earnings Engine" kicker="GROWTH CONTRIBUTION"><p>{r.etfAnalysis.earningsEngine}</p></Section><Section title="ETF Valuation Drivers" kicker="PORTFOLIO FACTORS"><p>{r.etfAnalysis.valuationDrivers}</p></Section></>}
      {r.leverage&&<><Section title="Leverage Tracking & Compounding" kicker="3× DAILY RESET"><div className="metric-strip"><Metric label="5D actual" value={pct(r.leverage.actual5d)}/><Metric label="5D simple 3×" value={pct(r.leverage.simple3x5d)}/><Metric label="Tracking gap" value={pct(r.leverage.trackingGap5d)}/><Metric label="Effective leverage" value={num(r.leverage.effectiveLeverage,'×')}/></div><p>{r.leverage.explanation}</p></Section><Section title="Volatility Decay" kicker="PATH DEPENDENCY"><p>{r.leverage.decayExplanation}</p></Section></>}
      <Section title={r.classification.leveraged?'Tactical Scenarios':'Bear / Base / Bull'} kicker="SCENARIO ANALYSIS"><div className="scenario-grid">{r.scenarios.map(s=><article key={s.name} className={s.name.toLowerCase()}><span>{s.name}</span><strong>{s.range}</strong><p>{s.assumptions}</p></article>)}</div></Section>
      <Section title="Latest News" kicker="RECENT DEVELOPMENTS">{r.news.length?r.news.map(n=><a className="news" href={n.url} target="_blank" rel="noreferrer" key={n.url}><div><b>{n.headline}</b><p>{n.summary}</p></div><span>{n.source}<small>{n.date}</small></span></a>):<p className="muted">No verified recent news was returned by the configured provider.</p>}</Section>
      <Section title="Sources" kicker="DATA LINEAGE"><div className="sources">{r.sources.map(s=><a href={s.url} target="_blank" rel="noreferrer" key={s.url}><b>{s.name}</b><span>{s.purpose}</span><small>As of {s.asOf}</small></a>)}</div></Section>
    </div><aside><div className="sticky"><p className="eyebrow">REPORT INDEX</p>{['Recommendation','What Changed','Price & Trend',r.holdings?.length?'Holdings':null,r.leverage?'Leverage':null,'Scenarios','Latest News','Sources'].filter(Boolean).map(x=><span key={x}>{x}</span>)}<hr/><b>Historical reports</b>{r.historyDates?.map(d=><button key={d} onClick={()=>navigate(`/ticker/${r.ticker}/${d}`)}>{d}</button>)}</div></aside></div>
    <div className="disclaimer">Automated research may be incomplete or delayed. Ratings are model-generated, not investment advice. Leveraged products involve substantial risk. Past performance does not guarantee future results.</div>
  </main>
}
function Section({title,kicker,children}) { return <section className="panel"><p className="eyebrow">{kicker}</p><h2>{title}</h2>{children}</section> }
function Callout({label,text}) { return <div className="callout"><span>{label}</span><p>{text}</p></div> }

export default function App(){
 const [path,setPath]=useState(location.pathname); const navigate=p=>{history.pushState({},'',p);setPath(p);scrollTo(0,0)};
 useEffect(()=>{const fn=()=>setPath(location.pathname);addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)},[]);
 const route=useMemo(()=>path.match(/^\/ticker\/([A-Z0-9.-]+)(?:\/(\d{4}-\d{2}-\d{2}))?$/i),[path]);
 return <><header><button className="brand" onClick={()=>navigate('/')}><span>SD</span><div><b>Signal Desk</b><small>PUBLIC MARKET RESEARCH</small></div></button><nav><button onClick={()=>navigate('/')}>Research</button><a href="/methodology.html">Methodology</a><Badge tone="green">SYSTEMATIC · SOURCED</Badge></nav></header>{route?<Report ticker={route[1].toUpperCase()} date={route[2]} navigate={navigate}/>:<Home navigate={navigate}/>}<footer><b>Signal Desk</b><span>Automated, source-aware market research.</span><a href="/methodology.html">Methodology & limitations</a></footer></>;
}
