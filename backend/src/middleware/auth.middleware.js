const supabase = require("../config/supabase");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = authMiddleware;