const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');
require('dotenv').config();

const baseURL = process.env.NEXPOSE_BASE_URL;
const auth = {
  username: process.env.NEXPOSE_USERNAME,
  password: process.env.NEXPOSE_PASSWORD
};
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// GET: 보고서 생성 폼 - 보고서 이름 드롭다운으로
router.get('/', async (req, res) => {
  try {
    const reportList = await axios.get(`${baseURL}/reports`, { auth, httpsAgent });
    const reports = reportList.data.resources || [];
    res.render('generatereport', { reports });
  } catch (err) {
    const errorDetail = JSON.stringify(err.response?.data || err.message, null, 2);
    res.status(500).send(`<h2>❌ 보고서 목록 로딩 실패</h2><pre>${errorDetail}</pre>`);
  }
});

// POST: 보고서 생성 요청
router.post('/', async (req, res) => {
  const { reportId } = req.body;

  try {
    const response = await axios.post(
      `${baseURL}/reports/${reportId}/generate`,
      {},
      { auth, httpsAgent }
    );

    const instanceId = response.data.id;
    res.send(`<h2>✅ 보고서 생성 요청 완료! 인스턴스 ID: ${instanceId}</h2><a href="/">홈으로</a>`);
  } catch (error) {
    const errDetail = JSON.stringify(error.response?.data || error.message, null, 2);
    res.send(`<h2>❌ 보고서 생성 실패: ${error.message}</h2><pre>${errDetail}</pre><a href="/generatereport">다시 시도</a>`);
  }
});

module.exports = router;