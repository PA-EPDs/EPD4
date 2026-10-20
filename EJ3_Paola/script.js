/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */

// Datos del juego
const SUMA_MAGICA = 15;                 
const CELDA_CENTRAL = 4;
const MAX_FALLOS = 3;

// Filas, columnas y diagonales (índices 0-8 del tablero)
const LINEAS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
    [0, 4, 8], [2, 4, 6]                  // diagonales
];
const NOMBRES_LINEAS = [
    'Fila 1', 'Fila 2', 'Fila 3',
    'Columna 1', 'Columna 2', 'Columna 3',
    'Diagonal ↘', 'Diagonal ↙'
];

// Las 8 soluciones posibles
const SOLUCIONES = [
    [2, 7, 6, 9, 5, 1, 4, 3, 8],
    [2, 9, 4, 7, 5, 3, 6, 1, 8],
    [4, 3, 8, 9, 5, 1, 2, 7, 6],
    [4, 9, 2, 3, 5, 7, 8, 1, 6],
    [6, 1, 8, 7, 5, 3, 2, 9, 4],
    [6, 7, 2, 1, 5, 9, 8, 3, 4],
    [8, 1, 6, 3, 5, 7, 4, 9, 2],
    [8, 3, 4, 1, 5, 9, 6, 7, 2]
];

// Estado
let celdas = [];                        // los 9 <td>
let tablero = Array(9).fill(0);         // 0 = celda vacía
let celdaSeleccionada = CELDA_CENTRAL;  // índice de la celda activa
let intentos = 0;                       // cuadrados completos probados
let fallos = 0;                         // fallos desde la última pista
let bloqueado = false;                  // true cuando termina la partida
let dorado = false;                     // true si el cuadrado está resuelto
let mostrarIncompletas = false;         // true: vacías resaltadas en rojo
let cambioPendiente = false;            // hubo cambios sin evaluar
let inicio = 0;
let tiempoFinal = null;
let idCronometro = null;

// Utilidades
function sumaLinea(linea) {
    return linea.reduce((acc, i) => acc + tablero[i], 0);
}

function esMagico() {
    const sumas = LINEAS.map(sumaLinea);
    return sumas.every(s => s === sumas[0]);
}

function mostrarMensaje(tipo, lineas) {
    const caja = document.getElementById('mensaje');
    caja.className = 'mensaje' + (tipo ? ' ' + tipo : '');
    caja.replaceChildren();
    lineas.forEach((texto, i) => {
        const el = document.createElement(i === 0 ? 'strong' : 'span');
        el.textContent = texto;
        caja.appendChild(el);
    });
}

function tiempoActual() {
    if (tiempoFinal !== null)
        return tiempoFinal;
    return Math.floor((Date.now() - inicio) / 1000);
}

function iniciarCronometro() {
    clearInterval(idCronometro);
    inicio = Date.now();
    tiempoFinal = null;
    idCronometro = setInterval(() => {
        document.getElementById('tiempo').textContent = tiempoActual();
    }, 250);
}

function detenerCronometro() {
    tiempoFinal = tiempoActual();
    clearInterval(idCronometro);
    idCronometro = null;
    document.getElementById('tiempo').textContent = tiempoFinal;
}

// Número de celdas que coinciden entre el tablero y una solución
function coincidencias(solucion) {
    return solucion.filter((v, k) => v === tablero[k]).length;
}

// La solución más parecida a lo que el usuario lleva puesto
function solucionMasCercana() {
    return SOLUCIONES.reduce((mejor, s) => coincidencias(s) > coincidencias(mejor) ? s : mejor);
}

