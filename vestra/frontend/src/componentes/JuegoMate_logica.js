/* =====================================================================
   JUEGO DE MATEMÁTICA · lógica pura (sin React)
   Genera los ejercicios de factorización, arma las fichas y comprueba
   la respuesta EXPANDIENDO lo que armó el jugador: así cualquier
   factorización equivalente cuenta (por ejemplo (x+2)(x+3) o (x+3)(x+2)).
   ===================================================================== */

export const VIDAS_INICIALES = 3;
export const PISTAS_POR_NIVEL = 3;

/* ---------- utilidades ---------- */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const elegir = (lista) => lista[rnd(0, lista.length - 1)];

function barajar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const mcd = (a, b) => (b === 0 ? Math.abs(a) : mcd(b, a % b));
const num = (n) => String(n).replace('-', '−');

/* "+3" o "−3" (para las fichas y los huecos con signo) */
export const conSigno = (n) => (n < 0 ? '−' : '+') + Math.abs(n);

/* a x² + b x + c escrito como texto: "x² − 5x + 6" */
export function formatearPolinomio({ a = 0, b = 0, c = 0 }) {
  const partes = [];
  const agregar = (coef, sufijo) => {
    if (coef === 0) return;
    const abs = Math.abs(coef);
    const cuerpo = (abs === 1 && sufijo ? '' : String(abs)) + sufijo;
    if (partes.length === 0) partes.push((coef < 0 ? '−' : '') + cuerpo);
    else partes.push((coef < 0 ? ' − ' : ' + ') + cuerpo);
  };
  agregar(a, 'x²');
  agregar(b, 'x');
  agregar(c, '');
  return partes.join('') || '0';
}

/* ---------- plantillas: cómo se "arma" cada tipo de factorización ---------- */
const S = (id, tipo) => ({ t: 'slot', id, tipo }); // hueco: 'coef' (positivo) o 'const' (con signo)
const T = (v) => ({ t: 'txt', v }); // texto fijo

export const PLANTILLAS = {
  // g(px + q)
  comunLineal: [S('g', 'coef'), T('('), S('p', 'coef'), T('x'), S('q', 'const'), T(')')],
  // gx(px + q)
  comunCuad: [S('g', 'coef'), T('x'), T('('), S('p', 'coef'), T('x'), S('q', 'const'), T(')')],
  // (x + m)(x + n)
  mon: [T('('), T('x'), S('m', 'const'), T(')'), T('('), T('x'), S('n', 'const'), T(')')],
  // (px + m)(qx + n)
  bin: [
    T('('), S('p', 'coef'), T('x'), S('m', 'const'), T(')'),
    T('('), S('q', 'coef'), T('x'), S('n', 'const'), T(')'),
  ],
  // (px + m)²
  cuadrado: [T('('), S('p', 'coef'), T('x'), S('m', 'const'), T(')'), T('²')],
  // g(x + m)(x + n)
  jefe: [S('g', 'coef'), T('('), T('x'), S('m', 'const'), T(')'), T('('), T('x'), S('n', 'const'), T(')')],
};

/* Qué polinomio resulta de multiplicar lo que armó el jugador */
const EXPANSORES = {
  comunLineal: (v) => ({ a: 0, b: v.g * v.p, c: v.g * v.q }),
  comunCuad: (v) => ({ a: v.g * v.p, b: v.g * v.q, c: 0 }),
  mon: (v) => ({ a: 1, b: v.m + v.n, c: v.m * v.n }),
  bin: (v) => ({ a: v.p * v.q, b: v.p * v.n + v.q * v.m, c: v.m * v.n }),
  cuadrado: (v) => EXPANSORES.bin({ p: v.p, q: v.p, m: v.m, n: v.m }),
  jefe: (v) => ({ a: v.g, b: v.g * (v.m + v.n), c: v.g * v.m * v.n }),
};

/* La respuesta correcta escrita: "(x + 2)(x + 3)" */
function textoSolucion(tipo, solucion) {
  const tokens = PLANTILLAS[tipo];
  return tokens
    .map((tok, i) => {
      if (tok.t === 'txt') return tok.v;
      const v = solucion[tok.id];
      if (tok.tipo === 'const') return (v < 0 ? ' − ' : ' + ') + Math.abs(v);
      // "1x" se escribe simplemente "x"
      const siguiente = tokens[i + 1];
      return v === 1 && siguiente && siguiente.t === 'txt' && siguiente.v === 'x' ? '' : String(v);
    })
    .join('');
}

