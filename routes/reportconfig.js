const express = require('express');
const router = express.Router();
const axios = require('axios');
const https = require('https');

require('dotenv').config();

const baseURL = process.env.NEXPOSE_BASE_URL;
const auth = {
  username: process.env.NEXPOSE_USERNAME,
  password: process.env.NEXPOSE_PASSWORD,
};
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// 📄 GET: 보고서 설정 폼 페이지 렌더링
router.get('/', async (req, res) => {
  try {
    const [sitesRes, templatesRes, formatsRes] = await Promise.all([
      axios.get(`${baseURL}/sites?size=1000`, { auth, httpsAgent }),
      axios.get(`${baseURL}/report_templates`, { auth, httpsAgent }),
      axios.get(`${baseURL}/report_formats`, { auth, httpsAgent })
    ]);

    const sites = sitesRes.data.resources || [];
    const templates = templatesRes.data.resources || [];
    const formats = formatsRes.data.resources || [];

    res.render('reportconfig', { sites, templates, formats });
  } catch (error) {
    console.error('[ERROR] 초기 설정 로딩 실패:', error.message);
    res.status(500).send(`<h2>❌ 초기 설정 정보 로딩 실패</h2><pre>${error.message}</pre>`);
  }
});

// 📄 GET: 선택한 사이트에 속한 스캔 목록 반환 (AJAX)
router.get('/scans/:siteId', async (req, res) => {
  const { siteId } = req.params;

  try {
    const scanRes = await axios.get(`${baseURL}/sites/${siteId}/scans?size=100&sort=startTime,DESC`, {
      auth,
      httpsAgent
    });

    const scans = scanRes.data.resources || [];
    res.json(scans);
  } catch (error) {
    console.error('[ERROR] 사이트별 스캔 목록 조회 실패:', error.message);
    res.status(500).json({ error: '스캔 목록 조회 실패' });
  }
});

// 📤 POST: 보고서 생성 요청
router.post('/', async (req, res) => {
  const { scanId, template, format, name, language, query } = req.body;

  const reportConfig = {
    name: name || "Custom Report",
    template,
    format,
    language: language || "en-US",
    scope: {
      scan: parseInt(scanId)
    }
  };
  
  // sql-query일 경우 query와 version 추가
  if (format === "sql-query") {
    reportConfig.query = query || "";
    reportConfig.version = "2.3.0"; // ✅ 이 부분 추가
  }  

  console.log('[DEBUG] 전송할 보고서 설정 URL:', `${baseURL}/reports`);
  console.log('[DEBUG] 보고서 설정 payload:', JSON.stringify(reportConfig, null, 2));

  try {
    const response = await axios.post(`${baseURL}/reports`, reportConfig, {
      auth,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.send(`<h2>✅ 보고서 설정 완료! Report ID: ${response.data.id}</h2><a href="/">홈으로</a>`);
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error('[ERROR] 보고서 설정 실패:', errorMsg);
    res.send(`<h2>❌ 보고서 설정 실패: ${error.message}</h2><pre>${JSON.stringify(errorMsg, null, 2)}</pre><a href="/reportconfig">다시 시도</a>`);
  }
});

module.exports = router;
