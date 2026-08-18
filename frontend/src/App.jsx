import { useEffect, useRef, useState } from "react";

import {
  checkHealth,
  uploadDocument,
  queryDocuments,
} from "./api";


function App() {
  const [health, setHealth] = useState("checking");

  const [documents, setDocuments] = useState([]);

  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("");

  const [sessionId, setSessionId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);


  useEffect(() => {
    checkHealth()
      .then(() => setHealth("online"))
      .catch(() => setHealth("offline"));
  }, []);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);


  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const result = await uploadDocument(file);

      setDocuments((current) => [
        ...current,
        {
          name: result.filename,
          s3Key: result.s3_key,
          documentId: result.document_id,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }


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

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
          sources: result.results || [],
        },
      ]);
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


            {messages.map((message, index) => (

              <div
                className={`message-row ${message.role}`}
                key={index}
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
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !question.trim()}
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
