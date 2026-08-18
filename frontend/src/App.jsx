import { useEffect, useRef, useState } from "react";

import {
  checkHealth,
  getDocuments,
  uploadDocument,
  queryDocuments,
  getChatHistory,
  getChatSessions,
} from "./api";


const CURRENT_SESSION_KEY = "ai-platform-session";


function App() {
  const [health, setHealth] = useState("checking");

  const [documents, setDocuments] = useState([]);

  const [chatSessions, setChatSessions] = useState([]);

  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("");

  const [sessionId, setSessionId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [loadingHistory, setLoadingHistory] = useState(false);

  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);


  /*
   * Initial application load
   *
   * 1. Check API health
   * 2. Load persistent documents
   * 3. Load chat history list
   * 4. Restore the previously active session, if one exists
   */
  useEffect(() => {
    async function initialize() {
      setError("");

      try {
        await checkHealth();
        setHealth("online");
      } catch {
        setHealth("offline");
      }

      try {
        const documentsResult = await getDocuments();

        setDocuments(
          (documentsResult.documents || []).map((document) => ({
            name: document.filename,
            s3Key: document.s3_key,
            documentId: document.id,
            createdAt: document.created_at,
          }))
        );
      } catch (err) {
        setError(err.message);
      }

      try {
        const sessionsResult = await getChatSessions();

        const sessions = sessionsResult.sessions || [];

        setChatSessions(sessions);

        const storedSessionId = localStorage.getItem(
          CURRENT_SESSION_KEY
        );

        if (storedSessionId) {
          const numericSessionId = Number(storedSessionId);

          const sessionExists = sessions.some(
            (session) => session.id === numericSessionId
          );

          if (sessionExists) {
            await loadChat(numericSessionId);
          } else {
            localStorage.removeItem(CURRENT_SESSION_KEY);
          }
        }
      } catch (err) {
        setError(err.message);
      }
    }

    initialize();
  }, []);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);


  /*
   * Load one complete conversation.
   */
  async function loadChat(id) {
    setLoadingHistory(true);
    setError("");

    try {
      const result = await getChatHistory(id);

      setSessionId(result.session_id);

      setMessages(
        (result.messages || []).map((message) => ({
          role: message.role,
          content: message.content,
          sources: [],
        }))
      );

      localStorage.setItem(
        CURRENT_SESSION_KEY,
        String(result.session_id)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }


  /*
   * Start a completely new conversation.
   *
   * The old session is NOT deleted from PostgreSQL.
   */
  function handleNewChat() {
    setSessionId(null);
    setMessages([]);
    setQuestion("");
    setError("");

    localStorage.removeItem(CURRENT_SESSION_KEY);
  }


  /*
   * Upload a document and then reload the persistent
   * document list from PostgreSQL.
   */
  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      await uploadDocument(file);

      const result = await getDocuments();

      setDocuments(
        (result.documents || []).map((document) => ({
          name: document.filename,
          s3Key: document.s3_key,
          documentId: document.id,
          createdAt: document.created_at,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }


  /*
   * Submit a RAG question.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setError("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: trimmedQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const result = await queryDocuments(
        trimmedQuestion,
        sessionId,
        3
      );

      setSessionId(result.session_id);

      localStorage.setItem(
        CURRENT_SESSION_KEY,
        String(result.session_id)
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
          sources: result.results || [],
        },
      ]);

      /*
       * Refresh the chat list so a newly created session
       * immediately appears in the sidebar.
       */
      const sessionsResult = await getChatSessions();

      setChatSessions(sessionsResult.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="app-shell">

      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />

      <header className="topbar">

        <div className="brand">
          <div className="brand-mark">
            AI
          </div>

          <div>
            <div className="brand-name">
              AI PLATFORM
            </div>

            <div className="brand-subtitle">
              RETRIEVAL / AUGMENTED / INTELLIGENCE
            </div>
          </div>
        </div>


        <div className="system-status">

          <span
            className={`status-dot ${health}`}
          />

          <span>
            SYSTEM {health.toUpperCase()}
          </span>

        </div>

      </header>


      <main className="workspace">

        <aside className="sidebar">

          {/* DOCUMENTS */}

          <div className="section-heading">
            <span>01</span>
            DOCUMENTS
          </div>


          <div className="document-list">

            {documents.length === 0 ? (

              <div className="empty-documents">
                <div className="empty-icon">
                  +
                </div>

                <div>
                  No documents loaded.
                </div>

                <small>
                  Upload a document to begin.
                </small>
              </div>

            ) : (

              documents.map((document) => (

                <div
                  className="document-card"
                  key={document.documentId}
                >
                  <div className="document-icon">
                    DOC
                  </div>

                  <div className="document-info">

                    <div className="document-name">
                      {document.name}
                    </div>

                    <div className="document-meta">
                      ID {document.documentId}
                    </div>

                  </div>

                  <span className="document-state">
                    ●
                  </span>
                </div>

              ))

            )}

          </div>


          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleUpload}
          />


          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span>
              {uploading ? "UPLOADING..." : "+ UPLOAD DOCUMENT"}
            </span>

            <span className="button-arrow">
              ↗
            </span>
          </button>


          {/* CHAT HISTORY */}

          <div className="chat-history-section">

            <div className="section-heading">
              <span>03</span>
              CHAT HISTORY
            </div>


            <button
              className="new-chat-button"
              onClick={handleNewChat}
            >
              <span>+ NEW CHAT</span>
              <span>↗</span>
            </button>


            <div className="chat-history-list">

              {chatSessions.length === 0 ? (

                <div className="empty-chat-history">
                  No conversations yet.
                </div>

              ) : (

                chatSessions.map((session) => (

                  <button
                    key={session.id}
                    className={`chat-history-item ${
                      session.id === sessionId
                        ? "active"
                        : ""
                    }`}
                    onClick={() => loadChat(session.id)}
                    disabled={loadingHistory}
                  >

                    <span className="chat-history-id">
                      #{session.id}
                    </span>

                    <span className="chat-history-title">
                      {session.title}
                    </span>

                  </button>

                ))

              )}

            </div>

          </div>


          <div className="sidebar-footer">

            <div className="stack-item">
              <span>RAG ENGINE</span>
              <span>READY</span>
            </div>

            <div className="stack-item">
              <span>VECTOR STORE</span>
              <span>READY</span>
            </div>

            <div className="stack-item">
              <span>S3 STORAGE</span>
              <span>READY</span>
            </div>

          </div>

        </aside>


        <section className="chat-panel">

          <div className="chat-header">

            <div>
              <div className="section-heading">
                <span>02</span>
                AI ASSISTANT
              </div>

              <div className="chat-description">
                Ask questions against your indexed documents.
              </div>
            </div>

            <div className="session-indicator">
              SESSION{" "}
              {sessionId ? `#${sessionId}` : "—"}
            </div>

          </div>


          <div className="messages">

            {messages.length === 0 && (

              <div className="welcome">

                <div className="welcome-line">
                  ─────────────────────────────
                </div>

                <div className="welcome-title">
                  KNOWLEDGE INTERFACE
                </div>

                <p>
                  Upload a document and ask a question.
                  The system will retrieve relevant
                  context before generating an answer.
                </p>

                <div className="welcome-line">
                  ─────────────────────────────
                </div>

              </div>

            )}


            {loadingHistory && (

              <div className="history-loading">
                LOADING CONVERSATION...
              </div>

            )}


            {messages.map((message, index) => (

              <div
                className={`message-row ${message.role}`}
                key={`${sessionId}-${index}`}
              >

                <div className="message-label">
                  {message.role === "user"
                    ? "YOU"
                    : "AI"}
                </div>

                <div className="message-body">

                  <div className="message-content">
                    {message.content}
                  </div>


                  {message.sources?.length > 0 && (

                    <details className="sources">

                      <summary>
                        SOURCES · {message.sources.length}
                      </summary>

                      <div className="source-list">

                        {message.sources.map((source) => (

                          <div
                            className="source-card"
                            key={source.chunk_id}
                          >

                            <div className="source-top">

                              <span>
                                CHUNK {source.chunk_id}
                              </span>

                              <span>
                                {(source.similarity * 100).toFixed(1)}%
                              </span>

                            </div>

                            <div className="source-text">
                              {source.text}
                            </div>

                          </div>

                        ))}

                      </div>

                    </details>

                  )}

                </div>

              </div>

            ))}


            {loading && (

              <div className="message-row assistant">

                <div className="message-label">
                  AI
                </div>

                <div className="message-body">

                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>

                </div>

              </div>

            )}

            <div ref={messagesEndRef} />

          </div>


          {error && (

            <div className="error-banner">
              <span>ERROR</span>
              {error}
            </div>

          )}


          <form
            className="composer"
            onSubmit={handleSubmit}
          >

            <div className="composer-prefix">
              &gt;
            </div>

            <input
              type="text"
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Ask something about your documents..."
              disabled={loading || loadingHistory}
            />

            <button
              type="submit"
              disabled={
                loading ||
                loadingHistory ||
                !question.trim()
              }
            >
              {loading ? "..." : "SEND"}
            </button>

          </form>

        </section>

      </main>

    </div>
  );
}


export default App;