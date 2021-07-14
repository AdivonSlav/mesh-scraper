const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const Discord = require('discord.js');
const fetch = require('node-fetch');

const {LOGIN_USERNAME, LOGIN_PASSWORD, BACKGROUND_IMAGE, WEBHOOK_ID, WEBHOOK_TOKEN, JSON_URL } = require('./config.js');

////////////////////////////////////////////////////

// The url from which it scrapes and the webhook client that it will eventually send the data to
const url = "https://www.fit.ba/student/login.aspx";
const webhookClient = new Discord.WebhookClient(WEBHOOK_ID, WEBHOOK_TOKEN);

// Async function to handle logging into the site through the Puppeteer browser
async function pageLogin(page) {
    try {
        await page.goto(url);
    } catch (error) {
        console.log("SCRAPER: " + error);
        return false;
    }
    
    // Try-catches the login process
    try {
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
        
        console.log("SCRAPER: Logged in succesfully.")
        return true;
    } catch (error) {
        console.log("SCRAPER Error: " + error);
        return false;
    }
}

// Here, using the Cheerio library, we extract the HTML elements we need, parse them as strings and pass into the news object
async function Scraper() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    var logged = false;

    while (logged == false) {
        logged = await pageLogin(page);
        if (logged) {
            break;
        }
        await sleep(300000);
    }
    
    while (logged == true) {
        const content = await page.content();
        const $ = cheerio.load(content);
        const news = {
            title: "",
            url: "",
            date: "",
            subject: "",
            author: "",
            description: ""
        }
        
        const titleTag = $("#lnkNaslov").slice(0,1).text();

        if (await checkLast(titleTag) != false && titleTag != "") {
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
            
            sendMessage(news);
        }

        await writeData(titleTag);
        
        try {
            await sleep(300000);
            await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
            
        } catch (error) {
            console.log("SCRAPER Error: " + error);
            return null;
        }
    }
}

// Simple sleep function in ms
function sleep(ms) {
    console.log("SCRAPER: Sleeping for " + ms);
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Creates a Discord Embed and fills it with the scraped data then makes a HTTP request to the webhook in order to post the embed
function sendMessage(news) {

    // 03.07.2021 10:25
    try {
        var day = news.date.substr(0,2);
        var month = news.date.substr(3,2);
        var year = news.date.substr(6,4);
        var hour = news.date.substr(11, 2);
        var minute = news.date.substr(14, 2);
    } catch (error) {
        console.log("SCRAPER Error: " + error);
    }
    
    const dFormat = `${day}.${month}.${year} ${hour}:${minute}`;

    const newsEmbed = new Discord.MessageEmbed()
        .setTitle(news.title)
        .setURL(`https://www.fit.ba/student/${news.url}`)
        .setAuthor(news.author)
        .setDescription(news.description)
        .setThumbnail(BACKGROUND_IMAGE)
        .setFooter(`Roku - ${dFormat}`, '');

    console.log("SCRAPER: Sending new post...");
    webhookClient.send('', {
        embeds: [newsEmbed],
    });
}

async function writeData(titleTag) {
    const payload = {
        title: titleTag
    }

    fetch(JSON_URL, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(response => response.json())
        .then(payload => {
            console.log('SCRAPER: Posted new title to JSON:', payload);
        })
        .catch((error) => {
            console.error('SCRAPER Error:', error);
        });
}

async function checkLast(titleTag) {
    
    try {
        var response = await fetch(JSON_URL);
        var obj = await response.json();
    } catch (error) {
        console.error("SCRAPER Error: " + error);
    }

    if (obj.title == titleTag) {
        return false;
    }

    return true;
}

// Actual run block // 
try {
    (async() => {
        Scraper();
    }
    )();
} catch (error) {
    console.error(error);    
}