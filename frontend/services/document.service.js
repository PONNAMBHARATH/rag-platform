import { apiRequest } from "./api";

export const getDocuments = async () => {
    return apiRequest("/api/protected/documents");
};

export const getDocument = async (documentId) => {
    return apiRequest(
        `/api/protected/documents/${documentId}`
    );
};

export const deleteDocument = async (documentId) => {
    return apiRequest(
        `/api/protected/documents/${documentId}`,
        {
            method: "DELETE",
        }
    );
};

export const uploadDocument = async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    return apiRequest("/api/protected/documents/upload", {
        method: "POST",
        body: formData,
    });
};