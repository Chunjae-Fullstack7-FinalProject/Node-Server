require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { initWebSocket } = require("./services/websocket.service");
const examRoutes = require("./routes/exam.routes");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

//MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB 연결 성공"))
    .catch((err) => console.log("MongoDB 연결 실패", err));

// 기본 미들웨어
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// 라우터
app.use("/api/exams", examRoutes);

// Socket.IO 초기화
initWebSocket(io);

const PORT = process.env.PORT || 3443;
httpServer.listen(PORT, () => {
  console.log(`서버 실행 중 포트 : ${PORT}`);
});

module.exports = { app, httpServer };