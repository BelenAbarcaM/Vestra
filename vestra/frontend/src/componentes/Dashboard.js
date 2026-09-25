import React, { useState } from "react";
import "./Dashboard.css";
import "../App.css";

const nombreClub = "Club de Robótica";

const solicitudesIniciales = [
  { id: 1, nombre: "Sofía García", correo: "sofia.garcia@colegio.edu", seccion: "11-B", motivo: "Le gusta el club de diseño" },
  { id: 2, nombre: "Mateo Ruiz", correo: "mateo.ruiz@colegio.edu", seccion: "10-A", motivo: "Quiere participar en robótica" },
  { id: 3, nombre: "Valentina López", correo: "valentina.lopez@colegio.edu", seccion: "12-C", motivo: "Interesada en talleres de debate" },
  { id: 4, nombre: "Javier Torres", correo: "javier.torres@colegio.edu", seccion: "9-C", motivo: "Quiere entrar al club" },
];

const miembrosIniciales = [
  { id: 1, nombre: "Ana", estado: "Activa" },
  { id: 2, nombre: "Luis", estado: "Activa" },
  { id: 3, nombre: "Camila", estado: "Activa" },
  { id: 4, nombre: "Jorge", estado: "Media" },
  { id: 5, nombre: "María", estado: "Activa" },
  { id: 6, nombre: "Daniel", estado: "Deficiente" },
  { id: 7, nombre: "Renata", estado: "Activa" },
];

const publicacionesPorRango = {
  7: [
    { titulo: "Noticia de torneo", likes: 72 },
    { titulo: "Proyecto final", likes: 84 },
    { titulo: "Inscripciones", likes: 96 },
    { titulo: "Premiación", likes: 80 },
  ],
  30: [
    { titulo: "Noticia de torneo", likes: 102 },
    { titulo: "Victoria del torneo", likes: 94 },
    { titulo: "Inscripciones abiertas", likes: 120 },
    { titulo: "Próxima premiación", likes: 116 },
    { titulo: "Taller de innovación", likes: 130 },
  ],
  3: [
    { titulo: "Noticia de torneo", likes: 118 },
    { titulo: "Victoria del torneo", likes: 142 },
    { titulo: "Inscripciones abiertas", likes: 168 },
    { titulo: "Próxima premiación", likes: 150 },
    { titulo: "Resultados del club", likes: 132 },
  ],
  6: [
    { titulo: "Noticia de torneo", likes: 124 },
    { titulo: "Victoria del torneo", likes: 156 },
    { titulo: "Inscripciones abiertas", likes: 184 },
    { titulo: "Próxima premiación", likes: 148 },
    { titulo: "Taller de innovación", likes: 164 },
  ],
  9: [
    { titulo: "Noticia de torneo", likes: 134 },
    { titulo: "Victoria del torneo", likes: 178 },
    { titulo: "Inscripciones abiertas", likes: 196 },
    { titulo: "Próxima premiación", likes: 172 },
    { titulo: "Resultados del club", likes: 158 },
  ],
  12: [
    { titulo: "Noticia de torneo", likes: 142 },
    { titulo: "Victoria del torneo", likes: 118 },
    { titulo: "Inscripciones abiertas", likes: 176 },
    { titulo: "Próxima premiación", likes: 132 },
    { titulo: "Resultados del club", likes: 96 },
    { titulo: "Taller de innovación", likes: 154 },
  ],
};

const likesPorMes = [52, 64, 71, 87, 94, 118, 126, 148, 161, 179, 198, 224];
const crecimientoMiembros = [18, 22, 27, 32, 38, 44, 49, 54, 60, 66, 72, 78];
const asistenciaPorMes = [72, 76, 78, 81, 84, 86, 88, 90, 92, 91, 89, 94];
const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const getUltimosMeses = (cantidad) => {
  const hoy = new Date();
  const indiceMesActual = hoy.getMonth();
  const primerMes = (indiceMesActual - (cantidad - 1) + 12) % 12;
  const resultado = [];

  for (let i = 0; i < cantidad; i += 1) {
    resultado.push(meses[(primerMes + i) % 12]);
  }

  return resultado;
};

