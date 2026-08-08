import React, { useState, useMemo, useRef, useEffect } from "react";
import "./Inicio.css";
import "../App.css";
import "../fontello/css/fontello.css";
import logito from "../assets/logito.png";
import Chatbot from "./Chatbot";

export default function Inicio({ posts: initialPosts = null, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [expandedComments, setExpandedComments] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentBoxOpen, setCommentBoxOpen] = useState({});

  const searchInputRef = useRef(null);
  const FALLBACK_IMAGE = logito;
  const COMMENT_STORAGE_KEY = "vestra_comment_likes_v1";

  const samplePosts = [
    {
      id: 1,
      category: "Música",
      image_url: logito,
      caption:
        "La Banda CEDES Don Bosco se presentó ayer en Paraíso de Cartago. Fue una actividad llena de música, entusiasmo y participación de toda la comunidad estudiantil.",
      likes: 124,
      created_at: "2026-07-28T18:30:00Z",
      author: { name: "Luis Fernando", avatar: logito },
      comments_list: [
        {
          id: "1-c1",
          author: "María Pérez",
          avatar: logito,
          time: "2h",
          text: "Buen post — esto me ayudó mucho, gracias.",
          likes: 3,
        },
        {
          id: "1-c2",
          author: "Carlos Ruiz",
          avatar: logito,
          time: "1d",
          text: "Excelente contenido, muy claro.",
          likes: 1,
        },
        {
          id: "1-c3",
          author: "Sofía",
          avatar: logito,
          time: "3d",
          text: "Me encantó la presentación.",
          likes: 2,
        },
      ],
    },
    {
      id: 2,
      category: "Inscripciones abiertas",
      image_url: logito,
      caption:
        "Feria cultural del colegio — fotos, actividades e inscripciones abiertas para estudiantes que deseen participar.",
      likes: 42,
      created_at: "2026-07-27T11:15:00Z",
      author: { name: "María", avatar: logito },
      comments_list: [
        {
          id: "2-c1",
          author: "Ana López",
          avatar: logito,
          time: "3h",
          text: "Qué bien quedó todo :)",
          likes: 2,
        },
      ],
    },
    {
      id: 3,
      category: "Tecnología",
      image_url: logito,
      caption:
        "Taller de robótica: los estudiantes mostraron sus prototipos y explicaron el proceso que siguieron para construirlos durante las clases.",
      likes: 36,
      created_at: "2026-07-26T09:00:00Z",
      author: { name: "Joaquín", avatar: logito },
      comments_list: [
        {
          id: "3-c1",
          author: "Laura",
          avatar: logito,
          time: "5h",
          text: "Increíble trabajo de los chicos.",
          likes: 0,
        },
      ],
    },
  ];

  const [posts] = useState(initialPosts ?? samplePosts);
  const [localPosts, setLocalPosts] = useState(
    posts.map((post) => ({
      ...post,
      comments_list: (post.comments_list || []).map((comment) => ({
        ...comment,
      })),
    }))
  );

  useEffect(() => {
    if (!searchOpen) return;

    const id = setTimeout(() => searchInputRef.current?.focus(), 120);
    return () => clearTimeout(id);
  }, [searchOpen]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(COMMENT_STORAGE_KEY) || "{}"
      );

      setLocalPosts((previous) =>
        previous.map((post) => ({
          ...post,
          comments_list: (post.comments_list || []).map((comment) => {
            const savedComment = saved[comment.id];

            return savedComment
              ? {
                  ...comment,
                  likes: savedComment.count ?? comment.likes,
                  _liked: Boolean(savedComment.liked),
                }
              : comment;
          }),
        }))
      );
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const store = {};

      localPosts.forEach((post) => {
        (post.comments_list || []).forEach((comment) => {
          store[comment.id] = {
            liked: Boolean(comment._liked),
            count: Number(comment.likes || 0),
          };
        });
      });

      localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(store));
    } catch {}
  }, [localPosts]);

  const filtered = useMemo(() => {
    const normalize = (value = "") =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const words = normalize(query).split(/\s+/).filter(Boolean);

    return localPosts.filter((post) => {
      const belongsToCategory =
        selectedCategory === "Todas" ||
        post.category === selectedCategory;

      const text = normalize(
        `${post.caption || ""} ${post.author?.name || ""} ${
          post.category || ""
        } ${(post.comments_list || [])
          .map((comment) => comment.text)
          .join(" ")}`
      );

      return belongsToCategory && words.every((word) => text.includes(word));
    });
  }, [query, localPosts, selectedCategory]);

  function selectCategory(category) {
    if (category === 'Inscripciones abiertas') {
      setMenuOpen(false);
      if (typeof onNavigate === 'function') {
        onNavigate('inscripciones');
        return;
      }
    }

    setSelectedCategory(category);
    setMenuOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setSelectedCategory("Todas");
  }

  function toggleCommentInput(postId) {
    setCommentBoxOpen((previous) => ({
      ...previous,
      [postId]: !previous[postId],
    }));
  }

  function handleCommentDraftChange(postId, value) {
    setCommentDrafts((previous) => ({
      ...previous,
      [postId]: value,
    }));
  }

  function formatCommentTime(comment) {
    if (comment.created_at) {
      const diffSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(comment.created_at).getTime()) / 1000)
      );
      if (diffSeconds < 60) return "Ahora";
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
      if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
      return `${Math.floor(diffSeconds / 86400)}d`;
    }
    return comment.time || "Ahora";
  }

  function addComment(postId) {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;

    setLocalPosts((previous) =>
      previous.map((post) => {
        if (post.id !== postId) return post;

        const newComment = {
          id: `${postId}-c${Date.now()}`,
          author: "Tú",
          avatar: FALLBACK_IMAGE,
          created_at: new Date().toISOString(),
          text,
          likes: 0,
        };

        return {
          ...post,
          comments_list: [...(post.comments_list || []), newComment],
        };
      })
    );

    setCommentDrafts((previous) => ({
      ...previous,
      [postId]: "",
    }));
    setExpandedComments((previous) => ({
      ...previous,
      [postId]: true,
    }));
    setCommentBoxOpen((previous) => ({
      ...previous,
      [postId]: false,
    }));
  }

  function toggleLike(postId) {
    setLocalPosts((previous) =>
      previous.map((post) => {
        if (post.id !== postId) return post;

        const liked = Boolean(post._liked);

        return {
          ...post,
          _liked: !liked,
          likes: liked ? post.likes - 1 : post.likes + 1,
        };
      })
    );
  }

  function toggleCommentLike(postId, commentId) {
    setLocalPosts((previous) =>
      previous.map((post) => {
        if (post.id !== postId) return post;

        return {
          ...post,
          comments_list: post.comments_list.map((comment) => {
            if (comment.id !== commentId) return comment;

            const liked = Boolean(comment._liked);

            return {
              ...comment,
              _liked: !liked,
              likes: liked
                ? Math.max(Number(comment.likes || 0) - 1, 0)
                : Number(comment.likes || 0) + 1,
            };
          }),
        };
      })
    );
  }

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

  function handleImgError(event) {
    if (!event.currentTarget.dataset.fallbackApplied) {
      event.currentTarget.src = FALLBACK_IMAGE;
      event.currentTarget.dataset.fallbackApplied = "true";
    }
  }

  return (
    <div className="cedes-root">
      <div className="cedes-main">
        <header className="topbar">
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Abrir menú"
          >
            <i className="icon-menu" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="hamburger-menu">
              <button onClick={() => selectCategory("Todas")}>
                <i className="icon-home" aria-hidden="true" />
                Todas las publicaciones
              </button>
              <button onClick={() => selectCategory("Deporte")}>
                <i className="icon-football" aria-hidden="true" />
                Deporte
              </button>
              <button onClick={() => selectCategory("Música")}>
                <i className="icon-music" aria-hidden="true" />
                Música
              </button>
              <button onClick={() => selectCategory("Tecnología")}>
                <i className="icon-usb" aria-hidden="true" />
                Tecnología
              </button>
              <button onClick={() => selectCategory("Religión")}>
                <i className="icon-religious-christian" aria-hidden="true" />
                Religión
              </button>
              <button
                onClick={() => selectCategory("Inscripciones abiertas")}
              >
                <i className="icon-bell-alt" aria-hidden="true" />
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
                className="search-close"
                onClick={closeSearch}
                aria-label="Cerrar búsqueda"
              >
                <i className="icon-cancel" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <header className="cedes-hero">
          <div className="cedes-hero-inner">
            <h1 className="cedes-title">
              <span className="line1">LO </span>
              <span className="line2">ULTIMO EN </span>
              <span className="line3">CEDES</span>
            </h1>
            <div className="cedes-deco" />
          </div>
        </header>

        <main className="cedes-feed">
          {filtered.map((post) => {
            const comments = post.comments_list || [];
            const isExpanded = Boolean(expandedComments[post.id]);
            const visibleComments = isExpanded
              ? comments
              : comments.slice(0, 1);

            const maxCaptionLength = 105;
            const fullCaption = post.caption || "";
            const isCaptionLong = fullCaption.length > maxCaptionLength;
            const isCaptionExpanded = Boolean(expandedCaptions[post.id]);

            const visibleCaption =
              isCaptionLong && !isCaptionExpanded
                ? `${fullCaption.slice(0, maxCaptionLength).trim()}...`
                : fullCaption;

            return (
              <article key={post.id} className="cedes-card">
                <div className="card-header">
                  <div className="author">
                    <img
                      className="author-avatar"
                      src={post.author?.avatar || FALLBACK_IMAGE}
                      alt={post.author?.name || "Autor"}
                      onError={handleImgError}
                    />

                    <div className="author-name">
                      <span className="author-name-text">
                        {post.author?.name}
                      </span>
                      <span className="category-label">{post.category}</span>
                    </div>
                  </div>

                  <div className="post-time">
                    <i className="icon-calendar" aria-hidden="true" />
                    {new Date(post.created_at).toLocaleDateString("es-CR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>

                <div className="card-image">
                  <img
                    src={post.image_url || FALLBACK_IMAGE}
                    alt={post.caption}
                    onError={handleImgError}
                  />
                </div>

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

                  <div className="card-actions">
                    <div className="actions-left">
                      <button
                        type="button"
                        className="comment-btn"
                        title="Comentar"
                        onClick={() => toggleCommentInput(post.id)}
                      >
                        <i className="icon-comment" aria-hidden="true" />
                      </button>

                      <button
                        className="like-btn"
                        onClick={() => toggleLike(post.id)}
                        aria-pressed={Boolean(post._liked)}
                      >
                        <i
                          className={
                            post._liked ? "icon-heart" : "icon-heart-empty"
                          }
                          aria-hidden="true"
                        />
                      </button>

                      <span className="likes-count">{post.likes}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    {visibleComments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <img
                          className="comment-avatar"
                          src={comment.avatar || logito}
                          alt={comment.author}
                          onError={handleImgError}
                        />

                        <div className="comment-body">
                          <div className="comment-meta">
                            <span className="comment-author">
                              {comment.author}
                            </span>
                            <span className="comment-time">
                              {formatCommentTime(comment)}
                            </span>
                          </div>
                          <div className="comment-text">{comment.text}</div>
                        </div>

                        <button
                          className={`comment-like ${
                            comment._liked ? "liked" : ""
                          }`}
                          onClick={() =>
                            toggleCommentLike(post.id, comment.id)
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
                          <span className="like-count">{comment.likes}</span>
                        </button>
                      </div>
                    ))}

                    {commentBoxOpen[post.id] && (
                      <div className="comment-input-row">
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Escribe un comentario..."
                          value={commentDrafts[post.id] || ""}
                          onChange={(event) =>
                            handleCommentDraftChange(post.id, event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addComment(post.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="comment-send-btn"
                          onClick={() => addComment(post.id)}
                        >
                          Enviar
                        </button>
                      </div>
                    )}
                    {comments.length > 1 && (
                      <button
                        className="comment-toggle"
                        onClick={() => toggleExpandComments(post.id)}
                      >
                        {isExpanded
                          ? "Ver menos"
                          : `Ver ${comments.length - 1} más`}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="inicio-empty">
              <i className="icon-search" aria-hidden="true" />
              No se encontraron publicaciones.
            </div>
          )}
                  <nav className="cedes-bottomnav" aria-label="Menú principal">
          <button
            type="button"
            className="nav-btn"
            aria-label="Inicio"
            onClick={() => {
              if (typeof onNavigate === 'function') {
                onNavigate('inicio');
                return;
              }
              window.location.href = '/';
            }}
          >
            <i className="icon-home" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="nav-btn"
            aria-label="Chats"
            onClick={() => {
              if (typeof onNavigate === 'function') {
                onNavigate('chats');
              }
            }}
          >
            <i className="icon-comment" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="nav-btn"
            aria-label="Ideas"
            onClick={() => {
              if (typeof onNavigate === 'function') {
                onNavigate('ideas');
              }
            }}
          >
            <i className="icon-lightbulb" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="nav-btn"
            aria-label="Perfil"
            onClick={() => {
              if (typeof onNavigate === 'function') {
                onNavigate('perfil');
              }
            }}
          >
            <i className="icon-user" aria-hidden="true" />
          </button>
        </nav>
        </main>
      </div>
      <Chatbot />
    </div>
  );
}
