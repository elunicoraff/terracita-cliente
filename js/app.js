const categoriasDiv = document.getElementById("categorias");
const contenidoDiv = document.getElementById("contenido");
const comandaDiv = document.getElementById("comanda");

let comanda = [];

for (let clave in menu) {

    const btn = document.createElement("button");

    btn.className = "categoria-btn";

    btn.textContent = menu[clave].nombre;

    btn.onclick = () => mostrarCategoria(clave);

    categoriasDiv.appendChild(btn);

}

function mostrarCategoria(categoria) {

    contenidoDiv.innerHTML = "";

    const datos = menu[categoria];

    datos.productos.forEach(prod => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = prod.nombre;

        btn.onclick = () => seleccionarProducto(categoria, prod);

        contenidoDiv.appendChild(btn);

    });

}

function seleccionarProducto(categoria, producto) {

    if (categoria === "banderillas") {

        if (producto.nombre === "LA ITALIANA") {

            agregarProducto(producto);

            return;

        }

        mostrarCubiertas(producto);

        return;

    }

    if (categoria === "snacks") {

        if (producto.nombre === "BONELESS") {

            mostrarBoneless(producto);

            return;

        }

        if (producto.nombre === "K BITES") {

            mostrarKBites(producto);

            return;

        }

        if (producto.nombre === "PAPAS A LA FRANCESA") {

            mostrarPapas(producto);

            return;

        }

        agregarProducto(producto);

        return;

    }

    if (categoria === "sodas") {

        mostrarPerlas(producto);

        return;

    }

    agregarProducto(producto);

}

function mostrarCubiertas(producto) {

    contenidoDiv.innerHTML =
        "<h2>SELECCIONA TU CUBIERTA</h2>";

    menu.banderillas.cubiertas.forEach(cubierta => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = cubierta.nombre;

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    cubierta.nombre,

                precio:
                    producto.precio +
                    cubierta.precio

            });

        };

        contenidoDiv.appendChild(btn);

    });

    const btnSinCubierta =
        document.createElement("button");

    btnSinCubierta.className = "opcion";

    btnSinCubierta.textContent =
        "SIN CUBIERTA";

    btnSinCubierta.onclick = () => {

        agregarProducto({

            nombre:
                producto.nombre +
                " / SIN CUBIERTA",

            precio:
                producto.precio

        });

    };

    contenidoDiv.appendChild(
        btnSinCubierta
    );

}

function mostrarBoneless(producto) {

    contenidoDiv.innerHTML = "<h2>SELECCIONA TAMAÑO</h2>";

    producto.variantes.forEach(tam => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = tam.nombre;

        btn.onclick = () =>
            mostrarSalsaBoneless(producto, tam);

        contenidoDiv.appendChild(btn);

    });

}

function mostrarPapas(producto) {

    contenidoDiv.innerHTML =
        "<h2>SELECCIONA TU OPCIÓN</h2>";

    producto.variantes.forEach(variante => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = variante.nombre;

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    variante.nombre,

                precio:
                    variante.precio

            });

        };

        contenidoDiv.appendChild(btn);

    });

}

function mostrarSalsaBoneless(producto, tamano) {

    contenidoDiv.innerHTML = "<h2>SELECCIONA SALSA</h2>";

    const salsas = [
        "BBQ PICANTE",
        "BUFFALO",
        "MANGO HABANERO",
        "NATURALES"
    ];

    salsas.forEach(salsa => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = salsa;

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    tamano.nombre +
                    " / " +
                    salsa,

                precio: tamano.precio

            });

        };

        contenidoDiv.appendChild(btn);

    });

}

function mostrarKBites(producto) {

    contenidoDiv.innerHTML = "<h2>SELECCIONA VARIANTE</h2>";

    producto.variantes.forEach(variante => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = variante.nombre;

        btn.onclick = () =>
            mostrarCubiertasKBites(producto, variante);

        contenidoDiv.appendChild(btn);

    });

}

