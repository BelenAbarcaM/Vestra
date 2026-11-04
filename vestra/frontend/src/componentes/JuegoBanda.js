import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './JuegoBanda.css';
import vivi from '../assets/Vivi.png';
import { NIVELES, TIEMPOS_POR_COMPAS, parsearNivel, evaluarToques } from './JuegoBanda_logica';

/* =====================================================================
   JUEGO DE LA BANDA · copia el ritmo de la partitura
   - Todo el juego corre en el teléfono: no usa backend ni base de datos.
   - Las estrellas de cada nivel se guardan en el dispositivo (localStorage).
   - La calificación perdona un retraso constante (el del sonido del celular),
     así que normalmente no hace falta tocar nada. Si aun así quieres corregir
     la latencia a mano, cambia AJUSTE_LATENCIA_MS (ej. 60).
   ===================================================================== */

const TIEMPOS_PREVIOS = 4; // "1, 2, 3, 4" antes de empezar
const AJUSTE_LATENCIA_MS = 0;
const CLAVE_ESTRELLAS = 'juego_banda_estrellas';

// Medidas del dibujo de la partitura (unidades del SVG)
const U = 40; // ancho de un tiempo
const X0 = 56; // donde empieza el primer compás
const PAD = 12; // espacio entre la barra y la primera nota
const xDeTiempo = (t) => X0 + t * U + PAD;

/* ---------- progreso guardado ---------- */
function leerEstrellas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ESTRELLAS)) || {};
  } catch (error) {
    return {};
  }
}

function guardarEstrellas(estrellas) {
  try {
    localStorage.setItem(CLAVE_ESTRELLAS, JSON.stringify(estrellas));
  } catch (error) {
    /* si no se puede guardar, el juego sigue funcionando */
  }
}

/* ---------- sonido (Web Audio, sin archivos) ---------- */
let contextoAudio = null;

function obtenerAudio() {
  const Contexto = window.AudioContext || window.webkitAudioContext;
  if (!Contexto) return null;
  if (!contextoAudio) contextoAudio = new Contexto();
  if (contextoAudio.state === 'suspended') contextoAudio.resume();
  return contextoAudio;
}

function sonarClick(ctx, destino, cuando, acento, volumen) {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = acento ? 1500 : 1000;
  ganancia.gain.setValueAtTime(0.0001, cuando);
  ganancia.gain.exponentialRampToValueAtTime(volumen, cuando + 0.003);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.06);
  osc.connect(ganancia);
  ganancia.connect(destino);
  osc.start(cuando);
  osc.stop(cuando + 0.08);
}

function sonarTambor(ctx, destino, cuando, volumen) {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(190, cuando);
  osc.frequency.exponentialRampToValueAtTime(60, cuando + 0.14);
  ganancia.gain.setValueAtTime(0.0001, cuando);
  ganancia.gain.exponentialRampToValueAtTime(volumen, cuando + 0.004);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.22);
  osc.connect(ganancia);
  ganancia.connect(destino);
  osc.start(cuando);
  osc.stop(cuando + 0.25);
}

