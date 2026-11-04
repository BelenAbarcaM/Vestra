// Lógica pura del juego de Cisco (sin React, sin audio, sin pantalla).
// Aquí viven las misiones (niveles) y la forma de calificar.
//
// CÓMO FUNCIONA UNA MISIÓN
//   1. Llega un "ticket": alguien en el colegio no puede conectarse.
//   2. El jugador pulsa "Probar conexión": el paquete viaja por la `ruta` y se
//      detiene en `falla.en` (el dispositivo donde muere).
//   3. El jugador toca los dispositivos para leer su configuración (como en
//      Packet Tracer) y elige entre varios `arreglos`. Solo uno es correcto.
//   4. Se prueba otra vez: el paquete llega y se ganan de 1 a 3 estrellas.
//
// FORMATO DE LAS LÍNEAS DE LA CONSOLA (config y salidas de prueba)
//   '!texto'  → rojo (error)
//   '+texto'  → verde (correcto / cambio aplicado)
//   '~texto'  → gris (título o comentario)
//   'texto'   → normal
//   Conviene que cada línea mida menos de ~45 caracteres; si una es más larga,
//   la consola la parte en dos líneas.
//
// Para agregar una misión nueva, copia una de NIVELES y cambia sus datos.
// Al arrancar, `validarNivel` avisa en consola si algo no cuadra.

export const MAX_ESTRELLAS_NIVEL = 3;

/* ---------- ayudas para escribir las salidas de prueba ---------- */

// Salida típica de `ping`. `lineaFallo` es lo que se ve cuando no responde.
function salidaPing(destino, ok, lineaFallo) {
  const cabecera = [`Pinging ${destino} with 32 bytes of data:`, ''];
  const cuerpo = ok
    ? [
        `+Reply from ${destino}: bytes=32 time<1ms`,
        `+Reply from ${destino}: bytes=32 time<1ms`,
        `+Reply from ${destino}: bytes=32 time<1ms`,
      ]
    : [`!${lineaFallo}`, `!${lineaFallo}`, `!${lineaFallo}`];
  const resumen = ok
    ? ['', '~Sent = 3, Received = 3, Lost = 0 (0% loss)']
    : ['', '~Sent = 3, Received = 0, Lost = 3 (100% loss)'];
  return [...cabecera, ...cuerpo, ...resumen];
}

// Formulario de IP de una PC (como la pestaña "IP Configuration" de Packet Tracer)
function ipPc({ ip, mascara, gateway, dns, marcar = [] }) {
  const l = (clave, valor, etiqueta) => {
    const texto = `${etiqueta.padEnd(16)}${valor || '(none)'}`;
    return marcar.includes(clave) ? `+${texto}` : texto;
  };
  return [
    '~IP Configuration',
    l('ip', ip, 'IP Address'),
    l('mascara', mascara, 'Subnet Mask'),
    l('gateway', gateway, 'Default Gateway'),
    l('dns', dns, 'DNS Server'),
  ];
}

const MASCARA = '255.255.255.0';

/* ---------- las misiones ---------- */

