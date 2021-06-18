# Mesh Scraper
A Node.js Discord bot that automatically scrapes the latest news post at www.fit.ba/student/ and sends it to a webhook of your choosing. It is built with Cheerio and Puppeteer to handle HTML extraction and headless browser support respectively. Exclusively for student convenience, the scraped data is merely sent to a Discord channel through a webhook.

If you wish to build and run the code through your own bot, edit the config.js file accordingly and make sure you have the following dependencies:

```
discord.js, puppeteer, cheerio
```

