const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { generateRagAnswer } = require("../services/rag/rag.service");
const { createConversation } = require("../services/conversation/conversation.service");

const {
    createMessage,
} = require("../services/conversation/message.service");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const getUserSupabaseClient = (token) => {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        }
    );
};

const verifyConversationOwnership = async ({
    conversationId,
    userId,
    token,
}) => {
    const userSupabase = getUserSupabaseClient(token);

    const { data, error } = await userSupabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        return false;
    }

    return true;
};

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { question, conversationId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question is required",
            });
        }

        const authHeader = req.headers.authorization;
        const token = authHeader.replace("Bearer ", "");

        let currentConversationId = conversationId;

        // 1. Create or verify conversation
        if (!currentConversationId) {
            const conversation = await createConversation({
                userId: req.user.id,
                token,
                title: question.trim().slice(0, 50),
            });

            currentConversationId = conversation.id;
        } else {
            const ownsConversation = await verifyConversationOwnership({
                conversationId: currentConversationId,
                userId: req.user.id,
                token,
            });

            if (!ownsConversation) {
                return res.status(403).json({
                    success: false,
                    message: "Conversation not found",
                });
            }
        }

        // 2. Save user message
        await createMessage({
            conversationId: currentConversationId,
            userId: req.user.id,
            token,
            role: "user",
            content: question.trim(),
        });

        // 3. Run RAG
        const result = await generateRagAnswer({
            question: question.trim(),
            userId: req.user.id,
        });

        // 4. Save assistant message
        await createMessage({
            conversationId: currentConversationId,
            userId: req.user.id,
            token,
            role: "assistant",
            content: result.answer,
        });

        // 5. Return response
        return res.json({
            success: true,
            conversationId: currentConversationId,
            answer: result.answer,
            sources: result.sources,
        });
    } catch (error) {
        console.error("Chat error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to generate answer",
        });
    }
});

module.exports = router;