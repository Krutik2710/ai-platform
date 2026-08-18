async function handleResponse(response) {
  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      // Keep the default message.
    }

    throw new Error(message);
  }

  return response.json();
}


export async function checkHealth() {
  const response = await fetch("/api/health");
  return handleResponse(response);
}


export async function getDocuments() {
  const response = await fetch("/api/documents");
  return handleResponse(response);
}


export async function uploadDocument(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}


export async function queryDocuments(
  question,
  sessionId = null,
  limit = 3
) {
  const response = await fetch("/api/query", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      question,
      limit,
      session_id: sessionId,
    }),
  });

  return handleResponse(response);
}


export async function getChatHistory(sessionId) {
  const response = await fetch(`/api/chat/${sessionId}`);
  return handleResponse(response);
}


export async function getChatSessions() {
  const response = await fetch("/api/chat-sessions");
  return handleResponse(response);
}