import { useEffect, useMemo, useRef, useState } from "react";
import "./ChatProfesores.css";

const API_BASES = [
  "http://localhost/Vestra-main/vestra/backend/api/mensajes_profesores",
  "http://localhost/vestra/backend/api/mensajes_profesores",
];

const MODERATION_ENDPOINTS = [
  "http://localhost/Vestra-main/vestra/backend/api/moderar.php",
  "http://localhost/vestra/backend/api/moderar.php",
];

const DEMO_CONTACTOS = [
  {
    id_usuario: 9002,
    nombre: "Coordinadora Demo",
    correo: "coordinadora.demo@vestra.local",
    foto: null,
  },
];

async function pedirApi(ruta, opciones = {}) {
  let ultimoError = null;

  for (const base of API_BASES) {
    try {
      const respuesta = await fetch(`${base}/${ruta}`, {
        credentials: "include",
        ...opciones,
        headers: {
          ...(opciones.headers || {}),
        },
      });

      const texto = await respuesta.text();
      const data = texto ? JSON.parse(texto) : {};

      if (!respuesta.ok && respuesta.status !== 422) {
        ultimoError = new Error(data.mensaje || "No se pudo conectar.");
        continue;
      }

      return data;
    } catch (error) {
      ultimoError = error;
    }
  }

  throw ultimoError || new Error("No se pudo conectar con el servidor.");
}

async function moderarDemo(texto) {
  for (const endpoint of MODERATION_ENDPOINTS) {
    try {
      const respuesta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          contexto: "chat privado entre profesores",
        }),
      });

      if (!respuesta.ok && respuesta.status !== 422) continue;

      const data = await respuesta.json();
      return {
        bloqueado: Boolean(data.blocked),
        mensaje: data.mensaje,
      };
    } catch (error) {
      // En modo demo, si Apache no responde, el chat sigue funcionando visualmente.
    }
  }

  return { bloqueado: false };
}

function esDemoProfesor() {
  return new URLSearchParams(window.location.search).get("demo") === "profesor";
}

function iniciales(nombre = "") {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return (partes[0]?.[0] || "P") + (partes[1]?.[0] || "");
}

