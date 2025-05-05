// npm packages
const puppeteer = require('puppeteer');

// big daddy function
async function scrapeBtcEtfData() {

    // tests'n'shit
    const headless = false;

    // where will ye old puppeteer go?
    const url = 'https://farside.co.uk/bitcoin-etf-flow-all-data/';

    try {

        // launch diz bitch
        const browser = await puppeteer.launch({headless: headless});  // LOCAL
        // const browser = await puppeteer.launch({                          // LIVE SERVER 
        //     executablePath: '/usr/bin/google-chrome',
        //     headless: headless,
        //     args: [
        //         '--no-sandbox',
        //         '--disable-setuid-sandbox'
        //     ]
        // });
        const page = await browser.newPage();

        // lets go to the url
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('table.etf', { timeout: 45000 });

        // evaluate the table (with the class .etf) rows on the page
        let dataRows = await page.$$eval('table.etf tr', rows => {
            
            // where were gonna store the data temp. before returning it
            const parsedData = [];

            // start the loop over each row
            for (const row of rows) {

                // get the table data from the row
                const cells = Array.from(row.querySelectorAll('td')).map(td =>
                    td.innerText.trim()
                );

                // only save rows meeting both conditions:
                    // 1. at least 1 cell in the row
                    // 2. the first cell value in the row not being 'Total', 'Average', 'Maximum' or 'Minimum'
                if (cells.length > 0 && !['Total', 'Average', 'Maximum', 'Minimum'].some(term => cells[0].includes(term))) {

                    // extract the date
                    const date = cells[0];

                    // get the total cell value
                    let totalStr = cells[cells.length - 1].replace(',', '');
                    
                    // check if the cell value has brackets "( )" 
                    let isNegative = /^\(.*\)$/.test(totalStr);
                    
                    // remove the brackets now that we now if the value is a negative or positive for this loop
                    totalStr = totalStr.replace(/[()]/g, '');

                    // Add negative number if bool is negative
                    const total = isNegative ? -parseFloat(totalStr) : parseFloat(totalStr);

                    // push the date and total into the temp. array we made above
                    if (date && total) {
                        parsedData.push({ date, total: parseFloat(total) });
                    };
                };
            };

            // return the filtered list of just the date and total in an array
            return parsedData;
        });

        // more tests'n'shit
        const firstDate = dataRows[0].date;
        const lastDate = dataRows[dataRows.length - 1].date;
        // console.log(`The first date is ${firstDate} and the last date is ${lastDate}`);

        // handlin' dem errors
        if (dataRows.length === 0) {
            console.log('No valid data rows found when navigating to :', url);
            return null;
        };

        // if success, shut that shit down, change the date format, and return success
        if (dataRows) {
            browser.close();

            // change the date from "11 Jan 2024" to 20240111T (YYYYMMDDT)
            dataRows = dataRows.map(entry => {
                const parsedDate = new Date(entry.date);
                const year = parsedDate.getFullYear();
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const day = String(parsedDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}${month}${day}T`;
              
                return {
                  date: formattedDate,
                  total: entry.total
                };
            });

            console.log('Updated dataRows: ', dataRows);
            return dataRows;
        } else {
            browser.close();
            return null;
        };

    } catch (error) {
        console.log('failed to scrape btc data: ', error);
        return null;
    };
};
module.exports = scrapeBtcEtfData;

// run the scrapie scrapie
scrapeBtcEtfData();
