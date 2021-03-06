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
    await page.waitForSelector('span[id=bnp_hfly_cta2]');
    await page.click('span[id=bnp_hfly_cta2]');

    //TODO autogenerate file name
    await page.screenshot({ path: `SE_bing_1_2021400009.png`, fullPage: true }); 
    // TODO make file out of source code without multimedia
    const html = await page.content();

    // get all results
    var results = await page.$$eval('.b_algo h2 a', results => results.map((result,index) => ({
        rank: index + 1,
        title: result.textContent,
        url: result.href
    })))
    // given that first page always has 9 results
    if (results.length < 10) {
        await page.click('.b_pag li:last-child a');
        await page.waitForSelector('.b_algo');
        const newEntry = await page.$('.b_algo h2 a');
        results.push({
            rank: 10,
            title: newEntry.textContent,
            url: newEntry.href
        });
    }
    await page.screenshot({ path: `SE_bing_1_2021400009(2).png`, fullPage: true }); 
    console.log(results);

    //TODO create file with search results
    var fs = require('fs');
    const jsonString = JSON.stringify(results);
    fs.writeFile('SE_BING_1_2021400009.json', jsonString, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
    });

    await browser.close();
}

crawl(BING, json.query1.query);
