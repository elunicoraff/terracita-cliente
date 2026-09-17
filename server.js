const crypto = require("crypto");
const { spawn } = require("child_process");
const express = require("express");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const app = express();
const dataPath = path.join(process.env.DATA_DIR || path.join(__dirname, "data"), "pedidos.json");
const ticketScriptPath = path.join(__dirname, "sistema", "imprimir-ticket.ps1");
const ticketPrinter = process.env.TICKET_PRINTER || "POS-58 2";
const bridgeToken = process.env.BRIDGE_TOKEN || "";
const remoteApiUrl = String(process.env.REMOTE_API_URL || "").replace(/\/$/, "");
const pollingMs = Math.max(3000, Number(process.env.REMOTE_POLLING_MS) || 6000);
const soloPedidosPublicos = process.env.PUBLIC_ORDERING_ONLY === "true";
const pedidosPendientesPuente = new Map();
let state = { nextOrderNumber: 1, pedidos: [] };
let writeQueue = Promise.resolve();
let ultimaSincronizacion = null;
let sincronizacionEnCurso = false;

app.use(express.json({ limit: "64kb" }));
app.use(express.static(__dirname));

function fechaHoraLocal() {
    const now = new Date();
    const options = { timeZone: process.env.TZ || "America/Mexico_City" };
    return {
        fecha: new Intl.DateTimeFormat("en-CA", options).format(now),
        hora: new Intl.DateTimeFormat("es-MX", { ...options, hour: "2-digit", minute: "2-digit", hour12: false }).format(now),
        creadoEn: now.toISOString()
    };
}

function cargarDatos() {
    try {
        const parsed = JSON.parse(fs.readFileSync(dataPath, "utf8"));
        if (Array.isArray(parsed)) state.pedidos = parsed;
        else if (parsed && Array.isArray(parsed.pedidos)) state = parsed;
        const ultimo = state.pedidos.reduce((max, pedido) => Math.max(max, Number(pedido.numeroOrden) || 0), 0);
        state.nextOrderNumber = Math.max(Number(state.nextOrderNumber) || 1, ultimo + 1);
    } catch (error) {
        if (error.code !== "ENOENT") console.error("No fue posible leer pedidos:", error);
    }
}

function guardarDatos() {
    const snapshot = JSON.stringify(state, null, 2) + "\n";
    writeQueue = writeQueue.then(async () => {
        await fsp.mkdir(path.dirname(dataPath), { recursive: true });
        const temporal = `${dataPath}.tmp`;
        await fsp.writeFile(temporal, snapshot, "utf8");
        await fsp.rename(temporal, dataPath);
    });
    return writeQueue;
}

function esPuenteAutorizado(req) {
    return bridgeToken !== "" && req.get("X-Bridge-Token") === bridgeToken;
}

function requiereMostrador(req, res, next) {
    if (soloPedidosPublicos) return res.status(404).json({ ok: false });
    next();
}

function validarPedido(datos) {
    if (!datos || typeof datos !== "object") return null;
    const cliente = String(datos.cliente || "").trim().toUpperCase().slice(0, 80);
    const productos = Array.isArray(datos.productos) ? datos.productos : [];
    const total = Number(datos.total);
    if (!cliente || productos.length === 0 || !Number.isFinite(total) || total < 0) return null;
    const productosLimpios = productos.map((producto) => ({
        nombre: String(producto?.nombre || "").trim().slice(0, 160),
        precio: Number(producto?.precio),
        categoria: ["sodas", "banderillas"].includes(String(producto?.categoria || "").trim().toLowerCase())
            ? String(producto.categoria).trim().toLowerCase()
            : ""
    }));
    if (productosLimpios.some((producto) => !producto.nombre || !Number.isFinite(producto.precio))) return null;
    const totalCalculado = productosLimpios.reduce((suma, producto) => suma + producto.precio, 0);
    return Math.abs(totalCalculado - total) <= 0.01 ? { cliente, productos: productosLimpios, total: totalCalculado } : null;
}

function buscarPedido(id) {
    return state.pedidos.find((pedido) => pedido.id === id);
}

function separarTexto(texto, ancho) {
    const palabras = String(texto || "").replace(/\s+/g, " ").trim().split(" ");
    const lineas = [];
    let linea = "";
    for (const palabra of palabras) {
        if (!linea) linea = palabra;
        else if (`${linea} ${palabra}`.length <= ancho) linea += ` ${palabra}`;
        else {
            lineas.push(linea);
            linea = palabra;
        }
    }
    if (linea) lineas.push(linea);
    return lineas;
}

function nombreParaTicket(producto) {
    const esBanderilla = producto.categoria === "banderillas" ||
        /^LA (CLASICA|ANTOJADIZA|CHEESE MONSTER|ITALIANA)\b/.test(producto.nombre);
    return esBanderilla ? producto.nombre.replace(/^LA\s+/, "") : producto.nombre;
}

