import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";
import botPhoto from "../assets/logito.png";

const API_URL = "http://localhost/Vestra/vestra/backend/api/chatbot.php";
const STORAGE_KEY = "vestra_chatbot_session";
const TEST_WITHOUT_DATABASE = true;
const TEASER_VISIBLE_MS = 7000;
const TEASER_GAP_MS = 5000;

const initialMessages = [
  {
    id: "welcome",
    sender: "bot",
    text: "Hola, soy Vivi. Estoy aqui para ayudarte a conocer Vestra, sus clubes, publicaciones, inscripciones y el funcionamiento del proyecto.",
  },
];

const teaserMessages = [
  "Soy Vivi, estoy para ayudarte",
  "Preguntame que es Vestra",
  "Te cuento sobre los clubes",
  "Quieres ideas para consultar?",
];

const suggestedQuestions = [
  "Que es Vestra?",
  "Que clubes hay?",
  "Como me inscribo a un club?",
  "Que publicaciones hay?",
  "Que problema resuelve Vestra?",
  "Como funciona la base de datos?",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [teaserVisible, setTeaserVisible] = useState(false);
  const [teaserIndex, setTeaserIndex] = useState(0);
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

  useEffect(() => {
    if (open) {
      setTeaserVisible(false);
      return;
    }

    let hideTimer;

    const showTeaser = () => {
      setTeaserVisible(true);

      hideTimer = setTimeout(() => {
        setTeaserVisible(false);
        setTeaserIndex((current) => (current + 1) % teaserMessages.length);
      }, TEASER_VISIBLE_MS);
    };

    const firstTimer = setTimeout(showTeaser, 900);
    const interval = setInterval(
      showTeaser,
      TEASER_VISIBLE_MS + TEASER_GAP_MS
    );

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, [open]);

  async function sendText(textToSend) {
    const text = textToSend.trim();
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
          sin_bd: TEST_WITHOUT_DATABASE,
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

      if (result.bloqueado) {
        setMessages((previous) =>
          previous.filter((message) => message.id !== userMessage.id)
        );
      }

      setMessages((previous) => [
        ...previous,
        ...(result.bloqueado
          ? [
              {
                id: `notice-${Date.now()}`,
                sender: "system",
                text: "Tu mensaje fue eliminado por usar vocabulario inadecuado. Puedes seguir hablando con Vivi si mantienes una conversacion respetuosa.",
              },
            ]
          : []),
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

  async function sendMessage(event) {
    event.preventDefault();
    await sendText(input);
  }

  async function sendSuggestedQuestion(question) {
    await sendText(question);
  }

  return (
    <div className={`chatbot ${open ? "open" : ""}`}>
      {open && (
        <section className="chatbot-panel" aria-label="Chatbot Vivi">
          <header className="chatbot-header">
            <div className="chatbot-identity">
              <img src={botPhoto} alt="" className="chatbot-avatar" />
              <div>
                <strong>Vivi</strong>
                <span>Tu guia de Vestra</span>
              </div>
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

          <div className="chatbot-guide">
            <div className="chatbot-guide-copy">
              <span>Ideas para empezar</span>
              <strong>Elige una pregunta o escribe la tuya.</strong>
            </div>

            <div className="chatbot-suggestions" aria-label="Preguntas sugeridas">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendSuggestedQuestion(question)}
                  disabled={loading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

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
              <div className="chatbot-typing" aria-live="polite">
                <span className="chatbot-typing-label">Pensando</span>
                <span className="chatbot-typing-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
          </div>

          <form className="chatbot-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Preguntale a Vivi"
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

      {!open && teaserVisible && (
        <div className="chatbot-teaser" role="status">
          {teaserMessages[teaserIndex]}
        </div>
      )}

      <button
        type="button"
        className="chatbot-toggle"
        aria-label={open ? "Cerrar chatbot" : "Abrir chatbot"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <i className="icon-cancel" aria-hidden="true" />
        ) : (
          <img src={botPhoto} alt="" className="chatbot-toggle-photo" />
        )}
      </button>
    </div>
  );
}
