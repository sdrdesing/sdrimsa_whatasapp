import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { botState, setTenantState, getTenantState } from "./botState.js";
import { setSocket } from "../controllers/messageController.js";
import fs from "fs";

// Caché para reintentos de mensajes (soluciona "Esperando el mensaje")
const msgRetryCounterCacheStore = new Map();
const msgRetryCounterCache = {
    get: (key) => msgRetryCounterCacheStore.get(key),
    set: (key, val) => msgRetryCounterCacheStore.set(key, val),
    del: (key) => msgRetryCounterCacheStore.delete(key),
};

// Control de reconexiones por tenant
const reconnectAttempts = new Map();
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_DELAY = 60000; // 60 seconds

// Almacén de mensajes en memoria por tenant para reintentos (Previene "Esperando mensaje" en iPhone)
const stores = new Map();

function getStore(tenantId) {
    if (!stores.has(tenantId)) {
        const store = makeInMemoryStore({});
        // Opcional: cargar desde archivo si se desea persistencia
        // const storePath = `./session/${tenantId}/store.json`;
        // if (fs.existsSync(storePath)) store.readFromFile(storePath);
        stores.set(tenantId, store);
    }
    return stores.get(tenantId);
}

// Exportar para uso externo
export { getStore };


/**
 * Calcula delay con backoff exponencial
 */
function getReconnectDelay(tenantId) {
    const attempts = reconnectAttempts.get(tenantId) || 0;
    const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempts), MAX_RECONNECT_DELAY);
    // Agregar jitter (±20%) para evitar thundering herd
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
}

/**
 * Inicia una sesión de Baileys para un tenant específico.
 * Compatible con Baileys v7+
 * @param {string} tenantId
 * @param {object} dashboardSocket
 */
export async function startBot(tenantId, dashboardSocket = null) {
    if (!tenantId || tenantId === "default") {
        console.error("❌ No se permite iniciar sesión para el tenant 'default' o tenantId vacío/nulo.");
        return null;
    }
    try {
        console.log(`🔄 Cargando Baileys para tenant: ${tenantId}...`);

        const sessionDir = `./session/${tenantId}`;
        const keysDir = `${sessionDir}/keys`;
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        if (!fs.existsSync(keysDir)) {
            fs.mkdirSync(keysDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        console.log(`✅ Baileys v${version.join(".")} cargado para tenant ${tenantId}`);

        const store = getStore(tenantId);

        const sock = makeWASocket({
            version,
            auth: state,
            msgRetryCounterCache, // Añadido para resolver "Esperando mensaje"
            printQRInTerminal: false,
            markOnlineOnConnect: true,
            defaultQueryTimeoutMs: 60000, // Aumentar timeout para sesiones lentas
            syncFullHistory: false, // No sincronizar todo el historial para evitar lag
            // Función crucial para resolver "Esperando mensaje" en iPhone
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: "Resending message..." }; // Placeholder fallback
            }
        });

        // Vincular el store al socket para que capture mensajes
        store.bind(sock.ev);


        // Registrar socket en el controlador por tenant
        setSocket(tenantId, sock);

        // Guardar referencia en el estado del tenant
        try {
            setTenantState(tenantId, { sock });
        } catch (e) {
            // no crítico
        }

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(`📱 Generando código QR para tenant ${tenantId}...`);
                const start = Date.now();
                try {
                    const dataUrl = await QRCode.toDataURL(qr, botState.qrOptions);
                    console.log(`✅ QR generado en ${Date.now() - start}ms`);
                    setTenantState(tenantId, { qrCode: dataUrl });
                    if (dashboardSocket) {
                        dashboardSocket.emit("qr", { tenantId, qr: dataUrl });
                    }
                } catch (err) {
                    console.error("❌ Error al generar QR:", err);
                }
            }

            if (connection === "connecting") {
                console.log(`🔗 [${tenantId}] Conectando con WhatsApp...`);
                if (dashboardSocket) dashboardSocket.emit("status", { tenantId, status: "connecting" });
            }

            if (connection === "open") {
                console.log(`✅ [${tenantId}] BOT CONECTADO`);
                // Resetear contador de reconexiones al conectar exitosamente
                reconnectAttempts.set(tenantId, 0);

                if (sock.user) {
                    const phoneNumber = sock.user.id.split(":")[0];
                    if (dashboardSocket) dashboardSocket.emit("connected", { tenantId, phoneNumber });
                    setTenantState(tenantId, { botInfo: { phoneNumber } });
                }
                if (dashboardSocket) dashboardSocket.emit("status", { tenantId, status: "connected" });
                setTenantState(tenantId, { isAuthenticated: true, connectionStatus: 'connected' });
            }

            if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== 401;
                console.log(`❌ [${tenantId}] Conexión cerrada (código: ${statusCode || 'desconocido'})`);

                if (dashboardSocket) dashboardSocket.emit("status", { tenantId, status: "disconnected" });
                setTenantState(tenantId, { isAuthenticated: false, connectionStatus: 'disconnected' });

                if (shouldReconnect) {
                    const attempts = (reconnectAttempts.get(tenantId) || 0) + 1;
                    reconnectAttempts.set(tenantId, attempts);

                    if (attempts > MAX_RECONNECT_ATTEMPTS) {
                        console.error(`🚫 [${tenantId}] Máximo de reconexiones alcanzado (${MAX_RECONNECT_ATTEMPTS}). Deteniendo.`);
                        if (dashboardSocket) dashboardSocket.emit("error", {
                            tenantId,
                            message: `Se alcanzó el máximo de ${MAX_RECONNECT_ATTEMPTS} reconexiones. Elimina la sesión y escanea un nuevo QR.`
                        });
                        return;
                    }

                    const delay = getReconnectDelay(tenantId);
                    console.log(`🔄 [${tenantId}] Reintento ${attempts}/${MAX_RECONNECT_ATTEMPTS} en ${(delay / 1000).toFixed(1)}s...`);
                    setTimeout(() => startBot(tenantId, dashboardSocket), delay);
                } else {
                    console.log(`⚠️  [${tenantId}] Sesión eliminada por WhatsApp (401) - Escanea nuevo QR`);
                    reconnectAttempts.set(tenantId, 0);
                    if (dashboardSocket) dashboardSocket.emit("session-deleted", { tenantId });
                }
            }
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("messages.upsert", async (m) => {
            const message = m.messages[0];
            if (!message.key.fromMe && message.message) {
                const tstate = getTenantState(tenantId);
                tstate.messageStats.received++;
                const from = message.key.remoteJid;
                const text = message.message.conversation || message.message.extendedTextMessage?.text || "[Multimedia]";
                console.log(`📨 [${tenantId}] ${from}: ${text}`);
            }
        });

        return sock;

    } catch (error) {
        console.error("❌ Error crítico al iniciar bot:", error);
        const attempts = (reconnectAttempts.get(tenantId) || 0) + 1;
        reconnectAttempts.set(tenantId, attempts);

        if (attempts > MAX_RECONNECT_ATTEMPTS) {
            console.error(`🚫 [${tenantId}] Máximo de reconexiones alcanzado después de error crítico.`);
            return null;
        }

        const delay = getReconnectDelay(tenantId);
        console.log(`🔄 Reintentando en ${(delay / 1000).toFixed(1)}s...`);
        setTimeout(() => startBot(tenantId, dashboardSocket), delay);
    }
}
