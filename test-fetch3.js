async function run() {
  const html = await (await fetch('https://executive-schedule.vercel.app/')).text();
  const allScripts = [...html.matchAll(/src="([^"]+\.js)"/g)];
  for (const s of allScripts) {
    if (s[1].includes('page')) {
       const url = 'https://executive-schedule.vercel.app' + (s[1].startsWith('/') ? '' : '/') + s[1];
       const js = await (await fetch(url)).text();
       if(js.includes('ประจำปีงบประมาณ')) {
           const idx = js.indexOf('ประจำปีงบประมาณ');
           console.log("FOUND!");
           console.log(js.substring(idx - 200, idx + 200));
           return;
       }
    }
  }
  console.log('Could not find it');
}
run();
