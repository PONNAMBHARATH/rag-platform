import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../services/api";
import ConversationSidebar from "../components/ConversationSidebar";
import DocumentPanel from "../components/DocumentPanel";
import {
    getConversationMessages,
} from "../../services/conversation.service";


const Chat = () => {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const activeView = pathname === "/documents" ? "documents" : "chat";
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        let isCurrent = true;

        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return () => {
                isCurrent = false;
            };
        }

        setLoading(true);
        getConversationMessages(conversationId)
            .then((result) => {
                if (isCurrent) {
                    setMessages(result.messages || []);
                }
            })
            .catch((error) => {
                if (isCurrent) {
                    console.error("Failed to load conversation:", error);
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [conversationId]);

    useEffect(() => {
        const messagesContainer = messagesContainerRef.current;

        messagesContainer?.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, loading]);

    const handleSelectConversation = (selectedConversationId) => {
        navigate(`/chat/${selectedConversationId}`);
        setSidebarOpen(false);
    };

    const handleNewConversation = () => {
        navigate("/chat");
        setMessages([]);
        setQuestion("");
        setSidebarOpen(false);
    };

    const handleOpenDocuments = () => {
        navigate("/documents");
        setSidebarOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!question.trim() || loading) {
            return;
        }

        const userQuestion = question.trim();

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: userQuestion,
            },
        ]);

        setQuestion("");
        setLoading(true);

        try {
            const result = await apiRequest("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId,
                    question: userQuestion,
                }),
            });
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: result.answer,
                    sources: result.sources,
                },
            ]);
            navigate(`/chat/${result.conversationId}`);
        } catch (error) {
            console.error("Chat error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, something went wrong.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-dvh overflow-hidden bg-gray-50">

            {/* Desktop Sidebar */}
            <div className="hidden h-full shrink-0 md:block">
                <ConversationSidebar
                    activeConversationId={conversationId}
                    onSelectConversation={handleSelectConversation}
                    onNewConversation={handleNewConversation}
                    onOpenDocuments={handleOpenDocuments}
                    activeView={activeView}
                />
            </div>

            {/* Mobile Sidebar Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">

                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="relative flex h-full w-72 flex-col bg-white">

                        {/* Close Button */}
                        <div className="flex shrink-0 justify-end border-b p-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(false)}
                                className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Sidebar */}
                        <div className="min-h-0 flex-1">
                            <ConversationSidebar
                                activeConversationId={conversationId}
                                onSelectConversation={handleSelectConversation}
                                onNewConversation={handleNewConversation}
                                onOpenDocuments={handleOpenDocuments}
                                activeView={activeView}
                            />
                        </div>

                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">

                {/* Main Content */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    {activeView === "documents" ? (
                        <DocumentPanel
                            onOpenMenu={() => setSidebarOpen(true)}
                        />
                    ) : (
                        <>
                            {/* Header */}
                            <header className="border-b bg-white px-4 py-3 md:px-6 md:py-4">
                                <div className="flex items-center gap-3">

                                    {/* Mobile Menu Button */}
                                    <button
                                        type="button"
                                        onClick={() => setSidebarOpen(true)}
                                        className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
                                    >
                                        ☰
                                    </button>

                                    <div>
                                        <h1 className="text-xl font-semibold text-gray-900">
                                            RAG Platform
                                        </h1>

                                        <p className="text-sm text-gray-500">
                                            Chat with your documents
                                        </p>
                                    </div>

                                </div>
                            </header>

                            {/* Existing Chat Area */}
                            <main ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
                                <div className="mx-auto max-w-3xl space-y-6">

                                    {messages.length === 0 && (
                                        <div className="py-20 text-center">
                                            <h2 className="text-2xl font-semibold text-gray-800">
                                                Ask your documents
                                            </h2>

                                            <p className="mt-2 text-gray-500">
                                                Ask a question about your uploaded documents.
                                            </p>
                                        </div>
                                    )}

                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={
                                                message.role === "user"
                                                    ? "flex justify-end"
                                                    : "flex justify-start"
                                            }
                                        >
                                            <div
                                                className={
                                                    message.role === "user"
                                                        ? "max-w-[75%] rounded-2xl bg-black px-4 py-3 text-white"
                                                        : "max-w-[75%] rounded-2xl border bg-white px-4 py-3 text-gray-800"
                                                }
                                            >
                                                <p className="whitespace-pre-wrap">
                                                    {message.content}
                                                </p>

                                                {/* Sources */}
                                                {message.sources?.length > 0 && (
                                                    <div className="mt-4 border-t pt-3">

                                                        <p className="mb-2 text-xs font-semibold text-gray-500">
                                                            Sources
                                                        </p>

                                                        <div className="space-y-2">
                                                            {message.sources.map(
                                                                (source, sourceIndex) => (
                                                                    <div
                                                                        key={sourceIndex}
                                                                        className="rounded-lg bg-gray-50 px-3 py-2"
                                                                    >
                                                                        <p className="text-xs font-medium text-gray-700">
                                                                            {source.fileName}
                                                                        </p>

                                                                        {source.snippet && (
                                                                            <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                                                                {source.snippet}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>

                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    ))}

                                    {/* Loading */}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-gray-500">
                                                Thinking...
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </main>

                            {/* Input */}
                            <footer className="border-t bg-white px-4 py-4 md:px-6">
                                <form
                                    onSubmit={handleSubmit}
                                    className="mx-auto flex max-w-3xl gap-3"
                                >

                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(event) =>
                                            setQuestion(event.target.value)
                                        }
                                        placeholder="Ask a question about your documents..."
                                        disabled={loading}
                                        className="min-w-0 flex-1 rounded-xl border px-4 py-3 outline-none focus:border-gray-500"
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading || !question.trim()}
                                        className="rounded-xl bg-black px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 md:px-6"
                                    >
                                        Send
                                    </button>

                                </form>
                            </footer>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Chat;