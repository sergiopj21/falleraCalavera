// ============================================================
// EL CORSARI MALEÏT — Cliente JavaScript
// ============================================================

const socket = io();

// ── Estado local del cliente ──────────────────────────────
const client = {
  jugadorId: null,
  nombre: null,
  codigoSala: null,
  esAnfitrion: false,
  estado: null,          // último estadoJuego recibido
  seleccionadas: [],     // UIDs de cartas seleccionadas en mano
  modoAccion: null,      // { tipo, carta } — acción en curso
  battleSelected: []     // cartas seleccionadas para defender
};

// ── Elementos del DOM ─────────────────────────────────────
const $ = id => document.getElementById(id);

const screens = {
  lobby: $('screen-lobby'),
  game:  $('screen-game')
};

// ══════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function showToast(msg, type = '') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function showError(msg) {
  const el = $('lobby-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function tipoLabel(tipo) {
  const map = {
    boti_sagrat: 'B.Sagrat', boti_mercat: 'B.Mercat',
    boti_estrany: 'B.Estrany', combat: 'Combat', accio: 'Acció'
  };
  return map[tipo] || tipo;
}

// ── Tooltip ───────────────────────────────────────────────
const tooltip = $('tooltip');
let tooltipTimer;

function showTooltip(e, carta) {
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(() => {
    let html = `<div class="tooltip-nombre">${carta.icono || ''} ${carta.nombre}</div>`;
    html += `<div class="tooltip-desc">${carta.descripcion || ''}</div>`;
    html += `<div class="tooltip-efecto">${carta.efecto_texto || ''}</div>`;
    if (carta.tipo === 'combat' && (carta.atac || carta.defensa)) {
      html += `<div class="tooltip-stats"><span class="stat-atac">A:${carta.atac ?? '?'}</span><span class="stat-def">D:${carta.defensa ?? '?'}</span></div>`;
    }
    if (carta.nivell !== undefined) {
      html += `<div class="tooltip-stats"><span style="color:var(--text-dim)">Nivell ${carta.nivell}</span></div>`;
    }
    tooltip.innerHTML = html;
    tooltip.classList.remove('hidden');
    positionTooltip(e);
  }, 400);
}

function positionTooltip(e) {
  const tw = 260, th = 180;
  let x = e.clientX + 14, y = e.clientY + 14;
  if (x + tw > window.innerWidth) x = e.clientX - tw - 8;
  if (y + th > window.innerHeight) y = e.clientY - th - 8;
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

function hideTooltip() {
  clearTimeout(tooltipTimer);
  tooltip.classList.add('hidden');
}

document.addEventListener('mousemove', e => {
  if (!tooltip.classList.contains('hidden')) positionTooltip(e);
});

// ── Modal genérico ────────────────────────────────────────
function openModal(title, bodyHTML, actions = []) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = bodyHTML;
  $('modal-actions').innerHTML = '';
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.className = `btn ${a.cls || 'btn-gold'}`;
    btn.textContent = a.label;
    btn.onclick = a.onClick;
    $('modal-actions').appendChild(btn);
  }
  $('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  $('modal-overlay').classList.add('hidden');
  client.modoAccion = null;
  clearSeleccion();
}

$('modal-close').onclick = closeModal;
$('modal-overlay').onclick = e => { if (e.target === $('modal-overlay')) closeModal(); };

// ══════════════════════════════════════════════════════════
// CONSTRUCCIÓN DE CARTAS
// ══════════════════════════════════════════════════════════

