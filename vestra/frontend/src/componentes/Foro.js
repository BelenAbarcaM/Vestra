import { useCallback, useEffect, useMemo, useState } from "react";
import "./Foro.css";

const API_FORO = "http://localhost/vestra/backend/api/foro/foro_publicaciones";
const categorias = ["Todos", "General", "Eventos", "Preguntas", "Logros"];
const opcionesReaccion = [
  { id: "util", emoji: "💡", texto: "Útil" },
  { id: "interesante", emoji: "✨", texto: "Interesante" },
  { id: "gracioso", emoji: "😄", texto: "Gracioso" },
];

function inicialesDe(nombre = "") {
  return nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] || "").join("").toUpperCase() || "V";
}

function tiempoRelativo(fecha) {
  if (!fecha) return "Fecha no disponible";
  // MySQL suele devolver "YYYY-MM-DD HH:mm:ss"; se transforma a formato ISO local.
  const date = new Date(String(fecha).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return fecha;
  const minutos = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `Hace ${dias} d`;
  return date.toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
}

async function apiJson(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: "include",
    ...opciones,
    headers: { ...(opciones.body ? { "Content-Type": "application/json" } : {}), ...(opciones.headers || {}) },
  });
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || data.success === false) {
    const error = new Error(data.mensaje || "No se pudo completar la solicitud.");
    error.status = respuesta.status;
    error.data = data;
    throw error;
  }
  return data;
}