/* ---------- fichas: las correctas + señuelos (sobre todo trampas de signo) ---------- */
function construirFichas(tipo, solucion) {
  const fichas = PLANTILLAS[tipo]
    .filter((tok) => tok.t === 'slot')
    .map((tok) => ({ valor: solucion[tok.id], tipo: tok.tipo }));

  const consts = fichas.filter((f) => f.tipo === 'const').map((f) => f.valor);
  const coefs = fichas.filter((f) => f.tipo === 'coef').map((f) => f.valor);

  if (consts.length) {
    const candidatos = new Set();
    consts.forEach((v) => candidatos.add(-v)); // la trampa del signo
    consts.forEach((v) => {
      candidatos.add(v + 1);
      candidatos.add(v - 1);
    });
    const validos = barajar([...candidatos].filter((v) => v !== 0 && Math.abs(v) <= 12 && !consts.includes(v)));
    validos.slice(0, consts.length <= 1 ? 2 : 3).forEach((v) => fichas.push({ valor: v, tipo: 'const' }));
  }

  if (coefs.length) {
    const candidatos = new Set();
    coefs.forEach((v) => {
      candidatos.add(v + 1);
      candidatos.add(v - 1);
      candidatos.add(v * 2);
    });
    const validos = barajar([...candidatos].filter((v) => v >= 1 && v <= 12 && !coefs.includes(v)));
    validos.slice(0, coefs.length <= 1 ? 2 : 1).forEach((v) => fichas.push({ valor: v, tipo: 'coef' }));
  }

  return barajar(fichas).map((f, i) => ({ ...f, id: i }));
}

function armar(tipo, solucion, pista) {
  return {
    tipo,
    solucion,
    objetivo: EXPANSORES[tipo](solucion),
    fichas: construirFichas(tipo, solucion),
    pista,
    solucionTexto: textoSolucion(tipo, solucion),
  };
}

/* ---------- generadores de ejercicios ---------- */
function genComunLineal() {
  let g, p, q;
  do {
    g = rnd(2, 8);
    p = rnd(1, 5);
    q = rnd(1, 7);
  } while (mcd(p, q) !== 1);
  return armar('comunLineal', { g, p, q }, `Busca el mayor número que divide a ${g * p} y a ${g * q}. Ese es el factor común.`);
}

function genComunCuad() {
  let g, p, q;
  do {
    g = rnd(2, 6);
    p = rnd(1, 4);
    q = rnd(1, 7);
  } while (mcd(p, q) !== 1);
  return armar(
    'comunCuad',
    { g, p, q },
    `Los dos términos tienen x: sácala. Y busca el mayor número que divide a ${g * p} y a ${g * q}.`
  );
}

function genMon(modo) {
  let m, n;
  do {
    const a = rnd(1, 8);
    const b = rnd(1, 8);
    if (modo === 'pos') {
      m = a;
      n = b;
    } else if (modo === 'neg') {
      m = -a;
      n = -b;
    } else {
      m = a * elegir([1, -1]);
      n = -Math.sign(m) * b;
    }
  } while (m === n || m + n === 0);
  const b = m + n;
  const c = m * n;
  return armar('mon', { m, n }, `Busca dos números que multiplicados den ${num(c)} y sumados den ${num(b)}.`);
}

function genDif(k) {
  const r = rnd(2, k === 1 ? 9 : 7);
  const m = elegir([r, -r]);
  if (k === 1) {
    return armar(
      'mon',
      { m, n: -m },
      `Es una diferencia de cuadrados: a² − b² = (a + b)(a − b). ¿Qué número al cuadrado da ${r * r}?`
    );
  }
  return armar(
    'bin',
    { p: k, q: k, m, n: -m },
    `Diferencia de cuadrados: a² − b² = (a + b)(a − b). ¿Qué expresión al cuadrado da ${k * k}x²? ¿Y qué número da ${r * r}?`
  );
}

function genCuadrado(p) {
  const m = elegir([1, -1]) * rnd(1, p === 1 ? 9 : 6);
  const pista = `Trinomio cuadrado perfecto: (a + b)² = a² + 2ab + b². ¿Qué número elevado al cuadrado da ${m * m}?`;
  if (p === 1) return armar('mon', { m, n: m }, pista);
  return armar('cuadrado', { p, m }, pista);
}

function genBin(pMax) {
  let p, q, m, n, ex;
  do {
    p = rnd(1, pMax);
    q = rnd(1, pMax);
    m = elegir([1, -1]) * rnd(1, 6);
    n = elegir([1, -1]) * rnd(1, 6);
    ex = EXPANSORES.bin({ p, q, m, n });
  } while (
    p * q === 1 ||
    ex.b === 0 ||
    mcd(mcd(ex.a, ex.b), ex.c) !== 1 ||
    (p === q && m === n) ||
    (p === q && m === -n)
  );
  return armar(
    'bin',
    { p, q, m, n },
    `Prueba combinaciones: los coeficientes de x deben multiplicar ${ex.a} y los números ${num(ex.c)}. Revisa que el término del medio dé ${num(ex.b)}x.`
  );
}

