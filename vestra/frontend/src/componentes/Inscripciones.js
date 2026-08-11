import React, { useEffect, useMemo, useState } from 'react';
import './Inscripciones.css';
import logito from '../assets/logito.png';

export default function Inscripciones({ onAbrirClub }) {

  const [query, setQuery] = useState('');
  const [clubes, setClubes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // =========================
  // CARGAR CLUBES
  // =========================

  useEffect(() => {

    const cargarClubes = async () => {

      try {

        setCargando(true);
        setError('');

        const respuesta = await fetch(
          'http://localhost/vestra/backend/api/club/listar.php',
          {
            method: 'GET',
            credentials: 'include'
          }
        );

        console.log(
          'Status clubes:',
          respuesta.status
        );

        const texto = await respuesta.text();

        console.log(
          'Respuesta clubes:',
          texto
        );

        let resultado;

        try {
          resultado = JSON.parse(texto);
        } catch (error) {

          console.error(
            'La respuesta de clubes no es JSON:',
            texto
          );

          setError(
            'El servidor devolvió una respuesta inválida.'
          );

          return;
        }

        console.log(
          'Clubes recibidos:',
          resultado
        );

        // Tu PHP devuelve directamente un array
        if (Array.isArray(resultado)) {

          setClubes(resultado);

        } else {

          console.error(
            'Formato inesperado:',
            resultado
          );

          setError(
            'No se pudieron cargar los clubes.'
          );
        }

      } catch (error) {

        console.error(
          'Error cargando clubes:',
          error
        );

        setError(
          'No se pudieron cargar los clubes.'
        );

      } finally {

        setCargando(false);
      }
    };

    cargarClubes();

  }, []);

  // =========================
  // FILTRAR CLUBES
  // =========================

  const filtrados = useMemo(() => {

    const q = query
      .trim()
      .toLowerCase();

    if (!q) {
      return clubes;
    }

    return clubes.filter((club) =>
      club.Nombre
        ?.toLowerCase()
        .includes(q)
    );

  }, [query, clubes]);

  // =========================
  // ABRIR CLUB
  // =========================

  const handleAbrirClub = (club) => {

    if (typeof onAbrirClub === 'function') {

      onAbrirClub(club);
      return;
    }

    console.log(
      'Club seleccionado:',
      club
    );
  };

  // =========================
  // IMAGEN DEL CLUB
  // =========================

  const obtenerImagenClub = (club) => {

    if (!club.Foto_url) {
      return logito;
    }

    // Si la BD guarda solamente el nombre
    // del archivo
    return `http://localhost/vestra/uploads/clubes/${club.Foto_url}`;
  };

  // =========================
  // RETURN
  // =========================

  return (

    <section className="insc-root">

      {/* =========================
          HEADER
      ========================= */}

      <header className="insc-top">

        <h1 className="insc-title">
          INSCRIPCIONES
        </h1>

        <input
          className="insc-search"
          type="search"
          placeholder="Buscar club..."
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
        />

      </header>

      {/* =========================
          CONTENIDO
      ========================= */}

      <main className="insc-feed">

        {/* CARGANDO */}

        {cargando && (
          <p className="insc-empty">
            Cargando clubes...
          </p>
        )}

        {/* ERROR */}

        {!cargando && error && (
          <p className="insc-empty">
            {error}
          </p>
        )}

        {/* CLUBES */}

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

                <button
                  type="button"
                  className="insc-btn"
                  onClick={() =>
                    handleAbrirClub(club)
                  }
                >
                  Ir al club
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