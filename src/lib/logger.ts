/**
 * Sentry-like Error Logger and System Audit Logger helper.
 * Manages posting errors and audit logs to the backend database.
 */

// Global state to store the current username for unhandled errors
let activeUser = "Guest";

export function setActiveLoggerUser(username: string) {
  activeUser = username;
}

/**
 * Log an error to the backend database (like Sentry)
 */
export async function logSystemError(params: {
  code?: string;
  message: string;
  page: string;
  action?: string;
  user?: string;
  stack?: string;
}) {
  try {
    const payload = {
      code: params.code || "ERR-500-GEN",
      message: params.message,
      page: params.page || "General",
      action: params.action || "None",
      user: params.user || activeUser,
      stack: params.stack || new Error().stack || ""
    };

    console.warn("Reporting system error to logger:", payload);

    const res = await fetch("/api/error-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to post system error log:", err);
    return false;
  }
}

/**
 * Log an audit action to the backend database
 */
export async function logSystemAudit(params: {
  user: string;
  action: "أضاف" | "عدّل" | "حذف" | "اعتمد" | "طلب" | "تصدير" | "دخول" | string;
  department: "HR" | "Sales" | "Warehouse" | "Production" | "Finance" | "General" | string;
  description: string;
  originalValue?: any;
  newValue?: any;
}) {
  try {
    const payload = {
      user: params.user || activeUser,
      action: params.action,
      department: params.department,
      description: params.description,
      originalValue: params.originalValue ? JSON.stringify(params.originalValue) : "",
      newValue: params.newValue ? JSON.stringify(params.newValue) : ""
    };

    const res = await fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to post system audit log:", err);
    return false;
  }
}

// Auto-register unhandled runtime errors (Sentry behavior)
if (typeof window !== "undefined") {
  const isViteOrWsError = (message: string, stack: string) => {
    const lowerMsg = (message || "").toLowerCase();
    const lowerStack = (stack || "").toLowerCase();
    return (
      lowerMsg.includes("websocket") ||
      lowerMsg.includes("socket") ||
      lowerMsg.includes("vite") ||
      lowerMsg.includes("hmr") ||
      lowerMsg.includes("closed without opened") ||
      lowerStack.includes("websocket") ||
      lowerStack.includes("vite") ||
      lowerStack.includes("hmr")
    );
  };

  window.addEventListener("error", (event) => {
    // Only capture real errors
    if (!event.error && !event.message) return;
    
    const message = event.message || "Unhandled runtime script error";
    const stack = event.error ? event.error.stack || "" : "";
    if (isViteOrWsError(message, stack)) return;

    logSystemError({
      code: "ERR-500-RUNTIME",
      message,
      page: window.location.pathname || "Root",
      action: "System Runtime Intercept",
      stack
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason?.message || (typeof reason === "string" ? reason : "Unhandled Promise Rejection");
    const stack = reason?.stack || "";
    if (isViteOrWsError(message, stack)) return;

    logSystemError({
      code: "ERR-500-PROMISE",
      message,
      page: window.location.pathname || "Root",
      action: "Async Promise Intercept",
      stack
    });
  });
}
