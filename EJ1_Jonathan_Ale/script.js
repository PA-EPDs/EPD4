/**
 * ====================================================================
 * EPD 4 - JavaScript Avanzado
 * Ejercicio 1: Panel de Control de Misión Espacial
 *
 * ====================================================================
 */

// Definición de los 5 sistemas en estricto orden secuencial
const CONFIG_SISTEMAS = [
    {
        id: 'energia',
        tecla: '1',
        nombre: 'Energía',
        descripcion: 'Regula la generación y balance de energía eléctrica hacia todos los componentes críticos de la nave.',
        especificaciones: 'ESPECIFICACIONES DE ENERGÍA: Generador por fisión de 250 kW, respaldo auxiliar por celdas fotovoltaicas.'
    },
    {
        id: 'comunicaciones',
        tecla: '2',
        nombre: 'Comunicaciones',
        descripcion: 'Establece y mantiene los enlaces de telemetría y transmisión de voz en banda ancha con el centro de control en Tierra.',
        especificaciones: 'ESPECIFICACIONES DE COMUNICACIONES: Transceptor cuántico en banda X con antena de alta ganancia multicanal.'
    },
    {
        id: 'navegacion',
        tecla: '3',
        nombre: 'Navegación',
        descripcion: 'Navegación: Controla la trayectoria, posición y orientación de la nave.',
        especificaciones: 'ESPECIFICACIONES DE NAVEGACIÓN: Sistema inercial giroscópico con guiado por triangulación estelar redundante.'
    },
    {
        id: 'soporte-vital',
        tecla: '4',
        nombre: 'Soporte vital',
        descripcion: 'Gestiona la presurización, atmósfera respirable, temperatura de cabina y reciclaje de agua para la tripulación.',
        especificaciones: 'ESPECIFICACIONES DE SOPORTE VITAL: Módulo ambiental de 1 atm con regeneración de O2 y absorción electroquímica de CO2.'
    },
    {
        id: 'propulsion',
        tecla: '5',
        nombre: 'Propulsión',
        descripcion: 'Controla el flujo de propergoles, turbobombas y vectores de empuje de la etapa principal de lanzamiento.',
        especificaciones: 'ESPECIFICACIONES DE PROPULSIÓN: Motores criogénicos LH2/LOX de ciclo expandido con empuje combinado de 1.2 MN.'
    }
];

const NOMBRE_MISION = 'Misión Apolo';
const TIEMPO_PREPARACION_INICIAL = 90; // segundos
const TIEMPO_ADVERTENCIA = 15; // segundos restantes para alerta

// ====================================================================
// Estado Global de la Aplicación
// ====================================================================
let estadoApp = {
    misionIniciada: false,
    misionFinalizada: false,
    sistemaSiguienteIndex: 0,
    tiempoRestante: TIEMPO_PREPARACION_INICIAL,
    segundosCongelados: 0,
    advertenciaEmitida: false,
    intervaloPreparacion: null,
    intervaloLanzamiento: null,
    timeoutAvisoBloqueo: null,
    sistemas: []
};

// ====================================================================
// Elementos del DOM
// ====================================================================
const dom = {
    nombreMision: document.getElementById('nombreMision'),
    estadoNave: document.getElementById('estadoNave'),
    contadorTiempo: document.getElementById('contadorTiempo'),
    contadorSistemas: document.getElementById('contadorSistemas'),
    btnIniciar: document.getElementById('btnIniciar'),
    btnLanzar: document.getElementById('btnLanzar'),
    btnAbandonar: document.getElementById('btnAbandonar'),
    btnReiniciar: document.getElementById('btnReiniciar'),
    panelSistemas: document.getElementById('panelSistemas'),
    panelLateralContenido: document.getElementById('panelLateralContenido'),
    resumenMision: document.getElementById('resumenMision'),
    consolaMensajes: document.getElementById('consolaMensajes'),
    popupAlerta: document.getElementById('popupAlerta'),
    popupMensaje: document.getElementById('popupMensaje')
};

