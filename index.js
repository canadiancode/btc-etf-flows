// npm packages
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');

// external js
const scrapeBtcEtfData = require('./scrape');
const updateCsv = require('./updateCsv');
const generatePineScript = require('./configurePineScript');

// dat higher order function
async function updateBtcEtfFlows() {
    
    try {

        // scrape the site
        const scrapedData = await scrapeBtcEtfData();
        if (!scrapedData || scrapedData.length === 0) {
            console.error('No scraped data found.');
            return;
        };

        // update the csv with any new values
        await updateCsv(scrapedData);
        console.log('Updated local .csv');

        // generate code not using ai
        const theCode = await generatePineScript();

    } catch (error) {
        console.error('❌ Failed to update BTC ETF flow data:', error);
    };
};
// updateBtcEtfFlows(); // run dis bitch

// run every hour
cron.schedule('0 * * * *', async () => {
    const nowPST = moment().tz('America/Los_Angeles'); // PST timezone cause west coast is best coast

    // check if we are at the 8th hour (8am)
    if (nowPST.hour() === 8) {
      console.log(`⏰ Running BTC ETF update at ${nowPST.format()}`);
      await updateBtcEtfFlows();
    } else {
        console.log(`btc-etf-flows is live, and is on hour ${nowPST.hour()}`);
    };
});