/* ---------- partitura dibujada en SVG ---------- */
function Partitura({ parsed, resultado, cursorRef, mostrarCursor }) {
  const { eventos, numCompases, totalTiempos } = parsed;
  const ancho = X0 + numCompases * TIEMPOS_POR_COMPAS * U + 14;
  const tieneCorcheas = eventos.some((e) => e.figura === 'C');
  const estadoDe = (orden) =>
    resultado && orden !== null ? resultado.resultados[orden].estado : '';

  return (
    <svg
      className="jb-partitura"
      viewBox={`0 0 ${ancho} 118`}
      role="img"
      aria-label="Partitura del ritmo que debes copiar"
    >
      {/* pentagrama */}
      {[40, 50, 60, 70, 80].map((y) => (
        <line key={y} x1="8" x2={ancho - 6} y1={y} y2={y} className="jb-linea" />
      ))}

      {/* clave de percusión y compás 4/4 */}
      <rect x="14" y="50" width="4" height="20" rx="1" className="jb-tinta" />
      <rect x="23" y="50" width="4" height="20" rx="1" className="jb-tinta" />
      <text x="43" y="59" textAnchor="middle" className="jb-compas-num">4</text>
      <text x="43" y="79" textAnchor="middle" className="jb-compas-num">4</text>

      {/* barras que separan los compases */}
      {Array.from({ length: numCompases }, (_, i) => i + 1).map((m) => {
        const x = X0 + m * TIEMPOS_POR_COMPAS * U;
        return m === numCompases ? (
          <g key={m}>
            <line x1={x - 5} x2={x - 5} y1="40" y2="80" className="jb-barra" />
            <rect x={x - 2} y="40" width="3.5" height="40" className="jb-tinta" />
          </g>
        ) : (
          <line key={m} x1={x} x2={x} y1="40" y2="80" className="jb-barra" />
        );
      })}

      {/* números de cada tiempo, para ayudar a contar */}
      {Array.from({ length: totalTiempos }, (_, b) => (
        <text key={b} x={xDeTiempo(b)} y="112" textAnchor="middle" className="jb-num">
          {(b % TIEMPOS_POR_COMPAS) + 1}
        </text>
      ))}

      {/* "y" entre los tiempos, para contar las corcheas: 1 y 2 y... */}
      {tieneCorcheas &&
        Array.from({ length: totalTiempos }, (_, b) => (
          <text key={b} x={xDeTiempo(b + 0.5)} y="112" textAnchor="middle" className="jb-num jb-num-y">
            y
          </text>
        ))}

      {/* notas y silencios */}
      {eventos.map((e, i) => {
        const x = xDeTiempo(e.inicio);

        if (e.silencio) {
          return (
            <path
              key={i}
              className="jb-silencio"
              d={`M${x - 3} 44 L${x + 3} 51 L${x - 3} 58 L${x + 3} 65 Q${x - 5} 68 ${x - 1} 75`}
            />
          );
        }

        const siguiente = eventos[i + 1];
        return (
          <g key={i} className={`jb-nota ${estadoDe(e.orden)}`}>
            <ellipse
              cx={x}
              cy="60"
              rx="6.5"
              ry="5"
              transform={`rotate(-20 ${x} 60)`}
              fill={e.figura === 'B' ? 'none' : 'currentColor'}
              stroke="currentColor"
              strokeWidth="2.2"
            />
            <line x1={x + 6} x2={x + 6} y1="58" y2="22" stroke="currentColor" strokeWidth="2.2" />
            {e.figura === 'C' && !e.viga && (
              <path
                d={`M${x + 6} 22 C${x + 6} 31 ${x + 17} 32 ${x + 14} 45`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            )}
            {e.viga === 'inicio' && siguiente && (
              <line
                x1={x + 6}
                x2={xDeTiempo(siguiente.inicio) + 6}
                y1="24"
                y2="24"
                stroke="currentColor"
                strokeWidth="4.5"
              />
            )}
          </g>
        );
      })}

      {/* tus toques, para comparar con la partitura */}
      {resultado &&
        resultado.toquesDetalle
          .filter((toque) => toque.t > -0.6 && toque.t < totalTiempos + 0.6)
          .map((toque, i) => (
            <circle
              key={i}
              cx={xDeTiempo(toque.t)}
              cy="96"
              r="3.6"
              className={toque.ok ? 'jb-toque-ok' : 'jb-toque-extra'}
            />
          ))}

      {/* cursor que avanza con el ritmo */}
      <rect
        ref={cursorRef}
        className="jb-cursor"
        x={xDeTiempo(0) - 1.5}
        y="28"
        width="3"
        height="62"
        rx="1.5"
        style={{ display: mostrarCursor ? 'block' : 'none' }}
      />
    </svg>
  );
}

/* ---------- pantalla del juego ---------- */
export default function JuegoBanda({ onVolver }) {
  const [fase, setFase] = useState('niveles'); // niveles | listo | escuchando | contando | tocando | resultado
  const [nivelIdx, setNivelIdx] = useState(0);
  const [estrellas, setEstrellas] = useState(leerEstrellas);
  const [resultado, setResultado] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [pulso, setPulso] = useState(0); // sube en cada tiempo: Vivi rebota
  const [golpe, setGolpe] = useState(0); // sube en cada golpe de tambor

  const nivel = NIVELES[nivelIdx];
  const parsed = useMemo(() => parsearNivel(nivel), [nivel]);

  const rafRef = useRef(0);
  const masterRef = useRef(null);
  const cursorRef = useRef(null);
  const sesionRef = useRef(null); // { modo, cero, beatMs, toques: [] }

  // Detiene animación y sonidos programados (no toca el estado de React)
  const cortar = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    sesionRef.current = null;
    if (masterRef.current) {
      try {
        masterRef.current.disconnect();
      } catch (error) {
        /* ya estaba desconectado */
      }
      masterRef.current = null;
    }
  }, []);

  const detener = useCallback(() => {
    cortar();
    setCuenta(null);
  }, [cortar]);

  useEffect(() => cortar, [cortar]);

  // Arranca una vuelta: 'escuchar' (Vivi toca el ritmo) o 'tocar' (te toca a ti)
  const iniciar = (modo) => {
    cortar();
    const ctx = obtenerAudio();
    const beatMs = 60000 / nivel.bpm;
    const beatS = beatMs / 1000;
    const total = parsed.totalTiempos;
    const arranqueMs = 150 + TIEMPOS_PREVIOS * beatMs;
    const cero = performance.now() + arranqueMs; // instante del tiempo 0 del ritmo
    const sesion = { modo, cero, beatMs, toques: [] };
    sesionRef.current = sesion;

    if (ctx) {
      const master = ctx.createGain();
      master.connect(ctx.destination);
      masterRef.current = master;
      const ceroAudio = ctx.currentTime + arranqueMs / 1000;

      for (let i = 0; i < TIEMPOS_PREVIOS; i++) {
        sonarClick(ctx, master, ceroAudio - (TIEMPOS_PREVIOS - i) * beatS, i === 0, 0.35);
      }
      for (let b = 0; b < total; b++) {
        sonarClick(ctx, master, ceroAudio + b * beatS, b % TIEMPOS_POR_COMPAS === 0, modo === 'escuchar' ? 0.12 : 0.3);
      }
      if (modo === 'escuchar') {
        parsed.objetivos.forEach((t) => sonarTambor(ctx, master, ceroAudio + t * beatS, 0.7));
      }
    }

    if (cursorRef.current) cursorRef.current.setAttribute('x', String(xDeTiempo(0) - 1.5));
    setResultado(null);
    setFase(modo === 'escuchar' ? 'escuchando' : 'contando');

    let ultimoTiempo = -99;
    let siguienteNota = 0;
    let tocando = false;

    const terminar = () => {
      rafRef.current = 0;
      sesionRef.current = null;
      setCuenta(null);

      if (modo === 'escuchar') {
        setFase('listo');
        return;
      }

      const toquesEnTiempos = sesion.toques.map((ms) => (ms - cero) / beatMs);
      const r = evaluarToques({ objetivos: parsed.objetivos, toques: toquesEnTiempos });
      const nuevas = { ...estrellas, [nivel.id]: Math.max(estrellas[nivel.id] || 0, r.estrellas) };
      setEstrellas(nuevas);
      guardarEstrellas(nuevas);
      setResultado(r);
      setFase('resultado');
    };

    const bucle = () => {
      const pos = (performance.now() - cero) / beatMs; // en tiempos; negativo = cuenta previa
      const tiempo = Math.floor(pos);

      if (tiempo !== ultimoTiempo) {
        ultimoTiempo = tiempo;
        setPulso((p) => p + 1);
        setCuenta(pos < 0 ? tiempo + TIEMPOS_PREVIOS + 1 : null);
      }

      if (cursorRef.current && pos >= 0) {
        const x = xDeTiempo(Math.min(pos, total)) - 1.5;
        cursorRef.current.setAttribute('x', String(x));
      }

      if (modo === 'escuchar') {
        while (siguienteNota < parsed.objetivos.length && pos >= parsed.objetivos[siguienteNota]) {
          siguienteNota++;
          setGolpe((g) => g + 1);
        }
      } else if (!tocando && pos >= -0.5) {
        tocando = true;
        setFase('tocando');
      }

      if (pos >= total + 0.6) {
        terminar();
        return;
      }
      rafRef.current = requestAnimationFrame(bucle);
    };

    rafRef.current = requestAnimationFrame(bucle);
  };

  // Un toque en el tambor: suena, Vivi golpea y, si toca jugar, se anota
  const tocar = (evento) => {
    const ctx = obtenerAudio();
    if (ctx) sonarTambor(ctx, ctx.destination, ctx.currentTime, 0.8);
    setGolpe((g) => g + 1);

    const sesion = sesionRef.current;
    if (!sesion || sesion.modo !== 'tocar') return;

    let t = evento.nativeEvent ? evento.nativeEvent.timeStamp : evento.timeStamp;
    if (!t || t > 1e12 || t < 0) t = performance.now(); // por si el navegador da otra escala
    t -= AJUSTE_LATENCIA_MS;

    if ((t - sesion.cero) / sesion.beatMs >= -0.4) sesion.toques.push(t);
  };

  const teclaTocar = (evento) => {
    if ((evento.key === ' ' || evento.key === 'Enter') && !evento.repeat) {
      evento.preventDefault();
      tocar(evento);
    }
  };

  const elegirNivel = (i) => {
    detener();
    setNivelIdx(i);
    setResultado(null);
    setFase('listo');
  };

  const atras = () => {
    if (fase === 'niveles') {
      if (typeof onVolver === 'function') onVolver();
      return;
    }
    detener();
    setResultado(null);
    setFase('niveles');
  };

  /* ---------- textos de Vivi ---------- */
  const jugando = fase === 'escuchando' || fase === 'contando' || fase === 'tocando';
  const hayNivelSiguiente = nivelIdx < NIVELES.length - 1;

  let estadoVivi = '';
  if (fase === 'resultado' && resultado) {
    estadoVivi = resultado.estrellas >= 2 ? 'jb-feliz' : resultado.estrellas === 0 ? 'jb-triste' : '';
  }

  let mensajeResultado = '';
  if (resultado) {
    mensajeResultado = [
      'Uy, Vivi se perdió. Escucha el ritmo otra vez e inténtalo.',
      'Vas por buen camino. ¡Una vez más!',
      '¡Muy bien! Casi perfecto.',
      '¡Ritmo perfecto! Vivi está bailando.',
    ][resultado.estrellas];
  }

  const burbuja = () => {
    if (fase === 'niveles') return '¡Elige un nivel para tocar conmigo!';
    if (fase === 'listo') return 'Lee la partitura: cada nota es un toque.';
    if (fase === 'escuchando') return cuenta ? 'Escucha con atención…' : 'Así suena el ritmo.';
    if (fase === 'contando') {
      return (
        <span className="jb-cuenta">
          Prepárate
          {[1, 2, 3, 4].map((n) => (
            <b key={n} className={n === cuenta ? 'jb-cuenta-on' : ''}>{n}</b>
          ))}
        </span>
      );
    }
    if (fase === 'tocando') return '¡Ahora tú!';
    return mensajeResultado;
  };

  return (
    <section className="jb-page">
      <div className="jb-wrap">
        <header className="jb-top">
          <button type="button" className="jb-atras" onClick={atras}>
            ← {fase === 'niveles' ? 'Juegos' : 'Niveles'}
          </button>
          <h1 className="jb-titulo">La banda</h1>
        </header>

        {/* Vivi y su tambor */}
        <div className="jb-escenario">
          <div className="jb-burbuja" role="status" aria-live="polite">{burbuja()}</div>
          <div className={`jb-vivi-zona ${estadoVivi}`}>
            <img
              className={`jb-vivi ${pulso > 0 ? (pulso % 2 ? 'jb-rebote-a' : 'jb-rebote-b') : ''}`}
              src={vivi}
              alt="Vivi, la nutria"
              draggable="false"
            />
            <span
              className={`jb-tambor ${golpe > 0 ? (golpe % 2 ? 'jb-golpe-a' : 'jb-golpe-b') : ''}`}
              aria-hidden="true"
            >
              🥁
            </span>
          </div>
        </div>

        {fase === 'niveles' && (
          <div className="jb-niveles">
            {NIVELES.map((n, i) => (
              <button key={n.id} type="button" className="jb-nivel" onClick={() => elegirNivel(i)}>
                <span className="jb-nivel-num">{i + 1}</span>
                <span className="jb-nivel-info">
                  <strong>{n.nombre}</strong>
                  <small>{n.descripcion}</small>
                </span>
                <span className="jb-estrellas" aria-label={`${estrellas[n.id] || 0} de 3 estrellas`}>
                  {[1, 2, 3].map((s) => (
                    <span key={s} className={s <= (estrellas[n.id] || 0) ? 'jb-estrella-on' : 'jb-estrella'}>★</span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}

        {fase !== 'niveles' && (
          <div className="jb-card">
            <p className="jb-eyebrow">
              Nivel {nivelIdx + 1} · {nivel.nombre} · {nivel.bpm} bpm
            </p>

            <Partitura
              parsed={parsed}
              resultado={fase === 'resultado' ? resultado : null}
              cursorRef={cursorRef}
              mostrarCursor={jugando}
            />

            <details className="jb-ayuda">
              <summary>¿Cómo se lee?</summary>
              <ul>
                <li>Cada nota es un toque en el tambor. Toca justo cuando el cursor la pase.</li>
                <li>Negra: 1 tiempo. Blanca (hueca): toca y espera 2 tiempos.</li>
                <li>Corcheas (con rabito o unidas): dos toques rápidos en un tiempo.</li>
                <li>Silencio (zigzag): no toques, solo cuenta.</li>
              </ul>
            </details>

            {fase === 'listo' && (
              <div className="jb-acciones">
                <button type="button" className="jb-btn jb-btn-suave" onClick={() => iniciar('escuchar')}>
                  ▶ Escuchar
                </button>
                <button type="button" className="jb-btn" onClick={() => iniciar('tocar')}>
                  ¡A tocar!
                </button>
              </div>
            )}

            {jugando && (
              <div className="jb-acciones">
                <button
                  type="button"
                  className="jb-btn jb-btn-suave"
                  onClick={() => {
                    detener();
                    setFase('listo');
                  }}
                >
                  Detener
                </button>
              </div>
            )}

            {fase === 'resultado' && resultado && (
              <div className="jb-resultado">
                <div className="jb-estrellas jb-estrellas-grandes" aria-label={`${resultado.estrellas} de 3 estrellas`}>
                  {[1, 2, 3].map((s) => (
                    <span key={s} className={s <= resultado.estrellas ? 'jb-estrella-on' : 'jb-estrella'}>★</span>
                  ))}
                </div>
                <p className="jb-texto">{mensajeResultado}</p>
                <ul className="jb-datos">
                  <li>Notas acertadas: <b>{resultado.aciertos} de {resultado.total}</b></li>
                  {resultado.extras > 0 && <li>Toques de más: <b>{resultado.extras}</b></li>}
                  {resultado.tendencia === 'adelantado' && <li>Tiendes a tocar un poco antes del tiempo.</li>}
                  {resultado.tendencia === 'atrasado' && <li>Tiendes a tocar un poco después del tiempo.</li>}
                </ul>
                <p className="jb-leyenda">
                  <span className="jb-punto jb-punto-ok" /> acierto
                  <span className="jb-punto jb-punto-mal" /> toque de más
                </p>
                <div className="jb-acciones">
                  <button type="button" className="jb-btn jb-btn-suave" onClick={() => iniciar('tocar')}>
                    Reintentar
                  </button>
                  {hayNivelSiguiente && resultado.estrellas >= 1 ? (
                    <button type="button" className="jb-btn" onClick={() => elegirNivel(nivelIdx + 1)}>
                      Siguiente nivel
                    </button>
                  ) : (
                    <button type="button" className="jb-btn" onClick={atras}>
                      Niveles
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {fase !== 'niveles' && fase !== 'resultado' && (
          <button
            type="button"
            className={`jb-pad${fase === 'tocando' ? ' jb-pad-activo' : ''}`}
            onPointerDown={tocar}
            onKeyDown={teclaTocar}
            aria-label="Tambor. Toca al ritmo de la partitura"
          >
            <span className="jb-pad-emoji" aria-hidden="true">🥁</span>
            <span className="jb-pad-texto">{fase === 'tocando' ? '¡Toca!' : 'Toca para practicar'}</span>
          </button>
        )}
      </div>
    </section>
  );
}
