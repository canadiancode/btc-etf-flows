const fs   = require('fs');
const path = require('path');

async function generatePineScript() {

    // 1. Read CSV
    const csvPath = path.join(__dirname, 'Bitcoin-ETF-Flow-Data', 'data', 'BTC_ETF_INFLOWS_OUTFLOWS.csv');
    let lines;
    try {
        const text = await fs.promises.readFile(csvPath, 'utf8');
        lines = text.trim().split('\n');
    } catch (error) {
        console.error('Failed to read CSV at:', csvPath);
        return;
    };

    // 2. Parse and filter
    const tsCalls = [];
    const flowVals = [];
    for (let i = 1; i < lines.length; i++) {
        const [rawDate, rawFlow] = lines[i].split(',').map(s => s.trim());

        // Skip if date is missing
        if (!rawDate) 
        continue;

        // Strip quotes and trailing T, expect exactly 8 digits YYYYMMDD
        const d = rawDate.replace(/["T]/g, '');
        if (d.length !== 8 || !/^\d{8}$/.test(d))
        continue;

        const yr = d.slice(0,4),
        mo = d.slice(4,6),
        da = d.slice(6,8);

        // Parse flow and skip if not a number
        const flowNum = parseFloat(rawFlow);
        if (isNaN(flowNum))
        continue;

        tsCalls.push(`timestamp("UTC",${yr},${mo},${da},00,00)`);
        flowVals.push(flowNum);
    };

    // 3. Set up the hard coded values
    // const timeValues = `array.from(timestamp("UTC", 2024, 01, 11, 00, 00),timestamp("UTC", 2024, 01, 12, 00, 00),timestamp("UTC", 2024, 01, 16, 00, 00))`;
    // const flowValues = `array.from(655.3,203.0,-52.7)`;
    const timeValues = `array.from(${tsCalls.join(',')})`;
    const flowValues = `array.from(${flowVals.join(',')})`;
  
    // 4. Build the PineScript text
    const pine = 
`
//@version=6
indicator("Bitcoin ETF Flows ($M)", overlay=false)

// Data fetched from the following site: https://farside.co.uk/bitcoin-etf-flow-all-data/

// 1. Define  data: use int[] for timestamps, float[] for flows
var int[] dates = ${timeValues}
var float[] flows = ${flowValues}

// 2. Match each bars time to the BTC daily chart
float etfFlow = na
for i = 0 to array.size(dates) - 1
    if time == array.get(dates, i)
        etfFlow := array.get(flows, i)

// 3. Plot a histogram in new pane
plot(etfFlow,title="ETF Inflow/Outflow (M)",style=plot.style_columns,color = etfFlow >= 0 ? color.new(color.green, 0) : color.new(color.red, 0))
`;

    // console.log('The created PineScript code: ', pine);
    return pine;
};
generatePineScript();

module.exports = generatePineScript;
