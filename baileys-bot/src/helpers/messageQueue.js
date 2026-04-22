/**
 * Sistema de Cola de Mensajes para evitar límites de WhatsApp
 * Implementa un queue que envía mensajes de forma secuencial con delay
 * Compatible con Baileys v7+ (@s.whatsapp.net para JIDs)
 */

import { getTenantState, addGlobalLog } from "./botState.js";
import path from "path";

class MessageQueue {
    constructor() {
        // Estructura: { [tenantId]: { queue, isProcessing, config, stats, lastSendTime, consecutiveMessages } }
        this.tenants = {};
    }

    /**
     * Configurar delays personalizados
     */
    setDelay(minMs, maxMs, tenantId = 'default') {
        this._ensureTenant(tenantId);
        this.tenants[tenantId].config.minDelay = minMs;
        this.tenants[tenantId].config.maxDelay = maxMs || minMs * 2;
        console.log(`⚙️ Delay dinámico configurado para ${tenantId}: ${minMs}ms - ${this.tenants[tenantId].config.maxDelay}ms`);
    }

    /**
     * Calcular delay dinámico con patrón humano
     */
    calculateDynamicDelay(tenantId = 'default') {
        this._ensureTenant(tenantId);
        const { minDelay, maxDelay, humanPattern } = this.tenants[tenantId].config;
        let delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        if (humanPattern) {
            this.tenants[tenantId].consecutiveMessages++;
            if (this.tenants[tenantId].consecutiveMessages >= Math.floor(Math.random() * 3) + 5) {
                const longPause = Math.floor(Math.random() * 15000) + 25000;
                console.log(`🧑 Pausa humana extendida para ${tenantId}: ${longPause}ms`);
                this.tenants[tenantId].consecutiveMessages = 0;
                return longPause;
            }
            const microVariation = Math.floor(Math.random() * 4000) - 2000;
            delay += microVariation;
        }
        delay = Math.max(delay, minDelay);
        this.updateAverageDelay(delay, tenantId);
        return delay;
    }

    /**
     * Actualizar promedio de delay para estadísticas
     */
    updateAverageDelay(currentDelay, tenantId = 'default') {
        this._ensureTenant(tenantId);
        const stats = this.tenants[tenantId].stats;
        if (stats.totalSent === 0) {
            stats.averageDelay = currentDelay;
        } else {
            stats.averageDelay = Math.floor(
                (stats.averageDelay * stats.totalSent + currentDelay) /
                (stats.totalSent + 1)
            );
        }
    }

    /**
     * Agregar mensaje a la cola
     */
    async addToQueue(messageData) {
        return new Promise((resolve, reject) => {
            const tenantId = messageData.tenantId || 'default';
            this._ensureTenant(tenantId);
            const queueItem = {
                id: Date.now() + Math.random(),
                data: messageData,
                retries: 0,
                addedAt: new Date(),
                resolve,
                reject
            };
            this.tenants[tenantId].queue.push(queueItem);
            this.tenants[tenantId].stats.totalQueued++;
            this.tenants[tenantId].stats.currentQueueSize = this.tenants[tenantId].queue.length;
            console.log(`📥 Mensaje agregado a la cola (tenant: ${tenantId}, posición: ${this.tenants[tenantId].queue.length})`);
            if (!this.tenants[tenantId].isProcessing) {
                this.processQueue(tenantId);
            }
        });
    }

