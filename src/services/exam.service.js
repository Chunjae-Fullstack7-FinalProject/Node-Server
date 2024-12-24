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
        const progress = await ExamProgress.findOne({ userId, examId });
        if (!progress) {
            return null;
        }

        const now = new Date();
        const examTime = parseInt(process.env.EXAM_TIME); // 총 시험 시간 (분)
        let totalSpentTime = progress.totalSpentTime; // 이전까지 누적된 시간

        // 마지막 활동 이후 경과 시간 계산 (분 단위)
        if (progress.lastActiveTime) {
            const additionalTime = Math.floor(
                (now - progress.lastActiveTime) / (1000 * 60)
            );
            totalSpentTime += additionalTime;
        }

        // 남은 시험 시간 계산
        const userExamTime = Math.max(0, examTime - totalSpentTime);

        return {
            examStartTime: progress.timestamp, // 최초 시험 시작 시간
            lastActiveTime: progress.lastActiveTime, // 마지막 활동 시간
            totalSpentTime: totalSpentTime, // 총 사용 시간
            userExamTime: userExamTime, // 남은 시험 시간
            isTimeOver: userExamTime <= 0,
        };
    }
}

module.exports = new ExamService();
