import fs from "fs";
import getMessageQueue from "../helpers/messageQueue.js";

// Mapa de sockets por tenant
const socks = new Map();

export const setSocket = (tenantId, socket) => {
    if (!tenantId) tenantId = "default";
    socks.set(tenantId, socket);
};

const getTenantIdFromReq = (req) => {
    return req.headers?.["x-tenant-id"] || req.query?.tenantId || req.body?.tenantId || "default";
};

const getSockForTenant = (tenantId) => socks.get(tenantId) || null;

export const getSocketForTenant = (tenantId) => getSockForTenant(tenantId);

import { getTenantState, deleteTenantState } from "../helpers/botState.js";

/**
 * Eliminar sesión de un tenant: cerrar socket si existe, borrar carpeta de session
 * y limpiar estado del tenant.
 */
export const deleteSession = async (req, res) => {
    try {
        const tenantId = getTenantIdFromReq(req);

        console.log(`🗑️ Solicitud para eliminar sesión del tenant: ${tenantId}`);

        if (!/^[\w-]+$/.test(tenantId)) {
            return res.status(400).json({ status: false, message: 'tenantId inválido' });
        }

        const sock = getSockForTenant(tenantId);

        if (sock) {
            try {
                if (typeof sock.logout === 'function') {
                    await sock.logout();
                } else if (typeof sock.close === 'function') {
                    sock.close();
                } else if (typeof sock.end === 'function') {
                    sock.end();
                }
            } catch (err) {
                console.error(`Error cerrando socket para ${tenantId}:`, err?.message || err);
            }
            socks.delete(tenantId);
        }

        const sessionPath = `./session/${tenantId}`;
        try {
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
            }
        } catch (err) {
            console.error(`Error borrando carpeta de sesión ${sessionPath}:`, err?.message || err);
            return res.status(500).json({ status: false, message: 'Error borrando archivos de sesión', error: err?.message || err });
        }

        try {
            deleteTenantState(tenantId);
        } catch (err) {
            console.error(`Error limpiando estado de tenant ${tenantId}:`, err?.message || err);
        }

        console.log(`🗑️ Sesión ${tenantId} eliminada correctamente`);
        return res.status(200).json({ status: true, message: `Sesión ${tenantId} eliminada` });

    } catch (error) {
        console.error('Error en deleteSession:', error);
        return res.status(500).json({ status: false, message: error?.message || error });
    }
};

export const attachDashboardToTenant = (tenantId, dashboardSocket) => {
    if (!tenantId) tenantId = 'default';
    const sock = getSockForTenant(tenantId);
    try {
        const tenantState = getTenantState(tenantId);
        if (tenantState?.qrCode) {
            dashboardSocket.emit('qr', { tenantId, qr: tenantState.qrCode });
        }
        dashboardSocket.emit('status', { tenantId, status: tenantState?.connectionStatus || 'unknown' });
        if (tenantState?.isAuthenticated) {
            dashboardSocket.emit('connected', { tenantId, phoneNumber: tenantState?.botInfo?.phoneNumber || null });
        }
    } catch (err) {
        console.error('Error emitting attachDashboard events:', err);
    }
    return sock || null;
};