// ====================================================================
// Inicialización
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarMision();
    vincularEventosGlobales();
});

/**
 * Inicializa y restaura las variables de estado y elementos del DOM.
 */
function inicializarMision() {
    // Limpieza de posibles temporizadores activos
    detenerTodosTemporizadores();

    // Restauración de estado
    estadoApp.misionIniciada = false;
    estadoApp.misionFinalizada = false;
    estadoApp.sistemaSiguienteIndex = 0;
    estadoApp.tiempoRestante = TIEMPO_PREPARACION_INICIAL;
    estadoApp.segundosCongelados = 0;
    estadoApp.advertenciaEmitida = false;
    estadoApp.sistemas = CONFIG_SISTEMAS.map(s => ({
        ...s,
        operativo: false
    }));

    // Título y textos iniciales
    document.title = `Panel de Control - ${NOMBRE_MISION}`;
    dom.nombreMision.textContent = NOMBRE_MISION;
    dom.estadoNave.textContent = 'Esperando inicio';
    dom.contadorTiempo.textContent = `${TIEMPO_PREPARACION_INICIAL} s`;
    dom.contadorTiempo.classList.remove('alerta-parpadeo');
    actualizarContadorSistemasVisual();

    // Controles de botones
    dom.btnIniciar.disabled = false;
    dom.btnIniciar.style.display = 'inline-block';
    dom.btnLanzar.disabled = true;
    dom.btnAbandonar.disabled = true;
    dom.btnReiniciar.disabled = true;

    // Paneles
    dom.resumenMision.hidden = true;
    dom.resumenMision.textContent = '';
    dom.resumenMision.className = 'resumen-mision';
    dom.panelSistemas.hidden = false;

    // Panel lateral
    dom.panelLateralContenido.innerHTML = `
        <p class="placeholder-lateral">
            Haga clic sobre cualquier punto de una tarjeta para ver su descripción operativa.
            Doble clic para especificaciones técnicas.
        </p>
    `;

    // Limpieza de consola
    dom.consolaMensajes.innerHTML = '';
    registrarEnConsola('Sistema de control inicializado en espera de autorización.');

    // Construcción dinámica de tarjetas en el DOM
    renderizarTarjetasSistemas();
}

/**
 * Genera dinámicamente las tarjetas de cada sistema en el DOM.
 * Aplica los eventos requeridos: click, mouseover, mouseout, dblclick.
 */
function renderizarTarjetasSistemas() {
    dom.panelSistemas.innerHTML = '';

    estadoApp.sistemas.forEach((sistema, index) => {
        // Contenedor principal de la tarjeta
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-sistema';
        tarjeta.id = `tarjeta-${sistema.id}`;
        tarjeta.dataset.index = index;

        // Información del sistema
        const info = document.createElement('div');
        info.className = 'info-sistema';

        const nombre = document.createElement('span');
        nombre.className = 'nombre-sistema';
        nombre.textContent = sistema.nombre;

        const atajo = document.createElement('span');
        atajo.className = 'atajo-tecla';
        atajo.textContent = `[Tecla ${sistema.tecla}]`;

        const estado = document.createElement('span');
        estado.className = 'estado-sistema';
        estado.textContent = sistema.operativo ? 'Operativo' : 'Desactivado';

        info.appendChild(nombre);
        info.appendChild(atajo);
        info.appendChild(estado);

        // Botón de activación individual
        const btnActivar = document.createElement('button');
        btnActivar.className = 'btn-activar-sistema';
        btnActivar.textContent = 'Activar';
        btnActivar.disabled = true; // Deshabilitado hasta iniciar misión

        // 1. Clic en el botón: detener propagación y activar sistema
        btnActivar.addEventListener('click', (event) => {
            // RA5: Detener propagación para evitar disparar el clic de la tarjeta
            event.stopPropagation();
            intentarActivarSistema(index, 'ratón');
        });

        // 2. Clic en la tarjeta: mostrar descripción operativa en panel lateral
        tarjeta.addEventListener('click', () => {
            mostrarDescripcionEnPanelLateral(sistema);
        });

        // 3. mouseover y mouseout: resaltar temporalmente la tarjeta
        tarjeta.addEventListener('mouseover', () => {
            tarjeta.classList.add('tarjeta-resaltada');
        });

        tarjeta.addEventListener('mouseout', () => {
            tarjeta.classList.remove('tarjeta-resaltada');
        });

        // 4. dblclick: desplegar ventana de diálogo con especificaciones técnicas
        tarjeta.addEventListener('dblclick', () => {
            window.alert(sistema.especificaciones);
        });

        tarjeta.appendChild(info);
        tarjeta.appendChild(btnActivar);
        dom.panelSistemas.appendChild(tarjeta);
    });
}

