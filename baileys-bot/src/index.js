
import express from "express";
import multer from "multer";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import { startBot } from "./helpers/startBot.js"
import { botState, getTenantState, deleteTenantState, getGlobalStats } from "./helpers/botState.js";
import http from "http";
import { Server as IOServer } from "socket.io";
import fs from "fs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
    setSocket, 
    sendNormalMessage, 
    sendMedia, 
    sendToGroup, 
    getChats, 
    showChats, 
    sendFileToChat, 
    sendToChat,
    getQueueStats,
    setQueueDelay,
    setQueuePreset,
    setHumanPattern,
    clearQueue,
    deleteSession,
    getSocketForTenant,
    attachDashboardToTenant,
    sendMediaToGroup,
    getGroups
} from "./controllers/messageController.js";

const upload = multer({ dest: "uploads/" });
const app = express();
app.use(fileUpload());
app.use(express.json());
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "ui")));
function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// ============================================================
// ENDPOINT - ESTADO DE LA CONEXIÓN
// ============================================================
app.get("/status", (req, res) => {
    try {
        const tenantId = req.query?.tenantId;
        const startTime = botState.botInfo?.startTime || new Date();
        const uptime = Math.floor((new Date() - startTime) / 1000);
        const uptimeFormatted = formatUptime(uptime);

        if (tenantId) {
            const tstate = getTenantState(tenantId);
            return res.json({
                tenantId,
                authenticated: tstate?.isAuthenticated || false,
                connectionStatus: tstate?.connectionStatus || 'disconnected',
                uptime: uptime,
                uptimeFormatted: uptimeFormatted,
                messageStats: tstate?.messageStats || { sent: 0, received: 0 },
                phoneNumber: tstate?.botInfo?.phoneNumber || null,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            authenticated: false,
            connectionStatus: 'unknown',
            uptime: uptime,
            uptimeFormatted: uptimeFormatted,
            messageStats: botState.messageStats,
            phoneNumber: null,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("🔥 Error en endpoint /status:", err);
        res.status(500).json({ error: "Internal Error", message: err.message });
    }
});



// ============================================================
// ENDPOINT - ESTADO GLOBAL (Para Dashboard Admin)
// ============================================================
app.get("/global-status", (req, res) => {
    try {
        const startTime = botState.botInfo?.startTime || new Date();
        const uptime = Math.floor((new Date() - startTime) / 1000);
        const uptimeFormatted = formatUptime(uptime);
        
        const { totalSent, totalReceived, activeBots } = getGlobalStats();
        
        res.json({
            uptime,
            uptimeFormatted,
            totalSent,
            totalReceived,
            activeBots,
            logs: botState.globalLogs,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("🔥 Error en endpoint /global-status:", err);
        res.status(500).json({ error: "Internal Error", message: err.message });
    }
});

// Enviar mensaje normal (texto)
app.post("/api/send-messages", sendNormalMessage);

// Enviar archivo/media
app.post("/api/send-medias", sendMedia);

// Enviar mensaje a grupo por JID
app.post("/api/send-group", sendToGroup);

// Enviar archivo/media a grupo por JID
app.post("/api/send-group-media", sendMediaToGroup);


// Obtener lista de chats
app.get("/api/chats", getChats);

// Mostrar chats con nombres
app.get("/api/show-chats", showChats);

// Obtener lista de grupos con JID
app.get("/api/groups", getGroups);

// Enviar archivo a chat por nombre
app.post("/api/send-file-chat", sendFileToChat);

// Enviar mensaje a chat por nombre
app.post("/api/send-to-chat", sendToChat);

app.get("/api/queue/stats", getQueueStats);

// Configurar delay entre mensajes (en milisegundos) - LEGACY
app.post("/api/queue/set-delay", setQueueDelay);

// Configurar preset de delay dinámico (NUEVO - RECOMENDADO)
app.post("/api/queue/set-preset", setQueuePreset);

// Activar/desactivar patrón humano (NUEVO)
app.post("/api/queue/set-human-pattern", setHumanPattern);

// Limpiar cola de mensajes pendientes
app.post("/api/queue/clear", clearQueue);

app.post("/api/session/delete", deleteSession);

const PORT = botState.PORT;
const server = http.createServer(app);
const io = new IOServer(server, { 
    cors: { origin: "*" },
    transports: ["websocket", "polling"]
});

io.on("connection", (socket) => {
    console.log("🔌 Dashboard client connected", socket.id);
    socket.on("start-session", ({ tenantId }) => {
        if (!tenantId) tenantId = "default";
        console.log(`🔰 start-session request for tenant: ${tenantId} from socket ${socket.id}`);
        const existing = getSocketForTenant(tenantId);
        if (existing) {
            console.log(`🔁 Ya existe sesión para ${tenantId}, adjuntando dashboard socket ${socket.id}`);
            attachDashboardToTenant(tenantId, socket);
        } else {
            startBot(tenantId, socket);
        }
    });
    socket.on("join", ({ tenantId }) => {
        if (!tenantId) tenantId = "default";
        socket.join(tenantId);
    });

    socket.on("disconnect", () => {
        console.log("🔌 Dashboard client disconnected", socket.id);
    });
});

server.listen(PORT, () => {
    console.log("");
    console.log("╔════════════════════════════════════════╗");
    console.log("║  🌐 SERVIDOR EXPRESS INICIADO         ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Dashboard disponible`);
    console.log(`📡 API REST lista`);
    console.log(`ℹ️  Bot se iniciará cuando un tenant lo solicite via Socket.IO, o automáticamente al inicio.`);
    console.log("");
    
    // Auto-start existing sessions on server boot
    try {
        const sessionPath = path.join(process.cwd(), "session");
        if (fs.existsSync(sessionPath)) {
            const tenants = fs.readdirSync(sessionPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            if (tenants.length > 0) {
                console.log(`🔄 Encontradas ${tenants.length} sesiones existentes. Iniciando auto-conexión...`);
                tenants.forEach((tenantId, index) => {
                    setTimeout(() => {
                        console.log(`🔰 Auto-iniciando sesión para tenant: ${tenantId}`);
                        startBot(tenantId, null);
                    }, index * 2000); // 2 segundos de separación para no saturar al inicio
                });
            }
        }
    } catch (error) {
        console.error("❌ Error al auto-iniciar sesiones:", error);
    }
});
