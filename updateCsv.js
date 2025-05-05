// npm packages
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('json2csv');

// path of the downloaded .csv from Github
const csvPath = path.join(__dirname, 'Bitcoin-ETF-Flow-Data', 'data', 'BTC_ETF_INFLOWS_OUTFLOWS.csv');

// update the .csv with only new rows
async function updateCsv(newData) {

    // get existing list
    const existing = await loadExistingCsv();

    // check which new rows are not within the current .csv
    const additions = newData.filter(entry => !existing.has(entry.date));

    // if no additions are present, we're all up to date
    if (additions.length === 0) {
        console.log('No new data to append.');
        return;
    };

    // prepares the data to get added to the .csv file
    const csvData = additions.map(row => ({ Date: row.date, Total: row.total }));
    const csvString = parse(csvData, { header: false });

    // Ensure the CSV file and folder exist
    if (!fs.existsSync(csvPath)) {
        fs.mkdirSync(path.dirname(csvPath), { recursive: true });
        fs.writeFileSync(csvPath, 'Date,Total\n');
    };

    // appends new data to the end of the existing CSV file
    fs.appendFileSync(csvPath, '\n' + csvString);
    console.log(`Appended ${additions.length} new entries to CSV.`);
};
module.exports = updateCsv;

// call her back functions
function loadExistingCsv() {
    return new Promise((resolve, reject) => {

        // create a map to store existing date => total mappings
        const existing = new Map();

        // Ensure the CSV file and folder exist
        if (!fs.existsSync(csvPath)) {
            fs.mkdirSync(path.dirname(csvPath), { recursive: true });
            fs.writeFileSync(csvPath, 'Date,Total\n');
        };

        // start reading the .csv file as a stream (doesn't load whole file in memory)
        fs.createReadStream(csvPath)
            .pipe(csv()) // pipe the stream into the CSV parser to automatically parses rows
            .on('data', row => {
                // Add the date and total value to the Map
                // "row.Date" comes from the CSV header, and "row.Total" is the value in that row
                existing.set(row.Date, parseFloat(row.Total));
            })

            // once the entire CSV has been read, return the full Map of existing entries
            .on('end', () => {
                resolve(existing);
            })

            // If any error occurs during reading or parsing reject the promise with the error
            .on('error', reject);
    });
};