/**
 * Vincula los eventos de la barra de acciones, teclado y contenedor principal.
 */
function vincularEventosGlobales() {
    // Botón Iniciar misión
    dom.btnIniciar.addEventListener('click', iniciarMision);

    // Botón Lanzar nave
    dom.btnLanzar.addEventListener('click', iniciarSecuenciaLanzamiento);

    // Botón Abandonar misión
    dom.btnAbandonar.addEventListener('click', confirmarAbandonoMision);

    // Botón Reiniciar misión
    dom.btnReiniciar.addEventListener('click', inicializarMision);

    // Detección de clic directo sobre el contenedor principal (márgenes/espacios)
    dom.panelSistemas.addEventListener('click', (event) => {
        if (event.target === event.currentTarget) {
            registrarEnConsola('Panel de sistemas seleccionado.');
        }
    });

    // Control mediante teclado numérico (1 a 5)
    window.addEventListener('keydown', (event) => {
        if (!estadoApp.misionIniciada || estadoApp.misionFinalizada) {
            return;
        }

        const teclasValidas = ['1', '2', '3', '4', '5'];
        if (teclasValidas.includes(event.key)) {
            const indexSeleccionado = parseInt(event.key, 10) - 1;
            intentarActivarSistema(indexSeleccionado, 'teclado');
        }
    });
}

// ====================================================================
// Lógica de Misión
// ====================================================================

/**
 * Comienza la misión: actualiza estados, habilita controles e inicia cuenta atrás de 90s.
 */
function iniciarMision() {
    if (estadoApp.misionIniciada) return;

    estadoApp.misionIniciada = true;
    estadoApp.misionFinalizada = false;

    // Deshabilitar y ocultar botón de inicio
    dom.btnIniciar.disabled = true;
    dom.btnIniciar.style.display = 'none';

    // Habilitar botón Abandonar misión
    dom.btnAbandonar.disabled = false;

    // Habilitar controles de activación de las tarjetas
    habilitarControlesSistemas(true);

    // Actualizar estado general
    dom.estadoNave.textContent = 'Preparación en curso';

    // Registrar inicio en consola
    registrarEnConsola('Protocolo de preparación iniciado.');

    // Activar cuenta atrás de 90 segundos con setInterval()
    estadoApp.tiempoRestante = TIEMPO_PREPARACION_INICIAL;
    actualizarContadorTiempoVisual();

    estadoApp.intervaloPreparacion = setInterval(() => {
        estadoApp.tiempoRestante--;
        actualizarContadorTiempoVisual();

        // Alerta a los 15 segundos restantes
        if (estadoApp.tiempoRestante === TIEMPO_ADVERTENCIA && !estadoApp.advertenciaEmitida) {
            estadoApp.advertenciaEmitida = true;
            dom.contadorTiempo.classList.add('alerta-parpadeo');
            registrarEnConsola('ADVERTENCIA: Tiempo de preparación próximo a finalizar.', 'advertencia');
        }

        // Si el tiempo llega a 0 sin haber lanzado la nave
        if (estadoApp.tiempoRestante <= 0) {
            cancelarMisionPorTiempoAgotado();
        }
    }, 1000);
}

