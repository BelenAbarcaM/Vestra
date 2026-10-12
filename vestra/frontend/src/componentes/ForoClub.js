
import { useCallback, useEffect, useRef, useState } from "react";
import "./ForoClub.css";

const API_FORO = "http://localhost/vestra/backend/api/foro";

function obtenerFotoUrl(foto) {
  if (!foto) return null;

  if (/^https?:\/\//i.test(foto)) {
    return foto;
  }

  const ruta = foto.replace(/^\/+/, "");

  if (ruta.startsWith("uploads/")) {
    return `http://localhost/vestra/${ruta}`;
  }

  if (ruta.startsWith("perfiles/")) {
    return `http://localhost/vestra/uploads/${ruta}`;
  }

  return `http://localhost/vestra/uploads/perfiles/${ruta}`;
}

function obtenerIniciales(nombre = "") {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] || "")
    .join("")
    .toUpperCase();
}

function formatearHora(fecha) {
  if (!fecha) return "";

  // MySQL devuelve "YYYY-MM-DD HH:mm:ss".
  const fechaNormalizada = fecha.includes("T")
    ? fecha
    : fecha.replace(" ", "T");

  const date = new Date(fechaNormalizada);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ForoClub({ idClub, onVolver }) {
  const [nombreClub, setNombreClub] = useState("Foro del club");
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");

  const listaRef = useRef(null);
  const campoRef = useRef(null);
  const ultimoMensajeRef = useRef(null);

  const cargarMensajes = useCallback(
    async (mostrarCarga = false) => {
      if (!idClub) {
        setError("No se ha seleccionado un club válido.");
        setCargando(false);
        return;
      }

      if (mostrarCarga) {
        setCargando(true);
      }

      try {
        const respuesta = await fetch(
          `${API_FORO}/obtener_mensajes.php?id_club=${encodeURIComponent(idClub)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success) {
          throw new Error(
            datos.mensaje || "No se pudieron cargar los mensajes."
          );
        }

        setNombreClub(datos.nombre_club || "Foro del club");

        setMensajes((anteriores) => {
          const nuevos = datos.mensajes || [];

          if (JSON.stringify(anteriores) === JSON.stringify(nuevos)) {
            return anteriores;
          }

          return nuevos;
        });

        setError("");
      } catch (err) {
        setError(
          err.message || "No se pudo conectar con el foro."
        );
      } finally {
        setCargando(false);
      }
    },
    [idClub]
  );

  // Cargar el historial y actualizarlo periódicamente.
  useEffect(() => {
    let activo = true;
    let temporizador;

    const actualizar = async (primeraCarga = false) => {
      if (!activo) return;

      await cargarMensajes(primeraCarga);

      if (activo) {
        temporizador = setTimeout(() => actualizar(false), 4000);
      }
    };

    actualizar(true);

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [cargarMensajes]);

  // Bajar al último mensaje cuando cambie la conversación.
  useEffect(() => {
    if (!cargando && listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  async function enviarMensaje(evento) {
    evento.preventDefault();

    const mensaje = texto.trim();

    if (!mensaje || enviando || !idClub) return;

    setEnviando(true);
    setErrorEnvio("");

    try {
      const respuesta = await fetch(
        `${API_FORO}/enviar_mensaje.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_club: Number(idClub),
            mensaje,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(
          datos.mensaje || "No se pudo enviar el mensaje."
        );
      }

      if (datos.datos) {
        setMensajes((anteriores) => {
          const yaExiste = anteriores.some(
            (item) =>
              Number(item.id_mensaje) ===
              Number(datos.datos.id_mensaje)
          );

          if (yaExiste) return anteriores;

          return [...anteriores, datos.datos].sort(
            (a, b) =>
              new Date(a.fecha_envio.replace(" ", "T")) -
                new Date(b.fecha_envio.replace(" ", "T")) ||
              Number(a.id_mensaje) - Number(b.id_mensaje)
          );
        });
      }

      setTexto("");
      campoRef.current?.focus();
    } catch (err) {
      setErrorEnvio(
        err.message || "No se pudo enviar el mensaje."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="foro-club-page">
      <section className="foro-club-card">
        <header className="foro-club-header">
          <button
            type="button"
            className="foro-volver"
            onClick={onVolver}
            aria-label="Volver al club"
            title="Volver al club"
          >
            <span aria-hidden="true">←</span>
          </button>

          <div className="foro-header-icon" aria-hidden="true">
            <span>✦</span>
          </div>

          <div className="foro-header-info">
            <h1>{nombreClub}</h1>
            <p>Foro del club · Conversación grupal</p>
          </div>
        </header>

        <div className="foro-bienvenida">

          <div>
            <strong>¡Este espacio es de todos!</strong>
            <p>
              Comparte ideas, haz preguntas y conversa con otros
              estudiantes y profesores.
            </p>
          </div>
        </div>

        <div
          className="foro-mensajes"
          ref={listaRef}
          aria-live="polite"
          aria-label="Mensajes del foro"
        >
          {cargando ? (
            <div className="foro-estado">
              <span className="foro-spinner" />
              <p>Cargando conversación...</p>
            </div>
          ) : error ? (
            <div className="foro-estado foro-estado-error">
              <span>!</span>
              <p>{error}</p>

              <button
                type="button"
                onClick={() => cargarMensajes(true)}
              >
                Intentar de nuevo
              </button>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="foro-vacio">
              <div className="foro-vacio-icono" aria-hidden="true">
                <span>✉</span>
              </div>

              <h2>¡Inicia la conversación!</h2>

              <p>
                Todavía no hay mensajes en este foro. Puedes ser la
                primera persona en escribir.
              </p>
            </div>
          ) : (
            mensajes.map((mensaje) => {
              const esMio = Number(mensaje.id_usuario) ===
                Number(
                  window.localStorage.getItem("id_usuario")
                );

              const foto = obtenerFotoUrl(mensaje.foto_usuario);

              return (
                <article
                  key={mensaje.id_mensaje}
                  className={`foro-mensaje ${
                    esMio ? "foro-mensaje-mio" : ""
                  }`}
                >
                  {!esMio && (
                    <div className="foro-avatar">
                      {foto ? (
                        <img
                          src={foto}
                          alt=""
                          onError={(evento) => {
                            evento.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}

                      <span>{obtenerIniciales(mensaje.nombre_usuario)}</span>
                    </div>
                  )}

                  <div className="foro-mensaje-contenido">
                    {!esMio && (
                      <span className="foro-autor">
                        {mensaje.nombre_usuario || "Usuario"}
                      </span>
                    )}

                    <div className="foro-burbuja">
                      <p>{mensaje.mensaje}</p>

                      <time className="foro-hora">
                        {formatearHora(mensaje.fecha_envio)}
                      </time>
                    </div>
                  </div>

                  {esMio && (
                    <div className="foro-avatar foro-avatar-mio">
                      {foto ? (
                        <img
                          src={foto}
                          alt=""
                          onError={(evento) => {
                            evento.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}

                      <span>{obtenerIniciales(mensaje.nombre_usuario)}</span>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        <form className="foro-formulario" onSubmit={enviarMensaje}>
          <div className="foro-campo-contenedor">
            <textarea
              ref={campoRef}
              value={texto}
              onChange={(evento) => {
                setTexto(evento.target.value);
                setErrorEnvio("");
              }}
              onKeyDown={(evento) => {
                if (
                  evento.key === "Enter" &&
                  !evento.shiftKey &&
                  !evento.nativeEvent.isComposing
                ) {
                  evento.preventDefault();
                  evento.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Escribe un mensaje..."
              aria-label="Escribe un mensaje"
              maxLength={5000}
              rows={1}
              disabled={cargando || Boolean(error)}
            />
          </div>

          <button
            type="submit"
            className="foro-enviar"
            disabled={
              !texto.trim() || enviando || cargando || Boolean(error)
            }
            aria-label="Enviar mensaje"
            title="Enviar mensaje"
          >
            {enviando ? (
              <span className="foro-enviando-puntos">...</span>
            ) : (
              <span aria-hidden="true">➤</span>
            )}
          </button>
        </form>

        {errorEnvio && (
          <p className="foro-error-envio" role="alert">
            {errorEnvio}
          </p>
        )}
      </section>
    </main>
  );
}