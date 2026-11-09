// Lógica pura del juego de la Academia de idiomas (sin React, sin audio, sin pantalla).
// Aquí viven el vocabulario, las frases, la generación de rondas y las estrellas.
// Para agregar contenido NUEVO solo toca las listas de abajo (ITEMS, FRASES, PALABRAS).

// Idioma base del jugador (para las cartas de "Parejas" y la voz)
export const ESPANOL = { id: 'es', nombre: 'Español', corto: 'ES', bandera: '🇪🇸', voz: 'es-ES' };

export const IDIOMAS = {
  en: { id: 'en', nombre: 'English', corto: 'EN', bandera: '🇬🇧', voz: 'en-GB' },
  pt: { id: 'pt', nombre: 'Português', corto: 'PT', bandera: '🇧🇷', voz: 'pt-BR' },
};

/* =====================================================================
   1) CAFÉ DE VIVI · vocabulario de comida y bebida
   formas[idioma] = [una unidad, dos unidades]
   ===================================================================== */
export const ITEMS = [
  {
    id: 'cafe', emoji: '☕', en: 'coffee', pt: 'café',
    formas: {
      en: ['a coffee', 'two coffees'],
      pt: ['um café', 'dois cafés'],
      es: ['un café', 'dos cafés'],
    },
  },
  {
    id: 'leche', emoji: '🥛', en: 'milk', pt: 'leite',
    formas: {
      en: ['a glass of milk', 'two glasses of milk'],
      pt: ['um copo de leite', 'dois copos de leite'],
      es: ['un vaso de leche', 'dos vasos de leche'],
    },
  },
  {
    id: 'jugo', emoji: '🧃', en: 'juice', pt: 'suco',
    formas: {
      en: ['a juice', 'two juices'],
      pt: ['um suco', 'dois sucos'],
      es: ['un jugo', 'dos jugos'],
    },
  },
  {
    id: 'agua', emoji: '💧', en: 'water', pt: 'água',
    formas: {
      en: ['a bottle of water', 'two bottles of water'],
      pt: ['uma garrafa de água', 'duas garrafas de água'],
      es: ['una botella de agua', 'dos botellas de agua'],
    },
  },
  {
    id: 'manzana', emoji: '🍎', en: 'apple', pt: 'maçã',
    formas: {
      en: ['an apple', 'two apples'],
      pt: ['uma maçã', 'duas maçãs'],
      es: ['una manzana', 'dos manzanas'],
    },
  },
  {
    id: 'banano', emoji: '🍌', en: 'banana', pt: 'banana',
    formas: {
      en: ['a banana', 'two bananas'],
      pt: ['uma banana', 'duas bananas'],
      es: ['un plátano', 'dos plátanos'],
    },
  },
  {
    id: 'pan', emoji: '🍞', en: 'bread', pt: 'pão',
    formas: {
      en: ['a bread roll', 'two bread rolls'],
      pt: ['um pão', 'dois pães'],
      es: ['un pan', 'dos panes'],
    },
  },
  {
    id: 'pastel', emoji: '🍰', en: 'cake', pt: 'bolo',
    formas: {
      en: ['a slice of cake', 'two slices of cake'],
      pt: ['uma fatia de bolo', 'duas fatias de bolo'],
      es: ['una porción de pastel', 'dos porciones de pastel'],
    },
  },
  {
    id: 'galleta', emoji: '🍪', en: 'cookie', pt: 'biscoito',
    formas: {
      en: ['a cookie', 'two cookies'],
      pt: ['um biscoito', 'dois biscoitos'],
      es: ['una galleta', 'dos galletas'],
    },
  },
  {
    id: 'sandwich', emoji: '🥪', en: 'sandwich', pt: 'sanduíche',
    formas: {
      en: ['a sandwich', 'two sandwiches'],
      pt: ['um sanduíche', 'dois sanduíches'],
      es: ['un sándwich', 'dos sándwiches'],
    },
  },
  {
    id: 'pizza', emoji: '🍕', en: 'pizza', pt: 'pizza',
    formas: {
      en: ['a slice of pizza', 'two slices of pizza'],
      pt: ['uma fatia de pizza', 'duas fatias de pizza'],
      es: ['una porción de pizza', 'dos porciones de pizza'],
    },
  },
  {
    id: 'helado', emoji: '🍦', en: 'ice cream', pt: 'sorvete',
    formas: {
      en: ['an ice cream', 'two ice creams'],
      pt: ['um sorvete', 'dois sorvetes'],
      es: ['un helado', 'dos helados'],
    },
  },
];

