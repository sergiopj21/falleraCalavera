// ============================================================
// MOTOR DE JUEGO — La Fallera Calavera (base + expansión 2)
// ============================================================

const { generarMazo, barajar } = require('./cartas');

// ── Estado inicial ────────────────────────────────────────────
function crearEstadoInicial(jugadores) {
  const mazo = barajar(generarMazo());
  const cartasPorJugador = jugadores.length === 2 ? 10 : 7;

  const estadoJugadores = {};
  for (const j of jugadores) {
    estadoJugadores[j.id] = {
      id: j.id,
      nombre: j.nombre,
      mano: [],
      cubierta: [],
      saltarTurno: false,
      conectado: true
    };
  }

  // Repartir cartas iniciales
  for (const j of jugadores) {
    for (let i = 0; i < cartasPorJugador; i++) {
      const carta = mazo.pop();
      if (carta) {
        esBoti(carta)
          ? estadoJugadores[j.id].cubierta.push(carta)
          : estadoJugadores[j.id].mano.push(carta);
      }
    }
    // Si tiene 3+ ingredientes al inicio → redistribuir
    const ings = estadoJugadores[j.id].cubierta.filter(c => c.tipo === 'boti_sagrat');
    if (ings.length >= 3) {
      [...estadoJugadores[j.id].cubierta, ...estadoJugadores[j.id].mano]
        .forEach(c => mazo.unshift(c));
      estadoJugadores[j.id].cubierta = [];
      estadoJugadores[j.id].mano = [];
      for (let i = 0; i < cartasPorJugador; i++) {
        const carta = mazo.pop();
        if (carta) {
          esBoti(carta)
            ? estadoJugadores[j.id].cubierta.push(carta)
            : estadoJugadores[j.id].mano.push(carta);
        }
      }
    }
  }

  // Quién empieza: menos tesoros, luego menos ingredientes
  const ordenado = [...jugadores].sort((a, b) => {
    const bA = estadoJugadores[a.id].cubierta.length;
    const bB = estadoJugadores[b.id].cubierta.length;
    if (bA !== bB) return bA - bB;
    const iA = estadoJugadores[a.id].cubierta.filter(c => c.tipo === 'boti_sagrat').length;
    const iB = estadoJugadores[b.id].cubierta.filter(c => c.tipo === 'boti_sagrat').length;
    return iA - iB;
  });

  return {
    fase: 'jugando',
    mazo,
    fonsMari: [],
    jugadores: estadoJugadores,
    ordenTurnos: ordenado.map(j => j.id),
    turnoActual: 0,
    direccion: 1,
    jugadorActual: ordenado[0].id,
    ganador: null,
    accionesDisponibles: 1,
    pendiente: null,
    monedaHumor: 'contenta', // 'contenta' | 'enfadada' — se lanza cuando hace falta
    log: []
  };
}

// ── Helpers ────────────────────────────────────────────────────
function esBoti(carta) {
  return ['boti_sagrat', 'boti_mercat', 'boti_estrany'].includes(carta.tipo);
}

function lanzarMoneda() {
  return Math.random() < 0.5 ? 'cara' : 'cruz';
}

function contarIngredientes(cubierta, numJugadores) {
  return cubierta.reduce((total, c) => {
    if (c.tipo !== 'boti_sagrat') return total;
    if (c.efecto === 'doble_en_5j' && numJugadores === 5) return total + 2;
    if (c.efecto === 'far_passiu') return total; // aeropuerto no es ingrediente
    // Conejo con aeropuerto en el mismo mostrador
    if (c.id === 'conill') {
      const tieneAeroport = cubierta.some(x => x.efecto === 'far_passiu');
      if (tieneAeroport) return total + 2;
    }
    return total + 1;
  }, 0);
}

function addLog(estado, msg) {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  estado.log.unshift(entry);
  if (estado.log.length > 60) estado.log.pop();
  console.log('🎮', entry);
}

