const { createClient } = require("@supabase/supabase-js");

const createUserSupabaseClient = (token) => {
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

const createMessage = async ({
    conversationId,
    userId,
    token,
    role,
    content,
}) => {
    const userSupabase = createUserSupabaseClient(token);

    const { data, error } = await userSupabase
        .from("messages")
        .insert({
            conversation_id: conversationId,
            user_id: userId,
            role,
            content,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};

const getMessages = async ({ conversationId, userId, token }) => {
    const userSupabase = createUserSupabaseClient(token);

    const { data, error } = await userSupabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

module.exports = {
    createMessage,
    getMessages,
};