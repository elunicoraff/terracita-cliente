const categoriasDiv = document.getElementById("categorias");
const contenidoDiv = document.getElementById("contenido");
const comandaDiv = document.getElementById("comanda");

let comanda = [];

function mostrarCategorias() {
    categoriasDiv.style.display = "grid";
    contenidoDiv.innerHTML = "";
}

function agregarBotonRegresar() {
    const btn = document.createElement("button");

    btn.className = "opcion opcion-regresar";
    btn.textContent = "← REGRESAR A CATEGORÍAS";
    btn.onclick = mostrarCategorias;

    contenidoDiv.appendChild(btn);
}

function textoConPrecio(item) {
    return item.precio === undefined
        ? item.nombre
        : item.nombre + " — $" + item.precio;
}

for (let clave in menu) {

    const btn = document.createElement("button");

    btn.className = "categoria-btn";
    btn.textContent = menu[clave].nombre;
    btn.onclick = () => mostrarCategoria(clave);

    categoriasDiv.appendChild(btn);
}

function mostrarCategoria(categoria) {

    categoriasDiv.style.display = "none";
    contenidoDiv.innerHTML = "";

    const datos = menu[categoria];

    contenidoDiv.innerHTML =
        "<h2>" + datos.nombre + "</h2>";

    datos.productos.forEach(prod => {

        const btn = document.createElement("button");

        btn.className = "opcion";
        btn.textContent = textoConPrecio(prod);

        btn.onclick = () =>
            seleccionarProducto(categoria, prod);

        contenidoDiv.appendChild(btn);

    });

    agregarBotonRegresar();
}

function seleccionarProducto(categoria, producto) {

    producto = {
        ...producto,
        categoria: categoria
    };

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
        btn.textContent = textoConPrecio(cubierta);

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    cubierta.nombre,

                precio:
                    producto.precio +
                    cubierta.precio,

                categoria: producto.categoria

            });

        };

        contenidoDiv.appendChild(btn);
    });

    const btnSinCubierta =
        document.createElement("button");

    btnSinCubierta.className = "opcion";

    btnSinCubierta.textContent =
        "SIN CUBIERTA — $0";

    btnSinCubierta.onclick = () => {

        agregarProducto({

            nombre:
                producto.nombre +
                " / SIN CUBIERTA",

            precio:
                producto.precio,

            categoria: producto.categoria

        });

    };

    contenidoDiv.appendChild(btnSinCubierta);

    agregarBotonRegresar();
}

function mostrarBoneless(producto) {

    contenidoDiv.innerHTML =
        "<h2>SELECCIONA TAMAÑO</h2>";

    producto.variantes.forEach(tam => {

        const btn =
            document.createElement("button");

        btn.className = "opcion";
        btn.textContent = textoConPrecio(tam);

        btn.onclick = () =>
            mostrarSalsaBoneless(producto, tam);

        contenidoDiv.appendChild(btn);
    });

    agregarBotonRegresar();
}

function mostrarSalsaBoneless(
    producto,
    tamano
) {

    contenidoDiv.innerHTML =
        "<h2>SELECCIONA SALSA</h2>";

    const salsas = [
        "BBQ PICANTE",
        "BUFFALO",
        "MANGO HABANERO",
        "NATURALES"
    ];

    salsas.forEach(salsa => {

        const btn =
            document.createElement("button");

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

                precio:
                    tamano.precio,

                categoria: producto.categoria

            });

        };

        contenidoDiv.appendChild(btn);
    });

    agregarBotonRegresar();
}

function mostrarPapas(producto) {

    contenidoDiv.innerHTML =
        "<h2>SELECCIONA TU OPCIÓN</h2>";

    producto.variantes.forEach(variante => {

        const btn =
            document.createElement("button");

        btn.className = "opcion";

        btn.textContent =
            textoConPrecio(variante);

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    variante.nombre,

                precio:
                    variante.precio,

                categoria: producto.categoria

            });

        };

        contenidoDiv.appendChild(btn);
    });

    agregarBotonRegresar();
}

