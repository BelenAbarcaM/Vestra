import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './JuegoF1.css';
import vivi from '../assets/Vivi_f1.png';
import {
  NIVELES,
  PARTES,
  SELECCION_INICIAL,
  PISTA_M,
  PESO_MIN_G,
  ZONA_DRS,
  PENAL_SALIDA_FALSA,
  MAX_ESTRELLAS_NIVEL,
  calcularCoche,
  diagnostico,
  crearSim,
  avanzar,
  pulsarDrs,
  tiempoTotal,
  calcularEstrellas,
  textoReaccion,
  textoDrs,
  totalEstrellas,
  rangoPara,
  validarNivel,
  REACCION_MAX,
} from './JuegoF1_logica';

/* =====================================================================
   JUEGO DE F1 IN SCHOOLS · "Taller y pista"
   1) Taller: arma tu auto de CO₂ (pesa mínimo 48 g, ¡o te descalifican!)
   2) Salida: 5 luces rojas; toca apenas se apaguen (salida en falso = castigo)
   3) Carrera en cámara lenta: abre el DRS dentro de la zona verde
   - Todo corre en el teléfono: sin backend ni base de datos.
   - Estrellas, récords y sonido se guardan en el dispositivo (localStorage).
   - Las carreras viven en JuegoF1_logica.js (NIVELES), las piezas en PARTES.
   ===================================================================== */

const CAMARA_LENTA = 0.25; // la carrera dura ~1.3 s: se ve 4 veces más lenta para poder usar el DRS
const LUZ_MS = 700; // lo que tarda en encenderse cada luz roja
const CLAVE_ESTRELLAS = 'juego_f1_estrellas';
const CLAVE_RECORDS = 'juego_f1_records';
const CLAVE_SONIDO = 'juego_f1_sonido';

// Medidas del dibujo de la pista (unidades del SVG)
const XC0 = 32; // centro del auto en la salida
const AVANCE = 255; // lo que recorre el auto en pantalla durante los 20 m
const xCentro = (m) => XC0 + (m / PISTA_M) * AVANCE;
const xFrente = (m) => XC0 + 25 + (m / PISTA_M) * AVANCE; // donde está la punta del auto

Object.values(NIVELES).forEach((nivel) => {
  const problemas = validarNivel(nivel);
  if (problemas.length) console.warn(`[JuegoF1] Carrera "${nivel.id}": ${problemas.join(' · ')}`);
});

/* ---------- progreso guardado ---------- */
function leerJson(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || {};
  } catch (error) {
    return {};
  }
}

function guardarJson(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    /* si no se puede guardar, el juego sigue funcionando */
  }
}

function leerSonido() {
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== '0';
  } catch (error) {
    return true;
  }
}

