import React, { useCallback, useEffect, useRef, useState } from 'react';
import './JuegoFutbol.css';
import vivi from '../assets/Vivi_futbol.png';
import {
  NIVELES,
  MAX_ESTRELLAS_NIVEL,
  S_MURO,
  SALTO_MURO,
  ZONA_POTENCIA,
  RADIO_DIANA,
  DURACION_SALTO_VIVI,
  DEMORA_SALTO_VIVI,
  limitar,
  potenciaEn,
  infoPotencia,
  generarEscena,
  trayectoria,
  muroBloquea,
  aplicarDesvio,
  planPortero,
  posicionPortero,
  moverVivi,
  esAngulo,
  evaluarLlegada,
  dianaTocada,
  puntosDeTiro,
  calcularEstrellas,
  generarTiroRival,
  validarNivel,
} from './JuegoFutbol_logica';

/* =====================================================================
   JUEGO DE FÚTBOL · "Tiro al arco"
   - Se juega tirando penaltis y tiros libres (hay que rodear el muro, vencer
     al viento y romper dianas) y, en un nivel, atajando con Vivi.
   - Todo el juego corre en el teléfono: no usa backend ni base de datos.
   - Las estrellas de cada nivel y el sonido se guardan en el dispositivo
     (localStorage).
   - Los niveles viven en JuegoFutbol_logica.js (NIVELES). Para agregar uno,
     copia uno existente y cambia sus datos.
   - Para que cada nivel se abra solo al ganar estrellas en el anterior,
     pon BLOQUEAR_NIVELES en true.
   ===================================================================== */

const BLOQUEAR_NIVELES = false;
const CLAVE_ESTRELLAS = 'juego_futbol_estrellas';
const CLAVE_SONIDO = 'juego_futbol_sonido';
const PAUSA_ENTRE_TIROS_MS = 1750;

// Si un nivel está mal escrito, avisa en la consola del navegador
NIVELES.forEach((nivel) => {
  const problemas = validarNivel(nivel);
  if (problemas.length) console.warn(`[JuegoFutbol] Nivel "${nivel.id}": ${problemas.join(' · ')}`);
});

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
let bufferRuido = null;

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
  ganancia.gain.exponentialRampToValueAtTime(vol, cuando + 0.008);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
  osc.connect(ganancia);
  ganancia.connect(ctx.destination);
  osc.start(cuando);
  osc.stop(cuando + dur + 0.03);
}

// Ruido filtrado: sirve para el público, las palmadas y el golpe del balón
function ruido(ctx, cuando, dur, vol, filtro, f0, f1, subida = 0.01) {
  if (!bufferRuido) {
    bufferRuido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const datos = bufferRuido.getChannelData(0);
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  }
  const fuente = ctx.createBufferSource();
  fuente.buffer = bufferRuido;
  fuente.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filtro;
  f.frequency.setValueAtTime(f0, cuando);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, cuando + dur);
  const ganancia = ctx.createGain();
  ganancia.gain.setValueAtTime(0.0001, cuando);
  ganancia.gain.exponentialRampToValueAtTime(vol, cuando + subida);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
  fuente.connect(f);
  f.connect(ganancia);
  ganancia.connect(ctx.destination);
  fuente.start(cuando);
  fuente.stop(cuando + dur + 0.05);
}

const SONIDOS = {
  patada: (c, t) => {
    tono(c, t, 170, 0.13, 'sine', 0.5, 55);
    ruido(c, t, 0.07, 0.25, 'lowpass', 1800);
  },
  silbato: (c, t) => {
    tono(c, t, 2900, 0.12, 'sine', 0.07);
    tono(c, t + 0.14, 3100, 0.2, 'sine', 0.07);
  },
  tick: (c, t) => tono(c, t, 1250, 0.04, 'triangle', 0.07),
  gol: (c, t) => {
    ruido(c, t, 1.3, 0.3, 'bandpass', 700, 1500, 0.25);
    [523, 659, 784, 1047].forEach((f, i) => tono(c, t + 0.05 + i * 0.09, f, 0.22, 'triangle', 0.14));
  },
  atajada: (c, t) => {
    ruido(c, t, 0.09, 0.5, 'highpass', 1600);
    tono(c, t, 140, 0.12, 'sine', 0.3, 70);
    ruido(c, t + 0.1, 0.7, 0.1, 'bandpass', 500, 400, 0.1);
  },
  poste: (c, t) => {
    tono(c, t, 1500, 0.35, 'triangle', 0.18, 1100);
    tono(c, t, 2250, 0.2, 'sine', 0.06);
    ruido(c, t + 0.1, 0.7, 0.1, 'bandpass', 600, 400, 0.1);
  },
  larguero: (c, t) => {
    tono(c, t, 900, 0.4, 'triangle', 0.18, 700);
    tono(c, t, 1350, 0.25, 'sine', 0.06);
    ruido(c, t + 0.1, 0.7, 0.1, 'bandpass', 600, 400, 0.1);
  },
  fuera: (c, t) => {
    tono(c, t, 320, 0.45, 'sawtooth', 0.05, 170);
    ruido(c, t, 0.7, 0.1, 'bandpass', 500, 350, 0.15);
  },
  muro: (c, t) => {
    tono(c, t, 130, 0.14, 'sine', 0.45, 60);
    ruido(c, t, 0.06, 0.3, 'lowpass', 1200);
  },
  diana: (c, t) => {
    tono(c, t, 1568, 0.25, 'triangle', 0.14);
    tono(c, t + 0.07, 2093, 0.3, 'triangle', 0.12);
  },
  salto: (c, t) => tono(c, t, 280, 0.16, 'sine', 0.12, 720),
  exito: (c, t) => [523, 659, 784, 1047].forEach((f, i) => tono(c, t + i * 0.1, f, 0.22, 'triangle', 0.16)),
  fallo: (c, t) => {
    tono(c, t, 330, 0.15, 'square', 0.06);
    tono(c, t + 0.17, 220, 0.28, 'square', 0.06);
  },
};

function sonar(nombre, activo) {
  if (!activo) return;
  const ctx = obtenerAudio();
  if (ctx) SONIDOS[nombre](ctx, ctx.currentTime);
}

/* =====================================================================
   DIBUJO DE LA CANCHA (canvas)
   La cámara está detrás de quien patea. Un punto de la jugada tiene
   x, y (unidades de portería) y s (0 = en el pie, 1 = en la línea de gol).
   ===================================================================== */
const W = 400;
const H = 330;
const CX = 200;
const SUELO_LEJOS = 150; // y en pantalla del césped en la línea de gol
const SUELO_CERCA = 292; // y en pantalla del césped donde está el balón
const ESC_X_LEJOS = 118; // píxeles por unidad de x en la línea de gol
const ESC_X_CERCA = 190;
const ESC_Y_LEJOS = 96; // píxeles por unidad de y en la línea de gol
const ESC_Y_CERCA = 165;
const COLOR = {
  tinta: '#1f3b57',
  turquesa: '#0dadc5',
  amarillo: '#ffc933',
  rosa: '#ff6b9a',
  piel: '#f3c9a0',
};

const lerp = (a, b, t) => a + (b - a) * t;
const escX = (s) => lerp(ESC_X_CERCA, ESC_X_LEJOS, s);
const escY = (s) => lerp(ESC_Y_CERCA, ESC_Y_LEJOS, s);
const sueloY = (s) => lerp(SUELO_CERCA, SUELO_LEJOS, s);
const proyectar = (x, y, s) => ({ X: CX + x * escX(s), Y: sueloY(s) - y * escY(s) });
const radioBalon = (s) => lerp(14, 6.5, Math.min(s, 1.4));