    /**
     * Procesar la cola de mensajes de forma secuencial
     */
    async processQueue(tenantId = 'default') {
        this._ensureTenant(tenantId);
        if (this.tenants[tenantId].isProcessing) {
            return;
        }
        this.tenants[tenantId].isProcessing = true;
        const tenant = this.tenants[tenantId];

        while (tenant.queue.length > 0) {
            const item = tenant.queue[0];
            try {
                console.log(`⏳ Procesando mensaje ${item.id} (${item.data.type}) a ${item.data.number || item.data.groupJid} para ${tenantId}`);

                // Verificar estado del tenant
                const tenantIdFromData = item.data?.tenantId || tenantId;
                const tenantState = getTenantState(tenantIdFromData);
                if (!tenantState || tenantState.connectionStatus !== 'connected') {
                    console.log(`⚠️ Tenant ${tenantIdFromData} desconectado — mensaje ${item.id} marcado como fallido`);
                    const error = 'El bot está desconectado o la sesión no es válida';
                    addGlobalLog(tenantIdFromData, item.data.type, item.data.number || item.data.groupJid, 'failed', error, item.data.message || item.data.caption || item.data.type);
                    item.reject({
                        status: false,
                        error: 'Tenant desconectado',
                        message: error,
                        queueId: item.id,
                        number: item.data.number || null,
                        groupJid: item.data.groupJid || null,
                        type: item.data.type
                    });
                    tenant.queue.shift();
                    tenant.stats.totalFailed++;
                    tenant.stats.currentQueueSize = tenant.queue.length;
                    continue;
                }

                // Actualizar referencia al socket si cambió (reconexión)
                if (tenantState.sock && tenantState.sock !== item.data.sock) {
                    console.log(`ℹ️ Socket para ${tenantIdFromData} cambió — actualizando referencia`);
                    item.data.sock = tenantState.sock;
                }

                const result = await this.sendMessage(item);
                addGlobalLog(tenantIdFromData, item.data.type, item.data.number || item.data.groupJid, 'sent', null, item.data.message || item.data.caption || item.data.type);
                item.resolve(result);
                tenant.queue.shift();
                tenant.stats.totalSent++;
                tenant.stats.currentQueueSize = tenant.queue.length;
                // Resetear contador de errores consecutivos al enviar bien
                tenant.consecutiveErrors = 0;
                console.log(`✅ Mensaje enviado exitosamente (${tenant.queue.length} restantes en cola para ${tenantId})`);

                if (tenant.queue.length > 0) {
                    const dynamicDelay = this.calculateDynamicDelay(tenantId);
                    console.log(`⏱️ Esperando ${dynamicDelay}ms antes del siguiente mensaje para ${tenantId}...`);
                    tenant.lastSendTime = Date.now();
                    await this.sleep(dynamicDelay);
                }
            } catch (error) {
                const errorMsg = typeof error === 'string' ? error : (error?.message || String(error));
                const isCriticalSession = /PreKey|Invalid PreKey|Bad MAC|SessionError/i.test(errorMsg);
                const isConnectionError = /Connection Closed|timed out|ECONNRESET|ECONNREFUSED/i.test(errorMsg);
                const isRetryable = isConnectionError || /received error in ack/i.test(errorMsg);

                console.error(`❌ Error al enviar mensaje ${item.id} (intento ${item.retries + 1}):`, errorMsg);

                // Reintento para errores temporales
                if (isRetryable && item.retries < tenant.config.maxRetries) {
                    item.retries++;
                    const retryDelay = tenant.config.retryDelay * Math.pow(2, item.retries - 1);
                    console.log(`🔄 Reintento ${item.retries}/${tenant.config.maxRetries} en ${retryDelay}ms para mensaje ${item.id}`);
                    await this.sleep(retryDelay);
                    continue; // Reintentar el mismo mensaje
                }

                addGlobalLog(tenantIdFromData, item.data.type, item.data.number || item.data.groupJid, 'failed', errorMsg, item.data.message || item.data.caption || item.data.type);
                // Fallido definitivamente
                item.reject({
                    status: false,
                    error: isCriticalSession ? 'session' : (isConnectionError ? 'connection' : 'unknown'),
                    message: errorMsg,
                    queueId: item.id,
                    number: item.data.number || null,
                    groupJid: item.data.groupJid || null,
                    type: item.data.type
                });
                tenant.queue.shift();
                tenant.stats.totalFailed++;
                tenant.stats.currentQueueSize = tenant.queue.length;

                // Solo borrar sesión después de 3 errores críticos seguidos
                if (isCriticalSession) {
                    tenant.consecutiveErrors = (tenant.consecutiveErrors || 0) + 1;
                    console.warn(`⚠️ Error crítico de sesión #${tenant.consecutiveErrors} para tenant ${tenantId}`);

                    if (tenant.consecutiveErrors >= 3) {
                        console.warn(`🗑️ Demasiados errores de sesión (${tenant.consecutiveErrors}). Eliminando sesión de ${tenantId}...`);
                        try {
                            const { deleteSession } = await import('../controllers/messageController.js');
                            const fakeReq = { headers: { 'x-tenant-id': tenantId }, query: {}, body: {} };
                            const fakeRes = { status: () => ({ json: () => { } }) };
                            await deleteSession(fakeReq, fakeRes);
                        } catch (delErr) {
                            console.error(`Error borrando sesión de ${tenantId}:`, delErr?.message || delErr);
                        }
                        tenant.consecutiveErrors = 0;
                        break;
                    }
                }
            }
        }
        console.log(`✨ Cola procesada completamente para ${tenantId}`);
        tenant.isProcessing = false;
    }

