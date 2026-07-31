import React, { useState, useMemo, useRef, useEffect } from 'react';
import './Inicio.css';
import logito from '../assets/logito.png';

export default function Inicio({ posts: initialPosts = null }) {

  const [menuOpen, setMenuOpen] = useState(false);

  const FALLBACK_IMAGE = logito;
  const COMMENT_STORAGE_KEY = 'vestra_comment_likes_v1';

  const samplePosts = [
    {
      id: 1,
      image_url: logito,
      caption: 'La Banda CEDES Don Bosco se presentó ayer en Paraíso de Cartago!',
      likes: 124,
      comments: 12,
      created_at: '2026-07-28T18:30:00Z',
      author: { name: 'Luis Fernando', avatar: logito },
      comments_list: [
        { id: '1-c1', author: 'María Pérez', avatar: logito, time: '2h', text: 'Buen post — esto me ayudó mucho, gracias.', likes: 3 },
        { id: '1-c2', author: 'Carlos Ruiz', avatar: logito, time: '1d', text: 'Excelente contenido, muy claro.', likes: 1 },
        { id: '1-c3', author: 'Sofía', avatar: logito, time: '3d', text: 'Me encantó la presentación.', likes: 2 }
      ]
    },
    {
      id: 2,
      image_url: logito,
      caption: 'Feria cultural del colegio — fotos y actividades.',
      likes: 42,
      comments: 5,
      created_at: '2026-07-27T11:15:00Z',
      author: { name: 'María', avatar: logito },
      comments_list: [
        { id: '2-c1', author: 'Ana López', avatar: logito, time: '3h', text: 'Qué bien quedó todo :)', likes: 2 }
      ]
    },
    {
      id: 3,
      image_url: logito,
      caption: 'Taller de robótica: los estudiantes mostraron sus prototipos.',
      likes: 36,
      comments: 3,
      created_at: '2026-07-26T09:00:00Z',
      author: { name: 'Joaquín', avatar: logito },
      comments_list: [
        { id: '3-c1', author: 'Laura', avatar: logito, time: '5h', text: 'Increíble trabajo de los chicos.', likes: 0 }
      ]
    },
    {
      id: 4,
      image_url: logito,
      caption: 'Partido amistoso entre cursos — gran asistencia de la comunidad.',
      likes: 18,
      comments: 2,
      created_at: '2026-07-25T14:00:00Z',
      author: { name: 'Carla', avatar: logito },
      comments_list: [
        { id: '4-c1', author: 'Pedro', avatar: logito, time: '1d', text: 'Gran ambiente en el estadio.', likes: 0 }
      ]
    },
    {
      id: 5,
      image_url: logito,
      caption: 'Exposición de arte estudiantil: creatividad al máximo.',
      likes: 55,
      comments: 7,
      created_at: '2026-07-24T10:20:00Z',
      author: { name: 'Andrés', avatar: logito },
      comments_list: [
        { id: '5-c1', author: 'Sofía', avatar: logito, time: '4h', text: 'Maravillosas obras!', likes: 5 }
      ]
    }
  ];

  const [posts] = useState(initialPosts ?? samplePosts);
  const [localPosts, setLocalPosts] = useState(
    posts.map(p => ({ ...p, comments_list: (p.comments_list || []).map(c => ({ ...c })) }))
  );

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Estado para controlar qué posts tienen comentarios expandidos
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: true/false }

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(id);
    }
  }, [searchOpen]);

  // Cargar estado guardado de likes de comentarios desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMENT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw); // { [commentId]: { liked: bool, count: number } }
      if (!saved || typeof saved !== 'object') return;

      setLocalPosts(prev =>
        prev.map(post => {
          const comments = (post.comments_list || []).map(c => {
            const s = saved[c.id];
            if (s && typeof s === 'object') {
              return { ...c, likes: typeof s.count === 'number' ? s.count : c.likes, _liked: !!s.liked };
            }
            return c;
          });
          return { ...post, comments_list: comments };
        })
      );
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localPosts;
    return localPosts.filter(post =>
      (post.caption || '').toLowerCase().includes(q) ||
      (post.author?.name || '').toLowerCase().includes(q)
    );
  }, [query, localPosts]);

  function toggleLike(id) {
    setLocalPosts(prev =>
      prev.map(post => {
        if (post.id !== id) return post;
        const liked = !!post._liked;
        return {
          ...post,
          _liked: !liked,
          likes: liked ? post.likes - 1 : post.likes + 1
        };
      })
    );
  }

  function handleImgError(e) {
    if (!e.currentTarget.dataset.fallbackApplied) {
      e.currentTarget.src = FALLBACK_IMAGE;
      e.currentTarget.dataset.fallbackApplied = '1';
    }
  }

  // Helpers para persistencia de likes de comentarios
  function readCommentStore() {
    try {
      return JSON.parse(localStorage.getItem(COMMENT_STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }
  function writeCommentStore(store) {
    try {
      localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      // ignore
    }
  }

  function toggleCommentLike(postId, commentId) {
    setLocalPosts(prev => {
      const next = prev.map(post => {
        if (post.id !== postId) return post;
        const comments = (post.comments_list || []).map(c => {
          if (c.id !== commentId) return c;
          const liked = !!c._liked;
          const nextCount = liked ? Math.max((c.likes || 0) - 1, 0) : (Number(c.likes || 0) + 1);
          return { ...c, _liked: !liked, likes: nextCount };
        });
        return { ...post, comments_list: comments };
      });

      // actualizar almacenamiento
      try {
        const store = readCommentStore();
        // actualizar sólo los comentarios presentes
        next.forEach(p => {
          if (!p.comments_list) return;
          p.comments_list.forEach(c => {
            store[c.id] = { liked: !!c._liked, count: Number(c.likes || 0) };
          });
        });
        writeCommentStore(store);
      } catch (e) {
        // ignore
      }

      return next;
    });
  }

  // Persistir estado de comentarios cuando cambie localPosts
  useEffect(() => {
    try {
      const store = readCommentStore();
      localPosts.forEach(p => {
        (p.comments_list || []).forEach(c => {
          store[c.id] = { liked: !!c._liked, count: Number(c.likes || 0) };
        });
      });
      writeCommentStore(store);
    } catch (e) {
      // ignore
    }
  }, [localPosts]);

  // Toggle expandir/contraer comentarios por post
  function toggleExpandComments(postId) {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  }

  return (
    <div className="cedes-root">

      <div className="cedes-main">
        <header className="topbar">

  <button
    className="hamburger-btn"
    onClick={() => setMenuOpen(!menuOpen)}
    aria-label="Abrir menú"
  >
    ☰
  </button>

  {menuOpen && (
    <div className="hamburger-menu">
      <button onClick={() => setMenuOpen(false)}>🏠 Inicio</button>
      <button onClick={() => setMenuOpen(false)}>👤 Perfil</button>
      <button onClick={() => setMenuOpen(false)}>📢 Publicaciones</button>
      <button onClick={() => setMenuOpen(false)}>⚙️ Configuración</button>
      <button onClick={() => setMenuOpen(false)}>🚪 Cerrar sesión</button>
    </div>
  )}

  <div className="topbar-inner">
    <div className="topbar-space" />

    <button
      className="topbar-search-btn"
      aria-expanded={searchOpen}
      aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"}
      onClick={() => setSearchOpen(s => !s)}
      title={searchOpen ? "Cerrar" : "Buscar"}
    >
      <svg
        className="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21 21l-4.35-4.35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="11" cy="11" r="5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>

  </div>

  <div className={`search-panel ${searchOpen ? "open" : ""}`} aria-hidden={!searchOpen}>
    <div className="search-panel-inner">
      <input
        ref={searchInputRef}
        type="search"
        className="top-search-input"
        placeholder="Buscar por evento o autor..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="search-close" onClick={() => setSearchOpen(false)}>✕</button>
    </div>
  </div>

</header>

{/* Hero */}
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

  {filtered.map(post => (
    <article key={post.id} className="cedes-card">

      <div className="card-header">
        <div className="author">
          <img
            className="author-avatar"
            src={post.author?.avatar || FALLBACK_IMAGE}
            alt={post.author?.name}
            onError={handleImgError}
          />
          <div className="author-name">{post.author?.name}</div>
        </div>

        <div className="post-time">
          {new Date(post.created_at).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      <div className="card-image">
        <img src={post.image_url || FALLBACK_IMAGE} alt={post.caption} onError={handleImgError} />
      </div>

      <div className="card-body">
        <p className="card-caption">{post.caption}</p>

        <div className="card-actions">
          <div className="actions-left">
            <button className="comment-btn" title="Comentar">💬</button>

            <button
              className="like-btn"
              onClick={() => toggleLike(post.id)}
              title="Me gusta"
            >
              {post._liked ? "💙" : "🤍"}
            </button>

            <span className="likes-count">{post.likes}</span>
          </div>
        </div>

        <div className="card-footer">
          {/* Mostrar solo 2 comentarios por defecto; permitir expandir */}
          {(() => {
            const comments = post.comments_list || [];
            const isExpanded = !!expandedComments[post.id];
            const visibleComments = isExpanded ? comments : comments.slice(0, 2);
            return (
              <>
                {visibleComments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <img
                      className="comment-avatar"
                      src={comment.avatar || logito}
                      alt={comment.author}
                      onError={handleImgError}
                    />
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-author">{comment.author}</span>
                        <span className="comment-time">{comment.time}</span>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                    </div>

                    <button
                      className={`comment-like ${comment._liked ? 'liked' : ''}`}
                      aria-pressed={comment._liked ? 'true' : 'false'}
                      onClick={() => toggleCommentLike(post.id, comment.id)}
                      title="Me gusta"
                    >
                      <svg className="icon-heart" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path d="M12 21s-7-4.35-9.5-7.07C-0.64 9.85 4.1 4 8 6.6 9.86 7.96 12 10 12 10s2.14-2.04 4-3.4C19.9 4 24.64 9.85 21.5 13.93 19 16.65 12 21 12 21z" fill="currentColor"/>
                      </svg>
                      <span className="like-count">{comment.likes}</span>
                    </button>
                  </div>
                ))}

                {/* Mostrar control "Ver más / Ver menos" si hay más de 2 comentarios */}
                { (post.comments_list || []).length > 2 && (
                  <div style={{ marginTop: 6 }}>
                    <button
                      className="comment-toggle"
                      onClick={() => toggleExpandComments(post.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--blue)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {isExpanded ? 'Ver menos' : `Ver ${ (post.comments_list.length - 2) } más`}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>

      </div>
    </article>
  ))}

  {filtered.length === 0 && (
    <div className="inicio-empty">No se encontraron publicaciones.</div>
  )}

</main>

<nav className="cedes-bottomnav" aria-label="Menú">
  <button aria-label="Inicio" className="nav-btn">🏠</button>
  <button aria-label="Mensajes" className="nav-btn">💬</button>
  <button aria-label="Crear" className="nav-btn add">＋</button>
  <button aria-label="Ajustes" className="nav-btn">⚙️</button>
  <button aria-label="Perfil" className="nav-btn">👤</button>
</nav>

      </div>
    </div>
  );
}