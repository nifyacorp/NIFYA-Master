const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',                 // ❌ Disables GPU rendering (fixes crashes)
            '--disable-software-rasterizer', // ❌ Disables software rendering
            '--disable-dev-shm-usage',       // ✅ Fixes shared memory issues
            '--no-zygote',                   // ✅ Prevents process locking issues
            '--single-process'               // ✅ Runs in a single process
        ]
    });

    console.log('Puppeteer launched successfully!');
    await browser.close();
})();