function robarDelMazo(estado, jugadorId, cantidad = 1) {
  const robadas = [];
  for (let i = 0; i < cantidad; i++) {
    if (estado.mazo.length === 0) {
      if (estado.fonsMari.length === 0) break;
      estado.mazo = barajar([...estado.fonsMari]);
      estado.fonsMari = [];
      addLog(estado, 'Mazo agotado. Se baraja el cementerio.');
    }
    const carta = estado.mazo.pop();
    if (!carta) break;
    robadas.push(carta);
    if (esBoti(carta)) {
      estado.jugadores[jugadorId].cubierta.push(carta);
      addLog(estado, `${estado.jugadores[jugadorId].nombre} pone en mostrador: ${carta.nombre}`);
    } else {
      estado.jugadores[jugadorId].mano.push(carta);
    }
  }
  return robadas;
}

function avanzarTurno(estado) {
  const n = estado.ordenTurnos.length;
  let next = (estado.turnoActual + estado.direccion + n) % n;
  let intentos = 0;
  while (!estado.jugadores[estado.ordenTurnos[next]].conectado && intentos < n) {
    next = (next + estado.direccion + n) % n;
    intentos++;
  }
  if (estado.jugadores[estado.ordenTurnos[next]].saltarTurno) {
    estado.jugadores[estado.ordenTurnos[next]].saltarTurno = false;
    estado.turnoActual = next;
    estado.jugadorActual = estado.ordenTurnos[next];
    addLog(estado, `${estado.jugadores[estado.ordenTurnos[next]].nombre} pierde su turno (Luna de Valencia).`);
    avanzarTurno(estado);
    return;
  }
  estado.turnoActual = next;
  estado.jugadorActual = estado.ordenTurnos[next];
  estado.accionesDisponibles = 1;

  const jugador = estado.jugadores[estado.jugadorActual];

  // Naranjo putrefacto: roba 1 carta al inicio + acción extra
  if (jugador.cubierta.find(c => c.efecto === 'vaixell_passiu')) {
    robarDelMazo(estado, estado.jugadorActual, 1);
    addLog(estado, `${jugador.nombre} roba 1 carta por el Naranjo putrefacto.`);
  }

  // Gamba de Dénia: lanzar moneda, si cara roba 1
  if (jugador.cubierta.find(c => c.efecto === 'gamba_moneda')) {
    const moneda = lanzarMoneda();
    estado.monedaHumor = moneda;
    if (moneda === 'cara') {
      robarDelMazo(estado, estado.jugadorActual, 1);
      addLog(estado, `${jugador.nombre}: Gamba de Dénia — moneda CARA, roba 1 carta.`);
    } else {
      addLog(estado, `${jugador.nombre}: Gamba de Dénia — moneda CRUZ, no roba.`);
    }
  }

  // Alioli: si no tiene ingredientes, 2 acciones
  const tieneAlioli = jugador.cubierta.find(c => c.efecto === 'cova_passiu');
  const tieneSagrats = jugador.cubierta.some(c => c.tipo === 'boti_sagrat');
  if (tieneAlioli && !tieneSagrats) {
    estado.accionesDisponibles = 2;
  }
}

function comprobarVictoria(estado, jugadorId) {
  const jugador = estado.jugadores[jugadorId];
  const numJugadores = Object.keys(estado.jugadores).length;
  const total = contarIngredientes(jugador.cubierta, numJugadores);
  if (total >= 5) {
    estado.fase = 'fin';
    estado.ganador = jugadorId;
    addLog(estado, `🏆 ¡${jugador.nombre} gana con ${total} ingredientes!`);
    return true;
  }
  return false;
}

function validarTurno(estado, jugadorId) {
  if (estado.fase !== 'jugando') return { ok: false, error: 'La partida no está en curso.' };
  if (estado.jugadorActual !== jugadorId) return { ok: false, error: 'No es tu turno.' };
  if (estado.accionesDisponibles <= 0) return { ok: false, error: 'Ya has usado tu acción este turno.' };
  if (estado.pendiente) return { ok: false, error: 'Hay una acción pendiente de resolución.' };
  return { ok: true };
}

function tieneButoní(estado, jugadorId) {
  return estado.jugadores[jugadorId].cubierta.some(c => c.efecto === 'nauc_bloqueja');
}

// ── ACCIONES PRINCIPALES ────────────────────────────────────

// 1. Almoina
function accionAlmoina(estado, jugadorId) {
  const v = validarTurno(estado, jugadorId);
  if (!v.ok) return { error: v.error };
  robarDelMazo(estado, jugadorId, 1);
  addLog(estado, `${estado.jugadores[jugadorId].nombre} hace almoina (roba 1 carta).`);
  estado.accionesDisponibles--;
  if (estado.accionesDisponibles <= 0) avanzarTurno(estado);
  comprobarVictoria(estado, jugadorId);
  return { ok: true };
}

