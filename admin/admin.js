let pedidosGlobal = [];



async function cargarPedidos() {

    const r = await fetch("/api/pedidos/hoy");

    console.log("PEDIDOS:", pedidosGlobal);

    pedidosGlobal = await r.json();

    renderPanel();
}

function esHoy(fechaPedido){

    const hoy = new Date();
    const fechaHoy = [
        hoy.getFullYear(),
        String(hoy.getMonth() + 1).padStart(2, "0"),
        String(hoy.getDate()).padStart(2, "0")
    ].join("-");

    // Evita que una fecha YYYY-MM-DD cambie de día por el huso horario.
    return String(fechaPedido || "").slice(0, 10) === fechaHoy;

}


function renderPanel() {

    const contenedor =
        document.getElementById("pedidos");

    contenedor.innerHTML = "";



let pedidosMostrar = pedidosGlobal.filter((pedido) =>
    esHoy(pedido.fecha || pedido.creadoEn)
);

    console.log(
        "MOSTRAR:",
        pedidosMostrar
    );

    console.log(
    "CANTIDAD:",
    pedidosMostrar.length
);

    console.log(
"PRIMER PEDIDO:",
pedidosMostrar[0]
);

  


pedidosGlobal.forEach(p => {
    console.log(
        "PEDIDO:",
        p.id,
        p.estado
    );
});

    pedidosMostrar.forEach(p => {

        const btn =
            document.createElement("button");

        btn.className = "botonPedido";

        if (p.estado === "PENDIENTE") {

            btn.classList.add("pendiente");

            btn.innerHTML =
                `${p.cliente || "SIN NOMBRE"}`;
        }

        if (p.estado === "PAGADA") {

            btn.classList.add("pagada");

            btn.innerHTML =
            `
            ${p.numeroOrden}<br>
            ${p.cliente || ""}
            `;
        }

        if (p.estado === "ENTREGADA") {

            btn.style.background =
                "#2563eb";

            btn.style.color =
                "white";

            btn.innerHTML =
            `
            ${p.numeroOrden}<br>
            ${p.cliente || ""}
            `;
        }

        if (p.estado === "CANCELADO") {

            btn.style.background =
                "#dc2626";

            btn.style.color =
                "white";

            btn.innerHTML =
                `${p.cliente || "SIN NOMBRE"}`;
        }

        btn.onclick = () =>
            mostrarDetalle(p);

        contenedor.appendChild(btn);
    });
}