function buildCard(carta, opts = {}) {
  const { mini = false, selectable = false, selected = false, onClick, notPlayable = false } = opts;

  const el = document.createElement('div');
  el.className = [
    'card',
    `card-${carta.tipo}`,
    mini ? 'card-mini' : '',
    selected ? 'selected' : '',
    notPlayable ? 'not-playable' : ''
  ].filter(Boolean).join(' ');

  el.dataset.uid = carta.uid || carta.id;

  // Badge botí sagrat
  if (carta.tipo === 'boti_sagrat') {
    const badge = document.createElement('div');
    badge.className = 'boti-sagrat-badge';
    badge.textContent = '!';
    el.appendChild(badge);
  }

  // Header
  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <span class="card-icono">${carta.icono || '🂠'}</span>
    <span class="card-tipo-badge">${tipoLabel(carta.tipo)}</span>
  `;
  el.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';
  body.innerHTML = `
    <div class="card-nombre">${carta.nombre}</div>
    ${!mini ? `<div class="card-efecto">${carta.efecto_texto || ''}</div>` : ''}
  `;
  el.appendChild(body);

  // Footer (stats para combat, nivell para acció)
  if (!mini) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    if (carta.tipo === 'combat' && (carta.atac !== undefined || carta.defensa !== undefined)) {
      footer.innerHTML = `
        <div class="card-stats">
          <span class="stat-atac">A:${carta.atac ?? '?'}</span>
          <span class="stat-def">D:${carta.defensa ?? '?'}</span>
        </div>`;
    } else if (carta.tipo === 'accio' && carta.nivell !== undefined) {
      footer.innerHTML = `<span class="card-nivell">n:${carta.nivell}</span>`;
    } else {
      footer.innerHTML = `<span></span>`;
    }
    el.appendChild(footer);
  }

  // Eventos
  el.addEventListener('mouseenter', e => showTooltip(e, carta));
  el.addEventListener('mouseleave', hideTooltip);

  if (selectable && onClick) {
    el.addEventListener('click', () => onClick(carta, el));
  }

  return el;
}

// ══════════════════════════════════════════════════════════
// RENDER PRINCIPAL DEL ESTADO
// ══════════════════════════════════════════════════════════

function renderEstado(estado) {
  client.estado = estado;
  const esMiTurno = estado.jugadorActual === client.jugadorId;
  const hayPendiente = !!estado.pendiente;
  const soyDefensor = hayPendiente && estado.pendiente?.defensoreId === client.jugadorId;

  // ── Header ──────────────────────────────────────────────
  $('hdr-mazo-n').textContent = estado.mazoSize;
  $('hdr-fons-n').textContent = estado.fonsMariSize;
  $('hdr-sala-code').textContent = client.codigoSala;
  $('deck-count').textContent = estado.mazoSize;
  $('fons-count').textContent = estado.fonsMariSize;

  const turnInd = $('turn-indicator');
  if (esMiTurno) {
    const acciones = estado.accionesDisponibles;
    turnInd.textContent = `Tu turno · ${acciones} acción${acciones !== 1 ? 'es' : ''}`;
    turnInd.className = 'turn-indicator my-turn';
  } else {
    const jugActual = estado.jugadores[estado.jugadorActual];
    turnInd.textContent = jugActual ? `Turno de ${jugActual.nombre}` : '';
    turnInd.className = 'turn-indicator';
  }

  // ── Deck btn ─────────────────────────────────────────────
  $('btn-draw').disabled = !esMiTurno || hayPendiente || estado.accionesDisponibles <= 0;

  // ── End Turn btn ─────────────────────────────────────────
  const btnEnd = $('btn-end-turn');
  if (esMiTurno && estado.accionesDisponibles > 1 && !hayPendiente) {
    btnEnd.classList.remove('hidden');
  } else {
    btnEnd.classList.add('hidden');
  }

  // ── Log ──────────────────────────────────────────────────
  renderLog(estado.log);

  // ── Rivales ──────────────────────────────────────────────
  renderRivales(estado);

  // ── Mi cubierta ──────────────────────────────────────────
  renderMiCubierta(estado);

  // ── Mi mano ──────────────────────────────────────────────
  renderMiMano(estado);

  // ── Action bar ───────────────────────────────────────────
  renderActionBar(estado);

  // ── Batalla pendiente → abrir modal de defensa ───────────
  if (soyDefensor && hayPendiente && estado.pendiente.tipo === 'batalla') {
    if (!$('battle-overlay').classList.contains('visible-battle')) {
      openBattleModal(estado.pendiente);
    }
  }

  // ── Donyet pendiente ──────────────────────────────────────
  if (hayPendiente && estado.pendiente.tipo === 'donyet_tria' && esMiTurno) {
    openDonyetModal(estado.pendiente.opcionesDonyet);
  }

  // ── Fin de partida ────────────────────────────────────────
  if (estado.fase === 'fin') {
    openEndModal(estado);
  }
}

function renderLog(log) {
  const el = $('game-log');
  const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20;
  el.innerHTML = '';
  (log || []).forEach((entry, i) => {
    const div = document.createElement('div');
    div.className = `log-entry${i === 0 ? ' new' : ''}`;
    div.textContent = entry;
    el.appendChild(div);
  });
  if (isAtBottom) el.scrollTop = el.scrollHeight;
}

function renderRivales(estado) {
  const section = $('rivals-section');
  section.innerHTML = '';
  for (const [id, j] of Object.entries(estado.jugadores)) {
    if (id === client.jugadorId) continue;
    const isActive = estado.jugadorActual === id;

    const panel = document.createElement('div');
    panel.className = `rival-panel${isActive ? ' active-turn' : ''}${!j.conectado ? ' disconnected' : ''}`;

    const header = document.createElement('div');
    header.className = 'rival-header';
    header.innerHTML = `
      <span class="rival-name">${isActive ? '▶ ' : ''}${j.nombre}${!j.conectado ? ' (desconectado)' : ''}</span>
      <span class="rival-hand-count">✋ ${j.manoSize}</span>
    `;
    panel.appendChild(header);

    const cubierta = document.createElement('div');
    cubierta.className = 'rival-cubierta';
    (j.cubierta || []).forEach(carta => {
      const cardEl = buildCard(carta, { mini: true });
      cubierta.appendChild(cardEl);
    });
    panel.appendChild(cubierta);

    section.appendChild(panel);
  }
}

function renderMiCubierta(estado) {
  const me = estado.jugadores[client.jugadorId];
  if (!me) return;
  const el = $('my-cubierta');
  el.innerHTML = '';
  (me.cubierta || []).forEach(carta => {
    const isMercat = carta.tipo === 'boti_mercat';
    const esMiTurno = estado.jugadorActual === client.jugadorId;
    const hayPendiente = !!estado.pendiente;

    const cardEl = buildCard(carta, {
      selectable: isMercat && esMiTurno && !hayPendiente,
      onClick: isMercat ? (c) => confirmarVenderBoti(c) : null
    });
    el.appendChild(cardEl);
  });
}

function renderMiMano(estado) {
  const me = estado.jugadores[client.jugadorId];
  if (!me || !me.mano) return;
  const el = $('my-hand');
  const esMiTurno = estado.jugadorActual === client.jugadorId;
  const hayPendiente = !!estado.pendiente;
  const accionesLeft = estado.accionesDisponibles > 0;

  $('my-hand-count').textContent = `(${me.mano.length})`;
  el.innerHTML = '';

  me.mano.forEach(carta => {
    const selectable = esMiTurno && !hayPendiente && accionesLeft;
    const selected = client.seleccionadas.includes(carta.uid);
    const cardEl = buildCard(carta, {
      selectable,
      selected,
      notPlayable: !selectable,
      onClick: (c, cardDOM) => onCardClick(c, cardDOM, estado)
    });
    el.appendChild(cardEl);
  });
}

function renderActionBar(estado) {
  const bar = $('actions-left');
  bar.innerHTML = '';
  const esMiTurno = estado.jugadorActual === client.jugadorId;
  const hayPendiente = !!estado.pendiente;
  if (!esMiTurno || hayPendiente || estado.accionesDisponibles <= 0) return;

  // Mostrar selección actual
  if (client.seleccionadas.length > 0) {
    const me = estado.jugadores[client.jugadorId];
    const cartas = me.mano.filter(c => client.seleccionadas.includes(c.uid));
    const tipos = cartas.map(c => c.tipo);
    const sonCombat = tipos.every(t => t === 'combat');
    const sonAccio = tipos.length === 1 && tipos[0] === 'accio';

    if (sonCombat) {
      const pill = document.createElement('button');
      pill.className = 'action-pill';
      pill.textContent = `⚔️ Declarar batalla con ${cartas.length} carta(s)`;
      pill.onclick = () => abrirModalBatalla(cartas, estado);
      bar.appendChild(pill);
    } else if (sonAccio) {
      const pill = document.createElement('button');
      pill.className = 'action-pill';
      pill.textContent = `🃏 Jugar "${cartas[0].nombre}"`;
      pill.onclick = () => jugarAccion(cartas[0], estado);
      bar.appendChild(pill);
    }

    const clear = document.createElement('button');
    clear.className = 'action-pill btn-ghost';
    clear.textContent = '✕ Cancelar';
    clear.onclick = clearSeleccion;
    bar.appendChild(clear);
  } else {
    const hint = document.createElement('span');
    hint.textContent = 'Selecciona una carta para jugarla, o usa el botón Robar.';
    hint.style.color = 'var(--text-dim)';
    hint.style.fontSize = '13px';
    bar.appendChild(hint);
  }
}

// ══════════════════════════════════════════════════════════
// INTERACCIONES CON CARTAS
// ══════════════════════════════════════════════════════════

function onCardClick(carta, cardDOM, estado) {
  const esMiTurno = estado.jugadorActual === client.jugadorId;
  if (!esMiTurno || estado.accionesDisponibles <= 0) return;

  if (carta.tipo === 'combat') {
    // Toggle selección múltiple de combat
    const idx = client.seleccionadas.indexOf(carta.uid);
    if (idx === -1) {
      // Solo combat seleccionadas (o vacío)
      const me = estado.jugadores[client.jugadorId];
      const yaSelec = me.mano.filter(c => client.seleccionadas.includes(c.uid));
      if (yaSelec.length > 0 && yaSelec[0].tipo !== 'combat') {
        clearSeleccion();
      }
      client.seleccionadas.push(carta.uid);
      cardDOM.classList.add('selected');
    } else {
      client.seleccionadas.splice(idx, 1);
      cardDOM.classList.remove('selected');
    }
    renderActionBar(estado);

  } else if (carta.tipo === 'accio') {
    clearSeleccion();
    client.seleccionadas = [carta.uid];
    cardDOM.classList.add('selected');
    renderActionBar(estado);

  } else {
    // boti en mano (no debería pasar, los botí van a cubierta automáticamente)
    showToast('Los botí se colocan automáticamente en tu cubierta.', '');
  }
}

function clearSeleccion() {
  client.seleccionadas = [];
  document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
  renderActionBar(client.estado);
}

// ── Vender botí ───────────────────────────────────────────
function confirmarVenderBoti(carta) {
  openModal(
    `Vender "${carta.nombre}"`,
    `<p style="font-size:14px;color:var(--text-dim)">${carta.efecto_texto}</p>
     <p style="font-size:13px;margin-top:8px;color:var(--text-dim)">¿Confirmas la venta? La carta irá al Fons Marí.</p>`,
    [
      { label: '💰 Vender', cls: 'btn-gold', onClick: () => {
        closeModal();
        socket.emit('sellBoti', { cartaUid: carta.uid }, res => {
          if (res?.error) showToast(res.error, 'error');
        });
      }},
      { label: 'Cancelar', cls: 'btn-ghost', onClick: closeModal }
    ]
  );
}

// ── Modal batalla (atacar) ─────────────────────────────────
function abrirModalBatalla(cartasAtaque, estado) {
  const rivales = Object.values(estado.jugadores).filter(j => j.id !== client.jugadorId && j.conectado);
  if (rivales.length === 0) { showToast('No hay rivales disponibles.', 'error'); return; }

  let rivalSelecId = null;
  let botiSelecUid = null;

  function buildBody() {
    let html = '';

    // Resumen cartas ataque
    html += `<div style="margin-bottom:8px;font-size:13px;color:var(--text-dim)">Atacas con:</div>`;
    html += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">`;
    cartasAtaque.forEach(c => {
      html += `<div style="background:var(--mar-mid);border-radius:6px;padding:6px 10px;font-size:13px">
        ${c.icono} ${c.nombre} <span class="stat-atac">A:${c.atac}</span>
      </div>`;
    });
    html += `</div>`;

    // Selección rival
    html += `<div class="zone-label">Elige rival:</div><div class="modal-list" id="ml-rivales">`;
    rivales.forEach(j => {
      const sel = j.id === rivalSelecId;
      html += `<div class="modal-item${sel ? ' selected' : ''}" data-rid="${j.id}">
        <span class="item-icon">👤</span>${j.nombre}
        <div class="item-efecto">${j.cubierta?.filter(c => c.tipo === 'boti_sagrat').length || 0} botí sagrats · ${j.manoSize} cartas en mano</div>
      </div>`;
    });
    html += `</div>`;

    // Botí del rival seleccionado
    if (rivalSelecId) {
      const rival = estado.jugadores[rivalSelecId];
      html += `<div class="zone-label" style="margin-top:12px">Elige qué botí robar:</div><div class="modal-list" id="ml-botis">`;
      if (rival.cubierta.length === 0) {
        html += `<div style="color:var(--text-dim);font-size:13px;padding:8px">Este rival no tiene botí.</div>`;
      }
      rival.cubierta.forEach(c => {
        const sel = c.uid === botiSelecUid;
        html += `<div class="modal-item${sel ? ' selected' : ''}" data-buid="${c.uid}">
          <span class="item-icon">${c.icono || '🎁'}</span>${c.nombre}
          <div class="item-efecto">${c.tipo}</div>
        </div>`;
      });
      html += `</div>`;
    }

    return html;
  }

  function rebuildModal() {
    $('modal-body').innerHTML = buildBody();
    // Eventos
    document.querySelectorAll('#ml-rivales .modal-item').forEach(el => {
      el.onclick = () => { rivalSelecId = el.dataset.rid; botiSelecUid = null; rebuildModal(); };
    });
    if (rivalSelecId) {
      document.querySelectorAll('#ml-botis .modal-item').forEach(el => {
        el.onclick = () => { botiSelecUid = el.dataset.buid; rebuildModal(); };
      });
    }
  }

  openModal('⚔️ Declarar batalla', buildBody(), [
    { label: '⚔️ Atacar', cls: 'btn-gold', onClick: () => {
      if (!rivalSelecId) { showToast('Elige un rival.', 'error'); return; }
      if (!botiSelecUid) { showToast('Elige qué botí robar.', 'error'); return; }
      closeModal();
      clearSeleccion();
      socket.emit('declareBattle', {
        cartasUids: cartasAtaque.map(c => c.uid),
        objetivoId: rivalSelecId,
        botiUid: botiSelecUid
      }, res => {
        if (res?.error) showToast(res.error, 'error');
      });
    }},
    { label: 'Cancelar', cls: 'btn-ghost', onClick: closeModal }
  ]);

  rebuildModal();
}

