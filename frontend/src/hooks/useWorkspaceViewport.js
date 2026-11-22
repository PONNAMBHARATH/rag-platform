import { useLayoutEffect, useRef } from "react";

export function useWorkspaceViewport() {
    const workspaceRef = useRef(null);

    useLayoutEffect(() => {
        const workspace = workspaceRef.current;
        const viewport = window.visualViewport;
        if (!workspace || !viewport) return;

        const updateHeight = () => {
            if (viewport.scale !== 1 || viewport.height >= window.innerHeight) {
                workspace.style.removeProperty("--workspace-height");
                return;
            }

            workspace.style.setProperty("--workspace-height", `${Math.floor(viewport.height)}px`);
        };

        updateHeight();
        viewport.addEventListener("resize", updateHeight);
        window.addEventListener("resize", updateHeight);
        return () => {
            viewport.removeEventListener("resize", updateHeight);
            window.removeEventListener("resize", updateHeight);
            workspace.style.removeProperty("--workspace-height");
        };
    }, []);

    return workspaceRef;
}
