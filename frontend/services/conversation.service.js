import { apiRequest } from "./api";

export const getConversations = async () => {
  return apiRequest("/api/protected/conversations");
};

export const getConversationMessages = async (conversationId) => {
  return apiRequest(
    `/api/protected/conversations/${conversationId}/messages`
  );
};

export const deleteConversation = async (conversationId) => {
    return apiRequest(
        `/api/protected/conversations/${conversationId}`,
        {
            method: "DELETE",
        }
    );
};