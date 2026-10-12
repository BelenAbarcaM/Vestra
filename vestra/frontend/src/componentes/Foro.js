import { useMemo, useState } from "react";
import "./Foro.css";

const publicacionesIniciales = [
  {
    id: 1,
    autor: "María López",
    iniciales: "ML",
    categoria: "General",
    tiempo: "Hace 15 min",
    titulo: "¡Bienvenidos al foro del club!",
    texto:
      "Este es un espacio para compartir ideas, hacer preguntas y mantenernos al día con las actividades.",
    detalle:
      "¡Bienvenidos al foro del club! Este espacio es para que todos podamos compartir ideas, hacer preguntas y mantenernos al día con las actividades.\n\nPuedes proponer temas, contar cómo te fue en una actividad o compartir información que le sirva al grupo. También puedes usar las categorías para encontrar conversaciones sobre eventos, preguntas y logros.\n\nMantengamos la conversación amable y respetuosa para que todos se sientan incluidos. ¡Nos alegra tenerte aquí!",
    likes: 4,
    liked: false,
  },
  {
    id: 2,
    autor: "Carlos Ruiz",
    iniciales: "CR",
    categoria: "Eventos",
    tiempo: "Hace 1 h",
    titulo: "¿Quién se apunta a la próxima actividad?",
    texto:
      "Dejen sus ideas para organizar algo entre todos este fin de semana.",
    detalle:
      "¿Quién se apunta a organizar la próxima actividad del club? La idea es reunirnos este fin de semana y elegir algo que todos podamos disfrutar.\n\nDejen sus propuestas en esta conversación. Podemos organizar un partido, una tarde de juegos o una actividad al aire libre. Si tienen una fecha u horario que les funcione mejor, también pueden mencionarlo.\n\nCuando tengamos varias ideas, podemos ponernos de acuerdo y confirmar los detalles aquí mismo.",
    likes: 2,
    liked: false,
  },
];

const categorias = ["Todos", "General", "Eventos", "Preguntas", "Logros"];

const opcionesReaccion = [
  { id: "util", emoji: "💡", texto: "Útil" },
  { id: "interesante", emoji: "✨", texto: "Interesante" },
  { id: "gracioso", emoji: "😄", texto: "Gracioso" },
];

const MODERATION_ENDPOINTS = [
  "http://localhost/Vestra-main/vestra/backend/api/moderar.php",
  "http://localhost/vestra/backend/api/moderar.php",
];

function normalizarModeracion(valor) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[431!057@$]/g, (caracter) =>
      ({
        "4": "a",
        "@": "a",
        "3": "e",
        "1": "i",
        "!": "i",
        "0": "o",
        "5": "s",
        "7": "t",
        "$": "s",
      }[caracter] || caracter)
    );
}

function moderacionLocal(texto) {
  const limpio = normalizarModeracion(texto).replace(/[^a-z0-9]+/g, "");
  const bloqueadas = [
    "puta",
    "puto",
    "carepicha",
    "mierda",
    "mrd",
    "hijueputa",
    "hp",
    "malparido",
    "imbecil",
    "idiota",
    "estupido",
    "maricon",
    "zorra",
    "perra",
    "cabron",
    "pendejo",
    "mamapichas",
    "mongolo",
    "estúpido",
    "imbécil",
    "maricón",
    "cabrón",
  ];

  return bloqueadas.some((palabra) => limpio.includes(palabra));
}

async function moderarContenidoForo(texto) {
  for (const endpoint of MODERATION_ENDPOINTS) {
    try {
      const respuesta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          contexto: "Publicación del foro de Vestra",
        }),
      });

      if (!respuesta.ok && respuesta.status !== 422) {
        continue;
      }

      const data = await respuesta.json();
      return {
        bloqueado: Boolean(data.blocked),
        mensaje: data.mensaje,
      };
    } catch {
      // Si Apache o Gemini no responden durante la demo, cae al filtro local.
    }
  }

  if (moderacionLocal(texto)) {
    return {
      bloqueado: true,
      mensaje:
        "Tu publicación fue bloqueada porque contiene vocabulario inadecuado. En Vestra queremos mantener una comunidad respetuosa.",
    };
  }

  return { bloqueado: false };
}

