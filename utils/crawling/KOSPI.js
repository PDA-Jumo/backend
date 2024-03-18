var axios = require("axios");
var cheerio = require("cheerio");

const url = "https://finance.naver.com/";

const crawlingLiveSise = async () => {
  const siseData = await axios.get(url).then((res) => {
    const $ = cheerio.load(res.data);
    const liveSise = $(".num_quot")
      .text()
      .replace(/[^0-9.-]+/g, "\n"); // 숫자 외의 문자 제거
    const livePersonalInfo = $(".dl")
      .text()
      .replace(/[^0-9.-]+/g, "\n");
    console.log(liveSise);
    return liveSise;
  });

  return siseData;
};

crawlingLiveSise();