/**
 * Intenta activar un sistema verificando la secuencia estricta.
 * index Índice del sistema seleccionado (0 a 4)
 * metodo 'ratón' o 'teclado'
 */
function intentarActivarSistema(index, metodo) {
    if (!estadoApp.misionIniciada || estadoApp.misionFinalizada) {
        return;
    }

    const sistema = estadoApp.sistemas[index];
    if (!sistema) return;

    // Si ya está activo, no volver a procesar
    if (sistema.operativo) {
        return;
    }

    // Validación estricta del orden secuencial
    if (index === estadoApp.sistemaSiguienteIndex) {
        // Activación correcta
        sistema.operativo = true;
        estadoApp.sistemaSiguienteIndex++;

        // Actualizar visual de la tarjeta
        const tarjeta = document.getElementById(`tarjeta-${sistema.id}`);
        if (tarjeta) {
            tarjeta.classList.add('operativo');
            const estadoTexto = tarjeta.querySelector('.estado-sistema');
            if (estadoTexto) estadoTexto.textContent = 'Operativo';

            const btnActivar = tarjeta.querySelector('.btn-activar-sistema');
            if (btnActivar) btnActivar.disabled = true;
        }

        // Actualizar contador visible de sistemas operativos
        actualizarContadorSistemasVisual();

        // Registrar en consola el sistema y método de interacción
        registrarEnConsola(`${sistema.nombre} activado mediante ${metodo}.`, 'info-sistema');

        // Comprobar si se completaron los 5 sistemas
        if (estadoApp.sistemaSiguienteIndex === CONFIG_SISTEMAS.length) {
            dom.btnLanzar.disabled = false;
            dom.estadoNave.textContent = 'Nave preparada para el lanzamiento.';
            habilitarControlesSistemas(false); // Bloquear modificación de los sistemas
            registrarEnConsola('Todos los sistemas operativos. Autorización de lanzamiento disponible.', 'exito');
        }
    } else {
        // Intento fuera de orden (ej: activar sistema antes del anterior)
        mostrarAvisoBloqueo('Acción bloqueada: debe activar primero el sistema anterior.');
    }
}

/**
 * Muestra el mensaje de bloqueo durante 3 segundos con control de solapamiento.
 */
function mostrarAvisoBloqueo(mensaje) {
    // Si ya hay un temporizador activo, cancelarlo antes de lanzar el nuevo
    if (estadoApp.timeoutAvisoBloqueo !== null) {
        clearTimeout(estadoApp.timeoutAvisoBloqueo);
        estadoApp.timeoutAvisoBloqueo = null;
    }

    dom.popupMensaje.textContent = mensaje;
    dom.popupAlerta.classList.add('visible');

    estadoApp.timeoutAvisoBloqueo = setTimeout(() => {
        dom.popupAlerta.classList.remove('visible');
        estadoApp.timeoutAvisoBloqueo = null;
    }, 3000);
}

/**
 * Muestra en el panel lateral la descripción operativa del sistema seleccionado.
 * 
 */
function mostrarDescripcionEnPanelLateral(sistema) {
    dom.panelLateralContenido.innerHTML = `
        <div class="titulo-lateral">${sistema.nombre}</div>
        <p class="desc-lateral">${sistema.descripcion}</p>
        <div class="tecla-info">Acceso rápido: Tecla [${sistema.tecla}] | Estado: <strong>${sistema.operativo ? 'Operativo' : 'Desactivado'}</strong></div>
    `;
}

/**
 * Ejecuta la secuencia de lanzamiento de la nave.
 */
