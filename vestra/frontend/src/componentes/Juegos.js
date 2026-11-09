import React, { useState } from 'react';
import './Juegos.css';
import vivi from '../assets/vivi_gamer.png';
import JuegoBanda from './JuegoBanda';
import JuegoMate from './JuegoMate';
import JuegoCisco from './JuegoCisco';
import JuegoIdiomas from './JuegoIdiomas';
import JuegoF1 from './JuegoF1';
import JuegoFutbol from './JuegoFutbol';


const COMPONENTES = {
  banda: JuegoBanda,
  mate: JuegoMate,
  cisco: JuegoCisco,
  idiomas: JuegoIdiomas,
  f1: JuegoF1,
  futbol: JuegoFutbol,
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
    id: 'idiomas',
    nombre: 'Vivi políglota',
    emoji: '🗣️',
    descripcion: '6 niveles de inglés y 6 de portugués: parejas, burbujas, café, frases y charlas.',
    disponible: true,
  },
  {
    id: 'f1',
    nombre: 'F1 in schools',
    emoji: '🏎️',
    descripcion: 'Diseña tu auto de CO₂, sal con reflejos y abre el DRS.',
    disponible: true,
  },
  {
    id: 'futbol',
    nombre: 'Tiro al arco',
    emoji: '⚽',
    descripcion: 'Tira penaltis, rodea el muro y ataja con Vivi.',
    disponible: true,
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
