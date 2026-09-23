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

const createConversation = async ({ userId, token, title }) => {
    const userSupabase = createUserSupabaseClient(token);

    const { data, error } = await userSupabase
        .from("conversations")
        .insert({
            user_id: userId,
            title: title || "New Conversation",
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};

const getConversations = async ({ userId, token }) => {
    const userSupabase = createUserSupabaseClient(token);

    const { data, error } = await userSupabase
        .from("conversations")
        .select("id, title, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
};
module.exports = {
    createConversation,
    getConversations,
};