const getComparacionPorRango = (cantidad) => {
  const mesesSeleccionados = getUltimosMeses(cantidad);

  return mesesSeleccionados.map((mes) => {
    const item = comparacion.find((entry) => entry.mes === mes);
    return item || { mes, miembros: 0, likes: 0, asistencia: 0, victorias: 0 };
  });
};

const comparacion = [
  { mes: "Ene", miembros: 18, likes: 52, asistencia: 72, victorias: 2 },
  { mes: "Feb", miembros: 22, likes: 64, asistencia: 76, victorias: 3 },
  { mes: "Mar", miembros: 27, likes: 71, asistencia: 78, victorias: 3 },
  { mes: "Abr", miembros: 32, likes: 87, asistencia: 81, victorias: 4 },
  { mes: "May", miembros: 38, likes: 94, asistencia: 84, victorias: 5 },
  { mes: "Jun", miembros: 44, likes: 118, asistencia: 86, victorias: 6 },
  { mes: "Jul", miembros: 49, likes: 126, asistencia: 88, victorias: 6 },
  { mes: "Ago", miembros: 54, likes: 148, asistencia: 90, victorias: 7 },
  { mes: "Sep", miembros: 60, likes: 161, asistencia: 92, victorias: 8 },
  { mes: "Oct", miembros: 66, likes: 179, asistencia: 91, victorias: 9 },
  { mes: "Nov", miembros: 72, likes: 198, asistencia: 89, victorias: 10 },
  { mes: "Dic", miembros: 78, likes: 224, asistencia: 94, victorias: 11 },
];

const tipoEventoColor = {
  "Reunión normal": "#3d7ae0",
  Clase: "#2dbb8a",
  Examen: "#e85d5d",
  Otro: "#8a9bb8",
  Torneo: "#ff9f43",
  Premiación: "#f6b93b",
};

const eventosIniciales = [
  { id: 1, dia: 2, tipo: "Reunión normal", titulo: "Revisión del proyecto", descripcion: "Seguimiento de avances y tareas del club.", hora: "16:00", recordatorios: "Recordatorio 30 min antes" },
  { id: 2, dia: 6, tipo: "Torneo", titulo: "Torneo interno", descripcion: "Competencia semanal de estrategia y creatividad.", hora: "17:30", recordatorios: "Enviar lista de participantes" },
  { id: 3, dia: 13, tipo: "Premiación", titulo: "Premiación de logros", descripcion: "Reconocimiento a los miembros más destacados.", hora: "15:00", recordatorios: "Invitación a padres y mentores" },
  { id: 4, dia: 21, tipo: "Reunión normal", titulo: "Planificación mensual", descripcion: "Definición de objetivos del próximo mes.", hora: "18:00", recordatorios: "Recordatorio por WhatsApp" },
];