function mostrarDetalle(pedido) {

    const modal =
        document.getElementById("modal");

    const detalle =
        document.getElementById("detallePedido");

    let productosHTML = "";

    if (pedido.productos) {

        pedido.productos.forEach(item => {

            productosHTML += `
                <div class="producto">
                    ${item.nombre}
                    - $${item.precio}
                </div>
            `;
        });
    }

    let titulo =
        pedido.cliente || "SIN NOMBRE";

    if (
        pedido.estado === "PAGADA" ||
        pedido.estado === "ENTREGADA"
    ) {

        titulo =
            `${pedido.numeroOrden} ${pedido.cliente}`;
    }

    let botones = "";

    if (pedido.estado === "PENDIENTE") {

        botones = `

            <div style="width:100%;">

                <div class="herramientasOrden">
                    <button
                        class="btnArticulo"
                        onclick="abrirAgregarArticulo('${pedido.id}')"
                    >
                        AGREGAR ARTÍCULO
                    </button>

                    <button
                        class="btnArticulo btnEliminarArticulo"
                        onclick="abrirEliminarArticulo('${pedido.id}')"
                    >
                        ELIMINAR ARTÍCULO
                    </button>
                </div>

                <div style="margin-top:15px;">
                    <strong>
                        EFECTIVO RECIBIDO
                    </strong>
                </div>

                <input
                    id="efectivoRecibido"
                    type="number"
                    min="0"
                    max="10000"
                    step="1"
                    inputmode="numeric"
                    style="
                    width:180px;
                    padding:10px;
                    font-size:32px;
                    font-weight:bold;
                    text-align:center;
                    margin-top:5px;
                    appearance:textfield;
                    -moz-appearance:textfield;
                    "
                    oninput="
                     calcularCambio(${pedido.total || 0})
                    "
                >

                <label style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    margin-top:14px;
                    font-size:17px;
                    font-weight:bold;
                    cursor:pointer;
                ">
                    <input
                        id="pagoConTarjeta"
                        type="checkbox"
                        style="width:20px;height:20px;"
                        onchange="actualizarFormaPago(${pedido.total || 0})"
                    >
                    PAGO CON TARJETA
                </label>

                <div
                    id="cambioMostrar"
                    style='
                        margin-top:15px;
                        font-size:24px;
                        font-weight:bold;
                        color:#16a34a;
                    '
                >
                    CAMBIO A ENTREGAR: $0
                </div>

                <div
                    class="acciones"
                    style="margin-top:20px;"
                >

                    <button
                        id="btnCobrar"
                        class="btnPagado"
                        disabled
                        onclick="cobrar('${pedido.id}')"
                    >
                        COBRAR
                    </button>

                    <button
                        class="btnCancelar"
                        onclick="cancelar('${pedido.id}')"
                    >
                        CANCELAR
                    </button>

                </div>

            </div>
        `;
    }

    if (pedido.estado === "PAGADA") {

        botones = `
            <button
                class="btnPagado"
                onclick="reimprimirTicket('${pedido.id}')"
            >
                REIMPRIMIR TICKET
            </button>
            <button
                class="btnEntregada"
                onclick="entregar('${pedido.id}')"
            >
                ENTREGADA
            </button>
        `;
    }

    if (pedido.estado === "ENTREGADA") {

        botones = `
            <strong style="
                color:#2563eb;
                font-size:20px;
            ">
                ORDEN ENTREGADA
            </strong>
        `;
    }

    if (pedido.estado === "CANCELADO") {

        botones = `
            <strong style="
                color:#dc2626;
                font-size:20px;
            ">
                ORDEN CANCELADA
            </strong>
        `;
    }

    detalle.innerHTML = `

        <div class="modalTitulo">
            ${titulo}
        </div>

        ${productosHTML}

        <div class="total">
            TOTAL:
            $${pedido.total || 0}
        </div>

        <div class="acciones">
            ${botones}
        </div>

        <div style="margin-top:20px;">
            <button onclick="cerrarModal()">
                CERRAR
            </button>
        </div>
    `;

    modal.style.display = "flex";

setTimeout(() => {

    const campo =
        document.getElementById(
            "efectivoRecibido"
        );

    if(campo){

        campo.focus();

        campo.select();

    }

},100);

}

function pedidoPorId(id) {
    return pedidosGlobal.find((pedido) => pedido.id === id);
}

function etiquetaConPrecio(articulo) {
    return `${articulo.nombre} — $${Number(articulo.precio || 0).toFixed(2)}`;
}

function volverADetalle(id) {
    const pedido = pedidoPorId(id);
    if (pedido) mostrarDetalle(pedido);
    else cerrarModal();
}

function renderSelectorArticulo(id, titulo, instruccion, opciones, alSeleccionar, alRegresar) {
    const detalle = document.getElementById("detallePedido");
    detalle.innerHTML = `
        <div class="modalTitulo">${titulo}</div>
        <div>${instruccion}</div>
        <div id="selectorArticulos" class="selectorArticulos"></div>
        <button class="btnRegresarEditor" id="btnRegresarEditor">REGRESAR</button>
    `;

    const contenedor = document.getElementById("selectorArticulos");
    opciones.forEach((opcion) => {
        const boton = document.createElement("button");
        boton.textContent = opcion.etiqueta;
        boton.onclick = () => alSeleccionar(opcion);
        contenedor.appendChild(boton);
    });

    document.getElementById("btnRegresarEditor").onclick = alRegresar || (() => volverADetalle(id));
}

function abrirAgregarArticulo(id) {
    mostrarCategoriasArticulo(id);
}

function mostrarCategoriasArticulo(id) {
    const opciones = Object.keys(menu).map((categoria) => ({
        categoria,
        etiqueta: menu[categoria].nombre
    }));

    renderSelectorArticulo(
        id,
        "AGREGAR ARTÍCULO",
        "Selecciona una categoría del menú.",
        opciones,
        (opcion) => mostrarProductosCategoria(id, opcion.categoria),
        () => volverADetalle(id)
    );
}

function mostrarProductosCategoria(id, categoria) {
    const opciones = menu[categoria].productos.map((producto, indice) => ({
        indice,
        etiqueta: producto.precio === undefined ? producto.nombre : etiquetaConPrecio(producto)
    }));

    renderSelectorArticulo(
        id,
        menu[categoria].nombre,
        "Selecciona el artículo que deseas agregar.",
        opciones,
        (opcion) => seleccionarArticuloMenu(id, categoria, opcion.indice),
        () => mostrarCategoriasArticulo(id)
    );
}

