// Lógica pura del juego de fútbol (sin React, sin audio, sin pantalla).
// Aquí viven los niveles, la física simplificada del balón, el portero
// y la forma de dar puntos y estrellas.
//
// CÓMO SE MIDE TODO (unidades de portería)
//   x:  -1 = poste izquierdo,  0 = centro,  +1 = poste derecho
//   y:   0 = césped,           1 = larguero
//   s:   avance del balón: 0 = en el pie, 1 = en la línea de gol
//
// CÓMO FUNCIONA UN TIRO
//   1. El jugador apunta (tx, ty), elige efecto (curva) y suelta cuando la barra
//      de potencia está en la zona verde.
//   2. El balón viaja de s = 0 a s = 1 en T segundos. Más potencia = más rápido.
//      Si el muro está en el camino (s = S_MURO), puede bloquearlo.
//   3. Al llegar a la línea, el portero ataja o no (evaluarLlegada).
//
// Para agregar un nivel nuevo, copia uno de NIVELES y cambia sus datos.
// Al arrancar, `validarNivel` avisa en consola si algo no cuadra.

export const MAX_ESTRELLAS_NIVEL = 3;

/* ---------- constantes de la jugada ---------- */
export const S_MURO = 0.42; // en qué punto del vuelo está el muro
export const EFECTO = 0.5; // cuánto se abre la curva a mitad del vuelo (en x)
export const ZONA_POTENCIA = [0.6, 0.88]; // la zona verde de la barra
export const PERIODO_POTENCIA = 1.3; // segundos que tarda la barra en ir y volver
export const ALTO_MURO = 0.62;
export const ANCHO_JUGADOR_MURO = 0.22;
export const SALTO_MURO = 0.22; // cuánto suben los del muro cuando saltan

// Dianas que pueden colgar dentro de la portería
export const DIANAS_POSICIONES = [
  { x: -0.78, y: 0.8, valor: 150 },
  { x: 0.78, y: 0.8, valor: 150 },
  { x: -0.55, y: 0.2, valor: 100 },
  { x: 0.55, y: 0.2, valor: 100 },
  { x: 0, y: 0.5, valor: 120 },
];
export const RADIO_DIANA = 0.14;

// Cuando Vivi ataja
export const VELOCIDAD_VIVI = 1.9; // unidades de portería por segundo
export const DURACION_SALTO_VIVI = 0.5; // segundos en el aire
export const DEMORA_SALTO_VIVI = 0.06; // el salto tarda un poquito en despegar

