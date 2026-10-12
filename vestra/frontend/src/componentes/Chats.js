
import React, { useCallback, useEffect, useState } from 'react';
import './Chats.css';
import ChatConversacion from './ChatConversacion';

const API = 'http://localhost/vestra/backend/api/chats/';


function obtenerFoto(ruta) {
  if (!ruta) {
    return 'http://localhost/vestra/uploads/perfiles/default.jpeg';
  }

  if (/^https?:\/\//i.test(ruta)) {
    return ruta;
  }

  const rutaLimpia = ruta.trim().replace(/^\/+/, '');

  if (rutaLimpia.startsWith('uploads/')) {
    return `http://localhost/vestra/${rutaLimpia}`;
  }

  if (rutaLimpia.startsWith('backend/')) {
    return `http://localhost/vestra/${rutaLimpia}`;
  }

  return `http://localhost/vestra/uploads/perfiles/${rutaLimpia}`;
}


function iniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte[0]?.toUpperCase() || '')
    .join('');
}

function mostrarFecha(fecha) {
  if (!fecha) return '';

  const fechaLocal = new Date(fecha.replace(' ', 'T'));
  if (Number.isNaN(fechaLocal.getTime())) return '';

  return fechaLocal.toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Chats() {
  const [tipo, setTipo] = useState(
    Number(localStorage.getItem('tipo_usuario') || 0)
  );
  const [contactos, setContactos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [aviso, setAviso] = useState('');

  
useEffect(() => {
  document.body.classList.toggle('chat-abierto', Boolean(seleccionado));

  return () => {
    document.body.classList.remove('chat-abierto');
  };
}, [seleccionado]);

  useEffect(() => {
    setTipo(Number(localStorage.getItem('tipo_usuario') || 0));
  }, []);

  const cargarContactos = useCallback(async () => {
    try {
      setCargando(true);
      setAviso('');

      const respuesta = await fetch(
        `${API}listar_conversaciones.php`,
        { credentials: 'include' }
      );
      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.error || 'No se pudieron cargar los chats.');
      }

      const conversaciones = datos.conversaciones || [];

      if (tipo === 1) {
        const respuestaProfesores = await fetch(
          `${API}listar_profesores.php`,
          { credentials: 'include' }
        );
        const datosProfesores = await respuestaProfesores.json();

        if (!respuestaProfesores.ok || !datosProfesores.success) {
          throw new Error(
            datosProfesores.error || 'No se pudieron cargar los profesores.'
          );
        }

        
const profesores = (datosProfesores.profesores || []).map(profesor => {
  const chat = conversaciones.find(
    conversacion =>
      Number(conversacion.id_contacto) ===
      Number(profesor.id_usuario)
  );

  return {
    id_contacto: Number(profesor.id_usuario),
    nombre_contacto: profesor.nombre,
    foto_contacto: profesor.foto,
    bio: profesor.bio || '',
    id_conversacion: chat?.id_conversacion || null,
    ultimo_mensaje: chat?.ultimo_mensaje || '',
    fecha_ultimo_mensaje: chat?.fecha_ultimo_mensaje || null,
    mensajes_no_leidos: Number(chat?.mensajes_no_leidos || 0)
  };
});

// Primero aparecen los profesores con mensajes recientes.
// Los que todavía no tienen conversación quedan al final.
profesores.sort((a, b) => {
  if (!a.fecha_ultimo_mensaje && !b.fecha_ultimo_mensaje) {
    return a.nombre_contacto.localeCompare(b.nombre_contacto, 'es');
  }

  if (!a.fecha_ultimo_mensaje) return 1;
  if (!b.fecha_ultimo_mensaje) return -1;

  return String(b.fecha_ultimo_mensaje).localeCompare(
    String(a.fecha_ultimo_mensaje)
  );
});

setContactos(profesores);

      } else if (tipo === 2) {
        setContactos(conversaciones);
      } else {
        setContactos([]);
        setAviso('Inicia sesión con una cuenta de estudiante o profesor.');
      }
    } catch (error) {
      setAviso(error.message || 'Ocurrió un error al cargar los contactos.');
    } finally {
      setCargando(false);
    }
  }, [tipo]);

  useEffect(() => {
    if (tipo === 1 || tipo === 2) {
      cargarContactos();
    } else {
      setCargando(false);
    }
  }, [tipo, cargarContactos]);

  const contactosFiltrados = contactos.filter(contacto =>
    (contacto.nombre_contacto || '')
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  function actualizarConversacion(idConversacion) {
    setSeleccionado(actual =>
      actual ? { ...actual, id_conversacion: idConversacion } : actual
    );
    cargarContactos();
  }

  if (tipo !== 1 && tipo !== 2) {
    return (
      <section className="chats-root">
        <div className="chats-aviso">
          Inicia sesión con una cuenta de estudiante o profesor para utilizar
          los mensajes.
        </div>
      </section>
    );
  }

  if (seleccionado) {
    return (
      <section className="chats-root">
        <ChatConversacion
          key={`${seleccionado.id_contacto}-${seleccionado.id_conversacion || 'nuevo'}`}
          contacto={seleccionado}
          tipo={tipo}
          onVolver={() => {
  setSeleccionado(null);
  cargarContactos();
}}
          onConversacionActualizada={actualizarConversacion}
        />
      </section>
    );
  }

  return (
    <section className="chats-root">
      <div className="chats-app">
        <header className="chats-sidebar-header">
          <div>
            <span className="chats-eyebrow">VESTRA</span>
            <h1>Mensajes</h1>
            <p>
              {tipo === 1
                ? 'Conversa con tus profesores'
                : 'Tus conversaciones con estudiantes'}
            </p>
          </div>
          <span className="chats-header-icon" aria-hidden="true">✉</span>
        </header>

        <div className="chats-busqueda">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder={tipo === 1 ? 'Buscar profesor...' : 'Buscar estudiante...'}
            value={busqueda}
            onChange={evento => setBusqueda(evento.target.value)}
            aria-label="Buscar contacto"
          />
        </div>

        <div className="chats-lista-titulo">
          {tipo === 1 ? 'PROFESORES' : 'CONVERSACIONES'}
          <span>{contactosFiltrados.length}</span>
        </div>

        <div className="chats-contactos">
          {cargando ? (
            <p className="chats-estado">Cargando contactos...</p>
          ) : contactosFiltrados.length === 0 ? (
            <p className="chats-estado">
              {aviso ||
                (tipo === 1
                  ? 'No se encontraron profesores.'
                  : 'Todavía nadie te ha escrito.')}
            </p>
          ) : (
            contactosFiltrados.map(contacto => (
              <button
                type="button"
                key={contacto.id_contacto}
                className="chats-contacto"
                onClick={() => setSeleccionado(contacto)}
              >
                <span className="chats-avatar">
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

                <span className="chats-contacto-info">
                  <span className="chats-contacto-nombre">
                    {contacto.nombre_contacto}
                  </span>
                  <span className="chats-contacto-preview">
                    {contacto.ultimo_mensaje ||
                      (tipo === 1 ? 'Iniciar conversación' : 'Abrir conversación')}
                  </span>
                </span>

                <span className="chats-contacto-extra">
                  {contacto.fecha_ultimo_mensaje && (
                    <span className="chats-hora">
                      {mostrarFecha(contacto.fecha_ultimo_mensaje)}
                    </span>
                  )}
                  {Number(contacto.mensajes_no_leidos) > 0 && (
                    <span className="chats-no-leidos">
                      {contacto.mensajes_no_leidos}
                    </span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}