const ExamProgress = require("../models/ExamProgress");

class ExamService {
    // 시험 진행상태 조회
    async getProgress(examId, userId) {
        return await ExamProgress.findOne({ examId, userId });
    }

    // 시험 진행상태 저장
    async saveProgress(examId, userId, examQuestions, lastQuestionId) {
        const currentProgress = await ExamProgress.findOne({ examId, userId });
        const now = new Date();
        let additionalTime = 0;

        if (currentProgress && currentProgress.lastActiveTime) {
            additionalTime = Math.floor(
                (now - currentProgress.lastActiveTime) / (1000 * 60)
            );
        }

        return await ExamProgress.findOneAndUpdate(
            { examId, userId },
            {
                $set: {
                    examQuestions,
                    lastQuestionId,
                    lastActiveTime: now,
                },
                $inc: {
                    totalSpentTime: additionalTime,
                },
            },
            { upsert: true }
        );
    }
    
    // 남은 시간 조회
    async getTime(examId, userId) {
        const progress = await ExamProgress.findOne({ examId, userId });
        if (!progress) {
            return null;
        }

        const now = new Date();
        const examTime = parseInt(process.env.EXAM_TIME); // 총 시험 시간 (분)

        // 시험 시작 시간부터 현재까지의 총 경과 시간 계산 (분 단위)
        const totalElapsedTime =
            (now - new Date(progress.timestamp)) / (1000 * 60);

        // 남은 시험 시간 계산 (소수점 두 자리까지)
        const userExamTime = Math.max(0, examTime - totalElapsedTime).toFixed(
            2
        );

        console.log("시간 계산 디버깅:", {
            now: now.toISOString(),
            examStartTime: progress.timestamp,
            totalElapsedTime,
            examTime,
            userExamTime,
        });

        return {
            examStartTime: progress.timestamp,
            lastActiveTime: now,
            totalSpentTime: totalElapsedTime,
            userExamTime: parseFloat(userExamTime),
            isTimeOver: userExamTime <= 0,
        };
    }

    // 만료된 시험 데이터 삭제
    async deleteExpiredExam(examId, userId) {
        try {
            const result = await ExamProgress.deleteOne({ examId, userId });
            console.log(`시험 데이터 삭제 완료 - examId: ${examId}, userId: ${userId}, deleted: ${result.deletedCount}`);
            return result.deletedCount > 0;
        } catch (error) {
            console.error("시험 데이터 삭제 오류:", error);
            throw error;
        }
    }
}

module.exports = new ExamService();
