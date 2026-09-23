const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const { createConversation, getConversations } = require("../services/conversation/conversation.service");
const {
    createMessage,
    getMessages
} = require("../services/conversation/message.service");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title } = req.body;

        const authHeader = req.headers.authorization;
        const token = authHeader.replace("Bearer ", "");

        const conversation = await createConversation({
            userId: req.user.id,
            token,
            title,
        });

        return res.status(201).json({
            success: true,
            conversation,
        });
    } catch (error) {
        console.error("Create conversation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create conversation",
        });
    }
});

router.post("/:conversationId/messages", authMiddleware, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { role, content } = req.body;

        if (!role || !content) {
            return res.status(400).json({
                success: false,
                message: "Role and content are required",
            });
        }

        if (!["user", "assistant"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid message role",
            });
        }

        const authHeader = req.headers.authorization;
        const token = authHeader.replace("Bearer ", "");

        const message = await createMessage({
            conversationId,
            userId: req.user.id,
            token,
            role,
            content,
        });

        return res.status(201).json({
            success: true,
            message,
        });
    } catch (error) {
        console.error("Create message error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create message",
        });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.replace("Bearer ", "");

        const conversations = await getConversations({
            userId: req.user.id,
            token,
        });

        return res.json({
            success: true,
            conversations,
        });
    } catch (error) {
        console.error("Get conversations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch conversations",
        });
    }
});

router.get("/:conversationId/messages", authMiddleware, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const authHeader = req.headers.authorization;
        const token = authHeader.replace("Bearer ", "");

        const messages = await getMessages({
            conversationId,
            userId: req.user.id,
            token,
        });

        return res.json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error("Get messages error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
        });
    }
});

router.delete("/:conversationId", authMiddleware, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const authHeader = req.headers.authorization;
        const token = authHeader.replace("Bearer ", "");

        const userSupabase = createClient(
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

        // Verify that the conversation belongs to the logged-in user
        const { data: conversation, error: findError } =
            await userSupabase
                .from("conversations")
                .select("id")
                .eq("id", conversationId)
                .eq("user_id", req.user.id)
                .single();

        if (findError || !conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        // Delete the conversation
        // Messages are deleted automatically because of ON DELETE CASCADE.
        const { error: deleteError } = await userSupabase
            .from("conversations")
            .delete()
            .eq("id", conversationId)
            .eq("user_id", req.user.id);

        if (deleteError) {
            throw deleteError;
        }

        return res.json({
            success: true,
            message: "Conversation deleted successfully",
        });
    } catch (error) {
        console.error("Delete conversation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete conversation",
        });
    }
});

module.exports = router;