/* ---------- niveles ----------
   modo:      'tirar' (tú pateas) | 'atajar' (Vivi al arco)
   tiros:     cuántos tiros tiene el nivel
   estrellas: puntos para conseguir 1, 2 y 3 estrellas
   efecto:    si se muestra el control de curva
   muro:      null o { n: jugadores, salta: si saltan al tirar }
   viento:    0 o fuerza máxima del viento (unidades de portería)
   dianas:    cuántas dianas cuelgan en la portería en cada tiro
   libre:     true = el balón cambia de lugar en cada tiro (tiro libre)
   portero:   lee = probabilidad de adivinar a dónde tiras
              vel = velocidad, reaccion = segundos que tarda en moverse
              alcance = qué tan ancho llega con las manos
              patrulla = true: no empieza siempre en el centro
   rival:     (solo 'atajar') tiempo de vuelo del balón en segundos [mín, máx]
*/
export const NIVELES = [
  {
    id: 'penaltis',
    nombre: 'Penaltis',
    descripcion: 'Apunta, carga y suelta en lo verde',
    modo: 'tirar',
    tiros: 5,
    estrellas: [250, 450, 680],
    efecto: false,
    muro: null,
    viento: 0,
    dianas: 0,
    libre: false,
    portero: { lee: 0.35, vel: 1.7, reaccion: 0.2, alcance: 0.22, patrulla: false },
  },
  {
    id: 'muro',
    nombre: 'El muro',
    descripcion: 'Tiro libre: rodea el muro con curva o por arriba',
    modo: 'tirar',
    tiros: 5,
    estrellas: [180, 320, 460],
    efecto: true,
    muro: { n: 4, salta: false },
    viento: 0,
    dianas: 0,
    libre: true,
    portero: { lee: 0.3, vel: 1.7, reaccion: 0.2, alcance: 0.22, patrulla: false },
  },
  {
    id: 'dianas',
    nombre: 'Dianas',
    descripcion: 'Mete gol y rompe las dianas para puntos extra',
    modo: 'tirar',
    tiros: 5,
    estrellas: [260, 440, 620],
    efecto: false,
    muro: null,
    viento: 0,
    dianas: 2,
    libre: false,
    portero: { lee: 0.4, vel: 1.8, reaccion: 0.18, alcance: 0.22, patrulla: false },
  },
  {
    id: 'viento',
    nombre: 'Viento',
    descripcion: 'El viento empuja el balón: apunta contra él',
    modo: 'tirar',
    tiros: 6,
    estrellas: [180, 330, 480],
    efecto: true,
    muro: { n: 3, salta: false },
    viento: 0.38,
    dianas: 0,
    libre: true,
    portero: { lee: 0.35, vel: 1.8, reaccion: 0.18, alcance: 0.22, patrulla: true },
  },
  {
    id: 'arco',
    nombre: 'Vivi al arco',
    descripcion: 'Ahora atajas tú: mueve a Vivi y salta a tiempo',
    modo: 'atajar',
    tiros: 6,
    estrellas: [240, 420, 600],
    efecto: false,
    muro: null,
    viento: 0,
    dianas: 0,
    libre: false,
    portero: { lee: 0, vel: VELOCIDAD_VIVI, reaccion: 0, alcance: 0.24, patrulla: false },
    rival: [0.95, 1.25],
  },
  {
    id: 'final',
    nombre: 'Gran final',
    descripcion: 'Muro que salta, viento y un portero astuto',
    modo: 'tirar',
    tiros: 6,
    estrellas: [200, 380, 560],
    efecto: true,
    muro: { n: 4, salta: true },
    viento: 0.28,
    dianas: 1,
    libre: true,
    portero: { lee: 0.5, vel: 2.0, reaccion: 0.15, alcance: 0.23, patrulla: true },
  },
];

/* ---------- utilidades ---------- */
export const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
const entre = (azar, a, b) => a + azar() * (b - a);
const signo = (v) => (v < 0 ? -1 : 1);

