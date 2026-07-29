import React, { useEffect, useState } from 'react';
import './Inicio.css';

/**
 * Inicio (Feed) component
 * - Fetches posts from a backend endpoint and displays them in a responsive grid like Instagram
 * - Props:
 *    - apiEndpoint: string (default: '/api/posts')
 *    - authToken: optional string (for Bearer auth)
 */
export default function Inicio({ apiEndpoint = '/api/posts', authToken = null }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      setLoading(true);
      setError(null);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const res = await fetch(apiEndpoint, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Expect data to be an array of posts. Defensive checks below.
        if (!Array.isArray(data)) {
          throw new Error('Respuesta inválida del servidor: se esperaba un arreglo de posts');
        }

        if (mounted) setPosts(data);
      } catch (err) {
        if (mounted) setError(err.message || 'Error al cargar posts');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPosts();

    return () => {
      mounted = false;
    };
  }, [apiEndpoint, authToken]);

  return (
    <div className="inicio-root">
      <header className="inicio-header">
        <h2>Inicio</h2>
      </header>

      {loading && (
        <div className="inicio-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="post-card skeleton">
              <div className="image-placeholder" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="inicio-error">{error}</div>}

      {!loading && !error && (
        <div className="inicio-grid">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-media">
                {post.image_url ? (
                  /* eslint-disable-next-line jsx-a11y/img-redundant-alt */
                  <img src={post.image_url} alt={post.caption ? post.caption : 'Imagen del post'} />
                ) : (
                  <div className="image-placeholder">Sin imagen</div>
                )}
              </div>

              <div className="post-info">
                <div className="post-meta">
                  <div className="author">
                    {post.author?.avatar ? (
                      <img className="avatar" src={post.author.avatar} alt={`${post.author.name} avatar`} />
                    ) : (
                      <div className="avatar avatar-placeholder">{post.author?.name ? post.author.name[0] : '?'}</div>
                    )}
                    <div className="author-name">{post.author?.name ?? 'Usuario'}</div>
                  </div>

                  <div className="post-actions">
                    <button className="like-btn">❤ {post.likes ?? 0}</button>
                  </div>
                </div>

                {post.caption && <div className="post-caption">{post.caption}</div>}
                {post.created_at && <div className="post-time">{new Date(post.created_at).toLocaleString()}</div>}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="inicio-empty">No hay publicaciones para mostrar.</div>
      )}
    </div>
  );
}