// ============================================================
// OBTENER GRUPOS (CHATS)
// ============================================================
export const getChats = async (req, res) => {
    try {
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) {
            return res.status(422).json({ status: false, message: "Bot no está conectado" });
        }
        return res.status(200).json({
            status: true,
            message: "Para obtener chats, debes implementar @whiskeysockets/baileys/store",
            response: []
        });
    } catch (error) {
        console.error("Error en getChats:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

// ============================================================
// ENVIAR MENSAJE NORMAL (TEXTO) - CON COLA
// ============================================================
export const sendNormalMessage = async (req, res) => {
    try {
        const { number, message } = req.body;
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) {
            return res.status(422).json({ status: false, message: "Bot no está conectado" });
        }
        if (!number || !message) {
            return res.status(400).json({ status: false, message: "Faltan parámetros: number, message" });
        }

        const messageQueue = getMessageQueue(tenantId);
        const promise = messageQueue.addToQueue({ type: 'text', sock, tenantId, number, message });
        console.log(`✅ Mensaje agregado a la cola para ${number} (tenant: ${tenantId})`);

        promise.then(result => {
            console.log(`🔔 Mensaje procesado (background):`, result?.data || result);
        }).catch(err => {
            console.error(`❌ Error procesando mensaje en la cola (background):`, err?.message || err);
        });

        return res.status(200).json({
            status: true,
            message: "Mensaje agregado a la cola de envío",
            queueInfo: messageQueue.getQueueInfo(tenantId)
        });
    } catch (error) {
        console.error("Error en sendNormalMessage:", error);
        return res.status(500).json({ status: false, message: error.message, response: error });
    }
};

// ============================================================
// ENVIAR ARCHIVO/MEDIA - CON COLA
// ============================================================
export const sendMedia = async (req, res) => {
    try {
        const { number, caption } = req.body;
        const file = req.files?.file;
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) return res.status(422).json({ status: false, message: "Bot no está conectado" });
        if (!number || !file) {
            return res.status(400).json({ status: false, message: "Faltan parámetros: number, file" });
        }

        const messageQueue = getMessageQueue(tenantId);
        const promise = messageQueue.addToQueue({ type: 'media', sock, tenantId, number, file, caption: caption || "" });
        console.log(`✅ Archivo agregado a la cola para ${number} (tenant: ${tenantId}): ${file.name}`);

        promise.then(result => {
            console.log(`🔔 Archivo procesado (background):`, result?.data || result);
        }).catch(err => {
            console.error(`❌ Error procesando archivo en la cola (background):`, err?.message || err);
        });

        return res.status(200).json({
            status: true,
            message: "Archivo agregado a la cola de envío",
            queueInfo: messageQueue.getQueueInfo(tenantId)
        });
    } catch (error) {
        console.error("Error en sendMedia:", error);
        return res.status(500).json({ status: false, message: error.message, response: error });
    }
};

