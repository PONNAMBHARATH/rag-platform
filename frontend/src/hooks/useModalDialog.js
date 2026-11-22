import { useLayoutEffect, useRef } from "react";

export function useModalDialog(isOpen = true, fallbackFocusRef) {
    const dialogRef = useRef(null);

    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !dialog) return;

        const opener = document.activeElement;
        const getFallbackFocus = () => fallbackFocusRef?.current;
        dialog.showModal();

        return () => {
            dialog.close();
            queueMicrotask(() => {
                if (dialog.open || document.activeElement !== document.body) return;

                if (opener !== document.body && opener?.isConnected) {
                    opener.focus({ preventScroll: true });
                }
                if (document.activeElement === document.body) {
                    getFallbackFocus()?.focus({ preventScroll: true });
                }
            });
        };
    }, [isOpen, fallbackFocusRef]);

    return dialogRef;
}