function Dashboard() {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [miembros, setMiembros] = useState(miembrosIniciales);
  const [expandSolicitudes, setExpandSolicitudes] = useState(false);
  const [expandMiembros, setExpandMiembros] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [rangoLikes, setRangoLikes] = useState(12);
  const [rangoComparacion, setRangoComparacion] = useState(12);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [formEventoVisible, setFormEventoVisible] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [eventos, setEventos] = useState(() =>
    eventosIniciales.map((evento) => ({
      ...evento,
      mes: evento.mes ?? new Date().getMonth(),
      anio: evento.anio ?? new Date().getFullYear(),
    }))
  );
  const [nuevoEvento, setNuevoEvento] = useState({
    tipo: "Reunión normal",
    titulo: "",
    descripcion: "",
    hora: "",
    recordatorios: "",
    dia: "",
  });

  const totalMiembros = miembros.length;
  const publicacionesActuales = publicacionesPorRango[rangoLikes] || publicacionesPorRango[12];
  const publicacionesRecientes = publicacionesActuales.length;
  const totalLikes = publicacionesActuales.reduce((sum, item) => sum + item.likes, 0);
  const promedioAsistencia = Math.round(asistenciaPorMes.reduce((sum, item) => sum + item, 0) / asistenciaPorMes.length);
  const maxLikes = Math.max(...publicacionesActuales.map((item) => item.likes));

  const likesSet = likesPorMes.slice(-rangoLikes);
  const likesMeses = getUltimosMeses(rangoLikes);
  const maxLikesMes = Math.max(...likesSet);
  const comparacionActiva = getComparacionPorRango(rangoComparacion);
  const comparacionMeses = getUltimosMeses(rangoComparacion);

  const likesPoints = likesSet
    .map((value, index) => {
      const x = likesSet.length === 1 ? 150 : 18 + index * (260 / (likesSet.length - 1));
      const y = 120 - (value / maxLikesMes) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  const crecimientoPoints = crecimientoMiembros
    .map((value, index) => {
      const x = 18 + index * (260 / (crecimientoMiembros.length - 1));
      const y = 120 - (value / 78) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  const visibleSolicitudes = expandSolicitudes ? solicitudes : solicitudes.slice(0, 2);
  const visibleMiembros = expandMiembros ? miembros : miembros.slice(0, 5);

  const handleAprobar = (id) => {
    setSolicitudes((prev) => prev.filter((item) => item.id !== id));
    setSolicitudSeleccionada((prev) => (prev && prev.id === id ? null : prev));
  };

  const handleRechazar = (id) => {
    setSolicitudes((prev) => prev.filter((item) => item.id !== id));
    setSolicitudSeleccionada((prev) => (prev && prev.id === id ? null : prev));
  };

  const handleAbrirSolicitud = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
  };

  const handleDeleteMember = (id) => {
    setMiembros((prev) => prev.filter((item) => item.id !== id));
  };

  const cerrarFormularioEvento = () => {
    setFormEventoVisible(false);
    setEventoEditando(null);
    setNuevoEvento({ tipo: "Reunión normal", titulo: "", descripcion: "", hora: "", recordatorios: "", dia: "" });
  };

  const handleExportPdf = () => {
    if (window && window.print) {
      window.print();
    }
  };

  const handleEventoInput = (e) => {
    const { name, value } = e.target;
    setNuevoEvento((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarEvento = (e) => {
    e.preventDefault();
    if (!nuevoEvento.titulo || !nuevoEvento.hora || !nuevoEvento.dia) {
      return;
    }

    const dato = {
      id: eventoEditando ? eventoEditando.id : Date.now(),
      dia: Number(nuevoEvento.dia),
      mes: mesActual.getMonth(),
      anio: mesActual.getFullYear(),
      tipo: nuevoEvento.tipo,
      titulo: nuevoEvento.titulo,
      descripcion: nuevoEvento.descripcion || "Sin descripción.",
      hora: nuevoEvento.hora,
      recordatorios: nuevoEvento.recordatorios || "Sin recordatorios.",
    };

    if (eventoEditando) {
      setEventos((prev) => prev.map((item) => (item.id === eventoEditando.id ? dato : item)));
    } else {
      setEventos((prev) => [...prev, dato]);
    }

    setNuevoEvento({ tipo: "Reunión normal", titulo: "", descripcion: "", hora: "", recordatorios: "", dia: "" });
    setFormEventoVisible(false);
    setEventoEditando(null);
  };

  const aplicarClaseSemanal = (diaSemana) => {
    const mapaDias = {
      domingo: 0,
      lunes: 1,
      martes: 2,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sábado: 6,
    };

    const diaNumero = mapaDias[diaSemana];
    const ultimoDiaMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate();
    const nuevosEventos = [];

    for (let dia = 1; dia <= ultimoDiaMes; dia += 1) {
      const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
      if (fecha.getDay() === diaNumero) {
        nuevosEventos.push({
          id: Date.now() + dia,
          dia,
          mes: mesActual.getMonth(),
          anio: mesActual.getFullYear(),
          tipo: "Clase",
          titulo: `Clase de ${diaSemana}`,
          descripcion: `Sesión regular de ${diaSemana}.`,
          hora: "16:00",
          recordatorios: "Recordatorio 30 minutos antes",
        });
      }
    }

    setEventos((prev) => {
      const yaExistentes = new Set(prev.map((item) => `${item.dia}-${item.mes}-${item.anio}-${item.tipo}-${item.hora}`));
      const porAgregar = nuevosEventos.filter((item) => !yaExistentes.has(`${item.dia}-${item.mes}-${item.anio}-${item.tipo}-${item.hora}`));
      return [...prev, ...porAgregar];
    });

    setNuevoEvento({
      tipo: "Clase",
      titulo: `Clase de ${diaSemana}`,
      descripcion: `Sesión regular de ${diaSemana}.`,
      hora: "16:00",
      recordatorios: "Recordatorio 30 minutos antes",
      dia: "",
    });
    setFormEventoVisible(true);
  };

  const handleDeleteEvent = (id) => {
    setEventos((prev) => prev.filter((item) => item.id !== id));
    setEventoSeleccionado(null);
  };

  const handleEditEvent = (evento) => {
    setEventoEditando(evento);
    setNuevoEvento({
      tipo: evento.tipo,
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      hora: evento.hora,
      recordatorios: evento.recordatorios,
      dia: String(evento.dia),
    });
    setFormEventoVisible(true);
    setEventoSeleccionado(null);
  };

  const getEventDotClass = (tipo) => {
    if (tipo === "Torneo") return "event-mark";
    if (tipo === "Premiación") return "award-mark";
    if (tipo === "Examen") return "exam-mark";
    if (tipo === "Clase") return "class-mark";
    return "reunion-mark";
  };

  const getEventTagStyle = (tipo) => ({
    background: `${tipoEventoColor[tipo] || "#3d7ae0"}22`,
    color: tipoEventoColor[tipo] || "#3d7ae0",
    border: `1px solid ${tipoEventoColor[tipo] || "#3d7ae0"}55`,
  });

  const getEventoDiaEstilo = (evento) => ({
    background: `${tipoEventoColor[evento.tipo] || "#3d7ae0"}22`,
    borderColor: `${tipoEventoColor[evento.tipo] || "#3d7ae0"}66`,
    boxShadow: `inset 0 0 0 1px ${tipoEventoColor[evento.tipo] || "#3d7ae0"}33`,
    color: "var(--color-primary-deep)",
  });

  const cambiarMes = (incremento) => {
    setMesActual((prev) => new Date(prev.getFullYear(), prev.getMonth() + incremento, 1));
  };

  const borrarTodosLosEventos = () => {
    setEventos([]);
    setEventoSeleccionado(null);
  };

  const eventosDelMes = eventos.filter((evento) => {
    const mesEvento = evento.mes ?? mesActual.getMonth();
    const anioEvento = evento.anio ?? mesActual.getFullYear();
    return mesEvento === mesActual.getMonth() && anioEvento === mesActual.getFullYear();
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-header-copy">
            <span className="chip-cute chip-turquoise">{nombreClub}</span>
            <h1>Dashboard</h1>
          </div>

          <button type="button" className="dashboard-action-btn" onClick={handleExportPdf}>
            Exportar PDF
          </button>
        </header>

        <section className="dashboard-stats">
          <article className="stat-card stat-card-turquoise">
            <div className="stat-icon">👥</div>
            <div>
              <p>Miembros</p>
              <h2>{totalMiembros}</h2>
            </div>
          </article>

          <article className="stat-card stat-card-blue">
            <div className="stat-icon">📝</div>
            <div>
              <p>Publicaciones</p>
              <h2>{publicacionesRecientes}</h2>
            </div>
          </article>

          <article className="stat-card stat-card-yellow">
            <div className="stat-icon">❤</div>
            <div>
              <p>Likes</p>
              <h2>{totalLikes}</h2>
            </div>
          </article>

          <article className="stat-card stat-card-mint">
            <div className="stat-icon">📊</div>
            <div>
              <p>Asistencia</p>
              <h2>{promedioAsistencia}%</h2>
            </div>
          </article>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Inscripciones</p>
              <h3>Solicitudes pendientes</h3>
            </div>
            <button className="mini-btn" type="button" onClick={() => setExpandSolicitudes((prev) => !prev)}>
              {expandSolicitudes ? "Ver menos" : "Ver todas"}
            </button>
          </div>

          <div className="request-list">
            {visibleSolicitudes.map((solicitud) => (
              <button
                type="button"
                className="request-item request-item-clickable"
                key={solicitud.id}
                onClick={() => handleAbrirSolicitud(solicitud)}
              >
                <div className="request-info">
                  <div className="request-avatar">{solicitud.nombre.charAt(0)}</div>
                  <div>
                    <strong>{solicitud.nombre}</strong>
                    <span>{solicitud.correo || solicitud.curso}</span>
                    <small>{solicitud.motivo}</small>
                  </div>
                </div>

                <div className="request-actions">
                  <button type="button" className="accept-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleAprobar(solicitud.id);
                  }}>Aprobar</button>
                  <button type="button" className="reject-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleRechazar(solicitud.id);
                  }}>Rechazar</button>
                </div>
              </button>
            ))}
          </div>

          {solicitudSeleccionada && (
            <div className="request-detail-sheet" onClick={() => setSolicitudSeleccionada(null)}>
              <div className="request-detail-card" onClick={(e) => e.stopPropagation()}>
                <div className="request-detail-header">
                  <div className="request-avatar request-avatar-large">
                    {solicitudSeleccionada.nombre.charAt(0)}
                  </div>
                  <button type="button" className="close-form-btn" aria-label="Cerrar detalle" onClick={() => setSolicitudSeleccionada(null)}>×</button>
                </div>

                <div className="request-detail-body">
                  <div className="detail-row">
                    <span className="detail-label">Nombre</span>
                    <strong>{solicitudSeleccionada.nombre}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Correo</span>
                    <strong>{solicitudSeleccionada.correo || "Sin correo"}</strong>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Sección</span>
                    <strong>{solicitudSeleccionada.seccion || "11-B"}</strong>
                  </div>
                  <div className="detail-row detail-row-block">
                    <span className="detail-label">Motivo de inscripción</span>
                    <p>{solicitudSeleccionada.motivo}</p>
                  </div>
                </div>

                <div className="request-actions sheet-actions">
                  <button type="button" className="accept-btn" onClick={() => handleAprobar(solicitudSeleccionada.id)}>Aprobar</button>
                  <button type="button" className="reject-btn" onClick={() => handleRechazar(solicitudSeleccionada.id)}>Rechazar</button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Contenido</p>
              <h3>Likes de publicaciones</h3>
            </div>
            <div className="range-switcher">
              {[7, 30, 3, 6, 9, 12].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  className={rangoLikes === valor ? "range-btn active" : "range-btn"}
                  onClick={() => setRangoLikes(valor)}
                >
                  {valor === 7 ? "1 semana" : valor === 30 ? "1 mes" : valor === 3 ? "3 meses" : valor === 6 ? "6 meses" : valor === 9 ? "9 meses" : "12 meses"}
                </button>
              ))}
            </div>
          </div>

          <div className="bars-list">
            {publicacionesActuales.map((post, index) => (
              <div className="bar-row" key={`${post.titulo}-${index}`}>
                <div className="bar-row-labels">
                  <span>{post.titulo}</span>
                  <strong>{post.likes}</strong>
                </div>
                <div className="bar-track">
                  <span className="bar-fill" style={{ width: `${(post.likes / maxLikes) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Miembros</p>
              <h3>Asistencia de miembros</h3>
            </div>
            <button className="mini-btn" type="button" onClick={() => setExpandMiembros((prev) => !prev)}>
              {expandMiembros ? "Ver menos" : "Ver lista"}
            </button>
          </div>

          <div className="member-list">
            {visibleMiembros.map((miembro) => (
              <div className="member-item" key={miembro.id}>
                <span>{miembro.nombre}</span>
                <div className="member-actions">
                  <em className={`member-state ${miembro.estado.toLowerCase()}`}>
                    {miembro.estado}
                  </em>
                  <button type="button" className="delete-member-btn" aria-label="Eliminar miembro" onClick={() => handleDeleteMember(miembro.id)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Calendario</p>
              <h3>Eventos y reuniones</h3>
            </div>
            <div className="calendar-actions">
              <button className="mini-btn" type="button" onClick={() => setFormEventoVisible((prev) => !prev)}>
                Agregar evento
              </button>
              <button className="mini-btn danger-btn" type="button" onClick={borrarTodosLosEventos}>
                Borrar todo
              </button>
            </div>
          </div>

          <div className="calendar-month-bar">
            <button type="button" className="month-nav-btn" onClick={() => cambiarMes(-1)}>←</button>
            <strong>{mesActual.toLocaleString("es-ES", { month: "long", year: "numeric" })}</strong>
            <button type="button" className="month-nav-btn" onClick={() => cambiarMes(1)}>→</button>
          </div>

          {formEventoVisible && (
            <form className="event-form" onSubmit={handleGuardarEvento}>
              <div className="form-close-row">
                <span className="form-label-small">Nuevo evento</span>
                <button type="button" className="close-form-btn" aria-label="Cerrar formulario" onClick={cerrarFormularioEvento}>×</button>
              </div>
              <div className="quick-event-row">
                <select
                  className="week-day-select"
                  defaultValue=""
                  onChange={(e) => {
                    const dia = e.target.value;
                    if (dia) {
                      aplicarClaseSemanal(dia);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Aplicar todos los...</option>
                  <option value="lunes">Lunes</option>
                  <option value="martes">Martes</option>
                  <option value="miércoles">Miércoles</option>
                  <option value="jueves">Jueves</option>
                  <option value="viernes">Viernes</option>
                  <option value="sábado">Sábado</option>
                  <option value="domingo">Domingo</option>
                </select>
              </div>
              <input type="number" min="1" max="31" name="dia" value={nuevoEvento.dia} onChange={handleEventoInput} placeholder="Día (1-31)" required />
              <div className="event-type-select-wrap">
                <select
                  name="tipo"
                  value={nuevoEvento.tipo}
                  onChange={handleEventoInput}
                  className="event-type-select"
                  style={{
                    borderColor: tipoEventoColor[nuevoEvento.tipo] || "#dfeaff",
                    boxShadow: `0 0 0 1px ${tipoEventoColor[nuevoEvento.tipo] || "#dfeaff"}33`,
                  }}
                >
                  <option>Reunión normal</option>
                  <option>Clase</option>
                  <option>Examen</option>
                  <option>Otro</option>
                  <option>Torneo</option>
                  <option>Premiación</option>
                </select>
                <span className="event-color-dot" style={{ background: tipoEventoColor[nuevoEvento.tipo] || "#3d7ae0" }} />
              </div>
              <input type="text" name="titulo" value={nuevoEvento.titulo} onChange={handleEventoInput} placeholder="Título" required />
              <textarea name="descripcion" value={nuevoEvento.descripcion} onChange={handleEventoInput} placeholder="Pequeña descripción" rows="2" />
              <input type="time" name="hora" value={nuevoEvento.hora} onChange={handleEventoInput} required />
              <input type="text" name="recordatorios" value={nuevoEvento.recordatorios} onChange={handleEventoInput} placeholder="Recordatorios" />
              <div className="event-form-actions">
                <button type="submit" className="accept-btn">Guardar</button>
                <button type="button" className="reject-btn" onClick={cerrarFormularioEvento}>Cancelar</button>
              </div>
            </form>
          )}

          <div className="calendar-grid">
            {Array.from({ length: new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate() }, (_, index) => {
              const day = index + 1;
              const event = eventosDelMes.find((item) => item.dia === day);

              return (
                <button
                  key={day}
                  type="button"
                  className={`calendar-day ${event ? "has-mark" : ""}`}
                  onClick={() => event ? setEventoSeleccionado(event) : setEventoSeleccionado(null)}
                  style={event ? getEventoDiaEstilo(event) : undefined}
                >
                  <span>{day}</span>
                  {event && <i className={getEventDotClass(event.tipo)}></i>}
                </button>
              );
            })}
          </div>

          {eventoSeleccionado && (
            <div className="event-detail">
              <div className="form-close-row">
                <span className="event-tag" style={getEventTagStyle(eventoSeleccionado.tipo)}>{eventoSeleccionado.tipo}</span>
                <button type="button" className="close-form-btn" aria-label="Cerrar detalle" onClick={() => setEventoSeleccionado(null)}>×</button>
              </div>

              <div className="event-detail-header">
                <strong>{eventoSeleccionado.titulo}</strong>
              </div>

              <p>{eventoSeleccionado.descripcion}</p>
              <div className="event-meta">
                <span>Hora: {eventoSeleccionado.hora}</span>
                <span>Recordatorios: {eventoSeleccionado.recordatorios}</span>
              </div>

              <div className="event-form-actions">
                <button type="button" className="accept-btn" onClick={() => handleEditEvent(eventoSeleccionado)}>Editar</button>
                <button type="button" className="reject-btn" onClick={() => handleDeleteEvent(eventoSeleccionado.id)}>Borrar</button>
              </div>
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Crecimiento</p>
              <h3>Miembros en el tiempo</h3>
            </div>
          </div>

          <div className="chart-figure growth-figure">
            <div className="y-axis">
              {[60, 45, 30, 15, 0].map((valor) => (
                <span key={valor}>{valor}</span>
              ))}
            </div>

            <svg viewBox="0 0 300 140" className="line-chart single-line-chart" role="img" aria-label="Crecimiento de miembros del club">
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={crecimientoPoints}
              />
            </svg>
          </div>

          <div className="labels-row" style={{ gridTemplateColumns: `repeat(${getUltimosMeses(12).length}, minmax(0, 1fr))` }}>
            {getUltimosMeses(12).map((mes) => (
              <span key={mes}>{mes}</span>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Asistencia</p>
              <h3>Promedio general</h3>
            </div>
            <span className="average-pill">{promedioAsistencia}%</span>
          </div>

          <div className="attendance-legend">
            <span><i className="legend-good"></i> Activa</span>
            <span><i className="legend-mid"></i> Media</span>
            <span><i className="legend-low"></i> Deficiente</span>
          </div>

          <div className="attendance-figure">
            <div className="y-axis">
              {[100, 75, 50, 25, 0].map((valor) => (
                <span key={valor}>{valor}</span>
              ))}
            </div>

            <div className="attendance-chart">
              {asistenciaPorMes.map((valor, index) => (
                <div key={`${valor}-${index}`} className="attendance-column">
                  <div
                    className="attendance-bar"
                    style={{ height: `${valor}%`, background: valor >= 90 ? "var(--color-success)" : valor >= 80 ? "var(--color-primary)" : valor >= 70 ? "var(--color-accent)" : "var(--color-danger)" }}
                    title={`${valor}%`}
                  />
                  <span>{meses[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-card compact-card">
          <div className="card-header compact-header">
            <div>
              <p className="eyebrow">Comparación</p>
              <h3>Popularidad por mes</h3>
            </div>
            <div className="range-switcher compact-range">
              {[3, 6, 9, 12].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  className={rangoComparacion === valor ? "range-btn active" : "range-btn"}
                  onClick={() => setRangoComparacion(valor)}
                >
                  {valor === 3 ? "3 meses" : valor === 6 ? "6 meses" : valor === 9 ? "9 meses" : "12 meses"}
                </button>
              ))}
            </div>
          </div>

          <div className="comparison-table">
            <div className="comparison-row comparison-header">
              <span>Mes</span>
              <strong>Miembros</strong>
              <strong>Likes</strong>
              <strong>Asistencia</strong>
              <strong>Victorias</strong>
            </div>

            {comparacionActiva.map((item) => (
              <div className="comparison-row" key={item.mes}>
                <span>{item.mes}</span>
                <strong className={item.miembros >= 45 ? "highlight-value" : ""}>{item.miembros}</strong>
                <strong className={item.likes >= 180 ? "highlight-value yellow" : ""}>{item.likes}</strong>
                <strong className={item.asistencia >= 90 ? "highlight-value green" : ""}>{item.asistencia}%</strong>
                <strong className={item.victorias >= 9 ? "highlight-value blue" : ""}>{item.victorias}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Tendencia</p>
              <h3>Likes por mes</h3>
            </div>
          </div>

          <div className="chart-figure">
            <div className="y-axis">
              {[250, 180, 120, 60, 0].map((valor) => (
                <span key={valor}>{valor}</span>
              ))}
            </div>

            <svg viewBox="0 0 300 140" className="line-chart" role="img" aria-label="Likes por mes del club">
              {[0, 1, 2, 3].map((line) => (
                <line
                  key={line}
                  x1="0"
                  x2="300"
                  y1={20 + line * 30}
                  y2={20 + line * 30}
                  stroke="rgba(91, 68, 44, 0.12)"
                  strokeWidth="1"
                />
              ))}
              <polyline
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={likesPoints}
              />
            </svg>
          </div>

          <div className="labels-row" style={{ gridTemplateColumns: `repeat(${getUltimosMeses(8).length}, minmax(0, 1fr))` }}>
            {getUltimosMeses(8).map((mes) => (
              <span key={mes}>{mes}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