function mostrarKBites(producto) {

    contenidoDiv.innerHTML =
        "<h2>SELECCIONA VARIANTE</h2>";

    producto.variantes.forEach(variante => {

        const btn =
            document.createElement("button");

        btn.className = "opcion";

        btn.textContent =
            textoConPrecio(variante);

        btn.onclick = () =>
            mostrarCubiertasKBites(
                producto,
                variante
            );

        contenidoDiv.appendChild(btn);
    });

    agregarBotonRegresar();
}

function mostrarCubiertasKBites(
    producto,
    variante
) {

    contenidoDiv.innerHTML =
        "<h2>SELECCIONA TU CUBIERTA</h2>";

    menu.banderillas.cubiertas.forEach(
        cubierta => {

            const btn =
                document.createElement("button");

            btn.className = "opcion";

            btn.textContent =
                textoConPrecio(cubierta);

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
                        cubierta.precio,

                    categoria: producto.categoria

                });

            };

            contenidoDiv.appendChild(btn);
        }
    );

    const btnSinCubierta =
        document.createElement("button");

    btnSinCubierta.className = "opcion";

    btnSinCubierta.textContent =
        "SIN CUBIERTA — $0";

    btnSinCubierta.onclick = () => {

        agregarProducto({

            nombre:
                producto.nombre +
                " / " +
                variante.nombre +
                " / SIN CUBIERTA",

            precio: variante.precio,

            categoria: producto.categoria

        });

    };

    contenidoDiv.appendChild(btnSinCubierta);

    agregarBotonRegresar();
}

function mostrarPerlas(producto) {

    contenidoDiv.innerHTML =
        "<h2>PERLAS DE SABOR</h2>";

    const perlas = [
        { nombre: "SIN PERLAS", precio: 0 },
        { nombre: "MORA AZUL", precio: 15 },
        { nombre: "FRESA", precio: 15 },
        { nombre: "LICHEE", precio: 15 },
        { nombre: "MANGO", precio: 15 },
        { nombre: "MANZANA VERDE", precio: 15 }
    ];

    perlas.forEach(perla => {

        const btn =
            document.createElement("button");

        btn.className = "opcion";

        btn.textContent =
            textoConPrecio(perla);

        btn.onclick = () => {

            agregarProducto({

                nombre:
                    producto.nombre +
                    " / " +
                    perla.nombre,

                precio:
                    producto.precio +
                    perla.precio,

                categoria: producto.categoria

            });

        };

        contenidoDiv.appendChild(btn);
    });

    agregarBotonRegresar();
}

function agregarProducto(producto) {

    comanda.push(producto);

    renderComanda();

    contenidoDiv.innerHTML =
        "<h2>✓ PRODUCTO AGREGADO</h2>";

    setTimeout(() => {

        mostrarCategorias();

    }, 450);
}

function renderComanda() {

    let html = "";
    let total = 0;

    comanda.forEach(item => {

        html += `
            <div class="producto-comanda">
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

const btnContinuar =
document.getElementById("btnContinuar");

btnTerminar.onclick = () => {

    if (comanda.length === 0) {

        alert("AGREGA AL MENOS UN PRODUCTO");
        return;
    }

    pasoFinal.style.display = "block";

    btnTerminar.style.display = "none";

    if (btnContinuar) {

        btnContinuar.style.display =
            "inline-block";
    }
};

if (btnContinuar) {

    btnContinuar.onclick = () => {

        pasoFinal.style.display = "none";

        btnTerminar.style.display =
            "inline-block";

        btnContinuar.style.display =
            "none";

        mostrarCategorias();
    };
}

document.getElementById(
    "btnCancelar"
).onclick = () => {

    comanda = [];

    document.getElementById(
        "nombreCliente"
    ).value = "";

    mostrarCategorias();

    pasoFinal.style.display = "none";

    btnTerminar.style.display =
        "inline-block";

    if (btnContinuar) {

        btnContinuar.style.display =
            "none";
    }

    renderComanda();
};

renderComanda();

document.getElementById(
    "btnEnviar"
).onclick = async () => {

    const nombre =
        document.getElementById(
            "nombreCliente"
        )
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

                body:
                    JSON.stringify(pedido)

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

        mostrarCategorias();

        pasoFinal.style.display = "none";

        btnTerminar.style.display =
            "inline-block";

        if (btnContinuar) {

            btnContinuar.style.display =
                "none";
        }

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