export default function Foro({
  idClub: idClubProp,
  nombreClub: nombreClubProp,
  onVolver,
}) {
  const idClub = Number(idClubProp ?? 0);

  const [nombreClub, setNombreClub] = useState(
    nombreClubProp || "Cargando club..."
  );
  const [publicaciones, setPublicaciones] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState("General");
  const [publicacionAbierta, setPublicacionAbierta] = useState(null);
  const [avisoModeracion, setAvisoModeracion] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [cargando, setCargando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [accionando, setAccionando] = useState({});

  const cargarPublicaciones = useCallback(async (silencioso = false) => {
    if (!idClub) {
      setErrorCarga("No se recibió el identificador del club. Pasa idClub al componente Foro.");
      setCargando(false);
      return;
    }
    if (!silencioso) setCargando(true);
    try {
      const data = await apiJson(`${API_FORO}/listar.php?id_club=${encodeURIComponent(idClub)}`);
      setPublicaciones(Array.isArray(data.publicaciones) ? data.publicaciones : []);
      if (data.nombre_club) setNombreClub(data.nombre_club);
      setErrorCarga("");
    } catch (error) {
      setErrorCarga(error.message || "No se pudieron cargar las publicaciones.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [idClub]);

  useEffect(() => {
    cargarPublicaciones();
    const intervalo = window.setInterval(() => cargarPublicaciones(true), 10000);
    return () => window.clearInterval(intervalo);
  }, [cargarPublicaciones]);

  const publicacionesVisibles = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase("es");
    return publicaciones.filter((publicacion) => {
      const coincideCategoria = categoriaActiva === "Todos" || publicacion.categoria === categoriaActiva;
      const contenido = `${publicacion.titulo} ${publicacion.texto} ${publicacion.autor}`.toLocaleLowerCase("es");
      return coincideCategoria && (!consulta || contenido.includes(consulta));
    });
  }, [publicaciones, categoriaActiva, busqueda]);

  async function publicar(event) {
    event.preventDefault();
    const tituloLimpio = titulo.trim();
    const textoLimpio = texto.trim();
    if (!tituloLimpio || !textoLimpio || publicando) return;
    setAvisoModeracion("");
    setPublicando(true);
    try {
      await apiJson(`${API_FORO}/crear.php`, {
        method: "POST",
        body: JSON.stringify({ id_club: idClub, titulo: tituloLimpio, categoria, texto: textoLimpio }),
      });
      setTitulo(""); setTexto(""); setCategoria("General");
      setMostrarFormulario(false);
      await cargarPublicaciones(true);
    } catch (error) {
      // El endpoint devuelve 422 y el mensaje de moderación del servidor.
      setAvisoModeracion(error.message || "No se pudo publicar el contenido.");
    } finally {
      setPublicando(false);
    }
  }

  async function cambiarMeGusta(publicacion) {
    const id = publicacion.id_publicacion;
    if (accionando[`like-${id}`]) return;
    setAccionando((actual) => ({ ...actual, [`like-${id}`]: true }));
    try {
      const data = await apiJson(`${API_FORO}/me_gusta.php`, {
        method: "POST", body: JSON.stringify({ id_publicacion: id }),
      });
      setPublicaciones((actuales) => actuales.map((p) => p.id_publicacion === id ? { ...p, liked: data.liked, likes: data.likes } : p));
      setPublicacionAbierta((actual) => actual?.id_publicacion === id ? { ...actual, liked: data.liked, likes: data.likes } : actual);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setAccionando((actual) => ({ ...actual, [`like-${id}`]: false }));
    }
  }

  async function reaccionar(publicacion, reaccion) {
    const id = publicacion.id_publicacion;
    if (accionando[`reaccion-${id}`]) return;
    setAccionando((actual) => ({ ...actual, [`reaccion-${id}`]: true }));
    try {
      const data = await apiJson(`${API_FORO}/reaccionar.php`, {
        method: "POST", body: JSON.stringify({ id_publicacion: id, reaccion }),
      });
      const actualizar = (p) => p.id_publicacion === id ? {
        ...p,
        mi_reaccion: data.mi_reaccion,
        reaccion_util: data.reacciones.util,
        reaccion_interesante: data.reacciones.interesante,
        reaccion_gracioso: data.reacciones.gracioso,
      } : p;
      setPublicaciones((actuales) => actuales.map(actualizar));
      setPublicacionAbierta((actual) => actual ? actualizar(actual) : actual);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setAccionando((actual) => ({ ...actual, [`reaccion-${id}`]: false }));
    }
  }

  const abrirPublicacion = (publicacion) => {
    setPublicacionAbierta(publicacion);
  };

  
useEffect(() => {
  setNombreClub(nombreClubProp || "Cargando club...");
}, [nombreClubProp]);

  return (
    <main className="dashboard-page foro-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          
{onVolver && (
  <button
    type="button"
    className="foro-back-btn"
    onClick={onVolver}
  >
    ←
  </button>
)}
          <div className="dashboard-header-copy">
            <h1>Foro</h1>
            <span className="forum-club-label">Club: {nombreClub}</span>
          </div>
          <button className="dashboard-action-btn" type="button" onClick={() => { setMostrarFormulario((actual) => !actual); setAvisoModeracion(""); }}>
            {mostrarFormulario ? "Cancelar" : "+ Publicar"}
          </button>
        </header>

        {errorCarga && <div className="forum-moderation-alert" role="alert">{errorCarga}</div>}

        <section className="dashboard-card" aria-label="Buscar publicaciones">
          <label className="eyebrow" htmlFor="forum-search">Encuentra una conversación</label>
          <input id="forum-search" className="forum-search" type="search" placeholder="Buscar en el foro..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
          <nav className="forum-categories" aria-label="Filtrar por categoría">
            {categorias.map((elemento) => (
              <button key={elemento} className={`range-btn ${categoriaActiva === elemento ? "active" : ""}`} type="button" aria-pressed={categoriaActiva === elemento} onClick={() => setCategoriaActiva(elemento)}>{elemento}</button>
            ))}
          </nav>
        </section>

        {mostrarFormulario && (
          <section className="dashboard-card">
            <div className="card-header"><div><p className="eyebrow">Comparte con la comunidad</p><h3>Nueva publicación</h3></div></div>
            <form className="event-form" onSubmit={publicar}>
              <input aria-label="Título de la publicación" placeholder="Escribe un título" maxLength={100} value={titulo} onChange={(event) => setTitulo(event.target.value)} required />
              <select aria-label="Categoría" value={categoria} onChange={(event) => setCategoria(event.target.value)}>
                {categorias.slice(1).map((elemento) => <option key={elemento} value={elemento}>{elemento}</option>)}
              </select>
              <textarea aria-label="Texto de la publicación" placeholder="¿Qué quieres compartir?" rows={4} maxLength={1000} value={texto} onChange={(event) => setTexto(event.target.value)} required />
              {avisoModeracion && <div className="forum-moderation-alert" role="alert">{avisoModeracion}</div>}
              <div className="forum-form-actions"><span className="form-label-small">{texto.length}/1000 caracteres</span><button className="mini-btn" type="submit" disabled={publicando}>{publicando ? "Publicando…" : "Publicar"}</button></div>
            </form>
          </section>
        )}

        <section className="forum-post-list" aria-live="polite">
          {cargando ? (
            <div className="dashboard-card forum-empty"><p className="eyebrow">Cargando</p><p>Estamos buscando las publicaciones del club…</p></div>
          ) : publicacionesVisibles.length === 0 ? (
            <div className="dashboard-card forum-empty"><p className="eyebrow">Sin resultados</p><p>{publicaciones.length ? "No se encontraron publicaciones con esos criterios." : "Todavía no hay publicaciones. ¡Puedes iniciar la conversación!"}</p></div>
          ) : publicacionesVisibles.map((publicacion) => (
            <article className="dashboard-card forum-post" key={publicacion.id_publicacion}>
              <div className="request-info">
                <div className="request-avatar" aria-hidden="true">{inicialesDe(publicacion.autor)}</div>
                <div><strong>{publicacion.autor}</strong><span>{tiempoRelativo(publicacion.fecha_creacion)}</span></div>
                <span className="chip-cute forum-post-category">{publicacion.categoria}</span>
              </div>
              <div className="forum-post-content"><h2>{publicacion.titulo}</h2><p>{publicacion.texto}</p></div>
              <div className="forum-post-actions">
                <button className="mini-btn" type="button" aria-pressed={Boolean(publicacion.liked)} disabled={Boolean(accionando[`like-${publicacion.id_publicacion}`])} onClick={() => cambiarMeGusta(publicacion)}>{publicacion.liked ? "♥" : "♡"} Me gusta · {publicacion.likes}</button>
                <button className="mini-btn" type="button" onClick={() => abrirPublicacion(publicacion)}>Abrir foro completo</button>
              </div>
            </article>
          ))}
        </section>
      </div>

      {publicacionAbierta && (
        <div className="forum-detail-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setPublicacionAbierta(null); }}>
          <section className="forum-detail-panel" role="dialog" aria-modal="true" aria-labelledby="forum-detail-title">
            <div className="forum-detail-header"><div><p className="eyebrow">Foro · {nombreClub}</p><h2 id="forum-detail-title">{publicacionAbierta.titulo}</h2></div><button className="close-form-btn" type="button" aria-label="Cerrar" onClick={() => setPublicacionAbierta(null)}>×</button></div>
            <div className="request-info"><div className="request-avatar" aria-hidden="true">{inicialesDe(publicacionAbierta.autor)}</div><div><strong>{publicacionAbierta.autor}</strong><span>{tiempoRelativo(publicacionAbierta.fecha_creacion)}</span></div><span className="chip-cute forum-post-category">{publicacionAbierta.categoria}</span></div>
            <div className="forum-detail-text"><p>{publicacionAbierta.texto}</p></div>
            <div className="forum-detail-feedback">
              <button className="forum-like-small" type="button" aria-pressed={Boolean(publicacionAbierta.liked)} onClick={() => cambiarMeGusta(publicacionAbierta)}>{publicacionAbierta.liked ? "♥" : "♡"} {publicacionAbierta.likes}</button>
              <div className="forum-reactions"><p>¿Qué te pareció esta publicación?</p><div className="forum-reaction-options">
                {opcionesReaccion.map((opcion) => {
                  const countKey = `reaccion_${opcion.id}`;
                  return <button key={opcion.id} className={`forum-reaction ${publicacionAbierta.mi_reaccion === opcion.id ? "selected" : ""}`} type="button" aria-pressed={publicacionAbierta.mi_reaccion === opcion.id} disabled={Boolean(accionando[`reaccion-${publicacionAbierta.id_publicacion}`])} onClick={() => reaccionar(publicacionAbierta, opcion.id)}><span>{opcion.emoji}</span>{opcion.texto} · {publicacionAbierta[countKey] || 0}</button>;
                })}
              </div></div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