const ITEM_POR_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
export const itemPorId = (id) => ITEM_POR_ID[id];

// Así se pide en cada idioma ({x} = lo que se pide). El español es la ayuda.
const PLANTILLAS = {
  en: ["I'd like {x}, please.", 'Can I have {x}, please?', 'Could I get {x}, please?'],
  pt: ['Eu queria {x}, por favor.', 'Pode me trazer {x}, por favor?', 'Quero {x}, por favor.'],
  es: ['Quisiera {x}, por favor.'],
};
const CONJUNCION = { en: 'and', pt: 'e', es: 'y' };

// Dificultad de cada pedido: cuántos productos distintos y cuántos van dobles
const NIVELES_PEDIDO = [
  { productos: 1, dobles: 0 },
  { productos: 2, dobles: 0 },
  { productos: 2, dobles: 1 },
  { productos: 3, dobles: 0 },
  { productos: 3, dobles: 1 },
];
// A partir de este pedido (0 = el primero) se esconden los nombres de la estantería
export const PEDIDO_SIN_ETIQUETAS_DESDE = 3;

const CLIENTES = ['🧒', '👧', '🧑‍🎓', '👦', '👵', '👨‍🏫', '👩‍🍳', '🧓'];

export function mezclar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

function unir(lista, conj) {
  if (lista.length <= 1) return lista[0] || '';
  return `${lista.slice(0, -1).join(', ')} ${conj} ${lista[lista.length - 1]}`;
}

function textoPedidoEn(idioma, items) {
  const lista = items.map((p) => ITEM_POR_ID[p.id].formas[idioma][p.cant - 1]);
  return elegir(PLANTILLAS[idioma]).replace('{x}', unir(lista, CONJUNCION[idioma]));
}

// Devuelve las rondas del café: [{ items:[{id,cant}], texto, es, cliente }]
export function generarPedidos(idioma) {
  const clientes = mezclar(CLIENTES);
  return NIVELES_PEDIDO.map((nivel, i) => {
    const elegidos = mezclar(ITEMS).slice(0, nivel.productos);
    const items = elegidos.map((it) => ({ id: it.id, cant: 1 }));
    mezclar(items).slice(0, nivel.dobles).forEach((p) => {
      p.cant = 2;
    });
    const listaEs = items.map((p) => ITEM_POR_ID[p.id].formas.es[p.cant - 1]);
    return {
      items,
      texto: textoPedidoEn(idioma, items),
      es: PLANTILLAS.es[0].replace('{x}', unir(listaEs, CONJUNCION.es)),
      cliente: clientes[i % clientes.length],
      sinEtiquetas: i >= PEDIDO_SIN_ETIQUETAS_DESDE,
    };
  });
}

// bandeja = { idProducto: cantidad }
export function evaluarBandeja(pedido, bandeja) {
  const quiere = Object.fromEntries(pedido.items.map((p) => [p.id, p.cant]));
  const faltan = [];
  const sobran = [];
  ITEMS.forEach((it) => {
    const pide = quiere[it.id] || 0;
    const tiene = bandeja[it.id] || 0;
    if (tiene < pide) faltan.push(it.id);
    else if (tiene > pide) sobran.push(it.id);
  });
  return { correcto: faltan.length === 0 && sobran.length === 0, faltan, sobran };
}

/* =====================================================================
   2) ARMA LA FRASE · tokens en orden correcto + palabras de más (extra)
   Cuida que las palabras "extra" no formen otra frase también válida.
   ===================================================================== */
