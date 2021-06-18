const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Discord = require('discord.js');

const client = new Discord.Client();
const {LOGIN_USERNAME, LOGIN_PASSWORD, BOT_TOKEN} = require('./config.js');
const url = `https://www.fit.ba/student/login.aspx`;

client.on('ready', () => {
    console.log(`Primed and ready!`);

    (async () => {
        while(true)  {
            await Scraper();
            await sleep(5000);
        }
    })();
});

client.on('message', msg => {
    
});

async function pageLogin(page) {
    await page.goto(url);

    await Promise.all([
        page.waitForSelector('[name="txtBrojDosijea"]'),
        page.waitForSelector('[name="txtLozinka"]'),
        page.waitForSelector('[name="btnPrijava"]'),
    ]);

    await page.type('[name="txtBrojDosijea"]', LOGIN_USERNAME);
    await page.type('[name="txtLozinka"]', LOGIN_PASSWORD);

    await Promise.all([
        page.waitForNavigation({
            waitUntil: 'load',
        }),
        await page.click('[name="btnPrijava"]'),
    ]);

    return console.log("Logged in succesfully.");
}

async function Scraper() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await pageLogin(page);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    const news = {
        title: "",
        date: "",
        subject: "",
        author: "",
        description: ""
    }  

    $('.newslist').slice(0, 1).each(function() {
        const title = $(this).find('#lnkNaslov').text();
        const date = $(this).find('#lblDatum').text();
        const subject = $(this).find('#lblPredmet').text();
        const author = $(this).find('#HyperLink9').text();
        const description = $(this).find('.abstract').text();
        
        news.title = title;
        news.date = date;
        news.subject = subject;
        news.author = author;
        news.description = description;
    })

    console.log(news);

    await page.goto("https://www.fit.ba/student/logout.aspx")
    browser.close();
    return undefined;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(BOT_TOKEN);