require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { initWebSocket } = require("./service/websocket.service");
const examRoutes = require("./routes/exam.routes");

const app = express();
const httpServer = createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

//MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB 연결 성공"))
    .catch((err) => console.log("MongoDB 연결 실패", err));


// 기본 미들웨어
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// json 파서
app.use(express.json());
// 쿠키 파서
app.use(cookieParser());

// 라우터
app.use("/api/exams", examRoutes);

//Socket.IO 초기화
initWebSocket(io);

const PORT = process.env.PORT || 3443;
httpServer.listen(PORT, () => {
  console.log(`서버 실행 중 포트 : ${PORT}`);
});

module.exports = { app, httpServer };