# ☠️ El Corsari Maleït — Juego de cartas multijugador online

## Requisitos

- **Node.js** v18 o superior → https://nodejs.org
- Conexión a internet (para las Google Fonts del frontend)
- Un terminal

---

## Instalación y arranque

### 1. Instalar dependencias del servidor

```bash
cd server
npm install
```

### 2. Iniciar el servidor

```bash
node index.js
```

Verás:
```
🚀 Servidor El Corsari Maleït escuchando en http://localhost:3000
```

### 3. Abrir el juego

Abre el navegador en **http://localhost:3000**

El servidor sirve el frontend automáticamente. No necesitas instalar nada más.

---

## Jugar con amigos en red local (misma WiFi)

1. Arranca el servidor en tu PC.
2. Encuentra tu IP local:
   - **Windows:** `ipconfig` → busca "Dirección IPv4"
   - **Mac/Linux:** `ifconfig` o `ip a`
3. Tus amigos abren `http://TU_IP_LOCAL:3000` en su navegador.

## Jugar con amigos remotos (internet)

Opción más fácil — usar **ngrok** (gratis):

```bash
# Instalar ngrok: https://ngrok.com
ngrok http 3000
```

Comparte la URL que te da ngrok (tipo `https://xxxx.ngrok.io`) con tus amigos.

---

## Estructura del proyecto

```
corsari/
├── server/
│   ├── index.js          ← Servidor Express + Socket.io
│   ├── juego.js          ← Motor de juego completo
│   ├── juego_utils.js    ← Utilidades internas
│   ├── cartas.js         ← Datos de todas las cartas
│   └── package.json
└── client/
    ├── index.html        ← UI del juego
    ├── css/
    │   └── style.css     ← Estilos
    └── js/
        └── app.js        ← Lógica del cliente
```

---

## Cómo añadir o modificar cartas

Todas las cartas están en `server/cartas.js` en el array `CARTAS_BASE`.

### Estructura de una carta

```js
{
  id: "mi_carta_nueva",          // ID único (snake_case)
  nombre: "La Carta Nueva",      // Nombre visible
  tipo: "accio",                 // boti_sagrat | boti_mercat | boti_estrany | combat | accio
  icono: "🌟",                   // Emoji decorativo
  descripcion: "Descripción.",   // Texto de sabor (tooltip)
  efecto_texto: "Roba 2 cartas.", // Efecto visible en carta
  efecto: "mi_efecto",           // Clave del efecto (ver juego.js)
  copias: 2,                     // Cuántas copias hay en el mazo

  // Solo para cartas de combat:
  atac: 2,
  defensa: 1,

  // Solo para cartes d'acció:
  nivell: 1,
}
```

### Añadir el efecto en `server/juego.js`

En la función `aplicarEfectoAccio`, añade un nuevo `case`:

```js
case 'mi_efecto': {
  // jugador = estado.jugadores[jugadorId]
  // opciones = { objetivoId, botiUid, ... }
  robarDelMazo(estado, jugadorId, 2);
  addLog(estado, `${jugador.nombre} roba 2 cartas.`);
  return {};
}
```

### Añadir la UI en `client/js/app.js`

Si tu carta necesita seleccionar un objetivo, añádela en la función `jugarAccion`:

```js
// Efectos sin objetivo (se juegan directamente)
const sinObjetivo = ['mi_efecto', ...];

// O bien, añade un bloque if para flujos personalizados:
if (efecto === 'mi_efecto') {
  // Muestra modal de selección...
}
```

---

## Eventos Socket.io (referencia)

| Evento (cliente → servidor) | Parámetros | Descripción |
|---|---|---|
| `createRoom` | `{ nombre }` | Crear sala nueva |
| `joinRoom` | `{ nombre, codigo }` | Unirse o reconectar |
| `startGame` | `{}` | Iniciar partida (solo anfitrión) |
| `drawCard` | `{}` | Almoina: robar 1 carta |
| `sellBoti` | `{ cartaUid }` | Vender botí de mercat |
| `declareBattle` | `{ cartasUids, objetivoId, botiUid }` | Atacar |
| `respondBattle` | `{ cartasUids }` | Defender (array vacío = rendirse) |
| `playCard` | `{ cartaUid, opciones }` | Jugar carta d'acció |
| `resolveDonyet` | `{ elegidaUid }` | Elegir carta del Donyet |
| `endTurn` | `{}` | Pasar turno |

| Evento (servidor → cliente) | Descripción |
|---|---|
| `estadoJuego` | Estado completo actualizado |
| `salaActualizada` | Lista de jugadores en lobby |
| `batallaDeclarada` | Notificación al defensor |
| `jugadorDesconectado` | Aviso de desconexión |

---

## Solución de problemas frecuentes

**"Cannot find module 'nanoid'"**
```bash
cd server && npm install
```

**El servidor arranca pero el navegador no carga**
- Asegúrate de abrir `http://localhost:3000`, no un archivo local.

**Los amigos no pueden conectarse**
- Comprueba que el firewall permite el puerto 3000.
- Usa ngrok para evitar problemas de red.

**Se desincroniza el estado**
- El estado siempre es autoritativo en el servidor. Recarga la página; el servidor reenvía el estado al reconectar.
