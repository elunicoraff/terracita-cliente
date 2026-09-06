let pedidosGlobal = [];



async function cargarPedidos() {

    const r = await fetch("/api/pedidos");

    console.log("PEDIDOS:", pedidosGlobal);

    pedidosGlobal = await r.json();

    renderPanel();
}

function esHoy(fechaPedido){

    const hoy = new Date();

    const fecha = new Date(fechaPedido);

    return (
        fecha.getDate() === hoy.getDate() &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
    );

}


function renderPanel() {

    const contenedor =
        document.getElementById("pedidos");

    contenedor.innerHTML = "";



let pedidosMostrar = pedidosGlobal.filter(p => {

    const coincideFecha = true;

    const coincideEstado =
    mostrarTodas
        ? true
        : (
            p.estado === "PENDIENTE" ||
            p.estado === "PAGADA"
        );

    return coincideFecha && coincideEstado;

});

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
                        onclick="cobrar(${pedido.id})"
                    >
                        COBRAR
                    </button>

                    <button
                        class="btnCancelar"
                        onclick="cancelar(${pedido.id})"
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
                class="btnEntregada"
                onclick="entregar(${pedido.id})"
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

async function cobrar(id) {

    await fetch(
        "/api/cobrar/" + id,
        {
            method: "POST"
        }
    );

    cerrarModal();

    cargarPedidos();
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

document
.getElementById("btnDia")
.onclick = () => {

    mostrarTodas = false;

    renderPanel();
};

document
.getElementById("btnTodas")
.onclick = () => {

    mostrarTodas = true;

    renderPanel();
};

document
.getElementById("btnHistorial")
.onclick = () => {

    window.location.href =
        "/admin/historial.html";

};

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

