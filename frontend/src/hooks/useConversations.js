import { useEffect, useRef, useState } from "react";
import { deleteConversation, getConversations } from "../../services/conversation.service";

export function useConversations() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [listVersion, setListVersion] = useState(0);
    const listRequestRef = useRef(null);
    const deletedIdsRef = useRef(new Set());

    useEffect(() => {
        let isCurrent = true;

        if (listRequestRef.current?.version !== listVersion) {
            listRequestRef.current = { version: listVersion, promise: getConversations() };
        }

        listRequestRef.current.promise
            .then(({ conversations: results }) => {
                if (!isCurrent) return;

                setConversations((results || []).filter((conversation) => !deletedIdsRef.current.has(conversation.id)));
                setLoadError(false);
            })
            .catch((error) => {
                if (!isCurrent) return;
                console.error("Failed to load conversations:", error);
                setLoadError(true);
            })
            .finally(() => {
                if (isCurrent) setLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [listVersion]);

    const refreshConversations = () => setListVersion((version) => version + 1);

    const removeConversation = async (id) => {
        await deleteConversation(id);
        deletedIdsRef.current.add(id);
        setConversations((current) => current.filter((conversation) => conversation.id !== id));
    };

    return { conversations, loading, loadError, refreshConversations, removeConversation };
}