export default function Foro({
  nombreClub = localStorage.getItem("nombre_club") || "Club sin seleccionar",
}) {
  const [publicaciones, setPublicaciones] = useState(publicacionesIniciales);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState("General");
  const [publicacionAbierta, setPublicacionAbierta] = useState(null);
  const [reacciones, setReacciones] = useState({});
  const [avisoModeracion, setAvisoModeracion] = useState("");

  const publicacionesVisibles = useMemo(() => {
    const consulta = busqueda.trim().toLowerCase();

    return publicaciones.filter((publicacion) => {
      const coincideCategoria =
        categoriaActiva === "Todos" ||
        publicacion.categoria === categoriaActiva;

      const coincideBusqueda =
        !consulta ||
        `${publicacion.titulo} ${publicacion.texto} ${publicacion.autor}`
          .toLowerCase()
          .includes(consulta);

      return coincideCategoria && coincideBusqueda;
    });
  }, [publicaciones, categoriaActiva, busqueda]);

  async function publicar(event) {
    event.preventDefault();

    const tituloLimpio = titulo.trim();
    const textoLimpio = texto.trim();

    if (!tituloLimpio || !textoLimpio) return;

    setAvisoModeracion("");

    const revision = await moderarContenidoForo(
      `${tituloLimpio}\n${textoLimpio}`
    );

    if (revision.bloqueado) {
      setAvisoModeracion(
        revision.mensaje ||
          "Tu publicación fue bloqueada por el filtro de convivencia de Vestra. Reformúlala con respeto para poder publicarla."
      );
      return;
    }

    setPublicaciones((actuales) => [
      {
        id: Date.now(),
        autor: "Tú",
        iniciales: "TÚ",
        categoria,
        tiempo: "Ahora",
        titulo: tituloLimpio,
        texto: textoLimpio,
        detalle: textoLimpio,
        likes: 0,
        liked: false,
      },
      ...actuales,
    ]);

    setTitulo("");
    setTexto("");
    setCategoria("General");
    setAvisoModeracion("");
    setMostrarFormulario(false);
  }

  function cambiarMeGusta(idPublicacion) {
    setPublicaciones((actuales) =>
      actuales.map((publicacion) =>
        publicacion.id === idPublicacion
          ? {
              ...publicacion,
              liked: !publicacion.liked,
              likes: publicacion.likes + (publicacion.liked ? -1 : 1),
            }
          : publicacion
      )
    );

    setPublicacionAbierta((actual) =>
      actual?.id === idPublicacion
        ? {
            ...actual,
            liked: !actual.liked,
            likes: actual.likes + (actual.liked ? -1 : 1),
          }
        : actual
    );
  }

  function reaccionar(idPublicacion, reaccion) {
    setReacciones((actuales) => ({
      ...actuales,
      [idPublicacion]:
        actuales[idPublicacion] === reaccion ? null : reaccion,
    }));
  }

  return (
    <main className="dashboard-page foro-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-header-copy">
            <p className="eyebrow">Comunidad</p>
            <h1>Foro</h1>
            <span className="forum-club-label">Club: {nombreClub}</span>
          </div>

          <button
            className="dashboard-action-btn"
            type="button"
            onClick={() => setMostrarFormulario((actual) => !actual)}
          >
            {mostrarFormulario ? "Cancelar" : "+ Publicar"}
          </button>
        </header>

        <section className="dashboard-card" aria-label="Buscar publicaciones">
          <label className="eyebrow" htmlFor="forum-search">
            Encuentra una conversación
          </label>

          <input
            id="forum-search"
            className="forum-search"
            type="search"
            placeholder="Buscar en el foro..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />

          <nav className="forum-categories" aria-label="Filtrar por categoría">
            {categorias.map((elemento) => (
              <button
                key={elemento}
                className={`range-btn ${
                  categoriaActiva === elemento ? "active" : ""
                }`}
                type="button"
                aria-pressed={categoriaActiva === elemento}
                onClick={() => setCategoriaActiva(elemento)}
              >
                {elemento}
              </button>
            ))}
          </nav>
        </section>

        {mostrarFormulario && (
          <section className="dashboard-card">
            <div className="card-header">
              <div>
                <p className="eyebrow">Comparte con la comunidad</p>
                <h3>Nueva publicación</h3>
              </div>
            </div>

            <form className="event-form" onSubmit={publicar}>
              <input
                aria-label="Título de la publicación"
                placeholder="Escribe un título"
                maxLength={100}
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                required
              />

              <select
                aria-label="Categoría"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
              >
                {categorias.slice(1).map((elemento) => (
                  <option key={elemento} value={elemento}>
                    {elemento}
                  </option>
                ))}
              </select>

              <textarea
                aria-label="Texto de la publicación"
                placeholder="¿Qué quieres compartir?"
                rows={4}
                maxLength={1000}
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                required
              />

              {avisoModeracion && (
                <div className="forum-moderation-alert" role="alert">
                  {avisoModeracion}
                </div>
              )}

              <div className="forum-form-actions">
                <span className="form-label-small">
                  {texto.length}/1000 caracteres
                </span>
                <button className="mini-btn" type="submit">
                  Publicar
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="forum-post-list" aria-live="polite">
          {publicacionesVisibles.length === 0 ? (
            <div className="dashboard-card forum-empty">
              <p className="eyebrow">Sin resultados</p>
              <p>No se encontraron publicaciones con esos criterios.</p>
            </div>
          ) : (
            publicacionesVisibles.map((publicacion) => (
              <article className="dashboard-card forum-post" key={publicacion.id}>
                <div className="request-info">
                  <div className="request-avatar" aria-hidden="true">
                    {publicacion.iniciales}
                  </div>

                  <div>
                    <strong>{publicacion.autor}</strong>
                    <span>{publicacion.tiempo}</span>
                  </div>

                  <span className="chip-cute forum-post-category">
                    {publicacion.categoria}
                  </span>
                </div>

                <div className="forum-post-content">
                  <h2>{publicacion.titulo}</h2>
                  <p>{publicacion.texto}</p>
                </div>

                <div className="forum-post-actions">
                  <button
                    className="mini-btn"
                    type="button"
                    aria-pressed={publicacion.liked}
                    onClick={() => cambiarMeGusta(publicacion.id)}
                  >
                    {publicacion.liked ? "♥" : "♡"} Me gusta ·{" "}
                    {publicacion.likes}
                  </button>

                  <button
                    className="mini-btn"
                    type="button"
                    onClick={() => setPublicacionAbierta(publicacion)}
                  >
                    Abrir foro completo
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      {publicacionAbierta && (
        <div
          className="forum-detail-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPublicacionAbierta(null);
            }
          }}
        >
          <section
            className="forum-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forum-detail-title"
          >
            <div className="forum-detail-header">
              <div>
                <p className="eyebrow">Foro · {nombreClub}</p>
                <h2 id="forum-detail-title">
                  {publicacionAbierta.titulo}
                </h2>
              </div>

              <button
                className="close-form-btn"
                type="button"
                aria-label="Cerrar"
                onClick={() => setPublicacionAbierta(null)}
              >
                ×
              </button>
            </div>

            <div className="request-info">
              <div className="request-avatar" aria-hidden="true">
                {publicacionAbierta.iniciales}
              </div>

              <div>
                <strong>{publicacionAbierta.autor}</strong>
                <span>{publicacionAbierta.tiempo}</span>
              </div>

              <span className="chip-cute forum-post-category">
                {publicacionAbierta.categoria}
              </span>
            </div>

            <div className="forum-detail-text">
              <p>
                {publicacionAbierta.detalle || publicacionAbierta.texto}
              </p>
            </div>

            <div className="forum-detail-feedback">
              <button
                className="forum-like-small"
                type="button"
                aria-pressed={publicacionAbierta.liked}
                onClick={() => cambiarMeGusta(publicacionAbierta.id)}
              >
                {publicacionAbierta.liked ? "♥" : "♡"}{" "}
                {publicacionAbierta.likes}
              </button>

              <div className="forum-reactions">
                <p>¿Qué te pareció este foro?</p>

                <div className="forum-reaction-options">
                  {opcionesReaccion.map((opcion) => (
                    <button
                      key={opcion.id}
                      className={`forum-reaction ${
                        reacciones[publicacionAbierta.id] === opcion.id
                          ? "selected"
                          : ""
                      }`}
                      type="button"
                      aria-pressed={
                        reacciones[publicacionAbierta.id] === opcion.id
                      }
                      onClick={() =>
                        reaccionar(publicacionAbierta.id, opcion.id)
                      }
                    >
                      <span>{opcion.emoji}</span>
                      {opcion.texto}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
