import React, { useEffect, useMemo, useRef, useState } from 'react';
import './JuegoIdiomas.css';
import vivi from '../assets/Vivi_idiomas.png';
import {
  IDIOMAS,
  ESPANOL,
  ITEMS,
  ACTIVIDADES,
  PARES_POR_PARTIDA,
  generarPedidos,
  evaluarBandeja,
  generarFrases,
  compararFrase,
  ordenCorrecto,
  generarMazo,
  generarBurbujas,
  generarDeletreo,
  ordenLetras,
  generarDialogo,
  puntosDeRonda,
  estrellasPorPuntos,
  estrellasParejas,
  claveEstrellas,
} from './JuegoIdiomas_logica';

/* =====================================================================
   JUEGO DE LA ACADEMIA DE IDIOMAS · "Vivi políglota" (inglés y portugués)
   6 niveles por idioma (inglés y portugués), de fácil a difícil:
     1 🃏 Parejas políglotas → memoria: palabra en español ↔ palabra en el idioma
     2 🎈 Pesca de palabras  → escuchas la palabra y revientas la burbuja correcta
     3 ☕ Café de Vivi       → escuchas/lees el pedido y armas la bandeja
     4 🔤 Deletrea           → armas la palabra letra por letra
     5 🧩 Arma la frase      → ordenas las palabras para traducir una frase
     6 💬 Charla con Vivi    → conversación tipo chat: eliges la mejor respuesta
   - Todo corre en el teléfono: no usa backend ni base de datos.
   - Las estrellas se guardan en el dispositivo (localStorage).
   - Las voces usan la síntesis de voz del teléfono (si no existe, el juego
     sigue funcionando sin sonido de voz).
   - Para agregar vocabulario o frases, edita JuegoIdiomas_logica.js.
   ===================================================================== */

const CLAVE_ESTRELLAS = 'juego_idiomas_estrellas';
const PEDIDOS_POR_PARTIDA = 5;
const FRASES_POR_PARTIDA = 5;
const HAY_VOZ = typeof window !== 'undefined' && 'speechSynthesis' in window;

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

function nota(ctx, freq, inicio, dur, tipo = 'sine', volumen = 0.16) {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  ganancia.gain.setValueAtTime(0.0001, inicio);
  ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  osc.connect(ganancia);
  ganancia.connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + dur + 0.02);
}

function sonar(tipo) {
  const ctx = obtenerAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  if (tipo === 'tap') nota(ctx, 540, t, 0.07, 'triangle', 0.12);
  if (tipo === 'ok') {
    nota(ctx, 660, t, 0.12);
    nota(ctx, 880, t + 0.1, 0.2);
  }
  if (tipo === 'mal') {
    nota(ctx, 230, t, 0.18, 'sawtooth', 0.08);
    nota(ctx, 170, t + 0.14, 0.24, 'sawtooth', 0.08);
  }
  if (tipo === 'win') {
    [523, 659, 784, 1047].forEach((f, i) => nota(ctx, f, t + i * 0.11, 0.24));
  }
}

/* ---------- voz (pronunciación en el idioma elegido) ---------- */
function hablar(texto, voz) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = voz;
    frase.rate = 0.9;
    window.speechSynthesis.speak(frase);
  } catch (error) {
    /* sin voz el juego sigue funcionando */
  }
}

function callar() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch (error) {
    /* nada que hacer */
  }
}

/* ---------- piezas compartidas ---------- */
function Escenario({ burbuja, estado = '', cliente = null, reaccion = null }) {
  return (
    <div className="ji-escenario">
      <div className="ji-burbuja" role="status" aria-live="polite">{burbuja}</div>
      <div className={`ji-actores ${estado ? `ji-${estado}` : ''}`}>
        {cliente && (
          <span className="ji-cliente-zona">
            {reaccion && <span className="ji-reaccion" key={reaccion}>{reaccion}</span>}
            <span className="ji-cliente" aria-hidden="true">{cliente}</span>
          </span>
        )}
        <img className="ji-vivi" src={vivi} alt="Vivi, la nutria" draggable="false" />
      </div>
    </div>
  );
}

