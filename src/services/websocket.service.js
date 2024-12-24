const { wsAuthMiddleware } = require("../middleware/auth.middleware");
const examService = require("./exam.service");

exports.initWebSocket = (io) => {
    const examNamespace = io.of("/exam");
    examNamespace.use(wsAuthMiddleware);

    // 시험별 타이머 저장소
    const examTimers = new Map();

    examNamespace.on("connection", (socket) => {
        console.log("Client connected:", socket.userId);

        socket.on("join_exam", async (examId) => {
            const roomName = `exam:${examId}`;
            socket.join(roomName);
            console.log(`User ${socket.userId} joined ${roomName}`);

            // 기존 타이머가 없으면 새로 시작
            if (!examTimers.has(roomName)) {
                const timer = setInterval(async () => {
                    try {
                        const timeInfo = await examService.getTime(
                            examId,
                            socket.userId
                        );
                        if (timeInfo) {
                            examNamespace
                                .to(roomName)
                                .emit("time_sync", timeInfo);

                            // 시험 시간 종료시 타이머 정리
                            if (timeInfo.isTimeOver) {
                                clearInterval(examTimers.get(roomName));
                                examTimers.delete(roomName);
                                examNamespace.to(roomName).emit("exam_timeout");
                            }
                        }
                    } catch (error) {
                        console.error("시간 동기화 오류:", error);
                    }
                }, 1000); // 1초마다 업데이트

                examTimers.set(roomName, timer);
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

        socket.on("finish_exam", (examId) => {
            const roomName = `exam:${examId}`;
            socket.leave(roomName);

            // 해당 방의 사용자가 없으면 타이머 정리
            if (examNamespace.adapter.rooms.get(roomName)?.size === 0) {
                clearInterval(examTimers.get(roomName));
                examTimers.delete(roomName);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.userId);
            // 연결이 끊긴 사용자의 방에 아무도 없으면 타이머 정리
            socket.rooms.forEach((roomName) => {
                if (examNamespace.adapter.rooms.get(roomName)?.size === 0) {
                    clearInterval(examTimers.get(roomName));
                    examTimers.delete(roomName);
                }
            });
        });
    });
};