function guardarSonido(activo) {
  try {
    localStorage.setItem(CLAVE_SONIDO, activo ? '1' : '0');
  } catch (error) {
    /* no pasa nada */
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

function tono(ctx, cuando, freq, dur, tipo, vol, freqFin) {
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, cuando);
  if (freqFin) osc.frequency.exponentialRampToValueAtTime(freqFin, cuando + dur);
  ganancia.gain.setValueAtTime(0.0001, cuando);
  ganancia.gain.exponentialRampToValueAtTime(vol, cuando + 0.01);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
  osc.connect(ganancia);
  ganancia.connect(ctx.destination);
  osc.start(cuando);
  osc.stop(cuando + dur + 0.03);
}

const SONIDOS = {
  toque: (c, t) => tono(c, t, 640, 0.05, 'triangle', 0.1),
  luz: (c, t) => tono(c, t, 520, 0.12, 'square', 0.07),
  go: (c, t) => tono(c, t, 1040, 0.35, 'square', 0.09),
  drs: (c, t) => tono(c, t, 500, 0.25, 'sawtooth', 0.08, 1400),
  error: (c, t) => tono(c, t, 300, 0.2, 'square', 0.08, 170),
  fallo: (c, t) => {
    tono(c, t, 330, 0.15, 'square', 0.08);
    tono(c, t + 0.17, 220, 0.28, 'square', 0.08);
  },
  exito: (c, t) => [523, 659, 784, 1047].forEach((f, i) => tono(c, t + i * 0.09, f, 0.2, 'triangle', 0.16)),
};

function sonar(nombre, activo) {
  if (!activo) return;
  const ctx = obtenerAudio();
  if (ctx) SONIDOS[nombre](ctx, ctx.currentTime);
}

// Motor: un zumbido continuo cuyo tono sube con la velocidad
function encenderMotor() {
  const ctx = obtenerAudio();
  if (!ctx) return null;
  const osc = ctx.createOscillator();
  const ganancia = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 90;
  ganancia.gain.value = 0.035;
  osc.connect(ganancia);
  ganancia.connect(ctx.destination);
  osc.start();
  return { osc, ganancia, ctx };
}

function tonoMotor(motor, velocidad) {
  if (motor) motor.osc.frequency.setTargetAtTime(90 + velocidad * 14, motor.ctx.currentTime, 0.03);
}

function apagarMotor(motor) {
  if (!motor) return;
  motor.ganancia.gain.setTargetAtTime(0.0001, motor.ctx.currentTime, 0.05);
  motor.osc.stop(motor.ctx.currentTime + 0.3);
}

/* ---------- dibujo del auto (cambia con las piezas elegidas) ----------
   Se dibuja de lado, mirando a la derecha. Centro en (0,0), suelo en y = 13. */
const CUERPOS = {
  cuna: 'M-22 5 L-22 -3 Q-20 -5 -14 -5.5 L2 -7.5 L25 3 Q25.5 5 23 5 Z',
  gota: 'M-22 5 L-22 -4 Q-20 -8 -12 -9 Q-2 -10.5 8 -7 Q20 -3 25.5 3.5 Q25.5 5 23 5 Z',
  plana: 'M-22 5 L-22 -6 L-18 -8 L12 -8 L21 -2.5 L25 -1.5 Q25.5 1 25 5 Z',
};
const CASCO_Y = { cuna: -9.5, gota: -11.5, plana: -10.5 };
const LLANTA = { lig: '#e6ebf2', est: '#e5313a', anc: '#ffd23f' };

function Auto({ sel, gira = false }) {
  const radio = { lig: 5, est: 6, anc: 7.5 }[sel.ruedas];
  const cy = CASCO_Y[sel.carroceria];

  return (
    <g className={gira ? 'jf-gira' : ''}>
      <defs>
        <linearGradient id="jfCuerpo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fe9f5" />
          <stop offset="0.5" stopColor="#0dadc5" />
          <stop offset="1" stopColor="#0a7a8e" />
        </linearGradient>
        <linearGradient id="jfRojo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="1" stopColor="#d12a33" />
        </linearGradient>
        <linearGradient id="jfPlata" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c9ced8" />
          <stop offset="1" stopColor="#8a90a0" />
        </linearGradient>
        <linearGradient id="jfOro" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe98a" />
          <stop offset="1" stopColor="#d9a21b" />
        </linearGradient>
        <clipPath id="jfClip">
          <path d={CUERPOS[sel.carroceria]} />
        </clipPath>
      </defs>

      {/* estela de velocidad (solo mientras corre) */}
      <g className="jf-estela">
        <path d="M-30 -2 H-42 M-30 4 H-48 M-30 9.5 H-40" />
      </g>

      {/* sombra en el suelo */}
      <ellipse className="jf-sombra" cx="1" cy="13.4" rx="26" ry="2" />

      {/* cartucho de CO₂ asomando atrás */}
      <rect x="-28.5" y="-2.2" width="8" height="4.6" rx="2.2" fill="url(#jfPlata)" stroke="#1f3b57" strokeWidth="0.8" />
      <path d="M-26 -2 V2.2" stroke="#1f3b57" strokeWidth="0.6" opacity="0.5" />

      {/* alerón trasero */}
      {sel.aleron === 'peq' && (
        <g>
          <rect x="-22.6" y="-5.5" width="2.2" height="3.6" fill="#2b2f3a" />
          <rect x="-26.5" y="-11.5" width="9" height="6.5" rx="1.8" fill="url(#jfRojo)" stroke="#1f3b57" strokeWidth="0.9" />
          <rect x="-26.5" y="-8.7" width="9" height="1.1" fill="#fff" opacity="0.9" />
        </g>
      )}
      {sel.aleron === 'gra' && (
        <g>
          <rect x="-23.3" y="-6.5" width="2.6" height="4.5" fill="#2b2f3a" />
          <rect x="-29.5" y="-18" width="14" height="12" rx="2.2" fill="url(#jfRojo)" stroke="#1f3b57" strokeWidth="0.9" />
          <rect x="-29.5" y="-13.6" width="14" height="1.1" fill="#fff" opacity="0.9" />
          <rect x="-29.5" y="-10.4" width="14" height="1.1" fill="#fff" opacity="0.9" />
        </g>
      )}

      {/* carrocería */}
      <g clipPath="url(#jfClip)">
        <rect x="-23" y="-12" width="50" height="19" fill="url(#jfCuerpo)" />
        <rect x="-23" y="-2.6" width="50" height="2.4" fill="#fff" opacity="0.92" />
        <rect x="-23" y="-0.2" width="50" height="0.9" fill="#e5313a" />
        <rect x="-23" y="2.2" width="50" height="4" fill="#000" opacity="0.16" />
        <ellipse cx="-1" cy="-7.2" rx="15" ry="2.1" fill="#fff" opacity="0.3" />
      </g>
      <path d={CUERPOS[sel.carroceria]} fill="none" stroke="#1f3b57" strokeWidth="1.1" strokeLinejoin="round" />

      {/* número y estrella */}
      <circle cx="-1.5" cy="-1.1" r="3.4" fill="#fff" stroke="#e5313a" strokeWidth="0.8" />
      <text className="jf-numero" x="-1.5" y="0.7" textAnchor="middle" fontSize="4.8" fontWeight="800" fill="#e5313a">7</text>
      <path
        d="M9 -4 L9.9 -1.8 L12.3 -1.7 L10.4 -0.2 L11.1 2.1 L9 0.8 L6.9 2.1 L7.6 -0.2 L5.7 -1.7 L8.1 -1.8 Z"
        fill="url(#jfOro)"
        stroke="#e5313a"
        strokeWidth="0.35"
      />

      {/* piloto: casco con visera y halo */}
      <circle cx="-2" cy={cy} r="3.7" fill="url(#jfOro)" stroke="#1f3b57" strokeWidth="0.9" />
      <path d={`M-2 ${cy - 3.5} V${cy + 3.5}`} stroke="#e5313a" strokeWidth="1.1" opacity="0.9" />
      <ellipse cx="-0.4" cy={cy - 0.3} rx="2.2" ry="1.5" fill="#1f3b57" />
      <circle cx="0.2" cy={cy - 0.8} r="0.6" fill="#fff" />
      <path d={`M-6.6 ${cy + 3.6} Q-2 ${cy - 6} 3.4 ${cy + 3.2}`} fill="none" stroke="#2b2f3a" strokeWidth="1.1" strokeLinecap="round" />

      {/* lastre */}
      {sel.lastre !== 'l0' && (
        <g>
          <rect x={sel.lastre === 'l2' ? -11 : -7} y="4.6" width={sel.lastre === 'l2' ? 22 : 14} height="4.2" rx="1.5" fill="url(#jfOro)" stroke="#1f3b57" strokeWidth="0.9" />
          <circle cx={sel.lastre === 'l2' ? -7.5 : -4} cy="6.7" r="0.8" fill="#8a5f00" />
          <circle cx={sel.lastre === 'l2' ? 7.5 : 4} cy="6.7" r="0.8" fill="#8a5f00" />
        </g>
      )}

      {/* alerón delantero */}
      <rect x="15" y="5.2" width="11.5" height="2.3" rx="1.1" fill="url(#jfRojo)" stroke="#1f3b57" strokeWidth="0.8" />
      <rect x="24.6" y="2.4" width="2" height="5.6" rx="0.9" fill="url(#jfRojo)" stroke="#1f3b57" strokeWidth="0.8" />

      {/* ruedas: llanta de color según el tipo, con rayos que giran */}
      {[-13, 14].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={13 - radio} r={radio} fill="#23262f" stroke="#1f3b57" strokeWidth="0.9" />
          <circle cx={cx} cy={13 - radio} r={radio * 0.62} fill={LLANTA[sel.ruedas]} stroke="#1f3b57" strokeWidth="0.7" />
          <g className="jf-radios" style={{ transformOrigin: `${cx}px ${13 - radio}px` }}>
            {[0, 72, 144, 216, 288].map((g) => (
              <line
                key={g}
                x1={cx}
                y1={13 - radio}
                x2={cx + radio * 0.55 * Math.cos((g * Math.PI) / 180)}
                y2={13 - radio + radio * 0.55 * Math.sin((g * Math.PI) / 180)}
                stroke="#1f3b57"
                strokeWidth="0.9"
                strokeLinecap="round"
                opacity="0.75"
              />
            ))}
          </g>
          <circle cx={cx} cy={13 - radio} r={radio * 0.2} fill="#2b2f3a" />
        </g>
      ))}
    </g>
  );
}

