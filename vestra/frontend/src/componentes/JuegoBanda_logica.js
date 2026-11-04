// Lógica pura del juego de la banda (sin React, sin audio, sin pantalla).
// Aquí viven los ritmos de cada nivel y la forma de calificar los toques.
// Todo se mide en "tiempos" (beats): 1 tiempo = una negra.

export const TIEMPOS_POR_COMPAS = 4; // compás de 4/4

// Figuras que se pueden usar en los ritmos
//   N = negra   (1 tiempo)       B = blanca (2 tiempos)
//   C = corchea (medio tiempo)   R = silencio de negra (1 tiempo, no se toca)
const FIGURAS = {
  N: { dur: 1, silencio: false },
  B: { dur: 2, silencio: false },
  C: { dur: 0.5, silencio: false },
  R: { dur: 1, silencio: true },
};

// Niveles: cada compás es una lista de figuras que debe sumar 4 tiempos.
// Para agregar un nivel nuevo, copia uno y cambia el ritmo y el bpm.
export const NIVELES = [
  {
    id: 'pulso',
    nombre: 'Pulso',
    descripcion: 'Solo negras: un toque por tiempo',
    bpm: 70,
    compases: [
      ['N', 'N', 'N', 'N'],
      ['N', 'N', 'N', 'N'],
    ],
  },
  {
    id: 'blancas',
    nombre: 'Notas largas',
    descripcion: 'Blancas: toca y espera dos tiempos',
    bpm: 70,
    compases: [
      ['B', 'N', 'N'],
      ['N', 'N', 'B'],
    ],
  },
  {
    id: 'corcheas',
    nombre: 'Corcheas',
    descripcion: 'Dos toques rápidos en un mismo tiempo',
    bpm: 72,
    compases: [
      ['N', 'C', 'C', 'N', 'N'],
      ['C', 'C', 'C', 'C', 'N', 'N'],
    ],
  },
  {
    id: 'silencios',
    nombre: 'Silencios',
    descripcion: 'Donde hay silencio, no se toca',
    bpm: 76,
    compases: [
      ['N', 'R', 'N', 'R'],
      ['N', 'N', 'R', 'N'],
    ],
  },
  {
    id: 'final',
    nombre: 'Gran final',
    descripcion: 'Todo mezclado, ¡tú puedes!',
    bpm: 80,
    compases: [
      ['N', 'C', 'C', 'B'],
      ['C', 'C', 'N', 'R', 'N'],
    ],
  },
];

// Convierte un nivel en una lista de eventos con su posición en el tiempo.
export function parsearNivel(nivel) {
  const eventos = [];
  let t = 0;
  let orden = 0;

  nivel.compases.forEach((compas, m) => {
    let suma = 0;
    compas.forEach((token) => {
      const figura = FIGURAS[token];
      if (!figura) throw new Error(`Figura desconocida: ${token}`);
      eventos.push({
        figura: token,
        inicio: t,
        dur: figura.dur,
        silencio: figura.silencio,
        compas: m,
        orden: figura.silencio ? null : orden++, // posición entre las notas que se tocan
        viga: null, // 'inicio' | 'fin' cuando dos corcheas van unidas
      });
      t += figura.dur;
      suma += figura.dur;
    });
    if (suma !== TIEMPOS_POR_COMPAS) {
      console.warn(`El compás ${m + 1} del nivel "${nivel.id}" suma ${suma} y debería sumar ${TIEMPOS_POR_COMPAS}.`);
    }
  });

  // Unir de dos en dos las corcheas que empiezan justo en un tiempo
  for (let i = 0; i < eventos.length - 1; i++) {
    const a = eventos[i];
    const b = eventos[i + 1];
    if (a.figura === 'C' && b.figura === 'C' && Number.isInteger(a.inicio) && a.compas === b.compas) {
      a.viga = 'inicio';
      b.viga = 'fin';
      i++;
    }
  }

  return {
    eventos,
    objetivos: eventos.filter((e) => !e.silencio).map((e) => e.inicio),
    totalTiempos: t,
    numCompases: nivel.compases.length,
  };
}

// Compara los toques del jugador con las notas de la partitura.
//   objetivos: tiempos (beats) donde debía tocar
//   toques:    tiempos (beats) donde tocó, con 0 = inicio del ritmo
export function evaluarToques({ objetivos, toques, perfecto = 0.15 }) {
  // Margen de error: máximo 0.3 tiempos, y menos si hay notas muy pegadas
  const separaciones = objetivos.slice(1).map((o, i) => o - objetivos[i]);
  const menorSeparacion = separaciones.length ? Math.min(...separaciones) : 1;
  const tolerancia = Math.min(0.3, menorSeparacion * 0.45);

  const usados = new Array(objetivos.length).fill(null); // toque asignado a cada nota
  const toquesDetalle = toques.map((t) => ({ t, ok: false }));
  const ordenados = toques.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t);

  for (const { t, i } of ordenados) {
    let mejor = -1;
    let mejorDist = Infinity;
    objetivos.forEach((o, k) => {
      if (usados[k] !== null) return;
      const dist = Math.abs(t - o);
      if (dist <= tolerancia && dist < mejorDist) {
        mejor = k;
        mejorDist = dist;
      }
    });
    if (mejor >= 0) {
      usados[mejor] = i;
      toquesDetalle[i].ok = true;
    }
  }

  // Desfase de cada nota tocada (negativo = tocó antes, positivo = tocó después)
  const desfases = usados.map((i, k) => (i === null ? null : toques[i] - objetivos[k]));
  const tocados = desfases.filter((d) => d !== null).sort((a, b) => a - b);

  // Casi todos los celulares tienen un pequeño retraso de sonido. Si el jugador va
  // siempre igual de adelantado o atrasado, se le perdona ese desvío constante
  // y se califica qué tan parejo toca (que es lo que importa en el ritmo).
  const mediana = tocados.length ? tocados[Math.floor(tocados.length / 2)] : 0;
  const ajuste = tocados.length >= 3 ? Math.max(-0.2, Math.min(0.2, mediana)) : 0;

  const resultados = objetivos.map((objetivo, k) => {
    const desfase = desfases[k];
    if (desfase === null) return { objetivo, estado: 'fallo', desfase: null };
    return { objetivo, estado: Math.abs(desfase - ajuste) <= perfecto ? 'perfecto' : 'bien', desfase };
  });

  const perfectos = resultados.filter((r) => r.estado === 'perfecto').length;
  const buenos = resultados.filter((r) => r.estado === 'bien').length;
  const extras = toquesDetalle.filter((t) => !t.ok).length;
  const total = objetivos.length;

  // Perfecto vale 1, bien vale 0.75 y cada toque de más resta 0.25
  const puntos = perfectos + buenos * 0.75 - extras * 0.25;
  const precision = total ? Math.max(0, puntos) / total : 0;
  const estrellas = precision >= 0.85 ? 3 : precision >= 0.6 ? 2 : precision >= 0.3 ? 1 : 0;

  let tendencia = 'justo';
  if (tocados.length >= 3 && mediana < -0.07) tendencia = 'adelantado';
  if (tocados.length >= 3 && mediana > 0.07) tendencia = 'atrasado';

  return {
    resultados,
    toquesDetalle,
    aciertos: perfectos + buenos,
    perfectos,
    extras,
    total,
    precision,
    estrellas,
    tendencia,
  };
}