    _ensureTenant(tenantId) {
        if (!this.tenants[tenantId]) {
            this.tenants[tenantId] = {
                queue: [],
                isProcessing: false,
                config: {
                    minDelay: 2000,
                    maxDelay: 5000,
                    randomVariation: true,
                    humanPattern: true,
                    maxRetries: 3,
                    retryDelay: 3000
                },
                stats: {
                    totalQueued: 0,
                    totalSent: 0,
                    totalFailed: 0,
                    currentQueueSize: 0,
                    averageDelay: 0
                },
                lastSendTime: null,
                consecutiveMessages: 0,
                consecutiveErrors: 0
            };
        }
    }

    /**
     * Formatear JID para Baileys v7+
     * Contactos individuales: @s.whatsapp.net
     * Grupos: @g.us
     */
    formatJid(number, isGroup = false) {
        if (number.includes("@")) return number;
        return isGroup ? `${number}@g.us` : `${number}@s.whatsapp.net`;
    }

    /**
     * Enviar mensaje según el tipo
     */
    async sendMessage(item) {
        switch (item.data.type) {
            case 'text':
                return await this.sendTextMessage(item);
            case 'media':
                return await this.sendMediaMessage(item);
            case 'group':
                return await this.sendGroupMessage(item);
            default:
                throw new Error(`Tipo de mensaje desconocido: ${item.data.type}`);
        }
    }