/* ---------- la pista de 20 m ---------- */
function Pista({ sel, autoRef, drs, gira }) {
  const zonaX = xFrente(ZONA_DRS.ini);
  const zonaAncho = xFrente(ZONA_DRS.fin) - zonaX;
  return (
    <svg className="jf-pista" viewBox="0 0 340 122" role="img" aria-label="Pista de 20 metros con la zona de DRS en verde">
      <rect className="jf-cielo" x="0" y="0" width="340" height="90" />
      <rect className="jf-asfalto" x="0" y="90" width="340" height="14" />
      <rect className={`jf-zona${drs === 'abierto' ? ' jf-zona-viva' : ''}`} x={zonaX} y="90" width={zonaAncho} height="14" />
      <text className="jf-zona-texto" x={zonaX + zonaAncho / 2} y="68" textAnchor="middle">
        DRS
      </text>
      <path className="jf-zona-flecha" d={`M${zonaX} 74 H${zonaX + zonaAncho}`} />

      {[0, 5, 10, 15, 20].map((m) => (
        <g key={m}>
          <line className="jf-marca" x1={xFrente(m)} x2={xFrente(m)} y1="104" y2="108" />
          <text className="jf-metro" x={xFrente(m)} y="119" textAnchor="middle">
            {m} m
          </text>
        </g>
      ))}

      {/* meta a cuadros */}
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <rect className={i % 2 ? 'jf-cuadro-a' : 'jf-cuadro-b'} x={xFrente(20)} y={68 + i * 4} width="4" height="4" />
          <rect className={i % 2 ? 'jf-cuadro-b' : 'jf-cuadro-a'} x={xFrente(20) + 4} y={68 + i * 4} width="4" height="4" />
        </g>
      ))}

      <g ref={autoRef} transform={`translate(${XC0} 77)`}>
        <Auto sel={sel} gira={gira} />
      </g>
    </svg>
  );
}

