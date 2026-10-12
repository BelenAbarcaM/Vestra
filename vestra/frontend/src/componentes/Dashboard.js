import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import "./Dashboard.css";
import "../App.css";

const API_BASE_URL =
  "http://localhost/vestra/backend/api/dashboard";

const INSIGNIAS_API_BASE_URL =
  "http://localhost/vestra/backend/api/insignias";

const INSIGNIAS_ENDPOINTS = {
  listar: `${INSIGNIAS_API_BASE_URL}/listar.php`,
  crear: `${INSIGNIAS_API_BASE_URL}/crear.php`,
  asignar: `${INSIGNIAS_API_BASE_URL}/asignar.php`,
};

const ENDPOINTS = {
  resumen: `${API_BASE_URL}/resumen.php`,
  solicitudes: `${API_BASE_URL}/solicitudes.php`,
  gestionarSolicitud: `${API_BASE_URL}/gestionar_solicitudes.php`,
  miembros: `${API_BASE_URL}/miembros.php`,
  crecimiento: `${API_BASE_URL}/crecimiento.php`,
  publicaciones: `${API_BASE_URL}/publicaciones.php`,
  eventos: `${API_BASE_URL}/eventos.php`,
  crearEvento: `${API_BASE_URL}/crear_evento.php`,
  editarEvento: `${API_BASE_URL}/editar_evento.php`,
  eliminarEvento: `${API_BASE_URL}/eliminar_evento.php`,
  asistencia: `${API_BASE_URL}/asistencia.php`,
  registrarAsistencia: `${API_BASE_URL}/registrar_asistencia.php`,
  estadisticasAsistencia: `${API_BASE_URL}/estadisticas_asistencia.php`,
  comparacion: `${API_BASE_URL}/comparacion.php`,
  exportar: `${API_BASE_URL}/exportar.php`,
};

async function getJSON(url) {
  const res = await fetch(url, {
    credentials: "include",
  });

  return res.json();
}

async function postForm(url, payload) {
  const body = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    body.append(key, value ?? "");
  });

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return res.json();
}

const tipoEventoColor = {
  "Reunión normal": "#3d7ae0",
  Clase: "#2dbb8a",
  Examen: "#e85d5d",
  Otro: "#8a9bb8",
  Torneo: "#ff9f43",
  Premiación: "#f6b93b",
  Reunion: "#3d7ae0",
  Entrenamiento: "#2dbb8a",
  Competencia: "#ff9f43",
  Actividad: "#2dbb8a",
  Presentacion: "#f6b93b",
};

const tipoEventoBackend = {
  "Reunión normal": "Reunion",
  Clase: "Entrenamiento",
  Examen: "Actividad",
  Otro: "Otro",
  Torneo: "Competencia",
  Premiación: "Presentacion",
};

const tipoEventoFrontend = {
  Reunion: "Reunión normal",
  Entrenamiento: "Clase",
  Competencia: "Torneo",
  Actividad: "Actividad",
  Presentacion: "Premiación",
  Otro: "Otro",
};

const estadoAsistenciaClase = {
  Presente: "activa",
  Justificado: "media",
  Ausente: "deficiente",
};

const parseFechaEvento = (fecha) => {
  if (!fecha) {
    return {
      dia: null,
      mes: null,
      anio: null,
    };
  }

  const [anio, mes, dia] = fecha
    .split("-")
    .map((valor) => parseInt(valor, 10));

  return {
    dia,
    mes: mes - 1,
    anio,
  };
};

