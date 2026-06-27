// ============================================================
// SERVIDOR — El Corsari Maleït
// ============================================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { customAlphabet } = require('nanoid');

const {
  crearEstadoInicial,
  accionAlmoina,
  accionVenderBoti,
  accionDeclararBatalla,
  accionResponderBatalla,
  accionJugarAccio,
  accionResolverDonyet
} = require('./juego');
const { avanzarTurnoPublico } = require('./juego_utils');

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../client/index.html')));

// ── Almacén en memoria ────────────────────────────────────────
// salas[codigo] = { codigo, jugadores: [{id, nombre, socketId}], estado, fase }
const salas = {};

// socketToSala[socketId] = { codigo, jugadorId }
const socketToSala = {};

// ── Helpers ───────────────────────────────────────────────────
function getSala(codigo) { return salas[codigo]; }

function vistaEstado(estado, jugadorId) {
  // Devuelve el estado filtrado: la mano del jugador actual es privada
  const jugadores = {};
  for (const [id, j] of Object.entries(estado.jugadores)) {
    jugadores[id] = {
      id: j.id,
      nombre: j.nombre,
      cubierta: j.cubierta,
      manoSize: j.mano.length,
      mano: id === jugadorId ? j.mano : undefined, // solo propia
      saltarTurno: j.saltarTurno,
      conectado: j.conectado,
      efectosBloqueados: j.efectosBloqueados,
      tieneNauc: j.cubierta.some(c => c.efecto === 'nauc_bloqueja')
    };
  }
  return {
    fase: estado.fase,
    mazoSize: estado.mazo.length,
    fonsMariSize: estado.fonsMari.length,
    jugadores,
    ordenTurnos: estado.ordenTurnos,
    turnoActual: estado.turnoActual,
    jugadorActual: estado.jugadorActual,
    ganador: estado.ganador,
    accionesDisponibles: estado.accionesDisponibles,
    pendiente: estado.pendiente ? {
      tipo: estado.pendiente.tipo,
      atacanteId: estado.pendiente.atacanteId,
      defensoreId: estado.pendiente.defensoreId,
      botiUid: estado.pendiente.botiUid,
      atac: estado.pendiente.atac,
      // Si el jugador es el defensor y tiene Espionatge, le mostramos las cartas
      cartasAtaque: estado.pendiente.defensoreId === jugadorId && estado.pendiente.espionatgeActivo
        ? estado.pendiente.cartasAtaque : undefined,
      opcionesDonyet: estado.pendiente.tipo === 'donyet_tria' && estado.pendiente.jugadorId === jugadorId
        ? estado.pendiente.opciones : undefined
    } : null,
    direccion: estado.direccion,
    log: estado.log.slice(0, 20)
  };
}

