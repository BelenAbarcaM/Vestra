import { API_BASE_URL, appUrl } from '../config/api';

import React, { useState, useMemo, useRef, useEffect } from "react";

import "./Inicio.css";
import "../App.css";
import "../fontello/css/fontello.css";

import logito from "../assets/logito.png";
import Chatbot from "./Chatbot";
import FormularioPublicacion from "./FormularioPublicacion";
import "./FormularioPublicacion.css"

const API_URL = API_BASE_URL;
const BASE_URL = appUrl("");

export default function Inicio({
  onVerPerfil,
  onAbrirFormularioPublicacion,
  onChatbotOpenChange
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedClubId, setSelectedClubId] = useState(null);

  const [clubes, setClubes] = useState([]);
  const [clubesProfesor, setClubesProfesor] = useState([]);

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [tipoUsuario, setTipoUsuario] = useState(null);

  const [expandedComments, setExpandedComments] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [localPosts, setLocalPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentTexts, setCommentTexts] = useState({});

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [publicacionEditar, setPublicacionEditar] = useState(null);
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(null);

  const searchInputRef = useRef(null);
  const FALLBACK_IMAGE = logito;

  const esProfesor = Number(tipoUsuario) === 2;
  // =========================================================
  // FUNCIONES AUXILIARES
  // =========================================================

  function obtenerIdUsuarioActual(data) {
    return (
      data?.usuario_actual?.id_usuario ??
      data?.id_usuario_actual ??
      data?.usuario?.id_usuario ??
      null
    );
  }

  function obtenerTipoUsuario(data) {
    return (
      data?.usuario_actual?.id_tipo_usuario ??
      data?.usuario_actual?.tipo ??
      data?.tipo_usuario_actual ??
      null
    );
  }

  function obtenerUrlImagen(ruta) {
    if (!ruta) return null;

    if (/^https?:\/\//i.test(ruta)) {
      return ruta;
    }

    return `${BASE_URL}${String(ruta).replace(/^\/+/, "")}`;
  }

  async function leerRespuesta(response) {
    const texto = await response.text();

    try {
      return JSON.parse(texto);
    } catch {
      return {
        success: response.ok,
        mensaje: texto,
      };
    }
  }

  function mapearPublicacion(post, comentarios = []) {
    return {
      id: Number(post.id ?? post.id_publicacion),
      id_publicacion: Number(post.id ?? post.id_publicacion),
      id_usuario: Number(post.id_usuario),
      id_club: Number(post.id_club ?? post.idClub ?? 0),
      caption: post.texto ?? post.Texto ?? "",
      image_url: obtenerUrlImagen(post.imagen ?? post.imagen_url),
      likes: Number(post.likes || 0),
      _liked: Number(post.liked) === 1 || post.liked === true,
      created_at: post.fecha ?? post.created_at,
      category: post.club ?? post.nombre_club ?? "",
      author: {
        id: Number(post.id_usuario),
        name: post.usuario ?? post.Nombre ?? "Usuario",
        avatar: obtenerUrlImagen(
          post.foto_usuario
            ? `uploads/perfiles/${post.foto_usuario}`
            : post.Foto_url
        ),
      },
      comments_list: comentarios,
    };
  }

  // =========================================================
  // CARGAR PUBLICACIONES
  // =========================================================

  const cargarPublicaciones = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/publicaciones/listar.php`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await leerRespuesta(response);

console.log("ESTADO HTTP:", response.status);
console.log("RESPUESTA COMPLETA:", JSON.stringify(data, null, 2));
console.log("SUCCESS:", data.success);
console.log("MENSAJE:", data.mensaje);
console.log("PUBLICACIONES:", data.publicaciones);



      if (!response.ok || !data.success) {
        setError(
          data.mensaje || "No se pudieron cargar las publicaciones."
        );
        return null;
      }

      // listar.php debe incluir los datos del usuario autenticado.
      const idActual = obtenerIdUsuarioActual(data);
      const tipoActual = obtenerTipoUsuario(data);

      if (idActual !== null) {
        setUsuarioActual(Number(idActual));
      }

      if (tipoActual !== null) {
        setTipoUsuario(Number(tipoActual));
      }

      const publicaciones = await Promise.all(
        (data.publicaciones || []).map(async (post) => {
          const comentarios = await cargarComentarios(
            post.id ?? post.id_publicacion
          );

          return mapearPublicacion(post, comentarios);
        })
      );

      setLocalPosts(publicaciones);

      return idActual === null ? null : Number(idActual);
    } catch (err) {
      console.error("Error cargando publicaciones:", err);
      setError("No se pudieron cargar las publicaciones.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CARGAR CLUBES Y CLUBES DEL PROFESOR
  // =========================================================

  const cargarClubes = async (idActual = usuarioActual) => {
    try {
      const response = await fetch(`${API_URL}/clubes/listar.php`, {
        method: "GET",
        credentials: "include",
      });

      const data = await leerRespuesta(response);

      if (!response.ok || !data.success) {
        console.error("No se pudieron cargar los clubes.");
        return;
      }

      const listaClubes = data.clubes || [];
      setClubes(listaClubes);

      // No mostramos clubes ajenos como opciones para publicar.
      // El backend también debe verificar la asignación.
      if (idActual !== null && idActual !== undefined) {
        const asignados = listaClubes.filter(
          (club) =>
            Number(club.id_profesor) === Number(idActual)
        );

        setClubesProfesor(asignados);
      } else {
        setClubesProfesor([]);
      }
    } catch (err) {
      console.error("Error cargando clubes:", err);
    }
  };

  useEffect(() => {
    async function inicializar() {
      const idActual = await cargarPublicaciones();
      await cargarClubes(idActual);
    }

    inicializar();
    // Se ejecuta al montar el componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // CARGAR PUBLICACIONES POR CLUB
  // =========================================================

  const cargarPublicacionesPorClub = async (idClub) => {
    try {
      setLoading(true);
      setError("");

      const formData = new URLSearchParams();
      formData.append("id_club", idClub);

      const response = await fetch(
        `${API_URL}/publicaciones/obtener.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const data = await leerRespuesta(response);

      if (!response.ok || !Array.isArray(data)) {
        setError("No se pudieron cargar las publicaciones.");
        return;
      }

      const publicaciones = await Promise.all(
        data.map(async (post) => {
          const comentarios = await cargarComentarios(
            post.id ?? post.id_publicacion
          );

          return mapearPublicacion(post, comentarios);
        })
      );

      setLocalPosts(publicaciones);
    } catch (err) {
      console.error("Error cargando publicaciones del club:", err);
      setError("No se pudieron cargar las publicaciones.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CARGAR COMENTARIOS
  // =========================================================

  const cargarComentarios = async (idPublicacion) => {
    try {
      const response = await fetch(
        `${API_URL}/comentarios/listar.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_publicacion: idPublicacion,
          }),
        }
      );

      const data = await leerRespuesta(response);

      if (!Array.isArray(data)) {
        console.error("Respuesta inesperada al cargar comentarios:", data);
        return [];
      }

      return data.map((comment) => ({
        id: Number(comment.id_comentario),
        id_usuario: Number(comment.id_usuario),
        text: comment.texto,
        author: comment.usuario,
        avatar: comment.foto_usuario
          ? obtenerUrlImagen(`uploads/perfiles/${comment.foto_usuario}`)
          : null,
        time: comment.fecha,
        likes: Number(comment.likes || 0),
        _liked: Number(comment.liked) === 1 || comment.liked === true,
      }));
    } catch (err) {
      console.error(
        `Error cargando comentarios de publicación ${idPublicacion}:`,
        err
      );
      return [];
    }
  };

  // =========================================================
  // BUSCADOR
  // =========================================================

  useEffect(() => {
    if (!searchOpen) return;

    const id = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);

    return () => clearTimeout(id);
  }, [searchOpen]);

  const filtered = useMemo(() => {
    const normalize = (value = "") =>
      String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const words = normalize(query).split(/\s+/).filter(Boolean);

    return localPosts.filter((post) => {
      const text = normalize(
        `${post.caption || ""} ${
          post.author?.name || ""
        } ${post.category || ""} ${(post.comments_list || [])
          .map((comment) => comment.text)
          .join(" ")}`
      );

      return words.every((word) => text.includes(word));
    });
  }, [query, localPosts]);

  // =========================================================
  // FILTROS POR CATEGORÍA
  // =========================================================

  function selectCategory(category, idClub = null) {
    setSelectedCategory(category);
    setSelectedClubId(idClub);
    setMenuOpen(false);

    if (idClub === null) {
      cargarPublicaciones();
    } else {
      cargarPublicacionesPorClub(idClub);
    }
  }

  // =========================================================
  // CREAR COMENTARIO
  // =========================================================

  const crearComentario = async (postId) => {
    const texto = (commentTexts[postId] || "").trim();

    if (!texto) return;

    try {
      const response = await fetch(
        `${API_URL}/comentarios/crear.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_publicacion: postId,
            texto,
          }),
        }
      );

      const data = await leerRespuesta(response);

      if (!response.ok || !data.success) {
        console.error(data.mensaje || "No se pudo crear el comentario.");
        return;
      }

      setCommentTexts((previous) => ({
        ...previous,
        [postId]: "",
      }));

      const comentariosActualizados = await cargarComentarios(postId);

      setLocalPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? { ...post, comments_list: comentariosActualizados }
            : post
        )
      );
    } catch (err) {
      console.error("Error creando comentario:", err);
    }
  };

  // =========================================================
  // LIKE PUBLICACIÓN
  // =========================================================

  const toggleLike = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/likes/toggle.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_publicacion: postId,
        }),
      });

      const data = await leerRespuesta(response);

      if (!response.ok || !data.success) {
        console.error(data.mensaje || "No se pudo actualizar el like.");
        return;
      }

      setLocalPosts((previous) =>
        previous.map((post) => {
          if (post.id !== postId) return post;

          const ahoraTieneLike =
            data.liked === true || Number(data.liked) === 1;

          return {
            ...post,
            _liked: ahoraTieneLike,
            likes: ahoraTieneLike
              ? post.likes + 1
              : Math.max(post.likes - 1, 0),
          };
        })
      );
    } catch (err) {
      console.error("Error dando like:", err);
    }
  };

  // =========================================================
  // LIKE COMENTARIO
  // =========================================================

  const toggleCommentLike = async (postId, commentId) => {
    try {
      const response = await fetch(
        `${API_URL}/comentarios/toggle.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_comentario: commentId,
          }),
        }
      );

      const data = await leerRespuesta(response);

      if (!response.ok || !data.success) {
        console.error(
          data.mensaje || "No se pudo actualizar el like del comentario."
        );
        return;
      }

      const ahoraTieneLike =
        data.liked === true || Number(data.liked) === 1;

      setLocalPosts((previous) =>
        previous.map((post) => {
          if (post.id !== postId) return post;

          return {
            ...post,
            comments_list: post.comments_list.map((comment) => {
              if (comment.id !== commentId) return comment;

              return {
                ...comment,
                _liked: ahoraTieneLike,
                likes: ahoraTieneLike
                  ? Number(comment.likes || 0) + 1
                  : Math.max(Number(comment.likes || 0) - 1, 0),
              };
            }),
          };
        })
      );
    } catch (err) {
      console.error("Error dando like al comentario:", err);
    }
  };

  // =========================================================
  // ABRIR Y CERRAR COMENTARIOS
  // =========================================================

  function toggleExpandComments(postId) {
    setExpandedComments((previous) => ({
      ...previous,
      [postId]: !previous[postId],
    }));
  }

  function toggleExpandCaption(postId) {
    setExpandedCaptions((previous) => ({
      ...previous,
      [postId]: !previous[postId],
    }));
  }

  function cerrarComentarios(postId) {
    setExpandedComments((previous) => ({
      ...previous,
      [postId]: false,
    }));
  }

  // =========================================================
  // CREAR Y EDITAR PUBLICACIONES
  // =========================================================

  function abrirFormularioCrear() {
    setPublicacionEditar(null);
    setMostrarFormulario(true);
  }

  function abrirFormularioEditar(post) {
    setPublicacionEditar({
      ...post,
      id_club: post.id_club,
    });
    setMostrarFormulario(true);
  }

  async function actualizarFeed() {
    setMostrarFormulario(false);
    setPublicacionEditar(null);

    if (selectedClubId === null) {
      await cargarPublicaciones();
    } else {
      await cargarPublicacionesPorClub(selectedClubId);
    }
  }

  // =========================================================
  // ELIMINAR PUBLICACIÓN
  // =========================================================

  async function eliminarPublicacion(post) {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar esta publicación?"
    );

    if (!confirmar) return;

    try {
      setProcesandoEliminacion(post.id);

      const datos = new URLSearchParams();
      datos.append("id_publicacion", String(post.id));

      const response = await fetch(
        `${API_URL}/publicaciones/eliminar.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: datos.toString(),
        }
      );

      const data = await leerRespuesta(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.mensaje || "No se pudo eliminar la publicación."
        );
      }

      await actualizarFeed();
    } catch (err) {
      console.error("Error eliminando publicación:", err);
      window.alert(err.message || "No se pudo eliminar la publicación.");
    } finally {
      setProcesandoEliminacion(null);
    }
  }

  // =========================================================
  // IMÁGENES
  // =========================================================

  function handleImgError(event) {
    if (!event.currentTarget.dataset.fallbackApplied) {
      event.currentTarget.src = FALLBACK_IMAGE;
      event.currentTarget.dataset.fallbackApplied = "true";
    }
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="inicio-page">
      {/* HEADER */}
      <header className="topbar">
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Abrir menú"
        >
          <i className="icon-menu" aria-hidden="true" />
        </button>

        {menuOpen && (
          <div className="hamburger-menu">
            <button
              type="button"
              onClick={() => selectCategory("Todas")}
            >
              <i className="icon-home" aria-hidden="true" />
              Todas las publicaciones
            </button>

            {clubes.map((club) => (
              <button
                type="button"
                key={club.id_club}
                onClick={() =>
                  selectCategory(
                    club.Nombre || club.nombre,
                    club.id_club
                  )
                }
              >
                <i className="icon-users" aria-hidden="true" />
                {club.Nombre || club.nombre}
              </button>
            ))}
          </div>
        )}

        <div className="topbar-inner">
          <div className="topbar-space" />

          <button
            type="button"
            className="topbar-search-btn"
            aria-expanded={searchOpen}
            aria-label="Buscar"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <i className="icon-search" aria-hidden="true" />
          </button>
        </div>

        <div className={`search-panel ${searchOpen ? "open" : ""}`}>
          <div className="search-panel-inner">
            <input
              ref={searchInputRef}
              type="text"
              className="top-search-input"
              placeholder="Buscar palabras..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <button
              type="button"
              className="search-close"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar búsqueda"
            >
              <i className="icon-cancel" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <header className="cedes-hero">
        <div className="cedes-hero-inner">
          <h1 className="cedes-title">
            <span className="line1">LO</span>
            <span className="line2">ULTIMO EN</span>
            <span className="line3">CEDES</span>
          </h1>

          <div className="cedes-deco" />
        </div>
      </header>

      {/* FEED */}
      <main className="cedes-feed">
        {esProfesor && !mostrarFormulario && (
          <button
            type="button"
            className="boton-crear-publicacion"
            onClick={() => onAbrirFormularioPublicacion()}
          >
            <span aria-hidden="true">+</span>
    Crear publicación
</button>
        )}

        {mostrarFormulario && esProfesor && (
          <FormularioPublicacion
            apiUrl={API_URL}
            clubes={clubesProfesor}
            publicacion={publicacionEditar}
            onCancelar={() => {
              setMostrarFormulario(false);
              setPublicacionEditar(null);
            }}
            onGuardado={actualizarFeed}
          />
        )}

        {esProfesor &&
          mostrarFormulario &&
          clubesProfesor.length === 0 && (
            <div className="feed-message">
              No encontramos clubes asignados a tu usuario.
              Revisa que el servidor devuelva los clubes del profesor.
            </div>
          )}

        {loading && (
          <div className="feed-message">
            Cargando publicaciones...
          </div>
        )}

        {error && !loading && (
          <div className="feed-message error">{error}</div>
        )}

        {!loading &&
          !error &&
          filtered.map((post) => {
            const maxCaptionLength = 105;
            const fullCaption = post.caption || "";
            const isCaptionLong =
              fullCaption.length > maxCaptionLength;
            const isCaptionExpanded = Boolean(
              expandedCaptions[post.id]
            );

            const visibleCaption =
              isCaptionLong && !isCaptionExpanded
                ? `${fullCaption
                    .slice(0, maxCaptionLength)
                    .trim()}...`
                : fullCaption;

            const esAutor = Number(post.id_usuario) === Number(usuarioActual);
            const puedeGestionar =
              esProfesor && esAutor;

            return (
              <article key={post.id} className="cedes-card">
                {/* HEADER DE PUBLICACIÓN */}
                <div className="card-header">
                  <div className="author">
                    <img
                      className="author-avatar"
                      src={post.author?.avatar || FALLBACK_IMAGE}
                      alt={post.author?.name || "Autor"}
                      onError={handleImgError}
                    />

                    <div className="author-name">
                      <button
                        type="button"
                        className="author-name-button"
                        onClick={() => {
                          if (post.author?.id && onVerPerfil) {
                            onVerPerfil(post.author.id);
                          }
                        }}
                      >
                        {post.author?.name}
                      </button>

                      <span className="category-label">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="post-time">
                    <i className="icon-calendar" aria-hidden="true" />
                    {post.created_at &&
                    !Number.isNaN(new Date(post.created_at).getTime())
                      ? new Date(post.created_at).toLocaleDateString(
                          "es-CR",
                          {
                            day: "numeric",
                            month: "short",
                          }
                        )
                      : ""}
                  </div>
                </div>

                {/* CONTROLES DEL PROFESOR */}
                {puedeGestionar && (
                  <div className="publicacion-admin-actions">
                    <button
                      type="button"
                      className="publicacion-editar-btn"
                      onClick={() => abrirFormularioEditar(post)}
                      aria-label="Editar publicación"
                      title="Editar publicación"
                    >
                      <i className="icon-pencil" aria-hidden="true" />
                      Editar
                    </button>

                    <button
                      type="button"
                      className="publicacion-eliminar-btn"
                      onClick={() => eliminarPublicacion(post)}
                      disabled={procesandoEliminacion === post.id}
                      aria-label="Eliminar publicación"
                      title="Eliminar publicación"
                    >
                      <i className="icon-trash" aria-hidden="true" />
                      {procesandoEliminacion === post.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                )}

                {/* IMAGEN */}
                {post.image_url && (
                  <div className="card-image">
                    <img
                      src={post.image_url}
                      alt={post.caption || "Imagen de la publicación"}
                      onError={handleImgError}
                    />
                  </div>
                )}

                {/* CUERPO */}
                <div className="card-body">
                  <div className="card-caption">
                    {visibleCaption}

                    {isCaptionLong && (
                      <button
                        type="button"
                        className="caption-toggle"
                        onClick={() => toggleExpandCaption(post.id)}
                      >
                        {isCaptionExpanded ? "Ver menos" : "Ver más"}
                      </button>
                    )}
                  </div>

                  {/* ACCIONES */}
                  <div className="card-actions">
                    <div className="actions-left">
                      <button
                        type="button"
                        className="comment-btn"
                        title="Ver comentarios"
                        onClick={() => toggleExpandComments(post.id)}
                      >
                        <i className="icon-comment" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        className="like-btn"
                        onClick={() => toggleLike(post.id)}
                        aria-pressed={Boolean(post._liked)}
                        aria-label="Me gusta"
                      >
                        <i
                          className={
                            post._liked
                              ? "icon-heart"
                              : "icon-heart-empty"
                          }
                          aria-hidden="true"
                        />
                      </button>

                      <span className="likes-count">{post.likes}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

        {!loading && !error && filtered.length === 0 && (
          <div className="feed-message">
            No encontramos publicaciones.
          </div>
        )}
      </main>

      {/* MODAL DE COMENTARIOS */}
      {Object.entries(expandedComments).map(([postId, abierto]) => {
        if (!abierto) return null;

        const post = localPosts.find(
          (item) => item.id === Number(postId)
        );

        if (!post) return null;

        return (
          <div
            key={post.id}
            className="comments-modal-overlay"
            onClick={() => cerrarComentarios(post.id)}
          >
            <div
              className="comments-modal"
              onClick={(event) => event.stopPropagation()}
            >
              {/* HEADER DEL MODAL */}
              <div className="comments-modal-header">
                <h2>Comentarios</h2>

                <button
                  type="button"
                  className="comments-close"
                  onClick={() => cerrarComentarios(post.id)}
                  aria-label="Cerrar comentarios"
                >
                  <i className="icon-cancel" aria-hidden="true" />
                </button>
              </div>

              {/* LISTA DE COMENTARIOS */}
              <div className="comments-modal-list">
                {post.comments_list.length === 0 ? (
                  <p className="no-comments">
                    Todavía no hay comentarios.
                  </p>
                ) : (
                  post.comments_list.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <img
                        className="comment-avatar"
                        src={comment.avatar || FALLBACK_IMAGE}
                        alt={comment.author || "Usuario"}
                        onError={handleImgError}
                      />

                      <div className="comment-body">
                        <div className="comment-meta">
                          <button
                            type="button"
                            className="comment-author-button"
                            onClick={() => {
                              if (comment.id_usuario && onVerPerfil) {
                                onVerPerfil(comment.id_usuario);
                              }
                            }}
                          >
                            {comment.author}
                          </button>

                          <span className="comment-time">
                            {comment.time}
                          </span>
                        </div>

                        <div className="comment-text">
                          {comment.text}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`comment-like ${
                          comment._liked ? "liked" : ""
                        }`}
                        onClick={() =>
                          toggleCommentLike(post.id, comment.id)
                        }
                        aria-label="Me gusta el comentario"
                        aria-pressed={Boolean(comment._liked)}
                      >
                        <i
                          className={
                            comment._liked
                              ? "icon-heart"
                              : "icon-heart-empty"
                          }
                          aria-hidden="true"
                        />

                        <span className="like-count">
                          {comment.likes}
                        </span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* CAMPO PARA ESCRIBIR */}
              <div className="comment-form">
                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  value={commentTexts[post.id] || ""}
                  onChange={(event) =>
                    setCommentTexts((previous) => ({
                      ...previous,
                      [post.id]: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      crearComentario(post.id);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => crearComentario(post.id)}
                  aria-label="Enviar comentario"
                >
                  <i className="icon-paper-plane" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <Chatbot onOpenChange={onChatbotOpenChange} />
    </div>
  );
}
