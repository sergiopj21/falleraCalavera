// ============================================================
// LA FALLERA CALAVERA — Cartas oficiales (base + expansión 2)
// Nombres y efectos exactos según traducción oficial zombipaella.com
// ============================================================

const CARTAS_BASE = [

  // ══════════════════════════════════════════════════════
  // TESOROS — INGREDIENTES (calavera amarilla con !)
  // ══════════════════════════════════════════════════════
  { id: "bajoqueta",       nombre: "Judía verde",         tipo: "boti_sagrat", icono: "🥦", efecto_texto: "¡Ingrediente!",                                                                                       efecto: null,             copias: 4 },
  { id: "caragol",         nombre: "Caracol baboso",      tipo: "boti_sagrat", icono: "🐌", efecto_texto: "¡Ingrediente!",                                                                                       efecto: null,             copias: 4 },
  { id: "carxofa",         nombre: "Alcachofa",           tipo: "boti_sagrat", icono: "🌿", efecto_texto: "¡Ingrediente!",                                                                                       efecto: null,             copias: 4 },
  { id: "conill",          nombre: "Conejo",              tipo: "boti_sagrat", icono: "🐇", efecto_texto: "¡Ingrediente!",                                                                                       efecto: null,             copias: 4 },
  { id: "cuixa_pollastre", nombre: "Muslo de pollo",      tipo: "boti_sagrat", icono: "🍗", efecto_texto: "¡Ingrediente!",                                                                                       efecto: null,             copias: 4 },
  { id: "garrofons",       nombre: "Habas",               tipo: "boti_sagrat", icono: "🫘", efecto_texto: "¡Ingrediente!",                                                                                       efecto: null,             copias: 4 },
  { id: "tomaca",          nombre: "Tomate",              tipo: "boti_sagrat", icono: "🍅", efecto_texto: "¡Ingrediente!",                                                                                       efecto: null,             copias: 4 },
  { id: "cabeça_alls",     nombre: "Cabeza de ajos",      tipo: "boti_sagrat", icono: "🧄", efecto_texto: "¡Ingrediente! En partidas de 5 jugadores vale por 2 ingredientes.",                                  efecto: "doble_en_5j",    copias: 2 },

  // ══════════════════════════════════════════════════════
  // TESOROS — VENTA (calavera amarilla sin !)
  // ══════════════════════════════════════════════════════
  { id: "sant_calze",      nombre: "Santo cáliz de la catedral", tipo: "boti_mercat", icono: "🏺", efecto_texto: "Descártate para robar 7 cartas menos el número de ingredientes que tienes. Incluye el Santo cáliz en el recuento.", efecto: "calze_roba",     copias: 2 },
  { id: "dolçaina",        nombre: "Dulzaina y tambor",          tipo: "boti_mercat", icono: "🎺", efecto_texto: "Descártate para robar 2 cartas de la baraja. Además, haz otra jugada.",                                             efecto: "taberna_roba2",  copias: 3 },
  { id: "taronger",        nombre: "Naranjo putrefacto",         tipo: "boti_mercat", icono: "🍊", efecto_texto: "Mientras esté en el mostrador, no puedes descartarte de ningún tesoro para obtener cartas. A cambio roba 1 carta por turno y haz otra jugada.", efecto: "vaixell_passiu", copias: 2 },
  { id: "allioli",         nombre: "Alioli persistente",         tipo: "boti_mercat", icono: "🧅", efecto_texto: "Mientras no tengas ningún ingrediente en el mostrador, puedes hacer dos jugadas en un turno.",                       efecto: "cova_passiu",    copias: 2 },
  { id: "tartana_tio_pep", nombre: "La tartana del Tío Pep",    tipo: "boti_mercat", icono: "🛻", efecto_texto: "Siempre que esté en tu mostrador, roba 1 carta adicional cuando uses un tesoro para obtener cartas de la baraja.",   efecto: "galera_passiu",  copias: 2 },
  { id: "aeroport",        nombre: "Aeropuerto fantasma",        tipo: "boti_mercat", icono: "✈️", efecto_texto: "Siempre que el aeropuerto esté en un mostrador donde también esté el Conejo, el Conejo vale por 2 ingredientes.",    efecto: "far_passiu",     copias: 3 },

  // ══════════════════════════════════════════════════════
  // TESOROS — OTROS (calavera amarilla, efectos permanentes)
  // ══════════════════════════════════════════════════════
  { id: "corbella",        nombre: "Hoz oxidada",         tipo: "boti_estrany", icono: "⚔️", efecto_texto: "Siempre que la hoz esté en tu mostrador, tienes +1 de A en las batallas.",                                               efecto: "bonus_atac",     copias: 2 },
  { id: "pocio_orxata",    nombre: "Poción de horchata",  tipo: "boti_estrany", icono: "🥛", efecto_texto: "Siempre que la poción esté en tu mostrador, tienes +1 de D en las batallas.",                                             efecto: "bonus_defensa",  copias: 2 },
  { id: "falla_descomunal",nombre: "Falla descomunal",    tipo: "boti_estrany", icono: "🔥", efecto_texto: "Usa un turno para colocarla. Ahora ya no pueden usar cartas especiales para robarte tesoros. Un jugador puede declarar una batalla normal y, si gana, descartar la falla.", efecto: "escudo_accio",   copias: 1 },
  { id: "muralla_morella", nombre: "Muralla de Morella",  tipo: "boti_estrany", icono: "🏰", efecto_texto: "Usa un turno para colocarla. Ahora ya no pueden usar ni cartas especiales ni de batalla que afecten directamente a tus tesoros. Un jugador puede declarar una batalla y, si gana, descartar la muralla.", efecto: "escudo_total",   copias: 1 },

  // ══════════════════════════════════════════════════════
  // CARTAS DE BATALLA (calavera roja)
  // ══════════════════════════════════════════════════════
  { id: "fallera_calavera",nombre: "La Fallera Calavera",  tipo: "combat", icono: "💀", efecto_texto: "No tiene habilidades.", atac: 3, defensa: 3, efecto: null,                copias: 1 },
  { id: "jaume_i",         nombre: "Jaime I",              tipo: "combat", icono: "👑", efecto_texto: "No tiene habilidades.", atac: 3, defensa: 2, efecto: null,                copias: 2 },
  { id: "dama_elx",        nombre: "La Dama de Elche",     tipo: "combat", icono: "🗿", efecto_texto: "No tiene habilidades.", atac: 2, defensa: 3, efecto: null,                copias: 2 },
  { id: "tombatossals",    nombre: "Tombatossals",          tipo: "combat", icono: "🗻", efecto_texto: "No tiene habilidades.", atac: 2, defensa: 2, efecto: null,                copias: 3 },
  { id: "tirant_lo_blanc", nombre: "Tirant lo Blanc",      tipo: "combat", icono: "⚔️", efecto_texto: "No tiene habilidades.", atac: 3, defensa: 1, efecto: null,                copias: 2 },
  { id: "guerrer_moixent", nombre: "Guerrero de Moixent",  tipo: "combat", icono: "🛡️", efecto_texto: "No tiene habilidades.", atac: 2, defensa: 1, efecto: null,                copias: 3 },
  { id: "capita_moro",     nombre: "Capitán moro",          tipo: "combat", icono: "🧔", efecto_texto: "No tiene habilidades.", atac: 1, defensa: 2, efecto: null,                copias: 3 },
  { id: "delica_gandia",   nombre: "La Delicada de Gandía", tipo: "combat", icono: "🌹", efecto_texto: "No tiene habilidades.", atac: 1, defensa: 3, efecto: null,                copias: 2 },
  { id: "xicona_xixona",   nombre: "Chica de Xixona",       tipo: "combat", icono: "🎭", efecto_texto: "No tiene habilidades.", atac: 1, defensa: 1, efecto: null,                copias: 3 },
  { id: "gaiata",          nombre: "Gayata de la Madalena", tipo: "combat", icono: "🔭", efecto_texto: "No tiene habilidades.", atac: 2, defensa: 1, efecto: null,                copias: 2 },
  { id: "pinta_fallera",   nombre: "Peineta de fallera",    tipo: "combat", icono: "👸", efecto_texto: "No tiene habilidades.", atac: 1, defensa: 1, efecto: null,                copias: 3 },
  { id: "espardenyes",     nombre: "Alpargatas malolientes",tipo: "combat", icono: "👟", efecto_texto: "No tiene habilidades.", atac: 1, defensa: 1, efecto: null,                copias: 2 },
  { id: "monleon",         nombre: "Monleón",               tipo: "combat", icono: "🌾", efecto_texto: "Liderazgo. Si se presenta con una o más monleonetes, tiene 3 puntos de A en vez de 2.", atac: 2, defensa: 1, efecto: "lideratge", copias: 2 },
  { id: "monleonetes",     nombre: "Monleonetes",            tipo: "combat", icono: "👶", efecto_texto: "Trabajo en equipo. No puede batallar en solitario. Preséntala boca abajo junto con otra para sumar +1 al A de la otra carta. Puedes sumar tantas como quieras.", atac: 0, defensa: 0, efecto: "treball_equip_atac", copias: 3 },
  { id: "muixeranga",      nombre: "Muixeranga d'Algemesí", tipo: "combat", icono: "🏗️", efecto_texto: "Trabajo en equipo. No puede batallar en solitario. Preséntala boca abajo junto con otra para sumar +2 al A o +1 a la D de la otra carta.", atac: 0, defensa: 0, efecto: "treball_equip_flex", copias: 2 },
  { id: "tio_sangonera",   nombre: "El Tío Sangonera",       tipo: "combat", icono: "🐷", efecto_texto: "Empache. Tiene 1 punto adicional de A y D por cada ingrediente en tu mostrador.", atac: 1, defensa: 1, efecto: "fartura", copias: 2 },
  { id: "bellea_moc",      nombre: "La Belleza del Moco",    tipo: "combat", icono: "😤", efecto_texto: "Moco pegajoso. Si gana una batalla cuando ataca, roba otro tesoro además del que habías elegido.", atac: 2, defensa: 1, efecto: "moc_enganxos", copias: 2 },
  { id: "moma",            nombre: "La Moma",                tipo: "combat", icono: "🎭", efecto_texto: "Justa virtud. Tiene tantos puntos de A y D como tiene el oponente en batalla.", atac: 0, defensa: 0, efecto: "justa_virtut", copias: 2 },
  { id: "alcaldessa",      nombre: "Alcaldesa perpetua",     tipo: "combat", icono: "🎖️", efecto_texto: "Perpetuidad. Si la alcaldesa gana la batalla, esta carta vuelve a tu mano.", atac: 3, defensa: 2, efecto: "perpetuitat", copias: 1 },
  { id: "batalla_almansa", nombre: "Batalla de Almansa",     tipo: "combat", icono: "⚓", efecto_texto: "Convoca una batalla para quedarte todos los tesoros del oponente. Si la pierdes, regala todos los tuyos. No puedes usarla si no tienes ningún tesoro.", atac: 4, defensa: 0, efecto: "batalla_lepant", copias: 1 },
  { id: "masclet",         nombre: "Petardo",                tipo: "combat", icono: "💥", efecto_texto: "Descarta al azar 2 cartas de la mano de un jugador en el momento en que le declaras la batalla.", atac: 2, defensa: 1, efecto: "cano_descarta", copias: 2 },
  { id: "espill",          nombre: "Espejo reluciente",      tipo: "combat", icono: "🪞", efecto_texto: "Preséntalo boca abajo junto con una carta de batalla. Los valores de esa carta se invierten: la D es el A y el A es la D.", atac: 0, defensa: 0, efecto: "espill_inverteix", copias: 2 },
  { id: "espionatge",      nombre: "Espionaje",              tipo: "combat", icono: "🕵️", efecto_texto: "En el momento en que te declaran una batalla, destapa la carta o cartas del atacante. A continuación, puedes defenderte con normalidad.", atac: 0, defensa: 0, efecto: "espionatge", copias: 2 },
  { id: "aigua_valencia",  nombre: "Agua de Valencia",       tipo: "combat", icono: "🍹", efecto_texto: "Cuando se destapan las cartas de batalla, usa esta carta para restar 1 punto de A o D del contrincante. No se puede acumular más de un agua de Valencia.", atac: 0, defensa: 0, efecto: "vi_resta", copias: 2 },

  // ══════════════════════════════════════════════════════
  // CARTAS ESPECIALES (calavera blanca)
  // ══════════════════════════════════════════════════════
  { id: "rata_penada",     nombre: "Murciélago cleptómano",  tipo: "accio", icono: "🦇", nivell: 1, efecto_texto: "Roba un tesoro cualquiera del jugador que elijas.",                                                               efecto: "roba_boti",        copias: 3 },
  { id: "paella_protectora",nombre: "Paella protectora",    tipo: "accio", icono: "🥘", nivell: 2, efecto_texto: "Anula el efecto de cualquier carta especial. Esta carta puede ser anulada por otra paella.",                       efecto: "anula_accio",      copias: 3 },
  { id: "riua",            nombre: "La riada",               tipo: "accio", icono: "🌊", nivell: 3, efecto_texto: "Todos los jugadores dan todos sus tesoros al siguiente participante siguiendo el orden del turno.",                efecto: "riua_total",       copias: 1 },
  { id: "pacte_dimoni",    nombre: "Pacto del demonio",      tipo: "accio", icono: "🤝", nivell: 2, efecto_texto: "Cambia todos tus tesoros por todos los de otro jugador. No puedes usarla si no tienes ningún tesoro.",             efecto: "pacte_canvi",      copias: 2 },
  { id: "lluna_valencia",  nombre: "Luna de Valencia",       tipo: "accio", icono: "🌕", nivell: 2, efecto_texto: "Coloca esta carta en el mostrador de un oponente. Cuando le toque jugar, tendrá que descartarla sin poder hacer nada más. Además, roba 1 carta.", efecto: "lluna_salta_torn", copias: 2 },
  { id: "butoni",          nombre: "El Butoni",              tipo: "accio", icono: "🤡", nivell: 2, efecto_texto: "Coloca esta carta en el mostrador de un oponente. Ese jugador no puede usar ninguna carta especial. Quien lo tenga puede usar un turno para descartarlo o colocarlo en otro mostrador.", efecto: "nauc_bloqueja", copias: 2 },
  { id: "repeticio",       nombre: "Repetición",             tipo: "accio", icono: "🔁", nivell: 1, efecto_texto: "Después de usar esta carta, haz 2 jugadas seguidas.",                                                             efecto: "repeticio_torn",   copias: 3 },
  { id: "dansa_magrana",   nombre: "Danza de la Granada",   tipo: "accio", icono: "💃", nivell: 1, efecto_texto: "Cambia la dirección del turno y, además, roba 1 carta de la baraja.",                                             efecto: "dansa_direccio",   copias: 2 },
  { id: "vent_llebeig",    nombre: "Viento de lebeche",      tipo: "accio", icono: "💨", nivell: 2, efecto_texto: "Cambia un tesoro tuyo por otro del jugador que elijas.",                                                          efecto: "vent_canvi_boti",  copias: 2 },
  { id: "nit_crema",       nombre: "Nit de la cremà",        tipo: "accio", icono: "🔥", nivell: 3, efecto_texto: "Descarta todas las cartas de tesoro situadas sobre el mostrador de un jugador.",                                  efecto: "tramuntana_borra", copias: 1 },
  { id: "cassalla",        nombre: "Cazalla milagrosa",      tipo: "accio", icono: "✨", nivell: 2, efecto_texto: "Recupera una carta especial que ya haya sido usada.",                                                              efecto: "rumb_recupera",    copias: 2 },
  { id: "donyet",          nombre: "Duendecillo escrutador", tipo: "accio", icono: "🧚", nivell: 1, efecto_texto: "Roba 10 cartas de la baraja, elige 1 y devuelve el resto. Baraja bien las cartas.",                               efecto: "donyet_tria",      copias: 2 },
  { id: "bec_mig_pollastre",nombre: "El pico del medio pollo",tipo: "accio",icono: "🍗", nivell: 1, efecto_texto: "Si un jugador tiene 7 o más cartas en la mano, roba 3 de estas cartas al azar.",                                 efecto: "pollet_roba_ma",   copias: 2 },
  { id: "jugador_petrer",  nombre: "El jugador de Petrer",   tipo: "accio", icono: "🎲", nivell: 1, efecto_texto: "Descártate de hasta 5 cartas de tu mano y roba el mismo número de cartas de la baraja.",                         efecto: "jogador_canvi_ma", copias: 3 },
  { id: "cagallo",         nombre: "Zurullo / Mojón",        tipo: "accio", icono: "💩", nivell: 0, efecto_texto: "No tiene habilidades.",                                                                                            efecto: "sense_efecte",     copias: 2 },

  // ══════════════════════════════════════════════════════
  // EXPANSIÓN 2 — INGREDIENTES POLÉMICOS
  // ══════════════════════════════════════════════════════
  { id: "chotxina_espia",  nombre: "Clòtxina espia",         tipo: "boti_sagrat", icono: "🦪", efecto_texto: "¡Ingrediente! Mientras la tengas en el mostrador, todas las cartas usadas contra ti se presentarán destapadas (excepto las adjuntas a cartas de batalla).", efecto: "cloixina_espia", copias: 2 },
  { id: "gamba_denia",     nombre: "Gamba de Dénia",         tipo: "boti_sagrat", icono: "🦐", efecto_texto: "¡Ingrediente! Al inicio de tu turno, lanza la moneda de humor. Si sale cara, robas 1 carta de la baraja antes de tu jugada normal.",                       efecto: "gamba_moneda",   copias: 2 },
  { id: "chorizo",         nombre: "Chorizo",                tipo: "boti_sagrat", icono: "🌭", efecto_texto: "¡Ingrediente! La Fallera Calavera ODIA el chorizo. Si lo tienes, al final de cada turno lanza la moneda de humor. Si sale cruz, pierdes 1 ingrediente al azar.", efecto: "chorizo_maldito", copias: 2 },

  // EXPANSIÓN 2 — CARTAS DE BATALLA NUEVAS
  { id: "papa_borja",      nombre: "El papa Borja",          tipo: "combat", icono: "⛪", efecto_texto: "El papa Borja tiene tantos puntos de A y D como cartas tenga en la mano el jugador que lo use.", atac: 0, defensa: 0, efecto: "papa_borja", copias: 1 },
  { id: "pilotari",        nombre: "Pilotari",               tipo: "combat", icono: "🏐", efecto_texto: "Agilidad. Si sale cara en la moneda de humor, tiene D:10 en defensa.", atac: 2, defensa: 1, efecto: "pilotari_moneda", copias: 2 },
  { id: "reina_festes",    nombre: "Reina de las fiestas de Castellón", tipo: "combat", icono: "👸", efecto_texto: "Fin de reinado. Cuando va al cementerio tras una batalla, el jugador que la usó roba 2 cartas.", atac: 2, defensa: 2, efecto: "reina_festes", copias: 1 },
  { id: "llotja_seda",     nombre: "Llotja de la Seda",      tipo: "combat", icono: "🏛️", efecto_texto: "Lanza la moneda de humor. Si sale cara, tiene A:6. Si sale cruz, tiene A:0.", atac: 0, defensa: 2, efecto: "llotja_moneda", copias: 1 },

  // EXPANSIÓN 2 — CARTAS ESPECIALES NUEVAS
  { id: "revolta_germanies", nombre: "Rebelión de las Germanías", tipo: "accio", icono: "⚔️", nivell: 2, efecto_texto: "Batalla múltiple. Convoca una batalla simultánea contra todos los jugadores. Elige un tesoro de cada uno. Batallas individuales en orden de turno.", efecto: "revolta_germanies", copias: 1 },
  { id: "misteri_elx",     nombre: "El Misterio de Elche",   tipo: "accio", icono: "🎭", nivell: 3, efecto_texto: "Carta comodín. Antes de la partida acordad entre todos qué efecto tendrá. Puede actuar como ingrediente, carta de batalla o carta especial.", efecto: "misteri_elx", copias: 1 },

  // REFERENCIA
  { id: "carta_regles",    nombre: "Carta de reglas",        tipo: "referencia", icono: "📋", efecto_texto: "Carta de referencia. No se juega.",                                                                 efecto: null,             copias: 1 },
  { id: "dubtes_resolts",  nombre: "Dudas resueltas",        tipo: "referencia", icono: "❓", efecto_texto: "Carta de referencia. No se juega.",                                                                 efecto: null,             copias: 1 }
];

// Genera el mazo completo expandiendo las copias (sin cartas de referencia)
function generarMazo() {
  const mazo = [];
  let uid = 0;
  for (const carta of CARTAS_BASE) {
    if (carta.tipo === 'referencia') continue;
    for (let i = 0; i < carta.copias; i++) {
      mazo.push({ ...carta, uid: `${carta.id}_${uid++}` });
    }
  }
  return mazo;
}

// Barajar (Fisher-Yates)
function barajar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = { CARTAS_BASE, generarMazo, barajar };