function crearTicket(pedido, productos = pedido.productos, esTicketSodas = false) {
    const ancho = 16;
    const total = productos.reduce((suma, producto) => suma + Number(producto.precio || 0), 0);
    const dinero = (importe) => `$${Number(importe).toFixed(2)}`;
    const lineas = [
        esTicketSodas ? `SODAS #${pedido.numeroOrden}` : `ORDEN #${pedido.numeroOrden}`,
        `CLIENTE: ${pedido.cliente}`,
        "-".repeat(ancho)
    ];

    for (const producto of productos) {
        const nombre = separarTexto(nombreParaTicket(producto), ancho);
        if (esTicketSodas) {
            lineas.push(...nombre);
            continue;
        }
        const precio = dinero(producto.precio);
        lineas.push(...nombre.slice(0, -1));
        const ultimaLinea = nombre.at(-1) || "";
        lineas.push(`${ultimaLinea.slice(0, ancho - precio.length).padEnd(ancho - precio.length)}${precio}`);
    }

    if (!esTicketSodas) {
        lineas.push("-".repeat(ancho));
        lineas.push(`TOTAL${dinero(total).padStart(ancho - 5)}`);
    }
    return { printerName: ticketPrinter, lines: lineas };
}

function enviarTicket(ticket) {
    const ticketBase64 = Buffer.from(JSON.stringify(ticket), "utf8").toString("base64");
    return new Promise((resolve, reject) => {
        const proceso = spawn("powershell.exe", [
            "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
            "-File", ticketScriptPath, "-TicketBase64", ticketBase64
        ], { windowsHide: true });
        let error = "";
        proceso.stderr.on("data", (datos) => { error += datos.toString(); });
        proceso.on("error", reject);
        proceso.on("close", (codigo) => {
            if (codigo === 0) resolve();
            else reject(new Error(error.trim() || `La impresión terminó con código ${codigo}`));
        });
    });
}

async function imprimirTicket(pedido) {
    await enviarTicket(crearTicket(pedido));
    const sodas = pedido.productos.filter((producto) => producto.categoria === "sodas");
    if (sodas.length > 0) await enviarTicket(crearTicket(pedido, sodas, true));
}

cargarDatos();

app.post("/api/pedido", async (req, res, next) => {
    try {
        const pedido = validarPedido(req.body);
        if (!pedido) return res.status(400).json({ ok: false, error: "Pedido incompleto o inválido" });
        const registro = {
            id: crypto.randomUUID(), ...pedido, estado: "PENDIENTE", numeroOrden: null,
            ...fechaHoraLocal()
        };
        pedidosPendientesPuente.set(registro.id, registro);
        // En Render el pedido vive sólo en el buzón temporal. El mostrador lo
        // guarda localmente después de descargarlo desde /api/bridge/pedidos.
        if (!soloPedidosPublicos) {
            state.pedidos.push(registro);
            await guardarDatos();
        }
        res.status(201).json({ ok: true, id: registro.id });
    } catch (error) { next(error); }
});

app.get("/api/pedidos", requiereMostrador, (_req, res) => res.json([...state.pedidos]));

app.post("/api/cobrar/:id", requiereMostrador, async (req, res, next) => {
    try {
        const pedido = buscarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ ok: false, error: "Pedido no encontrado" });
        if (pedido.estado !== "PENDIENTE") return res.status(409).json({ ok: false, error: "El pedido ya fue procesado" });
        pedido.estado = "PAGADA";
        pedido.numeroOrden = state.nextOrderNumber++;
        pedido.pagadoEn = new Date().toISOString();
        pedido.ticket = { estado: "PENDIENTE" };
        await guardarDatos();
        try {
            await imprimirTicket(pedido);
            pedido.ticket = { estado: "IMPRESO", impresoEn: new Date().toISOString() };
            await guardarDatos();
            res.json({ ok: true, pedido, ticket: { ok: true } });
        } catch (error) {
            pedido.ticket = { estado: "ERROR", error: error.message.slice(0, 300) };
            await guardarDatos();
            console.error("No fue posible imprimir el ticket:", error);
            res.status(201).json({ ok: true, pedido, ticket: { ok: false, error: "El pago se guardó, pero no fue posible imprimir el ticket." } });
        }
    } catch (error) { next(error); }
});

