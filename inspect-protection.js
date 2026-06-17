(function () {
    const warning = "Welcome to WorkTracker";

    function isFormTarget(target) {
        if (!target) return false;
        const tagName = target.tagName ? target.tagName.toLowerCase() : "";
        return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
    }

    function showWarning() {
        window.alert(warning);
    }

    document.addEventListener("contextmenu", (event) => {
        if (isFormTarget(event.target)) return;
        event.preventDefault();
        showWarning();
    });

    document.addEventListener("keydown", (event) => {
        const key = String(event.key || "").toLowerCase();
        const isDevToolsKey =
            event.key === "F12" ||
            (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
            (event.ctrlKey && key === "u") ||
            (event.metaKey && event.altKey && ["i", "j", "c"].includes(key));

        if (!isDevToolsKey) return;

        event.preventDefault();
        event.stopPropagation();
        showWarning();
    }, true);
})();
