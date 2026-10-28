import { APP_BASE_URL, apiUrl } from '../config/api';
import React, { useEffect, useMemo, useState } from 'react';
import './Inscripciones.css';
import logito from '../assets/logito.png';

export default function Inscripciones({
  onAbrirClub,
  onVerMas,
  onAdministrar,
  onProbarAfinidad,
  puedeSolicitar = false,
  puedeAdministrar = false
}) {
  const [query, setQuery] = useState('');
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // CARGAR CLUBES
  useEffect(() => {
    const cargarClubes = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch(
          apiUrl("/club/listar.php"),
          {
            method: 'GET',
            credentials: 'include'
          }
        );

        const texto = await respuesta.text();
        console.log('Respuesta clubes:', texto);

        let resultado;

        try {
          resultado = JSON.parse(texto);
        } catch {
          setError('El servidor devolvió una respuesta inválida.');
          return;
        }

        if (!respuesta.ok) {
          setError('No se pudieron cargar los clubes.');
          return;
        }

        if (Array.isArray(resultado)) {
          setClubes(resultado);
        } else {
          console.error('Formato inesperado:', resultado);
          setError('No se pudieron cargar los clubes.');
        }
      } catch (error) {
        console.error('Error cargando clubes:', error);
        setError('No se pudieron cargar los clubes.');
      } finally {
        setCargando(false);
      }
    };

    cargarClubes();
  }, []);

  // FILTRAR CLUBES
  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return clubes;

    return clubes.filter((club) =>
      club.Nombre?.toLowerCase().includes(q)
    );
  }, [query, clubes]);

  // OBTENER IMAGEN
  const obtenerImagenClub = (club) => {
    if (!club.Foto_url) return logito;

    return `${APP_BASE_URL}/uploads/clubes/${club.Foto_url}`;
  };

  return (
    <section className="insc-root">
      <header className="insc-top">
        <h1 className="insc-title">INSCRIPCIONES</h1>

        {puedeAdministrar && (
          <button
            type="button"
            className="insc-admin-btn"
            onClick={onAdministrar}
          >
            Crear club
          </button>
        )}

        <input
          className="insc-search"
          type="search"
          placeholder="Buscar club..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>
      {puedeSolicitar && (
  <section className="insc-afinidad">
    <div className="insc-afinidad-texto">
      <span className="insc-afinidad-etiqueta">
        ENCONTRÁ TU LUGAR
      </span>

      <h2>¿No sabés a qué club ir?</h2>

      <p>
        Descubrí qué clubes van mejor con tus intereses
        con nuestro test de afinidad.
      </p>

      <button
        type="button"
        className="insc-afinidad-btn"
        onClick={onProbarAfinidad}
      >
        Probar
      </button>
    </div>

    <div className="insc-afinidad-decoracion" aria-hidden="true">
      
    </div>
  </section>
)}
      <main className="insc-feed">
        {cargando && (
          <p className="insc-empty">Cargando clubes...</p>
        )}

        {!cargando && error && (
          <p className="insc-empty">{error}</p>
        )}

        {!cargando &&
          !error &&
          filtrados.map((club) => (
            <article
              key={club.id_club}
              className="insc-card"
            >
              {/* IMAGEN */}
              <div className="insc-card-image">
                <img
                  src={obtenerImagenClub(club)}
                  alt={club.Nombre}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = logito;
                  }}
                />
              </div>

              {/* INFORMACIÓN */}
              <div className="insc-card-body">
                <h3 className="insc-card-title">
                  {club.Nombre}
                </h3>

                <p className="insc-card-desc">
                  Club estudiantil
                </p>

                {/* BOTÓN MÁS INFORMACIÓN */}
                <button
                  type="button"
                  className="insc-btn insc-btn-info"
                  onClick={() => {
                    if (typeof onVerMas === 'function') {
                      onVerMas(club);
                    } else {
                      console.warn(
                        'No se proporcionó la función onVerMas.'
                      );
                    }
                  }}
                >
                  Más información
                </button>
              </div>
            </article>
          ))}

        {/* SIN RESULTADOS */}
        {!cargando &&
          !error &&
          filtrados.length === 0 && (
            <p className="insc-empty">
              No hay clubes con ese criterio.
            </p>
          )}
      </main>
    </section>
  );
}
