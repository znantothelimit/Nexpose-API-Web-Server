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

// 최근 30개 스캔 목록 조회
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${baseURL}/scans?size=30&sort=startTime,DESC`, {
      auth,
      httpsAgent
    });

    const scans = response.data.resources || [];
    res.render('scanresult', { scans });
  } catch (err) {
    const errorDetail = JSON.stringify(err.response?.data || err.message, null, 2);
    res.status(500).send(`<h2>❌ 스캔 목록 로드 실패:<br><pre>${errorDetail}</pre></h2><a href="/">홈으로</a>`);
  }
});

// AJAX 요청을 통해 스캔 요약 정보만 반환
router.get('/summary/:scanId', async (req, res) => {
  const { scanId } = req.params;

  try {
    const response = await axios.get(`${baseURL}/scans/${scanId}`, {
      auth,
      httpsAgent
    });

    const data = response.data;
    const vuln = data.vulnerabilities || {};

    // JSON 형식으로 응답
    res.json({
      scanName: data.scanName,
      status: data.status,
      startedBy: data.startedByUsername,
      startTime: data.startTime,
      endTime: data.endTime || '-',
      vulnerabilities: {
        critical: vuln.critical || 0,
        severe: vuln.severe || 0,
        moderate: vuln.moderate || 0,
        total: vuln.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