app.post("/api/tickets/:id/reimprimir", requiereMostrador, async (req, res, next) => {
    try {
        const pedido = buscarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ ok: false, error: "Pedido no encontrado" });
        if (pedido.estado !== "PAGADA" && pedido.estado !== "ENTREGADA") {
            return res.status(409).json({ ok: false, error: "Solo se puede reimprimir un pedido cobrado" });
        }
        try {
            await imprimirTicket(pedido);
            pedido.ticket = { estado: "IMPRESO", reimpresoEn: new Date().toISOString() };
            await guardarDatos();
            res.json({ ok: true, ticket: { ok: true } });
        } catch (error) {
            pedido.ticket = { estado: "ERROR", error: error.message.slice(0, 300) };
            await guardarDatos();
            console.error("No fue posible reimprimir el ticket:", error);
            res.status(201).json({ ok: true, ticket: { ok: false, error: "No fue posible imprimir el ticket." } });
        }
    } catch (error) { next(error); }
});

app.post("/api/cancelar/:id", requiereMostrador, async (req, res, next) => {
    try {
        const pedido = buscarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ ok: false, error: "Pedido no encontrado" });
        if (pedido.estado !== "PENDIENTE") return res.status(409).json({ ok: false, error: "Solo se pueden cancelar pedidos pendientes" });
        pedido.estado = "CANCELADO";
        pedido.canceladoEn = new Date().toISOString();
        await guardarDatos();
        res.json({ ok: true, pedido });
    } catch (error) { next(error); }
});

app.post("/api/entregar/:id", requiereMostrador, async (req, res, next) => {
    try {
        const pedido = buscarPedido(req.params.id);
        if (!pedido) return res.status(404).json({ ok: false, error: "Pedido no encontrado" });
        if (pedido.estado !== "PAGADA") return res.status(409).json({ ok: false, error: "Solo se pueden entregar pedidos pagados" });
        pedido.estado = "ENTREGADA";
        pedido.entregadoEn = new Date().toISOString();
        await guardarDatos();
        res.json({ ok: true, pedido });
    } catch (error) { next(error); }
});

app.get("/api/bridge/pedidos", (req, res) => {
    if (!esPuenteAutorizado(req)) return res.status(401).json({ ok: false });
    res.json(Array.from(pedidosPendientesPuente.values()));
});

app.post("/api/bridge/pedidos/:id/confirmar", (req, res) => {
    if (!esPuenteAutorizado(req)) return res.status(401).json({ ok: false });
    pedidosPendientesPuente.delete(req.params.id);
    res.json({ ok: true });
});

async function sincronizarPedidosRemotos() {
    if (!remoteApiUrl || !bridgeToken || sincronizacionEnCurso) return;
    sincronizacionEnCurso = true;
    try {
        const respuesta = await fetch(`${remoteApiUrl}/api/bridge/pedidos`, {
            headers: { "X-Bridge-Token": bridgeToken }, signal: AbortSignal.timeout(10000)
        });
        if (!respuesta.ok) throw new Error(`El servidor remoto respondió ${respuesta.status}`);
        const pedidos = await respuesta.json();
        if (!Array.isArray(pedidos)) throw new Error("El servidor remoto envió una respuesta inesperada");
        for (const remoto of pedidos) {
            if (!remoto?.id || state.pedidos.some((pedido) => pedido.origenRemotoId === remoto.id)) continue;
            const pedido = validarPedido(remoto);
            if (!pedido) continue;
            const registro = {
                id: crypto.randomUUID(), ...pedido, estado: "PENDIENTE", numeroOrden: null,
                origenRemotoId: remoto.id, origenRemotoCreadoEn: remoto.creadoEn || null, ...fechaHoraLocal()
            };
            state.pedidos.push(registro);
            await guardarDatos();
            const confirmar = await fetch(`${remoteApiUrl}/api/bridge/pedidos/${encodeURIComponent(remoto.id)}/confirmar`, {
                method: "POST", headers: { "X-Bridge-Token": bridgeToken }, signal: AbortSignal.timeout(10000)
            });
            if (!confirmar.ok) throw new Error(`No se pudo confirmar el pedido remoto (${confirmar.status})`);
        }
        ultimaSincronizacion = { ok: true, en: new Date().toISOString() };
    } catch (error) {
        ultimaSincronizacion = { ok: false, en: new Date().toISOString(), error: error.message };
        console.error("No fue posible sincronizar pedidos remotos:", error.message);
    } finally { sincronizacionEnCurso = false; }
}

app.get("/health", (_req, res) => res.json({ ok: true, pedidos: state.pedidos.length, modo: soloPedidosPublicos ? "publico" : "mostrador", sincronizacion: ultimaSincronizacion }));
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ ok: false, error: "No fue posible guardar el pedido" }); });
app.use("/admin", (req, res, next) => soloPedidosPublicos ? res.status(404).end() : next());
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`La Terracita lista en puerto ${port}`));
if (remoteApiUrl) {
    if (!bridgeToken) console.warn("REMOTE_API_URL está configurada pero falta BRIDGE_TOKEN; la sincronización no iniciará.");
    else {
        sincronizarPedidosRemotos();
        setInterval(sincronizarPedidosRemotos, pollingMs).unref();
    }
}
