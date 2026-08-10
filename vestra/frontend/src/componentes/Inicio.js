import React, { useState, useMemo, useRef, useEffect } from "react";
import "./Inicio.css";
import "../App.css";
import "../fontello/css/fontello.css";
import logito from "../assets/logito.png";
import Chatbot from "./Chatbot";
import MenuNavEstudiante from "./Menu_nav_estudiante";

export default function Inicio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const [expandedComments, setExpandedComments] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});

  const [localPosts, setLocalPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentTexts, setCommentTexts] = useState({});

  const searchInputRef = useRef(null);

  const API_URL = "http://localhost/vestra/backend/api";
  const FALLBACK_IMAGE = logito;

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

      const data = await response.json();

      if (!data.success) {
        setError(
          data.mensaje ||
            "No se pudieron cargar las publicaciones."
        );
        return;
      }

      const publicaciones = await Promise.all(
        data.publicaciones.map(async (post) => {
          const comentarios = await cargarComentarios(post.id);

          return {
            id: Number(post.id),
            caption: post.texto,

            image_url: post.imagen
              ? `http://localhost/vestra/${post.imagen}`
              : null,

            likes: Number(post.likes || 0),
            _liked: Number(post.liked) === 1,

            created_at: post.fecha,

            category: post.club,

            author: {
              name: post.usuario,
              avatar: post.foto_usuario
                ? `http://localhost/vestra/${post.foto_usuario}`
                : null,
            },

            comments_list: comentarios,
          };
        })
      );

      setLocalPosts(publicaciones);
    } catch (error) {
      console.error(
        "Error cargando publicaciones:",
        error
      );

      setError(
        "No se pudieron cargar las publicaciones."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPublicaciones();
  }, []);

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

      const data = await response.json();

      console.log(
        `COMENTARIOS PUBLICACIÓN ${idPublicacion}:`,
        data
      );

      if (!Array.isArray(data)) {
        console.error(
          "Respuesta inesperada:",
          data
        );
        return [];
      }

      return data.map((comment) => ({
        id: Number(comment.id_comentario),
        text: comment.texto,
        author: comment.usuario,

        avatar: comment.foto_usuario
          ? `http://localhost/vestra/${comment.foto_usuario}`
          : null,

        time: comment.fecha,

        likes: Number(comment.likes || 0),

        _liked: Number(comment.liked) === 1,
      }));
    } catch (error) {
      console.error(
        `Error cargando comentarios de publicación ${idPublicacion}:`,
        error
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
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const words = normalize(query)
      .split(/\s+/)
      .filter(Boolean);

    return localPosts.filter((post) => {
      const belongsToCategory =
        selectedCategory === "Todas" ||
        post.category === selectedCategory;

      const text = normalize(
        `${post.caption || ""} ${
          post.author?.name || ""
        } ${post.category || ""} ${(post.comments_list || [])
          .map((comment) => comment.text)
          .join(" ")}`
      );

      return (
        belongsToCategory &&
        words.every((word) =>
          text.includes(word)
        )
      );
    });
  }, [
    query,
    localPosts,
    selectedCategory,
  ]);

  function selectCategory(category) {
    setSelectedCategory(category);
    setMenuOpen(false);
  }

  // =========================================================
  // CREAR COMENTARIO
  // =========================================================

  const crearComentario = async (postId) => {
    const texto = (
      commentTexts[postId] || ""
    ).trim();

    if (!texto) {
      return;
    }

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
            texto: texto,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "RESPUESTA CREAR COMENTARIO:",
        data
      );

      if (!data.success) {
        console.error(data.mensaje);
        return;
      }

      // Limpiar input
      setCommentTexts((previous) => ({
        ...previous,
        [postId]: "",
      }));

      // Volver a cargar comentarios
      const comentariosActualizados =
        await cargarComentarios(postId);

      setLocalPosts((previous) =>
        previous.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,
            comments_list:
              comentariosActualizados,
          };
        })
      );
    } catch (error) {
      console.error(
        "Error creando comentario:",
        error
      );
    }
  };

  // =========================================================
  // LIKE PUBLICACIÓN
  // =========================================================

  const toggleLike = async (postId) => {
    try {
      const response = await fetch(
        `${API_URL}/likes/toggle.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            id_publicacion: postId,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "RESPUESTA LIKE:",
        data
      );

      if (!data.success) {
        console.error(data.mensaje);
        return;
      }

      setLocalPosts((previous) =>
        previous.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,

            _liked: data.liked,

            likes: data.liked
              ? post.likes + 1
              : Math.max(
                  post.likes - 1,
                  0
                ),
          };
        })
      );
    } catch (error) {
      console.error(
        "Error dando like:",
        error
      );
    }
  };

  // =========================================================
  // LIKE COMENTARIO
  // =========================================================

  const toggleCommentLike = async (
    postId,
    commentId
  ) => {
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

      const data = await response.json();

      console.log(
        "RESPUESTA LIKE COMENTARIO:",
        data
      );

      if (!data.success) {
        console.error(data.mensaje);
        return;
      }

      setLocalPosts((previous) =>
        previous.map((post) => {
          if (post.id !== postId) {
            return post;
          }

          return {
            ...post,

            comments_list:
              post.comments_list.map(
                (comment) => {
                  if (
                    comment.id !== commentId
                  ) {
                    return comment;
                  }

                  return {
                    ...comment,

                    _liked: data.liked,

                    likes: data.liked
                      ? Number(
                          comment.likes || 0
                        ) + 1
                      : Math.max(
                          Number(
                            comment.likes || 0
                          ) - 1,
                          0
                        ),
                  };
                }
              ),
          };
        })
      );
    } catch (error) {
      console.error(
        "Error dando like al comentario:",
        error
      );
    }
  };

  // =========================================================
  // MODAL COMENTARIOS
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
  // IMÁGENES
  // =========================================================

  function handleImgError(event) {
    if (
      !event.currentTarget.dataset
        .fallbackApplied
    ) {
      event.currentTarget.src =
        FALLBACK_IMAGE;

      event.currentTarget.dataset.fallbackApplied =
        "true";
    }
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="inicio-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="topbar">

        <button
          className="hamburger-btn"
          onClick={() =>
            setMenuOpen(
              (open) => !open
            )
          }
          aria-label="Abrir menú"
        >
          <i
            className="icon-menu"
            aria-hidden="true"
          />
        </button>

        {menuOpen && (
          <div className="hamburger-menu">

            <button
              onClick={() =>
                selectCategory("Todas")
              }
            >
              <i
                className="icon-home"
                aria-hidden="true"
              />
              Todas las publicaciones
            </button>

            <button
              onClick={() =>
                selectCategory("Deporte")
              }
            >
              <i
                className="icon-football"
                aria-hidden="true"
              />
              Deporte
            </button>

            <button
              onClick={() =>
                selectCategory("Música")
              }
            >
              <i
                className="icon-music"
                aria-hidden="true"
              />
              Música
            </button>

            <button
              onClick={() =>
                selectCategory("Tecnología")
              }
            >
              <i
                className="icon-usb"
                aria-hidden="true"
              />
              Tecnología
            </button>

            <button
              onClick={() =>
                selectCategory("Religión")
              }
            >
              <i
                className="icon-religious-christian"
                aria-hidden="true"
              />
              Religión
            </button>

            <button
              onClick={() =>
                selectCategory(
                  "Inscripciones abiertas"
                )
              }
            >
              <i
                className="icon-bell-alt"
                aria-hidden="true"
              />
              Inscripciones abiertas
            </button>

          </div>
        )}

        <div className="topbar-inner">

          <div className="topbar-space" />

          <button
            className="topbar-search-btn"
            aria-expanded={searchOpen}
            aria-label="Buscar"
            onClick={() =>
              setSearchOpen(
                (open) => !open
              )
            }
          >
            <i
              className="icon-search"
              aria-hidden="true"
            />
          </button>

        </div>

        <div
          className={`search-panel ${
            searchOpen ? "open" : ""
          }`}
        >
          <div className="search-panel-inner">

            <input
              ref={searchInputRef}
              type="text"
              className="top-search-input"
              placeholder="Buscar palabras..."
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
            />

            <button
              className="search-close"
              onClick={() =>
                setSearchOpen(false)
              }
              aria-label="Cerrar búsqueda"
            >
              <i
                className="icon-cancel"
                aria-hidden="true"
              />
            </button>

          </div>
        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <header className="cedes-hero">

        <div className="cedes-hero-inner">

          <h1 className="cedes-title">

            <span className="line1">
              LO
            </span>

            <span className="line2">
              ULTIMO EN
            </span>

            <span className="line3">
              CEDES
            </span>

          </h1>

          <div className="cedes-deco" />

        </div>

      </header>

      {/* =====================================================
          FEED
      ===================================================== */}

      <main className="cedes-feed">

        {loading && (
          <div className="feed-message">
            Cargando publicaciones...
          </div>
        )}

        {error && !loading && (
          <div className="feed-message error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filtered.map((post) => {

            const maxCaptionLength = 105;

            const fullCaption =
              post.caption || "";

            const isCaptionLong =
              fullCaption.length >
              maxCaptionLength;

            const isCaptionExpanded =
              Boolean(
                expandedCaptions[
                  post.id
                ]
              );

            const visibleCaption =
              isCaptionLong &&
              !isCaptionExpanded
                ? `${fullCaption
                    .slice(
                      0,
                      maxCaptionLength
                    )
                    .trim()}...`
                : fullCaption;

            return (
              <article
                key={post.id}
                className="cedes-card"
              >

                {/* HEADER DE PUBLICACIÓN */}

                <div className="card-header">

                  <div className="author">

                    <img
                      className="author-avatar"
                      src={
                        post.author?.avatar ||
                        FALLBACK_IMAGE
                      }
                      alt={
                        post.author?.name ||
                        "Autor"
                      }
                      onError={
                        handleImgError
                      }
                    />

                    <div className="author-name">

                      <span className="author-name-text">
                        {post.author?.name}
                      </span>

                      <span className="category-label">
                        {post.category}
                      </span>

                    </div>

                  </div>

                  <div className="post-time">

                    <i
                      className="icon-calendar"
                      aria-hidden="true"
                    />

                    {new Date(
                      post.created_at
                    ).toLocaleDateString(
                      "es-CR",
                      {
                        day: "numeric",
                        month: "short",
                      }
                    )}

                  </div>

                </div>

                {/* IMAGEN */}

                <div className="card-image">

                  <img
                    src={
                      post.image_url ||
                      FALLBACK_IMAGE
                    }
                    alt={post.caption}
                    onError={
                      handleImgError
                    }
                  />

                </div>

                {/* CUERPO */}

                <div className="card-body">

                  {/* TEXTO */}

                  <div className="card-caption">

                    {visibleCaption}

                    {isCaptionLong && (
                      <button
                        type="button"
                        className="caption-toggle"
                        onClick={() =>
                          toggleExpandCaption(
                            post.id
                          )
                        }
                      >
                        {isCaptionExpanded
                          ? "Ver menos"
                          : "Ver más"}
                      </button>
                    )}

                  </div>

                  {/* ACCIONES */}

                  <div className="card-actions">

                    <div className="actions-left">

                      {/* COMENTARIOS */}

                      <button
                        className="comment-btn"
                        title="Ver comentarios"
                        onClick={() =>
                          toggleExpandComments(
                            post.id
                          )
                        }
                      >
                        <i
                          className="icon-comment"
                          aria-hidden="true"
                        />
                      </button>

                      {/* LIKES */}

                      <button
                        className="like-btn"
                        onClick={() =>
                          toggleLike(
                            post.id
                          )
                        }
                        aria-pressed={Boolean(
                          post._liked
                        )}
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

                      <span className="likes-count">
                        {post.likes}
                      </span>

                    </div>

                  </div>

                </div>

              </article>
            );
          })}

        {!loading &&
          !error &&
          filtered.length === 0 && (
            <div className="feed-message">
              No encontramos publicaciones.
            </div>
          )}

      </main>

      {/* =====================================================
          MODAL DE COMENTARIOS
      ===================================================== */}

      {Object.entries(
        expandedComments
      ).map(([postId, abierto]) => {

        if (!abierto) return null;

        const post = localPosts.find(
          (p) =>
            p.id === Number(postId)
        );

        if (!post) return null;

        return (
          <div
            key={post.id}
            className="comments-modal-overlay"
            onClick={() =>
              cerrarComentarios(
                post.id
              )
            }
          >

            <div
              className="comments-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER MODAL */}

              <div className="comments-modal-header">

                <h2>
                  Comentarios
                </h2>

                <button
                  className="comments-close"
                  onClick={() =>
                    cerrarComentarios(
                      post.id
                    )
                  }
                  aria-label="Cerrar comentarios"
                >
                  <i
                    className="icon-cancel"
                    aria-hidden="true"
                  />
                </button>

              </div>

              {/* LISTA */}

              <div className="comments-modal-list">

                {post.comments_list
                  .length === 0 ? (

                  <p className="no-comments">
                    Todavía no hay
                    comentarios.
                  </p>

                ) : (

                  post.comments_list.map(
                    (comment) => (

                      <div
                        key={comment.id}
                        className="comment-item"
                      >

                        <img
                          className="comment-avatar"
                          src={
                            comment.avatar ||
                            logito
                          }
                          alt={
                            comment.author
                          }
                          onError={
                            handleImgError
                          }
                        />

                        <div className="comment-body">

                          <div className="comment-meta">

                            <span className="comment-author">
                              {comment.author}
                            </span>

                            <span className="comment-time">
                              {comment.time}
                            </span>

                          </div>

                          <div className="comment-text">
                            {comment.text}
                          </div>

                        </div>

                        <button
                          className={`comment-like ${
                            comment._liked
                              ? "liked"
                              : ""
                          }`}
                          onClick={() =>
                            toggleCommentLike(
                              post.id,
                              comment.id
                            )
                          }
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

                    )
                  )

                )}

              </div>

              {/* CAMPO PARA ESCRIBIR */}

              <div className="comment-form">

                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  value={
                    commentTexts[
                      post.id
                    ] || ""
                  }
                  onChange={(e) =>
                    setCommentTexts(
                      (previous) => ({
                        ...previous,
                        [post.id]:
                          e.target.value,
                      })
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      crearComentario(
                        post.id
                      );
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    crearComentario(
                      post.id
                    )
                  }
                  aria-label="Enviar comentario"
                >
                  <i
                    className="icon-paper-plane"
                    aria-hidden="true"
                  />
                </button>

              </div>

            </div>

          </div>
        );
      })}


      <Chatbot />

    </div>
  );
}