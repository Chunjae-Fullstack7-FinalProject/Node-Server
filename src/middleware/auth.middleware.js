const jwt = require("jsonwebtoken");

// 시크릿 키 처리 과정 로깅
const secretKeyString = process.env.JWT_SECRET;

exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies['access_token'];
        
        if (!token) {
            return res
                .status(401)
                .json({ message: "유효하지 않은 토큰입니다." });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decoded.sub;
        req.userName = decoded.name;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            console.error("토큰 검증 실패:", {
                name: error.name,
                message: error.message,
                tokenPreview: error.token ? `${error.token.substring(0, 20)}...` : 'none',
                secretKeyString: secretKeyString.substring(0, 20) + '...'
            });
            return res
                .status(401)
                .json({ message: "유효하지 않은 토큰입니다." });
        }
        console.error("토큰 검증 오류:", error);
        return res.status(500).json({ message: "서버 오류" });
    }
};

exports.wsAuthMiddleware = (socket, next) => {
    let token;
    // console.log('socket.handshake.headers.cookie:', socket.handshake.headers.cookie);
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            return next(new Error("인증이 필요합니다."));
        }

        token = cookies
            .split(';')
            .map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith('access_token='))
            ?.split('=')[1];

        if (!token) {
            return next(new Error("토큰이 없습니다."));
        }
        console.log("=============================");
        console.log('token:', token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.userId = decoded.sub;
        socket.userName = decoded.name;
        next();
    } catch (error) {
        console.error("WebSocket 인증 오류:", {
            name: error.name,
            message: error.message,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
            secretKeyString: secretKeyString.substring(0, 20) + '...'
        });
        next(new Error("인증에 실패했습니다."));
    }
};