const router = require("express").Router();
const examController = require("../controllers/exam.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

// 시험 진행상태 조회
// /: == pathVariable
router.get("/:examId", authMiddleware, examController.getProgress);
// 시험 진행상태 저장
router.post("/:examId", authMiddleware, examController.saveProgress);
//남은 시간 조회
router.get("/:examId/time", authMiddleware, examController.getTime);

module.exports = router;