// 2. Descartar tesoro de venta
function accionVenderBoti(estado, jugadorId, cartaUid) {
  const v = validarTurno(estado, jugadorId);
  if (!v.ok) return { error: v.error };
  const jugador = estado.jugadores[jugadorId];

  if (jugador.cubierta.find(c => c.efecto === 'vaixell_passiu')) {
    return { error: 'El Naranjo putrefacto te impide descartar tesoros.' };
  }

  const idx = jugador.cubierta.findIndex(c => c.uid === cartaUid && c.tipo === 'boti_mercat');
  if (idx === -1) return { error: 'No tienes ese tesoro de venta en el mostrador.' };

  const carta = jugador.cubierta.splice(idx, 1)[0];
  estado.fonsMari.push(carta);

  let cantidad = 0;
  if (carta.efecto === 'calze_roba') {
    const ings = contarIngredientes(jugador.cubierta, Object.keys(estado.jugadores).length);
    cantidad = Math.max(0, 7 - ings - 1);
  } else if (carta.efecto === 'taberna_roba2') {
    cantidad = 2;
  } else {
    cantidad = carta.estrellas || 1;
  }

  // Tartana del Tío Pep: +1 carta al descartar tesoro
  if (jugador.cubierta.find(c => c.efecto === 'galera_passiu')) cantidad++;

  const robadas = robarDelMazo(estado, jugadorId, cantidad);
  addLog(estado, `${jugador.nombre} descarta "${carta.nombre}" y roba ${robadas.length} carta(s).`);

  if (carta.efecto === 'taberna_roba2') {
    addLog(estado, `La Dulzaina y tambor otorga a ${jugador.nombre} una jugada extra.`);
    // No consume la acción — jugada extra
  } else {
    estado.accionesDisponibles--;
    if (estado.accionesDisponibles <= 0) avanzarTurno(estado);
  }

  comprobarVictoria(estado, jugadorId);
  return { ok: true };
}

// 3. Declarar batalla
function accionDeclararBatalla(estado, jugadorId, cartasUids, objetivoId, botiUid) {
  const v = validarTurno(estado, jugadorId);
  if (!v.ok) return { error: v.error };
  if (jugadorId === objetivoId) return { error: 'No puedes atacarte a ti mismo.' };

  const jugador = estado.jugadores[jugadorId];
  const rival = estado.jugadores[objetivoId];
  if (!rival) return { error: 'Jugador objetivo no existe.' };

  // Muralla de Morella bloquea batallas directas a tesoros
  if (rival.cubierta.find(c => c.efecto === 'escudo_total')) {
    return { error: `${rival.nombre} tiene la Muralla de Morella. No puedes atacarle directamente.` };
  }

  const cartasAtaque = [];
  for (const uid of cartasUids) {
    const idx = jugador.mano.findIndex(c => c.uid === uid && c.tipo === 'combat');
    if (idx === -1) return { error: `Carta ${uid} no es válida para batalla.` };
    cartasAtaque.push(jugador.mano[idx]);
  }
  if (cartasAtaque.length === 0) return { error: 'Debes elegir al menos una carta de batalla.' };

  const botiObj = rival.cubierta.find(c => c.uid === botiUid);
  if (!botiObj) return { error: 'Ese tesoro no existe en el mostrador del rival.' };

  // Quitar cartas de batalla de la mano
  for (const uid of cartasUids) {
    jugador.mano = jugador.mano.filter(c => c.uid !== uid);
  }

  const atac = calcularAtac(cartasAtaque, jugador);

  estado.pendiente = {
    tipo: 'batalla',
    atacanteId: jugadorId,
    defensoreId: objetivoId,
    cartasAtaque,
    botiUid,
    atac,
    esAlmansa: cartasAtaque.some(c => c.efecto === 'batalla_lepant'),
    espionatgeActivo: false
  };

  addLog(estado, `⚔️ ${jugador.nombre} ataca a ${rival.nombre} por "${botiObj.nombre}" (A:${atac}).`);

  // Petardo: el rival descarta 2 cartas al azar
  if (cartasAtaque.some(c => c.efecto === 'cano_descarta')) {
    const descartadas = [];
    for (let i = 0; i < 2; i++) {
      if (rival.mano.length > 0) {
        const ri = Math.floor(Math.random() * rival.mano.length);
        const [c] = rival.mano.splice(ri, 1);
        estado.fonsMari.push(c);
        descartadas.push(c.nombre);
      }
    }
    addLog(estado, `💥 Petardo: ${rival.nombre} descarta ${descartadas.join(', ')}`);
  }

  // Clòtxina espia: todas las cartas del atacante se muestran destapadas
  if (rival.cubierta.find(c => c.efecto === 'cloixina_espia')) {
    estado.pendiente.espionatgeActivo = true;
    addLog(estado, `🦪 Clòtxina espia: las cartas del atacante se revelan a ${rival.nombre}.`);
  }

  return { ok: true };
}