// ── Jugar carta d'acció ────────────────────────────────────
function jugarAccion(carta, estado) {
  const efecto = carta.efecto;
  clearSeleccion();

  // Efectos sin objetivo
  const sinObjetivo = ['repeticio_torn', 'dansa_direccio', 'rumb_recupera', 'sense_efecte', 'anula_accio'];
  if (sinObjetivo.includes(efecto)) {
    socket.emit('playCard', { cartaUid: carta.uid, opciones: {} }, res => {
      if (res?.error) showToast(res.error, 'error');
      else closeModal();
    });
    return;
  }

  const rivales = Object.values(estado.jugadores).filter(j => j.id !== client.jugadorId && j.conectado);
  const me = estado.jugadores[client.jugadorId];

  // Nauc en cubierta propia → descartarlo
  if (efecto === 'nauc_bloqueja' && me.cubierta.some(c => c.efecto === 'nauc_bloqueja' && c.uid === carta.uid)) {
    socket.emit('playCard', { cartaUid: carta.uid, opciones: {} }, res => {
      if (res?.error) showToast(res.error, 'error');
    });
    return;
  }

  // Efectos que solo necesitan rival
  const soloRival = ['lluna_salta_torn', 'nauc_bloqueja', 'tramuntana_borra', 'pollet_roba_ma', 'pacte_canvi'];
  if (soloRival.includes(efecto)) {
    openModal(`🃏 ${carta.nombre}`, `
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">${carta.efecto_texto}</p>
      <div class="zone-label">Elige el jugador objetivo:</div>
      <div class="modal-list" id="ml-rival-accio">
        ${rivales.map(j => `<div class="modal-item" data-rid="${j.id}">👤 ${j.nombre}</div>`).join('')}
      </div>
    `, [
      { label: '✔ Confirmar', cls: 'btn-gold', onClick: () => {
        const sel = document.querySelector('#ml-rival-accio .modal-item.selected');
        if (!sel) { showToast('Elige un rival.', 'error'); return; }
        closeModal();
        socket.emit('playCard', { cartaUid: carta.uid, opciones: { objetivoId: sel.dataset.rid } }, res => {
          if (res?.error) showToast(res.error, 'error');
        });
      }},
      { label: 'Cancelar', cls: 'btn-ghost', onClick: closeModal }
    ]);
    document.querySelectorAll('#ml-rival-accio .modal-item').forEach(el => {
      el.onclick = () => {
        document.querySelectorAll('#ml-rival-accio .modal-item').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
      };
    });
    return;
  }

  // roba_boti → rival + botí
  if (efecto === 'roba_boti') {
    let rivalSelecId = null, botiSelecUid = null;

    function buildRobaBody() {
      let html = `<p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">${carta.efecto_texto}</p>`;
      html += `<div class="zone-label">Elige rival:</div><div class="modal-list" id="ml-r1">`;
      rivales.forEach(j => {
        html += `<div class="modal-item${j.id === rivalSelecId ? ' selected' : ''}" data-rid="${j.id}">👤 ${j.nombre}</div>`;
      });
      html += `</div>`;
      if (rivalSelecId) {
        const rival = estado.jugadores[rivalSelecId];
        html += `<div class="zone-label" style="margin-top:12px">Elige botí a robar:</div><div class="modal-list" id="ml-r2">`;
        rival.cubierta.forEach(c => {
          html += `<div class="modal-item${c.uid === botiSelecUid ? ' selected' : ''}" data-buid="${c.uid}">${c.icono || ''} ${c.nombre}</div>`;
        });
        html += `</div>`;
      }
      return html;
    }

    function rebuildRoba() {
      $('modal-body').innerHTML = buildRobaBody();
      document.querySelectorAll('#ml-r1 .modal-item').forEach(el => {
        el.onclick = () => { rivalSelecId = el.dataset.rid; botiSelecUid = null; rebuildRoba(); };
      });
      if (rivalSelecId) {
        document.querySelectorAll('#ml-r2 .modal-item').forEach(el => {
          el.onclick = () => { botiSelecUid = el.dataset.buid; rebuildRoba(); };
        });
      }
    }

    openModal(`🦇 ${carta.nombre}`, buildRobaBody(), [
      { label: '🦇 Robar', cls: 'btn-gold', onClick: () => {
        if (!rivalSelecId || !botiSelecUid) { showToast('Elige rival y botí.', 'error'); return; }
        closeModal();
        socket.emit('playCard', { cartaUid: carta.uid, opciones: { objetivoId: rivalSelecId, botiUid: botiSelecUid } }, res => {
          if (res?.error) showToast(res.error, 'error');
        });
      }},
      { label: 'Cancelar', cls: 'btn-ghost', onClick: closeModal }
    ]);
    rebuildRoba();
    return;
  }

  // vent_canvi_boti → mi botí + rival + su botí
  if (efecto === 'vent_canvi_boti') {
    let miBotiUid = null, rivalId = null, suBotiUid = null;

    function buildVentBody() {
      let html = `<p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">${carta.efecto_texto}</p>`;
      html += `<div class="zone-label">Tu botí a intercambiar:</div><div class="modal-list" id="ml-v1">`;
      me.cubierta.forEach(c => {
        html += `<div class="modal-item${c.uid === miBotiUid ? ' selected' : ''}" data-uid="${c.uid}">${c.icono || ''} ${c.nombre}</div>`;
      });
      html += `</div>`;
      html += `<div class="zone-label" style="margin-top:10px">Rival:</div><div class="modal-list" id="ml-v2">`;
      rivales.forEach(j => {
        html += `<div class="modal-item${j.id === rivalId ? ' selected' : ''}" data-rid="${j.id}">👤 ${j.nombre}</div>`;
      });
      html += `</div>`;
      if (rivalId) {
        const rival = estado.jugadores[rivalId];
        html += `<div class="zone-label" style="margin-top:10px">Botí del rival:</div><div class="modal-list" id="ml-v3">`;
        rival.cubierta.forEach(c => {
          html += `<div class="modal-item${c.uid === suBotiUid ? ' selected' : ''}" data-buid="${c.uid}">${c.icono || ''} ${c.nombre}</div>`;
        });
        html += `</div>`;
      }
      return html;
    }

    function rebuildVent() {
      $('modal-body').innerHTML = buildVentBody();
      document.querySelectorAll('#ml-v1 .modal-item').forEach(el => { el.onclick = () => { miBotiUid = el.dataset.uid; rebuildVent(); }; });
      document.querySelectorAll('#ml-v2 .modal-item').forEach(el => { el.onclick = () => { rivalId = el.dataset.rid; suBotiUid = null; rebuildVent(); }; });
      if (rivalId) {
        document.querySelectorAll('#ml-v3 .modal-item').forEach(el => { el.onclick = () => { suBotiUid = el.dataset.buid; rebuildVent(); }; });
      }
    }

    openModal(`💨 ${carta.nombre}`, buildVentBody(), [
      { label: '💨 Intercambiar', cls: 'btn-gold', onClick: () => {
        if (!miBotiUid || !rivalId || !suBotiUid) { showToast('Selecciona todos los campos.', 'error'); return; }
        closeModal();
        socket.emit('playCard', { cartaUid: carta.uid, opciones: { botiUid: miBotiUid, objetivoId: rivalId, botiUid2: suBotiUid } }, res => {
          if (res?.error) showToast(res.error, 'error');
        });
      }},
      { label: 'Cancelar', cls: 'btn-ghost', onClick: closeModal }
    ]);
    rebuildVent();
    return;
  }

  // jogador_canvi_ma → selección de hasta 5 cartas de la mano
  if (efecto === 'jogador_canvi_ma') {
    const selDesc = [];
    function buildJogadorBody() {
      let html = `<p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">${carta.efecto_texto}</p>`;
      html += `<div class="zone-label">Cartas a descartar (hasta 5):</div><div class="modal-list" id="ml-jog">`;
      me.mano.filter(c => c.uid !== carta.uid).forEach(c => {
        const sel = selDesc.includes(c.uid);
        html += `<div class="modal-item${sel ? ' selected' : ''}" data-cuid="${c.uid}">${c.icono || '🂠'} ${c.nombre}</div>`;
      });
      html += `</div>`;
      html += `<p style="font-size:12px;color:var(--text-dim);margin-top:8px">Seleccionadas: ${selDesc.length}</p>`;
      return html;
    }
    function rebuildJog() {
      $('modal-body').innerHTML = buildJogadorBody();
      document.querySelectorAll('#ml-jog .modal-item').forEach(el => {
        el.onclick = () => {
          const uid = el.dataset.cuid;
          const idx = selDesc.indexOf(uid);
          if (idx === -1 && selDesc.length < 5) selDesc.push(uid);
          else if (idx !== -1) selDesc.splice(idx, 1);
          rebuildJog();
        };
      });
    }
    openModal(`🎲 ${carta.nombre}`, buildJogadorBody(), [
      { label: '🎲 Cambiar', cls: 'btn-gold', onClick: () => {
        if (selDesc.length === 0) { showToast('Selecciona al menos 1 carta.', 'error'); return; }
        closeModal();
        socket.emit('playCard', { cartaUid: carta.uid, opciones: { cartasDesc: selDesc, cantidad: selDesc.length } }, res => {
          if (res?.error) showToast(res.error, 'error');
        });
      }},
      { label: 'Cancelar', cls: 'btn-ghost', onClick: closeModal }
    ]);
    rebuildJog();
    return;
  }

  // Fallback genérico (riua, etc.)
  openModal(`🃏 ${carta.nombre}`, `
    <p style="font-size:14px;color:var(--text-dim)">${carta.efecto_texto}</p>
    <p style="font-size:13px;margin-top:10px;color:var(--text-dim)">¿Confirmas jugar esta carta?</p>
  `, [
    { label: '✔ Jugar', cls: 'btn-gold', onClick: () => {
      closeModal();
      socket.emit('playCard', { cartaUid: carta.uid, opciones: {} }, res => {
        if (res?.error) showToast(res.error, 'error');
      });
    }},
    { label: 'Cancelar', cls: 'btn-ghost', onClick: closeModal }
  ]);
}