/* ---------- pantalla del juego ---------- */
export default function JuegoF1({ onVolver }) {
  const [fase, setFase] = useState('niveles'); // niveles | taller | salida | carrera | resultado
  const [nivelIdx, setNivelIdx] = useState(0);
  const [sel, setSel] = useState(SELECCION_INICIAL);
  const [estrellas, setEstrellas] = useState(() => leerJson(CLAVE_ESTRELLAS));
  const [records, setRecords] = useState(() => leerJson(CLAVE_RECORDS));
  const [sonido, setSonido] = useState(leerSonido);
  const [luces, setLuces] = useState(0); // luces rojas encendidas (0 a 5)
  const [apagadas, setApagadas] = useState(false); // ¡las luces se apagaron: toca!
  const [drs, setDrs] = useState('listo'); // listo | abierto | usado | cerrado | perdido
  const [aviso, setAviso] = useState('');
  const [resultado, setResultado] = useState(null);
  const [pulso, setPulso] = useState(0); // sube en cada evento: Vivi rebota
  const [golpe, setGolpe] = useState(0); // sube en cada toque: la bandera salta

  const nivel = NIVELES[nivelIdx];
  const coche = useMemo(() => calcularCoche(sel, nivel), [sel, nivel]);
  const diag = diagnostico(coche, nivel);

  const rafRef = useRef(0);
  const timersRef = useRef([]);
  const simRef = useRef(null);
  const motorRef = useRef(null);
  const autoRef = useRef(null);
  const tiempoRef = useRef(null);
  const velRef = useRef(null);
  const tLuzRef = useRef(null); // momento exacto en que se apagaron las luces
  const salidaActivaRef = useRef(false);
  const reaccionRef = useRef(0);
  const falsasRef = useRef(0);
  const sonidoRef = useRef(sonido);
  sonidoRef.current = sonido;

  const limpiarTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Detiene todo lo que esté corriendo (animación, luces y motor)
  const cortar = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    salidaActivaRef.current = false;
    apagarMotor(motorRef.current);
    motorRef.current = null;
  }, []);

  useEffect(() => cortar, [cortar]);

  const cambiarSonido = () => {
    const nuevo = !sonido;
    setSonido(nuevo);
    guardarSonido(nuevo);
    sonar('toque', nuevo);
  };

  /* ---------- la carrera ---------- */
  const pintar = (sim) => {
    if (autoRef.current) autoRef.current.setAttribute('transform', `translate(${xCentro(sim.x)} 77)`);
    if (tiempoRef.current) tiempoRef.current.textContent = `${sim.t.toFixed(2)} s`;
    if (velRef.current) velRef.current.textContent = `${Math.round(sim.v * 3.6)} km/h`;
    tonoMotor(motorRef.current, sim.v);
  };

  const terminar = (sim) => {
    cortar();
    const total = tiempoTotal({
      pista: sim.t,
      reaccion: reaccionRef.current,
      salidasFalsas: falsasRef.current,
      coche,
    });
    const nuevasEstrellas = calcularEstrellas(total, nivel.rival);
    const esRecord = !records[nivel.id] || total < records[nivel.id];

    setEstrellas((prev) => {
      const nuevas = { ...prev, [nivel.id]: Math.max(prev[nivel.id] || 0, nuevasEstrellas) };
      guardarJson(CLAVE_ESTRELLAS, nuevas);
      return nuevas;
    });
    if (esRecord) {
      const nuevos = { ...records, [nivel.id]: total };
      setRecords(nuevos);
      guardarJson(CLAVE_RECORDS, nuevos);
    }
    setResultado({
      pista: sim.t,
      reaccion: reaccionRef.current,
      falsas: falsasRef.current,
      penalEstab: coche.penalEstab,
      total,
      estrellas: nuevasEstrellas,
      drs: sim.drs,
      drsMetros: sim.drsMetros,
      esRecord,
    });
    setFase('resultado');
    sonar(nuevasEstrellas > 0 ? 'exito' : 'fallo', sonidoRef.current);
  };

  const arrancar = (reaccion) => {
    cortar();
    reaccionRef.current = reaccion;
    simRef.current = crearSim();
    motorRef.current = sonidoRef.current ? encenderMotor() : null;
    setDrs('listo');
    setFase('carrera');

    let ultimo = performance.now();
    const bucle = (ahora) => {
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      const sim = simRef.current;
      const antes = sim.drs;
      avanzar(sim, coche, dt * CAMARA_LENTA);
      pintar(sim);
      if (sim.drs !== antes) setDrs(sim.drs);
      if (sim.fin) {
        terminar(sim);
        return;
      }
      rafRef.current = requestAnimationFrame(bucle);
    };
    rafRef.current = requestAnimationFrame(bucle);
  };

  /* ---------- la salida: luces rojas ---------- */
  const iniciarSalida = (falsas = 0) => {
    cortar();
    falsasRef.current = falsas;
    tLuzRef.current = null;
    salidaActivaRef.current = true;
    setApagadas(false);
    setLuces(0);
    setAviso('');
    setFase('salida');

    for (let i = 1; i <= 5; i++) {
      timersRef.current.push(
        setTimeout(() => {
          setLuces(i);
          sonar('luz', sonidoRef.current);
        }, LUZ_MS * i)
      );
    }
    const espera = LUZ_MS * 5 + 500 + Math.random() * 1600;
    timersRef.current.push(
      setTimeout(() => {
        tLuzRef.current = performance.now();
        setLuces(0);
        setApagadas(true);
        sonar('go', sonidoRef.current);
      }, espera)
    );
    // si no tocas, el auto sale solo… pero con la peor reacción
    timersRef.current.push(
      setTimeout(() => {
        if (salidaActivaRef.current) arrancar(REACCION_MAX);
      }, espera + REACCION_MAX * 1000)
    );
  };

  const tocarSalida = (evento) => {
    evento.preventDefault();
    if (fase !== 'salida' || !salidaActivaRef.current) return;
    setGolpe((g) => g + 1);
    if (tLuzRef.current === null) {
      // ¡se adelantó! castigo y se repiten las luces
      sonar('fallo', sonidoRef.current);
      iniciarSalida(falsasRef.current + 1);
      setAviso(`¡Salida en falso! +${PENAL_SALIDA_FALSA.toFixed(2)} s. Se repiten las luces.`);
      return;
    }
    arrancar(Math.min((performance.now() - tLuzRef.current) / 1000, REACCION_MAX));
  };

  const tocarDrs = (evento) => {
    evento.preventDefault();
    if (fase !== 'carrera' || !simRef.current) return;
    const estado = pulsarDrs(simRef.current);
    setDrs(estado);
    setPulso((p) => p + 1);
    sonar(estado === 'abierto' ? 'drs' : 'error', sonidoRef.current);
  };

  /* ---------- acciones del jugador ---------- */
  const abrirNivel = (i) => {
    cortar();
    setNivelIdx(i);
    setResultado(null);
    setAviso('');
    setDrs('listo');
    setFase('taller');
  };

  const elegirPieza = (parteId, opcionId) => {
    sonar('toque', sonido);
    setGolpe((g) => g + 1);
    setAviso('');
    setSel((s) => ({ ...s, [parteId]: opcionId }));
  };

  const verificarYSalir = () => {
    if (!coche.legal) {
      sonar('error', sonido);
      setAviso(`¡Descalificado en la revisión técnica! Pesas ${coche.peso} g y el mínimo es ${PESO_MIN_G} g.`);
      return;
    }
    iniciarSalida(0);
  };

  const atras = () => {
    if (fase === 'niveles') {
      if (typeof onVolver === 'function') onVolver();
      return;
    }
    cortar();
    setFase(fase === 'taller' ? 'niveles' : 'taller');
  };

  /* ---------- textos ---------- */
  const total = totalEstrellas(estrellas);
  const maximo = NIVELES.length * MAX_ESTRELLAS_NIVEL;
  const hayNivelSiguiente = nivelIdx < NIVELES.length - 1;

  let estadoVivi = '';
  if (fase === 'resultado' && resultado) estadoVivi = resultado.estrellas >= 2 ? 'jf-feliz' : resultado.estrellas === 0 ? 'jf-triste' : '';

  const mensajeResultado = resultado
    ? [
        '¡Casi! El rival fue más rápido. Ajusta el auto.',
        '¡Podio! Un poquito más y le ganas.',
        '¡Le ganaste al rival!',
        '¡Pole position! Vivi te quiere de piloto.',
      ][resultado.estrellas]
    : '';

  const mensajesDrs = {
    listo: 'Toca DRS cuando el auto entre a la zona verde.',
    abierto: '¡DRS abierto! Menos aire, más velocidad.',
    usado: '¡Buen DRS! Ahora, a la meta.',
    cerrado: 'Demasiado pronto: el DRS se bloqueó.',
    perdido: 'Se acabó la zona de DRS.',
  };

  let burbuja = '';
  if (fase === 'niveles') burbuja = '¡Bienvenido al taller! Elige una carrera.';
  if (fase === 'taller') burbuja = aviso || nivel.briefing;
  if (fase === 'salida') burbuja = aviso || (apagadas ? '¡YA!' : 'Espera a que se apaguen las luces…');
  if (fase === 'carrera') burbuja = mensajesDrs[drs];
  if (fase === 'resultado') burbuja = mensajeResultado;

  const estrellasDe = (cantidad, claseOn, claseOff) =>
    [1, 2, 3].map((s) => (
      <span key={s} className={s <= cantidad ? claseOn : claseOff}>
        ★
      </span>
    ));

  const fmt = (s) => `${s.toFixed(3)} s`;

  return (
    <section className="jf-page">
      <div className="jf-wrap">
        <header className="jf-top">
          <button type="button" className="jf-atras" onClick={atras}>
            ← {fase === 'niveles' ? 'Juegos' : fase === 'taller' ? 'Carreras' : 'Taller'}
          </button>
          <h1 className="jf-titulo">F1 en el cole</h1>
          <button
            type="button"
            className="jf-sonido"
            onClick={cambiarSonido}
            aria-pressed={sonido}
            aria-label={sonido ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {sonido ? '🔊' : '🔇'}
          </button>
        </header>

        {/* Vivi y su bandera */}
        <div className="jf-escenario">
          <div className="jf-burbuja" role="status" aria-live="polite">
            {burbuja}
          </div>
          <div className={`jf-vivi-zona ${estadoVivi}`}>
            <img
              className={`jf-vivi ${pulso > 0 ? (pulso % 2 ? 'jf-rebote-a' : 'jf-rebote-b') : ''}`}
              src={vivi}
              alt="Vivi, la nutria"
              draggable="false"
            />
            <span className={`jf-bandera ${golpe > 0 ? (golpe % 2 ? 'jf-golpe-a' : 'jf-golpe-b') : ''}`} aria-hidden="true">
              🏁
            </span>
          </div>
        </div>

        {fase === 'niveles' && (
          <>
            <div className="jf-rango">
              <span className="jf-rango-nombre">{rangoPara(total)}</span>
              <span className="jf-rango-total">
                ★ {total}/{maximo}
              </span>
            </div>
            <div className="jf-niveles">
              {NIVELES.map((n, i) => (
                <button key={n.id} type="button" className="jf-nivel" onClick={() => abrirNivel(i)}>
                  <span className="jf-nivel-num">{i + 1}</span>
                  <span className="jf-nivel-info">
                    <strong>{n.nombre}</strong>
                    <small>
                      {n.clima} · {n.descripcion}
                    </small>
                    {records[n.id] && <small className="jf-record">Récord: {fmt(records[n.id])}</small>}
                  </span>
                  <span className="jf-estrellas" aria-label={`${estrellas[n.id] || 0} de 3 estrellas`}>
                    {estrellasDe(estrellas[n.id] || 0, 'jf-estrella-on', 'jf-estrella')}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {fase === 'taller' && (
          <div className="jf-card">
            <p className="jf-eyebrow">
              Carrera #{nivelIdx + 1} · {nivel.nombre}
            </p>
            <div className="jf-rival">
              <span>{nivel.clima}</span>
              <span>
                🏎️ {nivel.rivalNombre}: <b>{fmt(nivel.rival)}</b>
              </span>
            </div>

            <svg className="jf-preview" viewBox="-40 -24 80 44" role="img" aria-label="Tu auto">
              <ellipse className="jf-podio" cx="0" cy="15" rx="36" ry="4" />
              <ellipse className="jf-podio jf-podio-2" cx="0" cy="14.4" rx="28" ry="2.6" />
              <g className="jf-flota-auto">
                <Auto sel={sel} />
              </g>
              <path className="jf-brillo" d="M-33 -14 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2 Z" />
              <path className="jf-brillo jf-brillo-2" d="M31 -17 l0.9 2 2 0.9 -2 0.9 -0.9 2 -0.9 -2 -2 -0.9 2 -0.9 Z" />
            </svg>

            {PARTES.map((parte) => (
              <div key={parte.id} className="jf-parte">
                <div className="jf-parte-cab">
                  <strong>{parte.nombre}</strong>
                  <small>{parte.ayuda}</small>
                </div>
                <div className="jf-opciones">
                  {parte.opciones.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`jf-opcion${sel[parte.id] === o.id ? ' jf-opcion-sel' : ''}`}
                      aria-pressed={sel[parte.id] === o.id}
                      onClick={() => elegirPieza(parte.id, o.id)}
                    >
                      <span className="jf-opcion-emoji" aria-hidden="true">
                        {o.emoji}
                      </span>
                      <span className="jf-opcion-nombre">{o.nombre}</span>
                      <small>
                        {o.peso} g · estab {o.estab}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="jf-stats">
              <div className="jf-stat">
                <span>Peso</span>
                <div className="jf-barra">
                  <i className={coche.legal ? '' : 'jf-mal'} style={{ width: `${Math.min(100, (coche.peso / 80) * 100)}%` }} />
                  <em className="jf-minimo" style={{ left: `${(PESO_MIN_G / 80) * 100}%` }} title="Peso mínimo" />
                </div>
                <b className={coche.legal ? '' : 'jf-texto-mal'}>{coche.peso} g</b>
              </div>
              <div className="jf-stat">
                <span>Aire</span>
                <div className="jf-barra">
                  <i style={{ width: `${Math.min(100, (coche.cdAire / 0.9) * 100)}%` }} />
                </div>
                <b>Cd {coche.cdAire.toFixed(2)}</b>
              </div>
              <div className="jf-stat">
                <span>Estabilidad</span>
                <div className="jf-barra">
                  <i className={coche.faltaEstab ? 'jf-aviso' : ''} style={{ width: `${Math.min(100, (coche.estab / 14) * 100)}%` }} />
                  {nivel.estabMin > 0 && (
                    <em className="jf-minimo" style={{ left: `${(nivel.estabMin / 14) * 100}%` }} title="Estabilidad que pide la pista" />
                  )}
                </div>
                <b className={coche.faltaEstab ? 'jf-texto-aviso' : ''}>
                  {coche.estab}
                  {nivel.estabMin > 0 ? `/${nivel.estabMin}` : ''}
                </b>
              </div>
            </div>

            <p className={`jf-diag jf-diag-${diag.tipo}`}>{diag.texto}</p>

            <div className="jf-acciones">
              <button type="button" className="jf-btn" onClick={verificarYSalir}>
                🏁 Revisión técnica y a la parrilla
              </button>
            </div>
          </div>
        )}

        {(fase === 'salida' || fase === 'carrera' || fase === 'resultado') && (
          <div className="jf-card">
            <p className="jf-eyebrow">
              Carrera #{nivelIdx + 1} · {nivel.nombre}
            </p>

            <Pista sel={sel} autoRef={autoRef} drs={drs} gira={fase === 'carrera'} />

            {fase === 'salida' && (
              <>
                <div className={`jf-luces${apagadas ? ' jf-luces-go' : ''}`} aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={`jf-luz${luces >= n ? ' jf-luz-on' : ''}`} />
                  ))}
                </div>
                <button type="button" className={`jf-gigante${apagadas ? ' jf-gigante-go' : ''}`} onPointerDown={tocarSalida}>
                  {apagadas ? '¡YA!' : 'Espera…'}
                  <small>Toca cuando se apaguen las luces</small>
                </button>
              </>
            )}

            {fase === 'carrera' && (
              <>
                <div className="jf-marcador">
                  <span ref={tiempoRef}>0.00 s</span>
                  <span ref={velRef}>0 km/h</span>
                </div>
                <button
                  type="button"
                  className={`jf-gigante jf-gigante-drs jf-drs-${drs}`}
                  disabled={drs !== 'listo'}
                  onPointerDown={tocarDrs}
                >
                  DRS
                  <small>{drs === 'listo' ? 'Tócalo dentro de la zona verde' : mensajesDrs[drs]}</small>
                </button>
              </>
            )}

            {fase === 'resultado' && resultado && (
              <div className="jf-resultado">
                <div className="jf-estrellas jf-estrellas-grandes" aria-label={`${resultado.estrellas} de 3 estrellas`}>
                  {estrellasDe(resultado.estrellas, 'jf-estrella-on', 'jf-estrella')}
                </div>
                <p className="jf-tiempo">{fmt(resultado.total)}</p>
                <p className="jf-texto">
                  {resultado.total <= nivel.rival
                    ? `${fmt(nivel.rival - resultado.total)} más rápido que ${nivel.rivalNombre}`
                    : `${fmt(resultado.total - nivel.rival)} más lento que ${nivel.rivalNombre}`}
                  {resultado.esRecord ? ' · ¡Nuevo récord!' : ''}
                </p>
                <ul className="jf-datos">
                  <li>
                    Reacción: <b>{fmt(resultado.reaccion)}</b> · {textoReaccion(resultado.reaccion)}
                  </li>
                  <li>
                    Pista (20 m): <b>{fmt(resultado.pista)}</b>
                  </li>
                  <li>{textoDrs(resultado.drs, resultado.drsMetros)}</li>
                  {resultado.falsas > 0 && (
                    <li className="jf-texto-aviso">
                      Salidas en falso: <b>+{fmt(resultado.falsas * PENAL_SALIDA_FALSA)}</b>
                    </li>
                  )}
                  {resultado.penalEstab > 0 && (
                    <li className="jf-texto-aviso">
                      Auto inestable: <b>+{fmt(resultado.penalEstab)}</b>
                    </li>
                  )}
                  <li>
                    Rango: <b>{rangoPara(total)}</b> · ★ {total}/{maximo}
                  </li>
                </ul>
                <div className="jf-leccion">
                  <p className="jf-eyebrow">{nivel.concepto}</p>
                  <p>{nivel.leccion}</p>
                </div>
                <div className="jf-acciones">
                  <button type="button" className="jf-btn jf-btn-suave" onClick={() => abrirNivel(nivelIdx)}>
                    Ajustar auto
                  </button>
                  {resultado.estrellas > 0 && hayNivelSiguiente && (
                    <button type="button" className="jf-btn" onClick={() => abrirNivel(nivelIdx + 1)}>
                      Siguiente carrera
                    </button>
                  )}
                  {resultado.estrellas > 0 && !hayNivelSiguiente && (
                    <button type="button" className="jf-btn" onClick={() => { cortar(); setFase('niveles'); }}>
                      Carreras
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