function seleccionarArticuloMenu(id, categoria, indice) {
    const producto = { ...menu[categoria].productos[indice], categoria };

    if (categoria === "banderillas") {
        if (producto.nombre === "LA ITALIANA") return agregarArticuloAOrden(id, producto);
        return mostrarCubiertasBanderilla(id, producto);
    }

    if (categoria === "sodas") return mostrarPerlasArticulo(id, producto);

    if (categoria === "snacks") {
        if (producto.nombre === "BONELESS") return mostrarTamanoBoneless(id, producto);
        if (producto.nombre === "K BITES") return mostrarVarianteKBites(id, producto);
        if (producto.nombre === "PAPAS A LA FRANCESA") return mostrarOpcionesPapas(id, producto);
    }

    agregarArticuloAOrden(id, producto);
}

function mostrarCubiertasBanderilla(id, producto) {
    const opciones = menu.banderillas.cubiertas.map((cubierta) => ({
        etiqueta: etiquetaConPrecio(cubierta),
        articulo: {
            nombre: `${producto.nombre} / ${cubierta.nombre}`,
            precio: producto.precio + cubierta.precio,
            categoria: producto.categoria
        }
    }));
    opciones.push({
        etiqueta: "SIN CUBIERTA — $0.00",
        articulo: { nombre: `${producto.nombre} / SIN CUBIERTA`, precio: producto.precio, categoria: producto.categoria }
    });

    renderSelectorArticulo(id, "SELECCIONA CUBIERTA", producto.nombre, opciones,
        (opcion) => agregarArticuloAOrden(id, opcion.articulo),
        () => mostrarProductosCategoria(id, "banderillas")
    );
}

function mostrarTamanoBoneless(id, producto) {
    const opciones = producto.variantes.map((variante) => ({ etiqueta: etiquetaConPrecio(variante), variante }));
    renderSelectorArticulo(id, "SELECCIONA TAMAÑO", producto.nombre, opciones,
        (opcion) => mostrarSalsaBonelessArticulo(id, producto, opcion.variante),
        () => mostrarProductosCategoria(id, "snacks")
    );
}

function mostrarSalsaBonelessArticulo(id, producto, variante) {
    const opciones = producto.modificadores.map((salsa) => ({
        etiqueta: salsa.nombre,
        articulo: {
            nombre: `${producto.nombre} / ${variante.nombre} / ${salsa.nombre}`,
            precio: variante.precio + salsa.precio,
            categoria: producto.categoria
        }
    }));
    renderSelectorArticulo(id, "SELECCIONA SALSA", producto.nombre, opciones,
        (opcion) => agregarArticuloAOrden(id, opcion.articulo),
        () => mostrarTamanoBoneless(id, producto)
    );
}

function mostrarOpcionesPapas(id, producto) {
    const opciones = producto.variantes.map((variante) => ({
        etiqueta: etiquetaConPrecio(variante),
        articulo: { nombre: `${producto.nombre} / ${variante.nombre}`, precio: variante.precio, categoria: producto.categoria }
    }));
    renderSelectorArticulo(id, "SELECCIONA OPCIÓN", producto.nombre, opciones,
        (opcion) => agregarArticuloAOrden(id, opcion.articulo),
        () => mostrarProductosCategoria(id, "snacks")
    );
}

function mostrarVarianteKBites(id, producto) {
    const opciones = producto.variantes.map((variante) => ({ etiqueta: etiquetaConPrecio(variante), variante }));
    renderSelectorArticulo(id, "SELECCIONA VARIANTE", producto.nombre, opciones,
        (opcion) => mostrarCubiertasKBitesArticulo(id, producto, opcion.variante),
        () => mostrarProductosCategoria(id, "snacks")
    );
}

function mostrarCubiertasKBitesArticulo(id, producto, variante) {
    const opciones = menu.banderillas.cubiertas.map((cubierta) => ({
        etiqueta: etiquetaConPrecio(cubierta),
        articulo: {
            nombre: `${producto.nombre} / ${variante.nombre} / ${cubierta.nombre}`,
            precio: variante.precio + cubierta.precio,
            categoria: producto.categoria
        }
    }));
    opciones.push({
        etiqueta: "SIN CUBIERTA — $0.00",
        articulo: { nombre: `${producto.nombre} / ${variante.nombre} / SIN CUBIERTA`, precio: variante.precio, categoria: producto.categoria }
    });
    renderSelectorArticulo(id, "SELECCIONA CUBIERTA", producto.nombre, opciones,
        (opcion) => agregarArticuloAOrden(id, opcion.articulo),
        () => mostrarVarianteKBites(id, producto)
    );
}

