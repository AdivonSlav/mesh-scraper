# Mesh Scraper
A Node.js script that automatically scrapes the latest news post at www.fit.ba/student/ and sends it to a Discord webhook of your choosing. It is built with Cheerio and Puppeteer to handle HTML extraction and headless browser support respectively. Exclusively for student convenience, the scraped data is merely sent to a Discord news channel through a webhook and not permanently stored anywhere.

If you wish to build and run the code through your own bot, edit the config.js file accordingly and make sure you have the following dependencies installed via npm:

```
discord.js, puppeteer, cheerio, node-fetch
```