export const FRASES = {
  en: [
    { es: '¿Cómo estás hoy?', tokens: ['How', 'are', 'you', 'today?'], extra: ['is', 'do'] },
    { es: 'Me gusta leer libros.', tokens: ['I', 'like', 'reading', 'books.'], extra: ['am', 'the'] },
    { es: '¿Dónde está la biblioteca?', tokens: ['Where', 'is', 'the', 'library?'], extra: ['are', 'a'] },
    { es: 'Mi mejor amigo vive aquí.', tokens: ['My', 'best', 'friend', 'lives', 'here.'], extra: ['live', 'in'] },
    { es: 'Tengo clase de inglés a las ocho.', tokens: ['I', 'have', 'English', 'class', 'at', 'eight.'], extra: ['has', 'on'] },
    { es: 'Ella come una manzana roja.', tokens: ['She', 'eats', 'a', 'red', 'apple.'], extra: ['eat', 'an'] },
    { es: '¿Puedo tomar agua, por favor?', tokens: ['Can', 'I', 'have', 'some', 'water,', 'please?'], extra: ['you', 'a'] },
    { es: 'Vamos al parque después de la escuela.', tokens: ['We', 'go', 'to', 'the', 'park', 'after', 'school.'], extra: ['goes', 'in'] },
    { es: 'El gato duerme en el sofá.', tokens: ['The', 'cat', 'sleeps', 'on', 'the', 'sofa.'], extra: ['sleep', 'at'] },
    { es: 'Hoy hace mucho calor.', tokens: ['It', 'is', 'very', 'hot', 'today.'], extra: ['are', 'cold'] },
  ],
  pt: [
    { es: '¿Cómo estás hoy?', tokens: ['Como', 'você', 'está', 'hoje?'], extra: ['estou', 'ontem'] },
    { es: 'Me gusta leer libros.', tokens: ['Eu', 'gosto', 'de', 'ler', 'livros.'], extra: ['gostar', 'os'] },
    { es: '¿Dónde está la biblioteca?', tokens: ['Onde', 'está', 'a', 'biblioteca?'], extra: ['estão', 'o'] },
    { es: 'Mi mejor amigo vive aquí.', tokens: ['Meu', 'melhor', 'amigo', 'mora', 'aqui.'], extra: ['minha', 'ali'] },
    { es: 'Tengo clase de inglés a las ocho.', tokens: ['Eu', 'tenho', 'aula', 'de', 'inglês', 'às', 'oito.'], extra: ['tem', 'nas'] },
    { es: 'Ella come una manzana roja.', tokens: ['Ela', 'come', 'uma', 'maçã', 'vermelha.'], extra: ['um', 'comem'] },
    { es: '¿Puedo tomar agua, por favor?', tokens: ['Posso', 'beber', 'água,', 'por', 'favor?'], extra: ['podemos', 'comer'] },
    { es: 'Vamos al parque después de la escuela.', tokens: ['Vamos', 'ao', 'parque', 'depois', 'da', 'escola.'], extra: ['no', 'vai'] },
    { es: 'El gato duerme en el sofá.', tokens: ['O', 'gato', 'dorme', 'no', 'sofá.'], extra: ['dormem', 'na'] },
    { es: 'Hoy hace mucho calor.', tokens: ['Hoje', 'faz', 'muito', 'calor.'], extra: ['está', 'frio'] },
  ],
};

// Elige n frases al azar y deja sus fichas mezcladas (distinto del orden correcto)
export function generarFrases(idioma, n = 5) {
  return mezclar(FRASES[idioma])
    .slice(0, n)
    .map((f, k) => {
      const base = [...f.tokens, ...f.extra].map((texto, i) => ({ id: `f${k}-${i}`, texto }));
      let fichas = mezclar(base);
      for (let intento = 0; intento < 8; intento++) {
        const igual = fichas.slice(0, f.tokens.length).every((x, i) => x.texto === f.tokens[i]);
        if (!igual) break;
        fichas = mezclar(base);
      }
      return { es: f.es, solucion: f.tokens, fichas, texto: f.tokens.join(' ') };
    });
}

// Compara lo que armó el jugador (lista de textos) con la solución.
// estados[i] = 'ok' | 'mal' para cada ficha puesta.
export function compararFrase(solucion, puestas) {
  const estados = puestas.map((t, i) => (t === solucion[i] ? 'ok' : 'mal'));
  const correcto = puestas.length === solucion.length && estados.every((e) => e === 'ok');
  return { correcto, estados };
}

