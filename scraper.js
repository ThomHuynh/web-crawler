const puppeteer = require('puppeteer');
const json = require('./QD_2021400009.json');

const BING = "https://www.bing.com/";
const BAIDU = "https://www.baidu.com/";

async function crawl(searchEngineURL, query){

    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    await page.setViewport({width: 1440, height: 900});
    await page.goto(searchEngineURL, { waitUntil: 'networkidle2' });

    //bing: accept cookie policy
    const elements = await page.$x('//*[@id="bnp_btn_accept"]');
    await elements[0].click();
    
    //bing: use query to search
    await page.waitForXPath('//*[@id="sb_form_q"]');
    await page.$eval('input[id=sb_form_q]', (el, q) => el.value = q, query);
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
    await page.screenshot({ path: `SE_BING_1_2021400009(page1).png`, fullPage: true }); 

    await page.click('.b_pag li:last-child a');
    await page.waitForSelector('.b_algo h2 a');

    const results2 = await page.$$eval('.b_algo h2 a', (results, results1) => results.map((result,index) => ({
        rank: index + 1 + results1.length,
        title: result.textContent,
        url: result.href
    })), results1);
    const results = results1.concat(results2).slice(0,10);
    await page.screenshot({ path: `SE_BING_1_2021400009(page2).png`, fullPage: true }); 


    //write results to file
    var fs = require('fs');
    const jsonString = JSON.stringify(results);
    fs.writeFile('SE_BING_1_2021400009.json', jsonString, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
    });

    //write html page to file
    const html = await page.content();

    fs.writeFile('pageContent.html', html, function (err) {
        if (err) {
            return console.log(err);
        }
    });

    await browser.close();
}

crawl(BING, json.query1.query);