// 4. Responder batalla
function accionResponderBatalla(estado, jugadorId, cartasUids = []) {
  if (!estado.pendiente || estado.pendiente.tipo !== 'batalla') {
    return { error: 'No hay batalla pendiente.' };
  }
  if (estado.pendiente.defensoreId !== jugadorId) {
    return { error: 'No eres el defensor.' };
  }

  const jugador = estado.jugadores[jugadorId];
  const atacante = estado.jugadores[estado.pendiente.atacanteId];
  const pendiente = estado.pendiente;

  const cartasDefensa = [];
  for (const uid of cartasUids) {
    const idx = jugador.mano.findIndex(c => c.uid === uid && c.tipo === 'combat');
    if (idx === -1) return { error: `Carta de defensa ${uid} no válida.` };
    cartasDefensa.push(jugador.mano[idx]);
  }
  for (const uid of cartasUids) {
    jugador.mano = jugador.mano.filter(c => c.uid !== uid);
  }

  let atac = pendiente.atac;
  let defensa = calcularDefensa(cartasDefensa, jugador);

  // Agua de Valencia: resta 1 de A o D al contrincante
  const viDef = cartasDefensa.find(c => c.efecto === 'vi_resta');
  if (viDef) {
    atac = Math.max(0, atac - 1);
    addLog(estado, `🍹 Agua de Valencia: ataque rival reducido a ${atac}.`);
    jugador.mano = jugador.mano.filter(c => c.uid !== viDef.uid);
    estado.fonsMari.push(viDef);
  }

  addLog(estado, `🛡️ ${jugador.nombre} se defiende con D:${defensa} (atacante A:${atac}).`);

  const atacanteGana = atac > defensa;

  // Mover cartas al cementerio
  const cartasADescartar = [...pendiente.cartasAtaque, ...cartasDefensa];
  for (const c of cartasADescartar) {
    // Alcaldesa perpetua: vuelve a la mano si gana
    if (c.efecto === 'perpetuitat' && atacanteGana && c.uid !== undefined) {
      atacante.mano.push(c);
      addLog(estado, `🎖️ La Alcaldesa perpetua vuelve a la mano de ${atacante.nombre}.`);
    } else {
      estado.fonsMari.push(c);
    }
  }

  // Reina de las fiestas: si va al cementerio, el que la usó roba 2 cartas
  for (const c of cartasADescartar) {
    if (c.efecto === 'reina_festes' && estado.fonsMari.find(x => x.uid === c.uid)) {
      const usuarioId = pendiente.cartasAtaque.find(x => x.uid === c.uid)
        ? pendiente.atacanteId : jugadorId;
      robarDelMazo(estado, usuarioId, 2);
      addLog(estado, `👸 Reina de las fiestas: ${estado.jugadores[usuarioId].nombre} roba 2 cartas.`);
    }
  }

  estado.pendiente = null;
  const boti = jugador.cubierta.find(c => c.uid === pendiente.botiUid);

  if (atacanteGana) {
    if (pendiente.esAlmansa) {
      const todos = [...jugador.cubierta];
      jugador.cubierta = [];
      atacante.cubierta.push(...todos);
      addLog(estado, `⚓ BATALLA DE ALMANSA: ${atacante.nombre} toma TODOS los tesoros de ${jugador.nombre}.`);
    } else {
      jugador.cubierta = jugador.cubierta.filter(c => c.uid !== pendiente.botiUid);
      atacante.cubierta.push(boti);
      addLog(estado, `✅ ${atacante.nombre} consigue "${boti.nombre}" de ${jugador.nombre}.`);

      // Moco pegajoso: roba un tesoro extra
      if (pendiente.cartasAtaque.some(c => c.efecto === 'moc_enganxos') && jugador.cubierta.length > 0) {
        const extra = jugador.cubierta.shift();
        atacante.cubierta.push(extra);
        addLog(estado, `😤 Moco pegajoso: ${atacante.nombre} roba también "${extra.nombre}".`);
      }
    }
  } else {
    if (pendiente.esAlmansa) {
      const todosAtacante = [...atacante.cubierta];
      atacante.cubierta = [];
      jugador.cubierta.push(...todosAtacante);
      addLog(estado, `💀 BATALLA DE ALMANSA PERDIDA: ${jugador.nombre} toma TODOS los tesoros de ${atacante.nombre}.`);
    } else {
      addLog(estado, `🚫 ${jugador.nombre} defiende con éxito.`);
    }
  }

  // Chorizo: al final del turno del atacante, ya se gestiona en avanzarTurno
  estado.accionesDisponibles--;
  comprobarVictoria(estado, atacante.id);
  if (estado.fase === 'jugando') comprobarVictoria(estado, jugador.id);
  if (estado.fase === 'jugando' && estado.accionesDisponibles <= 0) avanzarTurno(estado);

  return { ok: true, atacanteGana };
}