// Ids de las fichas en el orden correcto (para "Ver respuesta")
export function ordenCorrecto(frase) {
  const usados = new Set();
  return frase.solucion.map((t) => {
    const ficha = frase.fichas.find((f) => f.texto === t && !usados.has(f.id));
    usados.add(ficha.id);
    return ficha.id;
  });
}

/* =====================================================================
   VOCABULARIO GENERAL · lo usan Parejas, Pesca de palabras y Deletrea
   (para agregar palabras, basta con añadir una línea aquí)
   ===================================================================== */
export const PALABRAS = [
  { id: 'libro', emoji: '📘', es: 'libro', en: 'book', pt: 'livro' },
  { id: 'lapiz', emoji: '✏️', es: 'lápiz', en: 'pencil', pt: 'lápis' },
  { id: 'escuela', emoji: '🏫', es: 'escuela', en: 'school', pt: 'escola' },
  { id: 'gato', emoji: '🐱', es: 'gato', en: 'cat', pt: 'gato' },
  { id: 'perro', emoji: '🐶', es: 'perro', en: 'dog', pt: 'cachorro' },
  { id: 'casa', emoji: '🏠', es: 'casa', en: 'house', pt: 'casa' },
  { id: 'sol', emoji: '☀️', es: 'sol', en: 'sun', pt: 'sol' },
  { id: 'luna', emoji: '🌙', es: 'luna', en: 'moon', pt: 'lua' },
  { id: 'arbol', emoji: '🌳', es: 'árbol', en: 'tree', pt: 'árvore' },
  { id: 'carro', emoji: '🚗', es: 'carro', en: 'car', pt: 'carro' },
  { id: 'pez', emoji: '🐟', es: 'pez', en: 'fish', pt: 'peixe' },
  { id: 'flor', emoji: '🌸', es: 'flor', en: 'flower', pt: 'flor' },
  { id: 'estrella', emoji: '⭐', es: 'estrella', en: 'star', pt: 'estrela' },
  { id: 'corazon', emoji: '❤️', es: 'corazón', en: 'heart', pt: 'coração' },
  { id: 'lluvia', emoji: '🌧️', es: 'lluvia', en: 'rain', pt: 'chuva' },
  { id: 'amigo', emoji: '🤝', es: 'amigo', en: 'friend', pt: 'amigo' },
  { id: 'puerta', emoji: '🚪', es: 'puerta', en: 'door', pt: 'porta' },
  { id: 'playa', emoji: '🏖️', es: 'playa', en: 'beach', pt: 'praia' },
  { id: 'zapato', emoji: '👟', es: 'zapato', en: 'shoe', pt: 'sapato' },
  { id: 'reloj', emoji: '⏰', es: 'reloj', en: 'clock', pt: 'relógio' },
  { id: 'mano', emoji: '✋', es: 'mano', en: 'hand', pt: 'mão' },
  { id: 'ojo', emoji: '👁️', es: 'ojo', en: 'eye', pt: 'olho' },
  { id: 'queso', emoji: '🧀', es: 'queso', en: 'cheese', pt: 'queijo' },
];

const sinTildes = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* =====================================================================
   NIVEL 1 · PAREJAS POLÍGLOTAS · palabra en español ↔ palabra en el idioma
   Se evitan las palabras que se escriben igual en los dos idiomas.
   ===================================================================== */
export const PARES_POR_PARTIDA = 6;

export function generarMazo(idioma, pares = PARES_POR_PARTIDA) {
  const cartas = [];
  mezclar(PALABRAS.filter((p) => sinTildes(p.es) !== sinTildes(p[idioma])))
    .slice(0, pares)
    .forEach((p) => {
      cartas.push({ uid: `${p.id}-es`, par: p.id, lang: 'es', texto: p.es, emoji: p.emoji });
      cartas.push({ uid: `${p.id}-${idioma}`, par: p.id, lang: idioma, texto: p[idioma], emoji: p.emoji });
    });
  return mezclar(cartas);
}

/* =====================================================================
   NIVEL 2 · PESCA DE PALABRAS · escuchas la palabra y revientas su burbuja
   Las últimas rondas son "solo oído": la palabra no se muestra escrita.
   ===================================================================== */
