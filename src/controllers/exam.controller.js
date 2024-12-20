const ExamProgress = require("../models/ExamProgress");

// 시험 진행상태 조회
exports.getProgress = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.userId;
    console.log("exam.controller.js, getProgress : ", examId, userId);

    const progress = await ExamProgress.findOne({
      examId,
      userId,
    });

    if (!progress) {
      return res.json({ message: "이전 시험 진행 상태가 없습니다." });
    }

    res.json(progress);
  } catch (error) {
    console.error("시험 진행상태 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 시험 진행상태 저장
exports.saveProgress = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.userId;
    const { examQuestions, lastQuestionId } = req.body;

    // 현재 진행상태 조회
    const currentProgress = await ExamProgress.findOne({ examId, userId });
    
    const now = new Date();
    let additionalTime = 0;
    
    if (currentProgress && currentProgress.lastActiveTime) {
      // 마지막 활동시��부터 현재까지의 시간을 계산 (분 단위)
      additionalTime = Math.floor((now - currentProgress.lastActiveTime) / (1000 * 60));
    }

    await ExamProgress.findOneAndUpdate(
      { examId, userId },
      {
        $set: {
          examQuestions,
          lastQuestionId,
          lastActiveTime: now,
        },
        $inc: {
          totalSpentTime: additionalTime // 경과 시간 누적
        }
      },
      { upsert: true }
    );

    res.json({
      message: "시험 진행상태 저장 완료",
      success: true,
    });
  } catch (error) {
    console.error("시험 진행상태 저장 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};


/**
 * req
 * examId : number (pathVariable)
 * userId : string (cookie)
 *
 * res
 * {
 *  userExamTime : number,
 *  isTimeOver : boolean
 * }
 *
 */
// 남은 시간 조회
exports.getTime = async (req, res) => {
  try {
    const userId = req.userId;
    const examId = req.params.examId;

    const progress = await ExamProgress.findOne({
      userId,
      examId,
    });

    if (!progress) {
      return res.json({ message: "이전 시험 진행 상태가 없습니다." });
    }

    const examTime = parseInt(process.env.EXAM_TIME); // 전체 시험 시간 (분)
    const userExamTime = examTime - progress.totalSpentTime; // 남은 시간

    res.json({
      time: progress.timestamp,
      userExamTime: userExamTime,
      isTimeOver: userExamTime <= 0
    });
  } catch (error) {
    console.error("남은 시간 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};