function iniciarSecuenciaLanzamiento() {
    if (dom.btnLanzar.disabled || estadoApp.misionFinalizada) return;

    // Congelar tiempo restante y detener reloj de preparación
    clearInterval(estadoApp.intervaloPreparacion);
    estadoApp.segundosCongelados = estadoApp.tiempoRestante;

    // Inhabilitar todos los botones de la interfaz
    dom.btnIniciar.disabled = true;
    dom.btnLanzar.disabled = true;
    dom.btnAbandonar.disabled = true;
    habilitarControlesSistemas(false);

    // Cambiar estado
    dom.estadoNave.textContent = 'Lanzamiento en curso';
    registrarEnConsola('Secuencia de encendido autorizada.');

    // Cuenta atrás de lanzamiento de 5 segundos con intervalos de 1 segundo
    let cuentaAtras = 5;
    registrarEnConsola(`Cuenta de lanzamiento: ${cuentaAtras}`, 'advertencia');

    estadoApp.intervaloLanzamiento = setInterval(() => {
        cuentaAtras--;
        if (cuentaAtras > 0) {
            registrarEnConsola(`Cuenta de lanzamiento: ${cuentaAtras}`, 'advertencia');
        } else if (cuentaAtras === 0) {
            registrarEnConsola('¡Despegue!', 'exito');
            clearInterval(estadoApp.intervaloLanzamiento);
            finalizarLanzamientoExitoso();
        }
    }, 1000);
}

/**
 * Presenta el informe final de lanzamiento exitoso y actualiza títulos.
 */
function finalizarLanzamientoExitoso() {
    estadoApp.misionFinalizada = true;

    // Modificar el título de la pestaña del navegador
    document.title = '¡Misión en Vuelo! - Lanzamiento Exitoso';

    // Estado general
    dom.estadoNave.textContent = 'Nave en vuelo';

    // Generación dinámica del informe final
    const informe = `¡LANZAMIENTO COMPLETADO!\n` +
        `Misión: ${NOMBRE_MISION}\n` +
        `Sistemas operativos: 5 de 5\n` +
        `Tiempo restante: ${estadoApp.segundosCongelados} segundos\n` +
        `Estado: Nave en vuelo\n` +
        `Resultado: Protocolo ejecutado correctamente`;

    mostrarResumenFinal(informe, 'exito');

    // Habilitar botón para reiniciar misión
    dom.btnReiniciar.disabled = false;
}

/**
 * Cancela la misión cuando el tiempo llega a 0 sin haber lanzado la nave.
 */
function cancelarMisionPorTiempoAgotado() {
    clearInterval(estadoApp.intervaloPreparacion);
    estadoApp.misionFinalizada = true;

    // Bloquear todos los botones y teclado
    dom.btnIniciar.disabled = true;
    dom.btnLanzar.disabled = true;
    dom.btnAbandonar.disabled = true;
    habilitarControlesSistemas(false);

    // Estado general
    dom.estadoNave.textContent = 'MISIÓN CANCELADA: Protocolo incompleto';
    registrarEnConsola('MISIÓN CANCELADA: Se agotó el tiempo límite de preparación.', 'alerta');

    // Listar sistemas no activados
    const sistemasPendientes = estadoApp.sistemas
        .filter(s => !s.operativo)
        .map(s => s.nombre);

    const pendientesTexto = sistemasPendientes.length > 0
        ? sistemasPendientes.join(', ')
        : 'Ninguno';

    const informe = `MISIÓN CANCELADA\n` +
        `Sistemas operativos: ${estadoApp.sistemaSiguienteIndex} de 5\n` +
        `Sistemas pendientes: [${pendientesTexto}]\n` +
        `Estado: Protocolo incompleto\n` +
        `Resultado: Lanzamiento no autorizado`;

    mostrarResumenFinal(informe, 'cancelada');

    // Habilitar botón de reinicio
    dom.btnReiniciar.disabled = false;
}

/**
 * Gestiona la cancelación manual de la misión con confirmación nativa.
 */