export const BURBUJAS_POR_PARTIDA = 6;
export const OPCIONES_BURBUJAS = 6;
export const BURBUJAS_SOLO_OIDO_DESDE = 3;

export function generarBurbujas(idioma, n = BURBUJAS_POR_PARTIDA) {
  const objetivos = mezclar(PALABRAS).slice(0, n);
  return objetivos.map((palabra, i) => {
    const otras = mezclar(PALABRAS.filter((p) => p.id !== palabra.id)).slice(0, OPCIONES_BURBUJAS - 1);
    return {
      palabra,
      texto: palabra[idioma],
      opciones: mezclar([palabra, ...otras]),
      soloOido: i >= BURBUJAS_SOLO_OIDO_DESDE,
    };
  });
}

/* =====================================================================
   NIVEL 4 · DELETREA · armas la palabra letra por letra
   De la tercera palabra en adelante hay letras de más.
   ===================================================================== */
export const DELETREOS_POR_PARTIDA = 5;
const LETRAS_EXTRA = 'aeiorstnlcdmp';

export function generarDeletreo(idioma, n = DELETREOS_POR_PARTIDA) {
  const elegidas = mezclar(PALABRAS)
    .slice(0, n)
    .sort((a, b) => a[idioma].length - b[idioma].length); // de la más corta a la más larga
  return elegidas.map((palabra, k) => {
    const objetivo = palabra[idioma].normalize('NFC');
    const letras = Array.from(objetivo);
    const extras = k >= 2 ? [elegir(Array.from(LETRAS_EXTRA)), elegir(Array.from(LETRAS_EXTRA))] : [];
    let fichas = [...letras, ...extras].map((l, i) => ({ id: `l${k}-${i}`, l }));
    for (let intento = 0; intento < 8; intento++) {
      fichas = mezclar(fichas);
      if (fichas.slice(0, letras.length).map((f) => f.l).join('') !== objetivo) break;
    }
    return { palabra, objetivo, fichas };
  });
}

// Ids de las fichas que forman la palabra (para "Ver respuesta")
export function ordenLetras(ronda) {
  const usados = new Set();
  return Array.from(ronda.objetivo).map((l) => {
    const ficha = ronda.fichas.find((f) => f.l === l && !usados.has(f.id));
    usados.add(ficha.id);
    return ficha.id;
  });
}

/* =====================================================================
   NIVEL 6 · CHARLA CON VIVI · conversación tipo chat
   Cada turno: el personaje dice algo y eliges la mejor respuesta (ok: true).
   Se sortea uno de los diálogos de cada idioma en cada partida.
   ===================================================================== */
