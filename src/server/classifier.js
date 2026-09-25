const OVERRIDES={CHAT:{category:'ETF',type:'ACTIVELY_MANAGED_ETF',label:'Actively Managed Thematic ETF',leveraged:false},FNGU:{category:'ETN',type:'LEVERAGED_ETN',label:'3× Daily Leveraged ETN',leveraged:true}};
export function classify(ticker,overview={}){
 if(OVERRIDES[ticker])return OVERRIDES[ticker];
 const text=`${overview.AssetType||''} ${overview.Name||''}`.toUpperCase();
 if(text.includes('ADR'))return{category:'STOCK',type:'ADR',label:'American Depositary Receipt',leveraged:false};
 if(text.includes('ETF')||text.includes('FUND'))return{category:'ETF',type:'EQUITY_ETF',label:'Equity ETF',leveraged:false};
 if(text.includes('COMMON STOCK')||overview.Symbol)return{category:'STOCK',type:'COMMON_STOCK',label:'Operating Company',leveraged:false};
 return{category:'OTHER',type:'UNSUPPORTED',label:'Other / Unsupported',leveraged:false};
}