// Mezcla en orden aleatorio (sin tocar la lista original)
export function barajar(lista, azar = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// La barra de potencia sube y baja: 0 → 1 → 0 → 1 ...
export function potenciaEn(segundos) {
  const f = (segundos / PERIODO_POTENCIA) % 1;
  return f < 0.5 ? f * 2 : 2 - f * 2;
}

export function infoPotencia(p) {
  const [min, max] = ZONA_POTENCIA;
  return {
    perfecta: p >= min && p <= max,
    exceso: Math.max(0, p - max),
    T: 1.45 - 0.85 * p, // segundos que tarda el balón en llegar
  };
}

/* ---------- escena de cada tiro ---------- */
export function generarEscena(nivel, azar = Math.random) {
  // Posición del balón (en x). En penaltis siempre al centro.
  const xs = nivel.libre ? signo(azar() - 0.5) * entre(azar, 0.22, 0.5) : 0;

  let muro = null;
  if (nivel.muro) {
    const n = nivel.muro.n;
    muro = {
      n,
      x: xs * (1 - S_MURO), // justo en la línea entre el balón y el centro de la portería
      ancho: (n * ANCHO_JUGADOR_MURO) / 2,
      alto: ALTO_MURO,
      saltando: nivel.muro.salta && azar() < 0.75,
    };
  }

  // Viento: se redondea para que el número de flechas sea claro
  let viento = 0;
  if (nivel.viento) {
    const fuerza = Math.round(entre(azar, 0.12, nivel.viento) * 20) / 20;
    viento = signo(azar() - 0.5) * fuerza;
  }

  const dianas = barajar(DIANAS_POSICIONES, azar)
    .slice(0, nivel.dianas)
    .map((d) => ({ ...d, roto: false }));

  const porteroX = nivel.portero.patrulla ? entre(azar, -0.4, 0.4) : 0;

  return { xs, muro, viento, dianas, porteroX };
}

/* ---------- trayectoria del balón ---------- */
// tiro: { xs, tx, ty, curva (-1, 0, 1), viento }
export function trayectoria(tiro, s) {
  const x =
    tiro.xs +
    (tiro.tx - tiro.xs) * s +
    EFECTO * tiro.curva * Math.sin(Math.PI * s) +
    tiro.viento * Math.pow(s, 1.6);
  // Cuanto más alto apuntas, más se eleva el balón a mitad del vuelo
  const arco = 0.1 + 0.4 * tiro.ty;
  const y = tiro.ty * s + arco * 4 * s * (1 - s);
  return { x, y: Math.max(0, y) };
}

// ¿El muro frena este tiro?
export function muroBloquea(muro, tiro) {
  if (!muro) return false;
  const p = trayectoria(tiro, S_MURO);
  const alto = muro.alto + (muro.saltando ? SALTO_MURO : 0);
  return Math.abs(p.x - muro.x) < muro.ancho + 0.04 && p.y < alto;
}

// Si te pasas de potencia el balón se desvía (casi siempre hacia arriba)
export function aplicarDesvio(tiro, p, azar = Math.random) {
  const { exceso } = infoPotencia(p);
  const ruido = (azar() - 0.5) * 0.04; // el temblor natural de cualquier tiro
  return {
    ...tiro,
    tx: tiro.tx + ruido + (azar() - 0.5) * exceso * 3.5,
    ty: Math.max(0, tiro.ty + ruido + exceso * entre(azar, 0.3, 2.2)),
  };
}

/* ---------- el portero ---------- */
// Decide a dónde se tira el portero cuando patean
export function planPortero(nivel, x0, tx, azar = Math.random) {
  const P = nivel.portero;
  let destino;
  if (azar() < P.lee) {
    destino = tx + entre(azar, -0.12, 0.12); // adivinó
  } else if (azar() < 0.25) {
    destino = x0; // se quedó parado
  } else {
    destino = (azar() < 0.5 ? -1 : 1) * entre(azar, 0.3, 0.9); // apostó a un lado
  }
  return {
    x0,
    destino: limitar(destino, -1.1, 1.1),
    retraso: P.reaccion + entre(azar, 0, 0.08),
    vel: P.vel,
  };
}

// Dónde está el portero t segundos después del tiro
export function posicionPortero(plan, t) {
  const falta = plan.destino - plan.x0;
  const recorrido = Math.min(Math.abs(falta), plan.vel * Math.max(0, t - plan.retraso));
  return plan.x0 + signo(falta) * recorrido;
}

// Avanza a Vivi hacia donde le pide el jugador (modo atajar)
export function moverVivi(x, destino, dt, vel = VELOCIDAD_VIVI) {
  return x + limitar(destino - x, -vel * dt, vel * dt);
}

// ¿El balón entra en un rincón difícil?
export const esAngulo = (x, y) => Math.abs(x) > 0.55 && y > 0.62 && Math.abs(x) < 1 && y < 1;

/* ---------- qué pasa cuando el balón llega a la línea ---------- */
// x, y: dónde llega el balón. kx: dónde está el portero.
// estira: el portero se lanzó (alcanza más lejos y más alto).
export function evaluarLlegada({ x, y, kx, estira, alcance }) {
  // Madera: poste o larguero
  if (Math.abs(Math.abs(x) - 1) < 0.06 && y < 1.03) return 'poste';
  if (Math.abs(x) < 1 && Math.abs(y - 1) < 0.06) return 'larguero';
  if (Math.abs(x) >= 1 || y >= 1) return 'fuera';

  const alcanceX = alcance + (estira ? 0.12 : 0);
  const alcanceY = estira ? 0.8 : 0.6;
  return Math.abs(x - kx) < alcanceX && y < alcanceY ? 'atajada' : 'gol';
}

// ¿El balón rompió alguna diana? (devuelve la diana o null)
export function dianaTocada(dianas, x, y) {
  return dianas.find((d) => !d.roto && Math.hypot(x - d.x, y - d.y) < RADIO_DIANA + 0.03) || null;
}

/* ---------- puntos y estrellas ---------- */
// racha: goles (o atajadas) seguidos contando el de ahora
export function puntosDeTiro({ resultado, modo, racha, angulo, perfecta, diana }) {
  const acierto = modo === 'atajar' ? resultado === 'atajada' : resultado === 'gol';
  if (!acierto) return { total: 0, detalle: [] };
  const detalle = [{ txt: modo === 'atajar' ? 'Atajada' : 'Gol', pts: 100 }];
  if (angulo) detalle.push({ txt: modo === 'atajar' ? 'Atajada de lujo' : 'Ángulo', pts: 50 });
  if (diana) detalle.push({ txt: 'Diana', pts: diana.valor });
  if (perfecta && modo === 'tirar') detalle.push({ txt: 'Potencia perfecta', pts: 20 });
  if (racha >= 2) detalle.push({ txt: `Racha x${racha}`, pts: 30 * (racha - 1) });
  return { total: detalle.reduce((a, d) => a + d.pts, 0), detalle };
}

export function calcularEstrellas(nivel, puntos) {
  return nivel.estrellas.filter((umbral) => puntos >= umbral).length;
}

/* ---------- el rival (modo atajar) ---------- */
export function generarTiroRival(nivel, indice, azar = Math.random) {
  const centro = azar() < 0.15;
  const tx = centro ? entre(azar, -0.2, 0.2) : signo(azar() - 0.5) * entre(azar, 0.35, 0.92);
  const ty = azar() < 0.4 ? entre(azar, 0.62, 0.9) : entre(azar, 0.08, 0.5);
  const curva = azar() < 0.4 ? signo(azar() - 0.5) : 0;
  const [tMin, tMax] = nivel.rival;
  // los tiros se van haciendo más rápidos
  const T = Math.max(0.72, entre(azar, tMin, tMax) - indice * 0.05);
  return { xs: 0, tx, ty, curva, viento: 0, T };
}

/* ---------- una jugada completa, sin pantalla ----------
   La usa el balance de pruebas y sirve para comprobar que la lógica
   completa funciona igual que el juego. Devuelve cómo terminó el tiro. */
export function simularTiroJugador(nivel, escena, orden, azar = Math.random) {
  const info = infoPotencia(orden.potencia);
  const tiro = aplicarDesvio(
    { xs: escena.xs, tx: orden.tx, ty: orden.ty, curva: orden.curva || 0, viento: escena.viento },
    orden.potencia,
    azar
  );
  if (muroBloquea(escena.muro, tiro)) return { resultado: 'muro', tiro, info };

  const plan = planPortero(nivel, escena.porteroX, tiro.tx, azar);
  const kx = posicionPortero(plan, info.T);
  const fin = trayectoria(tiro, 1);
  const estira = Math.abs(kx - plan.x0) > 0.2;
  let resultado = evaluarLlegada({ x: fin.x, y: fin.y, kx, estira, alcance: nivel.portero.alcance });
  let diana = null;
  if (resultado === 'gol') diana = dianaTocada(escena.dianas, fin.x, fin.y);
  return { resultado, tiro, info, fin, diana, angulo: resultado === 'gol' && esAngulo(fin.x, fin.y) };
}

/* ---------- revisar que un nivel esté bien escrito ---------- */
export function validarNivel(nivel) {
  const problemas = [];
  if (!['tirar', 'atajar'].includes(nivel.modo)) problemas.push('modo debe ser "tirar" o "atajar"');
  if (!(nivel.tiros > 0)) problemas.push('tiros debe ser mayor que 0');
  if (!Array.isArray(nivel.estrellas) || nivel.estrellas.length !== 3) {
    problemas.push('estrellas debe tener 3 umbrales de puntos');
  } else if (!(nivel.estrellas[0] < nivel.estrellas[1] && nivel.estrellas[1] < nivel.estrellas[2])) {
    problemas.push('los umbrales de estrellas deben ir de menor a mayor');
  }
  if (!nivel.portero) problemas.push('falta portero');
  if (nivel.modo === 'atajar' && !nivel.rival) problemas.push('modo atajar necesita rival: [min, max]');
  return problemas;
}