export const NIVELES = [
  /* 1 · Capa física ------------------------------------------------- */
  {
    id: 'luz',
    nombre: 'Luz roja',
    descripcion: 'El servidor del club no responde',
    concepto: 'CCNA · Capa física e interfaces',
    ticket: {
      de: 'Prof. Marta',
      texto: 'El servidor del club no responde y la luz de su cable está roja. ¿Puedes revisarlo?',
    },
    alto: 140,
    nodos: [
      {
        id: 'pcAna', tipo: 'pc', nombre: 'PC-Ana', x: 50, y: 70,
        config: ipPc({ ip: '192.168.10.10', mascara: MASCARA }),
      },
      {
        id: 'sw', tipo: 'switch', nombre: 'SW-Lab', x: 170, y: 70,
        config: [
          '~SW-Lab# show ip interface brief',
          'Interface   Status                 Protocol',
          'Fa0/1       up                     up',
          '!Fa0/2       administratively down  down',
        ],
        configFix: [
          '~SW-Lab# show ip interface brief',
          'Interface   Status                 Protocol',
          'Fa0/1       up                     up',
          '+Fa0/2       up                     up',
        ],
      },
      {
        id: 'srv', tipo: 'server', nombre: 'SRV-Club', x: 290, y: 70,
        config: [...ipPc({ ip: '192.168.10.100', mascara: MASCARA }), '', '!FastEthernet0: link DOWN'],
        configFix: [...ipPc({ ip: '192.168.10.100', mascara: MASCARA }), '', '+FastEthernet0: link UP'],
      },
    ],
    enlaces: [
      { a: 'pcAna', b: 'sw' },
      { a: 'sw', b: 'srv', luz: 'rojo' },
    ],
    ruta: ['pcAna', 'sw', 'srv'],
    falla: { en: 'sw' },
    test: {
      comando: 'ping 192.168.10.100',
      fallo: salidaPing('192.168.10.100', false, 'Request timed out.'),
      exito: salidaPing('192.168.10.100', true),
    },
    pista: 'Mira los puertos del switch: ¿alguno dice "administratively down"?',
    pistaNodo: 'sw',
    arreglos: [
      {
        id: 'a', correcto: true, donde: 'SW-Lab', accion: 'interface fa0/2 → no shutdown',
        porque: 'Un puerto "administratively down" fue apagado con shutdown. no shutdown lo enciende.',
      },
      {
        id: 'b', donde: 'PC-Ana', accion: 'Subnet Mask → 255.255.0.0',
        porque: 'La máscara ya coincidía en ambos equipos. El problema es físico: la luz roja.',
      },
      {
        id: 'c', donde: 'SRV-Club', accion: 'IP Address → 192.168.10.10',
        porque: 'Esa es la IP de Ana: tendrías una IP duplicada. Y la IP del servidor estaba bien.',
      },
      {
        id: 'd', donde: 'SW-Lab', accion: 'interface fa0/2 → shutdown',
        porque: 'shutdown apaga el puerto. Justo lo que ya está pasando.',
      },
    ],
    leccion:
      'Capa 1 (física): una luz roja y "administratively down" significan que el puerto fue apagado por configuración. Se enciende con no shutdown.',
  },

  /* 2 · Direccionamiento IPv4 --------------------------------------- */
  {
    id: 'red',
    nombre: 'Misma red',
    descripcion: 'Dos PCs en el mismo switch que no se ven',
    concepto: 'CCNA · Direccionamiento IPv4',
    ticket: {
      de: 'Beto',
      texto: 'Ana y yo estamos en el mismo laboratorio y no podemos compartir archivos. ¡Los cables están bien!',
    },
    alto: 160,
    nodos: [
      {
        id: 'sw', tipo: 'switch', nombre: 'SW-Lab', x: 170, y: 48,
        config: [
          '~SW-Lab# show ip interface brief',
          'Interface   Status   Protocol',
          'Fa0/1       up       up',
          'Fa0/2       up       up',
        ],
      },
      {
        id: 'pcAna', tipo: 'pc', nombre: 'PC-Ana', x: 65, y: 108,
        config: ipPc({ ip: '192.168.10.10', mascara: MASCARA }),
      },
      {
        id: 'pcBeto', tipo: 'pc', nombre: 'PC-Beto', x: 275, y: 108,
        config: ipPc({ ip: '192.168.11.20', mascara: MASCARA }),
        configFix: ipPc({ ip: '192.168.10.20', mascara: MASCARA, marcar: ['ip'] }),
      },
    ],
    enlaces: [
      { a: 'pcAna', b: 'sw' },
      { a: 'sw', b: 'pcBeto' },
    ],
    ruta: ['pcAna', 'sw', 'pcBeto'],
    falla: { en: 'pcBeto' },
    test: {
      comando: 'ping 192.168.10.20',
      fallo: salidaPing('192.168.10.20', false, 'Request timed out.'),
      exito: salidaPing('192.168.10.20', true),
    },
    pista: 'Compara las IP de Ana y Beto: ¿coinciden los tres primeros números?',
    pistaNodo: 'pcBeto',
    arreglos: [
      {
        id: 'a', correcto: true, donde: 'PC-Beto', accion: 'IP Address → 192.168.10.20',
        porque: 'Con máscara /24, Ana y Beto deben compartir 192.168.10.x para hablar sin router.',
      },
      {
        id: 'b', donde: 'PC-Ana', accion: 'Default Gateway → 192.168.10.1',
        porque: 'No hay router aquí. El problema es que Beto está en otra red (192.168.11.0/24).',
      },
      {
        id: 'c', donde: 'SW-Lab', accion: 'interface fa0/2 → no shutdown',
        porque: 'Los puertos ya están up/up y las luces verdes. El switch no es el problema.',
      },
      {
        id: 'd', donde: 'PC-Beto', accion: 'Subnet Mask → 255.255.0.0',
        porque: 'Ana seguiría viendo a Beto en otra red. Ambos deben compartir red y máscara.',
      },
    ],
    leccion:
      'Sin router, dos equipos solo se ven si están en la misma red. 192.168.10.x /24 y 192.168.11.x /24 son redes distintas aunque compartan switch.',
  },

  /* 3 · Gateway ------------------------------------------------------ */
  {
    id: 'gateway',
    nombre: 'Puerta de enlace',
    descripcion: 'Salir de tu red necesita al router',
    concepto: 'CCNA · Gateway predeterminado',
    ticket: {
      de: 'Ana',
      texto: 'Puedo ver mi laboratorio, pero no llego al servidor del club, que está en otra red.',
    },
    alto: 135,
    nodos: [
      {
        id: 'pcAna', tipo: 'pc', nombre: 'PC-Ana', x: 45, y: 62,
        config: ipPc({ ip: '192.168.10.10', mascara: MASCARA, gateway: '192.168.10.254' }),
        configFix: ipPc({ ip: '192.168.10.10', mascara: MASCARA, gateway: '192.168.10.1', marcar: ['gateway'] }),
      },
      {
        id: 'sw', tipo: 'switch', nombre: 'SW-Lab', x: 125, y: 62,
        config: [
          '~SW-Lab# show ip interface brief',
          'Interface   Status   Protocol',
          'Fa0/1       up       up',
          'Fa0/24      up       up',
        ],
      },
      {
        id: 'r', tipo: 'router', nombre: 'R-Colegio', x: 215, y: 62,
        config: [
          '~R-Colegio# show ip interface brief',
          'Interface  IP-Address     Status Prot',
          'Gi0/0      192.168.10.1   up     up',
          'Gi0/1      10.0.0.1       up     up',
        ],
      },
      {
        id: 'srv', tipo: 'server', nombre: 'SRV-Club', x: 295, y: 62,
        config: ipPc({ ip: '10.0.0.100', mascara: MASCARA, gateway: '10.0.0.1' }),
      },
    ],
    enlaces: [
      { a: 'pcAna', b: 'sw' },
      { a: 'sw', b: 'r' },
      { a: 'r', b: 'srv' },
    ],
    ruta: ['pcAna', 'sw', 'r', 'srv'],
    falla: { en: 'sw' },
    test: {
      comando: 'ping 10.0.0.100',
      fallo: salidaPing('10.0.0.100', false, 'Request timed out.'),
      exito: salidaPing('10.0.0.100', true),
    },
    pista: 'El gateway de Ana debe ser la IP del router en la red de Ana.',
    pistaNodo: 'pcAna',
    arreglos: [
      {
        id: 'a', correcto: true, donde: 'PC-Ana', accion: 'Default Gateway → 192.168.10.1',
        porque: '192.168.10.1 es la interfaz Gi0/0 del router, en la misma red que Ana.',
      },
      {
        id: 'b', donde: 'SRV-Club', accion: 'Default Gateway → 192.168.10.1',
        porque: 'El servidor vive en 10.0.0.0/24; su gateway es 10.0.0.1 y ya está bien.',
      },
      {
        id: 'c', donde: 'R-Colegio', accion: 'interface gi0/1 → no shutdown',
        porque: 'Gi0/1 ya está up/up. El paquete ni siquiera llega al router.',
      },
      {
        id: 'd', donde: 'PC-Ana', accion: 'IP Address → 10.0.0.10',
        porque: 'Ana no pertenece a la red del servidor; su red es 192.168.10.0/24.',
      },
    ],
    leccion:
      'El gateway es la IP del router dentro de TU red local. Sin un gateway correcto, un equipo no puede salir de su red.',
  },

  /* 4 · VLAN --------------------------------------------------------- */
  {
    id: 'vlan',
    nombre: 'VLAN',
    descripcion: 'Mismo switch, redes separadas',
    concepto: 'CCNA · VLAN y conmutación',
    ticket: {
      de: 'Beto',
      texto: 'Mi IP y la de Ana están bien, las luces verdes… ¡y aun así no nos vemos!',
    },
    alto: 160,
    nodos: [
      {
        id: 'sw', tipo: 'switch', nombre: 'SW-Lab', x: 170, y: 48,
        config: [
          '~SW-Lab# show vlan brief',
          'VLAN  Name        Ports',
          '10    AULA        Fa0/1',
          '!20    INVITADOS   Fa0/2',
        ],
        configFix: [
          '~SW-Lab# show vlan brief',
          'VLAN  Name        Ports',
          '10    AULA        Fa0/1, Fa0/2',
          '20    INVITADOS   (none)',
        ],
      },
      {
        id: 'pcAna', tipo: 'pc', nombre: 'PC-Ana', x: 65, y: 108,
        config: ipPc({ ip: '192.168.10.10', mascara: MASCARA }),
      },
      {
        id: 'pcBeto', tipo: 'pc', nombre: 'PC-Beto', x: 275, y: 108,
        config: ipPc({ ip: '192.168.10.20', mascara: MASCARA }),
      },
    ],
    enlaces: [
      { a: 'pcAna', b: 'sw' },
      { a: 'sw', b: 'pcBeto' },
    ],
    ruta: ['pcAna', 'sw', 'pcBeto'],
    falla: { en: 'sw' },
    test: {
      comando: 'ping 192.168.10.20',
      fallo: salidaPing('192.168.10.20', false, 'Request timed out.'),
      exito: salidaPing('192.168.10.20', true),
    },
    pista: 'Un switch puede separar equipos en VLANs. Mira en qué VLAN está cada puerto.',
    pistaNodo: 'sw',
    arreglos: [
      {
        id: 'a', correcto: true, donde: 'SW-Lab', accion: 'interface fa0/2 → switchport access vlan 10',
        porque: 'Ana y Beto quedan en la misma VLAN (la 10), así que vuelven a verse.',
      },
      {
        id: 'b', donde: 'PC-Beto', accion: 'IP Address → 192.168.20.20',
        porque: 'Las IP ya estaban en la misma red. Lo que los aísla es la VLAN, no la IP.',
      },
      {
        id: 'c', donde: 'SW-Lab', accion: 'interface fa0/2 → no shutdown',
        porque: 'El puerto ya está up/up. No está apagado, está en otra VLAN.',
      },
      {
        id: 'd', donde: 'PC-Ana', accion: 'Default Gateway → 192.168.10.1',
        porque: 'Un gateway no mueve un puerto de VLAN. Y aquí ni siquiera hay router.',
      },
    ],
    leccion:
      'Cada VLAN es una red de capa 2 separada. Dos puertos en VLANs distintas no se ven aunque compartan switch e IP. Se corrige con switchport access vlan X.',
  },

  /* 5 · DNS ---------------------------------------------------------- */
  {
    id: 'dns',
    nombre: '¿Y el nombre?',
    descripcion: 'Por IP sí llega, por nombre no',
    concepto: 'CCNA · Servicios IP (DNS)',
    ticket: {
      de: 'Ana',
      texto: 'Si escribo la IP del servidor, abre. Pero con club.colegio.edu no encuentra nada.',
    },
    alto: 170,
    nodos: [
      {
        id: 'pcAna', tipo: 'pc', nombre: 'PC-Ana', x: 55, y: 70,
        config: ipPc({ ip: '192.168.10.10', mascara: MASCARA, dns: '192.168.10.99' }),
        configFix: ipPc({ ip: '192.168.10.10', mascara: MASCARA, dns: '192.168.10.53', marcar: ['dns'] }),
      },
      {
        id: 'sw', tipo: 'switch', nombre: 'SW-Lab', x: 150, y: 70,
        config: [
          '~SW-Lab# show ip interface brief',
          'Interface   Status   Protocol',
          'Fa0/1       up       up',
          'Fa0/2       up       up',
          'Fa0/3       up       up',
        ],
      },
      {
        id: 'dns', tipo: 'server', nombre: 'SRV-DNS', x: 265, y: 38,
        config: [
          ...ipPc({ ip: '192.168.10.53', mascara: MASCARA }),
          '',
          '~Services > DNS',
          'DNS Service:    ON',
          'club.colegio.edu  A  192.168.10.100',
        ],
      },
      {
        id: 'web', tipo: 'server', nombre: 'SRV-Web', x: 265, y: 112,
        config: [
          ...ipPc({ ip: '192.168.10.100', mascara: MASCARA }),
          '',
          '~Services > HTTP',
          'HTTP Service:   ON',
        ],
      },
    ],
    enlaces: [
      { a: 'pcAna', b: 'sw' },
      { a: 'sw', b: 'dns' },
      { a: 'sw', b: 'web' },
    ],
    ruta: ['pcAna', 'sw', 'web'],
    falla: { en: 'pcAna' },
    test: {
      comando: 'ping club.colegio.edu',
      fallo: ['!Ping request could not find host', '!club.colegio.edu.', '!Please check the name and try again.'],
      exito: salidaPing('192.168.10.100', true),
    },
    pista: 'Compara el DNS que usa Ana con la IP real del servidor DNS.',
    pistaNodo: 'pcAna',
    arreglos: [
      {
        id: 'a', correcto: true, donde: 'PC-Ana', accion: 'DNS Server → 192.168.10.53',
        porque: '192.168.10.53 es el servidor DNS real, el que conoce club.colegio.edu.',
      },
      {
        id: 'b', donde: 'SRV-Web', accion: 'IP Address → 192.168.10.99',
        porque: 'Cambiarías el servidor web, pero el registro DNS seguiría apuntando a .100.',
      },
      {
        id: 'c', donde: 'SRV-DNS', accion: 'DNS Service → OFF',
        porque: 'Apagar el DNS empeora todo: nadie podría resolver nombres.',
      },
      {
        id: 'd', donde: 'PC-Ana', accion: 'Default Gateway → 192.168.10.1',
        porque: 'Todo está en la misma red, no hace falta gateway. Falla la resolución de nombres.',
      },
    ],
    leccion:
      'DNS traduce nombres en direcciones IP. Si por IP funciona y por nombre no, revisa qué servidor DNS tiene configurado el cliente.',
  },

  /* 6 · Rutas estáticas ---------------------------------------------- */
  {
    id: 'ruta',
    nombre: 'Ruta perdida',
    descripcion: 'Un router que no sabe el camino',
    concepto: 'CCNA · Enrutamiento estático',
    ticket: {
      de: 'Prof. Marta',
      texto: 'Mis alumnos llegan al router de su aula, pero no al servidor del club en la otra sede.',
    },
    alto: 135,
    nodos: [
      {
        id: 'pcAna', tipo: 'pc', nombre: 'PC-Ana', x: 45, y: 62,
        config: ipPc({ ip: '192.168.10.10', mascara: MASCARA, gateway: '192.168.10.1' }),
      },
      {
        id: 'r1', tipo: 'router', nombre: 'R-Colegio', x: 125, y: 62,
        config: [
          '~R-Colegio# show ip route',
          'C  192.168.10.0/24 is directly connected,',
          '   Gi0/0',
          'C  172.16.0.0/30 is directly connected,',
          '   Gi0/1',
        ],
        configFix: [
          '~R-Colegio# show ip route',
          'C  192.168.10.0/24 is directly connected,',
          '   Gi0/0',
          'C  172.16.0.0/30 is directly connected,',
          '   Gi0/1',
          '+S  10.0.0.0/24 [1/0] via 172.16.0.2',
        ],
      },
      {
        id: 'r2', tipo: 'router', nombre: 'R-Club', x: 215, y: 62,
        config: [
          '~R-Club# show ip route',
          'C  172.16.0.0/30 is directly connected,',
          '   Gi0/0',
          'C  10.0.0.0/24 is directly connected,',
          '   Gi0/1',
          'S  192.168.10.0/24 [1/0] via 172.16.0.1',
        ],
      },
      {
        id: 'srv', tipo: 'server', nombre: 'SRV-Club', x: 295, y: 62,
        config: ipPc({ ip: '10.0.0.100', mascara: MASCARA, gateway: '10.0.0.1' }),
      },
    ],
    enlaces: [
      { a: 'pcAna', b: 'r1' },
      { a: 'r1', b: 'r2' },
      { a: 'r2', b: 'srv' },
    ],
    ruta: ['pcAna', 'r1', 'r2', 'srv'],
    falla: { en: 'r1' },
    test: {
      comando: 'ping 10.0.0.100',
      fallo: salidaPing('10.0.0.100', false, 'Reply from 192.168.10.1: Destination host unreachable.'),
      exito: salidaPing('10.0.0.100', true),
    },
    pista: 'Mira la tabla de rutas del primer router: ¿conoce la red 10.0.0.0/24?',
    pistaNodo: 'r1',
    arreglos: [
      {
        id: 'a', correcto: true, donde: 'R-Colegio', accion: 'ip route 10.0.0.0 255.255.255.0 172.16.0.2',
        porque: 'Le dice a R-Colegio que para llegar a 10.0.0.0/24 pase por su vecino, 172.16.0.2.',
      },
      {
        id: 'b', donde: 'R-Colegio', accion: 'ip route 10.0.0.0 255.255.255.0 172.16.0.1',
        porque: '172.16.0.1 es su propia interfaz. El siguiente salto debe ser el vecino (.2).',
      },
      {
        id: 'c', donde: 'R-Club', accion: 'ip route 192.168.10.0 255.255.255.0 172.16.0.1',
        porque: 'R-Club ya tiene esa ruta de vuelta (mira su tabla). Falta la de ida.',
      },
      {
        id: 'd', donde: 'PC-Ana', accion: 'Default Gateway → 172.16.0.1',
        porque: 'Ana debe usar el router de SU red (192.168.10.1), no una IP de otro enlace.',
      },
    ],
    leccion:
      'Un router solo conoce las redes conectadas a él. Para las lejanas necesita una ruta: ip route <red> <máscara> <siguiente salto>. Y el camino de vuelta también debe existir.',
  },

  /* 7 · ACL (final) --------------------------------------------------- */
  {
    id: 'acl',
    nombre: 'Gran final',
    descripcion: 'Ping sí, página web no',
    concepto: 'CCNA · ACL y seguridad',
    ticket: {
      de: 'Director',
      texto: 'El servidor responde al ping, pero la página web del club no abre. ¡Es el último ticket del día!',
    },
    alto: 135,
    nodos: [
      {
        id: 'pcAna', tipo: 'pc', nombre: 'PC-Ana', x: 45, y: 62,
        config: ipPc({ ip: '192.168.10.10', mascara: MASCARA, gateway: '192.168.10.1' }),
      },
      {
        id: 'sw', tipo: 'switch', nombre: 'SW-Lab', x: 125, y: 62,
        config: [
          '~SW-Lab# show ip interface brief',
          'Interface   Status   Protocol',
          'Fa0/1       up       up',
          'Fa0/24      up       up',
        ],
      },
      {
        id: 'r', tipo: 'router', nombre: 'R-Colegio', x: 215, y: 62,
        config: [
          '~R-Colegio# show access-lists',
          'Extended IP access list 101',
          '!  10 deny tcp any host 10.0.0.100 eq 80',
          '  20 permit ip any any',
          '~R-Colegio# show ip interface Gi0/1',
          '  Outgoing access list is 101',
        ],
        configFix: [
          '~R-Colegio# show access-lists',
          'Extended IP access list 101',
          '+  10 permit tcp any host 10.0.0.100 eq 80',
          '  20 permit ip any any',
          '~R-Colegio# show ip interface Gi0/1',
          '  Outgoing access list is 101',
        ],
      },
      {
        id: 'srv', tipo: 'server', nombre: 'SRV-Club', x: 295, y: 62,
        config: [
          ...ipPc({ ip: '10.0.0.100', mascara: MASCARA, gateway: '10.0.0.1' }),
          '',
          '~Services > HTTP',
          'HTTP Service:   ON  (port 80)',
        ],
      },
    ],
    enlaces: [
      { a: 'pcAna', b: 'sw' },
      { a: 'sw', b: 'r' },
      { a: 'r', b: 'srv' },
    ],
    ruta: ['pcAna', 'sw', 'r', 'srv'],
    falla: { en: 'r' },
    test: {
      comando: 'ping 10.0.0.100',
      boton: 'Probar ping y web',
      fallo: [
        '+Reply from 10.0.0.100: bytes=32 time=2ms',
        '+Reply from 10.0.0.100: bytes=32 time=1ms',
        '',
        '~Web Browser: http://10.0.0.100',
        '!Request Timeout. The page could not load.',
      ],
      exito: [
        '+Reply from 10.0.0.100: bytes=32 time=2ms',
        '+Reply from 10.0.0.100: bytes=32 time=1ms',
        '',
        '~Web Browser: http://10.0.0.100',
        '+HTTP/1.1 200 OK  ·  Club Cisco: Inicio',
      ],
    },
    pista: 'El ping funciona, así que la ruta está bien. ¿Quién filtra el puerto 80?',
    pistaNodo: 'r',
    arreglos: [
      {
        id: 'a', correcto: true, donde: 'R-Colegio', accion: 'línea 10 de la ACL 101: deny → permit',
        porque: 'La línea 10 bloqueaba el puerto 80 hacia el servidor. Con permit, la web vuelve a abrir.',
      },
      {
        id: 'b', donde: 'R-Colegio', accion: 'agregar al final: deny ip any any',
        porque: 'No cambia nada: la línea 20 ya permite todo antes. Quien bloquea es la línea 10.',
      },
      {
        id: 'c', donde: 'R-Colegio', accion: 'ip route 10.0.0.0 255.255.255.0 10.0.0.1',
        porque: 'Si el ping responde, la ruta ya funciona. Falla solo el puerto 80.',
      },
      {
        id: 'd', donde: 'SRV-Club', accion: 'HTTP Service → apagar y encender',
        porque: 'El servicio HTTP está ON. La petición ni siquiera llega: la frena el router.',
      },
    ],
    leccion:
      'Una ACL filtra por IP y puerto, y se lee de arriba hacia abajo. Si el ping funciona pero la web no, sospecha de una ACL (capa 4) bloqueando el puerto.',
  },
];

