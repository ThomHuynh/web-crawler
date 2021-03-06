const puppeteer = require('puppeteer');
const json = require('./QD_2021400009.json');

async function crawlBing(query){

    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    await page.setViewport({width: 1440, height: 900});
    await page.goto("https://www.bing.com/", { waitUntil: 'networkidle2' });

    //bing: accept cookie policy
    const elements = await page.$x('//*[@id="bnp_btn_accept"]');
    await elements[0].click();
    
    //bing: use query to search
    await page.waitForXPath('//*[@id="sb_form_q"]');
    await page.$eval('input[id=sb_form_q]', (el, q) => el.value = q, query.query);
    await page.click('label[for=sb_form_go]');
    
    //bing: close edge ad popup
    await page.waitForSelector('span[id=bnp_hfly_cta2]'); // this changes -> A/B testing from bing
    await page.click('span[id=bnp_hfly_cta2]');

    
    //bing: get all entries from first two pages
    const results1 = await page.$$eval('.b_algo h2 a', results => results.map((result,index) => ({
        rank: index + 1,
        title: result.textContent,
        url: result.href
    })))
    await page.screenshot({ path: `./screenshots/SE_BING_${query.queryNum}_2021400009(page1).png`, fullPage: true }); 

    await page.click('.b_pag li:last-child a');
    await page.waitForSelector('.b_algo h2 a');

    const results2 = await page.$$eval('.b_algo h2 a', (results, results1) => results.map((result,index) => ({
        rank: index + 1 + results1.length,
        title: result.textContent,
        url: result.href
    })), results1);
    const results = results1.concat(results2).slice(0,10);
    await page.screenshot({ path: `./screenshots/SE_BING_${query.queryNum}_2021400009(page2).png`, fullPage: true }); 


    //write results to file
    var fs = require('fs');
    const jsonString = JSON.stringify(results);
    fs.writeFile(`./infoFiles/SE_BING_${query.queryNum}_2021400009.json`, jsonString, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
    });

    //write all ten html page to file
    for(i = 0; i < results.length; i++) {
        targetPage = results[i];
        await page.goto(`${targetPage.url}`, { waitUntil: 'networkidle2' });
        html = await page.content();

        fs.writeFile(`./targetPages/TP_BING_${query.queryNum}_${targetPage.rank}_2021400009.html`, html, function (err) {
            if (err) {
                return console.log(err);
            }
        })
    }

    await browser.close();
}

async function crawlBaidu(query) {

}

crawlBaidu(json.query1);
// crawlBing(json.query1);
// crawlBing(json.query2);
