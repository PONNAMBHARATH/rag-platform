const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "You are authenticated",
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

module.exports = router;