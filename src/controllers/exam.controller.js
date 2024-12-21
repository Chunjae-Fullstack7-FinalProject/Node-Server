const examService = require('../services/exam.service');

// 시험 진행상태 조회
exports.getProgress = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.userId;
    console.log("exam.controller.js, getProgress : ", examId, userId);

    const progress = await examService.getProgress(examId, userId);

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

    await examService.saveProgress(examId, userId, examQuestions, lastQuestionId);

    res.json({
      message: "시험 진행상태 저장 완료",
      success: true,
    });
  } catch (error) {
    console.error("시험 진행상태 저장 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 남은 시간 조회
exports.getTime = async (req, res) => {
  try {
    const userId = req.userId;
    const examId = req.params.examId;
    console.log("exam.controller.js, getTime : ", userId, examId);

    const timeInfo = await examService.getTime(examId, userId);

    if (!timeInfo) {
      return res.json({ message: "이전 시험 진행 상태가 없습니다." });
    }

    res.json(timeInfo);
  } catch (error) {
    console.error("남은 시간 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
};