// Números "al azar" que siempre salen igual (para que el público no parpadee)
function azarFijo(semilla) {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Lo que nunca cambia (público, césped, líneas) se dibuja una sola vez
function crearFondo(dpr) {
  const lienzo = document.createElement('canvas');
  lienzo.width = W * dpr;
  lienzo.height = H * dpr;
  const ctx = lienzo.getContext('2d');
  ctx.scale(dpr, dpr);

  // gradas
  const cielo = ctx.createLinearGradient(0, 0, 0, 124);
  cielo.addColorStop(0, '#16304d');
  cielo.addColorStop(1, '#2b4d78');
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, W, 124);

  const azar = azarFijo(11);
  const camisetas = ['#ff6b9a', '#ffc933', '#ffffff', '#0dadc5', '#ff8a3d', '#8e7dff'];
  for (let fila = 0; fila < 6; fila++) {
    for (let x = -4 + (fila % 2) * 5; x < W + 6; x += 10) {
      const y = 14 + fila * 15 + azar() * 3;
      ctx.fillStyle = camisetas[Math.floor(azar() * camisetas.length)];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a20';
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(x, y - 4.6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // vallas publicitarias (sin marcas: solo colores)
  const colores = ['#0dadc5', '#ffc933', '#ff6b9a', '#ffffff'];
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = colores[i % colores.length];
    ctx.fillRect(i * 40, 106, 40, 16);
    ctx.fillStyle = 'rgba(31,59,87,0.55)';
    ctx.fillRect(i * 40 + 8, 112, 24, 4);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 120, W, 3);

  // césped con franjas
  ctx.fillStyle = '#2f8f4e';
  ctx.fillRect(0, 123, W, H - 123);
  ctx.fillStyle = '#287d43';
  ctx.fillRect(0, 123, W, SUELO_LEJOS - 123); // detrás de la portería
  const franjas = 8;
  for (let k = -3; k < franjas; k++) {
    const y1 = sueloY(k / franjas);
    const y2 = sueloY((k + 1) / franjas);
    if (k % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      ctx.fillRect(0, Math.min(y1, y2), W, Math.abs(y1 - y2));
    }
  }
  const sombra = ctx.createLinearGradient(0, 123, 0, H);
  sombra.addColorStop(0, 'rgba(0,0,0,0.22)');
  sombra.addColorStop(0.35, 'rgba(0,0,0,0)');
  ctx.fillStyle = sombra;
  ctx.fillRect(0, 123, W, H - 123);

  // líneas de la cancha
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, SUELO_LEJOS);
  ctx.lineTo(W, SUELO_LEJOS);
  ctx.stroke();
  const area = { x: 1.55, s: 0.86 };
  const a1 = proyectar(-area.x, 0, area.s);
  const a2 = proyectar(area.x, 0, area.s);
  const g1 = proyectar(-area.x, 0, 1);
  const g2 = proyectar(area.x, 0, 1);
  ctx.beginPath();
  ctx.moveTo(g1.X, g1.Y);
  ctx.lineTo(a1.X, a1.Y);
  ctx.lineTo(a2.X, a2.Y);
  ctx.lineTo(g2.X, g2.Y);
  ctx.stroke();

  return lienzo;
}

function dibujarRed(ctx, red, ahora) {
  const izq = CX - ESC_X_LEJOS;
  const der = CX + ESC_X_LEJOS;
  const arriba = SUELO_LEJOS - ESC_Y_LEJOS;
  const abajo = SUELO_LEJOS;

  // fondo oscuro para dar profundidad
  ctx.fillStyle = 'rgba(8,24,40,0.38)';
  ctx.fillRect(izq, arriba, der - izq, abajo - arriba);

  const edad = red ? (ahora - red.t0) / 1000 : 99;
  const amp = edad < 1.3 ? 9 * Math.exp(-edad * 3.2) : 0;
  const desplazar = (X, Y) => {
    if (!amp) return Y;
    const d = Math.hypot(X - red.X, Y - red.Y);
    return Y + amp * Math.sin(edad * 34 - d / 12) * Math.exp(-d / 55);
  };

  ctx.strokeStyle = 'rgba(255,255,255,0.34)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let X = izq; X <= der + 0.5; X += 11.8) {
    for (let Y = arriba; Y <= abajo; Y += 8) {
      const yy = desplazar(X, Y);
      if (Y === arriba) ctx.moveTo(X, yy);
      else ctx.lineTo(X, yy);
    }
  }
  for (let Y = arriba + 12; Y < abajo; Y += 12) {
    for (let X = izq; X <= der; X += 8) {
      const yy = desplazar(X, Y);
      if (X === izq) ctx.moveTo(X, yy);
      else ctx.lineTo(X, yy);
    }
  }
  ctx.stroke();
}

function dibujarMarco(ctx) {
  const izq = CX - ESC_X_LEJOS;
  const der = CX + ESC_X_LEJOS;
  const arriba = SUELO_LEJOS - ESC_Y_LEJOS;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(izq, SUELO_LEJOS);
  ctx.lineTo(izq, arriba);
  ctx.lineTo(der, arriba);
  ctx.lineTo(der, SUELO_LEJOS);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(izq + 2.5, SUELO_LEJOS);
  ctx.lineTo(izq + 2.5, arriba + 2.5);
  ctx.lineTo(der - 2.5, arriba + 2.5);
  ctx.lineTo(der - 2.5, SUELO_LEJOS);
  ctx.stroke();
}

