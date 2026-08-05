import React, { useMemo, useState } from 'react';
import './Inscripciones.css';
import logito from '../assets/logito.png';

export default function Inscripciones({ onAbrirClub }) {
  const [query, setQuery] = useState('');

  const clubes = [
    {
      id: 'futbol',
      titulo: 'Inscripción para club de fútbol',
      descripcion: 'Entrenamientos lunes y miércoles. Abierto para todos los niveles.',
      horario: 'Lun/Mié - 3:00 p.m.',
      cupos: 12,
      imagen: logito,
    },
    {
      id: 'basket',
      titulo: 'Inscripción para club de baloncesto',
      descripcion: 'Prácticas técnicas y partidos amistosos entre cursos.',
      horario: 'Mar/Jue - 2:30 p.m.',
      cupos: 8,
      imagen: logito,
    },
    {
      id: 'musica',
      titulo: 'Inscripción para club de música',
      descripcion: 'Ensayos grupales y presentaciones culturales.',
      horario: 'Viernes - 1:30 p.m.',
      cupos: 10,
      imagen: logito,
    },
    {
      id: 'robotica',
      titulo: 'Inscripción para club de robótica',
      descripcion: 'Proyectos de programación y prototipado básico.',
      horario: 'Miércoles - 4:00 p.m.',
      cupos: 15,
      imagen: logito,
    },
  ];

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clubes;
    return clubes.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q)
    );
  }, [query]);

  const handleAbrirClub = (club) => {
    if (typeof onAbrirClub === 'function') {
      onAbrirClub(club);
      return;
    }
    alert(`Ir a pantalla del club: ${club.titulo}`);
  };

  return (
    <section className="insc-root">
      <header className="insc-top">
        <h1 className="insc-title">INSCRIPCIONES</h1>

        <input
          className="insc-search"
          type="search"
          placeholder="Buscar club..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <main className="insc-feed">
        {filtrados.map((club) => (
          <article key={club.id} className="insc-card">
            <div className="insc-card-image">
              <img src={club.imagen || logito} alt={club.titulo} />
            </div>

            <div className="insc-card-body">
              <h3 className="insc-card-title">{club.titulo}</h3>
              <p className="insc-card-desc">{club.descripcion}</p>

              <div className="insc-meta">
                <span>Horario: {club.horario}</span>
                <span>Cupos: {club.cupos}</span>
              </div>

              <button
                type="button"
                className="insc-btn"
                onClick={() => handleAbrirClub(club)}
              >
                Ir al club
              </button>
            </div>
          </article>
        ))}

        {filtrados.length === 0 && (
          <p className="insc-empty">No hay clubes con ese criterio.</p>
        )}
      </main>
    </section>
  );
}