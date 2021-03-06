const puppeteer = require("puppeteer");
const json = require("./QD_2021400009.json");

async function crawlBing(query) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("https://www.bing.com/", { waitUntil: "networkidle2" });

  // accept cookie policy
  const elements = await page.$x('//*[@id="bnp_btn_accept"]');
  await elements[0].click();

  // search
  await page.waitForXPath('//*[@id="sb_form_q"]');
  await page.$eval(
    "input[id=sb_form_q]",
    (el, q) => (el.value = q),
    query.query
  );
  await page.click("label[for=sb_form_go]");

  // close edge advertisement popup
  await page.waitForSelector("#bnp_hfly_cta2"); // this changes -> A/B testing from bing
  await page.click("#bnp_hfly_cta2");

  // get first ten entries from first two pages
  const results1 = await page.$$eval(".b_algo h2 a", (results) =>
    results.map((result, index) => ({
      rank: index + 1,
      title: result.textContent,
      url: result.href,
    }))
  );
  await page.screenshot({
    path: `./SE_BING_${query.queryNum}_2021400009(page1).png`,
    fullPage: true,
  });

  await page.click(".b_pag li:last-child a");
  await page.waitForTimeout(1000);

  const results2 = await page.$$eval(
    ".b_algo h2 a",
    (results, results1) =>
      results.map((result, index) => ({
        rank: index + 1 + results1.length,
        title: result.textContent,
        url: result.href,
      })),
    results1
  );
  const results = results1.concat(results2).slice(0, 10);
  await page.screenshot({
    path: `./SE_BING_${query.queryNum}_2021400009(page2).png`,
    fullPage: true,
  });

  //write results to file
  var fs = require("fs");
  const jsonString = JSON.stringify(results);
  fs.writeFile(
    `./SE_BING_${query.queryNum}_2021400009.json`,
    jsonString,
    "utf8",
    function (err) {
      if (err) {
        return console.log(err);
      }
    }
  );

  //write target pages to file
  for (i = 0; i < results.length; i++) {
    targetPage = results[i];
    await page.goto(`${targetPage.url}`, { waitUntil: "networkidle2" });
    html = await page.content();

    fs.writeFile(
      `./targetPages/TP_BING_${query.queryNum}_${targetPage.rank}_2021400009.html`,
      html,
      function (err) {
        if (err) {
          return console.log(err);
        }
      }
    );
  }

  await browser.close();
}

async function baiduCrawler(query) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("https://www.baidu.com/", { waitUntil: "networkidle2" });

  // baidu search
  await page.$eval("#kw", (el, q) => (el.value = q), query.query);
  await page.click("#su");
  await page.waitForSelector(".result");

  // get all entries from current search result
  const results1 = await page.$$eval(".result h3 a", (results) =>
    results.map((result, index) => ({
      rank: index + 1,
      title: result.textContent,
      url: result.href,
    }))
  );

  await page.screenshot({
    path: `./SE_BAIDU_${query.queryNum}_2021400009(page1).png`,
    fullPage: true,
  });

  // get all entries from second search result page, since there are <9 results on the first page
  await page.click("#page a:last-child");
  await page.waitForTimeout(1000);

  const results2 = await page.$$eval(
    ".result h3 a",
    (results, results1) =>
      results.map((result, index) => ({
        rank: index + 1 + results1.length,
        title: result.textContent,
        url: result.href,
      })),
    results1
  );

  //slice to ten results, this can be refactored
  const results = results1.concat(results2).slice(0, 10);
  await page.screenshot({
    path: `./SE_BAIDU_${query.queryNum}_2021400009(page2).png`,
    fullPage: true,
  });

  //write results to file
  var fs = require("fs");
  const jsonString = JSON.stringify(results);
  fs.writeFile(
    `./SE_BAIDU_${query.queryNum}_2021400009.json`,
    jsonString,
    "utf8",
    function (err) {
      if (err) {
        return console.log(err);
      }
    }
  );

  // write target pages to files
  for (let i = 0; i < results.length; i++) {
    targetPage = results[i];
    await page.goto(`${targetPage.url}`, { waitUntil: "networkidle2" });
    html = await page.content();

    fs.writeFile(
      `./targetPages/TP_BAIDU_${query.queryNum}_${targetPage.rank}_2021400009.html`,
      html,
      function (err) {
        if (err) {
          console.log(err);
          return console.log(err);
        }
      }
    );
  }
  await browser.close();
}

//using promises these calls can be executed in parallel
crawlBing(json.query1);
crawlBing(json.query2);
baiduCrawler(json.query1);
baiduCrawler(json.query2);
