
import React, { useEffect, useRef, useState } from 'react';
import './ChatConversacion.css';

const API = 'http://localhost/vestra/backend/api/chats/';

const MODERATION_ENDPOINTS = [
  'http://localhost/Vestra-main/vestra/backend/api/moderar.php',
  'http://localhost/vestra/backend/api/moderar.php',
];

// Obtener la ruta completa de la fotografía del contacto.
function obtenerFoto(ruta) {
  if (!ruta) {
    return 'http://localhost/vestra/uploads/perfiles/default.jpeg';
  }

  if (/^https?:\/\//i.test(ruta)) {
    return ruta;
  }

  const rutaLimpia = ruta.trim().replace(/^\/+/, '');

  if (
    rutaLimpia.startsWith('uploads/') ||
    rutaLimpia.startsWith('backend/')
  ) {
    return `http://localhost/vestra/${rutaLimpia}`;
  }

  return `http://localhost/vestra/uploads/perfiles/${rutaLimpia}`;
}

// Obtener las iniciales del contacto.
function iniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0]?.toUpperCase() || '')
    .join('');
}

// Mostrar la hora del mensaje.
function mostrarFecha(fecha) {
  if (!fecha) return '';

  const fechaLocal = new Date(fecha.replace(' ', 'T'));

  if (Number.isNaN(fechaLocal.getTime())) return '';

  return fechaLocal.toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Moderar el mensaje antes de enviarlo.
async function moderarMensaje(texto) {
  let ultimoError = null;

  for (const endpoint of MODERATION_ENDPOINTS) {
    try {
      const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto,
          contexto: 'Chat privado de Vestra',
        }),
      });

      let datos;

      try {
        datos = await respuesta.json();
      } catch {
        ultimoError = new Error(
          'El moderador devolvió una respuesta inválida.'
        );
        continue;
      }

      // Un 422 puede contener una decisión de moderación.
      if (!respuesta.ok && respuesta.status !== 422) {
        ultimoError = new Error(
          datos.mensaje || 'No se pudo verificar el mensaje.'
        );
        continue;
      }

      // El formato esperado es { blocked: true/false, mensaje: "..." }.
      if (typeof datos.blocked !== 'boolean') {
        ultimoError = new Error(
          'La respuesta del moderador no contiene el campo blocked.'
        );
        continue;
      }

      return {
        bloqueado: datos.blocked,
        mensaje: datos.mensaje || '',
      };
    } catch (error) {
      ultimoError = error;
    }
  }

  // Si no se puede comprobar el mensaje, no se envía.
  return {
    bloqueado: true,
    mensaje:
      ultimoError?.message ||
      'No se pudo conectar con el moderador. Inténtalo de nuevo.',
  };
}