function formatearHora(fecha) {
  if (!fecha) return "";
  const valor = new Date(fecha.replace(" ", "T"));
  if (Number.isNaN(valor.getTime())) return fecha;

  return valor.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatProfesores() {
  const modoDemo = esDemoProfesor();
  const [contactos, setContactos] = useState([]);
  const [contactoActivo, setContactoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargandoContactos, setCargandoContactos] = useState(true);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const listaRef = useRef(null);

  const contactoSeleccionado = useMemo(
    () => contactos.find((contacto) => contacto.id_usuario === contactoActivo),
    [contactos, contactoActivo]
  );

  useEffect(() => {
    async function cargarContactos() {
      try {
        setCargandoContactos(true);
        setAviso("");

        if (modoDemo) {
          setContactos(DEMO_CONTACTOS);
          setContactoActivo(DEMO_CONTACTOS[0].id_usuario);
          return;
        }

        const data = await pedirApi("contactos.php");

        if (!data.success) {
          setAviso(data.mensaje || "No se pudieron cargar los profesores.");
          setContactos([]);
          return;
        }

        const lista = data.contactos || [];
        setContactos(lista);
        setContactoActivo((actual) => actual || lista[0]?.id_usuario || null);
      } catch (error) {
        if (modoDemo) {
          setContactos(DEMO_CONTACTOS);
          setContactoActivo(DEMO_CONTACTOS[0].id_usuario);
          setAviso("");
        } else {
          setAviso("No se pudo conectar con el chat privado.");
        }
      } finally {
        setCargandoContactos(false);
      }
    }

    cargarContactos();
  }, [modoDemo]);

  useEffect(() => {
    if (!contactoActivo) {
      setMensajes([]);
      return;
    }

    async function cargarMensajes() {
      try {
        setCargandoMensajes(true);
        setAviso("");

        if (modoDemo) {
          setMensajes([
            {
              id: 1,
              texto: "Hola, este es un contacto demo para probar el chat privado de profesores.",
              fecha: new Date().toISOString(),
              propio: false,
            },
          ]);
          return;
        }

        const data = await pedirApi("listar.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_contacto: contactoActivo }),
        });

        if (!data.success) {
          setAviso(data.mensaje || "No se pudo cargar la conversacion.");
          setMensajes([]);
          return;
        }

        setMensajes(data.mensajes || []);
      } catch (error) {
        if (modoDemo) {
          setMensajes([]);
        } else {
          setAviso("No se pudo cargar la conversacion.");
        }
      } finally {
        setCargandoMensajes(false);
      }
    }

    cargarMensajes();
  }, [contactoActivo, modoDemo]);

  useEffect(() => {
    listaRef.current?.scrollTo({
      top: listaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [mensajes]);

  async function enviarMensaje(event) {
    event.preventDefault();

    const limpio = texto.trim();
    if (!limpio || !contactoActivo || enviando) return;

    try {
      setEnviando(true);
      setAviso("");

      if (modoDemo) {
        const revision = await moderarDemo(limpio);
        if (revision.bloqueado) {
          setAviso(
            revision.mensaje ||
              "Tu mensaje fue bloqueado por el filtro de convivencia de Vestra."
          );
          return;
        }

        setMensajes((actuales) => [
          ...actuales,
          {
            id: Date.now(),
            texto: limpio,
            fecha: new Date().toISOString(),
            propio: true,
          },
        ]);
        setTexto("");
        return;
      }

      const data = await pedirApi("enviar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_receptor: contactoActivo,
          texto: limpio,
        }),
      });

      if (!data.success) {
        setAviso(data.mensaje || "No se pudo enviar el mensaje.");
        return;
      }

      setTexto("");
      const refrescar = await pedirApi("listar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_contacto: contactoActivo }),
      });

      setMensajes(refrescar.mensajes || []);
    } catch (error) {
      setAviso("No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="prof-chat-page">
      <section className="prof-chat-shell">
        <header className="prof-chat-header">
          <div>
            <p className="eyebrow">Comunicacion interna</p>
            <h1>Chat de profesores</h1>
          </div>
          <span>Privado y moderado con IA</span>
        </header>

        <div className="prof-chat-layout">
          <aside className="prof-chat-contacts" aria-label="Profesores">
            <div className="prof-chat-section-title">
              <strong>Profesores</strong>
              <span>{contactos.length}</span>
            </div>

            {cargandoContactos ? (
              <p className="prof-chat-empty">Cargando contactos...</p>
            ) : contactos.length === 0 ? (
              <p className="prof-chat-empty">No hay otros profesores disponibles.</p>
            ) : (
              contactos.map((contacto) => (
                <button
                  key={contacto.id_usuario}
                  type="button"
                  className={`prof-contact ${
                    contactoActivo === contacto.id_usuario ? "active" : ""
                  }`}
                  onClick={() => setContactoActivo(contacto.id_usuario)}
                >
                  <span className="prof-contact-avatar">
                    {iniciales(contacto.nombre)}
                  </span>
                  <span>
                    <strong>{contacto.nombre}</strong>
                    <small>{contacto.correo}</small>
                  </span>
                </button>
              ))
            )}
          </aside>

          <section className="prof-chat-panel" aria-label="Conversacion privada">
            <div className="prof-chat-current">
              {contactoSeleccionado ? (
                <>
                  <span className="prof-contact-avatar large">
                    {iniciales(contactoSeleccionado.nombre)}
                  </span>
                  <div>
                    <strong>{contactoSeleccionado.nombre}</strong>
                    <small>{contactoSeleccionado.correo}</small>
                  </div>
                </>
              ) : (
                <strong>Selecciona un profesor</strong>
              )}
            </div>

            {aviso && (
              <div className="prof-chat-alert" role="alert">
                {aviso}
              </div>
            )}

            <div className="prof-chat-messages" ref={listaRef}>
              {cargandoMensajes ? (
                <p className="prof-chat-empty">Cargando conversacion...</p>
              ) : mensajes.length === 0 ? (
                <p className="prof-chat-empty">
                  Aun no hay mensajes. Puedes iniciar la conversacion.
                </p>
              ) : (
                mensajes.map((mensaje) => (
                  <article
                    key={mensaje.id}
                    className={`prof-message ${mensaje.propio ? "own" : "other"}`}
                  >
                    <p>{mensaje.texto}</p>
                    <time>{formatearHora(mensaje.fecha)}</time>
                  </article>
                ))
              )}
            </div>

            <form className="prof-chat-form" onSubmit={enviarMensaje}>
              <input
                type="text"
                placeholder="Escribe un mensaje privado..."
                value={texto}
                maxLength={1000}
                disabled={!contactoActivo || enviando}
                onChange={(event) => setTexto(event.target.value)}
              />
              <button type="submit" disabled={!texto.trim() || !contactoActivo || enviando}>
                Enviar
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
