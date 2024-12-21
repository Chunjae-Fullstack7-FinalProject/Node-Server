const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies[process.env.JWT_COOKIE_NAME];
        console.log(token);
        if (!token) {
            return res
                .status(401)
                .json({ message: "유효하지 않은 토큰입니다." });
        }

        // JWT 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.sub;
        console.log(req.userId);
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res
                .status(401)
                .json({ message: "유효하지 않은 토큰입니다." });
        }
        console.error("토큰 검증 오류:", error);
        return res.status(500).json({ message: "서버 오류" });
    }
};

exports.wsAuthMiddleware = (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            return next(new Error("인증이 필요합니다."));
        }

        const token = cookies
            .split(";")
            .find((c) => c.trim().startsWith(`${process.env.JWT_COOKIE_NAME}=`))
            ?.split("=")[1];

        if (!token) {
            return next(new Error("토큰이 없습니다."));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.sub;
        next();
    } catch (error) {
        console.error("WebSocket 인증 오류:", error);
        next(new Error("인증에 실패했습니다."));
    }
};
