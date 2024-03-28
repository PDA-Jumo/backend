const request = require('request-promise');
const cheerio = require('cheerio');

async function financedata(code){
    const url = `https://fchart.stock.naver.com/sise.nhn?&timeframe=day&count=500&requestType=0&symbol=${code}`;
    
    try {
        const body = await request(url);
        const $ = cheerio.load(body);
        const itemsList = $('item');
        // itemList에서 attribs의 data 값만 추출하여 배열에 저장
        const extractedData = [];
        
        // 마지막 100개의 데이터만 추출
        const startIdx = Math.max(0, itemsList.length - 100);
        const endIdx = itemsList.length;
        for (let i = startIdx; i < endIdx; i++) {
            const item = itemsList[i];
            if (item.attribs && item.attribs.data) {
                const data = item.attribs.data;
                const splitData = data.split('|');
                const extractedItem = {
                    date: splitData[0],
                    close: splitData[4],
                };
                extractedData.push(extractedItem);
            }
        }
    
        return extractedData;
    } catch (error) {
        throw error;
    }
}

module.exports = financedata;
