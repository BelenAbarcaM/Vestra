import React, { useEffect, useMemo, useState } from 'react';
import './JuegoMate.css';
import vivi from '../assets/Vivi_mate.png';
import {
  NIVELES,
  PLANTILLAS,
  VIDAS_INICIALES,
  PISTAS_POR_NIVEL,
  generarNivel,
  comprobarRespuesta,
  formatearPolinomio,
  conSigno,
} from './JuegoMate_logica';

/* =====================================================================
   JUEGO DE MATEMÁTICA · "Taller de factores"
   - Armas la factorización con fichas (amarillas = multiplican,
     azules = suman, rosadas = restan).
   - 3 vidas de vida: cada intento fallido cuesta uno. Las estrellas del
     nivel son los vidas que te sobran al terminar las 6 rondas.
   - Todo corre en el teléfono: no usa backend. El progreso se guarda
     en el dispositivo (localStorage).
   - Para jugar libremente (sin tener que ganar un nivel para abrir el
     siguiente) pon BLOQUEAR_NIVELES en false.
   ===================================================================== */

const BLOQUEAR_NIVELES = false;
const CLAVE_ESTRELLAS = 'juego_mate_estrellas';
const CLAVE_SONIDO = 'juego_mate_sonido';

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

function leerSonido() {
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== 'no';
  } catch (error) {
    return true;
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

function nota(ctx, frecuencia, cuando, duracion, tipo, volumen) {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = frecuencia;
  ganancia.gain.setValueAtTime(0.0001, cuando);
  ganancia.gain.exponentialRampToValueAtTime(volumen, cuando + 0.01);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
  osc.connect(ganancia);
  ganancia.connect(ctx.destination);
  osc.start(cuando);
  osc.stop(cuando + duracion + 0.05);
}

const MELODIAS = {
  ficha: [[700, 0, 0.07, 'triangle', 0.1]],
  acierto: [[523, 0, 0.16, 'triangle', 0.2], [659, 0.09, 0.16, 'triangle', 0.2], [784, 0.18, 0.28, 'triangle', 0.2]],
  fallo: [[220, 0, 0.18, 'sawtooth', 0.09], [165, 0.14, 0.3, 'sawtooth', 0.09]],
  victoria: [
    [523, 0, 0.16, 'triangle', 0.2], [659, 0.12, 0.16, 'triangle', 0.2],
    [784, 0.24, 0.16, 'triangle', 0.2], [1047, 0.36, 0.4, 'triangle', 0.2],
  ],
  derrota: [[392, 0, 0.2, 'triangle', 0.16], [330, 0.18, 0.2, 'triangle', 0.16], [262, 0.36, 0.4, 'triangle', 0.16]],
};

function reproducir(nombre) {
  const ctx = obtenerAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  MELODIAS[nombre].forEach(([f, retraso, dur, tipo, vol]) => nota(ctx, f, t + retraso, dur, tipo, vol));
}

/* ---------- textos de Vivi ---------- */
const FRASES_ACIERTO = ['¡Eso es! Cristal roto.', '¡Perfecto! Eres un genio.', '¡Factorizado! Vivi está feliz.', '¡Qué buena mano!'];
const FRASES_RACHA = ['¡Racha de fuego! 🔥', '¡Imparable! 🔥', '¡Sigue así, no te detengas! 🔥'];

/* chispas de celebración (posiciones fijas, así no cambian entre renders) */
const CHISPAS = Array.from({ length: 10 }, (_, i) => {
  const ang = (i / 10) * Math.PI * 2;
  const dist = 62 + (i % 3) * 14;
  return {
    dx: Math.round(Math.cos(ang) * dist),
    dy: Math.round(Math.sin(ang) * dist),
    retraso: (i % 4) * 0.04,
    emoji: i % 3 === 0 ? '⭐' : '✨',
  };
});

const TERMINOS = [
  ['a', 'x²'],
  ['b', 'x'],
  ['c', 'número'],
];

/* ---------- pantalla del juego ---------- */
export default function JuegoMate({ onVolver }) {
  const [fase, setFase] = useState('niveles'); // niveles | jugando | resultado
  const [nivelIdx, setNivelIdx] = useState(0);
  const [estrellas, setEstrellas] = useState(leerEstrellas);
  const [sonido, setSonido] = useState(leerSonido);

  const [problemas, setProblemas] = useState([]);
  const [ronda, setRonda] = useState(0);
  const [colocadas, setColocadas] = useState({}); // id del hueco -> id de la ficha
  const [seleccion, setSeleccion] = useState(null); // hueco elegido para la próxima ficha
  const [estadoRonda, setEstadoRonda] = useState('resolviendo'); // resolviendo | acierto | perdido
  const [comparacion, setComparacion] = useState(null);
  const [intentos, setIntentos] = useState(0); // sube con cada fallo: reinicia la sacudida

  const [vidas, setVidas] = useState(VIDAS_INICIALES);
  const [pistas, setPistas] = useState(PISTAS_POR_NIVEL);
  const [pistaVisible, setPistaVisible] = useState(false);
  const [pistaRonda, setPistaRonda] = useState(false);
  const [racha, setRacha] = useState(0);
  const [mejorRacha, setMejorRacha] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [fraseAcierto, setFraseAcierto] = useState('');
  const [resultado, setResultado] = useState(null);

  const nivel = NIVELES[nivelIdx];
  const problema = problemas[ronda];
  const plantilla = problema ? PLANTILLAS[problema.tipo] : [];
  const huecos = plantilla.filter((tok) => tok.t === 'slot');
  const usadas = useMemo(() => new Set(Object.values(colocadas)), [colocadas]);
  const completo = huecos.length > 0 && huecos.every((h) => colocadas[h.id] !== undefined);

  const sonar = (nombre) => {
    if (sonido) reproducir(nombre);
  };

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_SONIDO, sonido ? 'si' : 'no');
    } catch (error) {
      /* nada */
    }
  }, [sonido]);

  const desbloqueado = (i) =>
    !BLOQUEAR_NIVELES || i === 0 || (estrellas[NIVELES[i - 1].id] || 0) >= 1;

  /* ---------- flujo del juego ---------- */
  const reiniciarRonda = () => {
    setColocadas({});
    setSeleccion(null);
    setEstadoRonda('resolviendo');
    setComparacion(null);
    setPistaVisible(false);
    setPistaRonda(false);
  };

  const empezarNivel = (i) => {
    setNivelIdx(i);
    setProblemas(generarNivel(NIVELES[i]));
    setRonda(0);
    setVidas(VIDAS_INICIALES);
    setPistas(PISTAS_POR_NIVEL);
    setRacha(0);
    setMejorRacha(0);
    setPuntos(0);
    setResultado(null);
    setIntentos(0);
    reiniciarRonda();
    setFase('jugando');
  };

  const irANiveles = () => {
    setResultado(null);
    setFase('niveles');
  };

  const atras = () => {
    if (fase === 'niveles') {
      if (typeof onVolver === 'function') onVolver();
      return;
    }
    irANiveles();
  };

  const terminar = (gano, vidasFinales) => {
    const ganadas = gano ? Math.max(1, vidasFinales) : 0;
    if (gano) {
      const nuevas = { ...estrellas, [nivel.id]: Math.max(estrellas[nivel.id] || 0, ganadas) };
      setEstrellas(nuevas);
      guardarEstrellas(nuevas);
    }
    setResultado({ gano, estrellas: ganadas });
    setFase('resultado');
    sonar(gano ? 'victoria' : 'derrota');
  };

  const colocar = (ficha) => {
    if (estadoRonda !== 'resolviendo' || usadas.has(ficha.id)) return;
    const compatibles = huecos.filter((h) => h.tipo === ficha.tipo);
    let destino;
    if (seleccion && compatibles.some((h) => h.id === seleccion)) {
      destino = seleccion;
    } else {
      const libre = compatibles.find((h) => colocadas[h.id] === undefined);
      destino = libre ? libre.id : undefined;
    }
    if (!destino) return;
    setColocadas((prev) => ({ ...prev, [destino]: ficha.id }));
    setSeleccion(null);
    setComparacion(null);
    sonar('ficha');
  };

  const tocarHueco = (id) => {
    if (estadoRonda !== 'resolviendo') return;
    if (colocadas[id] !== undefined) {
      // devuelve la ficha y deja el hueco listo para otra
      setColocadas((prev) => {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      });
      setSeleccion(id);
      setComparacion(null);
    } else {
      setSeleccion((actual) => (actual === id ? null : id));
    }
  };

  const limpiar = () => {
    if (estadoRonda !== 'resolviendo') return;
    setColocadas({});
    setSeleccion(null);
    setComparacion(null);
  };

  const usarPista = () => {
    if (pistaVisible) {
      setPistaVisible(false);
      return;
    }
    if (pistas <= 0) return;
    if (!pistaRonda) setPistas((p) => p - 1);
    setPistaRonda(true);
    setPistaVisible(true);
  };

  const comprobar = () => {
    if (!completo || estadoRonda !== 'resolviendo') return;
    const valores = {};
    huecos.forEach((h) => {
      valores[h.id] = problema.fichas[colocadas[h.id]].valor;
    });
    const r = comprobarRespuesta(problema, valores);

    if (r.correcto) {
      const nuevaRacha = racha + 1;
      const ganancia = Math.max(40, 100 + 20 * Math.min(racha, 5) - (pistaRonda ? 30 : 0));
      setRacha(nuevaRacha);
      setMejorRacha((m) => Math.max(m, nuevaRacha));
      setPuntos((p) => p + ganancia);
      setFraseAcierto(
        nuevaRacha >= 3 ? FRASES_RACHA[nuevaRacha % FRASES_RACHA.length] : FRASES_ACIERTO[ronda % FRASES_ACIERTO.length]
      );
      setPistaVisible(false);
      setEstadoRonda('acierto');
      sonar('acierto');
      return;
    }

    const quedan = vidas - 1;
    setVidas(quedan);
    setRacha(0);
    setIntentos((n) => n + 1);
    setComparacion(r);
    setSeleccion(null);
    sonar('fallo');
    if (quedan <= 0) {
      setPistaVisible(false);
      setEstadoRonda('perdido');
    }
  };

  const siguiente = () => {
    if (ronda >= problemas.length - 1) {
      terminar(true, vidas);
      return;
    }
    setRonda((r) => r + 1);
    reiniciarRonda();
  };

  /* ---------- textos ---------- */
  const jugando = fase === 'jugando';

  const burbuja = () => {
    if (fase === 'niveles') return '¡Elige un nivel y factoriza conmigo!';
    if (fase === 'resultado') {
      if (!resultado.gano) return 'Uy, se acabaron las vidas. ¡Inténtalo otra vez!';
      return ['¡Lo lograste! Pasaste por los pelos.', '¡Muy bien! Casi perfecto.', '¡Perfecto! Ni un solo error.'][resultado.estrellas - 1];
    }
    if (estadoRonda === 'acierto') return fraseAcierto;
    if (estadoRonda === 'perdido') return 'Esta era difícil. Mira cómo se resolvía.';
    if (comparacion) return 'Casi… mira qué cristales no coinciden.';
    return 'Arma la factorización con las fichas.';
  };

  const estadoVivi =
    estadoRonda === 'acierto' && jugando
      ? 'jm-feliz'
      : (estadoRonda === 'perdido' && jugando) || (fase === 'resultado' && resultado && !resultado.gano)
      ? 'jm-triste'
      : fase === 'resultado' && resultado && resultado.estrellas >= 2
      ? 'jm-feliz'
      : '';

  /* ---------- piezas de pantalla ---------- */
  const renderToken = (tok, i) => {
    if (tok.t === 'txt') {
      const esParentesis = tok.v === '(' || tok.v === ')';
      return (
        <span key={i} className={`jm-txt${esParentesis ? ' jm-paren' : ''}`}>
          {tok.v}
        </span>
      );
    }
    const fichaId = colocadas[tok.id];
    const ficha = fichaId !== undefined ? problema.fichas[fichaId] : null;
    const clases = ['jm-hueco', `jm-hueco-${tok.tipo}`];
    if (ficha) {
      clases.push('jm-hueco-lleno');
      if (tok.tipo === 'const') clases.push(ficha.valor < 0 ? 'jm-neg' : 'jm-pos');
    }
    if (seleccion === tok.id) clases.push('jm-hueco-sel');
    if (estadoRonda === 'acierto') clases.push('jm-hueco-ok');
    return (
      <button
        key={i}
        type="button"
        className={clases.join(' ')}
        onClick={() => tocarHueco(tok.id)}
        aria-label={ficha ? `Hueco con ${ficha.valor}. Toca para quitarlo` : 'Hueco vacío'}
      >
        {ficha ? (tok.tipo === 'const' ? conSigno(ficha.valor) : ficha.valor) : ''}
      </button>
    );
  };

  const terminosRevision = comparacion
    ? TERMINOS.filter(([k]) => problema.objetivo[k] !== 0 || comparacion.expansion[k] !== 0)
    : [];

  const ultimaRonda = problemas.length > 0 && ronda >= problemas.length - 1;

  return (
    <section className="jm-page">
      <div className="jm-wrap">
        <header className="jm-top">
          <button type="button" className="jm-atras" onClick={atras}>
            ← {fase === 'niveles' ? 'Juegos' : 'Niveles'}
          </button>
          <h1 className="jm-titulo">Taller de factores</h1>
        </header>

        {/* Vivi */}
        <div className="jm-escenario">
          <div className="jm-burbuja" role="status" aria-live="polite">{burbuja()}</div>
          <div className={`jm-vivi-zona ${estadoVivi}`}>
            <img className="jm-vivi" src={vivi} alt="Vivi, la nutria" draggable="false" />
            <span className="jm-accesorio" aria-hidden="true">🧮</span>
          </div>
        </div>

        {/* ---------- niveles ---------- */}
        {fase === 'niveles' && (
          <div className="jm-niveles">
            {NIVELES.map((n, i) => {
              const abierto = desbloqueado(i);
              const ganadas = estrellas[n.id] || 0;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`jm-nivel${abierto ? '' : ' jm-nivel-bloqueado'}`}
                  disabled={!abierto}
                  onClick={() => empezarNivel(i)}
                >
                  <span className="jm-nivel-num">{abierto ? n.emoji : '🔒'}</span>
                  <span className="jm-nivel-info">
                    <strong>{i + 1}. {n.nombre}</strong>
                    <small>{abierto ? n.descripcion : 'Gana el nivel anterior para abrirlo.'}</small>
                  </span>
                  <span className="jm-estrellas" aria-label={`${ganadas} de 3 estrellas`}>
                    {[1, 2, 3].map((s) => (
                      <span key={s} className={s <= ganadas ? 'jm-estrella-on' : 'jm-estrella'}>★</span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ---------- ronda ---------- */}
        {jugando && problema && (
          <>
            <div className="jm-stats">
              <span className="jm-vidas" aria-label={`${vidas} vidas`}>
                {Array.from({ length: VIDAS_INICIALES }, (_, i) => (
                  <span key={i} className={i < vidas ? 'jm-vida' : 'jm-vida jm-vida-off'}>❤️</span>
                ))}
              </span>
              <span className={`jm-chip${racha >= 3 ? ' jm-chip-fuego' : ''}`}>🔥 {racha}</span>
              <span className="jm-chip">⭐ {puntos}</span>
              <button
                type="button"
                className="jm-sonido"
                onClick={() => setSonido((s) => !s)}
                aria-label={sonido ? 'Silenciar sonido' : 'Activar sonido'}
              >
                {sonido ? '🔊' : '🔇'}
              </button>
            </div>

            <ol className="jm-camino" aria-label={`Ronda ${ronda + 1} de ${problemas.length}`}>
              {problemas.map((_, i) => (
                <li
                  key={i}
                  className={
                    i < ronda || (i === ronda && estadoRonda === 'acierto')
                      ? 'jm-paso jm-paso-hecho'
                      : i === ronda
                      ? 'jm-paso jm-paso-actual'
                      : 'jm-paso'
                  }
                />
              ))}
            </ol>

            <div className="jm-card">
              <p className="jm-eyebrow">
                {nivel.nombre} · Ronda {ronda + 1} de {problemas.length}
              </p>

              <div
                key={`e${intentos}`}
                className={`jm-ecuacion${comparacion && estadoRonda === 'resolviendo' ? ' jm-sacude' : ''}`}
              >
                <div className={`jm-gema${estadoRonda === 'acierto' ? ' jm-gema-rota' : ''}`}>
                  <span className="jm-poli">{formatearPolinomio(problema.objetivo)}</span>
                  {estadoRonda === 'acierto' &&
                    CHISPAS.map((c, i) => (
                      <i
                        key={i}
                        className="jm-chispa"
                        aria-hidden="true"
                        style={{ '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, animationDelay: `${c.retraso}s` }}
                      >
                        {c.emoji}
                      </i>
                    ))}
                </div>
                <span className="jm-igual" aria-hidden="true">=</span>
                <div className="jm-fila">{plantilla.map(renderToken)}</div>
              </div>

              {pistaVisible && estadoRonda === 'resolviendo' && (
                <p className="jm-pista">💡 {problema.pista}</p>
              )}

              {comparacion && estadoRonda === 'resolviendo' && (
                <div className="jm-revision" role="status">
                  <p>
                    Lo que armaste da <b>{formatearPolinomio(comparacion.expansion)}</b>
                  </p>
                  <div className="jm-cristales">
                    {terminosRevision.map(([k, etiqueta]) => (
                      <span
                        key={k}
                        className={`jm-cristal ${comparacion.coincide[k] ? 'jm-cristal-ok' : 'jm-cristal-mal'}`}
                      >
                        {comparacion.coincide[k] ? '✓' : '✗'} {etiqueta}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {estadoRonda === 'acierto' && (
                <div className="jm-revision jm-revision-ok">
                  <p className="jm-solucion">
                    {formatearPolinomio(problema.objetivo)} = {problema.solucionTexto}
                  </p>
                </div>
              )}

              {estadoRonda === 'perdido' && (
                <div className="jm-revision jm-revision-perdido">
                  <p>La solución era</p>
                  <p className="jm-solucion">
                    {formatearPolinomio(problema.objetivo)} = {problema.solucionTexto}
                  </p>
                </div>
              )}
            </div>

            {estadoRonda === 'resolviendo' && (
              <div className="jm-banco-zona">
                <div className="jm-banco" aria-label="Fichas disponibles">
                  {problema.fichas.map((f) => {
                    const usada = usadas.has(f.id);
                    const color = f.tipo === 'coef' ? 'coef' : f.valor < 0 ? 'neg' : 'pos';
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`jm-ficha jm-ficha-${color}${usada ? ' jm-ficha-usada' : ''}`}
                        disabled={usada}
                        onClick={() => colocar(f)}
                      >
                        {f.tipo === 'const' ? conSigno(f.valor) : f.valor}
                      </button>
                    );
                  })}
                </div>
                <p className="jm-leyenda">
                  <span className="jm-punto jm-punto-coef" /> multiplican
                  <span className="jm-punto jm-punto-pos" /> suman
                  <span className="jm-punto jm-punto-neg" /> restan
                </p>
              </div>
            )}

            <div className="jm-acciones">
              {estadoRonda === 'resolviendo' && (
                <>
                  <button
                    type="button"
                    className="jm-btn jm-btn-icono jm-btn-suave"
                    onClick={limpiar}
                    disabled={Object.keys(colocadas).length === 0}
                    aria-label="Limpiar los huecos"
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    className="jm-btn jm-btn-suave"
                    onClick={usarPista}
                    disabled={pistas <= 0 && !pistaRonda}
                  >
                    💡 Pista ({pistas})
                  </button>
                  <button type="button" className="jm-btn" onClick={comprobar} disabled={!completo}>
                    ¡Factorizar!
                  </button>
                </>
              )}
              {estadoRonda === 'acierto' && (
                <button type="button" className="jm-btn" onClick={siguiente}>
                  {ultimaRonda ? 'Terminar nivel ✓' : 'Siguiente →'}
                </button>
              )}
              {estadoRonda === 'perdido' && (
                <button type="button" className="jm-btn" onClick={() => terminar(false, 0)}>
                  Ver resultado
                </button>
              )}
            </div>
          </>
        )}

        {/* ---------- resultado ---------- */}
        {fase === 'resultado' && resultado && (
          <div className="jm-card jm-resultado">
            <p className="jm-eyebrow">
              {nivel.nombre} · {resultado.gano ? 'Nivel superado' : 'Nivel no superado'}
            </p>
            <div className="jm-estrellas jm-estrellas-grandes" aria-label={`${resultado.estrellas} de 3 estrellas`}>
              {[1, 2, 3].map((s) => (
                <span key={s} className={s <= resultado.estrellas ? 'jm-estrella-on' : 'jm-estrella'}>★</span>
              ))}
            </div>
            <ul className="jm-datos">
              <li>Puntos: <b>{puntos}</b></li>
              <li>Mejor racha: <b>{mejorRacha} 🔥</b></li>
              <li>Peces que te sobraron: <b>{resultado.gano ? vidas : 0} de {VIDAS_INICIALES}</b></li>
            </ul>
            <div className="jm-acciones">
              <button type="button" className="jm-btn jm-btn-suave" onClick={() => empezarNivel(nivelIdx)}>
                {resultado.gano ? 'Jugar de nuevo' : 'Reintentar'}
              </button>
              {resultado.gano && nivelIdx < NIVELES.length - 1 ? (
                <button type="button" className="jm-btn" onClick={() => empezarNivel(nivelIdx + 1)}>
                  Siguiente nivel
                </button>
              ) : (
                <button type="button" className="jm-btn" onClick={irANiveles}>
                  Niveles
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
