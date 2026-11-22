import { Menu, X } from "lucide-react";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../../services/api";
import AccountMenu from "../components/AccountMenu";
import ChatComposer from "../components/ChatComposer";
import ChatEmptyState from "../components/ChatEmptyState";
import { MessageHistorySkeleton } from "../components/ChatHistorySkeleton";
import ConversationSidebar from "../components/ConversationSidebar";
import DocumentPanel from "../components/DocumentPanel";
import { useConversations } from "../hooks/useConversations";
import { useModalDialog } from "../hooks/useModalDialog";
import { useWorkspaceViewport } from "../hooks/useWorkspaceViewport";
import {
    getConversationMessages,
} from "../../services/conversation.service";


const ChatAnswer = lazy(() => import("../components/ChatAnswer"));

const Chat = () => {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [pendingMessage, setPendingMessage] = useState(null);
    const [sendError, setSendError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { conversations, loading: loadingConversations, loadError: conversationListError, refreshConversations, removeConversation } = useConversations();
    const { conversationId } = useParams();
    const [newConversation, setNewConversation] = useState(null);
    const [historyConversationId, setHistoryConversationId] = useState(conversationId);
    const [historyStatus, setHistoryStatus] = useState(conversationId ? "loading" : "ready");
    const hasNewConversation = newConversation !== null && newConversation.id === conversationId;
    if (historyConversationId !== conversationId) {
        setHistoryConversationId(conversationId);
        setHistoryStatus(conversationId && !hasNewConversation ? "loading" : "ready");
        setMessages(hasNewConversation ? newConversation.messages : []);
        if (!hasNewConversation) setNewConversation(null);
    }
    const isLoadingConversation = historyStatus === "loading";

    const navigate = useNavigate();
    const { pathname, state, key: locationKey } = useLocation();
    const activeView = pathname === "/documents" ? "documents" : "chat";
    const workspaceRef = useWorkspaceViewport();
    const sidebarTriggerRef = useRef(null);
    const sidebarDialogRef = useModalDialog(sidebarOpen, sidebarTriggerRef);
    const messagesContainerRef = useRef(null);
    const questionInputRef = useRef(null);
    const sendRequestRef = useRef(null);
    const [composerLocationKey, setComposerLocationKey] = useState(locationKey);
    if (composerLocationKey !== locationKey) {
        setComposerLocationKey(locationKey);
        setPendingMessage(null);
        setSendError("");
    }

    const isSending = pendingMessage !== null;
    const showEmptyState = !conversationId && !isLoadingConversation && !isSending && messages.length === 0;

    useLayoutEffect(() => {
        return () => {
            sendRequestRef.current?.abort();
            sendRequestRef.current = null;
        };
    }, [locationKey]);

    useEffect(() => {
        if (!conversationId || hasNewConversation) return;

        let isCurrent = true;
        getConversationMessages(conversationId)
            .then((result) => {
                if (!isCurrent) return;
                setMessages(result.messages || []);
                setHistoryStatus("ready");
            })
            .catch((error) => {
                if (!isCurrent) return;
                console.error("Failed to load conversation:", error);
                setHistoryStatus("failed");
            });

        return () => {
            isCurrent = false;
        };
    }, [conversationId, hasNewConversation]);

    useEffect(() => {
        if (showEmptyState || isLoadingConversation) return;

        const messagesContainer = messagesContainerRef.current;

        messagesContainer?.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, isLoadingConversation, isSending, showEmptyState]);

    useEffect(() => {
        if (!sidebarOpen) return;

        const desktopViewport = window.matchMedia("(min-width: 48rem)");
        const closeOnDesktop = () => {
            if (desktopViewport.matches) setSidebarOpen(false);
        };

        desktopViewport.addEventListener("change", closeOnDesktop);
        return () => {
            desktopViewport.removeEventListener("change", closeOnDesktop);
        };
    }, [sidebarOpen]);

    const openSidebar = () => {
        sidebarTriggerRef.current?.focus({ preventScroll: true });
        setSidebarOpen(true);
    };

    const handleSelectConversation = (selectedConversationId) => {
        navigate(`/chat/${selectedConversationId}`);
        setSidebarOpen(false);
    };

    const handleNewConversation = () => {
        navigate("/chat");
        setMessages([]);
        setQuestion("");
        setSendError("");
        setSidebarOpen(false);
    };

    const handleDeleteConversation = async (id) => {
        await removeConversation(id);
        if (conversationId === id) handleNewConversation();
    };

    const handleOpenDocuments = () => {
        navigate("/documents");
        setSidebarOpen(false);
    };

    const handleQuestionChange = (draft) => {
        setQuestion(draft);
        setSendError("");
    };

    const handleSelectQuestion = (exampleQuestion) => {
        handleQuestionChange(exampleQuestion);
        questionInputRef.current?.focus();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const userQuestion = question.trim();
        if (!userQuestion || isLoadingConversation || sendRequestRef.current) return;

        const request = new AbortController();
        sendRequestRef.current = request;
        setSendError("");
        const userMessage = { role: "user", content: userQuestion };
        setPendingMessage(userMessage);
        questionInputRef.current?.focus();

        try {
            const result = await apiRequest("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, question: userQuestion }),
                signal: request.signal,
            });
            if (request.signal.aborted) return;

            const answerMessage = { role: "assistant", content: result.answer, sources: result.sources };
            setQuestion("");
            if (result.conversationId !== conversationId) {
                refreshConversations();
                setNewConversation({ id: result.conversationId, messages: [userMessage, answerMessage] });
                navigate(`/chat/${result.conversationId}`);
            } else {
                setMessages((current) => [...current, userMessage, answerMessage]);
            }
        } catch (error) {
            if (request.signal.aborted) return;

            console.error("Chat error:", error);
            setSendError("Couldn’t send your question. Try sending it again.");
        } finally {
            if (sendRequestRef.current === request) {
                sendRequestRef.current = null;
                setPendingMessage(null);
            }
        }
    };

    const displayedMessages = pendingMessage ? [...messages, pendingMessage] : messages;

    const sidebarProps = {
        conversations,
        loading: loadingConversations,
        loadError: conversationListError,
        onDeleteConversation: handleDeleteConversation,
        activeConversationId: conversationId,
        activeView,
        onSelectConversation: handleSelectConversation,
        onNewConversation: handleNewConversation,
        onOpenDocuments: handleOpenDocuments,
    };

    return (
        <div ref={workspaceRef} className="flex h-[var(--workspace-height,100dvh)] overflow-hidden bg-gray-50">

            <div className="hidden h-full shrink-0 md:block">
                <ConversationSidebar {...sidebarProps} />
            </div>

            <dialog
                ref={sidebarDialogRef}
                aria-labelledby="mobile-navigation-title"
                onCancel={(event) => {
                    event.preventDefault();
                    setSidebarOpen(false);
                }}
                onClick={(event) => {
                    if (event.target === event.currentTarget) setSidebarOpen(false);
                }}
                className="fixed inset-y-0 left-0 m-0 h-[var(--workspace-height,100dvh)] max-h-none w-72 max-w-full overflow-hidden bg-white backdrop:bg-black/40"
            >
                {sidebarOpen && (
                    <div className="flex h-full flex-col">
                        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2">
                            <h2 id="mobile-navigation-title" className="text-sm font-semibold text-gray-900">
                                Navigation
                            </h2>
                            <button
                                type="button"
                                autoFocus
                                aria-label="Close navigation"
                                onClick={() => setSidebarOpen(false)}
                                className="grid size-11 cursor-pointer place-items-center rounded-lg text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </header>
                        <ConversationSidebar {...sidebarProps} />
                    </div>
                )}
            </dialog>

            {/* Main Chat Area */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">

                {/* Main Content */}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    {activeView === "documents" ? (
                        <DocumentPanel
                            onOpenMenu={openSidebar}
                            menuButtonRef={sidebarTriggerRef}
                            initialUploadDialogOpen={state?.openUploadDialog === true}
                        />
                    ) : (
                        <>
                            {/* Header */}
                            <header className="border-b bg-white px-4 py-3 md:px-6 md:py-4">
                                <div className="flex items-center gap-3">

                                    {/* Mobile Menu Button */}
                                    <button
                                        type="button"
                                        ref={sidebarTriggerRef}
                                        onClick={openSidebar}
                                        aria-label="Open navigation"
                                        aria-haspopup="dialog"
                                        className="grid size-11 cursor-pointer place-items-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-900 md:hidden"
                                    >
                                        <Menu size={20} aria-hidden="true" />
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <h1 className="text-xl font-semibold text-gray-900">
                                            RAG Platform
                                        </h1>

                                        <p className="text-sm text-gray-500">
                                            Chat with your documents
                                        </p>
                                    </div>
                                    <AccountMenu />

                                </div>
                            </header>

                            {/* Existing Chat Area */}
                            <main ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
                                {showEmptyState && <ChatEmptyState onSelectQuestion={handleSelectQuestion} />}
                                <div className="mx-auto max-w-3xl space-y-6">

                                    {isLoadingConversation && <MessageHistorySkeleton />}
                                    {historyStatus === "failed" && (
                                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                            Couldn’t load this conversation. Refresh to try again.
                                        </p>
                                    )}

                                    {!isLoadingConversation && displayedMessages.map((message, index) => (
                                        <div key={message.id ?? index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                                            {message.role === "user" ? (
                                                <p className="max-w-[75%] rounded-2xl bg-gray-950 px-4 py-3 whitespace-pre-wrap wrap-anywhere text-white">
                                                    {message.content}
                                                </p>
                                            ) : (
                                                <Suspense fallback={<p role="status" className="px-4 py-3 text-sm text-gray-600">Loading answer…</p>}>
                                                    <ChatAnswer content={message.content} sources={message.sources} />
                                                </Suspense>
                                            )}
                                        </div>
                                    ))}

                                    {/* Loading */}
                                    {isSending && (
                                        <div className="flex justify-start">
                                            <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-gray-500">
                                                Thinking…
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </main>

                            <ChatComposer
                                inputRef={questionInputRef}
                                question={question}
                                onQuestionChange={handleQuestionChange}
                                onSubmit={handleSubmit}
                                isLoadingConversation={isLoadingConversation}
                                isSending={isSending}
                                sendError={sendError}
                            />
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Chat;
