import React, { useState } from 'react';
import './Juegos.css';
import vivi from '../assets/Vivi.png';
import JuegoBanda from './JuegoBanda';
import JuegoMate from './JuegoMate';
import JuegoCisco from './JuegoCisco';

/* =====================================================================
   JUEGOS DE LOS CLUBES · menú con un minijuego por club
   Para agregar un juego nuevo:
   1) crea su componente (ej. JuegoAjedrez.js) con la prop onVolver
   2) impórtalo aquí, ponlo en COMPONENTES y agrégalo a la lista JUEGOS
   ===================================================================== */

const COMPONENTES = {
  banda: JuegoBanda,
  mate: JuegoMate,
  cisco: JuegoCisco,    
};

const JUEGOS = [
  {
    id: 'banda',
    nombre: 'La banda',
    emoji: '🥁',
    descripcion: 'Lee la partitura y copia el ritmo con Vivi.',
    disponible: true,
  },
  {
    id: 'mate',
    nombre: 'Taller de factores',
    emoji: '🧮',
    descripcion: 'Rompe polinomios armando su factorización con Vivi.',
    disponible: true,
  },
  {
    id: 'cisco',
    nombre: 'La red',
    emoji: '🌐',
    descripcion: 'Arregla la red del colegio como en Packet Tracer.',
    disponible: true,
  },
  {
    id: 'pronto',
    nombre: 'Próximamente',
    emoji: '✨',
    descripcion: 'Más clubes, más minijuegos.',
    disponible: false,
  },
];

export default function Juegos({ onVolver }) {
  const [juegoActivo, setJuegoActivo] = useState(null);

  const JuegoActivo = juegoActivo ? COMPONENTES[juegoActivo] : null;
  if (JuegoActivo) {
    return <JuegoActivo onVolver={() => setJuegoActivo(null)} />;
  }

  return (
    <section className="jg-page">
      <div className="jg-wrap">
        <header className="jg-top">
          {typeof onVolver === 'function' && (
            <button type="button" className="jg-atras" onClick={onVolver}>
              ← Clubes
            </button>
          )}
          <div className="jg-top-texto">
            <p className="jg-eyebrow">Juega con Vivi</p>
            <h1 className="jg-titulo">Juegos de clubes</h1>
            <p className="jg-sub">Cada club tiene su propio minijuego.</p>
          </div>
          <img className="jg-vivi" src={vivi} alt="Vivi, la nutria" draggable="false" />
        </header>

        <div className="jg-lista">
          {JUEGOS.map((juego) => (
            <button
              key={juego.id}
              type="button"
              className={`jg-juego${juego.disponible ? '' : ' jg-juego-bloqueado'}`}
              disabled={!juego.disponible}
              onClick={() => setJuegoActivo(juego.id)}
            >
              <span className="jg-juego-emoji" aria-hidden="true">{juego.emoji}</span>
              <span className="jg-juego-info">
                <strong>{juego.nombre}</strong>
                <small>{juego.descripcion}</small>
              </span>
              <span className="jg-juego-accion">{juego.disponible ? 'Jugar' : 'Pronto'}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
