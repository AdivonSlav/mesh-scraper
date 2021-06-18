const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Discord = require('discord.js');
const {LOGIN_USERNAME, LOGIN_PASSWORD, BOT_TOKEN, WEBHOOK_ID, WEBHOOK_TOKEN, BACKGROUND_IMAGE} = require('./config.js');

const client = new Discord.Client();
const webhookClient = new Discord.WebhookClient(WEBHOOK_ID, WEBHOOK_TOKEN);

const url = `https://www.fit.ba/student/login.aspx`;
const news = {
    title: "",
    url: "",
    date: "",
    subject: "",
    author: "",
    description: ""
}

client.on('ready', () => {
    client.user.setActivity('DLWMS', { type: 'WATCHING' })
    console.log(`Primed and ready!`);

    (async () => {
        while(true)  {
            await Scraper();
            await sleep(300000);
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
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await pageLogin(page);
    
    const content = await page.content();
    const $ = cheerio.load(content);

    const title = $("#lnkNaslov").slice(0,1).text();
    const date = $("#lblDatum").slice(0,1).text();
    if (title == news.title) {
        if (date == news.date) {
            return null;
        }
    }

    $('.newslist').slice(0, 1).each(function() {
        const title = $(this).find('#lnkNaslov').text();
        const url = $(this).find('#lnkNaslov').attr('href');
        const date = $(this).find('#lblDatum').text();
        const subject = $(this).find('#lblPredmet').text();
        const author = $(this).find('#HyperLink9').text();
        const description = $(this).find('.abstract').text();

        news.title = title;
        news.url = url;
        news.date = date;
        news.subject = subject;
        news.author = author;
        news.description = description;
    })

    sendMessage();

    await page.goto("https://www.fit.ba/student/logout.aspx")
    browser.close();
    return undefined;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sendMessage() {
    const newsEmbed = new Discord.MessageEmbed()
        .setTitle(news.title)
        .setURL(`https://www.fit.ba/student/${news.url}`)
        .setAuthor(news.author)
        .setDescription(news.description)
        .setThumbnail(BACKGROUND_IMAGE)
        .setTimestamp()
        .setFooter('Mesh Scraper', '');

    webhookClient.send('@everyone', {
        embeds: [newsEmbed],
    });
}

client.login(BOT_TOKEN);