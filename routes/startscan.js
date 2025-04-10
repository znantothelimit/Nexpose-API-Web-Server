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

// 📌 GET: 스캔 실행 폼 + 사이트 + 엔진 + 템플릿 목록 불러오기
router.get('/', async (req, res) => {
  try {
    // 사이트 최대 1000개까지 조회
    const siteResp = await axios.get(`${baseURL}/sites?size=1000`, { auth, httpsAgent });
    const sites = siteResp.data.resources.map(site => ({
      id: site.id,
      name: site.name
    }));

    const engineResp = await axios.get(`${baseURL}/scan_engines`, { auth, httpsAgent });
    const engines = engineResp.data.resources.map(engine => ({
      id: engine.id,
      name: engine.name
    }));

    const templateResp = await axios.get(`${baseURL}/scan_templates`, { auth, httpsAgent });
    const templates = templateResp.data.resources.map(template => ({
      id: template.id,
      name: template.name
    }));

    res.render('startscan', { sites, engines, templates });
  } catch (err) {
    console.error('[ERROR] 초기 목록 불러오기 실패:', err.message);
    res.status(500).send('사이트, 엔진 또는 템플릿 목록을 불러오는 데 실패했습니다.');
  }
});

// 📌 포함된 자산 가져오기
router.get('/site-assets/:id', async (req, res) => {
  const siteId = req.params.id;

  try {
    const includedResp = await axios.get(`${baseURL}/sites/${siteId}/included_targets`, {
      auth, httpsAgent
    });

    const addresses = includedResp.data.addresses || [];
    res.json({ success: true, addresses });
  } catch (err) {
    console.error(`[ERROR] 자산 목록 조회 실패 (Site ${siteId}):`, err.message);
    res.status(500).json({ success: false, message: '자산 정보를 가져오는 데 실패했습니다.' });
  }
});

// 📌 사이트에 할당된 엔진 가져오기
router.get('/site-engine/:id', async (req, res) => {
  const siteId = req.params.id;

  try {
    const engineResp = await axios.get(`${baseURL}/sites/${siteId}/scan_engine`, {
      auth, httpsAgent
    });

    const engineId = engineResp.data.id;
    res.json({ success: true, engineId });
  } catch (err) {
    console.error(`[ERROR] 스캔 엔진 조회 실패 (Site ${siteId}):`, err.message);
    res.status(500).json({ success: false, message: '엔진 정보를 가져오는 데 실패했습니다.' });
  }
});

// 📌 사이트에 할당된 템플릿 가져오기
router.get('/site-template/:id', async (req, res) => {
  const siteId = req.params.id;

  try {
    const templateResp = await axios.get(`${baseURL}/sites/${siteId}/scan_template`, {
      auth, httpsAgent
    });

    const templateId = templateResp.data.id;
    res.json({ success: true, templateId });
  } catch (err) {
    console.error(`[ERROR] 스캔 템플릿 조회 실패 (Site ${siteId}):`, err.message);
    res.status(500).json({ success: false, message: '템플릿 정보를 가져오는 데 실패했습니다.' });
  }
});

// 📌 POST: 스캔 요청
router.post('/', async (req, res) => {
  const { siteId, host, engineId, templateId } = req.body;

  const hosts = host.split(',').map(h => h.trim()).filter(Boolean);

  const payload = {
    engineId: parseInt(engineId),
    hosts,
    templateId
  };

  console.log('[DEBUG] 스캔 요청 payload ↓↓↓');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${baseURL}/sites/${siteId}/scans`, payload, {
      auth,
      httpsAgent,
      headers: { 'Content-Type': 'application/json' }
    });

    const scanId = response.data.id;
    res.send(`<h2>✅ 스캔 시작됨! Scan ID: ${scanId}</h2><a href="/">홈으로</a>`);
  } catch (err) {
    const errorDetail = JSON.stringify(err.response?.data || err.message, null, 2);
    res.status(500).send(`<h2>❌ 스캔 실패:<br><pre>${errorDetail}</pre></h2><a href="/startscan">다시 시도</a>`);
  }
});

module.exports = router;