// ============================================================
// MOSTRAR LISTA DE CHATS
// ============================================================
export const showChats = async (req, res) => {
    try {
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) return res.status(422).json({ status: false, message: "Bot no está conectado" });
        return res.status(200).json({
            status: true,
            message: "Implementa makeInMemoryStore de Baileys para acceder a chats",
            response: []
        });
    } catch (error) {
        console.error("Error en showChats:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

// ============================================================
// ENVIAR ARCHIVO A UN CHAT/GRUPO POR NOMBRE
// ============================================================
export const sendFileToChat = async (req, res) => {
    try {
        const { chatName } = req.body;
        const file = req.files?.file;
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) return res.status(422).json({ status: false, message: "Bot no está conectado" });
        if (!chatName || !file) {
            return res.status(400).json({ status: false, message: "Faltan parámetros: chatName, file" });
        }
        return res.status(501).json({ status: false, message: "Implementa makeInMemoryStore de Baileys para buscar chats por nombre" });
    } catch (error) {
        console.error("Error en sendFileToChat:", error);
        return res.status(500).json({ status: false, message: error.message, response: error });
    }
};

// ============================================================
// ENVIAR MENSAJE A UN CHAT/GRUPO POR NOMBRE
// ============================================================
export const sendToChat = async (req, res) => {
    try {
        const { chatName, message } = req.body;
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) return res.status(422).json({ status: false, message: "Bot no está conectado" });
        if (!chatName || !message) {
            return res.status(400).json({ status: false, message: "Faltan parámetros: chatName, message" });
        }
        return res.status(501).json({ status: false, message: "Implementa makeInMemoryStore de Baileys para buscar chats por nombre" });
    } catch (error) {
        console.error("Error en sendToChat:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

// ============================================================
// ENVIAR MENSAJE A GRUPO POR JID DIRECTO - CON COLA
// ============================================================
export const sendToGroup = async (req, res) => {
    try {
        const { groupJid, message } = req.body;
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) return res.status(422).json({ status: false, message: "Bot no está conectado" });
        if (!groupJid || !message) {
            return res.status(400).json({ status: false, message: "Faltan parámetros: groupJid, message" });
        }

        const messageQueue = getMessageQueue(tenantId);
        const promise = messageQueue.addToQueue({ type: 'group', sock, tenantId, groupJid, message });
        console.log(`✅ Mensaje agregado a la cola para grupo ${groupJid} (tenant: ${tenantId})`);

        promise.then(result => {
            console.log(`🔔 Mensaje de grupo procesado (background):`, result?.data || result);
        }).catch(err => {
            console.error(`❌ Error procesando mensaje de grupo en la cola (background):`, err?.message || err);
        });

        return res.status(200).json({
            status: true,
            message: "Mensaje agregado a la cola de envío",
            queueInfo: messageQueue.getQueueInfo(tenantId)
        });
    } catch (error) {
        console.error("Error en sendToGroup:", error);
        return res.status(500).json({ status: false, message: error.message, response: error });
    }
};

// ============================================================
// ENVIAR ARCHIVO/VIDEO A GRUPO POR JID DIRECTO - CON COLA
// ============================================================
export const sendMediaToGroup = async (req, res) => {
    try {
        const { groupJid, caption } = req.body;
        const file = req.files?.file;
        const tenantId = getTenantIdFromReq(req);
        const sock = getSockForTenant(tenantId);
        if (!sock) return res.status(422).json({ status: false, message: "Bot no está conectado" });
        if (!groupJid || !file) {
            return res.status(400).json({ status: false, message: "Faltan parámetros: groupJid, file" });
        }

        const messageQueue = getMessageQueue(tenantId);
        // Usamos el tipo 'media' pero pasando el groupJid como 'number' ya que messageQueue.formatJid lo manejará
        const promise = messageQueue.addToQueue({ 
            type: 'media', 
            sock, 
            tenantId, 
            number: groupJid, 
            file, 
            caption: caption || "" 
        });
        console.log(`✅ Archivo de grupo agregado a la cola para ${groupJid} (tenant: ${tenantId}): ${file.name}`);

        promise.then(result => {
            console.log(`🔔 Archivo de grupo procesado (background):`, result?.data || result);
        }).catch(err => {
            console.error(`❌ Error procesando archivo de grupo en la cola (background):`, err?.message || err);
        });

        return res.status(200).json({
            status: true,
            message: "Archivo agregado a la cola de envío (Grupo)",
            queueInfo: messageQueue.getQueueInfo(tenantId)
        });
    } catch (error) {
        console.error("Error en sendMediaToGroup:", error);
        return res.status(500).json({ status: false, message: error.message, response: error });
    }
};

// ============================================================
// GESTIÓN DE COLA
// ============================================================

export const getQueueStats = async (req, res) => {
    try {
        const tenantId = getTenantIdFromReq(req);
        const messageQueue = getMessageQueue(tenantId);
        const stats = messageQueue.getStats(tenantId);
        const info = messageQueue.getQueueInfo(tenantId);
        return res.status(200).json({ status: true, stats, queueInfo: info });
    } catch (error) {
        console.error("Error en getQueueStats:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

export const setQueueDelay = async (req, res) => {
    try {
        const { delay } = req.body;
        const tenantId = getTenantIdFromReq(req);
        if (!delay || delay < 1000) {
            return res.status(400).json({ status: false, message: "El delay debe ser al menos 1000ms (1 segundo)" });
        }
        const messageQueue = getMessageQueue(tenantId);
        messageQueue.setDelay(delay, delay * 2, tenantId);
        return res.status(200).json({
            status: true,
            message: `Delay dinámico configurado: ${delay}ms - ${delay * 2}ms`,
            config: messageQueue.getStats(tenantId).config
        });
    } catch (error) {
        console.error("Error en setQueueDelay:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

export const setQueuePreset = async (req, res) => {
    try {
        const { preset } = req.body;
        const tenantId = getTenantIdFromReq(req);
        if (!preset) {
            return res.status(400).json({ status: false, message: "Debe proporcionar un preset: rapido, moderado, seguro, ultra-seguro" });
        }
        const messageQueue = getMessageQueue(tenantId);
        messageQueue.setDelayPreset(preset, tenantId);
        return res.status(200).json({
            status: true,
            message: `Preset "${preset}" aplicado exitosamente`,
            config: messageQueue.getStats(tenantId).config
        });
    } catch (error) {
        console.error("Error en setQueuePreset:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

export const setHumanPattern = async (req, res) => {
    try {
        const { enabled } = req.body;
        const tenantId = getTenantIdFromReq(req);
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ status: false, message: "Debe proporcionar enabled: true o false" });
        }
        const messageQueue = getMessageQueue(tenantId);
        messageQueue.setHumanPattern(enabled, tenantId);
        return res.status(200).json({
            status: true,
            message: `Patrón humano ${enabled ? 'activado' : 'desactivado'}`,
            config: messageQueue.getStats(tenantId).config
        });
    } catch (error) {
        console.error("Error en setHumanPattern:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

export const clearQueue = async (req, res) => {
    try {
        const tenantId = getTenantIdFromReq(req);
        const messageQueue = getMessageQueue(tenantId);
        const result = messageQueue.clearQueue(tenantId);
        return res.status(200).json({ status: true, message: "Cola limpiada exitosamente", canceled: result.canceled });
    } catch (error) {
        console.error("Error en clearQueue:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};
