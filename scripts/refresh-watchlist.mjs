const site=(process.env.PUBLIC_SITE_URL||'http://localhost:8888').replace(/\/$/,'');
const res=await fetch(`${site}/api/scheduled-refresh`,{method:'POST',headers:process.env.CRON_SECRET?{authorization:`Bearer ${process.env.CRON_SECRET}`}:{}});const body=await res.text();console.log(body);if(!res.ok)process.exitCode=1;
