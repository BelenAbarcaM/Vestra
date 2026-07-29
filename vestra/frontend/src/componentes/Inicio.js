import React, { useState, useMemo } from 'react';
import './Inicio.css';

export default function Inicio({ posts: initialPosts = null }) {
  const samplePosts = [
    {
      id: 1,
      image_url: 'https://via.placeholder.com/800x600.png?text=La+Banda+CEDES',
      caption: 'La Banda CEDES Don Bosco se presentó ayer en Paraíso de Cartago!',
      likes: 124,
      comments: 12,
      created_at: '2026-07-28T18:30:00Z',
      author: { name: 'Luis Fernando', avatar: 'https://via.placeholder.com/80x80.png?text=LF' },
    },
    {
      id: 2,
      image_url: 'https://via.placeholder.com/800x600.png?text=Evento',
      caption: 'Feria cultural del colegio — fotos y actividades.',
      likes: 42,
      comments: 5,
      created_at: '2026-07-27T11:15:00Z',
      author: { name: 'María', avatar: '' },
    },
    {
      id: 3,
      image_url: 'https://via.placeholder.com/800x600.png?text=Proyecto',
      caption: 'Taller de robótica: los estudiantes mostraron sus prototipos.',
      likes: 36,
      comments: 3,
      created_at: '2026-07-26T09:00:00Z',
      author: { name: 'Joaquín', avatar: 'https://via.placeholder.com/80x80.png?text=J' },
    },
    {
      id: 4,
      image_url: 'https://via.placeholder.com/800x600.png?text=Deporte',
      caption: 'Partido amistoso entre cursos — gran asistencia de la comunidad.',
      likes: 18,
      comments: 2,
      created_at: '2026-07-25T14:00:00Z',
      author: { name: 'Carla', avatar: '' },
    },
    {
      id: 5,
      image_url: 'https://via.placeholder.com/800x600.png?text=Arte',
      caption: 'Exposición de arte estudiantil: creatividad al máximo.',
      likes: 55,
      comments: 7,
      created_at: '2026-07-24T10:20:00Z',
      author: { name: 'Andrés', avatar: 'https://via.placeholder.com/80x80.png?text=A' },
    },
  ];

  const [posts] = useState(initialPosts ?? samplePosts);
  const [query, setQuery] = useState('');
  const [localPosts, setLocalPosts] = useState(posts.map(p => ({ ...p })));

  // Filter posts by query (author name or caption)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localPosts;
    return localPosts.filter(
      p =>
        (p.caption && p.caption.toLowerCase().includes(q)) ||
        (p.author?.name && p.author.name.toLowerCase().includes(q))
    );
  }, [query, localPosts]);

  function toggleLike(id) {
    setLocalPosts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const liked = !!p._liked;
        return { ...p, _liked: !liked, likes: liked ? p.likes - 1 : p.likes + 1 };
      })
    );
  }

  return (
    <div className="cedes-root">
      {/* Hero header with search */}
      <header className="cedes-hero">
        <div className="cedes-hero-inner">
          <h1 className="cedes-title">
            <span className="line1">LO </span>
            <span className="line2">ÚLTIMO EN </span>
            <span className="line3">CEDES</span>
          </h1>
          <div className="cedes-deco" />

          {/* Search bar */}
          <div className="cedes-search">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35" stroke="#0b6b8f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="11" r="5" stroke="#0b6b8f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="search"
              aria-label="Buscar posts"
              placeholder="Buscar por evento o autor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="cedes-feed">
        {filtered.map((post) => (
          <article key={post.id} className="cedes-card">
            <div className="card-header">
              <div className="author">
                {post.author?.avatar ? (
                  <img className="author-avatar" src={post.author.avatar} alt={`${post.author.name} avatar`} />
                ) : (
                  <div className="author-avatar placeholder">{post.author?.name?.[0] ?? '?'}</div>
                )}
                <div className="author-name">{post.author?.name ?? 'Usuario'}</div>
              </div>
              <div className="post-time">{new Date(post.created_at).toLocaleDateString()}</div>
            </div>

            <div className="card-image">
              {post.image_url ? (
                <img src={post.image_url} alt={post.caption ?? 'Imagen del post'} />
              ) : (
                <div className="image-placeholder">Sin imagen</div>
              )}
            </div>

            <div className="card-body">
              <p className="card-caption">{post.caption}</p>
              <div className="card-actions">
                <button className="comment-btn">Comentar…</button>
                <div className="likes">
                  <button className="like-btn" onClick={() => toggleLike(post.id)}>
                    {post._liked ? '💙' : '🤍'}
                  </button>
                  <span className="likes-count">{post.likes}</span>
                </div>
              </div>

              <div className="card-footer">
                <div className="small-note">Yo fui y me encantó, nos fue increíble</div>
                <div className="small-note">Felicitaciones a los que fueron</div>
              </div>
            </div>
          </article>
        ))}

        {filtered.length === 0 && <div className="inicio-empty">No se encontraron publicaciones.</div>}
      </main>

      {/* Bottom nav */}
      <nav className="cedes-bottomnav" aria-label="Menú">
        <button aria-label="Inicio" className="nav-btn">🏠</button>
        <button aria-label="Mensajes" className="nav-btn">💬</button>
        <button aria-label="Crear" className="nav-btn add">＋</button>
        <button aria-label="Ajustes" className="nav-btn">⚙️</button>
        <button aria-label="Perfil" className="nav-btn">👤</button>
      </nav>
    </div>
  );
}