function dibujarDianas(ctx, dianas, ahora) {
  dianas.forEach((d) => {
    if (d.roto) return;
    const { X, Y } = proyectar(d.x, d.y, 1);
    const r = RADIO_DIANA * ESC_X_LEJOS;
    const latido = 1 + Math.sin(ahora / 260 + d.x * 5) * 0.05;
    ctx.save();
    ctx.translate(X, Y);
    ctx.scale(latido, latido);
    [
      [r, '#e5584f'],
      [r * 0.72, '#ffffff'],
      [r * 0.46, '#e5584f'],
      [r * 0.2, '#ffffff'],
    ].forEach(([radio, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, radio, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(31,59,87,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

/* Persona genérica: la usan el muro y el portero.
   o: X, Y (pies en pantalla), k (tamaño), camiseta, pantalon, brazos, inclina, alza, guantes */
function dibujarPersona(ctx, o) {
  const { X, Y, k, camiseta, pantalon, brazos = 'abiertos', inclina = 0, alza = 0, guantes = false } = o;
  ctx.save();
  ctx.translate(X, Y - alza);
  ctx.scale(k, k);
  ctx.translate(0, -26);
  ctx.rotate(inclina);
  ctx.translate(0, 26);
  ctx.lineCap = 'round';

  // sombra
  if (!alza) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 1, 13, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // piernas y zapatos
  ctx.strokeStyle = COLOR.piel;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-5, -22);
  ctx.lineTo(-6, -3);
  ctx.moveTo(5, -22);
  ctx.lineTo(6, -3);
  ctx.stroke();
  ctx.fillStyle = '#26364d';
  ctx.beginPath();
  ctx.ellipse(-6.5, -1.5, 5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(6.5, -1.5, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // pantalón y camiseta
  ctx.fillStyle = pantalon;
  rectRedondo(ctx, -10, -33, 20, 13, 3);
  ctx.fill();
  ctx.fillStyle = camiseta;
  rectRedondo(ctx, -11.5, -57, 23, 27, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-11.5, -46, 23, 4);

  // brazos
  const brazo = (x1, y1, x2, y2, guante) => {
    ctx.strokeStyle = guante ? camiseta : COLOR.piel;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.fillStyle = guantes ? COLOR.rosa : COLOR.piel;
    ctx.beginPath();
    ctx.arc(x2, y2, guantes ? 4.8 : 3.2, 0, Math.PI * 2);
    ctx.fill();
  };
  const tipos = {
    abajo: [11, -52, 15, -34],
    abiertos: [11, -52, 20, -42],
    arriba: [10, -53, 16, -82],
    cruzados: [10, -52, 3, -34],
  };
  const [bx1, by1, bx2, by2] = tipos[brazos];
  brazo(-bx1, by1, -bx2, by2, true);
  brazo(bx1, by1, bx2, by2, true);

  // cabeza
  ctx.fillStyle = COLOR.piel;
  ctx.beginPath();
  ctx.arc(0, -65, 8.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2a20';
  ctx.beginPath();
  ctx.arc(0, -66.5, 8.4, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  ctx.fillStyle = '#26364d';
  ctx.beginPath();
  ctx.arc(-3, -64.5, 1.1, 0, Math.PI * 2);
  ctx.arc(3, -64.5, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarMuro(ctx, muro, s) {
  const { Y } = proyectar(0, 0, S_MURO);
  const k = (escX(S_MURO) / ESC_X_LEJOS) * 0.87;
  const salto = muro.saltando ? Math.sin(Math.PI * limitar((s - 0.08) / (2 * (S_MURO - 0.08)), 0, 1)) : 0;
  const alza = SALTO_MURO * escY(S_MURO) * salto;
  for (let i = 0; i < muro.n; i++) {
    const x = muro.x + (i - (muro.n - 1) / 2) * 0.22;
    const { X } = proyectar(x, 0, S_MURO);
    dibujarPersona(ctx, {
      X,
      Y,
      k,
      camiseta: i % 2 ? '#e5584f' : '#c93d46',
      pantalon: '#ffffff',
      brazos: 'cruzados',
      alza,
    });
  }
}

function dibujarPortero(ctx, J, imagenVivi, ahora) {
  const nivel = NIVELES[J.nivelIdx];
  const { X, Y } = proyectar(J.keeper.x, 0, 1);
  const atajando = nivel.modo === 'atajar';
  const enAire = atajando && ahora - J.keeper.tSalto >= DEMORA_SALTO_VIVI * 1000 && ahora - J.keeper.tSalto <= (DEMORA_SALTO_VIVI + DURACION_SALTO_VIVI) * 1000;
  const inclina = limitar(J.keeper.vx * 0.5, -0.95, 0.95);

  // en el modo atajar, Vivi es la portera
  if (atajando && imagenVivi && imagenVivi.complete && imagenVivi.naturalWidth) {
    const alto = 66;
    const ancho = (alto * imagenVivi.naturalWidth) / imagenVivi.naturalHeight;
    const alza = enAire ? 26 : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(X, Y, 15, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(X, Y - alza);
    ctx.rotate(inclina * 0.7);
    ctx.drawImage(imagenVivi, -ancho / 2, -alto, ancho, alto);
    // guantes
    ctx.fillStyle = COLOR.rosa;
    const gy = enAire ? -alto * 0.95 : -alto * 0.42;
    const gx = enAire ? ancho * 0.36 : ancho * 0.55;
    [-1, 1].forEach((lado) => {
      ctx.beginPath();
      ctx.arc(lado * gx, gy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(31,59,87,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
    return;
  }

  const estira = Math.abs(J.keeper.vx) > 0.5 || enAire;
  dibujarPersona(ctx, {
    X,
    Y,
    k: 1,
    camiseta: '#ffb703',
    pantalon: '#1f3b57',
    brazos: estira ? 'arriba' : 'abiertos',
    inclina,
    alza: estira ? 8 * Math.abs(inclina) + (enAire ? 20 : 0) : 0,
    guantes: true,
  });
}

function dibujarBalon(ctx, X, Y, r, angulo, alfa = 1) {
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(X, Y);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#d9dee6');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.rotate(angulo);
  ctx.fillStyle = '#1f2937';
  // pentágono central y manchas alrededor
  const pent = (cx, cy, rr) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };
  pent(0, 0, r * 0.36);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
    pent(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, r * 0.3);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(31,41,55,0.7)';
  ctx.lineWidth = Math.max(1, r * 0.09);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function dibujarManga(ctx, viento, ahora) {
  const px = 32;
  const py = SUELO_LEJOS + 2;
  const alto = 52;
  ctx.strokeStyle = '#e8edf3';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px, py - alto);
  ctx.stroke();
  const fuerza = Math.min(1, Math.abs(viento) / 0.4);
  const dir = viento < 0 ? -1 : 1;
  const largo = 12 + fuerza * 26;
  const caida = (1 - fuerza) * 16;
  const ondula = Math.sin(ahora / 120) * (1 + fuerza * 2.5);
  const ty = py - alto;
  ctx.fillStyle = '#ff7a3d';
  ctx.beginPath();
  ctx.moveTo(px, ty);
  ctx.lineTo(px + dir * largo, ty + caida + ondula);
  ctx.lineTo(px + dir * largo, ty + caida + 9 + ondula);
  ctx.lineTo(px, ty + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(px + dir * largo * 0.5, ty + caida * 0.5 + ondula * 0.5);
  ctx.lineTo(px + dir * largo * 0.75, ty + caida * 0.75 + ondula * 0.75);
  ctx.lineTo(px + dir * largo * 0.75, ty + caida * 0.75 + 9 + ondula * 0.75);
  ctx.lineTo(px + dir * largo * 0.5, ty + caida * 0.5 + 8.5 + ondula * 0.5);
  ctx.closePath();
  ctx.fill();
  const flechas = Math.max(1, Math.round(Math.abs(viento) / 0.1));
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(15,34,54,0.7)';
  ctx.fillStyle = '#fff';
  const texto = (viento < 0 ? '◀' : '▶').repeat(flechas);
  ctx.strokeText(texto, px, py + 16);
  ctx.fillText(texto, px, py + 16);
}

function dibujarMira(ctx, J, ahora) {
  const nivel = NIVELES[J.nivelIdx];
  const mira = J.mira;
  if (!mira) return;
  const esc = J.escena;

  // camino que seguirá el balón (sin viento: ese es el reto)
  const tiro = { xs: esc.xs, tx: mira.x, ty: mira.y, curva: J.curva, viento: 0 };
  for (let i = 1; i <= 18; i++) {
    const s = i / 19;
    const p = trayectoria(tiro, s);
    const { X, Y } = proyectar(p.x, p.y, s);
    ctx.fillStyle = `rgba(255,255,255,${0.85 - s * 0.35})`;
    ctx.beginPath();
    ctx.arc(X, Y - radioBalon(s) * 0.5, lerp(3.1, 1.7, s), 0, Math.PI * 2);
    ctx.fill();
  }

  const { X, Y } = proyectar(mira.x, mira.y, 1);
  const latido = 1 + Math.sin(ahora / 120) * 0.08;
  ctx.save();
  ctx.translate(X, Y);
  ctx.scale(latido, latido);
  const dentro = Math.abs(mira.x) < 1 && mira.y < 1;
  ctx.strokeStyle = dentro ? COLOR.amarillo : '#ff8a8a';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-19, 0);
  ctx.lineTo(-8, 0);
  ctx.moveTo(19, 0);
  ctx.lineTo(8, 0);
  ctx.moveTo(0, -19);
  ctx.lineTo(0, -8);
  ctx.moveTo(0, 19);
  ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.restore();

  // con viento, marca hacia dónde lo empujará
  if (esc.viento && nivel.modo === 'tirar') {
    const f = proyectar(mira.x + esc.viento, mira.y, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X, Y);
    ctx.lineTo(f.X, f.Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(f.X, f.Y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dibujarEscena(ctx, J, fondo, imagenVivi, ahora) {
  const nivel = NIVELES[J.nivelIdx];
  const esc = J.escena;

  ctx.save();
  if (J.sacudida > 0.2) ctx.translate((Math.random() - 0.5) * J.sacudida, (Math.random() - 0.5) * J.sacudida);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(fondo, 0, 0, W, H);

  if (esc.viento) dibujarManga(ctx, esc.viento, ahora);

  dibujarRed(ctx, J.red, ahora);
  dibujarDianas(ctx, esc.dianas, ahora);
  dibujarPortero(ctx, J, imagenVivi, ahora);
  dibujarMarco(ctx);

  // punto de penalti / posición del tiro libre
  const pie = proyectar(esc.xs, 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(pie.X, pie.Y, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const bola = J.bola;
  const bolaDetras = bola.s >= S_MURO && bola.s <= 1.4;

  const pintarBola = () => {
    const { X, Y } = proyectar(bola.x, bola.y, bola.s);
    const r = radioBalon(bola.s);
    const suelo = proyectar(bola.x, 0, bola.s);
    ctx.fillStyle = `rgba(0,0,0,${0.26 * Math.max(0.25, 1 - bola.y * 0.7)})`;
    ctx.beginPath();
    ctx.ellipse(suelo.X, suelo.Y, r * 1.05, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    // estela
    J.estela.forEach((p, i) => {
      const f = (i + 1) / (J.estela.length + 1);
      dibujarBalon(ctx, p.X, p.Y - p.r, p.r * (0.55 + 0.4 * f), 0, 0.22 * f);
    });
    const alfa = bola.s > 1.2 ? Math.max(0, 1 - (bola.s - 1.2) * 4) : 1;
    dibujarBalon(ctx, X, Y - r, r, bola.ang, alfa);
  };

  if (bolaDetras) pintarBola();
  if (esc.muro) dibujarMuro(ctx, esc.muro, J.sub === 'vuelo' ? J.bola.s : 0);
  if (!bolaDetras) pintarBola();

  // confeti y destellos
  J.particulas.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.vida);
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillRect(-p.tam / 2, -p.tam / 2, p.tam, p.tam * 0.6);
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  if (nivel.modo === 'tirar' && (J.sub === 'apuntando' || J.sub === 'cargando')) dibujarMira(ctx, J, ahora);

  // pista para empezar
  const sinTocar = (nivel.modo === 'tirar' && J.sub === 'apuntando' && !J.mira) || (nivel.modo === 'atajar' && J.sub === 'espera' && !J.movido);
  if (sinTocar) {
    const pulso = 0.65 + Math.sin(ahora / 260) * 0.35;
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = `rgba(15,34,54,${0.75 * pulso})`;
    ctx.fillStyle = `rgba(255,255,255,${pulso})`;
    const t = nivel.modo === 'tirar' ? 'Toca y arrastra para apuntar' : 'Arrastra para mover a Vivi';
    const y = nivel.modo === 'tirar' ? 226 : 214;
    ctx.strokeText(t, CX, y);
    ctx.fillText(t, CX, y);
  }

  ctx.restore();
}

/* =====================================================================
   ESTADO DE UNA PARTIDA (vive en una referencia, no en React, porque
   cambia 60 veces por segundo)
   ===================================================================== */
const azarEntre = (a, b) => a + Math.random() * (b - a);

function nuevaEscenaDe(nivel, indice) {
  const escena = generarEscena(nivel);
  return {
    escena,
    keeper: { x: escena.porteroX, vx: 0, destino: 0, tSalto: -9999, saltoUsado: false },
    rival: nivel.modo === 'atajar' ? generarTiroRival(nivel, indice) : null,
  };
}

function nuevaPartida(nivelIdx, ahora) {
  const nivel = NIVELES[nivelIdx];
  const base = nuevaEscenaDe(nivel, 0);
  const inicio = {
    nivelIdx,
    tiroIdx: 0,
    puntos: 0,
    racha: 0,
    mejorRacha: 0,
    aciertos: 0,
    angulos: 0,
    dianas: 0,
    perfectos: 0,
    ...base,
    sub: nivel.modo === 'atajar' ? 'espera' : 'apuntando', // apuntando | cargando | espera | vuelo | despues
    mira: null,
    curva: 0,
    potencia: 0,
    enZona: false,
    tCarga: 0,
    tKick: ahora + 1400,
    tSiguiente: 0,
    movido: false,
    teclas: { izq: false, der: false },
    // balón y efectos
    bola: { x: base.escena.xs, y: 0, s: 0, ang: 0 },
    estela: [],
    particulas: [],
    red: null,
    sacudida: 0,
    last: ahora,
    // vuelo
    tiro: null,
    info: null,
    plan: null,
    T: 1,
    t0: 0,
    muroRevisado: false,
    post: null,
  };
  return inicio;
}

function crearConfeti(J, x, y, cantidad, colores) {
  for (let i = 0; i < cantidad; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = azarEntre(60, 220);
    J.particulas.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 90,
      rot: Math.random() * 6,
      vrot: azarEntre(-9, 9),
      tam: azarEntre(4, 8),
      color: colores[Math.floor(Math.random() * colores.length)],
      vida: 1,
    });
  }
}

const COLORES_CONFETI = ['#ffc933', '#ff6b9a', '#0dadc5', '#ffffff', '#8e7dff', '#2fb67c'];

/* ---------- textos ---------- */
const PISTA_NIVEL = {
  penaltis: 'Arrastra para apuntar y suelta cuando la barra esté en lo verde.',
  muro: '¡Hay muro! Rodéalo con curva o mándala por arriba.',
  dianas: 'Mete gol y rompe las dianas para llevarte puntos extra.',
  viento: 'Mira la manga: el viento desvía el balón. ¡Apunta contra él!',
  arco: 'Arrastra para mover a Vivi y toca ¡Salta! en el momento justo.',
  final: 'Muro que salta, viento y portero listo. ¡Tú puedes!',
};

const FRASES = {
  gol: ['¡Gol de Vivi y compañía!', '¡Qué tiro! Directo a la red.', '¡Golazo! Todos gritan.'],
  atajada: ['El portero se la sacó. ¡Otra vez!', 'Atajó… hay que buscar otro rincón.'],
  poste: ['¡Casi! Pegó en el palo.'],
  larguero: ['¡Casi! El larguero la sacó.'],
  fuera: ['Se fue afuera. Menos potencia o apunta más abajo.'],
  muro: ['El muro la paró. Prueba con curva o más alto.'],
  atajaVivi: ['¡Vivi voló y la sacó!', '¡Qué manos! Atajada de campeona.'],
  golRival: ['Uy, entró. ¡Concéntrate en el balón!'],
};
const frase = (clave) => FRASES[clave][Math.floor(Math.random() * FRASES[clave].length)];

/* =====================================================================
   COMPONENTE
   ===================================================================== */
export default function JuegoFutbol({ onVolver }) {
  const [fase, setFase] = useState('niveles'); // niveles | jugando | resultado
  const [nivelIdx, setNivelIdx] = useState(0);
  const [estrellas, setEstrellas] = useState(leerEstrellas);
  const [sonido, setSonido] = useState(leerSonido);
  const [hud, setHud] = useState({ tiro: 1, puntos: 0, racha: 0, aciertos: 0 });
  const [sub, setSub] = useState('apuntando');
  const [curvaUI, setCurvaUI] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const [cartel, setCartel] = useState(null); // { id, texto, tono, detalle }
  const [viviEstado, setViviEstado] = useState({ id: 0, clase: '' });
  const [puedeSaltar, setPuedeSaltar] = useState(true);
  const [resultado, setResultado] = useState(null);
  const [intento, setIntento] = useState(0);

  const canvasRef = useRef(null);
  const medidorRef = useRef(null);
  const cursorRef = useRef(null);
  const jr = useRef(null);
  const fondoRef = useRef(null);
  const imagenVivi = useRef(null);
  const sonidoRef = useRef(sonido);
  sonidoRef.current = sonido;
  const estrellasRef = useRef(estrellas);
  estrellasRef.current = estrellas;
  const idCartel = useRef(0);

  const nivel = NIVELES[nivelIdx];
  const atajando = nivel.modo === 'atajar';

  // Vivi para dibujarla como portera
  useEffect(() => {
    const img = new Image();
    img.src = vivi;
    imagenVivi.current = img;
  }, []);

  const cambiarSonido = () => {
    const nuevo = !sonido;
    setSonido(nuevo);
    guardarSonido(nuevo);
    if (nuevo) sonar('tick', true);
  };

  const emocion = useCallback((clase) => {
    setViviEstado((v) => ({ id: v.id + 1, clase }));
  }, []);

  const mostrarCartel = useCallback((texto, tono, detalle) => {
    idCartel.current += 1;
    setCartel({ id: idCartel.current, texto, tono, detalle });
  }, []);

  /* ---------- fin del nivel ---------- */
  const terminar = useCallback((J) => {
    const niv = NIVELES[J.nivelIdx];
    J.sub = 'fin'; // evita que un cuadro más vuelva a terminar el nivel
    const n = calcularEstrellas(niv, J.puntos);
    const previas = estrellasRef.current;
    const nuevas = { ...previas, [niv.id]: Math.max(previas[niv.id] || 0, n) };
    setEstrellas(nuevas);
    guardarEstrellas(nuevas);
    setResultado({
      estrellas: n,
      puntos: J.puntos,
      aciertos: J.aciertos,
      tiros: niv.tiros,
      mejorRacha: J.mejorRacha,
      angulos: J.angulos,
      dianas: J.dianas,
      perfectos: J.perfectos,
      modo: niv.modo,
    });
    sonar(n > 0 ? 'exito' : 'fallo', sonidoRef.current);
    setFase('resultado');
  }, []);

  /* ---------- siguiente tiro ---------- */
  const siguienteTiro = useCallback(
    (J, ahora) => {
      const niv = NIVELES[J.nivelIdx];
      J.tiroIdx += 1;
      const nueva = nuevaEscenaDe(niv, J.tiroIdx);
      J.escena = nueva.escena;
      J.keeper = nueva.keeper;
      J.rival = nueva.rival;
      J.bola = { x: J.escena.xs, y: 0, s: 0, ang: 0 };
      J.estela = [];
      J.red = null;
      J.mira = null;
      J.curva = 0;
      J.potencia = 0;
      J.post = null;
      J.movido = false;
      J.sub = niv.modo === 'atajar' ? 'espera' : 'apuntando';
      J.tKick = ahora + azarEntre(1000, 1700);
      setSub(J.sub);
      setCurvaUI(0);
      setPuedeSaltar(true);
      setHud({ tiro: J.tiroIdx + 1, puntos: J.puntos, racha: J.racha, aciertos: J.aciertos });
      setMensaje(
        niv.modo === 'atajar'
          ? 'Atenta al balón… ¡viene el tiro!'
          : J.escena.muro
          ? 'Nuevo lugar, nuevo muro. ¡Piénsalo bien!'
          : 'Tiro ' + (J.tiroIdx + 1) + ': ¡apunta a un rincón!'
      );
    },
    []
  );

  /* ---------- lo que pasa cuando el balón llega (o choca) ---------- */
  const resolver = useCallback(
    (J, ahora, resultadoTiro, extra = {}) => {
      const niv = NIVELES[J.nivelIdx];
      const atajar = niv.modo === 'atajar';
      const act = sonidoRef.current;
      const fin = extra.fin || J.bola;
      const { X, Y } = proyectar(fin.x, fin.y, Math.min(fin.s ?? 1, 1));
      J.sub = 'despues';
      J.tSiguiente = ahora + PAUSA_ENTRE_TIROS_MS;
      setSub('despues');

      const bueno = atajar ? resultadoTiro === 'atajada' : resultadoTiro === 'gol';
      let diana = null;
      if (resultadoTiro === 'gol' && !atajar) {
        diana = dianaTocada(J.escena.dianas, fin.x, fin.y);
        if (diana) diana.roto = true;
      }
      const angulo = (resultadoTiro === 'gol' || resultadoTiro === 'atajada') && esAngulo(fin.x, fin.y);

      if (bueno) {
        J.racha += 1;
        J.mejorRacha = Math.max(J.mejorRacha, J.racha);
        J.aciertos += 1;
        if (angulo) J.angulos += 1;
        if (diana) J.dianas += 1;
        if (extra.perfecta) J.perfectos += 1;
      } else if (resultadoTiro !== 'fuera' || !atajar) {
        J.racha = 0;
      }
      const pts = puntosDeTiro({
        resultado: resultadoTiro,
        modo: niv.modo,
        racha: J.racha,
        angulo,
        perfecta: extra.perfecta,
        diana,
      });
      J.puntos += pts.total;
      const detalle = pts.detalle.map((d) => `${d.txt} +${d.pts}`).join(' · ');

      // estado final del balón para la animación posterior
      const b = { x: fin.x, y: fin.y, s: fin.s ?? 1 };
      if (resultadoTiro === 'gol') {
        J.post = { x: b.x, y: b.y, s: b.s, vx: 0, vy: -0.3, vs: 0.12, tope: 1.1 };
        J.red = { t0: ahora, X, Y };
        crearConfeti(J, X, Y, diana ? 40 : 28, COLORES_CONFETI);
        sonar(diana ? 'diana' : 'gol', act);
        if (diana) setTimeout(() => sonar('gol', sonidoRef.current), 160);
        emocion('feliz');
        mostrarCartel(diana ? '¡DIANA!' : angulo ? '¡GOLAZO!' : '¡GOOOL!', 'bien', detalle);
        setMensaje(frase('gol'));
      } else if (resultadoTiro === 'atajada') {
        const lado = Math.random() < 0.5 ? -1 : 1;
        J.post = { x: b.x, y: b.y, s: b.s, vx: lado * 0.7, vy: 0.9, vs: -0.9 };
        sonar('atajada', act);
        if (atajar) {
          crearConfeti(J, X, Y, 22, COLORES_CONFETI);
          emocion('feliz');
          mostrarCartel('¡ATAJADA!', 'bien', detalle);
          setMensaje(frase('atajaVivi'));
        } else {
          emocion('triste');
          mostrarCartel('¡Atajó!', 'mal', '');
          setMensaje(frase('atajada'));
        }
      } else if (resultadoTiro === 'poste' || resultadoTiro === 'larguero') {
        J.post = { x: b.x, y: b.y, s: b.s, vx: Math.sign(b.x || 1) * 0.9, vy: resultadoTiro === 'poste' ? 0.7 : -0.2, vs: -1.1 };
        J.sacudida = 7;
        sonar(resultadoTiro, act);
        emocion('triste');
        mostrarCartel(resultadoTiro === 'poste' ? '¡POSTE!' : '¡LARGUERO!', 'mal', '');
        setMensaje(frase(resultadoTiro));
      } else if (resultadoTiro === 'muro') {
        J.post = { x: b.x, y: b.y, s: b.s, vx: azarEntre(-0.6, 0.6), vy: 0.9, vs: -1.3 };
        J.sacudida = 4;
        sonar('muro', act);
        emocion('triste');
        mostrarCartel('¡Muro!', 'mal', '');
        setMensaje(frase('muro'));
      } else {
        J.post = { x: b.x, y: b.y, s: b.s, vx: Math.abs(b.x) > 1 ? Math.sign(b.x) * 0.4 : 0, vy: b.y > 1 ? 0.5 : 0.1, vs: 0.55 };
        sonar('fuera', act);
        emocion('triste');
        mostrarCartel('¡Afuera!', 'mal', '');
        setMensaje(frase('fuera'));
      }
      if (resultadoTiro === 'gol' && atajar) {
        emocion('triste');
        mostrarCartel('¡Gol del rival!', 'mal', '');
        setMensaje(frase('golRival'));
      }

      setHud({ tiro: J.tiroIdx + 1, puntos: J.puntos, racha: J.racha, aciertos: J.aciertos });
    },
    [emocion, mostrarCartel]
  );

  /* ---------- patear (modo tirar) ---------- */
  const patear = useCallback((J, ahora) => {
    const niv = NIVELES[J.nivelIdx];
    const p = J.potencia;
    const mira = J.mira || { x: 0, y: 0.45 };
    const base = { xs: J.escena.xs, tx: mira.x, ty: mira.y, curva: J.curva, viento: J.escena.viento };
    const tiro = aplicarDesvio(base, p);
    const info = infoPotencia(p);
    J.tiro = tiro;
    J.info = info;
    J.T = info.T;
    J.t0 = ahora;
    J.muroRevisado = false;
    J.plan = planPortero(niv, J.escena.porteroX, tiro.tx);
    J.sub = 'vuelo';
    J.estela = [];
    setSub('vuelo');
    setMensaje('…');
    emocion('patea');
    sonar('patada', sonidoRef.current);
    if (cursorRef.current) cursorRef.current.style.left = '0%';
  }, [emocion]);

  /* ---------- el rival patea (modo atajar) ---------- */
  const lanzarRival = useCallback((J, ahora) => {
    J.tiro = { ...J.rival };
    J.T = J.rival.T;
    J.t0 = ahora;
    J.muroRevisado = true;
    J.sub = 'vuelo';
    J.estela = [];
    setSub('vuelo');
    setMensaje('¡Ahí viene!');
    sonar('silbato', sonidoRef.current);
    setTimeout(() => sonar('patada', sonidoRef.current), 120);
  }, []);

  /* ---------- un cuadro de la partida ---------- */
  const actualizar = useCallback(
    (J, ahora, dt) => {
      const niv = NIVELES[J.nivelIdx];
      const atajar = niv.modo === 'atajar';

      // barra de potencia
      if (J.sub === 'cargando') {
        const p = potenciaEn((ahora - J.tCarga) / 1000);
        J.potencia = p;
        const zona = infoPotencia(p).perfecta;
        if (zona && !J.enZona) sonar('tick', sonidoRef.current);
        J.enZona = zona;
        if (cursorRef.current) cursorRef.current.style.left = `${p * 100}%`;
        if (medidorRef.current) medidorRef.current.classList.toggle('jf-medidor-ok', zona);
      }

      // el rival se prepara
      if (J.sub === 'espera' && ahora >= J.tKick) lanzarRival(J, ahora);

      // Vivi se mueve hacia donde la mandas
      const antes = J.keeper.x;
      if (atajar && (J.sub === 'espera' || J.sub === 'vuelo' || J.sub === 'despues')) {
        if (J.teclas.izq) J.keeper.destino = limitar(J.keeper.destino - 2.4 * dt, -1.1, 1.1);
        if (J.teclas.der) J.keeper.destino = limitar(J.keeper.destino + 2.4 * dt, -1.1, 1.1);
        if (J.sub !== 'despues') J.keeper.x = moverVivi(J.keeper.x, J.keeper.destino, dt, niv.portero.vel);
      }

      // el portero rival (modo tirar)
      if (!atajar) {
        if (J.sub === 'vuelo' || J.sub === 'despues') {
          J.keeper.x = posicionPortero(J.plan, (ahora - J.t0) / 1000);
        } else {
          J.keeper.x = J.escena.porteroX + Math.sin(ahora / 420) * 0.04; // se mece mientras esperas
        }
      }
      J.keeper.vx = lerp(J.keeper.vx, (J.keeper.x - antes) / Math.max(dt, 0.001), 0.35);

      // vuelo del balón
      if (J.sub === 'vuelo') {
        const t = (ahora - J.t0) / 1000;
        const s = t / J.T;
        J.bola.ang += dt * 14;

        if (!J.muroRevisado && s >= S_MURO) {
          J.muroRevisado = true;
          if (muroBloquea(J.escena.muro, J.tiro)) {
            const p = trayectoria(J.tiro, S_MURO);
            resolver(J, ahora, 'muro', { fin: { x: p.x, y: p.y, s: S_MURO } });
          }
        }
        if (J.sub === 'vuelo') {
          if (s >= 1) {
            const fin = trayectoria(J.tiro, 1);
            const kx = J.keeper.x;
            let estira;
            if (atajar) {
              const dtSalto = ahora - J.keeper.tSalto;
              estira = dtSalto >= DEMORA_SALTO_VIVI * 1000 && dtSalto <= (DEMORA_SALTO_VIVI + DURACION_SALTO_VIVI) * 1000;
            } else {
              estira = Math.abs(kx - J.plan.x0) > 0.2;
            }
            const r = evaluarLlegada({ x: fin.x, y: fin.y, kx, estira, alcance: niv.portero.alcance });
            J.bola = { ...J.bola, x: fin.x, y: fin.y, s: 1 };
            resolver(J, ahora, r, { fin: { x: fin.x, y: fin.y, s: 1 }, perfecta: !atajar && J.info.perfecta });
          } else {
            const p = trayectoria(J.tiro, s);
            J.bola.x = p.x;
            J.bola.y = p.y;
            J.bola.s = s;
            const { X, Y } = proyectar(p.x, p.y, s);
            J.estela.push({ X, Y: Y, r: radioBalon(s) });
            if (J.estela.length > 6) J.estela.shift();
          }
        }
      }

      // después del tiro: el balón rebota, se hunde en la red, se va...
      if (J.sub === 'despues' && J.post) {
        const q = J.post;
        q.vy -= 2.6 * dt;
        q.y += q.vy * dt;
        q.x += q.vx * dt;
        q.s += q.vs * dt;
        if (q.tope && q.s > q.tope) {
          q.s = q.tope;
          q.vs = 0;
          q.vx *= 0.3;
        }
        if (q.y < 0) {
          q.y = 0;
          q.vy = -q.vy * 0.4;
          q.vx *= 0.8;
          q.vs *= 0.8;
        }
        J.bola.x = q.x;
        J.bola.y = q.y;
        J.bola.s = q.s;
        J.bola.ang += dt * 8 * Math.min(1, Math.abs(q.vs) + Math.abs(q.vx));
        J.estela = [];

        if (ahora >= J.tSiguiente) {
          if (J.tiroIdx + 1 >= niv.tiros) terminar(J);
          else siguienteTiro(J, ahora);
        }
      }

      // partículas
      J.particulas = J.particulas.filter((p) => p.vida > 0);
      J.particulas.forEach((p) => {
        p.vy += 420 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        p.vida -= dt * 0.8;
      });
      J.sacudida = Math.max(0, J.sacudida - dt * 22);
    },
    [lanzarRival, resolver, siguienteTiro, terminar]
  );

  /* ---------- bucle de dibujo ---------- */
  useEffect(() => {
    if (fase !== 'jugando') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fondoRef.current = crearFondo(dpr);

    let raf = 0;
    const bucle = (ahora) => {
      const J = jr.current;
      if (!J) return;
      const dt = Math.min(0.05, (ahora - J.last) / 1000);
      J.last = ahora;
      actualizar(J, ahora, dt);
      if (jr.current === J && fondoRef.current) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dibujarEscena(ctx, J, fondoRef.current, imagenVivi.current, ahora);
      }
      raf = requestAnimationFrame(bucle);
    };
    if (jr.current) jr.current.last = performance.now();
    raf = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(raf);
  }, [fase, intento, actualizar]);

  /* ---------- controles del tirador ---------- */
  const aCoordenadas = (evento) => {
    const caja = canvasRef.current.getBoundingClientRect();
    return {
      lx: ((evento.clientX - caja.left) * W) / caja.width,
      ly: ((evento.clientY - caja.top) * H) / caja.height,
      toque: evento.pointerType === 'touch',
    };
  };

  const mirarA = (evento) => {
    const { lx, ly, toque } = aCoordenadas(evento);
    const desfase = toque ? 38 : 0; // el dedo no tapa la mira
    return {
      x: limitar((lx - CX) / ESC_X_LEJOS, -1.35, 1.35),
      y: limitar((SUELO_LEJOS - (ly - desfase)) / ESC_Y_LEJOS, 0, 1.3),
    };
  };

  const alPresionar = (evento) => {
    const J = jr.current;
    if (!J) return;
    obtenerAudio();
    if (nivel.modo === 'tirar') {
      if (J.sub !== 'apuntando') return;
      evento.currentTarget.setPointerCapture?.(evento.pointerId);
      J.mira = mirarA(evento);
      J.tCarga = performance.now();
      J.enZona = false;
      J.sub = 'cargando';
      setSub('cargando');
      setMensaje('¡Suelta cuando la barra esté en lo verde!');
    } else {
      evento.currentTarget.setPointerCapture?.(evento.pointerId);
      J.movido = true;
      const { lx } = aCoordenadas(evento);
      J.keeper.destino = limitar((lx - CX) / ESC_X_LEJOS, -1.1, 1.1);
    }
  };

  const alMover = (evento) => {
    const J = jr.current;
    if (!J || !evento.currentTarget.hasPointerCapture?.(evento.pointerId)) return;
    if (nivel.modo === 'tirar') {
      if (J.sub === 'cargando') J.mira = mirarA(evento);
    } else {
      const { lx } = aCoordenadas(evento);
      J.keeper.destino = limitar((lx - CX) / ESC_X_LEJOS, -1.1, 1.1);
    }
  };

  const alSoltar = (evento) => {
    const J = jr.current;
    if (!J || nivel.modo !== 'tirar' || J.sub !== 'cargando') return;
    if (evento.type === 'pointercancel') {
      J.sub = 'apuntando';
      setSub('apuntando');
      if (cursorRef.current) cursorRef.current.style.left = '0%';
      return;
    }
    J.mira = mirarA(evento);
    patear(J, performance.now());
  };

  const elegirCurva = (valor) => {
    setCurvaUI(valor);
    if (jr.current) jr.current.curva = valor;
    sonar('tick', sonido);
  };

  const saltar = useCallback(() => {
    const J = jr.current;
    if (!J || J.keeper.saltoUsado || (J.sub !== 'espera' && J.sub !== 'vuelo')) return;
    obtenerAudio();
    J.keeper.saltoUsado = true;
    J.keeper.tSalto = performance.now();
    setPuedeSaltar(false);
    sonar('salto', sonidoRef.current);
  }, []);

  // teclado para jugar en computadora (modo atajar)
  useEffect(() => {
    if (fase !== 'jugando' || !atajando) return undefined;
    const abajo = (e) => {
      const J = jr.current;
      if (!J) return;
      if (e.key === 'ArrowLeft') J.teclas.izq = true;
      if (e.key === 'ArrowRight') J.teclas.der = true;
      if ((e.key === ' ' || e.key === 'ArrowUp') && !e.repeat) {
        e.preventDefault();
        saltar();
      }
      if (e.key.startsWith('Arrow')) J.movido = true;
    };
    const arriba = (e) => {
      const J = jr.current;
      if (!J) return;
      if (e.key === 'ArrowLeft') J.teclas.izq = false;
      if (e.key === 'ArrowRight') J.teclas.der = false;
    };
    window.addEventListener('keydown', abajo);
    window.addEventListener('keyup', arriba);
    return () => {
      window.removeEventListener('keydown', abajo);
      window.removeEventListener('keyup', arriba);
    };
  }, [fase, atajando, saltar]);

  /* ---------- navegación ---------- */
  const empezar = (i) => {
    obtenerAudio();
    const niv = NIVELES[i];
    jr.current = nuevaPartida(i, performance.now());
    setNivelIdx(i);
    setHud({ tiro: 1, puntos: 0, racha: 0, aciertos: 0 });
    setSub(jr.current.sub);
    setCurvaUI(0);
    setCartel(null);
    setResultado(null);
    setPuedeSaltar(true);
    setViviEstado((v) => ({ id: v.id + 1, clase: '' }));
    setMensaje(PISTA_NIVEL[niv.id] || '');
    setIntento((n) => n + 1);
    setFase('jugando');
    if (niv.modo === 'atajar') sonar('silbato', sonidoRef.current);
  };

  const atras = () => {
    if (fase === 'niveles') {
      if (typeof onVolver === 'function') onVolver();
      return;
    }
    jr.current = null;
    setFase('niveles');
  };

  const desbloqueado = (i) => !BLOQUEAR_NIVELES || i === 0 || (estrellas[NIVELES[i - 1].id] || 0) >= 1;

  /* ---------- pantallas ---------- */
  const hayNivelSiguiente = nivelIdx < NIVELES.length - 1;
  const totalEstrellas = NIVELES.reduce((a, n) => a + (estrellas[n.id] || 0), 0);
  const umbrales = nivel.estrellas;
  const progreso = Math.min(100, (hud.puntos / umbrales[2]) * 100);

  const ayudaTirar = (
    <ul>
      <li>Toca la cancha, arrastra para mover la mira y mira la barra: suelta cuando esté en lo <b>verde</b>.</li>
      <li>Muy poca potencia = tiro lento que el portero alcanza. Demasiada = se va por arriba.</li>
      <li>Los rincones de arriba valen puntos extra, pero el palo y el larguero están cerca.</li>
      {nivel.efecto && <li>Con la <b>curva</b> el balón rodea el muro y llega a la mira. Si no hay muro, no hace falta.</li>}
      {nivel.muro && <li>También puedes pasar el muro por arriba: apunta alto.</li>}
      {nivel.viento > 0 && <li>La manga y los puntitos blancos te muestran hacia dónde empuja el viento.</li>}
      {nivel.dianas > 0 && <li>Si el balón entra por una diana, ganas puntos extra.</li>}
    </ul>
  );
  const ayudaAtajar = (
    <ul>
      <li>Arrastra el dedo (o usa ← →) para mover a Vivi hacia donde irá el balón.</li>
      <li>A ras de suelo basta con ponerse delante. Para los tiros altos toca <b>¡Salta!</b>.</li>
      <li>Solo tienes un salto por tiro: si saltas muy pronto, caes antes de que llegue el balón.</li>
      <li>Algunos tiros hacen curva: vigila el balón, no solo al rival.</li>
    </ul>
  );

  return (
    <section className="jf-page">
      <div className="jf-wrap">
        <header className="jf-top">
          <button type="button" className="jf-atras" onClick={atras}>
            ← {fase === 'niveles' ? 'Juegos' : 'Niveles'}
          </button>
          <h1 className="jf-titulo">Tiro al arco</h1>
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

        {fase === 'niveles' && (
          <>
            <div className="jf-escenario">
              <div className="jf-burbuja" role="status">¡Elige un partido, la cancha te espera!</div>
              <img className="jf-vivi-grande" src={vivi} alt="Vivi, la nutria" draggable="false" />
              <span className="jf-balon-flota" aria-hidden="true">⚽</span>
            </div>
            <p className="jf-total">★ {totalEstrellas} de {NIVELES.length * MAX_ESTRELLAS_NIVEL}</p>
            <div className="jf-niveles">
              {NIVELES.map((n, i) => {
                const libre = desbloqueado(i);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`jf-nivel${libre ? '' : ' jf-nivel-bloqueado'}`}
                    onClick={() => empezar(i)}
                    disabled={!libre}
                  >
                    <span className="jf-nivel-num">{libre ? i + 1 : '🔒'}</span>
                    <span className="jf-nivel-info">
                      <strong>{n.nombre} <i>{n.modo === 'atajar' ? '🧤' : '⚽'}</i></strong>
                      <small>{n.descripcion}</small>
                    </span>
                    <span className="jf-estrellas" aria-label={`${estrellas[n.id] || 0} de 3 estrellas`}>
                      {[1, 2, 3].map((s) => (
                        <span key={s} className={s <= (estrellas[n.id] || 0) ? 'jf-estrella-on' : 'jf-estrella'}>★</span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {fase === 'jugando' && (
          <>
            <div className="jf-card jf-marcador">
              <div className="jf-datos-fila">
                <span className="jf-dato"><small>{atajando ? 'Tiro' : 'Tiro'}</small><b>{Math.min(hud.tiro, nivel.tiros)}/{nivel.tiros}</b></span>
                <span className="jf-dato"><small>{atajando ? 'Atajadas' : 'Goles'}</small><b>{hud.aciertos}</b></span>
                <span className="jf-dato jf-dato-grande"><small>Puntos</small><b>{hud.puntos}</b></span>
                <span className={`jf-dato jf-racha${hud.racha >= 2 ? ' jf-racha-on' : ''}`}><small>Racha</small><b>🔥 {hud.racha}</b></span>
              </div>
              <div className="jf-progreso" aria-label={`Puntos para estrellas: ${umbrales.join(', ')}`}>
                <span className="jf-progreso-barra" style={{ width: `${progreso}%` }} />
                {umbrales.map((u, i) => (
                  <span
                    key={u}
                    className={`jf-hito${hud.puntos >= u ? ' jf-hito-on' : ''}`}
                    style={{ left: `${(u / umbrales[2]) * 100}%` }}
                  >★</span>
                ))}
              </div>
            </div>

            <div className="jf-burbuja jf-burbuja-linea" role="status" aria-live="polite">{mensaje}</div>

            <div className="jf-cancha">
              <canvas
                ref={canvasRef}
                className="jf-canvas"
                onPointerDown={alPresionar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                role="img"
                aria-label="Cancha de fútbol: portería al fondo"
              />
              {!atajando && (
                <img
                  key={viviEstado.id}
                  className={`jf-vivi ${viviEstado.clase ? `jf-vivi-${viviEstado.clase}` : ''}`}
                  src={vivi}
                  alt=""
                  draggable="false"
                />
              )}
              {cartel && (
                <div key={cartel.id} className={`jf-cartel jf-cartel-${cartel.tono}`} aria-hidden="true">
                  <strong>{cartel.texto}</strong>
                  {cartel.detalle && <span>{cartel.detalle}</span>}
                </div>
              )}
            </div>

            <div className="jf-card jf-controles">
              {!atajando ? (
                <>
                  <div className="jf-medidor-caja">
                    <span className="jf-etiqueta">Potencia</span>
                    <div className="jf-medidor" ref={medidorRef} aria-hidden="true">
                      <span
                        className="jf-medidor-zona"
                        style={{ left: `${ZONA_POTENCIA[0] * 100}%`, width: `${(ZONA_POTENCIA[1] - ZONA_POTENCIA[0]) * 100}%` }}
                      />
                      <span className="jf-medidor-cursor" ref={cursorRef} />
                    </div>
                  </div>
                  {nivel.efecto && (
                    <div className="jf-efecto">
                      <span className="jf-etiqueta">Efecto</span>
                      <div className="jf-efecto-botones" role="group" aria-label="Efecto del balón">
                        {[
                          { v: -1, txt: 'Curva izq.', d: 'M26 40 C6 28 6 14 22 4' },
                          { v: 0, txt: 'Recto', d: 'M16 40 L16 4' },
                          { v: 1, txt: 'Curva der.', d: 'M6 40 C26 28 26 14 10 4' },
                        ].map((o) => (
                          <button
                            key={o.v}
                            type="button"
                            className={`jf-efecto-btn${curvaUI === o.v ? ' jf-efecto-on' : ''}`}
                            onClick={() => elegirCurva(o.v)}
                            disabled={sub === 'vuelo' || sub === 'despues'}
                            aria-pressed={curvaUI === o.v}
                          >
                            <svg viewBox="0 0 32 44" aria-hidden="true">
                              <path d={o.d} />
                            </svg>
                            <span>{o.txt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="jf-saltar"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    saltar();
                  }}
                  disabled={!puedeSaltar || sub === 'despues'}
                >
                  <span aria-hidden="true">🧤</span> ¡Salta!
                </button>
              )}
              <details className="jf-ayuda">
                <summary>¿Cómo se juega?</summary>
                {atajando ? ayudaAtajar : ayudaTirar}
              </details>
            </div>
          </>
        )}

        {fase === 'resultado' && resultado && (
          <div className="jf-card jf-resultado">
            <p className="jf-eyebrow">Nivel {nivelIdx + 1} · {nivel.nombre}</p>
            <div className="jf-estrellas jf-estrellas-grandes" aria-label={`${resultado.estrellas} de 3 estrellas`}>
              {[1, 2, 3].map((s) => (
                <span key={s} className={s <= resultado.estrellas ? 'jf-estrella-on' : 'jf-estrella'}>★</span>
              ))}
            </div>
            <img
              className={`jf-vivi-grande ${resultado.estrellas >= 2 ? 'jf-vivi-feliz' : ''}`}
              src={vivi}
              alt="Vivi, la nutria"
              draggable="false"
            />
            <p className="jf-texto">
              {[
                'Aún no llegas a la primera estrella. ¡Otro intento, Vivi confía en ti!',
                'Buen partido. Con otra práctica sacas más estrellas.',
                '¡Muy bien! Casi un partido perfecto.',
                '¡Partido perfecto! La hinchada está de pie.',
              ][resultado.estrellas]}
            </p>
            <ul className="jf-datos">
              <li>Puntos: <b>{resultado.puntos}</b></li>
              <li>{resultado.modo === 'atajar' ? 'Atajadas' : 'Goles'}: <b>{resultado.aciertos} de {resultado.tiros}</b></li>
              <li>Mejor racha: <b>{resultado.mejorRacha}</b></li>
              {resultado.angulos > 0 && <li>{resultado.modo === 'atajar' ? 'Atajadas de lujo' : 'Goles en el ángulo'}: <b>{resultado.angulos}</b></li>}
              {resultado.dianas > 0 && <li>Dianas rotas: <b>{resultado.dianas}</b></li>}
              {resultado.perfectos > 0 && <li>Potencia perfecta: <b>{resultado.perfectos}</b></li>}
              {resultado.estrellas < 3 && <li className="jf-meta">Próxima estrella: <b>{nivel.estrellas[resultado.estrellas]} puntos</b></li>}
            </ul>
            <div className="jf-acciones">
              <button type="button" className="jf-btn jf-btn-suave" onClick={() => empezar(nivelIdx)}>
                Reintentar
              </button>
              {hayNivelSiguiente && resultado.estrellas >= 1 ? (
                <button type="button" className="jf-btn" onClick={() => empezar(nivelIdx + 1)}>
                  Siguiente nivel
                </button>
              ) : (
                <button type="button" className="jf-btn" onClick={atras}>
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
