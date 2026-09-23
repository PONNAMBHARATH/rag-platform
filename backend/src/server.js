
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const protectedRoutes = require("./routes/protected.routes");
const documentRoutes = require("./routes/document.routes");
const chatRoutes = require("./routes/chat.routes");
const conversationRoutes = require("./routes/conversation.routes");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "RAG API is running",
    });
});

app.use("/api/protected", protectedRoutes);
app.use("/api/protected/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/protected/conversations", conversationRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});