function Dashboard({
  idClub: idClubProp,
  clubes = [],
  clubSeleccionado = null,
  setClubSeleccionado,
}) {
  const idClub = useMemo(() => {
    if (idClubProp) {
      return idClubProp;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }, [idClubProp]);

  const [resumen, setResumen] = useState(null);
  const [resumenError, setResumenError] = useState("");
  const [cargandoResumen, setCargandoResumen] = useState(true);

  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudesError, setSolicitudesError] = useState("");
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [expandSolicitudes, setExpandSolicitudes] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState(null);
  const [procesandoSolicitud, setProcesandoSolicitud] =
    useState(null);

  const [crecimiento, setCrecimiento] = useState([]);
  const [crecimientoError, setCrecimientoError] = useState("");
  const [cargandoCrecimiento, setCargandoCrecimiento] =
    useState(true);

  const [eventos, setEventos] = useState([]);
  const [eventosError, setEventosError] = useState("");
  const [cargandoEventos, setCargandoEventos] = useState(true);

  const [mesActual, setMesActual] = useState(new Date());

  const [eventoSeleccionado, setEventoSeleccionado] =
    useState(null);

  const [formEventoVisible, setFormEventoVisible] =
    useState(false);

  const [eventoEditando, setEventoEditando] = useState(null);

  const [nuevoEvento, setNuevoEvento] = useState({
    tipo: "Reunión normal",
    titulo: "",
    descripcion: "",
    hora: "",
    horaFin: "",
    dia: "",
  });

  const [asistenciaPanelVisible, setAsistenciaPanelVisible] =
    useState(false);

  const [asistenciaMiembros, setAsistenciaMiembros] =
    useState([]);

  const [asistenciaError, setAsistenciaError] = useState("");

  const [cargandoAsistencia, setCargandoAsistencia] =
    useState(false);

  const [guardandoAsistenciaId, setGuardandoAsistenciaId] =
    useState(null);

  const [miembrosVisible, setMiembrosVisible] = useState(false);

  const [miembros, setMiembros] = useState([]);

  const [miembrosError, setMiembrosError] = useState("");

  const [cargandoMiembros, setCargandoMiembros] = useState(false);

  // Insignias del club
  const [insignias, setInsignias] = useState([]);
  const [insigniasError, setInsigniasError] = useState("");
  const [insigniasMensaje, setInsigniasMensaje] = useState("");
  const [cargandoInsignias, setCargandoInsignias] = useState(false);
  const [nombreInsignia, setNombreInsignia] = useState("");
  const [descripcionInsignia, setDescripcionInsignia] = useState("");
  const [imagenInsignia, setImagenInsignia] = useState(null);
  const [guardandoInsignia, setGuardandoInsignia] = useState(false);
  const [insigniaParaAsignar, setInsigniaParaAsignar] = useState("");
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState("");
  const [asignandoInsignia, setAsignandoInsignia] = useState(false);

  const [publicaciones, setPublicaciones] = useState([]);

  const [publicacionesError, setPublicacionesError] =
    useState("");

  const [cargandoPublicaciones, setCargandoPublicaciones] =
    useState(true);

  const [estadisticas, setEstadisticas] = useState(null);

  const [estadisticasError, setEstadisticasError] =
    useState("");

  const [cargandoEstadisticas, setCargandoEstadisticas] =
    useState(true);

  const [comparacion, setComparacion] = useState(null);

  const [comparacionError, setComparacionError] = useState("");

  const [cargandoComparacion, setCargandoComparacion] =
    useState(true);

  const cargarResumen = useCallback(async () => {
    if (!idClub) return;

    setCargandoResumen(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.resumen}?id=${idClub}`
      );

      if (data.error) {
        setResumenError(data.error);
        setResumen(null);
      } else {
        setResumen(data);
        setResumenError("");
      }
    } catch (error) {
      console.error(error);
      setResumenError("no se pudo cargar el resumen.");
      setResumen(null);
    } finally {
      setCargandoResumen(false);
    }
  }, [idClub]);

  const cargarSolicitudes = useCallback(async () => {
    if (!idClub) return;

    setCargandoSolicitudes(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.solicitudes}?id=${idClub}`
      );

      if (data.error) {
        setSolicitudesError(data.error);
        setSolicitudes([]);
      } else {
        setSolicitudes(data.solicitudes || []);
        setSolicitudesError("");
      }
    } catch (error) {
      console.error(error);
      setSolicitudesError(
        "no se pudieron cargar las solicitudes."
      );
      setSolicitudes([]);
    } finally {
      setCargandoSolicitudes(false);
    }
  }, [idClub]);

  const cargarCrecimiento = useCallback(async () => {
    if (!idClub) return;

    setCargandoCrecimiento(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.crecimiento}?id=${idClub}`
      );

      if (data.success) {
        setCrecimiento(data.crecimiento || []);
        setCrecimientoError("");
      } else {
        setCrecimientoError(
          data.message ||
            data.error ||
            "no se pudo cargar el crecimiento."
        );
        setCrecimiento([]);
      }
    } catch (error) {
      console.error(error);
      setCrecimientoError(
        "no se pudo cargar el crecimiento."
      );
      setCrecimiento([]);
    } finally {
      setCargandoCrecimiento(false);
    }
  }, [idClub]);

  const cargarEventos = useCallback(async () => {
    if (!idClub) return;

    setCargandoEventos(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.eventos}?id=${idClub}`
      );

      if (data.error) {
        setEventosError(data.error);
        setEventos([]);
        return;
      }

      const eventosApi = (data.eventos || []).map((evento) => {
        const { dia, mes, anio } = parseFechaEvento(
          evento.fecha
        );

        return {
          ...evento,
          dia,
          mes,
          anio,
          tipo:
            tipoEventoFrontend[evento.tipo] ||
            evento.tipo ||
            "Otro",
          origen: "api",
        };
      });

      setEventos(eventosApi);
      setEventosError("");
    } catch (error) {
      console.error(error);
      setEventosError(
        "no se pudieron cargar los eventos."
      );
      setEventos([]);
    } finally {
      setCargandoEventos(false);
    }
  }, [idClub]);

  const cargarMiembros = useCallback(async () => {
    if (!idClub) return;

    setCargandoMiembros(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.miembros}?id=${idClub}`
      );

      if (data.error) {
        setMiembrosError(data.error);
        setMiembros([]);
      } else {
        setMiembros(data.miembros || []);
        setMiembrosError("");
      }
    } catch (error) {
      console.error(error);
      setMiembrosError(
        "No se pudo cargar la lista de miembros."
      );
      setMiembros([]);
    } finally {
      setCargandoMiembros(false);
    }
  }, [idClub]);

  const cargarInsignias = useCallback(async () => {
    if (!idClub) return;

    setCargandoInsignias(true);
    setInsigniasError("");

    try {
      const data = await getJSON(
        `${INSIGNIAS_ENDPOINTS.listar}?id_club=${encodeURIComponent(idClub)}&id=${encodeURIComponent(idClub)}`
      );

      if (data.success === false || data.error) {
        setInsigniasError(
          data.mensaje || data.error || "No se pudo cargar las insignias."
        );
        setInsignias([]);
        return;
      }

      const lista = Array.isArray(data)
        ? data
        : data.insignias || data.data || [];

      setInsignias(lista);
      setInsigniasError("");

      setInsigniaParaAsignar((actual) => {
        if (actual && lista.some((item) => String(item.id_insignia) === String(actual))) {
          return actual;
        }
        return lista.length ? String(lista[0].id_insignia) : "";
      });
    } catch (error) {
      console.error(error);
      setInsigniasError("No se pudo cargar las insignias del club.");
      setInsignias([]);
    } finally {
      setCargandoInsignias(false);
    }
  }, [idClub]);

  const crearInsignia = async (e) => {
    e.preventDefault();
    setInsigniasError("");
    setInsigniasMensaje("");

    if (!idClub) {
      setInsigniasError("No se identificó el club seleccionado.");
      return;
    }

    if (!nombreInsignia.trim() || !descripcionInsignia.trim() || !imagenInsignia) {
      setInsigniasError("Completa el nombre, la descripción y selecciona una imágen PNG.");
      return;
    }

    if (imagenInsignia.type !== "image/png") {
      setInsigniasError("La imágen debe estar en formato PNG.");
      return;
    }

    if (imagenInsignia.size > 5 * 1024 * 1024) {
      setInsigniasError("La imágen no puede superar los 5 MB.");
      return;
    }

    const formulario = new FormData();
    formulario.append("id_club", idClub);
    formulario.append("nombre", nombreInsignia.trim());
    formulario.append("descripcion", descripcionInsignia.trim());
    formulario.append("imagen", imagenInsignia);

    setGuardandoInsignia(true);

    try {
      const respuesta = await fetch(INSIGNIAS_ENDPOINTS.crear, {
        method: "POST",
        credentials: "include",
        body: formulario,
      });

      const texto = await respuesta.text();
      let data;

      try {
        data = JSON.parse(texto);
      } catch {
        throw new Error("El servidor no devolvió una respuesta válida. Revisa los errores de PHP.");
      }

      if (!respuesta.ok || data.success === false || data.error) {
        throw new Error(data.mensaje || data.error || "No se pudo crear la insignia.");
      }

      setNombreInsignia("");
      setDescripcionInsignia("");
      setImagenInsignia(null);

      const inputImagen = document.getElementById("imagen-insignia-dashboard");
      if (inputImagen) inputImagen.value = "";

      setInsigniasMensaje(data.mensaje || "Insignia creada correctamente.");
      await cargarInsignias();
    } catch (error) {
      console.error(error);
      setInsigniasError(error.message || "Ocurrió un error al crear la insignia.");
    } finally {
      setGuardandoInsignia(false);
    }
  };

  const asignarInsignia = async (e) => {
    e.preventDefault();
    setInsigniasError("");
    setInsigniasMensaje("");

    if (!insigniaParaAsignar || !usuarioParaAsignar) {
      setInsigniasError("Selecciona una insignia y un miembro del club.");
      return;
    }

    setAsignandoInsignia(true);

    try {
      const data = await postForm(INSIGNIAS_ENDPOINTS.asignar, {
        id_insignia: insigniaParaAsignar,
        id_usuario: usuarioParaAsignar,
      });

      if (data.success === false || data.error) {
        throw new Error(data.mensaje || data.error || "No se pudo asignar la insignia.");
      }

      setInsigniasMensaje(data.mensaje || "Insignia asignada al miembro correctamente.");
      setUsuarioParaAsignar("");
      await cargarInsignias();
    } catch (error) {
      console.error(error);
      setInsigniasError(error.message || "Ocurrió un error al asignar la insignia.");
    } finally {
      setAsignandoInsignia(false);
    }
  };

  const cargarPublicaciones = useCallback(async () => {
    if (!idClub) return;

    setCargandoPublicaciones(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.publicaciones}?id=${idClub}`
      );

      if (data.success) {
        setPublicaciones(data.publicaciones || []);
        setPublicacionesError("");
      } else {
        setPublicacionesError(
          data.message ||
            data.error ||
            "No se pudo cargar las publicaciones."
        );
        setPublicaciones([]);
      }
    } catch (error) {
      console.error(error);
      setPublicacionesError(
        "No se pudo cargar las publicaciones."
      );
      setPublicaciones([]);
    } finally {
      setCargandoPublicaciones(false);
    }
  }, [idClub]);

  const cargarEstadisticas = useCallback(async () => {
    if (!idClub) return;

    setCargandoEstadisticas(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.estadisticasAsistencia}?id=${idClub}`
      );

      if (data.error) {
        setEstadisticasError(data.error);
        setEstadisticas(null);
      } else {
        setEstadisticas(data);
        setEstadisticasError("");
      }
    } catch (error) {
      console.error(error);
      setEstadisticasError(
        "No se pudo cargar las estadísticas."
      );
      setEstadisticas(null);
    } finally {
      setCargandoEstadisticas(false);
    }
  }, [idClub]);

  const cargarComparacion = useCallback(async () => {
    if (!idClub) return;

    setCargandoComparacion(true);

    try {
      const data = await getJSON(
        `${ENDPOINTS.comparacion}?id=${idClub}`
      );

      if (data.success) {
        setComparacion(data);
        setComparacionError("");
      } else {
        setComparacionError(
          data.message ||
            data.error ||
            "No se pudo cargar la comparación."
        );
        setComparacion(null);
      }
    } catch (error) {
      console.error(error);
      setComparacionError(
        "No se pudo cargar la comparación."
      );
      setComparacion(null);
    } finally {
      setCargandoComparacion(false);
    }
  }, [idClub]);

  useEffect(() => {
    setResumen(null);
    setSolicitudes([]);
    setCrecimiento([]);
    setEventos([]);
    setMiembros([]);
    setInsignias([]);
    setInsigniasError("");
    setInsigniasMensaje("");
    setPublicaciones([]);
    setEstadisticas(null);
    setComparacion(null);

    setSolicitudSeleccionada(null);
    setEventoSeleccionado(null);
    setAsistenciaPanelVisible(false);
    setMiembrosVisible(false);

    if (!idClub) return;

    cargarResumen();
    cargarSolicitudes();
    cargarCrecimiento();
    cargarEventos();
    cargarMiembros();
    cargarInsignias();
    cargarPublicaciones();
    cargarEstadisticas();
    cargarComparacion();
  }, [
    idClub,
    cargarResumen,
    cargarSolicitudes,
    cargarCrecimiento,
    cargarEventos,
    cargarMiembros,
    cargarInsignias,
    cargarPublicaciones,
    cargarEstadisticas,
    cargarComparacion,
  ]);

const gestionarSolicitud = async (idSolicitud, accion) => {
  setProcesandoSolicitud(idSolicitud);
  setSolicitudesError("");

  try {
    const data = await postForm(
      ENDPOINTS.gestionarSolicitud,
      {
        id_solicitud: idSolicitud,
        accion,
      }
    );

    if (!data.success) {
      setSolicitudesError(
        data.error || data.mensaje || "No se pudo procesar la acción."
      );
      return;
    }

    // Recargar desde la base de datos en lugar de eliminar
    // la solicitud de la interfaz manualmente.
    await cargarSolicitudes();
    await cargarResumen();

    if (
      accion === "Aceptar" ||
      accion === "AprobarFechaIngreso" ||
      accion === "RechazarFechaIngreso"
    ) {
      await cargarMiembros();
    }

    setSolicitudSeleccionada(null);
  } catch (error) {
    console.error(error);
    setSolicitudesError(
      "No se pudo procesar la solicitud. Inténtalo de nuevo."
    );
  } finally {
    setProcesandoSolicitud(null);
  }
};

  const abrirPanelAsistencia = async (evento) => {
    setEventoSeleccionado(evento);
    setAsistenciaPanelVisible(true);
    setCargandoAsistencia(true);
    setAsistenciaError("");

    try {
      const data = await getJSON(
        `${ENDPOINTS.asistencia}?id_evento=${evento.id_evento}`
      );

      if (data.error) {
        setAsistenciaError(data.error);
        setAsistenciaMiembros([]);
      } else {
        setAsistenciaMiembros(data.miembros || []);
      }
    } catch (error) {
      console.error(error);
      setAsistenciaError(
        "no se pudo cargar la asistencia."
      );
      setAsistenciaMiembros([]);
    } finally {
      setCargandoAsistencia(false);
    }
  };

  const cerrarPanelAsistencia = () => {
    setAsistenciaPanelVisible(false);
    setAsistenciaMiembros([]);
    setAsistenciaError("");
  };

  const registrarAsistencia = async (
    idUsuario,
    estado
  ) => {
    if (!eventoSeleccionado) return;

    setGuardandoAsistenciaId(idUsuario);

    try {
      const data = await postForm(
        ENDPOINTS.registrarAsistencia,
        {
          id_evento: eventoSeleccionado.id_evento,
          id_usuario: idUsuario,
          estado,
        }
      );

      if (data.success) {
        setAsistenciaMiembros((prev) =>
          prev.map((miembro) =>
            miembro.id_usuario === idUsuario
              ? {
                  ...miembro,
                  estado,
                }
              : miembro
          )
        );

        await cargarResumen();
        await cargarEstadisticas();
      } else {
        setAsistenciaError(
          data.error ||
            "No se pudo registrar la asistencia."
        );
      }
    } catch (error) {
      console.error(error);
      setAsistenciaError(
        "No se pudo registrar la asistencia."
      );
    } finally {
      setGuardandoAsistenciaId(null);
    }
  };

  const toggleMiembros = () => {
    const siguiente = !miembrosVisible;

    setMiembrosVisible(siguiente);

    if (siguiente) {
      cargarMiembros();
    }
  };

  const cerrarFormularioEvento = () => {
    setFormEventoVisible(false);
    setEventoEditando(null);

    setNuevoEvento({
      tipo: "Reunión normal",
      titulo: "",
      descripcion: "",
      hora: "",
      horaFin: "",
      dia: "",
    });
  };

  const handleEventoInput = (e) => {
    const { name, value } = e.target;

    setNuevoEvento((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGuardarEvento = async (e) => {
    e.preventDefault();

    if (
      !nuevoEvento.titulo ||
      !nuevoEvento.hora ||
      !nuevoEvento.dia
    ) {
      return;
    }

    const dia = String(nuevoEvento.dia).padStart(
      2,
      "0"
    );

    const mes = String(
      mesActual.getMonth() + 1
    ).padStart(2, "0");

    const anio = mesActual.getFullYear();

    const fechaCompleta = `${anio}-${mes}-${dia}`;

    const tipoBackend =
      tipoEventoBackend[nuevoEvento.tipo] ||
      "Otro";

    try {
      let data;

      if (eventoEditando) {
        data = await postForm(
          ENDPOINTS.editarEvento,
          {
            id_evento:
              eventoEditando.id_evento,
            titulo: nuevoEvento.titulo,
            descripcion:
              nuevoEvento.descripcion,
            fecha: fechaCompleta,
            hora_inicio:
              nuevoEvento.hora,
            hora_fin:
              nuevoEvento.horaFin,
            tipo: tipoBackend,
          }
        );
      } else {
        data = await postForm(
          ENDPOINTS.crearEvento,
          {
            id_club: idClub,
            titulo: nuevoEvento.titulo,
            descripcion:
              nuevoEvento.descripcion,
            fecha: fechaCompleta,
            hora_inicio:
              nuevoEvento.hora,
            hora_fin:
              nuevoEvento.horaFin,
            tipo: tipoBackend,
          }
        );
      }

      if (data.success) {
        cerrarFormularioEvento();
        await cargarEventos();
        await cargarResumen();
      } else {
        setEventosError(
          data.error ||
            "No se pudo guardar el evento."
        );
      }
    } catch (error) {
      console.error(error);
      setEventosError(
        "No se pudo guardar el evento."
      );
    }
  };

  const aplicarClaseSemanal = async (diaSemana) => {
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

    if (diaNumero === undefined) return;

    const ultimoDiaMes = new Date(
      mesActual.getFullYear(),
      mesActual.getMonth() + 1,
      0
    ).getDate();

    for (
      let dia = 1;
      dia <= ultimoDiaMes;
      dia++
    ) {
      const fecha = new Date(
        mesActual.getFullYear(),
        mesActual.getMonth(),
        dia
      );

      if (fecha.getDay() !== diaNumero) {
        continue;
      }

      const fechaCompleta = `${mesActual.getFullYear()}-${String(
        mesActual.getMonth() + 1
      ).padStart(2, "0")}-${String(dia).padStart(
        2,
        "0"
      )}`;

      try {
        await postForm(
          ENDPOINTS.crearEvento,
          {
            id_club: idClub,
            titulo: `Clase de ${diaSemana}`,
            descripcion: `Sesión regular de ${diaSemana}.`,
            fecha: fechaCompleta,
            hora_inicio: "16:00",
            hora_fin: "",
            tipo: "Entrenamiento",
          }
        );
      } catch (error) {
        console.error(error);
      }
    }

    await cargarEventos();
    await cargarResumen();
  };

  const handleEditEvent = (evento) => {
    setEventoEditando(evento);

    setNuevoEvento({
      tipo:
        tipoEventoFrontend[evento.tipo] ||
        evento.tipo ||
        "Otro",
      titulo: evento.titulo || "",
      descripcion: evento.descripcion || "",
      hora: evento.hora_inicio || "",
      horaFin: evento.hora_fin || "",
      dia: String(evento.dia),
    });

    setFormEventoVisible(true);
    setEventoSeleccionado(null);
    cerrarPanelAsistencia();
  };

  const handleDeleteEvent = async (idEvento) => {
    const confirmar = window.confirm(
      "¿deseas eliminar este evento?"
    );

    if (!confirmar) return;

    try {
      const data = await postForm(
        ENDPOINTS.eliminarEvento,
        {
          id_evento: idEvento,
        }
      );

      if (data.success) {
        setEventoSeleccionado(null);
        cerrarPanelAsistencia();
        await cargarEventos();
        await cargarResumen();
      } else {
        setEventosError(
          data.error ||
            "No se pudo eliminar el evento."
        );
      }
    } catch (error) {
      console.error(error);
      setEventosError(
        "No se pudo eliminar el evento."
      );
    }
  };

  const handleSeleccionarEvento = (evento) => {
    setEventoSeleccionado(evento);
    cerrarPanelAsistencia();
  };

  const cambiarMes = (incremento) => {
    setMesActual(
      (prev) =>
        new Date(
          prev.getFullYear(),
          prev.getMonth() + incremento,
          1
        )
    );

    setEventoSeleccionado(null);
    cerrarPanelAsistencia();
  };

  const eventosDelMes = eventos.filter(
    (evento) =>
      evento.mes === mesActual.getMonth() &&
      evento.anio === mesActual.getFullYear()
  );

  const getEventDotClass = (tipo) => {
    if (
      tipo === "Torneo" ||
      tipo === "Competencia"
    ) {
      return "event-mark";
    }

    if (
      tipo === "Premiación" ||
      tipo === "Presentacion"
    ) {
      return "award-mark";
    }

    if (tipo === "Examen") {
      return "exam-mark";
    }

    if (
      tipo === "Clase" ||
      tipo === "Entrenamiento"
    ) {
      return "class-mark";
    }

    return "reunion-mark";
  };

  const getEventTagStyle = (tipo) => {
    const color =
      tipoEventoColor[tipo] || "#3d7ae0";

    return {
      background: `${color}22`,
      color,
      border: `1px solid ${color}55`,
    };
  };

  const getEventoDiaEstilo = (evento) => {
    const color =
      tipoEventoColor[evento.tipo] ||
      "#3d7ae0";

    return {
      background: `${color}22`,
      borderColor: `${color}66`,
      boxShadow: `inset 0 0 0 1px ${color}33`,
      color: "var(--color-primary-deep)",
    };
  };

  const maxCrecimiento = Math.max(
    1,
    ...crecimiento.map(
      (item) =>
        Number(item.total_miembros) || 0
    )
  );

  const crecimientoPoints = crecimiento
    .map((item, index) => {
      const valor =
        Number(item.total_miembros) || 0;

      const x =
        crecimiento.length === 1
          ? 150
          : 18 +
            index *
              (260 /
                Math.max(
                  1,
                  crecimiento.length - 1
                ));

      const y =
        120 -
        (valor / maxCrecimiento) * 90;

      return `${x},${y}`;
    })
    .join(" ");

  const maxLikesPublicaciones = Math.max(
    1,
    ...publicaciones.map(
      (item) => Number(item.likes) || 0
    )
  );

  const eventosAsistencia =
    estadisticas?.eventos || [];

  const handleExportPdf = () => {
    if (!idClub) return;

    window.open(
      `${ENDPOINTS.exportar}?id=${idClub}`,
      "_blank"
    );
  };

  const resumenDatos = resumen?.resumen;

  const proximoEvento =
    resumen?.proximo_evento;

  const nombreClub =
    resumen?.club?.Nombre ||
    clubSeleccionado?.Nombre ||
    "Tu club";

  if (!idClub) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <section className="dashboard-card">
            <p className="eyebrow">
              Falta información
            </p>

            <h3>
              No se especificó el club
            </h3>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">

        <header className="dashboard-header">
  <div className="dashboard-header-copy">

    <h1>Dashboard</h1>

    {clubes.length > 1 && setClubSeleccionado ? (
      <select
        className="club-selector"
        value={
          clubSeleccionado?.id_club ||
          idClub
        }
        onChange={(e) => {
          const club = clubes.find(
            (item) =>
              String(item.id_club) ===
              e.target.value
          );

          if (club) {
            setClubSeleccionado(club);
          }
        }}
      >
        {clubes.map((club) => (
          <option
            key={club.id_club}
            value={club.id_club}
          >
            {club.Nombre}
          </option>
        ))}
      </select>
    ) : (
      <span className="chip-cute chip-turquoise">
        {nombreClub}
      </span>
    )}

  </div>

  <button
    type="button"
    className="dashboard-action-btn"
    onClick={handleExportPdf}
  >
    Exportar PDF
  </button>
</header>

        <section className="dashboard-stats">

          <article className="stat-card stat-card-turquoise">
            <div className="stat-icon">👥</div>

            <div>
              <p>Miembros</p>

              <h2>
                {cargandoResumen
                  ? "…"
                  : resumenDatos?.total_miembros ?? 0}
              </h2>
            </div>
          </article>

          <article className="stat-card stat-card-blue">
            <div className="stat-icon">📝</div>

            <div>
              <p>Publicaciones</p>

              <h2>
                {cargandoResumen
                  ? "…"
                  : resumenDatos?.total_publicaciones ?? 0}
              </h2>
            </div>
          </article>

          <article className="stat-card stat-card-yellow">
            <div className="stat-icon">❤</div>

            <div>
              <p>Likes</p>

              <h2>
                {cargandoResumen
                  ? "…"
                  : resumenDatos?.total_likes ?? 0}
              </h2>
            </div>
          </article>

          <article className="stat-card stat-card-mint">
            <div className="stat-icon">📊</div>

            <div>
              <p>Asistencia</p>

              <h2>
                {cargandoResumen
                  ? "…"
                  : `${
                      resumenDatos?.porcentaje_asistencia ??
                      0
                    }%`}
              </h2>
            </div>
          </article>

        </section>

        {resumenError && (
          <p className="status-text status-text-error">
            {resumenError}
          </p>
        )}

        {proximoEvento && (
          <p className="status-text next-event-note">
            Próximo evento:{" "}
            <strong>
              {proximoEvento.titulo}
            </strong>{" "}
            — {proximoEvento.fecha}
          </p>
        )}

        <section className="dashboard-card">

          <div className="card-header">
            <div>
              <p className="eyebrow">
                Inscripciones
              </p>

              <h3>
                Solicitudes pendientes
              </h3>
            </div>

            {solicitudes.length > 2 && (
              <button
                className="mini-btn"
                type="button"
                onClick={() =>
                  setExpandSolicitudes(
                    (prev) => !prev
                  )
                }
              >
                {expandSolicitudes
                  ? "Ver menos"
                  : "Ver todas"}
              </button>
            )}
          </div>

          {cargandoSolicitudes && (
            <p className="status-text">
              Cargando solicitudes…
            </p>
          )}

          {solicitudesError && (
            <p className="status-text status-text-error">
              {solicitudesError}
            </p>
          )}

          {!cargandoSolicitudes &&
            !solicitudesError &&
            solicitudes.length === 0 && (
              <p className="status-text">
                No hay solicitudes pendientes.
              </p>
            )}

          <div className="request-list">

            {(expandSolicitudes
              ? solicitudes
              : solicitudes.slice(0, 2)
            ).map((solicitud) => (
              <div
                className="request-item"
                key={solicitud.id_solicitud}
                onClick={() =>
                  setSolicitudSeleccionada(
                    solicitud
                  )
                }
              >

                <div className="request-info">

                  <div className="request-avatar">
                    {(solicitud.Nombre || "?").charAt(0)}
                  </div>

                  <div>
                    <strong>
                      {solicitud.Nombre}
                    </strong>

                    <span>
                      {solicitud.correo}
                    </span>

                    <small>
                      Sección {solicitud.seccion || "Sin sección"}
                    </small>
                    <small>
                      {solicitud.estado === "Pendiente"
                        ? "Inscripción pendiente"
                        : "Revisión de antigüedad pendiente"}
                    </small>
                  </div>

                </div>

                <div className="request-actions">
                  {solicitud.estado === "Pendiente" ? (
                    <>
                      <button
                        type="button"
                        className="accept-btn"
                        disabled={procesandoSolicitud === solicitud.id_solicitud}
                        onClick={(e) => {
                          e.stopPropagation();
                          gestionarSolicitud(solicitud.id_solicitud, "Aceptar");
                        }}
                      >
                        Aprobar
                      </button>

                      <button
                        type="button"
                        className="reject-btn"
                        disabled={procesandoSolicitud === solicitud.id_solicitud}
                        onClick={(e) => {
                          e.stopPropagation();
                          gestionarSolicitud(solicitud.id_solicitud, "Rechazar");
                        }}
                      >
                        Rechazar
                      </button>
                    </>
                  ) : solicitud.estado === "Aceptado" &&
                    solicitud.tipo_membresia === "Antiguo" &&
                    solicitud.estado_fecha_ingreso === "Pendiente" ? (
                    <span className="member-state media">Revisar antigüedad</span>
                  ) : null}
                </div>

              </div>
            ))}

          </div>

          {solicitudSeleccionada && (
            <div
              className="request-detail-sheet"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "24px 16px",
                boxSizing: "border-box",
              }}
              onClick={() =>
                setSolicitudSeleccionada(null)
              }
            >
              <div
                className="request-detail-card"
                style={{
                  width: "100%",
                  maxWidth: "560px",
                  maxHeight: "none",
                  height: "auto",
                  overflow: "visible",
                  flexShrink: 0,
                  margin: "auto 0",
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="request-detail-header">

                  <div className="request-avatar request-avatar-large">
                    {(
                      solicitudSeleccionada.Nombre ||
                      "?"
                    ).charAt(0)}
                  </div>

                  <button
                    type="button"
                    className="close-form-btn"
                    aria-label="Cerrar detalle"
                    onClick={() =>
                      setSolicitudSeleccionada(
                        null
                      )
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="request-detail-body">

                  <div className="detail-row">
                    <span className="detail-label">
                      Nombre
                    </span>

                    <strong>
                      {
                        solicitudSeleccionada.Nombre
                      }
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      Correo
                    </span>

                    <strong>
                      {
                        solicitudSeleccionada.correo
                      }
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      Sección
                    </span>

                    <strong>
                      {
                        solicitudSeleccionada.seccion ||
                        "Sin sección"
                      }
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      Carnet
                    </span>

                    <strong>
                      {
                        solicitudSeleccionada.carnet ||
                        "Sin carnet"
                      }
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Tipo de miembro</span>
                    <strong>
                      {solicitudSeleccionada.tipo_membresia === "Antiguo"
                        ? "Ya pertenecía al club"
                        : "Miembro nuevo"}
                    </strong>
                  </div>

                  {solicitudSeleccionada.tipo_membresia === "Antiguo" && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Fecha de ingreso solicitada</span>
                        <strong>
                          {solicitudSeleccionada.fecha_ingreso_solicitada || "No indicada"}
                        </strong>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Estado de la fecha</span>
                        <strong>
                          {solicitudSeleccionada.estado_fecha_ingreso || "No solicitada"}
                        </strong>
                      </div>
                    </>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Estado de inscripción</span>
                    <strong>{solicitudSeleccionada.estado}</strong>
                  </div>

                  {solicitudSeleccionada.Bio && (
                    <div className="detail-row detail-row-block">

                      <span className="detail-label">
                        Bio
                      </span>

                      <p>
                        {
                          solicitudSeleccionada.Bio
                        }
                      </p>

                    </div>
                  )}

                </div>

                {solicitudesError && (
                  <p
                    className="status-text status-text-error"
                    role="alert"
                    style={{ margin: "12px 0", overflowWrap: "anywhere" }}
                  >
                    {solicitudesError}
                  </p>
                )}

                <div className="request-actions sheet-actions">
                  {solicitudSeleccionada.estado === "Pendiente" ? (
                    <>
                      <button
                        type="button"
                        className="accept-btn"
                        disabled={procesandoSolicitud === solicitudSeleccionada.id_solicitud}
                        onClick={() =>
                          gestionarSolicitud(solicitudSeleccionada.id_solicitud, "Aceptar")
                        }
                      >
                        Aprobar inscripción
                      </button>

                      <button
                        type="button"
                        className="reject-btn"
                        disabled={procesandoSolicitud === solicitudSeleccionada.id_solicitud}
                        onClick={() =>
                          gestionarSolicitud(solicitudSeleccionada.id_solicitud, "Rechazar")
                        }
                      >
                        Rechazar inscripción
                      </button>
                    </>
                  ) : solicitudSeleccionada.estado === "Aceptado" &&
                    solicitudSeleccionada.tipo_membresia === "Antiguo" &&
                    solicitudSeleccionada.estado_fecha_ingreso === "Pendiente" ? (
                    <>
                      <button
                        type="button"
                        className="accept-btn"
                        disabled={procesandoSolicitud === solicitudSeleccionada.id_solicitud}
                        onClick={() =>
                          gestionarSolicitud(
                            solicitudSeleccionada.id_solicitud,
                            "AprobarFechaIngreso"
                          )
                        }
                      >
                        Aprobar fecha
                      </button>

                      <button
                        type="button"
                        className="reject-btn"
                        disabled={procesandoSolicitud === solicitudSeleccionada.id_solicitud}
                        onClick={() =>
                          gestionarSolicitud(
                            solicitudSeleccionada.id_solicitud,
                            "RechazarFechaIngreso"
                          )
                        }
                      >
                        Rechazar fecha
                      </button>
                    </>
                  ) : (
                    <p className="status-text">
                      Esta solicitud ya fue procesada.
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}

        </section>

        <section className="dashboard-card">

          <div className="card-header">
            <div>
              <p className="eyebrow">
                Crecimiento
              </p>

              <h3>
                Miembros en el tiempo
              </h3>
            </div>
          </div>

          {cargandoCrecimiento && (
            <p className="status-text">
              Cargando…
            </p>
          )}

          {crecimientoError && (
            <p className="status-text status-text-error">
              {crecimientoError}
            </p>
          )}

          {!cargandoCrecimiento &&
            !crecimientoError &&
            crecimiento.length === 0 && (
              <p className="status-text">
                Todavía no hay historial de
                ingresos.
              </p>
            )}

          {!cargandoCrecimiento &&
            crecimiento.length > 0 && (
              <>
                <div className="chart-figure growth-figure">

                  <div className="y-axis">
                    {[
                      maxCrecimiento,
                      Math.round(
                        maxCrecimiento * 0.75
                      ),
                      Math.round(
                        maxCrecimiento * 0.5
                      ),
                      Math.round(
                        maxCrecimiento * 0.25
                      ),
                      0,
                    ].map((valor, index) => (
                      <span
                        key={`${valor}-${index}`}
                      >
                        {valor}
                      </span>
                    ))}
                  </div>

                  <svg
                    viewBox="0 0 300 140"
                    className="line-chart single-line-chart"
                    role="img"
                    aria-label="Crecimiento de miembros del club"
                  >
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

                <div
                  className="labels-row"
                  style={{
                    gridTemplateColumns: `repeat(${crecimiento.length}, minmax(0, 1fr))`,
                  }}
                >
                  {crecimiento.map((item) => (
                    <span key={item.periodo}>
                      {item.mes
                        ? item.mes.slice(0, 3)
                        : ""}
                    </span>
                  ))}
                </div>
              </>
            )}

        </section>

        <section className="dashboard-card">

          <div className="card-header">

            <div>
              <p className="eyebrow">
                Calendario
              </p>

              <h3>
                Eventos y reuniones
              </h3>
            </div>

            <div className="calendar-actions">

              <button
                className="mini-btn"
                type="button"
                onClick={() =>
                  setFormEventoVisible(
                    (prev) => !prev
                  )
                }
              >
                Agregar evento
              </button>

            </div>

          </div>

          {cargandoEventos && (
            <p className="status-text">
              Cargando eventos…
            </p>
          )}

          {eventosError && (
            <p className="status-text status-text-error">
              {eventosError}
            </p>
          )}

          <div className="calendar-month-bar">

            <button
              type="button"
              className="month-nav-btn"
              onClick={() =>
                cambiarMes(-1)
              }
            >
              ←
            </button>

            <strong>
              {mesActual.toLocaleString(
                "es-ES",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </strong>

            <button
              type="button"
              className="month-nav-btn"
              onClick={() =>
                cambiarMes(1)
              }
            >
              →
            </button>

          </div>

          {formEventoVisible && (
            <form
              className="event-form"
              onSubmit={handleGuardarEvento}
            >

              <div className="form-close-row">

                <span className="form-label-small">
                  {eventoEditando
                    ? "Editar evento"
                    : "Nuevo evento"}
                </span>

                <button
                  type="button"
                  className="close-form-btn"
                  aria-label="Cerrar formulario"
                  onClick={
                    cerrarFormularioEvento
                  }
                >
                  ×
                </button>

              </div>

              <div className="quick-event-row">

                <select
                  className="week-day-select"
                  defaultValue=""
                  onChange={(e) => {
                    const dia =
                      e.target.value;

                    if (dia) {
                      aplicarClaseSemanal(
                        dia
                      );

                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">
                    Aplicar todos los...
                  </option>

                  <option value="lunes">
                    Lunes
                  </option>

                  <option value="martes">
                    Martes
                  </option>

                  <option value="miércoles">
                    Miércoles
                  </option>

                  <option value="jueves">
                    Jueves
                  </option>

                  <option value="viernes">
                    Viernes
                  </option>

                  <option value="sábado">
                    Sábado
                  </option>

                  <option value="domingo">
                    Domingo
                  </option>
                </select>

              </div>

              <input
                type="number"
                min="1"
                max="31"
                name="dia"
                value={nuevoEvento.dia}
                onChange={handleEventoInput}
                placeholder="Día (1-31)"
                required
              />

              <div className="event-type-select-wrap">

                <select
                  name="tipo"
                  value={nuevoEvento.tipo}
                  onChange={handleEventoInput}
                  className="event-type-select"
                  style={{
                    borderColor:
                      tipoEventoColor[
                        nuevoEvento.tipo
                      ] || "#dfeaff",
                    boxShadow: `0 0 0 1px ${
                      tipoEventoColor[
                        nuevoEvento.tipo
                      ] || "#dfeaff"
                    }33`,
                  }}
                >
                  <option>
                    Reunión normal
                  </option>

                  <option>
                    Clase
                  </option>

                  <option>
                    Examen
                  </option>

                  <option>
                    Otro
                  </option>

                  <option>
                    Torneo
                  </option>

                  <option>
                    Premiación
                  </option>
                </select>

                <span
                  className="event-color-dot"
                  style={{
                    background:
                      tipoEventoColor[
                        nuevoEvento.tipo
                      ] || "#3d7ae0",
                  }}
                />

              </div>

              <input
                type="text"
                name="titulo"
                value={nuevoEvento.titulo}
                onChange={handleEventoInput}
                placeholder="Título"
                required
              />

              <textarea
                name="descripcion"
                value={nuevoEvento.descripcion}
                onChange={handleEventoInput}
                placeholder="Pequeña descripción"
                rows="2"
              />

              <input
                type="time"
                name="hora"
                value={nuevoEvento.hora}
                onChange={handleEventoInput}
                required
              />

              <input
                type="time"
                name="horaFin"
                value={nuevoEvento.horaFin}
                onChange={handleEventoInput}
              />

              <div className="event-form-actions">

                <button
                  type="submit"
                  className="accept-btn"
                >
                  {eventoEditando
                    ? "Guardar cambios"
                    : "Guardar"}
                </button>

                <button
                  type="button"
                  className="reject-btn"
                  onClick={
                    cerrarFormularioEvento
                  }
                >
                  Cancelar
                </button>

              </div>

            </form>
          )}

          <div className="calendar-grid">

            {Array.from(
              {
                length: new Date(
                  mesActual.getFullYear(),
                  mesActual.getMonth() + 1,
                  0
                ).getDate(),
              },
              (_, index) => {

                const day = index + 1;

                const event =
                  eventosDelMes.find(
                    (item) =>
                      item.dia === day
                  );

                return (
                  <button
                    key={day}
                    type="button"
                    className={`calendar-day ${
                      event
                        ? "has-mark"
                        : ""
                    }`}
                    onClick={() =>
                      event
                        ? handleSeleccionarEvento(
                            event
                          )
                        : setEventoSeleccionado(
                            null
                          )
                    }
                    style={
                      event
                        ? getEventoDiaEstilo(
                            event
                          )
                        : undefined
                    }
                  >

                    <span>{day}</span>

                    {event && (
                      <i
                        className={getEventDotClass(
                          event.tipo
                        )}
                      />
                    )}

                  </button>
                );
              }
            )}

          </div>

          {eventoSeleccionado && (
            <div className="event-detail">

              <div className="form-close-row">

                <span
                  className="event-tag"
                  style={getEventTagStyle(
                    eventoSeleccionado.tipo
                  )}
                >
                  {eventoSeleccionado.tipo}
                </span>

                <button
                  type="button"
                  className="close-form-btn"
                  aria-label="Cerrar detalle"
                  onClick={() => {
                    setEventoSeleccionado(null);
                    cerrarPanelAsistencia();
                  }}
                >
                  ×
                </button>

              </div>

              <div className="event-detail-header">
                <strong>
                  {eventoSeleccionado.titulo}
                </strong>
              </div>

              <p>
                {eventoSeleccionado.descripcion ||
                  "Sin descripción."}
              </p>

              <div className="event-meta">

                <span>
                  Hora:{" "}
                  {eventoSeleccionado.hora_inicio}

                  {eventoSeleccionado.hora_fin
                    ? ` - ${eventoSeleccionado.hora_fin}`
                    : ""}
                </span>

              </div>

              <div className="event-form-actions">

                <button
                  type="button"
                  className="accept-btn"
                  onClick={() =>
                    abrirPanelAsistencia(
                      eventoSeleccionado
                    )
                  }
                >
                  Pasar asistencia
                </button>

                <button
                  type="button"
                  className="mini-btn"
                  onClick={() =>
                    handleEditEvent(
                      eventoSeleccionado
                    )
                  }
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="reject-btn"
                  onClick={() =>
                    handleDeleteEvent(
                      eventoSeleccionado.id_evento
                    )
                  }
                >
                  Borrar
                </button>

              </div>

              {asistenciaPanelVisible && (
                <div className="asistencia-panel">

                  <div className="form-close-row">

                    <span className="form-label-small">
                      Lista de asistencia
                    </span>

                    <button
                      type="button"
                      className="close-form-btn"
                      aria-label="Cerrar asistencia"
                      onClick={
                        cerrarPanelAsistencia
                      }
                    >
                      ×
                    </button>

                  </div>

                  {cargandoAsistencia && (
                    <p className="status-text">
                      Cargando miembros…
                    </p>
                  )}

                  {asistenciaError && (
                    <p className="status-text status-text-error">
                      {asistenciaError}
                    </p>
                  )}

                  {!cargandoAsistencia &&
                    !asistenciaError && (
                      <div className="member-list">

                        {asistenciaMiembros.map(
                          (miembro) => (
                            <div
                              className="member-item"
                              key={
                                miembro.id_usuario
                              }
                            >

                              <span>
                                {miembro.Nombre}
                              </span>

                              <div className="member-actions">

                                {[
                                  "Presente",
                                  "Justificado",
                                  "Ausente",
                                ].map(
                                  (estado) => (
                                    <button
                                      type="button"
                                      key={estado}
                                      disabled={
                                        guardandoAsistenciaId ===
                                        miembro.id_usuario
                                      }
                                      className={`member-state member-state-btn ${
                                        estadoAsistenciaClase[
                                          estado
                                        ]
                                      } ${
                                        miembro.estado ===
                                        estado
                                          ? "member-state-selected"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        registrarAsistencia(
                                          miembro.id_usuario,
                                          estado
                                        )
                                      }
                                    >
                                      {estado}
                                    </button>
                                  )
                                )}

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    )}

                </div>
              )}

            </div>
          )}

        </section>

        <section className="dashboard-card">

          <div className="card-header">

            <div>
              <p className="eyebrow">
                Miembros
              </p>

              <h3>
                Lista de miembros
              </h3>
            </div>

            <button
              className="mini-btn"
              type="button"
              onClick={toggleMiembros}
            >
              {miembrosVisible
                ? "Ocultar"
                : "Ver lista"}
            </button>

          </div>

          {miembrosVisible && (
            <>
              {cargandoMiembros && (
                <p className="status-text">
                  Cargando miembros…
                </p>
              )}

              {miembrosError && (
                <p className="status-text status-text-error">
                  {miembrosError}
                </p>
              )}

              {!cargandoMiembros &&
                !miembrosError &&
                miembros.length === 0 && (
                  <p className="status-text">
                    Este club todavía no
                    tiene miembros.
                  </p>
                )}

              <div className="member-list">

                {miembros.map((miembro) => (
                  <div
                    className="member-item"
                    key={miembro.id_usuario}
                  >

                    <span>
                      {miembro.Nombre}
                    </span>

                    <div className="member-actions">

                      <em className="member-state activa">
                        Desde{" "}
                        {miembro.anio_ingreso || "—"}
                      </em>

                    </div>

                  </div>
                ))}

              </div>
            </>
          )}

        </section>

        <section className="dashboard-card">

          <div className="card-header">

            <div>
              <p className="eyebrow">
                Contenido
              </p>

              <h3>
                Publicaciones recientes
              </h3>
            </div>

          </div>

          {cargandoPublicaciones && (
            <p className="status-text">
              Cargando publicaciones…
            </p>
          )}

          {publicacionesError && (
            <p className="status-text status-text-error">
              {publicacionesError}
            </p>
          )}

          {!cargandoPublicaciones &&
            !publicacionesError &&
            publicaciones.length === 0 && (
              <p className="status-text">
                Este club todavía no tiene
                publicaciones.
              </p>
            )}

          <div className="bars-list">

            {publicaciones.map((post) => {

              const texto =
                post.texto ||
                post.Texto ||
                "";

              const likes =
                Number(post.likes) || 0;

              return (
                <div
                  className="bar-row"
                  key={post.id_publicacion}
                >

                  <div className="bar-row-labels">

                    <span>
                      {texto.length > 40
                        ? `${texto.slice(
                            0,
                            40
                          )}…`
                        : texto}
                    </span>

                    <strong>
                      {likes} ❤ ·{" "}
                      {post.comentarios || 0} 💬
                    </strong>

                  </div>

                  <div className="bar-track">

                    <span
                      className="bar-fill"
                      style={{
                        width: `${
                          (likes /
                            maxLikesPublicaciones) *
                          100
                        }%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        <section className="dashboard-card">

          <div className="card-header">

            <div>
              <p className="eyebrow">
                Asistencia
              </p>

              <h3>
                Por evento
              </h3>
            </div>

            {!cargandoEstadisticas &&
              estadisticas && (
                <span className="average-pill">
                  {estadisticas.resumen
                    ?.porcentaje_asistencia ??
                    0}
                  %
                </span>
              )}

          </div>

          {cargandoEstadisticas && (
            <p className="status-text">
              Cargando estadísticas…
            </p>
          )}

          {estadisticasError && (
            <p className="status-text status-text-error">
              {estadisticasError}
            </p>
          )}

          {!cargandoEstadisticas &&
            !estadisticasError && (
              <>
                <div className="attendance-legend">

                  <span>
                    <i className="legend-good" />
                    Presente
                  </span>

                  <span>
                    <i className="legend-mid" />
                    Justificado
                  </span>

                  <span>
                    <i className="legend-low" />
                    Ausente
                  </span>

                </div>

                {eventosAsistencia.length ===
                0 ? (
                  <p className="status-text">
                    Todavía no hay registros de
                    asistencia.
                  </p>
                ) : (
                  <div className="attendance-list">
  {eventosAsistencia.map((evento) => {
    const valor =
      Number(evento.porcentaje_asistencia) || 0;

    return (
      <div
        key={evento.id_evento}
        className="attendance-item"
      >
        <div className="attendance-item-header">
          <span className="attendance-item-title">
            {evento.titulo}
          </span>

          <strong>{valor}%</strong>
        </div>

        <div className="attendance-track">
          <div
            className="attendance-fill"
            style={{
              width: `${valor}%`,
            }}
          />
        </div>

        <span className="attendance-item-date">
          {evento.fecha}
        </span>
      </div>
    );
  })}
</div>
                )}

              </>
            )}

        </section>

        <section className="dashboard-card compact-card">

          <div className="card-header compact-header">

            <div>
              <p className="eyebrow">
                Comparación
              </p>

              <h3>
                {comparacion
                  ? `${comparacion.mes_actual} vs ${comparacion.mes_anterior}`
                  : "Mes actual vs anterior"}
              </h3>
            </div>

          </div>

          {cargandoComparacion && (
            <p className="status-text">
              Cargando comparación…
            </p>
          )}

          {comparacionError && (
            <p className="status-text status-text-error">
              {comparacionError}
            </p>
          )}

          {!cargandoComparacion &&
            comparacion && (
              <div className="comparison-table">

                <div
                  className="comparison-row comparison-header"
                  style={{
                    gridTemplateColumns:
                      "1.4fr repeat(3, minmax(0, 1fr))",
                  }}
                >

                  <span>Métrica</span>

                  <strong>Actual</strong>

                  <strong>Anterior</strong>

                  <strong>Cambio</strong>

                </div>

                {[
                  {
                    clave: "nuevos_miembros",
                    etiqueta: "Miembros",
                  },
                  {
                    clave: "eventos",
                    etiqueta: "Eventos",
                  },
                  {
                    clave: "publicaciones",
                    etiqueta: "Publicaciones",
                  },
                  {
                    clave:
                      "asistencias_registradas",
                    etiqueta: "Asistencias",
                  },
                ].map(({ clave, etiqueta }) => {

                  const item =
                    comparacion.comparacion?.[
                      clave
                    ];

                  if (!item) {
                    return null;
                  }

                  const cambio =
                    Number(
                      item.cambio_porcentaje
                    ) || 0;

                  const subio = cambio >= 0;

                  return (
                    <div
                      className="comparison-row"
                      key={clave}
                      style={{
                        gridTemplateColumns:
                          "1.4fr repeat(3, minmax(0, 1fr))",
                      }}
                    >

                      <span>
                        {etiqueta}
                      </span>

                      <strong>
                        {item.mes_actual}
                      </strong>

                      <strong>
                        {item.mes_anterior}
                      </strong>

                      <strong
                        className={
                          subio
                            ? "highlight-value green"
                            : "highlight-value"
                        }
                      >
                        {subio ? "↑" : "↓"}{" "}
                        {Math.abs(cambio)}%
                      </strong>

                    </div>
                  );
                })}

              </div>
            )}

        </section>

        {/* GESTIÓN DE INSIGNIAS */}
        <section className="dashboard-card badge-management-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Reconocimientos</p>
              <h3>Insignias del club</h3>
              <p className="status-text">
                Crea insignias en PNG y asígnalas manualmente a miembros inscritos. Las insignias aprobadas también se entregan automáticamente cuando se acepta una solicitud.
              </p>
            </div>
          </div>

          {insigniasError && (
            <p className="status-text status-text-error" role="alert">
              {insigniasError}
            </p>
          )}
          {insigniasMensaje && (
            <p className="status-text" role="status" style={{ color: "#21845b" }}>
              {insigniasMensaje}
            </p>
          )}

          <form onSubmit={crearInsignia} className="badge-create-form">
            <h4>Crear una insignia</h4>
            <label className="badge-form-field">
              <span>Nombre</span>
              <input
                type="text"
                value={nombreInsignia}
                onChange={(e) => setNombreInsignia(e.target.value)}
                maxLength={50}
                placeholder="Ej. Miembro destacado"
                required
              />
            </label>
            <label className="badge-form-field">
              <span>Descripción</span>
              <textarea
                value={descripcionInsignia}
                onChange={(e) => setDescripcionInsignia(e.target.value)}
                maxLength={255}
                rows={3}
                placeholder="¿Por qué se obtiene esta insignia?"
                required
              />
            </label>
            <label className="badge-form-field">
              <span>Imagen (PNG, máximo 5 MB)</span>
              <input
                id="imagen-insignia-dashboard"
                type="file"
                accept=".png,image/png"
                onChange={(e) => setImagenInsignia(e.target.files?.[0] || null)}
                required
              />
            </label>
            {imagenInsignia && (
              <p className="status-text">Archivo seleccionado: {imagenInsignia.name}</p>
            )}
            <button type="submit" className="dashboard-action-btn" disabled={guardandoInsignia}>
              {guardandoInsignia ? "Creando…" : "Crear insignia"}
            </button>
          </form>

          <div className="badge-assign-form-wrap">
            <h4>Asignar insignia a un miembro</h4>
            {cargandoMiembros ? (
              <p className="status-text">Cargando miembros…</p>
            ) : miembros.length === 0 ? (
              <p className="status-text">Todavía no hay miembros inscritos a quienes asignar insignias.</p>
            ) : insignias.length === 0 ? (
              <p className="status-text">Primero crea una insignia para poder asignarla.</p>
            ) : (
              <form onSubmit={asignarInsignia} className="badge-assign-form">
                <label className="badge-form-field">
                  <span>Insignia</span>
                  <select
                    value={insigniaParaAsignar}
                    onChange={(e) => setInsigniaParaAsignar(e.target.value)}
                    required
                  >
                    {insignias.map((insignia) => (
                      <option key={insignia.id_insignia} value={insignia.id_insignia}>
                        {insignia.nombre} {insignia.asignaciones != null ? `(${insignia.asignaciones} asignaciones)` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="badge-form-field">
                  <span>Miembro</span>
                  <select
                    value={usuarioParaAsignar}
                    onChange={(e) => setUsuarioParaAsignar(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un miembro</option>
                    {miembros.map((miembro) => (
                      <option key={miembro.id_usuario} value={miembro.id_usuario}>
                        {miembro.Nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="dashboard-action-btn" disabled={asignandoInsignia}>
                  {asignandoInsignia ? "Asignando…" : "Asignar insignia"}
                </button>
              </form>
            )}
          </div>

          <div className="badge-list-wrap">
            <h4>Insignias creadas</h4>
            {cargandoInsignias ? (
              <p className="status-text">Cargando insignias…</p>
            ) : insignias.length === 0 ? (
              <p className="status-text">Todavía no has creado insignias para este club.</p>
            ) : (
              <div className="badge-management-list">
                {insignias.map((insignia) => {
                  const foto = insignia.foto || insignia.imagen || "";
                  const fotoUrl = /^https?:\/\//i.test(foto)
                    ? foto
                    : `http://localhost/vestra/${String(foto).replace(/^\//, "")}`;

                  return (
                    <article className="badge-management-item" key={insignia.id_insignia}>
                      {foto && (
                        <img src={fotoUrl} alt={insignia.nombre || "Insignia del club"} />
                      )}
                      <div className="badge-management-item-copy">
                        <strong>{insignia.nombre}</strong>
                        <p>{insignia.descripcion}</p>
                        <small>
                          {insignia.asignaciones ?? insignia.total_asignaciones ?? 0} asignaciones · {insignia.estado || "Aprobado"}
                        </small>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

export default Dashboard;
