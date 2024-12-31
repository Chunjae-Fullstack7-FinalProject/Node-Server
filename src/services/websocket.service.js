const { wsAuthMiddleware } = require("../middleware/auth.middleware");
const examService = require("./exam.service");

exports.initWebSocket = (io) => {
    const examNamespace = io.of("/exam");
    examNamespace.use(wsAuthMiddleware);

    const userTimers = new Map();
    const SYNC_INTERVAL = 15000; // 15초마다 서버와 동기화

    examNamespace.on("connection", (socket) => {
        console.log("Client connected:", socket.userId);

        socket.on("join_exam", async (examId) => {
            const roomName = `exam:${examId}`;
            const timerKey = `${socket.userId}:${examId}`;
            socket.join(roomName);
            console.log(`User ${socket.userId} joined ${roomName}`);

            // 초기 시간 정보 전송
            try {
                const timeInfo = await examService.getTime(examId, socket.userId);
                if (timeInfo) {
                    socket.emit("time_sync", timeInfo);
                }
            } catch (error) {
                console.error("초기 시간 동기화 오류:", error);
            }

            // 주기적 동기화 타이머 설정
            if (!userTimers.has(timerKey)) {
                const timer = setInterval(async () => {
                    try {
                        const timeInfo = await examService.getTime(examId, socket.userId);
                        if (timeInfo) {
                            socket.emit("time_sync", timeInfo);

                            if (timeInfo.isTimeOver) {
                                clearInterval(userTimers.get(timerKey));
                                userTimers.delete(timerKey);
                                socket.emit("exam_timeout");
                                await examService.deleteExpiredExam(examId, socket.userId);
                                socket.leave(roomName);
                            }
                        }
                    } catch (error) {
                        console.error("시간 동기화 오류:", error);
                    }
                }, SYNC_INTERVAL);

                userTimers.set(timerKey, timer);
            }
        });

        socket.on("save_progress", async (data) => {
            try {
                await examService.saveProgress(
                    data.examId,
                    socket.userId,
                    data.examQuestions,
                    data.lastQuestionId
                );
                const roomName = `exam:${data.examId}`;
                examNamespace.to(roomName).emit("progress_saved", {
                    userId: socket.userId,
                    success: true,
                });
            } catch (error) {
                console.error("저장 오류:", error);
                socket.emit("error", { message: "저장 실패" });
            }
        });

        socket.on("finish_exam", async (examId) => {
            try {
                const roomName = `exam:${examId}`;
                const timerKey = `${socket.userId}:${examId}`;
                
                // 타이머 정리
                if (userTimers.has(timerKey)) {
                    clearInterval(userTimers.get(timerKey));
                    userTimers.delete(timerKey);
                }
                
                // 시험 데이터 삭제
                await examService.deleteExpiredExam(examId, socket.userId);
                
                socket.leave(roomName);
                console.log(`User ${socket.userId} finished exam ${examId}`);
            } catch (error) {
                console.error("시험 종료 처리 오류:", error);
                socket.emit("error", { message: "시험 종료 처리 실패" });
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.userId);
            
            // 해당 사용자의 모든 타이머 정리
            for (const [timerKey, timer] of userTimers.entries()) {
                if (timerKey.startsWith(`${socket.userId}:`)) {
                    clearInterval(timer);
                    userTimers.delete(timerKey);
                }
            }
        });

        socket.on("restart_exam", async (examId) => {
            await examService.deleteExpiredExam(examId, socket.userId);
        });
    });
};