function Progreso({ total, actual }) {
  return (
    <div className="ji-progreso" aria-label={`Ronda ${actual + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`ji-punto-prog${i < actual ? ' ji-hecho' : ''}${i === actual ? ' ji-actual' : ''}`}
        />
      ))}
    </div>
  );
}

function BotonAudio({ texto, voz, grande = false }) {
  return (
    <button
      type="button"
      className={`ji-audio${grande ? ' ji-audio-grande' : ''}`}
      onClick={() => hablar(texto, voz)}
      aria-label="Escuchar"
    >
      🔊
    </button>
  );
}

/* =====================================================================
   ☕ CAFÉ DE VIVI
   ===================================================================== */
function Cafe({ idioma, onTerminar }) {
  const lang = IDIOMAS[idioma];
  const pedidos = useMemo(() => generarPedidos(idioma).slice(0, PEDIDOS_POR_PARTIDA), [idioma]);

  const [ronda, setRonda] = useState(0);
  const [bandeja, setBandeja] = useState({});
  const [estado, setEstado] = useState('pidiendo'); // pidiendo | mal | bien
  const [errores, setErrores] = useState(0); // errores de esta ronda
  const [ayuda, setAyuda] = useState(false); // ¿vio la traducción en esta ronda?
  const [puntos, setPuntos] = useState(0);
  const [aviso, setAviso] = useState('');

  const pedido = pedidos[ronda];
  const total = pedidos.length;
  const hayAlgo = Object.values(bandeja).some((n) => n > 0);

  useEffect(() => () => callar(), []);

  const cambiar = (id, delta) => {
    if (estado === 'bien') return;
    setBandeja((b) => {
      const nuevo = Math.max(0, Math.min(3, (b[id] || 0) + delta));
      return { ...b, [id]: nuevo };
    });
    if (estado === 'mal') {
      setEstado('pidiendo');
      setAviso('');
    }
    sonar('tap');
  };

  const servir = () => {
    const r = evaluarBandeja(pedido, bandeja);
    if (r.correcto) {
      sonar('ok');
      setEstado('bien');
      setAviso('');
      setPuntos((p) => p + puntosDeRonda({ errores, ayuda, rendido: false }));
    } else {
      sonar('mal');
      setErrores((e) => e + 1);
      setEstado('mal');
      if (r.faltan.length && r.sobran.length) setAviso('Falta algo y hay algo de más. ¡Escucha otra vez!');
      else if (r.faltan.length) setAviso('Aún falta algo en la bandeja.');
      else setAviso('Hay algo de más en la bandeja.');
    }
  };

  const siguiente = () => {
    if (ronda >= total - 1) {
      onTerminar({
        estrellas: estrellasPorPuntos(puntos, total),
        detalle: `Pedidos entregados: ${total} · Puntos: ${puntos} de ${total}`,
      });
      return;
    }
    setRonda((r) => r + 1);
    setBandeja({});
    setEstado('pidiendo');
    setErrores(0);
    setAyuda(false);
    setAviso('');
  };

  const burbuja = (
    <span className="ji-dialogo">
      <span className="ji-dialogo-texto">
        {pedido.texto}
        {ayuda && <small className="ji-traduccion">{pedido.es}</small>}
      </span>
      <BotonAudio texto={pedido.texto} voz={lang.voz} />
    </span>
  );

  const vivi_estado = estado === 'bien' ? 'feliz' : estado === 'mal' ? 'triste' : '';
  const reaccion = estado === 'bien' ? '😍' : estado === 'mal' ? '🤔' : null;

  return (
    <>
      <Escenario burbuja={burbuja} estado={vivi_estado} cliente={pedido.cliente} reaccion={reaccion} />

      <div className="ji-card">
        <div className="ji-card-cabecera">
          <p className="ji-eyebrow">
            {lang.bandera} Pedido {ronda + 1} de {total}
          </p>
          <Progreso total={total} actual={ronda} />
        </div>

        <div key={errores} className={`ji-bandeja${estado === 'mal' ? ' ji-sacude' : ''}${estado === 'bien' ? ' ji-bandeja-ok' : ''}`}>
          {!hayAlgo && <span className="ji-vacio">Toca los productos para ponerlos en la bandeja 🍽️</span>}
          {ITEMS.flatMap((it) =>
            Array.from({ length: bandeja[it.id] || 0 }, (_, k) => (
              <button
                key={`${it.id}-${k}`}
                type="button"
                className="ji-chip"
                onClick={() => cambiar(it.id, -1)}
                disabled={estado === 'bien'}
                aria-label={`Quitar ${it[idioma]}`}
              >
                {it.emoji}
              </button>
            ))
          )}
        </div>

        {estado === 'mal' && aviso && <p className="ji-aviso ji-aviso-mal">{aviso}</p>}
        {estado === 'bien' && (
          <p className="ji-aviso ji-aviso-ok">
            ¡Pedido correcto! 🎉
            <small>{pedido.es}</small>
          </p>
        )}

        <div className="ji-estante" role="group" aria-label="Productos">
          {ITEMS.map((it) => (
            <button
              key={it.id}
              type="button"
              className="ji-producto"
              onClick={() => cambiar(it.id, 1)}
              disabled={estado === 'bien'}
            >
              <span className="ji-producto-emoji" aria-hidden="true">{it.emoji}</span>
              <span className="ji-producto-nombre">{pedido.sinEtiquetas ? '' : it[idioma]}</span>
              {(bandeja[it.id] || 0) > 0 && <span className="ji-badge">{bandeja[it.id]}</span>}
            </button>
          ))}
        </div>
        {pedido.sinEtiquetas && <p className="ji-nota">Modo experto: ¡los nombres están escondidos!</p>}

        {estado !== 'bien' ? (
          <div className="ji-acciones">
            <button type="button" className="ji-btn ji-btn-suave" onClick={() => setAyuda(true)} disabled={ayuda}>
              ¿Qué dice?
            </button>
            <button type="button" className="ji-btn ji-btn-suave" onClick={() => setBandeja({})} disabled={!hayAlgo}>
              Vaciar
            </button>
            <button type="button" className="ji-btn" onClick={servir} disabled={!hayAlgo}>
              Servir
            </button>
          </div>
        ) : (
          <div className="ji-acciones">
            <button type="button" className="ji-btn" onClick={siguiente}>
              {ronda >= total - 1 ? 'Terminar' : 'Siguiente pedido →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================================
   🧩 ARMA LA FRASE
   ===================================================================== */
function Frases({ idioma, onTerminar }) {
  const lang = IDIOMAS[idioma];
  const frases = useMemo(() => generarFrases(idioma, FRASES_POR_PARTIDA), [idioma]);

  const [ronda, setRonda] = useState(0);
  const [puestas, setPuestas] = useState([]); // ids de fichas, en orden
  const [estado, setEstado] = useState('armando'); // armando | mal | bien | revelada
  const [estados, setEstados] = useState([]); // 'ok' | 'mal' por ficha puesta
  const [errores, setErrores] = useState(0);
  const [puntos, setPuntos] = useState(0);

  const frase = frases[ronda];
  const total = frases.length;
  const textoDe = useMemo(
    () => Object.fromEntries(frase.fichas.map((f) => [f.id, f.texto])),
    [frase]
  );
  const cerrada = estado === 'bien' || estado === 'revelada';

  useEffect(() => () => callar(), []);

  const limpiarError = () => {
    if (estado === 'mal') {
      setEstado('armando');
      setEstados([]);
    }
  };

  const poner = (id) => {
    if (cerrada || puestas.includes(id)) return;
    limpiarError();
    setPuestas((p) => [...p, id]);
    sonar('tap');
  };

  const quitar = (id) => {
    if (cerrada) return;
    limpiarError();
    setPuestas((p) => p.filter((x) => x !== id));
    sonar('tap');
  };

  const comprobar = () => {
    const r = compararFrase(frase.solucion, puestas.map((id) => textoDe[id]));
    setEstados(r.estados);
    if (r.correcto) {
      sonar('ok');
      setEstado('bien');
      setPuntos((p) => p + puntosDeRonda({ errores, ayuda: false, rendido: false }));
      setTimeout(() => hablar(frase.texto, lang.voz), 350);
    } else {
      sonar('mal');
      setErrores((e) => e + 1);
      setEstado('mal');
    }
  };

  const verRespuesta = () => {
    setPuestas(ordenCorrecto(frase));
    setEstados(frase.solucion.map(() => 'ok'));
    setEstado('revelada');
    setTimeout(() => hablar(frase.texto, lang.voz), 350);
  };

  const siguiente = () => {
    if (ronda >= total - 1) {
      onTerminar({
        estrellas: estrellasPorPuntos(puntos, total),
        detalle: `Frases armadas: ${total} · Puntos: ${puntos} de ${total}`,
      });
      return;
    }
    setRonda((r) => r + 1);
    setPuestas([]);
    setEstados([]);
    setEstado('armando');
    setErrores(0);
  };

  const burbuja =
    estado === 'bien'
      ? '¡Perfecto! Escucha cómo suena.'
      : estado === 'revelada'
      ? 'Así se dice. ¡Practícala!'
      : estado === 'mal'
      ? 'Casi… las rojas están mal ubicadas.'
      : `¿Cómo se dice en ${lang.nombre}?`;

  return (
    <>
      <Escenario
        burbuja={burbuja}
        estado={estado === 'bien' ? 'feliz' : estado === 'mal' ? 'triste' : ''}
      />

      <div className="ji-card">
        <div className="ji-card-cabecera">
          <p className="ji-eyebrow">
            {lang.bandera} Frase {ronda + 1} de {total}
          </p>
          <Progreso total={total} actual={ronda} />
        </div>

        <div className="ji-consigna">
          <small>Dilo en {lang.nombre}:</small>
          <strong>“{frase.es}”</strong>
        </div>

        <div key={errores} className={`ji-linea${estado === 'mal' ? ' ji-sacude' : ''}${cerrada ? ' ji-linea-ok' : ''}`}>
          {puestas.length === 0 && <span className="ji-vacio">Toca las palabras para armar la frase</span>}
          {puestas.map((id, i) => (
            <button
              key={id}
              type="button"
              className={`ji-ficha ji-ficha-puesta ${estados[i] ? `ji-ficha-${estados[i]}` : ''}`}
              onClick={() => quitar(id)}
              disabled={cerrada}
            >
              {textoDe[id]}
            </button>
          ))}
        </div>

        <div className="ji-banco" role="group" aria-label="Palabras disponibles">
          {frase.fichas.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`ji-ficha${puestas.includes(f.id) ? ' ji-ficha-fantasma' : ''}`}
              onClick={() => poner(f.id)}
              disabled={puestas.includes(f.id) || cerrada}
              tabIndex={puestas.includes(f.id) ? -1 : 0}
            >
              {f.texto}
            </button>
          ))}
        </div>

        {cerrada && (
          <div className="ji-frase-final">
            <BotonAudio texto={frase.texto} voz={lang.voz} grande />
            <span>{frase.texto}</span>
          </div>
        )}

        {!cerrada ? (
          <div className="ji-acciones">
            {errores >= 2 ? (
              <button type="button" className="ji-btn ji-btn-suave" onClick={verRespuesta}>
                Ver respuesta
              </button>
            ) : (
              <button
                type="button"
                className="ji-btn ji-btn-suave"
                onClick={() => {
                  limpiarError();
                  setPuestas([]);
                }}
                disabled={puestas.length === 0}
              >
                Borrar
              </button>
            )}
            <button type="button" className="ji-btn" onClick={comprobar} disabled={puestas.length === 0}>
              Comprobar
            </button>
          </div>
        ) : (
          <div className="ji-acciones">
            <button type="button" className="ji-btn" onClick={siguiente}>
              {ronda >= total - 1 ? 'Terminar' : 'Siguiente frase →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================================
   🃏 NIVEL 1 · PAREJAS POLÍGLOTAS (español ↔ idioma elegido)
   ===================================================================== */
function Parejas({ idioma, onTerminar }) {
  const lang = IDIOMAS[idioma];
  const mazo = useMemo(() => generarMazo(idioma, PARES_POR_PARTIDA), [idioma]);
  const [abiertas, setAbiertas] = useState([]); // índices volteados sin resolver
  const [halladas, setHalladas] = useState([]); // índices ya emparejados
  const [intentos, setIntentos] = useState(0);
  const [mensaje, setMensaje] = useState(`Une cada palabra en español con su pareja en ${lang.nombre}.`);
  const [estadoVivi, setEstadoVivi] = useState('');
  const bloqueo = useRef(false);
  const temporizadores = useRef([]);

  useEffect(
    () => () => {
      temporizadores.current.forEach(clearTimeout);
      callar();
    },
    []
  );

  const luego = (fn, ms) => {
    const id = setTimeout(fn, ms);
    temporizadores.current.push(id);
  };

  const infoDe = (codigo) => (codigo === 'es' ? ESPANOL : IDIOMAS[codigo]);

  const voltear = (i) => {
    if (bloqueo.current || abiertas.includes(i) || halladas.includes(i)) return;
    const carta = mazo[i];
    sonar('tap');
    hablar(carta.texto, infoDe(carta.lang).voz);
    setEstadoVivi('');

    const nuevas = [...abiertas, i];
    setAbiertas(nuevas);
    if (nuevas.length < 2) return;

    const a = mazo[nuevas[0]];
    const b = mazo[nuevas[1]];
    const nIntentos = intentos + 1;
    setIntentos(nIntentos);
    bloqueo.current = true;

    if (a.par === b.par) {
      luego(() => {
        sonar('ok');
        const nuevasHalladas = [...halladas, nuevas[0], nuevas[1]];
        setHalladas(nuevasHalladas);
        setAbiertas([]);
        setEstadoVivi('feliz');
        const es = a.lang === 'es' ? a : b;
        const otra = a.lang === 'es' ? b : a;
        setMensaje(`¡Pareja! ${es.texto} = ${otra.texto} ${es.emoji}`);
        bloqueo.current = false;
        if (nuevasHalladas.length === mazo.length) {
          sonar('win');
          luego(
            () =>
              onTerminar({
                estrellas: estrellasParejas(nIntentos),
                detalle: `Parejas: ${PARES_POR_PARTIDA} · Intentos: ${nIntentos}`,
              }),
            1000
          );
        }
      }, 450);
    } else {
      luego(() => {
        sonar('mal');
        setAbiertas([]);
        setEstadoVivi('triste');
        setMensaje(a.lang === b.lang ? `Necesitas una en español y una en ${lang.nombre}.` : 'No son pareja. ¡Intenta otra vez!');
        bloqueo.current = false;
      }, 900);
    }
  };

  return (
    <>
      <Escenario burbuja={mensaje} estado={estadoVivi} />

      <div className="ji-card">
        <div className="ji-card-cabecera">
          <p className="ji-eyebrow">
            {ESPANOL.bandera} Español ↔ {lang.nombre} {lang.bandera}
          </p>
          <span className="ji-contador">Intentos: <b>{intentos}</b></span>
        </div>

        <div className="ji-tablero">
          {mazo.map((c, i) => {
            const hallada = halladas.includes(i);
            const abierta = abiertas.includes(i) || hallada;
            const info = infoDe(c.lang);
            return (
              <button
                key={c.uid}
                type="button"
                className={`ji-carta ji-carta-${c.lang}${abierta ? ' ji-carta-abierta' : ''}${hallada ? ' ji-carta-hallada' : ''}`}
                onClick={() => voltear(i)}
                aria-label={abierta ? `${c.texto}, ${info.nombre}` : 'Carta boca abajo'}
              >
                <span className="ji-carta-giro">
                  <span className="ji-carta-dorso" aria-hidden="true">✨</span>
                  <span className="ji-carta-frente">
                    <small>{info.bandera}</small>
                    <b>{c.texto}</b>
                    {hallada && <i>{c.emoji}</i>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="ji-nota">
          Cartas azules: español · {lang.id === 'en' ? 'turquesa: inglés' : 'amarillas: portugués'}.
        </p>
      </div>
    </>
  );
}

/* =====================================================================
   🎈 NIVEL 2 · PESCA DE PALABRAS
   ===================================================================== */
function Burbujas({ idioma, onTerminar }) {
  const lang = IDIOMAS[idioma];
  const rondas = useMemo(() => generarBurbujas(idioma), [idioma]);

  const [ronda, setRonda] = useState(0);
  const [malas, setMalas] = useState([]); // ids de burbujas equivocadas
  const [acertada, setAcertada] = useState(false);
  const [errores, setErrores] = useState(0);
  const [ayuda, setAyuda] = useState(false); // ¿vio la palabra escrita en modo solo oído?
  const [puntos, setPuntos] = useState(0);
  const [ultimoMal, setUltimoMal] = useState(false);
  const temporizadores = useRef([]);

  const r = rondas[ronda];
  const total = rondas.length;
  const verTexto = !r.soloOido || !HAY_VOZ || ayuda;

  useEffect(
    () => () => {
      temporizadores.current.forEach(clearTimeout);
      callar();
    },
    []
  );

  // Al empezar cada ronda, Vivi dice la palabra
  useEffect(() => {
    const id = setTimeout(() => hablar(rondas[ronda].texto, lang.voz), 500);
    return () => clearTimeout(id);
  }, [ronda, rondas, lang.voz]);

  const elegir = (palabra) => {
    if (acertada || malas.includes(palabra.id)) return;
    if (palabra.id === r.palabra.id) {
      sonar('ok');
      hablar(r.texto, lang.voz);
      setAcertada(true);
      setUltimoMal(false);
      const nuevos = puntos + puntosDeRonda({ errores, ayuda, rendido: false });
      setPuntos(nuevos);
      const id = setTimeout(() => {
        if (ronda >= total - 1) {
          onTerminar({
            estrellas: estrellasPorPuntos(nuevos, total),
            detalle: `Burbujas reventadas: ${total} · Puntos: ${nuevos} de ${total}`,
          });
          return;
        }
        setRonda((x) => x + 1);
        setMalas([]);
        setAcertada(false);
        setErrores(0);
        setAyuda(false);
      }, 1200);
      temporizadores.current.push(id);
    } else {
      sonar('mal');
      setMalas((m) => [...m, palabra.id]);
      setErrores((e) => e + 1);
      setUltimoMal(true);
    }
  };

  const burbuja = (
    <span className="ji-dialogo">
      <span className="ji-dialogo-texto">
        {verTexto ? <b>{r.texto}</b> : 'Escucha con atención…'}
      </span>
      <BotonAudio texto={r.texto} voz={lang.voz} />
    </span>
  );

  return (
    <>
      <Escenario burbuja={burbuja} estado={acertada ? 'feliz' : ultimoMal ? 'triste' : ''} />

      <div className="ji-card">
        <div className="ji-card-cabecera">
          <p className="ji-eyebrow">
            {lang.bandera} Burbuja {ronda + 1} de {total}
          </p>
          <Progreso total={total} actual={ronda} />
        </div>

        <p className="ji-nota">
          {r.soloOido ? 'Modo oído: toca 🔊 y revienta la burbuja del dibujo correcto.' : 'Revienta la burbuja que muestra esta palabra.'}
        </p>

        <div className="ji-globos" key={ronda}>
          {r.opciones.map((o, i) => {
            const mala = malas.includes(o.id);
            const buena = acertada && o.id === r.palabra.id;
            return (
              <button
                key={o.id}
                type="button"
                className={`ji-globo${mala ? ' ji-globo-mal' : ''}${buena ? ' ji-globo-ok' : ''}`}
                style={{ animationDelay: `${(i % 3) * -0.7}s` }}
                onClick={() => elegir(o)}
                disabled={mala || (acertada && !buena)}
                aria-label={`Burbuja ${i + 1}`}
              >
                <span className="ji-globo-emoji" aria-hidden="true">{o.emoji}</span>
                {buena && <span className="ji-globo-texto">{r.texto}</span>}
              </button>
            );
          })}
        </div>

        {r.soloOido && !ayuda && HAY_VOZ && !acertada && (
          <div className="ji-acciones">
            <button type="button" className="ji-btn ji-btn-suave" onClick={() => setAyuda(true)}>
              Ver la palabra escrita
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================================
   🔤 NIVEL 4 · DELETREA
   ===================================================================== */
function Deletreo({ idioma, onTerminar }) {
  const lang = IDIOMAS[idioma];
  const rondas = useMemo(() => generarDeletreo(idioma), [idioma]);

  const [ronda, setRonda] = useState(0);
  const [puestas, setPuestas] = useState([]); // ids de letras, en orden
  const [estado, setEstado] = useState('armando'); // armando | mal | bien | revelada
  const [errores, setErrores] = useState(0);
  const [puntos, setPuntos] = useState(0);

  const r = rondas[ronda];
  const total = rondas.length;
  const letras = Array.from(r.objetivo);
  const letraDe = useMemo(() => Object.fromEntries(r.fichas.map((f) => [f.id, f.l])), [r]);
  const cerrada = estado === 'bien' || estado === 'revelada';

  useEffect(() => () => callar(), []);

  const limpiarError = () => {
    if (estado === 'mal') setEstado('armando');
  };

  const comprobar = (lista) => {
    const palabra = lista.map((id) => letraDe[id]).join('');
    if (palabra === r.objetivo) {
      sonar('ok');
      setEstado('bien');
      setPuntos((p) => p + puntosDeRonda({ errores, ayuda: false, rendido: false }));
      setTimeout(() => hablar(r.objetivo, lang.voz), 350);
    } else {
      sonar('mal');
      setErrores((e) => e + 1);
      setEstado('mal');
    }
  };

  const poner = (id) => {
    if (cerrada || puestas.includes(id) || puestas.length >= letras.length) return;
    limpiarError();
    const nueva = [...puestas, id];
    setPuestas(nueva);
    sonar('tap');
    if (nueva.length === letras.length) comprobar(nueva);
  };

  const quitar = (id) => {
    if (cerrada) return;
    limpiarError();
    setPuestas((p) => p.filter((x) => x !== id));
    sonar('tap');
  };

  const verRespuesta = () => {
    setPuestas(ordenLetras(r));
    setEstado('revelada');
    setTimeout(() => hablar(r.objetivo, lang.voz), 350);
  };

  const siguiente = () => {
    if (ronda >= total - 1) {
      onTerminar({
        estrellas: estrellasPorPuntos(puntos, total),
        detalle: `Palabras deletreadas: ${total} · Puntos: ${puntos} de ${total}`,
      });
      return;
    }
    setRonda((x) => x + 1);
    setPuestas([]);
    setEstado('armando');
    setErrores(0);
  };

  const burbuja =
    estado === 'bien'
      ? '¡Bien escrito! Escucha cómo suena.'
      : estado === 'revelada'
      ? 'Así se escribe. ¡Fíjate bien!'
      : estado === 'mal'
      ? 'Casi… las letras rojas no van ahí.'
      : `¿Cómo se escribe «${r.palabra.es}» en ${lang.nombre}?`;

  return (
    <>
      <Escenario burbuja={burbuja} estado={estado === 'bien' ? 'feliz' : estado === 'mal' ? 'triste' : ''} />

      <div className="ji-card">
        <div className="ji-card-cabecera">
          <p className="ji-eyebrow">
            {lang.bandera} Palabra {ronda + 1} de {total}
          </p>
          <Progreso total={total} actual={ronda} />
        </div>

        <div className="ji-dibujo">
          <span className="ji-dibujo-emoji" aria-hidden="true">{r.palabra.emoji}</span>
          <span className="ji-dibujo-es">{r.palabra.es}</span>
          <BotonAudio texto={r.objetivo} voz={lang.voz} />
        </div>

        <div key={errores} className={`ji-casillas${estado === 'mal' ? ' ji-sacude' : ''}`}>
          {letras.map((l, i) => {
            const id = puestas[i];
            const marca = id && estado === 'mal' ? (letraDe[id] === l ? 'ji-casilla-ok' : 'ji-casilla-mal') : '';
            return (
              <button
                key={i}
                type="button"
                className={`ji-casilla${id ? ' ji-casilla-llena' : ''} ${cerrada ? 'ji-casilla-ok' : marca}`}
                onClick={() => id && quitar(id)}
                disabled={!id || cerrada}
                aria-label={id ? `Letra ${letraDe[id]}, toca para quitar` : 'Casilla vacía'}
              >
                {id ? letraDe[id] : ''}
              </button>
            );
          })}
        </div>

        <div className="ji-banco" role="group" aria-label="Letras disponibles">
          {r.fichas.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`ji-letra${puestas.includes(f.id) ? ' ji-ficha-fantasma' : ''}`}
              onClick={() => poner(f.id)}
              disabled={puestas.includes(f.id) || cerrada}
              tabIndex={puestas.includes(f.id) ? -1 : 0}
            >
              {f.l}
            </button>
          ))}
        </div>

        {!cerrada ? (
          <div className="ji-acciones">
            {errores >= 2 ? (
              <button type="button" className="ji-btn ji-btn-suave" onClick={verRespuesta}>
                Ver respuesta
              </button>
            ) : (
              <button
                type="button"
                className="ji-btn ji-btn-suave"
                onClick={() => {
                  limpiarError();
                  setPuestas([]);
                }}
                disabled={puestas.length === 0}
              >
                Borrar
              </button>
            )}
          </div>
        ) : (
          <div className="ji-acciones">
            <button type="button" className="ji-btn" onClick={siguiente}>
              {ronda >= total - 1 ? 'Terminar' : 'Siguiente palabra →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================================
   💬 NIVEL 6 · CHARLA CON VIVI
   ===================================================================== */
function Charla({ idioma, onTerminar }) {
  const lang = IDIOMAS[idioma];
  const dialogo = useMemo(() => generarDialogo(idioma), [idioma]);
  const total = dialogo.turnos.length;

  const [mensajes, setMensajes] = useState([]); // { de: 'npc' | 'yo', texto, es }
  const [turno, setTurno] = useState(0);
  const [fase, setFase] = useState('escribiendo'); // escribiendo | eligiendo | respondido
  const [malas, setMalas] = useState([]); // índices de opciones equivocadas
  const [errores, setErrores] = useState(0);
  const [ayuda, setAyuda] = useState(false);
  const [puntos, setPuntos] = useState(0);
  const [reaccion, setReaccion] = useState('');
  const temporizadores = useRef([]);
  const finChat = useRef(null);

  const t = dialogo.turnos[turno];

  useEffect(
    () => () => {
      temporizadores.current.forEach(clearTimeout);
      callar();
    },
    []
  );

  // Cada turno: el personaje "escribe" un momento y luego habla
  useEffect(() => {
    setFase('escribiendo');
    const id = setTimeout(() => {
      const turnoActual = dialogo.turnos[turno];
      setMensajes((m) => [...m, { de: 'npc', texto: turnoActual.npc, es: turnoActual.npcEs }]);
      setFase('eligiendo');
      hablar(turnoActual.npc, lang.voz);
    }, 800);
    return () => clearTimeout(id);
  }, [turno, dialogo, lang.voz]);

  useEffect(() => {
    if (finChat.current && finChat.current.scrollIntoView) {
      finChat.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [mensajes, fase]);

  const elegir = (opcion, i) => {
    if (fase !== 'eligiendo' || malas.includes(i)) return;
    if (opcion.ok) {
      sonar('ok');
      setReaccion('😊');
      setFase('respondido');
      setMensajes((m) => [...m, { de: 'yo', texto: opcion.t, es: opcion.es }]);
      const nuevos = puntos + puntosDeRonda({ errores, ayuda, rendido: false });
      setPuntos(nuevos);
      const id = setTimeout(() => {
        if (turno >= total - 1) {
          onTerminar({
            estrellas: estrellasPorPuntos(nuevos, total),
            detalle: `Conversación completada · Puntos: ${nuevos} de ${total}`,
          });
          return;
        }
        setTurno((x) => x + 1);
        setMalas([]);
        setErrores(0);
        setAyuda(false);
        setReaccion('');
      }, 1000);
      temporizadores.current.push(id);
    } else {
      sonar('mal');
      setMalas((m) => [...m, i]);
      setErrores((e) => e + 1);
      setReaccion('🤔');
    }
  };

  const ultimoNpc = (() => {
    for (let i = mensajes.length - 1; i >= 0; i--) if (mensajes[i].de === 'npc') return i;
    return -1;
  })();

  return (
    <>
      <Escenario
        burbuja={dialogo.escena}
        estado={reaccion === '😊' ? 'feliz' : reaccion === '🤔' ? 'triste' : ''}
        cliente={dialogo.personaje}
        reaccion={reaccion || null}
      />

      <div className="ji-card">
        <div className="ji-card-cabecera">
          <p className="ji-eyebrow">
            {lang.bandera} Turno {turno + 1} de {total}
          </p>
          <Progreso total={total} actual={turno} />
        </div>

        <div className="ji-chat" aria-live="polite">
          {mensajes.map((m, i) => (
            <div key={i} className={`ji-msg ji-msg-${m.de}`}>
              <span className="ji-msg-texto">
                {m.texto}
                {ayuda && i === ultimoNpc && fase === 'eligiendo' && <small className="ji-traduccion">{m.es}</small>}
              </span>
              {m.de === 'npc' && <BotonAudio texto={m.texto} voz={lang.voz} />}
            </div>
          ))}
          {fase === 'escribiendo' && (
            <div className="ji-msg ji-msg-npc ji-escribiendo" aria-label="Escribiendo">
              <span /><span /><span />
            </div>
          )}
          <div ref={finChat} />
        </div>

        {fase === 'eligiendo' && (
          <div className="ji-respuestas">
            <p className="ji-nota">Elige tu respuesta:</p>
            {t.opciones.map((o, i) => (
              <button
                key={o.t}
                type="button"
                className={`ji-respuesta${malas.includes(i) ? ' ji-respuesta-mal' : ''}`}
                onClick={() => elegir(o, i)}
                disabled={malas.includes(i)}
              >
                <span>{o.t}</span>
                {ayuda && <small className="ji-traduccion">{o.es}</small>}
              </button>
            ))}
            <div className="ji-acciones">
              <button type="button" className="ji-btn ji-btn-suave" onClick={() => setAyuda(true)} disabled={ayuda}>
                ¿Qué significa?
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* =====================================================================
   PANTALLA PRINCIPAL
   ===================================================================== */
export default function JuegoIdiomas({ onVolver }) {
  const [fase, setFase] = useState('menu'); // menu | jugando | resultado
  const [idioma, setIdioma] = useState('en');
  const [actividad, setActividad] = useState(null);
  const [partida, setPartida] = useState(0); // cambia para reiniciar el nivel
  const [estrellas, setEstrellas] = useState(leerEstrellas);
  const [resumen, setResumen] = useState(null);

  useEffect(() => () => callar(), []);

  const empezar = (id) => {
    setActividad(id);
    setPartida((p) => p + 1);
    setResumen(null);
    setFase('jugando');
  };

  const terminar = (r) => {
    const clave = claveEstrellas(actividad, idioma);
    const nuevas = { ...estrellas, [clave]: Math.max(estrellas[clave] || 0, r.estrellas) };
    setEstrellas(nuevas);
    guardarEstrellas(nuevas);
    setResumen(r);
    sonar('win');
    setFase('resultado');
  };

  const atras = () => {
    callar();
    if (fase === 'menu') {
      if (typeof onVolver === 'function') onVolver();
      return;
    }
    setFase('menu');
  };

  const indiceActual = ACTIVIDADES.findIndex((a) => a.id === actividad);
  const actividadActual = ACTIVIDADES[indiceActual];
  const hayNivelSiguiente = indiceActual >= 0 && indiceActual < ACTIVIDADES.length - 1;
  const estrellasTotales = ACTIVIDADES.reduce((n, a) => n + (estrellas[claveEstrellas(a.id, idioma)] || 0), 0);

  const mensajeFinal = resumen
    ? [
        '',
        '¡Terminaste! Con práctica saldrá aún mejor.',
        '¡Muy bien! Vivi está orgullosa de ti.',
        '¡Excelente! Eres un políglota de verdad. 🌎',
      ][resumen.estrellas]
    : '';

  const clave = `${actividad}-${idioma}-${partida}`;

  return (
    <section className="ji-page">
      <div className="ji-wrap">
        <header className="ji-top">
          <button type="button" className="ji-atras" onClick={atras}>
            ← {fase === 'menu' ? 'Juegos' : 'Niveles'}
          </button>
          <h1 className="ji-titulo">Vivi políglota</h1>
        </header>

        {fase === 'menu' && (
          <>
            <Escenario burbuja="Hello! Olá! ¿Qué idioma practicamos hoy?" />

            <div className="ji-idiomas" role="group" aria-label="Idioma">
              {Object.values(IDIOMAS).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`ji-idioma${idioma === l.id ? ' ji-idioma-activo' : ''}`}
                  onClick={() => setIdioma(l.id)}
                  aria-pressed={idioma === l.id}
                >
                  <span aria-hidden="true">{l.bandera}</span> {l.nombre}
                </button>
              ))}
            </div>

            <p className="ji-total">
              {IDIOMAS[idioma].nombre}: <b>{estrellasTotales}</b> de {ACTIVIDADES.length * 3} ★
            </p>

            <div className="ji-lista">
              {ACTIVIDADES.map((a, i) => {
                const ganadas = estrellas[claveEstrellas(a.id, idioma)] || 0;
                return (
                  <button key={a.id} type="button" className="ji-actividad" onClick={() => empezar(a.id)}>
                    <span className="ji-actividad-emoji" aria-hidden="true">{a.emoji}</span>
                    <span className="ji-actividad-info">
                      <em className="ji-actividad-nivel">Nivel {i + 1}</em>
                      <strong>{a.nombre}</strong>
                      <small>{a.descripcion(idioma)}</small>
                    </span>
                    <span className="ji-estrellas" aria-label={`${ganadas} de 3 estrellas`}>
                      {[1, 2, 3].map((s) => (
                        <span key={s} className={s <= ganadas ? 'ji-estrella-on' : 'ji-estrella'}>★</span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {fase === 'jugando' && actividad === 'parejas' && <Parejas key={clave} idioma={idioma} onTerminar={terminar} />}
        {fase === 'jugando' && actividad === 'burbujas' && <Burbujas key={clave} idioma={idioma} onTerminar={terminar} />}
        {fase === 'jugando' && actividad === 'cafe' && <Cafe key={clave} idioma={idioma} onTerminar={terminar} />}
        {fase === 'jugando' && actividad === 'deletreo' && <Deletreo key={clave} idioma={idioma} onTerminar={terminar} />}
        {fase === 'jugando' && actividad === 'frases' && <Frases key={clave} idioma={idioma} onTerminar={terminar} />}
        {fase === 'jugando' && actividad === 'charla' && <Charla key={clave} idioma={idioma} onTerminar={terminar} />}

        {fase === 'resultado' && resumen && actividadActual && (
          <>
            <Escenario burbuja={mensajeFinal} estado="feliz" />
            <div className="ji-card ji-resultado">
              <p className="ji-eyebrow">
                Nivel {indiceActual + 1} · {actividadActual.emoji} {actividadActual.nombre} · {IDIOMAS[idioma].nombre}
              </p>
              <div className="ji-estrellas ji-estrellas-grandes" aria-label={`${resumen.estrellas} de 3 estrellas`}>
                {[1, 2, 3].map((s) => (
                  <span key={s} className={s <= resumen.estrellas ? 'ji-estrella-on' : 'ji-estrella'}>★</span>
                ))}
              </div>
              <p className="ji-detalle">{resumen.detalle}</p>
              <div className="ji-acciones">
                <button type="button" className="ji-btn ji-btn-suave" onClick={() => empezar(actividad)}>
                  Repetir
                </button>
                {hayNivelSiguiente ? (
                  <button type="button" className="ji-btn" onClick={() => empezar(ACTIVIDADES[indiceActual + 1].id)}>
                    Siguiente nivel
                  </button>
                ) : (
                  <button type="button" className="ji-btn" onClick={() => setFase('menu')}>
                    Niveles
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
