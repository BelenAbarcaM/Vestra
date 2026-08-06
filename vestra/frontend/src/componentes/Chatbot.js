import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";

const API_URL = "http://localhost/vestra/backend/api/chatbot.php";
const STORAGE_KEY = "vestra_chatbot_session";

const initialMessages = [
  {
    id: "welcome",
    sender: "bot",
    text: "Hola, soy VestraBot. Preguntame sobre Vestra, clubes, inscripciones, publicaciones o la base de datos.",
  },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  const listRef = useRef(null);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);

  async function sendMessage(event) {
    event.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          mensaje: text,
          session_token: session.session_token || "",
          conversacion_id: session.conversacion_id || 0,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.mensaje || "No se pudo responder.");
      }

      setSession({
        session_token: result.session_token,
        conversacion_id: result.conversacion_id,
      });

      setMessages((previous) => [
        ...previous,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: result.respuesta,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          sender: "bot",
          text: "No pude conectar con el servidor. Revisa que Apache, MySQL y la carpeta vestra esten activos en localhost.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`chatbot ${open ? "open" : ""}`}>
      {open && (
        <section className="chatbot-panel" aria-label="Chatbot Vestra">
          <header className="chatbot-header">
            <div>
              <strong>VestraBot</strong>
              <span>Asistente escolar</span>
            </div>
            <button
              type="button"
              className="chatbot-icon-btn"
              aria-label="Cerrar chatbot"
              onClick={() => setOpen(false)}
            >
              <i className="icon-cancel" aria-hidden="true" />
            </button>
          </header>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${message.sender}`}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-message bot muted">Pensando...</div>
            )}
          </div>

          <form className="chatbot-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta"
              disabled={loading}
            />
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={loading || !input.trim()}
            >
              <i className="icon-comment" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chatbot-toggle"
        aria-label={open ? "Cerrar chatbot" : "Abrir chatbot"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <i className={open ? "icon-cancel" : "icon-comment"} aria-hidden="true" />
      </button>
    </div>
  );
}