function emitirEstado(sala) {
  const { codigo, estado, jugadores } = sala;
  for (const j of jugadores) {
    const socket = io.sockets.sockets.get(j.socketId);
    if (socket) {
      socket.emit('estadoJuego', vistaEstado(estado, j.id));
    }
  }
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

// ── Socket.io ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  log(`🔌 Conectado: ${socket.id}`);

  // ── createRoom ──────────────────────────────────────────────
  socket.on('createRoom', ({ nombre }, cb) => {
    if (!nombre || nombre.trim().length < 2) {
      return cb({ error: 'Nombre demasiado corto.' });
    }
    const codigo = nanoid();
    const jugadorId = socket.id;
    salas[codigo] = {
      codigo,
      jugadores: [{ id: jugadorId, nombre: nombre.trim(), socketId: socket.id }],
      estado: null,
      fase: 'lobby'
    };
    socketToSala[socket.id] = { codigo, jugadorId };
    socket.join(codigo);
    log(`🏠 Sala creada: ${codigo} por ${nombre}`);
    cb({ ok: true, codigo, jugadorId });
    io.to(codigo).emit('salaActualizada', {
      jugadores: salas[codigo].jugadores.map(j => ({ id: j.id, nombre: j.nombre })),
      fase: 'lobby'
    });
  });

  // ── joinRoom ────────────────────────────────────────────────
  socket.on('joinRoom', ({ codigo, nombre }, cb) => {
    const sala = getSala(codigo?.toUpperCase());
    if (!sala) return cb({ error: 'Sala no encontrada. Revisa el código.' });
    if (sala.fase !== 'lobby') {
      // Intentar reconexión
      const existing = sala.jugadores.find(j => j.nombre === nombre.trim());
      if (existing) {
        existing.socketId = socket.id;
        if (sala.estado) sala.estado.jugadores[existing.id].conectado = true;
        socketToSala[socket.id] = { codigo, jugadorId: existing.id };
        socket.join(codigo);
        log(`♻️  Reconectado: ${nombre} a sala ${codigo}`);
        cb({ ok: true, codigo: sala.codigo, jugadorId: existing.id, reconexion: true });
        emitirEstado(sala);
        return;
      }
      return cb({ error: 'La partida ya ha comenzado.' });
    }
    if (sala.jugadores.length >= 5) return cb({ error: 'Sala llena (máx. 5 jugadores).' });
    if (!nombre || nombre.trim().length < 2) return cb({ error: 'Nombre demasiado corto.' });
    if (sala.jugadores.find(j => j.nombre === nombre.trim())) {
      return cb({ error: 'Ya hay un jugador con ese nombre.' });
    }

    const jugadorId = socket.id;
    sala.jugadores.push({ id: jugadorId, nombre: nombre.trim(), socketId: socket.id });
    socketToSala[socket.id] = { codigo, jugadorId };
    socket.join(codigo);
    log(`👤 ${nombre} entró a sala ${codigo}`);
    cb({ ok: true, codigo: sala.codigo, jugadorId });
    io.to(codigo).emit('salaActualizada', {
      jugadores: sala.jugadores.map(j => ({ id: j.id, nombre: j.nombre })),
      fase: 'lobby'
    });
  });

  // ── startGame ───────────────────────────────────────────────
  socket.on('startGame', (_, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala) return cb?.({ error: 'Sala no encontrada.' });
    if (sala.jugadores[0].id !== ref.jugadorId) return cb?.({ error: 'Solo el anfitrión puede iniciar.' });
    if (sala.jugadores.length < 2) return cb?.({ error: 'Mínimo 2 jugadores.' });
    if (sala.fase !== 'lobby') return cb?.({ error: 'Partida ya iniciada.' });

    sala.estado = crearEstadoInicial(sala.jugadores);
    sala.fase = 'jugando';
    log(`🎮 Partida iniciada en sala ${sala.codigo} con ${sala.jugadores.length} jugadores.`);
    cb?.({ ok: true });
    emitirEstado(sala);
  });

  // ── drawCard (Almoina) ──────────────────────────────────────
  socket.on('drawCard', (_, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala?.estado) return cb?.({ error: 'Partida no iniciada.' });
    const result = accionAlmoina(sala.estado, ref.jugadorId);
    if (result.error) return cb?.({ error: result.error });
    cb?.({ ok: true });
    emitirEstado(sala);
  });

  // ── sellBoti ────────────────────────────────────────────────
  socket.on('sellBoti', ({ cartaUid }, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala?.estado) return cb?.({ error: 'Partida no iniciada.' });
    const result = accionVenderBoti(sala.estado, ref.jugadorId, cartaUid);
    if (result.error) return cb?.({ error: result.error });
    cb?.({ ok: true });
    emitirEstado(sala);
  });

  // ── declareBattle ───────────────────────────────────────────
  socket.on('declareBattle', ({ cartasUids, objetivoId, botiUid }, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala?.estado) return cb?.({ error: 'Partida no iniciada.' });
    const result = accionDeclararBatalla(sala.estado, ref.jugadorId, cartasUids, objetivoId, botiUid);
    if (result.error) return cb?.({ error: result.error });
    cb?.({ ok: true });
    emitirEstado(sala);
    // Notificar al defensor
    const defensor = sala.jugadores.find(j => j.id === objetivoId);
    if (defensor) {
      io.to(defensor.socketId).emit('batallaDeclarada', {
        atacanteNombre: sala.estado.jugadores[ref.jugadorId].nombre,
        botiUid,
        botiNombre: sala.jugadores.find(j => j.id === objetivoId)
          ? sala.estado.jugadores[objetivoId].cubierta.find(c => c.uid === botiUid)?.nombre : ''
      });
    }
  });

  // ── respondBattle ───────────────────────────────────────────
  socket.on('respondBattle', ({ cartasUids }, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala?.estado) return cb?.({ error: 'Partida no iniciada.' });
    const result = accionResponderBatalla(sala.estado, ref.jugadorId, cartasUids || []);
    if (result.error) return cb?.({ error: result.error });
    cb?.({ ok: true, atacanteGana: result.atacanteGana });
    emitirEstado(sala);
  });

  // ── playCard (carta d'acció) ────────────────────────────────
  socket.on('playCard', ({ cartaUid, opciones }, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala?.estado) return cb?.({ error: 'Partida no iniciada.' });
    const result = accionJugarAccio(sala.estado, ref.jugadorId, cartaUid, opciones || {});
    if (result.error) return cb?.({ error: result.error });
    cb?.({ ok: true, ...result });
    emitirEstado(sala);
  });

  // ── resolveDonyet ────────────────────────────────────────────
  socket.on('resolveDonyet', ({ elegidaUid }, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala?.estado) return cb?.({ error: 'Partida no iniciada.' });
    const result = accionResolverDonyet(sala.estado, ref.jugadorId, elegidaUid);
    if (result.error) return cb?.({ error: result.error });
    cb?.({ ok: true });
    emitirEstado(sala);
  });

  // ── endTurn (por si hay acciones extra y el jugador no quiere usarlas) ──
  socket.on('endTurn', (_, cb) => {
    const ref = socketToSala[socket.id];
    if (!ref) return cb?.({ error: 'No estás en ninguna sala.' });
    const sala = getSala(ref.codigo);
    if (!sala?.estado) return cb?.({ error: 'Partida no iniciada.' });
    if (sala.estado.jugadorActual !== ref.jugadorId) return cb?.({ error: 'No es tu turno.' });
    if (sala.estado.pendiente) return cb?.({ error: 'Hay una acción pendiente.' });
    log(`⏭️  ${sala.estado.jugadores[ref.jugadorId].nombre} pasa turno.`);
    avanzarTurnoPublico(sala.estado);
    cb?.({ ok: true });
    emitirEstado(sala);
  });

  // ── Desconexión ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    const ref = socketToSala[socket.id];
    if (!ref) return;
    const sala = getSala(ref.codigo);
    if (!sala) return;
    const jugador = sala.jugadores.find(j => j.id === ref.jugadorId);
    if (jugador && sala.estado?.jugadores[ref.jugadorId]) {
      sala.estado.jugadores[ref.jugadorId].conectado = false;
      log(`❌ Desconectado: ${jugador.nombre} de sala ${ref.codigo}`);
      io.to(ref.codigo).emit('jugadorDesconectado', { nombre: jugador.nombre, jugadorId: ref.jugadorId });
    }
    delete socketToSala[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log(`🚀 Servidor El Corsari Maleït escuchando en http://localhost:${PORT}`);
});
