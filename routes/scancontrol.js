const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');

const baseURL = process.env.NEXPOSE_BASE_URL;
const auth = {
  username: process.env.NEXPOSE_USERNAME,
  password: process.env.NEXPOSE_PASSWORD
};
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// GET: 스캔 목록 조회 및 렌더링
router.get('/', async (req, res) => {
  try {
    // 현재 실행 중인(active) 스캔만 가져오기
    const response = await axios.get(`${baseURL}/scans?active=true`, {
      auth,
      httpsAgent,
      headers: { 'Content-Type': 'application/json' }
    });

    const activeScans = response.data.resources || [];
    res.render('scancontrol', { activeScans }); // EJS로 전달
  } catch (err) {
    const errorDetail = JSON.stringify(err.response?.data || err.message, null, 2);
    res.status(500).send(`<h2>❌ 스캔 목록 로드 실패:<br><pre>${errorDetail}</pre></h2><a href="/">홈으로</a>`);
  }
});

// POST: 스캔 상태 변경
router.post('/', async (req, res) => {
  const { scanId, status } = req.body;

  try {
    const response = await axios.post(`${baseURL}/scans/${scanId}/${status}`, {}, {
      auth,
      httpsAgent,
      headers: { 'Content-Type': 'application/json' }
    });

    res.send(`<h2>✅ 스캔 ${status} 성공! Scan ID: ${scanId}</h2><a href="/">홈으로</a>`);
  } catch (err) {
    const errorDetail = JSON.stringify(err.response?.data || err.message, null, 2);
    res.status(500).send(`<h2>❌ 스캔 제어 실패:<br><pre>${errorDetail}</pre></h2><a href="/scancontrol">다시 시도</a>`);
  }
});

module.exports = router;
