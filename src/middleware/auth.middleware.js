const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies[process.env.JWT_COOKIE_NAME];
    console.log(token);
    if (!token) {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }

    // JWT 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.sub;
    console.log(req.userId);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
    console.error("토큰 검증 오류:", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};