// 5. Jugar carta especial
function accionJugarAccio(estado, jugadorId, cartaUid, opciones = {}) {
  const v = validarTurno(estado, jugadorId);
  if (!v.ok) return { error: v.error };

  const jugador = estado.jugadores[jugadorId];

  // Butoni: solo puede descartarse de él usando su turno
  if (tieneButoní(estado, jugadorId)) {
    const naucIdx = jugador.cubierta.findIndex(c => c.efecto === 'nauc_bloqueja' && c.uid === cartaUid);
    if (naucIdx !== -1) {
      const [nauc] = jugador.cubierta.splice(naucIdx, 1);
      estado.fonsMari.push(nauc);
      addLog(estado, `${jugador.nombre} descarta El Butoni de su mostrador.`);
      estado.accionesDisponibles--;
      if (estado.accionesDisponibles <= 0) avanzarTurno(estado);
      return { ok: true };
    }
    // También puede pasarlo a otro: si opciones.objetivoId viene, lo moveremos
    if (opciones.moverButoni && opciones.objetivoId) {
      const naucIdx2 = jugador.cubierta.findIndex(c => c.efecto === 'nauc_bloqueja');
      if (naucIdx2 !== -1) {
        const [nauc] = jugador.cubierta.splice(naucIdx2, 1);
        estado.jugadores[opciones.objetivoId].cubierta.push(nauc);
        addLog(estado, `${jugador.nombre} pasa El Butoni a ${estado.jugadores[opciones.objetivoId].nombre}.`);
        estado.accionesDisponibles--;
        if (estado.accionesDisponibles <= 0) avanzarTurno(estado);
        return { ok: true };
      }
    }
    return { error: 'El Butoni bloquea el uso de cartas especiales. Descártalo o pásalo.' };
  }

  const idx = jugador.mano.findIndex(c => c.uid === cartaUid && c.tipo === 'accio');
  if (idx === -1) return { error: 'No tienes esa carta especial en mano.' };

  const carta = jugador.mano.splice(idx, 1)[0];
  const result = aplicarEfectoAccio(estado, jugadorId, carta, opciones);

  if (result.error) {
    jugador.mano.push(carta);
    return result;
  }

  if (!result.enCubierta) estado.fonsMari.push(carta);

  addLog(estado, `🃏 ${jugador.nombre} juega "${carta.nombre}".`);

  if (!result.accionExtra) {
    estado.accionesDisponibles--;
    if (estado.accionesDisponibles <= 0) avanzarTurno(estado);
  }

  comprobarVictoria(estado, jugadorId);
  return { ok: true, ...result };
}

