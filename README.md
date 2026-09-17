# La Terracita de los Antojos

Restauración local basada en `terracita-cliente-main.zip`.

## Funcionalidad recuperada

- Menú para clientes con categorías, variantes y complementos.
- Envío de órdenes con nombre del cliente.
- Mostrador administrativo: cobro, cancelación y entrega.
- Historial y resumen de ventas.
- Almacenamiento local persistente de pedidos en `data/pedidos.json`.
- API puente protegida mediante la variable opcional `BRIDGE_TOKEN`.

## Cómo queda conectado

- **Render** publica únicamente el menú y conserva cada pedido sólo de forma temporal en memoria.
- **La computadora del mostrador** conserva el panel de cobro y la impresora. Consulta Render cada 6 segundos, descarga los pedidos nuevos, los guarda en su archivo local y confirma la recepción para borrar la copia temporal de Render.
- El enlace se protege con `BRIDGE_TOKEN`. Usa exactamente el mismo valor en Render y en el archivo local `.env`; nunca lo subas a GitHub.

## Ejecución local

1. Instala Node.js LTS si aún no está instalado.
2. Abre una terminal en esta carpeta y ejecuta `npm install` (o `pnpm install`).
3. Ejecuta `npm start`, `pnpm start` o `node server.js`.
4. Abre `http://localhost:3000` para clientes y `http://localhost:3000/admin/` para el mostrador.

Los pedidos se conservan al cerrar y volver a iniciar el servidor.

## Despliegue en Render

1. Sube el contenido de esta carpeta al repositorio `elunicoraff/terracita-cliente`.
2. En Render, crea un servicio desde ese repositorio. El archivo `render.yaml` prepara el servicio público y el secreto de sincronización; no usa una base de datos ni un disco en la nube.
3. Al terminar, copia la URL HTTPS del servicio.
4. En la computadora del mostrador, crea un archivo `.env` copiando `.env.example`. Escribe la URL de Render y copia el valor de `BRIDGE_TOKEN` desde las variables del servicio en Render.
5. Reinicia el sistema local. El menú público estará en Render; abre `http://localhost:3000/admin/` únicamente en la computadora del mostrador.

No uses el panel `/admin/` en Render: en producción queda desactivado para que el historial de ventas no sea público.

> Importante: como Render sólo funciona como buzón temporal, un pedido que aún no haya llegado al mostrador puede perderse si el servicio se reinicia. El intervalo corto de sincronización (6 segundos) reduce ese riesgo. No cierres ni reinicies el sistema local durante la operación.

## Ticket al cobrar

Al cobrar desde el panel de mostrador, el sistema imprime automáticamente un ticket de 58 mm en la impresora de Windows llamada `POS 58 2`. El ticket incluye número de orden, cliente, productos y total; no incluye fecha, hora, datos de pago ni nombre del negocio.

La impresora debe estar encendida, con papel y configurada en Windows para papel de 58 mm. Si su nombre cambia, inicia el servidor con la variable `TICKET_PRINTER` usando el nombre que aparezca en Windows.