export const DIALOGOS = {
  en: [
    {
      escena: 'Conoces a un nuevo amigo',
      personaje: '🧑',
      turnos: [
        {
          npc: "Hi! I'm Sam. What's your name?", npcEs: '¡Hola! Soy Sam. ¿Cómo te llamas?',
          opciones: [
            { t: 'My name is Vivi.', es: 'Me llamo Vivi.', ok: true },
            { t: "I'm fine, thanks.", es: 'Estoy bien, gracias.' },
            { t: 'It is red.', es: 'Es rojo.' },
          ],
        },
        {
          npc: 'Nice to meet you! Where are you from?', npcEs: '¡Mucho gusto! ¿De dónde eres?',
          opciones: [
            { t: "I'm from Costa Rica.", es: 'Soy de Costa Rica.', ok: true },
            { t: "I'm twelve years old.", es: 'Tengo doce años.' },
            { t: 'Yes, I do.', es: 'Sí, lo hago.' },
          ],
        },
        {
          npc: 'Cool! Do you like music?', npcEs: '¡Genial! ¿Te gusta la música?',
          opciones: [
            { t: 'Yes, I love it!', es: '¡Sí, me encanta!', ok: true },
            { t: 'No, it is Monday.', es: 'No, es lunes.' },
            { t: 'At seven o’clock.', es: 'A las siete.' },
          ],
        },
        {
          npc: 'Great! See you tomorrow!', npcEs: '¡Genial! ¡Hasta mañana!',
          opciones: [
            { t: 'See you! Bye!', es: '¡Nos vemos! ¡Adiós!', ok: true },
            { t: 'Please, sit down.', es: 'Por favor, siéntate.' },
            { t: "I don't know.", es: 'No sé.' },
          ],
        },
      ],
    },
    {
      escena: 'Compras en una tienda',
      personaje: '🧑‍💼',
      turnos: [
        {
          npc: 'Good morning! Can I help you?', npcEs: '¡Buenos días! ¿Puedo ayudarte?',
          opciones: [
            { t: "Yes, I'm looking for a notebook.", es: 'Sí, busco un cuaderno.', ok: true },
            { t: 'I like cats.', es: 'Me gustan los gatos.' },
            { t: "It's raining today.", es: 'Hoy llueve.' },
          ],
        },
        {
          npc: 'Sure! What color do you want?', npcEs: '¡Claro! ¿De qué color lo quieres?',
          opciones: [
            { t: 'Blue, please.', es: 'Azul, por favor.', ok: true },
            { t: 'Yes, I am.', es: 'Sí, lo soy.' },
            { t: "It's on the table.", es: 'Está sobre la mesa.' },
          ],
        },
        {
          npc: "Here you go. It's five dollars.", npcEs: 'Aquí tienes. Son cinco dólares.',
          opciones: [
            { t: "Here's the money. Thank you!", es: 'Aquí está el dinero. ¡Gracias!', ok: true },
            { t: "I'm very tired.", es: 'Estoy muy cansada.' },
            { t: 'I have two brothers.', es: 'Tengo dos hermanos.' },
          ],
        },
        {
          npc: 'Thanks! Have a nice day!', npcEs: '¡Gracias! ¡Que tengas un buen día!',
          opciones: [
            { t: 'You too! Goodbye!', es: '¡Igualmente! ¡Adiós!', ok: true },
            { t: 'Happy birthday!', es: '¡Feliz cumpleaños!' },
            { t: 'Where are you from?', es: '¿De dónde eres?' },
          ],
        },
      ],
    },
  ],
  pt: [
    {
      escena: 'Conoces a un nuevo amigo',
      personaje: '🧑',
      turnos: [
        {
          npc: 'Oi! Eu sou o Pedro. Qual é o seu nome?', npcEs: '¡Hola! Soy Pedro. ¿Cuál es tu nombre?',
          opciones: [
            { t: 'Meu nome é Vivi.', es: 'Mi nombre es Vivi.', ok: true },
            { t: 'Estou bem, obrigada.', es: 'Estoy bien, gracias.' },
            { t: 'É vermelho.', es: 'Es rojo.' },
          ],
        },
        {
          npc: 'Prazer em conhecer! De onde você é?', npcEs: '¡Mucho gusto! ¿De dónde eres?',
          opciones: [
            { t: 'Eu sou da Costa Rica.', es: 'Soy de Costa Rica.', ok: true },
            { t: 'Tenho doze anos.', es: 'Tengo doce años.' },
            { t: 'Sim, eu gosto.', es: 'Sí, me gusta.' },
          ],
        },
        {
          npc: 'Legal! Você gosta de música?', npcEs: '¡Genial! ¿Te gusta la música?',
          opciones: [
            { t: 'Sim, eu adoro!', es: '¡Sí, me encanta!', ok: true },
            { t: 'Não, é segunda-feira.', es: 'No, es lunes.' },
            { t: 'Às sete horas.', es: 'A las siete horas.' },
          ],
        },
        {
          npc: 'Ótimo! Até amanhã!', npcEs: '¡Genial! ¡Hasta mañana!',
          opciones: [
            { t: 'Até amanhã! Tchau!', es: '¡Hasta mañana! ¡Chao!', ok: true },
            { t: 'Sente-se, por favor.', es: 'Siéntate, por favor.' },
            { t: 'Não sei.', es: 'No sé.' },
          ],
        },
      ],
    },
    {
      escena: 'Compras en una tienda',
      personaje: '🧑‍💼',
      turnos: [
        {
          npc: 'Bom dia! Posso ajudar?', npcEs: '¡Buenos días! ¿Puedo ayudar?',
          opciones: [
            { t: 'Sim, procuro um caderno.', es: 'Sí, busco un cuaderno.', ok: true },
            { t: 'Eu gosto de gatos.', es: 'Me gustan los gatos.' },
            { t: 'Hoje está chovendo.', es: 'Hoy está lloviendo.' },
          ],
        },
        {
          npc: 'Claro! Que cor você quer?', npcEs: '¡Claro! ¿Qué color quieres?',
          opciones: [
            { t: 'Azul, por favor.', es: 'Azul, por favor.', ok: true },
            { t: 'Sim, eu sou.', es: 'Sí, lo soy.' },
            { t: 'Está em cima da mesa.', es: 'Está encima de la mesa.' },
          ],
        },
        {
          npc: 'Aqui está. São cinco reais.', npcEs: 'Aquí tienes. Son cinco reales.',
          opciones: [
            { t: 'Aqui está o dinheiro. Obrigada!', es: 'Aquí está el dinero. ¡Gracias!', ok: true },
            { t: 'Estou muito cansada.', es: 'Estoy muy cansada.' },
            { t: 'Tenho dois irmãos.', es: 'Tengo dos hermanos.' },
          ],
        },
        {
          npc: 'Obrigado! Tenha um bom dia!', npcEs: '¡Gracias! ¡Que tengas un buen día!',
          opciones: [
            { t: 'Igualmente! Tchau!', es: '¡Igualmente! ¡Chao!', ok: true },
            { t: 'Feliz aniversário!', es: '¡Feliz cumpleaños!' },
            { t: 'De onde você é?', es: '¿De dónde eres?' },
          ],
        },
      ],
    },
  ],
};

