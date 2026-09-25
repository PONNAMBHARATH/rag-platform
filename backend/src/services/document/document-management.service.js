const { createClient } = require("@supabase/supabase-js");
const {
    deleteDocumentChunks,
} = require("../vector/qdrant.service");

const {
    deleteDocumentFile,
} = require("../storage/storage.service");

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

const getDocuments = async ({ userId, token }) => {
    const userSupabase = createUserSupabaseClient(token);

    const { data, error } = await userSupabase
        .from("documents")
        .select(
            "id, file_name, file_type, file_size, status, created_at, storage_path"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
};

const getDocument = async ({
    documentId,
    userId,
    token,
}) => {
    const userSupabase = createUserSupabaseClient(token);

    const { data, error } = await userSupabase
        .from("documents")
        .select(
            "id, file_name, file_type, file_size, status, created_at, storage_path"
        )
        .eq("id", documentId)
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
};

const deleteDocument = async ({
    documentId,
    userId,
    token,
}) => {
    const userSupabase = createUserSupabaseClient(token);

    // 1. Verify the document belongs to the user
    const { data: document, error: findError } =
        await userSupabase
            .from("documents")
            .select("id, storage_path")
            .eq("id", documentId)
            .eq("user_id", userId)
            .single();

    if (findError || !document) {
        return null;
    }

    // 2. Delete document chunks from Qdrant
    await deleteDocumentChunks(documentId);

    // 3. Delete Storage file
    if (document.storage_path) {
        await deleteDocumentFile({
            storagePath: document.storage_path,
            token
        });
    }


    // 3. Delete document metadata from Supabase
    const { error: deleteError } = await userSupabase
        .from("documents")
        .delete()
        .eq("id", documentId)
        .eq("user_id", userId);

    if (deleteError) {
        throw deleteError;
    }

    return document;
};

module.exports = {
    getDocuments,
    getDocument,
    deleteDocument,
};