export default function ChatConversacion({
  contacto,
  tipo,
  onVolver,
  onConversacionActualizada,
}) {
  const idUsuario = Number(localStorage.getItem('id_usuario') || 0);

  const [mensajes, setMensajes] = useState([]);
  const [contenido, setContenido] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');

  const listaRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar los mensajes de la conversación seleccionada.
  useEffect(() => {
    let cancelado = false;

    async function cargarMensajes() {
      setMensajes([]);

      if (!contacto?.id_conversacion) {
        setCargando(false);
        setAviso('');
        return;
      }

      try {
        setCargando(true);
        setAviso('');

        const respuesta = await fetch(
          `${API}obtener_mensajes.php?id_conversacion=${encodeURIComponent(
            contacto.id_conversacion
          )}`,
          {
            credentials: 'include',
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success) {
          throw new Error(
            datos.error || 'No se pudieron cargar los mensajes.'
          );
        }

        if (!cancelado) {
          setMensajes(datos.mensajes || []);
        }
      } catch (error) {
        if (!cancelado) {
          setAviso(
            error.message || 'Ocurrió un error al cargar los mensajes.'
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarMensajes();

    return () => {
      cancelado = true;
    };
  }, [contacto?.id_conversacion]);

  // Mantener visible el mensaje más reciente.
  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  // Enviar un mensaje después de comprobarlo con el moderador.
  async function enviarMensaje(evento) {
    evento.preventDefault();

    const texto = contenido.trim();

    if (
      !texto ||
      enviando ||
      !contacto?.id_contacto
    ) {
      return;
    }

    try {
      setEnviando(true);
      setAviso('');

      // PASO 1: verificar el contenido.
      const revision = await moderarMensaje(texto);

      if (revision.bloqueado) {
        setAviso(
          revision.mensaje ||
            'Tu mensaje fue bloqueado por el filtro de convivencia de Vestra.'
        );
        return;
      }

      // PASO 2: si está permitido, enviarlo mediante tu API original.
      const respuesta = await fetch(`${API}enviar_mensaje.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_destinatario: contacto.id_contacto,
          contenido: texto,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(
          datos.error || 'No se pudo enviar el mensaje.'
        );
      }

      setContenido('');

      if (datos.id_conversacion) {
        onConversacionActualizada?.(datos.id_conversacion);
      }

      // Mostrar inmediatamente el mensaje enviado.
      setMensajes(actuales => [
        ...actuales,
        {
          id_mensaje: datos.id_mensaje,
          id_remitente: idUsuario,
          contenido: texto,
          fecha_envio: new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' '),
          leido: 0,
          es_mio: true,
        },
      ]);

      inputRef.current?.focus();
    } catch (error) {
      setAviso(
        error.message || 'Ocurrió un error al enviar el mensaje.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="chat-conversacion">
      <header className="chat-conversacion-header">
        <button
          type="button"
          className="chat-volver"
          onClick={onVolver}
          aria-label="Volver a la lista de contactos"
          title="Volver"
        >
          ←
        </button>

        <span className="chats-avatar grande">
          {contacto.foto_contacto ? (
            <img
              src={obtenerFoto(contacto.foto_contacto)}
              alt=""
              onError={evento => {
                evento.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            iniciales(contacto.nombre_contacto)
          )}
        </span>

        <div className="chat-contacto-datos">
          <h2>{contacto.nombre_contacto}</h2>
          <p>{tipo === 1 ? 'Profesor' : 'Estudiante'}</p>
        </div>
      </header>

      {aviso && (
        <div className="chat-aviso" role="alert">
          {aviso}
        </div>
      )}

      <div className="chat-mensajes" ref={listaRef}>
        {cargando ? (
          <p className="chats-estado">Cargando mensajes...</p>
        ) : mensajes.length === 0 ? (
          <div className="chat-vacio">
            <span aria-hidden="true">♡</span>
            <h3>¡Empieza la conversación!</h3>
            <p>Envía un mensaje para comenzar a hablar.</p>
          </div>
        ) : (
          mensajes.map(mensaje => {
            const esMio =
              mensaje.es_mio === true ||
              Number(mensaje.id_remitente) === idUsuario;

            return (
              <div
                key={mensaje.id_mensaje}
                className={`chat-mensaje-fila ${
                  esMio ? 'mio' : 'otro'
                }`}
              >
                <div className="chat-burbuja">
                  <p>{mensaje.contenido}</p>

                  <span className="chat-mensaje-hora">
                    {mostrarFecha(mensaje.fecha_envio)}

                    {esMio && Number(mensaje.leido) === 1 && (
                      <span title="Leído"> ✓✓</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="chat-formulario" onSubmit={enviarMensaje}>
        <input
          ref={inputRef}
          type="text"
          value={contenido}
          onChange={evento => setContenido(evento.target.value)}
          placeholder="Escribe tu mensaje..."
          maxLength={5000}
          aria-label="Escribe tu mensaje"
          disabled={enviando}
        />

        <button
          type="submit"
          disabled={!contenido.trim() || enviando}
          aria-label="Enviar mensaje"
          title="Enviar mensaje"
        >
          {enviando ? '…' : '➤'}
        </button>
      </form>
    </div>
  );
}