function confirmarAbandonoMision() {
    // Confirmación nativa mediante window.confirm
    const confirmado = window.confirm('¿Confirma que desea abortar la misión en curso?');
    if (!confirmado) {
        return;
    }

    estadoApp.misionFinalizada = true;

    // Cancelar todos los temporizadores activos
    detenerTodosTemporizadores();

    // Deshabilitar todos los controles
    dom.btnIniciar.disabled = true;
    dom.btnLanzar.disabled = true;
    dom.btnAbandonar.disabled = true;
    habilitarControlesSistemas(false);

    // Actualizar estado general
    dom.estadoNave.textContent = 'Misión abortada por el usuario';

    // Registrar en consola
    registrarEnConsola('Aborto de misión confirmado.', 'alerta');

    // Cambiar título de la página
    document.title = 'Misión abortada';

    // Mostrar resumen de aborto
    const informe = `MISIÓN ABORTADA\n` +
        `Misión: ${NOMBRE_MISION}\n` +
        `Sistemas operativos: ${estadoApp.sistemaSiguienteIndex} de 5\n` +
        `Estado: Misión abortada por el usuario\n` +
        `Resultado: Aborto confirmado`;

    mostrarResumenFinal(informe, 'abortada');

    // Habilitar botón de reinicio
    dom.btnReiniciar.disabled = false;
}

// ====================================================================
// Funciones Auxiliares
// ====================================================================

/**
 * Actualiza la vista del contador de tiempo.
 */
function actualizarContadorTiempoVisual() {
    dom.contadorTiempo.textContent = `${estadoApp.tiempoRestante} s`;
}

/**
 * Actualiza el contador visible de sistemas operativos.
 */
function actualizarContadorSistemasVisual() {
    dom.contadorSistemas.textContent = `${estadoApp.sistemaSiguienteIndex} de 5`;
}

/**
 * Habilita o deshabilita los botones individuales de las tarjetas de sistemas.
 * 
 */
function habilitarControlesSistemas(habilitar) {
    const botones = dom.panelSistemas.querySelectorAll('.btn-activar-sistema');
    botones.forEach((btn, idx) => {
        // Solo habilitar si el sistema no estaba previamente operativo
        if (habilitar && !estadoApp.sistemas[idx].operativo) {
            btn.disabled = false;
        } else {
            btn.disabled = true;
        }
    });
}

/**
 * Agrega un registro cronológico a la consola de mensajes de la misión.
 * 
 * tipo 'normal' | 'info-sistema' | 'advertencia' | 'alerta' | 'exito'
 */
function registrarEnConsola(texto, tipo = 'normal') {
    const linea = document.createElement('div');
    linea.className = `linea-consola ${tipo}`;

    const ahora = new Date();
    const marcaTiempo = ahora.toTimeString().split(' ')[0];
    linea.textContent = `[${marcaTiempo}] ${texto}`;

    dom.consolaMensajes.appendChild(linea);
    dom.consolaMensajes.scrollTop = dom.consolaMensajes.scrollHeight;
}

/**
 * Muestra el informe de balance en el área de resumen.
 * 
 */
function mostrarResumenFinal(textoInforme, claseEstilo) {
    dom.resumenMision.className = `resumen-mision ${claseEstilo}`;
    dom.resumenMision.textContent = textoInforme;
    dom.resumenMision.hidden = false;
}

/**
 * Detiene todos los temporizadores e intervalos en ejecución.
 */
function detenerTodosTemporizadores() {
    if (estadoApp.intervaloPreparacion !== null) {
        clearInterval(estadoApp.intervaloPreparacion);
        estadoApp.intervaloPreparacion = null;
    }
    if (estadoApp.intervaloLanzamiento !== null) {
        clearInterval(estadoApp.intervaloLanzamiento);
        estadoApp.intervaloLanzamiento = null;
    }
    if (estadoApp.timeoutAvisoBloqueo !== null) {
        clearTimeout(estadoApp.timeoutAvisoBloqueo);
        estadoApp.timeoutAvisoBloqueo = null;
    }
    dom.popupAlerta.classList.remove('visible');
}