// ── Efectos de cartas especiales ──────────────────────────────
function aplicarEfectoAccio(estado, jugadorId, carta, opciones) {
  const jugador = estado.jugadores[jugadorId];
  const { objetivoId, botiUid, botiUid2, cartasDesc, cantidad } = opciones;

  switch (carta.efecto) {

    case 'roba_boti': {
      if (!objetivoId || !botiUid) return { error: 'Especifica jugador y tesoro objetivo.' };
      const rival = estado.jugadores[objetivoId];
      if (!rival) return { error: 'Jugador no existe.' };
      if (rival.cubierta.find(c => c.efecto === 'escudo_total' || c.efecto === 'escudo_accio')) {
        return { error: `${rival.nombre} tiene un escudo que bloquea las cartas especiales.` };
      }
      const botiIdx = rival.cubierta.findIndex(c => c.uid === botiUid);
      if (botiIdx === -1) return { error: 'Ese tesoro no existe.' };
      const [boti] = rival.cubierta.splice(botiIdx, 1);
      jugador.cubierta.push(boti);
      addLog(estado, `🦇 Murciélago cleptómano: ${jugador.nombre} roba "${boti.nombre}" de ${rival.nombre}.`);
      return {};
    }

    case 'anula_accio': {
      addLog(estado, `🥘 Paella protectora: ${jugador.nombre} anula la última carta especial.`);
      return {};
    }

    case 'riua_total': {
      const orden = estado.ordenTurnos;
      const n = orden.length;
      const copias = orden.map(id => [...estado.jugadores[id].cubierta]);
      for (let i = 0; i < n; i++) {
        const next = (i + estado.direccion + n) % n;
        estado.jugadores[orden[next]].cubierta = copias[i];
      }
      addLog(estado, `🌊 LA RIADA: Todos los tesoros pasan al siguiente jugador.`);
      return {};
    }

    case 'pacte_canvi': {
      if (!objetivoId) return { error: 'Especifica el jugador.' };
      if (jugador.cubierta.length === 0) return { error: 'No tienes ningún tesoro.' };
      const rival = estado.jugadores[objetivoId];
      const mis = [...jugador.cubierta];
      const sus = [...rival.cubierta];
      jugador.cubierta = sus;
      rival.cubierta = mis;
      addLog(estado, `🤝 Pacto del demonio: ${jugador.nombre} y ${rival.nombre} intercambian todos sus tesoros.`);
      return {};
    }

    case 'lluna_salta_torn': {
      if (!objetivoId) return { error: 'Especifica el jugador.' };
      const rival = estado.jugadores[objetivoId];
      rival.saltarTurno = true;
      robarDelMazo(estado, jugadorId, 1);
      addLog(estado, `🌕 Luna de Valencia: ${rival.nombre} pierde su próximo turno.`);
      return {};
    }

    case 'nauc_bloqueja': {
      if (!objetivoId) return { error: 'Especifica el jugador donde colocar El Butoni.' };
      const rival = estado.jugadores[objetivoId];
      rival.cubierta.push(carta);
      addLog(estado, `🤡 El Butoni se instala en el mostrador de ${rival.nombre}.`);
      return { enCubierta: true };
    }

    case 'repeticio_torn': {
      estado.accionesDisponibles += 2;
      addLog(estado, `🔁 Repetición: ${jugador.nombre} tiene 2 jugadas adicionales.`);
      return { accionExtra: true };
    }

    case 'dansa_direccio': {
      estado.direccion *= -1;
      robarDelMazo(estado, jugadorId, 1);
      addLog(estado, `💃 Danza de la Granada: el orden de turno se invierte.`);
      return {};
    }

    case 'vent_canvi_boti': {
      if (!objetivoId || !botiUid || !botiUid2) return { error: 'Especifica tu tesoro, el jugador y su tesoro.' };
      const rival = estado.jugadores[objetivoId];
      const miIdx = jugador.cubierta.findIndex(c => c.uid === botiUid);
      const suIdx = rival.cubierta.findIndex(c => c.uid === botiUid2);
      if (miIdx === -1 || suIdx === -1) return { error: 'Tesoro no encontrado.' };
      const miBoti = jugador.cubierta.splice(miIdx, 1)[0];
      const suBoti = rival.cubierta.splice(suIdx, 1)[0];
      jugador.cubierta.push(suBoti);
      rival.cubierta.push(miBoti);
      addLog(estado, `💨 Viento de lebeche: ${jugador.nombre} cambia "${miBoti.nombre}" por "${suBoti.nombre}".`);
      return {};
    }

    case 'tramuntana_borra': {
      if (!objetivoId) return { error: 'Especifica el jugador.' };
      const rival = estado.jugadores[objetivoId];
      // Nit de la cremà: descarta TODOS los tesoros del mostrador
      const borradas = [...rival.cubierta];
      rival.cubierta = [];
      estado.fonsMari.push(...borradas);
      addLog(estado, `🔥 Nit de la cremà: todos los tesoros de ${rival.nombre} al cementerio.`);
      return {};
    }

    case 'rumb_recupera': {
      const accioIdx = estado.fonsMari.findLastIndex(c => c.tipo === 'accio' && c.uid !== carta.uid);
      if (accioIdx === -1) return { error: 'No hay cartas especiales en el cementerio.' };
      const [recuperada] = estado.fonsMari.splice(accioIdx, 1);
      jugador.mano.push(recuperada);
      addLog(estado, `✨ Cazalla milagrosa: ${jugador.nombre} recupera "${recuperada.nombre}".`);
      return {};
    }

    case 'donyet_tria': {
      const robadas = [];
      for (let i = 0; i < 10; i++) {
        if (estado.mazo.length === 0) break;
        robadas.push(estado.mazo.pop());
      }
      estado.pendiente = { tipo: 'donyet_tria', jugadorId, opciones: robadas };
      addLog(estado, `🧚 Duendecillo escrutador: ${jugador.nombre} elige entre ${robadas.length} cartas.`);
      return { accionExtra: true, pendienteDonyet: robadas };
    }

    case 'pollet_roba_ma': {
      if (!objetivoId) return { error: 'Especifica el jugador.' };
      const rival = estado.jugadores[objetivoId];
      if (rival.mano.length < 7) return { error: `${rival.nombre} no tiene 7 o más cartas en mano.` };
      const robadas = [];
      for (let i = 0; i < 3; i++) {
        if (rival.mano.length === 0) break;
        const ri = Math.floor(Math.random() * rival.mano.length);
        const [c] = rival.mano.splice(ri, 1);
        jugador.mano.push(c);
        robadas.push(c.nombre);
      }
      addLog(estado, `🍗 El pico del medio pollo: ${jugador.nombre} roba de ${rival.nombre}: ${robadas.join(', ')}`);
      return {};
    }

    case 'jogador_canvi_ma': {
      const reales = (cartasDesc || []).slice(0, 5);
      for (const uid of reales) {
        const i2 = jugador.mano.findIndex(c => c.uid === uid);
        if (i2 !== -1) {
          const [c] = jugador.mano.splice(i2, 1);
          estado.fonsMari.push(c);
        }
      }
      robarDelMazo(estado, jugadorId, reales.length);
      addLog(estado, `🎲 El jugador de Petrer: ${jugador.nombre} cambia ${reales.length} carta(s).`);
      return {};
    }

    case 'sense_efecte': {
      addLog(estado, `💩 ${jugador.nombre} juega el Zurullo. No pasa absolutamente nada.`);
      return {};
    }

    // ── Expansión 2 ──────────────────────────────────────────

    case 'revolta_germanies': {
      // Batalla múltiple: se guarda como pendiente especial
      // Implementación simplificada: actúa como riada de batallas
      // Se notifica al cliente para que gestione las batallas secuenciales
      addLog(estado, `⚔️ ¡Rebelión de las Germanías! ${jugador.nombre} convoca batalla contra todos.`);
      estado.pendiente = {
        tipo: 'revolta',
        atacanteId: jugadorId,
        objetivosRestantes: estado.ordenTurnos.filter(id =>
          id !== jugadorId && estado.jugadores[id].conectado &&
          !estado.jugadores[id].cubierta.find(c => c.efecto === 'escudo_total')
        ),
        botisPorJugador: {}
      };
      return { accionExtra: true };
    }

    case 'misteri_elx': {
      addLog(estado, `🎭 El Misterio de Elche: efecto acordado antes de la partida.`);
      return {};
    }

    default:
      return { error: `Efecto '${carta.efecto}' no implementado.` };
  }
}

