import { FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConversationListSkeleton } from "./ChatHistorySkeleton";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

const focusClass = "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900";
const navActionClass = `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium ${focusClass}`;

const ConversationSidebar = ({
    conversations,
    loading,
    loadError,
    onDeleteConversation,
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    onOpenDocuments,
    activeView,
}) => {
    const [conversationToDelete, setConversationToDelete] = useState(null);

    return (
        <nav aria-label="Workspace" className="flex h-full min-h-0 w-full flex-col border-r border-gray-200 bg-white md:w-72">
            <div className="shrink-0 space-y-2 border-b border-gray-200 p-3">
                <button
                    type="button"
                    onClick={onNewConversation}
                    className={`${navActionClass} bg-gray-950 text-white hover:bg-gray-800`}
                >
                    <Plus size={18} aria-hidden="true" />
                    New chat
                </button>
                <button
                    type="button"
                    onClick={onOpenDocuments}
                    aria-current={activeView === "documents" ? "page" : undefined}
                    className={`${navActionClass} text-gray-700 hover:bg-gray-100 aria-[current=page]:bg-gray-200 aria-[current=page]:font-semibold aria-[current=page]:text-gray-950`}
                >
                    <FileText size={18} aria-hidden="true" />
                    Documents
                </button>
            </div>

            <h2 className="px-4 pb-2 pt-4 text-sm font-semibold text-gray-700">
                Conversations
            </h2>
            <p role="status" className="sr-only">{loading && "Loading conversations…"}</p>
            <div aria-busy={loading} className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {loading && <ConversationListSkeleton />}

                {loadError && (
                    <p role="status" className="px-3 py-4 text-sm text-gray-600">
                        Couldn’t refresh conversations. Reload the page to try again.
                    </p>
                )}

                {!loading && !loadError && conversations.length === 0 && (
                    <p className="px-3 py-4 text-sm text-gray-500">
                        No conversations yet.
                    </p>
                )}

                {!loading &&
                    conversations.map((conversation) => (
                        <div
                            key={conversation.id}
                            className="mb-1 flex items-center rounded-lg hover:bg-gray-50 has-[[aria-current=page]]:bg-gray-200"
                        >
                            {/* Conversation */}
                            <button
                                type="button"
                                onClick={() =>
                                    onSelectConversation(conversation.id)
                                }
                                aria-current={activeView === "chat" && activeConversationId === conversation.id ? "page" : undefined}
                                className={`min-w-0 flex-1 rounded-lg px-3 py-3 text-left text-sm ${focusClass}`}
                            >
                                <div
                                    className={`truncate ${activeConversationId === conversation.id
                                        ? "font-medium text-gray-900"
                                        : "text-gray-700"
                                        }`}
                                >
                                    {conversation.title}
                                </div>

                                <div className="mt-1 text-xs text-gray-600">
                                    {new Date(
                                        conversation.updated_at
                                    ).toLocaleDateString()}
                                </div>
                            </button>

                            {/* Delete */}
                            <button
                                type="button"
                                onClick={() =>
                                    setConversationToDelete(conversation)
                                }
                                className={`mr-1 grid size-11 shrink-0 place-items-center rounded-lg text-gray-600 hover:bg-white hover:text-red-700 ${focusClass}`}
                                aria-label={`Delete conversation: ${conversation.title}`}
                                title="Delete conversation"
                            >
                                <Trash2 size={16} aria-hidden="true" />
                            </button>
                        </div>
                    ))}
            </div>
            {conversationToDelete && (
                <DeleteConfirmationDialog
                    title="Delete conversation?"
                    description={`“${conversationToDelete.title}” and its messages will be permanently deleted.`}
                    onCancel={() => setConversationToDelete(null)}
                    onDelete={() => onDeleteConversation(conversationToDelete.id)}
                />
            )}
        </nav>
    );
};

export default ConversationSidebar;