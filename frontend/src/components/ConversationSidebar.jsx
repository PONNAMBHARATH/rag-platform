import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "../../services/auth.service";
import {
    getConversations,
    deleteConversation,
} from "../../services/conversation.service";

const ConversationSidebar = ({
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    onOpenDocuments,
    activeView,
}) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const loadConversations = async () => {
        try {
            const result = await getConversations();
            setConversations(result.conversations || []);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConversation = async (conversationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this conversation?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteConversation(conversationId);

            // Remove deleted conversation from local sidebar state
            setConversations((prev) =>
                prev.filter(
                    (conversation) =>
                        conversation.id !== conversationId
                )
            );

            // If the deleted conversation is currently open
            if (activeConversationId === conversationId) {
                onNewConversation();
            }
        } catch (error) {
            console.error(
                "Failed to delete conversation:",
                error
            );

            alert("Failed to delete conversation.");
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);
    return (
        <aside className="flex h-full w-72 flex-col border-r bg-white">

            {/* Sidebar Header */}
            <div className="flex h-[81px] shrink-0 items-center justify-between border-b px-4">
                <h2 className="font-semibold text-gray-900">
                    Conversations
                </h2>

                <button
                    type="button"
                    onClick={onNewConversation}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                    + New
                </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading && (
                    <p className="px-3 py-4 text-sm text-gray-500">
                        Loading conversations...
                    </p>
                )}

                {!loading && conversations.length === 0 && (
                    <p className="px-3 py-4 text-sm text-gray-500">
                        No conversations yet.
                    </p>
                )}

                {!loading &&
                    conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            className={`group mb-1 flex items-center rounded-lg ${activeConversationId === conversation.id
                                ? "bg-gray-100"
                                : "hover:bg-gray-50"
                                }`}
                        >
                            {/* Conversation */}
                            <button
                                type="button"
                                onClick={() =>
                                    onSelectConversation(conversation.id)
                                }
                                className="min-w-0 flex-1 px-3 py-3 text-left text-sm"
                            >
                                <div
                                    className={`truncate ${activeConversationId === conversation.id
                                        ? "font-medium text-gray-900"
                                        : "text-gray-700"
                                        }`}
                                >
                                    {conversation.title}
                                </div>

                                <div className="mt-1 text-xs text-gray-400">
                                    {new Date(
                                        conversation.updated_at
                                    ).toLocaleDateString()}
                                </div>
                            </button>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() =>
                                    handleDeleteConversation(conversation.id)
                                }
                                className="mr-2 rounded-md px-2 py-1 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-gray-200 hover:text-red-600"
                                title="Delete conversation"
                            >
                                ⋮
                            </button>
                        </div>
                    ))}
            </div>
            <div className="shrink-0 border-t p-3">
                <button
                    type="button"
                    onClick={onOpenDocuments}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${activeView === "documents"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    <FileText size={18} />
                    <span>Documents</span>
                </button>
            </div>

            {/* User Section */}
            <div className="shrink-0 border-t p-3">

                <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                            {user?.email}
                        </p>

                        <p className="text-xs text-gray-500">
                            Signed in
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error("Logout failed:", error);
                        }
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                    Log out
                </button>

            </div>
        </aside>
    );
};

export default ConversationSidebar;