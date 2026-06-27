const { avanzarTurno, esBoti } = require('./juego');
const { barajar } = require('./cartas');

function avanzarTurnoPublico(estado) {
  avanzarTurno(estado);
}

module.exports = { avanzarTurnoPublico };