// Resolver elección del Duendecillo
function accionResolverDonyet(estado, jugadorId, elegidaUid) {
  if (!estado.pendiente || estado.pendiente.tipo !== 'donyet_tria') return { error: 'No hay elección pendiente.' };
  if (estado.pendiente.jugadorId !== jugadorId) return { error: 'No eres tú quien debe elegir.' };

  const jugador = estado.jugadores[jugadorId];
  const opciones = estado.pendiente.opciones;
  const elegida = opciones.find(c => c.uid === elegidaUid);
  if (!elegida) return { error: 'Carta no disponible.' };

  if (esBoti(elegida)) jugador.cubierta.push(elegida);
  else jugador.mano.push(elegida);

  const resto = opciones.filter(c => c.uid !== elegidaUid);
  estado.mazo.unshift(...barajar(resto));

  addLog(estado, `🧚 ${jugador.nombre} elige "${elegida.nombre}". Las demás vuelven al mazo.`);
  estado.pendiente = null;
  estado.accionesDisponibles--;
  if (estado.accionesDisponibles <= 0) avanzarTurno(estado);
  comprobarVictoria(estado, jugadorId);
  return { ok: true };
}

// ── Cálculo de combate ─────────────────────────────────────────
function calcularAtac(cartas, jugador) {
  let base = 0;
  const tieneEspill = cartas.some(c => c.efecto === 'espill_inverteix');
  const numGrumets = cartas.filter(c => c.efecto === 'treball_equip_atac').length;
  const numMuixeranga = cartas.filter(c => c.efecto === 'treball_equip_flex').length;
  const tieneLideratge = cartas.some(c => c.efecto === 'lideratge');

  for (const c of cartas) {
    if (['treball_equip_atac','treball_equip_flex','espill_inverteix'].includes(c.efecto)) continue;
    let a = c.atac || 0;
    if (c.efecto === 'fartura') {
      a += jugador.cubierta.filter(x => x.tipo === 'boti_sagrat').length;
    }
    if (c.efecto === 'lideratge' && numGrumets > 0) a = 3;
    if (c.efecto === 'papa_borja') a = jugador.mano.length;
    if (c.efecto === 'llotja_moneda') {
      a = lanzarMoneda() === 'cara' ? 6 : 0;
    }
    if (c.efecto === 'justa_virtut') a = 0; // se iguala al rival externamente
    base += a;
  }

  base += numGrumets;        // +1 por cada monleonete
  base += numMuixeranga * 2; // +2 por muixeranga (opción atac)

  // Hoz oxidada: +1 A
  if (jugador.cubierta.find(c => c.efecto === 'bonus_atac')) base++;

  // Espejo: usa la D de la carta principal como A
  if (tieneEspill) {
    const principal = cartas.find(c =>
      !['espill_inverteix','treball_equip_atac','treball_equip_flex'].includes(c.efecto)
    );
    if (principal) base = (principal.defensa || 0) + (jugador.cubierta.find(c => c.efecto === 'bonus_atac') ? 1 : 0);
  }

  return base;
}

