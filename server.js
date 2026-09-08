const crypto = require("crypto");
const express = require("express");
const path = require("path");

const app = express();
const pedidosPendientes = new Map();
const bridgeToken = process.env.BRIDGE_TOKEN || "";

app.use(express.json({ limit: "64kb" }));
app.use(express.static(__dirname));

function esPuenteAutorizado(req) {
    return bridgeToken !== "" &&
        req.get("X-Bridge-Token") === bridgeToken;
}

function validarPedido(datos) {
    if (!datos || typeof datos !== "object") return null;

    const cliente = String(datos.cliente || "").trim().toUpperCase();
    const productos = Array.isArray(datos.productos) ? datos.productos : [];
    const total = Number(datos.total || 0);

    if (!cliente || productos.length === 0 || !Number.isFinite(total)) {
        return null;
    }

    return { cliente, productos, total };
}

app.post("/api/pedido", (req, res) => {
    const pedido = validarPedido(req.body);

    if (!pedido) {
        return res.status(400).json({ ok: false, error: "Pedido incompleto" });
    }

    const id = crypto.randomUUID();
    pedidosPendientes.set(id, { id, pedido });

    res.status(202).json({ ok: true });
});

app.get("/api/bridge/pedidos", (req, res) => {
    if (!esPuenteAutorizado(req)) {
        return res.status(401).json({ ok: false });
    }

    res.json(Array.from(pedidosPendientes.values()));
});

app.post("/api/bridge/pedidos/:id/confirmar", (req, res) => {
    if (!esPuenteAutorizado(req)) {
        return res.status(401).json({ ok: false });
    }

    pedidosPendientes.delete(req.params.id);
    res.json({ ok: true });
});

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Cliente HTTPS listo en puerto", port);
});