// ══════════════════════════════════════════════════════════
// MODAL BATALLA (DEFENSOR)
// ══════════════════════════════════════════════════════════

function openBattleModal(pendiente) {
  const overlay = $('battle-overlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('visible-battle');

  const atacante = client.estado?.jugadores[pendiente.atacanteId];
  const botiObj = client.estado?.jugadores[client.jugadorId]?.cubierta?.find(c => c.uid === pendiente.botiUid);

  $('battle-title').textContent = `¡Ataque de ${atacante?.nombre || '???'}!`;
  $('battle-desc').textContent = `Quiere robar: ${botiObj?.icono || ''} ${botiObj?.nombre || 'desconocido'} (Atac del rival: ${pendiente.atac})`;

  client.battleSelected = [];
  renderBattleHand();
}

function renderBattleHand() {
  const me = client.estado?.jugadores[client.jugadorId];
  if (!me) return;

  // Cubierta
  const cubEl = $('battle-my-cubierta');
  cubEl.innerHTML = '';
  me.cubierta.forEach(c => cubEl.appendChild(buildCard(c, { mini: true })));

  // Mano (solo combat)
  const handEl = $('battle-my-hand');
  handEl.innerHTML = '';
  me.mano.forEach(c => {
    const isCombat = c.tipo === 'combat';
    const selected = client.battleSelected.includes(c.uid);
    const cardEl = buildCard(c, {
      selectable: isCombat,
      selected,
      notPlayable: !isCombat,
      onClick: (carta, el) => {
        if (!isCombat) return;
        const idx = client.battleSelected.indexOf(carta.uid);
        if (idx === -1) client.battleSelected.push(carta.uid);
        else client.battleSelected.splice(idx, 1);
        renderBattleHand();
      }
    });
    handEl.appendChild(cardEl);
  });
}

$('btn-defend').onclick = () => {
  $('battle-overlay').classList.add('hidden');
  $('battle-overlay').classList.remove('visible-battle');
  socket.emit('respondBattle', { cartasUids: client.battleSelected }, res => {
    if (res?.error) showToast(res.error, 'error');
    client.battleSelected = [];
  });
};

$('btn-surrender').onclick = () => {
  $('battle-overlay').classList.add('hidden');
  $('battle-overlay').classList.remove('visible-battle');
  socket.emit('respondBattle', { cartasUids: [] }, res => {
    if (res?.error) showToast(res.error, 'error');
    client.battleSelected = [];
  });
};

// ══════════════════════════════════════════════════════════
// MODAL DONYET
// ══════════════════════════════════════════════════════════

function openDonyetModal(opciones) {
  if (!opciones || opciones.length === 0) return;
  let elegidaUid = null;

  function buildDonyetBody() {
    let html = `<p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">Elige 1 carta. Las demás vuelven al mazo.</p>`;
    html += `<div class="modal-list" id="ml-donyet">`;
    opciones.forEach(c => {
      const sel = c.uid === elegidaUid;
      html += `<div class="modal-item${sel ? ' selected' : ''}" data-uid="${c.uid}">
        ${c.icono || '🂠'} ${c.nombre}
        <div class="item-efecto">${c.efecto_texto || ''}</div>
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  function rebuildDonyet() {
    $('modal-body').innerHTML = buildDonyetBody();
    document.querySelectorAll('#ml-donyet .modal-item').forEach(el => {
      el.onclick = () => { elegidaUid = el.dataset.uid; rebuildDonyet(); };
    });
  }

  openModal('🧚 El Donyet Mariner', buildDonyetBody(), [
    { label: '✔ Elegir', cls: 'btn-gold', onClick: () => {
      if (!elegidaUid) { showToast('Elige una carta.', 'error'); return; }
      closeModal();
      socket.emit('resolveDonyet', { elegidaUid }, res => {
        if (res?.error) showToast(res.error, 'error');
      });
    }}
  ]);
  rebuildDonyet();
}

// ══════════════════════════════════════════════════════════
// MODAL FIN DE PARTIDA
// ══════════════════════════════════════════════════════════

function openEndModal(estado) {
  const overlay = $('end-overlay');
  overlay.classList.remove('hidden');
  const ganador = estado.jugadores[estado.ganador];
  const esMiVictoria = estado.ganador === client.jugadorId;
  $('end-title').textContent = esMiVictoria ? '¡Victòria, Capità!' : `${ganador?.nombre || '???'} guanya!`;
  $('end-desc').textContent = esMiVictoria
    ? 'Has reunit els 5 botí sagrats i apaivagat el Corsari Maleït. El Mediterrani és teu.'
    : `${ganador?.nombre} ha reunit els 5 botí sagrats i s'ha emportat la glòria.`;
}

$('btn-new-game').onclick = () => {
  $('end-overlay').classList.add('hidden');
  showScreen('lobby');
  client.jugadorId = null;
  client.codigoSala = null;
  client.estado = null;
};

// ══════════════════════════════════════════════════════════
// EVENTOS DE LOBBY
// ══════════════════════════════════════════════════════════

$('btn-create').onclick = () => {
  const nombre = $('create-nombre').value.trim();
  if (nombre.length < 2) { showError('El nombre debe tener al menos 2 caracteres.'); return; }
  $('btn-create').disabled = true;
  socket.emit('createRoom', { nombre }, res => {
    $('btn-create').disabled = false;
    if (res?.error) { showError(res.error); return; }
    client.jugadorId = res.jugadorId;
    client.nombre = nombre;
    client.codigoSala = res.codigo;
    client.esAnfitrion = true;
    $('room-code-value').textContent = res.codigo;
    $('hdr-sala-code').textContent = res.codigo;
    $('room-code-display').classList.remove('hidden');
    $('btn-start').classList.remove('hidden');
    $('lobby-players').classList.remove('hidden');
  });
};

$('btn-copy-code').onclick = () => {
  const code = $('room-code-value').textContent;
  navigator.clipboard.writeText(code).then(() => showToast('Código copiado.', 'success'));
};

$('btn-join').onclick = () => {
  const nombre = $('join-nombre').value.trim();
  const codigo = $('join-codigo').value.trim().toUpperCase();
  if (nombre.length < 2) { showError('El nombre debe tener al menos 2 caracteres.'); return; }
  if (codigo.length !== 6) { showError('El código de sala tiene 6 caracteres.'); return; }
  $('btn-join').disabled = true;
  socket.emit('joinRoom', { nombre, codigo }, res => {
    $('btn-join').disabled = false;
    if (res?.error) { showError(res.error); return; }
    client.jugadorId = res.jugadorId;
    client.nombre = nombre;
    client.codigoSala = res.codigo;
    client.esAnfitrion = false;
    $('hdr-sala-code').textContent = res.codigo;
    if (res.reconexion) {
      showScreen('game');
      showToast('Reconectado a la partida.', 'success');
    } else {
      showToast(`Te uniste a sala ${res.codigo}. Esperando que el anfitrión inicie.`, 'success');
    }
  });
};

$('btn-start').onclick = () => {
  $('btn-start').disabled = true;
  socket.emit('startGame', {}, res => {
    $('btn-start').disabled = false;
    if (res?.error) showError(res.error);
  });
};

// Enter en inputs
$('create-nombre').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-create').click(); });
$('join-codigo').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-join').click(); });
$('join-nombre').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-join').click(); });
$('join-codigo').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });

// ══════════════════════════════════════════════════════════
// EVENTOS DE JUEGO (botones)
// ══════════════════════════════════════════════════════════

$('btn-draw').onclick = () => {
  socket.emit('drawCard', {}, res => {
    if (res?.error) showToast(res.error, 'error');
  });
};

$('btn-end-turn').onclick = () => {
  socket.emit('endTurn', {}, res => {
    if (res?.error) showToast(res.error, 'error');
  });
};

// ══════════════════════════════════════════════════════════
// EVENTOS SOCKET
// ══════════════════════════════════════════════════════════

socket.on('salaActualizada', ({ jugadores, fase }) => {
  // Actualizar lista en lobby
  const list = $('lobby-players');
  if (list) {
    list.innerHTML = jugadores.map(j => `
      <div class="lobby-player-item">
        <div class="dot"></div>
        <span>${j.nombre}${j.id === client.jugadorId ? ' (tú)' : ''}</span>
      </div>
    `).join('');
  }
  // Si la partida inicia, cambiar pantalla
  if (fase === 'jugando') {
    showScreen('game');
  }
});

socket.on('estadoJuego', (estado) => {
  if (client.estado?.fase !== 'jugando' && estado.fase === 'jugando') {
    showScreen('game');
  }
  renderEstado(estado);
});

socket.on('batallaDeclarada', ({ atacanteNombre, botiNombre }) => {
  // El modal se abre al recibir el estado actualizado con pendiente
  showToast(`⚔️ ¡${atacanteNombre} te ataca por "${botiNombre}"!`, '');
});

socket.on('jugadorDesconectado', ({ nombre }) => {
  showToast(`⚠️ ${nombre} se ha desconectado.`, '');
});

socket.on('connect_error', () => {
  showToast('Error de conexión. Intentando reconectar...', 'error');
});

socket.on('reconnect', () => {
  showToast('Reconectado al servidor.', 'success');
  // Si estábamos en una sala, intentar rejoin
  if (client.codigoSala && client.nombre) {
    socket.emit('joinRoom', { nombre: client.nombre, codigo: client.codigoSala }, res => {
      if (res?.error) showToast(res.error, 'error');
    });
  }
});