function calcularDefensa(cartas, jugador) {
  let base = 0;
  const tieneEspill = cartas.some(c => c.efecto === 'espill_inverteix');

  for (const c of cartas) {
    if (c.efecto === 'treball_equip_atac') continue;
    if (c.efecto === 'espill_inverteix') continue;
    if (c.efecto === 'treball_equip_flex') { base += 1; continue; }

    let d = c.defensa || 0;
    if (c.efecto === 'fartura') d += jugador.cubierta.filter(x => x.tipo === 'boti_sagrat').length;
    if (c.efecto === 'papa_borja') d = jugador.mano.length;
    if (c.efecto === 'pilotari_moneda') {
      if (lanzarMoneda() === 'cara') d = 10;
    }
    if (c.efecto === 'justa_virtut') d = 0;
    base += d;
  }

  // Poción de horchata: +1 D
  if (jugador.cubierta.find(c => c.efecto === 'bonus_defensa')) base++;

  // Espejo: usa el A de la carta principal como D
  if (tieneEspill) {
    const principal = cartas.find(c =>
      !['espill_inverteix','treball_equip_atac','treball_equip_flex'].includes(c.efecto)
    );
    if (principal) base = (principal.atac || 0) + (jugador.cubierta.find(c => c.efecto === 'bonus_defensa') ? 1 : 0);
  }

  return base;
}

module.exports = {
  crearEstadoInicial,
  accionAlmoina,
  accionVenderBoti,
  accionDeclararBatalla,
  accionResponderBatalla,
  accionJugarAccio,
  accionResolverDonyet,
  esBoti,
  contarIngredientes,
  avanzarTurno
};
