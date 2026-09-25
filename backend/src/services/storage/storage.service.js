const { createClient } = require("@supabase/supabase-js");


const BUCKET_NAME = "documents";

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
}

const uploadDocumentFile = async ({
    file,
    userId,
    documentId,
    token,
}) => {
    const userSupabase = createUserSupabaseClient(token);

    const storagePath = `${userId}/${documentId}/${file.originalname}`;

    const { error } = await userSupabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });

    if (error) {
        throw error;
    }

    return storagePath;
};

const deleteDocumentFile = async ({
    storagePath,
    token,
}) => {
    const userSupabase = createUserSupabaseClient(token);


    const { data, error } = await userSupabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

    if (error) {
        console.error(
            "Storage deletion error:",
            error
        );

        throw error;
    }

    return data;
};

const downloadDocumentFile = async ({
    storagePath,
    token,
}) => {
    const userSupabase = createUserSupabaseClient(token);

    const { data, error } = await userSupabase.storage
        .from(BUCKET_NAME)
        .download(storagePath);

    if (error) {
        throw error;
    }

    const arrayBuffer = await data.arrayBuffer();

    return Buffer.from(arrayBuffer);
};

module.exports = {
    uploadDocumentFile,
    deleteDocumentFile,
    downloadDocumentFile,
};