// createsite.js
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

// 📌 사이트 생성 폼
router.get('/', async (req, res) => {
  try {
    const [engineResp, templateResp] = await Promise.all([
      axios.get(`${baseURL}/scan_engines`, { auth, httpsAgent }),
      axios.get(`${baseURL}/scan_templates`, { auth, httpsAgent })
    ]);

    const engines = engineResp.data.resources.map(engine => ({
      id: engine.id,
      name: engine.name
    }));

    const templates = templateResp.data.resources.map(template => ({
      id: template.id,
      name: template.name
    }));

    res.render('createsite', { engines, templates });
  } catch (err) {
    console.error('[ERROR] 엔진 또는 템플릿 목록 조회 실패:', err.message);
    res.status(500).send('스캔 엔진 및 템플릿 정보를 불러오는 데 실패했습니다.');
  }
});

// 📌 사이트 생성 처리
router.post('/', async (req, res) => {
  const {
    name, target, excluded,
    service, username, password, domain,
    permissionElevation,
    permissionElevationUsername,
    permissionElevationPassword,
    hostRestriction,
    portRestriction,
    engineId,
    scanTemplateId
  } = req.body;

  const payload = {
    name,
    description: "Created from Express UI",
    importance: "normal",
    engineId: parseInt(engineId),
    scan: {
      assets: {
        includedTargets: {
          addresses: [target]
        }
      }
    },
    scanTemplateId
  };

  console.log('[DEBUG] 사이트 생성 payload ↓↓↓');
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(`${baseURL}/sites`, payload, {
      auth,
      httpsAgent,
      headers: { 'Content-Type': 'application/json' }
    });

    const siteId = response.data.id;
    console.log(`[INFO] 사이트 생성 완료. siteId = ${siteId}`);

    if (excluded) {
      const excludeList = excluded.split(',').map(e => e.trim()).filter(Boolean);
      if (excludeList.length > 0) {
        await axios.post(`${baseURL}/sites/${siteId}/excluded_targets`, excludeList, {
          auth,
          httpsAgent,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`[INFO] 제외 대상 추가됨: ${excludeList.join(', ')}`);
      }
    }

    if (username && password && service) {
      const credPayload = {
        name: `${name}-credential`,
        enabled: true,
        hostRestriction: hostRestriction || target,
        account: {
          service,
          username,
          password
        }
      };

      if (portRestriction) credPayload.portRestriction = parseInt(portRestriction);
      if (domain) credPayload.account.domain = domain;
      if (permissionElevation && permissionElevation !== 'none') {
        credPayload.account.permissionElevation = permissionElevation;
        if (permissionElevationUsername)
          credPayload.account.permissionElevationUsername = permissionElevationUsername;
        if (permissionElevationPassword)
          credPayload.account.password = permissionElevationPassword;
      }

      console.log('[DEBUG] 자격증명 생성 payload ↓↓↓');
      console.log(JSON.stringify(credPayload, null, 2));

      await axios.post(`${baseURL}/sites/${siteId}/site_credentials`, credPayload, {
        auth,
        httpsAgent,
        headers: { 'Content-Type': 'application/json' }
      });

      return res.send(`<h2>✅ 사이트 + 자격증명 + 제외 대상 생성 완료!<br>Site ID: ${siteId}</h2><a href="/">홈으로</a>`);
    }

    res.send(`<h2>✅ 사이트 생성 완료! ID: ${siteId}<br>(자격증명 없음)</h2><a href="/">홈으로</a>`);

  } catch (err) {
    const errorDetail = JSON.stringify(err.response?.data || err.message, null, 2);
    res.status(500).send(`<h2>❌ 요청 실패:<br><pre>${errorDetail}</pre></h2><a href="/createsite">다시 시도</a>`);
  }
});

module.exports = router;
