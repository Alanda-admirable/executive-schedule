const fetch = require('node-fetch'); // wait node 18+ has fetch natively
async function run() {
  const html = await (await fetch('https://executive-schedule.vercel.app/')).text();
  const scripts = [...html.matchAll(/_next\/static\/chunks\/app\/page-[a-z0-9]+\.js/g)];
  if (scripts.length > 0) {
    const js = await (await fetch('https://executive-schedule.vercel.app/' + scripts[0][0])).text();
    if(js.includes('thaiSmartBreak')) {
        const idx = js.indexOf('thaiSmartBreak');
        console.log(js.substring(idx - 100, idx + 200));
    } else {
        console.log('thaiSmartBreak not in this script');
    }
  } else {
    console.log('No scripts found. Using simple regex search');
    const allScripts = [...html.matchAll(/src="([^"]+\.js)"/g)];
    for (const s of allScripts) {
      if (s[1].includes('page')) {
         const js = await (await fetch('https://executive-schedule.vercel.app' + (s[1].startsWith('/') ? '' : '/') + s[1])).text();
         if(js.includes('thaiSmartBreak')) {
             const idx = js.indexOf('thaiSmartBreak');
             console.log("FOUND!");
             console.log(js.substring(idx, idx + 200));
             return;
         }
      }
    }
    console.log('Could not find it');
  }
}
run();
