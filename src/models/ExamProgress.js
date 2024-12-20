const mongoose = require("mongoose");

// 개별 문제 답안 스키마
const examQuestionSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true,
  },
  answer: {
    type: String,
    default: "",
  },
  spentTime: {
    type: Number,
    default: 0,
  },
});

// 시험 진행 상태 스키마
/**
{
    "examId": Long,
    "userId": String,
    "examQuestions": [
        {
            "questionId": Long,
            "answer": String,
            "spentTime": Long
        }
    ],
    "lastQuestionId": Long,
    "timestamp": Date
}
 */
const examProgressSchema = new mongoose.Schema({
  examId: {
    type: Number,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  examQuestions: [examQuestionSchema],
  lastQuestionId: {
    type: Number,
    required: true,
  },
  //시험 시작 시간
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // 실제 시험에 사용한 총 시간 (분)
  totalSpentTime: {
    type: Number,
    default: 0,
  },
  // 마지막 활동 시간 (시간 계산용)
  lastActiveTime: {
    type: Date,
    default: Date.now,
  }
});

// 복합 인덱스 설정 (한 사용자당 하나의 시험 진행상태만 존재)
examProgressSchema.index({ examId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("ExamProgress", examProgressSchema);