function mostrarPerlasArticulo(id, producto) {
    const opciones = [{ nombre: "SIN PERLAS", precio: 0 }, ...menu.sodas.perlas].map((perla) => ({
        etiqueta: etiquetaConPrecio(perla),
        articulo: {
            nombre: `${producto.nombre} / ${perla.nombre}`,
            precio: producto.precio + perla.precio,
            categoria: producto.categoria
        }
    }));
    renderSelectorArticulo(id, "PERLAS DE SABOR", producto.nombre, opciones,
        (opcion) => agregarArticuloAOrden(id, opcion.articulo),
        () => mostrarProductosCategoria(id, "sodas")
    );
}

function abrirEliminarArticulo(id) {
    const pedido = pedidoPorId(id);
    if (!pedido) return cerrarModal();

    const opciones = pedido.productos.map((articulo, indice) => ({
        indice,
        etiqueta: `ELIMINAR: ${etiquetaConPrecio(articulo)}`
    }));

    renderSelectorArticulo(
        id,
        "ELIMINAR ARTÍCULO",
        pedido.productos.length === 1
            ? "La orden debe conservar al menos un artículo."
            : "Selecciona el artículo que deseas quitar de esta orden.",
        opciones,
        (opcion) => eliminarArticuloDeOrden(id, opcion.indice),
        () => volverADetalle(id)
    );
}

function agregarArticuloAOrden(id, articulo) {
    const pedido = pedidoPorId(id);
    if (!pedido) return cerrarModal();

    // El servidor admite hasta 50 artículos por pedido. La cantidad se limita
    // aquí para que varias unidades se agreguen como artículos independientes.
    const maximo = Math.min(20, 50 - pedido.productos.length);
    let cantidad = 1;
    const detalle = document.getElementById("detallePedido");

    if (maximo < 1) {
        detalle.innerHTML = `
            <div class="modalTitulo">LÍMITE ALCANZADO</div>
            <p>Esta orden ya tiene el máximo de artículos permitido.</p>
            <button class="btnCerrar" onclick="volverADetalle('${id}')">REGRESAR</button>
        `;
        return;
    }

    detalle.innerHTML = `
        <div class="modalTitulo">¿CUÁNTOS ARTÍCULOS?</div>
        <p><strong>${articulo.nombre}</strong><br>${etiquetaConPrecio(articulo)}</p>
        <div class="selectorCantidad">
            <button type="button" id="restarCantidad" aria-label="Restar artículo">−</button>
            <strong id="cantidadSeleccionada">1</strong>
            <button type="button" id="sumarCantidad" aria-label="Sumar artículo">+</button>
        </div>
        <button class="btnPagado" id="confirmarCantidad">AGREGAR 1 ARTÍCULO</button>
        <button class="btnCerrar" onclick="volverADetalle('${id}')">REGRESAR</button>
    `;

    const actualizarSelector = () => {
        document.getElementById("cantidadSeleccionada").textContent = cantidad;
        document.getElementById("restarCantidad").disabled = cantidad === 1;
        document.getElementById("sumarCantidad").disabled = cantidad === maximo;
        document.getElementById("confirmarCantidad").textContent =
            `AGREGAR ${cantidad} ${cantidad === 1 ? "ARTÍCULO" : "ARTÍCULOS"}`;
    };

    document.getElementById("restarCantidad").onclick = () => {
        if (cantidad > 1) {
            cantidad--;
            actualizarSelector();
        }
    };
    document.getElementById("sumarCantidad").onclick = () => {
        if (cantidad < maximo) {
            cantidad++;
            actualizarSelector();
        }
    };
    document.getElementById("confirmarCantidad").onclick = () =>
        agregarUnidadesAOrden(id, articulo, cantidad);
    actualizarSelector();
}

async function agregarUnidadesAOrden(id, articulo, cantidad) {
    const pedido = pedidoPorId(id);
    if (!pedido) return cerrarModal();
    const unidades = Array.from({ length: cantidad }, () => ({ ...articulo }));
    await actualizarArticulosPedido(id, [...pedido.productos, ...unidades]);
}

