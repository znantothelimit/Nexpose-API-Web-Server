const express = require('express');
const path = require('path');
require('dotenv').config();

// 라우터 임포트
const indexRouter = require('./routes/index');
const createSiteRouter = require('./routes/createsite');
const startscanRouter = require('./routes/startscan');
const scancontrolRouter = require('./routes/scancontrol');
const scanresultRouter = require('./routes/scanresult');
const reportconfigRouter = require('./routes/reportconfig');
const generateReportRouter = require('./routes/generatereport');

const app = express();

// 정적 파일 경로 및 미들웨어 설정
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS 템플릿 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 라우터 등록
app.use('/', indexRouter); // 홈
app.use('/createsite', createSiteRouter); // 사이트 생성
app.use('/startscan', startscanRouter);
app.use('/scancontrol', scancontrolRouter);
app.use('/scanresult', scanresultRouter);
app.use('/reportconfig', reportconfigRouter);
app.use('/generatereport', generateReportRouter);

// 서버 시작
app.listen(3000, () => {
  console.log('서버 실행 중: http://localhost:3000');
});
