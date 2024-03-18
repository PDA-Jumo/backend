var express = require("express");
var router = express.Router();
var axios = require("axios");
const { crawlingLiveSise } = require("../utils/crawling/KOSPI");

// 마켓 이슈 GET
router.get("/issue", async (req, res, next) => {
  try {
    const apiKey = req.headers.apikey;

    const responseFromShinhan = await axios.get(
      "https://gapi.shinhaninvest.com:8443/openapi/v1.0/strategy/market-issue",
      {
        headers: {
          apiKey: apiKey,
        },
      }
    );
    const issueData = responseFromShinhan.data.dataBody.list;

    res.json(issueData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 코스피 코스닥 지수, (개인/외국인/기관) 정보
// router.get("/liveSise", async(req, res, next)=>{
//   try {
//     const liveSise = await crawlingLiveSise();

//   }
// })

module.exports = router;