// Devuelve un diálogo al azar, con las opciones de cada turno ya mezcladas
export function generarDialogo(idioma) {
  const d = elegir(DIALOGOS[idioma]);
  return { ...d, turnos: d.turnos.map((t) => ({ ...t, opciones: mezclar(t.opciones) })) };
}

/* =====================================================================
   ESTRELLAS
   Terminar el nivel siempre da al menos 1 estrella.
   ===================================================================== */
// Cada ronda vale 1 (sin errores ni ayuda), 0.5 (con error o ayuda) o 0 (se rindió)
export function puntosDeRonda({ errores, ayuda, rendido }) {
  if (rendido) return 0;
  return errores > 0 || ayuda ? 0.5 : 1;
}

export function estrellasPorPuntos(puntos, total) {
  const r = total ? puntos / total : 0;
  return r >= 0.85 ? 3 : r >= 0.55 ? 2 : 1;
}

// Parejas: menos intentos (cada par de cartas volteadas es un intento) = más estrellas
export function estrellasParejas(intentos, pares = PARES_POR_PARTIDA) {
  if (intentos <= pares + 3) return 3;
  if (intentos <= pares * 2 + 1) return 2;
  return 1;
}

/* =====================================================================
   LOS 6 NIVELES (iguales para inglés y portugués, de fácil a difícil)
   ===================================================================== */
export const ACTIVIDADES = [
  {
    id: 'parejas',
    emoji: '🃏',
    nombre: 'Parejas políglotas',
    descripcion: (idioma) => `Une cada palabra en español con su pareja en ${IDIOMAS[idioma].nombre}.`,
  },
  {
    id: 'burbujas',
    emoji: '🎈',
    nombre: 'Pesca de palabras',
    descripcion: () => 'Escucha la palabra y revienta la burbuja correcta.',
  },
  {
    id: 'cafe',
    emoji: '☕',
    nombre: 'Café de Vivi',
    descripcion: () => 'Escucha el pedido y arma la bandeja.',
  },
  {
    id: 'deletreo',
    emoji: '🔤',
    nombre: 'Deletrea',
    descripcion: () => 'Mira el dibujo y arma la palabra letra por letra.',
  },
  {
    id: 'frases',
    emoji: '🧩',
    nombre: 'Arma la frase',
    descripcion: () => 'Ordena las palabras para decirlo bien.',
  },
  {
    id: 'charla',
    emoji: '💬',
    nombre: 'Charla con Vivi',
    descripcion: () => 'Conversa y elige la mejor respuesta.',
  },
];

export const claveEstrellas = (actividad, idioma) => `${actividad}_${idioma}`;
