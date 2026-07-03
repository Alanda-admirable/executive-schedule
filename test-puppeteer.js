const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://executive-schedule.vercel.app/', { waitUntil: 'networkidle2' });
  
  // Try to find the schedule with Queen's Cup
  const htmls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.td-mission')).map(el => el.innerHTML);
  });
  
  for (const html of htmls) {
    if (html.includes('Queen')) {
      console.log('FOUND QUEEN:');
      console.log(html);
    }
  }
  
  await browser.close();
})();
