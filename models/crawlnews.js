const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');


async function crawlnews(code) {
    
    const url = `https://finance.naver.com/item/main.naver?code=${code}`;
    let resp = await axios.get(url, {
        responseType: 'arraybuffer',
        responseEncoding: 'binary',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        }
    });
    let content = iconv.decode(resp.data, 'euc-kr');
    let $ = cheerio.load(content);

    const jjinlist = $('#content > div.section.new_bbs > div.sub_section.news_section > ul > li').map((i, el) => {
        let title = $(el).find('span > a').text();
        let url = $(el).find('span > a').prop('href');

        const relatedIndex = title.indexOf('관련');
        if (relatedIndex !== -1) {
            title = title.substring(0, relatedIndex).trim();
        
        }
        return {
            title,
            url
        };
    }).toArray();

    return jjinlist;
}


module.exports = crawlnews;