function mostrarCubiertasKBites(producto, variante) {

    contenidoDiv.innerHTML = "<h2>SELECCIONA TU CUBIERTA</h2>";

    menu.banderillas.cubiertas.forEach(cubierta => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = cubierta.nombre;

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    variante.nombre +
                    " / " +
                    cubierta.nombre,

                precio:
                    variante.precio +
                    cubierta.precio

            });

        };

        contenidoDiv.appendChild(btn);

    });

}

function mostrarPerlas(producto) {

    contenidoDiv.innerHTML = "<h2>PERLAS DE SABOR</h2>";

    const perlas = [
        { nombre: "SIN PERLAS", precio: 0 },
        { nombre: "MORA AZUL", precio: 15 },
        { nombre: "FRESA", precio: 15 },
        { nombre: "LICHEE", precio: 15 },
        { nombre: "MANGO", precio: 15 },
        { nombre: "MANZANA VERDE", precio: 15 }
    ];

    perlas.forEach(perla => {

        const btn = document.createElement("button");

        btn.className = "opcion";

        btn.textContent = perla.nombre;

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    perla.nombre,

                precio:
                    producto.precio +
                    perla.precio

            });

        };

        contenidoDiv.appendChild(btn);

    });

}

function agregarProducto(producto) {

    comanda.push(producto);

    renderComanda();

    contenidoDiv.innerHTML =
        "<h2>✓ PRODUCTO AGREGADO</h2>";

}

function renderComanda() {

    let html = "";

    let total = 0;

    comanda.forEach(item => {

        html += `
            <div>
                ${item.nombre} - $${item.precio}
            </div>
        `;

        total += Number(item.precio || 0);

    });

    if (comanda.length === 0) {

        html = `
            <div>
                No hay productos en la orden
            </div>
        `;

    }

    html += `<h3>TOTAL: $${total}</h3>`;

    comandaDiv.innerHTML = html;

}

const btnTerminar =
document.getElementById("btnTerminar");

const pasoFinal =
document.getElementById("pasoFinal");

btnTerminar.onclick = () => {

    if (comanda.length === 0) {

        alert("AGREGA AL MENOS UN PRODUCTO");

        return;

    }

    pasoFinal.style.display = "block";

    btnTerminar.style.display = "none";

};

document.getElementById("btnCancelar").onclick = () => {

    comanda = [];

    document.getElementById("nombreCliente").value = "";

    contenidoDiv.innerHTML = "";

    pasoFinal.style.display = "none";

    btnTerminar.style.display = "inline-block";

    renderComanda();

};

renderComanda();

document.getElementById("btnEnviar").onclick = async () => {

    const nombre =
        document.getElementById("nombreCliente")
        .value
        .trim()
        .toUpperCase();

    if (nombre === "") {

        alert("Escribe tu nombre");

        return;

    }

    if (comanda.length === 0) {

        alert("No hay productos en la orden");

        return;

    }

    let total = 0;

    comanda.forEach(item => {

        total += Number(item.precio || 0);

    });

    const pedido = {
        cliente: nombre,
        productos: comanda,
        total: total
    };

    try {

        const respuesta =
            await fetch("/api/pedido", {

                method: "POST",

                headers: {
                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify(pedido)

            });

        await respuesta.json();

        alert(
            "Orden enviada.\n\nPase a pagar al mostrador."
        );

        comanda = [];

        document.getElementById(
            "nombreCliente"
        ).value = "";

        renderComanda();

        contenidoDiv.innerHTML = "";

        pasoFinal.style.display = "none";

        btnTerminar.style.display = "inline-block";

    } catch (error) {

        alert(
            "No fue posible enviar la orden."
        );

        console.error(error);

    }

};

const campoNombre =
document.getElementById("nombreCliente");

if (campoNombre) {

    campoNombre.addEventListener(
        "input",
        function () {

            this.value =
                this.value.toUpperCase();

        }
    );

}