/* ---------- ruta del paquete ---------- */

// Nodos por los que pasa el paquete. Si falla, se detiene en `falla.en`.
export function rutaDelPaquete(nivel, arreglado) {
  if (arreglado) return nivel.ruta.slice();
  const hasta = nivel.ruta.indexOf(nivel.falla.en);
  return nivel.ruta.slice(0, hasta + 1);
}

/* ---------- estrellas y rangos ---------- */

// Cada error y usar la pista restan una estrella (mínimo 1: siempre se aprende).
export function calcularEstrellas({ errores = 0, pista = false }) {
  const penalizacion = errores + (pista ? 1 : 0);
  if (penalizacion === 0) return 3;
  if (penalizacion === 1) return 2;
  return 1;
}

export const RANGOS = [
  { desde: 0, nombre: 'Aprendiz de red' },
  { desde: 5, nombre: 'Técnico de campo' },
  { desde: 11, nombre: 'Ingeniero de redes' },
  { desde: 18, nombre: 'Nivel CCNA' },
];

export function rangoPara(totalEstrellas) {
  let rango = RANGOS[0];
  RANGOS.forEach((r) => {
    if (totalEstrellas >= r.desde) rango = r;
  });
  return rango.nombre;
}

export function totalEstrellas(estrellas) {
  return NIVELES.reduce((suma, n) => suma + (estrellas[n.id] || 0), 0);
}

