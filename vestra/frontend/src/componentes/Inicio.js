import React, { useState, useMemo, useRef, useEffect } from 'react';
import './Inicio.css';
import logito from '../assets/logito.png';

export default function Inicio({ posts: initialPosts = null }) {

  const [menuOpen, setMenuOpen] = useState(false);

  const FALLBACK_IMAGE = logito;

  const samplePosts = [
    {
      id: 1,
      image_url: logito,
      caption: 'La Banda CEDES Don Bosco se presentó ayer en Paraíso de Cartago!',
      likes: 124,
      comments: 12,
      created_at: '2026-07-28T18:30:00Z',
      author: {
        name: 'Luis Fernando',
        avatar: logito
      }
    },
    {
      id: 2,
      image_url: logito,
      caption: 'Feria cultural del colegio — fotos y actividades.',
      likes: 42,
      comments: 5,
      created_at: '2026-07-27T11:15:00Z',
      author: {
        name: 'María',
        avatar: logito
      }
    },
    {
      id: 3,
      image_url: logito,
      caption: 'Taller de robótica: los estudiantes mostraron sus prototipos.',
      likes: 36,
      comments: 3,
      created_at: '2026-07-26T09:00:00Z',
      author: {
        name: 'Joaquín',
        avatar: logito
      }
    },
    {
      id: 4,
      image_url: logito,
      caption: 'Partido amistoso entre cursos — gran asistencia de la comunidad.',
      likes: 18,
      comments: 2,
      created_at: '2026-07-25T14:00:00Z',
      author: {
        name: 'Carla',
        avatar: logito
      }
    },
    {
      id: 5,
      image_url: logito,
      caption: 'Exposición de arte estudiantil: creatividad al máximo.',
      likes: 55,
      comments: 7,
      created_at: '2026-07-24T10:20:00Z',
      author: {
        name: 'Andrés',
        avatar: logito
      }
    }
  ];

  const [posts] = useState(initialPosts ?? samplePosts);
  const [localPosts, setLocalPosts] = useState(
    posts.map(p => ({ ...p }))
  );

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 120);

      return () => clearTimeout(id);
    }
  }, [searchOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return localPosts;

    return localPosts.filter(post =>
      post.caption.toLowerCase().includes(q) ||
      post.author?.name.toLowerCase().includes(q)
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
      <button onClick={() => setMenuOpen(false)}>
        🏠 Inicio
      </button>

      <button onClick={() => setMenuOpen(false)}>
        👤 Perfil
      </button>

      <button onClick={() => setMenuOpen(false)}>
        📢 Publicaciones
      </button>

      <button onClick={() => setMenuOpen(false)}>
        ⚙️ Configuración
      </button>

      <button onClick={() => setMenuOpen(false)}>
        🚪 Cerrar sesión
      </button>
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
        <path
          d="M21 21l-4.35-4.35"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="11"
          cy="11"
          r="5"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

    </button>

  </div>

  <div
    className={`search-panel ${searchOpen ? "open" : ""}`}
    aria-hidden={!searchOpen}
  >

    <div className="search-panel-inner">
      <input
        ref={searchInputRef}
        type="search"
        className="top-search-input"
        placeholder="Buscar por evento o autor..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        className="search-close"
        onClick={() => setSearchOpen(false)}
      >
        ✕
      </button>

    </div>

  </div>

</header>

{/* Hero */}

<header className="cedes-hero">

  <div className="cedes-hero-inner">

    <h1 className="cedes-title">
      <span className="line1">LO </span>
      <span className="line2">ÚLTIMO EN </span>
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

      <div className="author-name">
        {post.author?.name}
      </div>
    </div>

    <div className="post-time">
      {new Date(post.created_at).toLocaleDateString("es-CR",{
        day:"numeric",
        month:"short",
        year:"numeric"
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

    <p className="card-caption">
      {post.caption}
    </p>

   <div className="card-actions">

  <div className="actions-left">

    <button className="comment-btn" title="Comentar">
      💬
    </button>

    <button
      className="like-btn"
      onClick={() => toggleLike(post.id)}
      title="Me gusta"
    >
      {post._liked ? "💙" : "🤍"}
    </button>

    <span className="likes-count">
      {post.likes}
    </span>

  </div>

</div>

    <div className="card-footer">

      <div className="comment-item">

        <img
          className="comment-avatar"
          src={logito}
          alt="María Pérez"
        />

        <div className="comment-body">

          <div className="comment-meta">

            <span className="comment-author">
              María Pérez
            </span>

            <span className="comment-time">
              Hace 2 h
            </span>

          </div>

          <div className="comment-text">
            Yo fui y me encantó, nos fue increíble.
          </div>

        </div>

      </div>

      <div className="comment-item">

        <img
          className="comment-avatar"
          src={logito}
          alt="María Pérez"
        />

        <div className="comment-body">

          <div className="comment-meta">

            <span className="comment-author">
              María Pérez
            </span>

            <span className="comment-time">
              Hace 1 h
            </span>

          </div>

          <div className="comment-text">
            Felicitaciones a todos los que participaron.
          </div>

        </div>

      </div>

    </div>

  </div>

</article>
  ))}

  {filtered.length === 0 && (
    <div className="inicio-empty">
      No se encontraron publicaciones.
    </div>
  )}

</main>

<nav className="cedes-bottomnav" aria-label="Menú">

  <button
    aria-label="Inicio"
    className="nav-btn"
  >
    🏠
  </button>

  <button
    aria-label="Mensajes"
    className="nav-btn"
  >
    💬
  </button>

  <button
    aria-label="Crear"
    className="nav-btn add"
  >
    ＋
  </button>

  <button
    aria-label="Ajustes"
    className="nav-btn"
  >
    ⚙️
  </button>

  <button
    aria-label="Perfil"
    className="nav-btn"
  >
    👤
  </button>

</nav>

      </div>
    </div>
  );
}