async function eliminarArticuloDeOrden(id, indice) {
    const pedido = pedidoPorId(id);
    if (!pedido) return cerrarModal();
    if (pedido.productos.length <= 1) {
        alert("La orden debe conservar al menos un artículo.");
        return;
    }

    const articulo = pedido.productos[indice];
    if (!confirm(`¿Eliminar ${articulo.nombre}?`)) return;
    await actualizarArticulosPedido(id, pedido.productos.filter((_articulo, posicion) => posicion !== indice));
}

async function actualizarArticulosPedido(id, productos) {
    const respuesta = await fetch(`/api/pedidos/${encodeURIComponent(id)}/productos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos })
    });
    const resultado = await respuesta.json();

    if (!resultado.ok) {
        alert(resultado.error || "No fue posible actualizar la orden.");
        return;
    }

    const posicion = pedidosGlobal.findIndex((pedido) => pedido.id === id);
    if (posicion >= 0) pedidosGlobal[posicion] = resultado.pedido;
    mostrarDetalle(resultado.pedido);
    renderPanel();
}

function calcularCambio(total) {

    const efectivo =
        Number(
            document.getElementById(
                "efectivoRecibido"
            ).value
        );

    const cambioDiv =
        document.getElementById(
            "cambioMostrar"
        );

    const btnCobrar =
        document.getElementById(
            "btnCobrar"
        );

    if (!efectivo) {

        cambioDiv.innerHTML =
            "CAMBIO A ENTREGAR: $0";

        btnCobrar.disabled = true;

        return;
    }

    const cambio =
        efectivo - total;

    if (cambio < 0) {

        cambioDiv.innerHTML =
            "CAMBIO A ENTREGAR: EFECTIVO INSUFICIENTE";

        cambioDiv.style.color =
            "#dc2626";

        btnCobrar.disabled = true;

        return;
    }

    cambioDiv.innerHTML =
        "CAMBIO A ENTREGAR: $" +
        cambio.toFixed(2);

    cambioDiv.style.color =
        "#16a34a";

    btnCobrar.disabled = false;
}

function cerrarModal() {

    document.getElementById("modal")
        .style.display = "none";
}

function actualizarFormaPago(total) {
    const tarjeta = document.getElementById("pagoConTarjeta");
    const efectivo = document.getElementById("efectivoRecibido");
    const cambioDiv = document.getElementById("cambioMostrar");
    const btnCobrar = document.getElementById("btnCobrar");
    if (!tarjeta || !efectivo || !cambioDiv || !btnCobrar) return;

    if (tarjeta.checked) {
        efectivo.disabled = true;
        efectivo.value = "";
        cambioDiv.innerHTML = "PAGO CON TARJETA";
        cambioDiv.style.color = "#2563eb";
        btnCobrar.disabled = false;
        return;
    }

    efectivo.disabled = false;
    calcularCambio(total);
}

async function cobrar(id) {

    const pagoConTarjeta =
        document.getElementById("pagoConTarjeta")?.checked === true;

    const respuesta = await fetch(
        "/api/cobrar/" + id,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pagoConTarjeta })
        }
    );

    const resultado = await respuesta.json();

    if (!resultado.ok) {
        alert(resultado.error || "No fue posible registrar el cobro.");
        return;
    }

    cerrarModal();

    cargarPedidos();

    if (resultado.ticket && !resultado.ticket.ok) {
        alert(resultado.ticket.error);
    }
}

async function cancelar(id) {

    await fetch(
        "/api/cancelar/" + id,
        {
            method: "POST"
        }
    );

    cerrarModal();

    cargarPedidos();
}

async function entregar(id) {

    await fetch(
        "/api/entregar/" + id,
        {
            method: "POST"
        }
    );

    cerrarModal();

    cargarPedidos();
}

async function reimprimirTicket(id) {

    const respuesta = await fetch(
        "/api/tickets/" + id + "/reimprimir",
        { method: "POST" }
    );

    const resultado = await respuesta.json();

    if (!resultado.ok || (resultado.ticket && !resultado.ticket.ok)) {
        alert(resultado.error || resultado.ticket?.error || "No fue posible imprimir el ticket.");
        return;
    }

    alert("Ticket enviado a la impresora.");
}

document
.getElementById("modal")
.onclick = e => {

    if (e.target.id === "modal") {

        cerrarModal();
    }
};

setInterval(
    cargarPedidos,
    2000
);

cargarPedidos();