// Pintado de la interfaz
function pintar() {
    celdas.forEach((td, i) => {
        td.textContent = tablero[i] === 0 ? '' : tablero[i];
        td.className = '';
        if (tablero[i] === 0) {
            td.classList.add(mostrarIncompletas ? 'incompleta' : 'vacia');
        } else {
            td.classList.add('completa');
        }
        if (i === celdaSeleccionada && !bloqueado)
            td.classList.add('seleccionada');
        if (dorado)
            td.classList.add('dorada');
    });

    // Contadores
    const vacias = tablero.filter(v => v === 0).length;
    document.getElementById('restantes').textContent = vacias;
    document.getElementById('intentos').textContent = intentos;
    document.getElementById('fallos').textContent = fallos;
    document.getElementById('objetivo').textContent = SUMA_MAGICA;

    // Sumas en tiempo real
    const cont = document.getElementById('sumas');
    cont.replaceChildren();
    LINEAS.forEach((linea, k) => {
        const llenas = linea.filter(i => tablero[i] !== 0).length;
        const suma = sumaLinea(linea);
        const span = document.createElement('span');
        let clase = 'suma';
        if (llenas === 3)
            clase += suma === SUMA_MAGICA ? ' ok' : ' mal';
        span.className = clase;
        span.textContent = NOMBRES_LINEAS[k] + ': ' + suma + ' / ' + SUMA_MAGICA;
        cont.appendChild(span);
    });
}

// Eventos principales

// click: selecciona la celda donde se escribirá el número
function seleccionarCelda(event) {
    if (bloqueado)
        return;
    celdaSeleccionada = Number(event.currentTarget.dataset.indice);
    pintar();
}

// keydown: valida la tecla y coloca el número en la celda activa
function validarTecla(event) {
    if (bloqueado)
        return;
    if (event.ctrlKey || event.metaKey || event.altKey)
        return;   

    const tecla = event.key;

    // Extra: moverse por el tablero con las flechas
    if (tecla.startsWith('Arrow')) {
        event.preventDefault();
        let fila = Math.floor(celdaSeleccionada / 3);
        let col = celdaSeleccionada % 3;
        if (tecla === 'ArrowUp')
            fila = (fila + 2) % 3;
        if (tecla === 'ArrowDown')
            fila = (fila + 1) % 3;
        if (tecla === 'ArrowLeft')
            col = (col + 2) % 3;
        if (tecla === 'ArrowRight')
            col = (col + 1) % 3;
        celdaSeleccionada = fila * 3 + col;
        pintar();
        return;
    }

    // Extra: borrar el contenido de la celda activa
    if (tecla === 'Backspace' || tecla === 'Delete') {
        if (tablero[celdaSeleccionada] !== 0) {
            tablero[celdaSeleccionada] = 0;
            cambioPendiente = true;
            mostrarMensaje('', []);
            pintar();
        }
        return;
    }

    // Teclas especiales se ignoran
    if (tecla.length !== 1)
        return;

    // Comprueba que sea un numero
    if (!/^[0-9]$/.test(tecla)) {
        mostrarMensaje('aviso', ['Solo se aceptan números', 'Pulsa una cifra del 1 al 9.']);
        return;
    }

    const numero = Number(tecla);

    if (numero === 0) {
        mostrarMensaje('aviso', ['El 0 no es válido', 'Solo se aceptan cifras del 1 al 9.']);
        return;
    }

    // Comprueba que no se repita
    const repetido = tablero.some((v, i) => v === numero && i !== celdaSeleccionada);
    if (repetido) {
        mostrarMensaje('aviso', [
            'No puedes repetir números',
            'Cada cifra del 1 al 9 debe aparecer solo una vez'
        ]);
        return;
    }

    // Todo correcto: colocar el número
    tablero[celdaSeleccionada] = numero;
    cambioPendiente = true;
    mostrarMensaje('', []);
    pintar();
}