    /**
     * Enviar mensaje de texto
     */
    async sendTextMessage(item) {
        const { data } = item;
        const jid = this.formatJid(data.number, false);

        const tId = data?.tenantId || 'default';
        const tstate = getTenantState(tId);
        if (!tstate || tstate.connectionStatus !== 'connected') {
            throw new Error('Connection Closed');
        }
        const sock = tstate.sock || data.sock;
        if (!sock) {
            throw new Error('Connection Closed');
        }

        // Verificar si el número está en WhatsApp antes de enviar
        const [resultOnWhatsApp] = await sock.onWhatsApp(jid);
        if (!resultOnWhatsApp?.exists) {
            throw new Error('El número no está registrado en WhatsApp');
        }

        const response = await sock.sendMessage(jid, { text: data.message });
        tstate.messageStats.sent++;

        return {
            status: true,
            response: response,
            data: {
                number: data.number,
                messageLength: data.message.length,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Enviar mensaje con archivo/media
     */
    async sendMediaMessage(item) {
        const { data } = item;
        const jid = this.formatJid(data.number, false);

        let messageContent = {};
        const file = data.file;
        let mimeType = file.mimetype || "";

        const ext = (path.extname(file.name || "").toLowerCase() || "").replace(".", "");
        const mimeByExt = {
            pdf: "application/pdf",
            xml: "application/xml",
            txt: "text/plain",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            mp4: "video/mp4",
            mp3: "audio/mpeg",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            zip: "application/zip"
        };

        const forcedMime = mimeByExt[ext] || "";
        if (!mimeType || mimeType === "application/octet-stream" || (forcedMime && mimeType !== forcedMime)) {
            mimeType = forcedMime || mimeType || "application/octet-stream";
        }

        console.log("🧩 sendMediaMessage: tipos detectados", {
            fileName: file.name, originalMime: file.mimetype, selectedMime: mimeType, ext
        });

        if (mimeType.startsWith("image/")) {
            messageContent = { image: file.data, caption: data.caption || "", mimetype: mimeType };
        } else if (mimeType.startsWith("video/")) {
            messageContent = { video: file.data, caption: data.caption || "", mimetype: mimeType };
        } else if (mimeType.startsWith("audio/")) {
            messageContent = { audio: file.data, mimetype: mimeType };
        } else {
            messageContent = { document: file.data, mimetype: mimeType, fileName: file.name, caption: data.caption || "" };
        }

        const tId = data?.tenantId || 'default';
        const tstate = getTenantState(tId);
        if (!tstate || tstate.connectionStatus !== 'connected') {
            throw new Error('Connection Closed');
        }
        const sock = tstate.sock || data.sock;
        if (!sock) {
            throw new Error('Connection Closed');
        }

        // Verificar si el número está en WhatsApp antes de enviar (Saltar en grupos)
        if (!jid.endsWith('@g.us')) {
            const [resultOnWhatsApp] = await sock.onWhatsApp(jid);
            if (!resultOnWhatsApp?.exists) {
                throw new Error('El número no está registrado en WhatsApp');
            }
        }


        const response = await sock.sendMessage(jid, messageContent);
        tstate.messageStats.sent++;
        return {
            status: true,
            response: response,
            data: {
                number: data.number,
                fileName: file.name,
                fileSize: file.size,
                fileType: mimeType,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Enviar mensaje a grupo
     */
    async sendGroupMessage(item) {
        const { data } = item;
        const jid = this.formatJid(data.groupJid, true);

        const tId = data?.tenantId || 'default';
        const tstate = getTenantState(tId);
        if (!tstate || tstate.connectionStatus !== 'connected') {
            throw new Error('Connection Closed');
        }
        const sock = tstate.sock || data.sock;
        if (!sock) {
            throw new Error('Connection Closed');
        }

        const response = await sock.sendMessage(jid, { text: data.message });
        tstate.messageStats.sent++;

        return {
            status: true,
            response: response,
            data: {
                groupJid: jid,
                messageLength: data.message.length,
                timestamp: new Date().toISOString()
            }
        };
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener estadísticas de la cola (per-tenant)
     */
    getStats(tenantId = 'default') {
        this._ensureTenant(tenantId);
        const tenant = this.tenants[tenantId];
        return {
            ...tenant.stats,
            isProcessing: tenant.isProcessing,
            config: tenant.config
        };
    }

    /**
     * Limpiar cola (per-tenant)
     */
    clearQueue(tenantId = 'default') {
        this._ensureTenant(tenantId);
        const tenant = this.tenants[tenantId];
        const canceledCount = tenant.queue.length;

        tenant.queue.forEach(item => {
            item.reject(new Error('Cola cancelada manualmente'));
        });

        tenant.queue = [];
        tenant.stats.currentQueueSize = 0;

        console.log(`🗑️ Cola limpiada para ${tenantId} (${canceledCount} mensajes cancelados)`);
        return { canceled: canceledCount };
    }

    /**
     * Obtener información de la cola actual (per-tenant)
     */
    getQueueInfo(tenantId = 'default') {
        this._ensureTenant(tenantId);
        const tenant = this.tenants[tenantId];
        let avgDelaySeconds = 0;
        if (tenant.stats && typeof tenant.stats.averageDelay !== 'undefined') {
            avgDelaySeconds = (tenant.stats.averageDelay / 1000).toFixed(1);
        }
        const estimatedMinTime = tenant.queue.length * (tenant.config?.minDelay || 0);
        const estimatedMaxTime = tenant.queue.length * (tenant.config?.maxDelay || 0);

        return {
            queueSize: tenant.queue.length,
            isProcessing: tenant.isProcessing,
            nextMessage: tenant.queue.length > 0 ? {
                position: 1,
                type: tenant.queue[0].data.type,
                addedAt: tenant.queue[0].addedAt,
                retries: tenant.queue[0].retries
            } : null,
            estimatedWaitTime: {
                min: estimatedMinTime,
                max: estimatedMaxTime,
                minFormatted: `${(estimatedMinTime / 1000 / 60).toFixed(1)} minutos`,
                maxFormatted: `${(estimatedMaxTime / 1000 / 60).toFixed(1)} minutos`
            },
            averageDelay: `${avgDelaySeconds}s`,
            consecutiveMessages: tenant.consecutiveMessages
        };
    }

    /**
     * Configurar patrón humano (per-tenant)
     */
    setHumanPattern(enabled, tenantId = 'default') {
        this._ensureTenant(tenantId);
        this.tenants[tenantId].config.humanPattern = enabled;
        console.log(`${enabled ? '✅' : '❌'} Patrón humano ${enabled ? 'activado' : 'desactivado'} para ${tenantId}`);
    }

    /**
     * Configurar rango de delays con presets (per-tenant)
     */
    setDelayPreset(preset, tenantId = 'default') {
        this._ensureTenant(tenantId);
        const presets = {
            'rapido': { min: 500, max: 1500 },
            'moderado': { min: 1000, max: 2500 },
            'seguro': { min: 2000, max: 4000 },
            'ultra-seguro': { min: 4000, max: 8000 }
        };

        if (presets[preset]) {
            this.tenants[tenantId].config.minDelay = presets[preset].min;
            this.tenants[tenantId].config.maxDelay = presets[preset].max;
            console.log(`⚙️ Preset "${preset}" aplicado para ${tenantId}: ${presets[preset].min}ms - ${presets[preset].max}ms`);
        } else {
            console.log(`❌ Preset desconocido. Opciones: ${Object.keys(presets).join(', ')}`);
        }
    }
}

// Singleton — una única instancia gestiona todos los tenants internamente
const messageQueue = new MessageQueue();

function getMessageQueue(_tenantId = 'default') {
    return messageQueue;
}

export default getMessageQueue;