function genJefe(modo) {
  const g = rnd(2, 5);
  let m, n;
  if (modo === 'dif') {
    const r = rnd(2, 6);
    m = elegir([r, -r]);
    n = -m;
  } else {
    do {
      const a = rnd(1, 7);
      const b = rnd(1, 7);
      const tipoSigno = elegir(['pos', 'neg', 'mixto']);
      if (tipoSigno === 'pos') [m, n] = [a, b];
      else if (tipoSigno === 'neg') [m, n] = [-a, -b];
      else {
        m = a * elegir([1, -1]);
        n = -Math.sign(m) * b;
      }
    } while (m === n || m + n === 0);
  }
  const dentro = formatearPolinomio({ a: 1, b: m + n, c: m * n });
  return armar('jefe', { g, m, n }, `Primero saca el factor común ${g}. Dentro del paréntesis te queda ${dentro}: factorízalo.`);
}

const GENERADORES = {
  comunLineal: () => genComunLineal(),
  comunCuad: () => genComunCuad(),
  monPos: () => genMon('pos'),
  monNeg: () => genMon('neg'),
  monMixto: () => genMon('mixto'),
  difUno: () => genDif(1),
  difK: () => genDif(rnd(2, 4)),
  cuadradoUno: () => genCuadrado(1),
  cuadradoK: () => genCuadrado(rnd(2, 3)),
  binFacil: () => genBin(2),
  binGeneral: () => genBin(3),
  jefe: () => genJefe('normal'),
  jefeDif: () => genJefe('dif'),
};

/* ---------- niveles ---------- */
export const NIVELES = [
  {
    id: 'comun',
    nombre: 'Factor común',
    emoji: '🧩',
    descripcion: 'Saca lo que se repite: 6x + 9 = 3(2x + 3).',
    rondas: ['comunLineal', 'comunLineal', 'comunLineal', 'comunCuad', 'comunCuad', 'comunCuad'],
  },
  {
    id: 'trinomios',
    nombre: 'Trinomios',
    emoji: '🔍',
    descripcion: 'x² + 5x + 6: dos números que multiplican y suman.',
    rondas: ['monPos', 'monPos', 'monPos', 'monNeg', 'monNeg', 'monNeg'],
  },
  {
    id: 'signos',
    nombre: 'Signos traviesos',
    emoji: '🎭',
    descripcion: 'x² + 2x − 15: un positivo y un negativo.',
    rondas: ['monMixto', 'monMixto', 'monMixto', 'monMixto', 'monMixto', 'monMixto'],
  },
  {
    id: 'cuadrados',
    nombre: 'Cuadrados',
    emoji: '🔷',
    descripcion: 'Diferencia de cuadrados y trinomios cuadrados perfectos.',
    rondas: ['difUno', 'cuadradoUno', 'difUno', 'difK', 'cuadradoK', 'difK'],
  },
  {
    id: 'trinomios-a',
    nombre: 'Trinomios con a > 1',
    emoji: '🧠',
    descripcion: '2x² + 7x + 3: aquí hay que probar con cabeza.',
    rondas: ['binFacil', 'binFacil', 'binFacil', 'binGeneral', 'binGeneral', 'binGeneral'],
  },
  {
    id: 'jefe',
    nombre: 'Jefe final',
    emoji: '👑',
    descripcion: 'Combina todo: factor común y luego factorizar.',
    rondas: ['jefe', 'jefeDif', 'binGeneral', 'jefe', 'jefeDif', 'jefe'],
  },
];

/* Genera las 6 rondas de un nivel, sin repetir ejercicios */
export function generarNivel(nivel) {
  const vistos = new Set();
  return nivel.rondas.map((clave) => {
    let problema;
    for (let intento = 0; intento < 30; intento++) {
      problema = GENERADORES[clave]();
      const huella = `${problema.objetivo.a},${problema.objetivo.b},${problema.objetivo.c}`;
      if (!vistos.has(huella)) {
        vistos.add(huella);
        break;
      }
    }
    return problema;
  });
}

/* ---------- comprobar lo que armó el jugador ----------
   valores: { g: 3, p: 2, q: 3 ... } con el número de cada hueco. */
export function comprobarRespuesta(problema, valores) {
  const expansion = EXPANSORES[problema.tipo](valores);
  const coincide = {
    a: expansion.a === problema.objetivo.a,
    b: expansion.b === problema.objetivo.b,
    c: expansion.c === problema.objetivo.c,
  };
  return { correcto: coincide.a && coincide.b && coincide.c, expansion, coincide };
}
