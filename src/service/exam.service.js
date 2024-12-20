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
      additionalTime = Math.floor((now - currentProgress.lastActiveTime) / (1000 * 60));
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
          totalSpentTime: additionalTime
        }
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

    const examTime = parseInt(process.env.EXAM_TIME);
    const userExamTime = examTime - progress.totalSpentTime;

    return {
      time: progress.timestamp,
      userExamTime,
      isTimeOver: userExamTime <= 0
    };
  }
}

module.exports = new ExamService();