// keyup: comprueba el estado del cuadrado
function verificarCuadradoMagico() {
    if (bloqueado || !cambioPendiente)
        return;

    // 1) ¿Está completo?
    const hayVacias = tablero.some(v => v === 0);
    if (hayVacias) {
        mostrarIncompletas = true;      // las vacías se marcan en rojo
        pintar();
        return;
    }

    // 2) Está completo: se cuenta un intento y se evalúa
    mostrarIncompletas = false;
    cambioPendiente = false;
    intentos++;

    // 3) Sumas de filas, columnas y diagonales
    const sumas = LINEAS.map(sumaLinea);
    if (sumas.every(s => s === sumas[0])) {
        ganar();
        return;
    }

    // 4) Error: mensaje + pistas
    fallos++;
    const mensaje = [
        'Este no es un cuadrado mágico',
        'Las sumas no coinciden. ¡Sigue intentando!'
    ];

    const malas = [];
    LINEAS.forEach((linea, k) => {
        if (sumas[k] !== SUMA_MAGICA) {
            malas.push(NOMBRES_LINEAS[k] + ' suma ' + sumas[k]);
        }
    });
    let pistaSumas = 'Pista: ' + malas.slice(0, 3).join('; ');
    if (malas.length > 3)
        pistaSumas += ' (y ' + (malas.length - 3) + ' más)';
    mensaje.push(pistaSumas + ' en vez de ' + SUMA_MAGICA + '.');

    if (tablero[CELDA_CENTRAL] !== 5) {
        mensaje.push('Pista: el 5 siempre va en la celda central.');
    }

    // 5) Pista automática tras 3 fallos
    if (fallos >= MAX_FALLOS) {
        mensaje.push(darPistaAutomatica());
        if (esMagico()) {
            ganar();
            return;
        }
    }

    mostrarMensaje('error', mensaje);
    pintar();
}

// load: inicializa el juego
function iniciarJuego() {
    celdas = Array.from(document.querySelectorAll('#tablero td'));
    celdas.forEach(td => td.addEventListener('click', seleccionarCelda));
    document.addEventListener('keydown', validarTecla);
    document.addEventListener('keyup', verificarCuadradoMagico);

    document.getElementById('btnNueva').addEventListener('click', e => {
        e.currentTarget.blur();
        reiniciarJuego();
    });
    document.getElementById('btnOtro').addEventListener('click', reiniciarJuego);
    document.getElementById('btnResolver').addEventListener('click', e => {
        e.currentTarget.blur();
        resolverCuadrado();
    });

    reiniciarJuego();
}

// Fin de partida, pistas y reinicio
function ganar() {
    detenerCronometro();
    bloqueado = true;
    dorado = true;
    mostrarIncompletas = false;
    mostrarMensaje('exito', [
        '¡FELICIDADES!',
        'Has resuelto el cuadrado mágico en ' + tiempoFinal + ' segundos',
        'Suma mágica: ' + SUMA_MAGICA,
        '¿Quieres intentar otro?'
    ]);
    document.getElementById('btnOtro').hidden = false;
    pintar();
}

// Coloca en su sitio una cifra de la solución más cercana.
// Se intercambia con la celda que la tenía, así nunca hay repetidos.
function darPistaAutomatica() {
    fallos = 0;
    const solucion = solucionMasCercana();
    const i = tablero.findIndex((v, k) => v !== solucion[k]);
    const valor = solucion[i];
    const j = tablero.indexOf(valor);
    tablero[j] = tablero[i];
    tablero[i] = valor;
    celdaSeleccionada = i;
    return 'Pista automática: se ha colocado el ' + valor +
            ' en la fila ' + (Math.floor(i / 3) + 1) +
            ', columna ' + (i % 3 + 1) + '.';
}

function resolverCuadrado() {
    detenerCronometro();
    tablero = solucionMasCercana().slice();
    bloqueado = true;
    dorado = true;
    mostrarIncompletas = false;
    cambioPendiente = false;
    mostrarMensaje('info', [
        'Solución mostrada',
        'Suma mágica: ' + SUMA_MAGICA,
        'Pulsa "Nueva partida" para intentarlo tú.'
    ]);
    document.getElementById('btnOtro').hidden = true;
    pintar();
}

function reiniciarJuego() {
    tablero = Array(9).fill(0);          // limpiar celdas
    celdaSeleccionada = CELDA_CENTRAL;   // seleccionar la central
    intentos = 0;
    fallos = 0;
    bloqueado = false;
    dorado = false;                      // restablecer colores
    mostrarIncompletas = false;
    cambioPendiente = false;
    mostrarMensaje('', []);
    document.getElementById('btnOtro').hidden = true;
    document.getElementById('tiempo').textContent = 0;
    iniciarCronometro();
    pintar();
}

window.addEventListener('load', iniciarJuego);