/* ---------- utilidades ---------- */

// Mezcla una lista (Fisher-Yates) para que la respuesta correcta no esté siempre primera.
export function barajar(lista, azar = Math.random) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Separa el prefijo de una línea de consola: { tipo, texto }
export function leerLinea(linea) {
  const marca = linea.charAt(0);
  if (marca === '!') return { tipo: 'mal', texto: linea.slice(1) };
  if (marca === '+') return { tipo: 'ok', texto: linea.slice(1) };
  if (marca === '~') return { tipo: 'tenue', texto: linea.slice(1) };
  return { tipo: '', texto: linea };
}

// Revisa que una misión esté bien escrita. Devuelve una lista de problemas.
export function validarNivel(nivel) {
  const problemas = [];
  const ids = new Set(nivel.nodos.map((n) => n.id));
  const tiene = (id) => ids.has(id);

  if (ids.size !== nivel.nodos.length) problemas.push('hay ids de nodo repetidos');
  nivel.ruta.forEach((id) => !tiene(id) && problemas.push(`la ruta usa un nodo que no existe: ${id}`));
  if (!nivel.ruta.includes(nivel.falla.en)) problemas.push('falla.en debe estar dentro de la ruta');
  if (!tiene(nivel.pistaNodo)) problemas.push('pistaNodo no existe');
  nivel.enlaces.forEach((e) => {
    if (!tiene(e.a) || !tiene(e.b)) problemas.push(`enlace con nodo inexistente: ${e.a}-${e.b}`);
  });
  // Cada salto de la ruta debe ser un cable que existe
  for (let i = 0; i < nivel.ruta.length - 1; i++) {
    const a = nivel.ruta[i];
    const b = nivel.ruta[i + 1];
    const existe = nivel.enlaces.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    if (!existe) problemas.push(`no hay cable entre ${a} y ${b}`);
  }
  const correctos = nivel.arreglos.filter((a) => a.correcto).length;
  if (correctos !== 1) problemas.push(`debe haber exactamente 1 arreglo correcto (hay ${correctos})`);
  if (nivel.arreglos.length < 3) problemas.push('conviene tener al menos 3 arreglos');
  nivel.arreglos.forEach((a) => !a.porque && problemas.push(`el arreglo ${a.id} no explica por qué`));
  if (!nivel.nodos.some((n) => n.configFix)) problemas.push('ningún nodo muestra el cambio tras el arreglo (configFix)');
  nivel.nodos.forEach((n) => {
    [...n.config, ...(n.configFix || [])].forEach((l) => {
      if (leerLinea(l).texto.length > 50) problemas.push(`línea muy larga en ${n.id}: "${l}"`);
    });
  });
  return problemas;
}
