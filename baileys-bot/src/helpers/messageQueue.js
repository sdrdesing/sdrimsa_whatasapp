/**
 * Sistema de Cola de Mensajes para evitar límites de WhatsApp
 * Implementa un queue que envía mensajes de forma secuencial con delay
 */

import { getTenantState } from "./botState.js";
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
        const queueRef = this.tenants[tenantId].queue;
        const config = this.tenants[tenantId].config;
        const stats = this.tenants[tenantId].stats;
        while (queueRef.length > 0) {
            const item = queueRef[0];
            if (item.waiting) {
                const allWaiting = queueRef.every(q => q.waiting);
                if (allWaiting) {
                    console.log(`⏳ Todos los mensajes de ${tenantId} están esperando reconexión. Esperando 5s antes de reintentar...`);
                    await this.sleep(5000);
                    for (const qItem of queueRef) {
                        if (!qItem.waiting) continue;
                        try {
                            const tId = qItem.data?.tenantId || tenantId;
                            const tstate = getTenantState(tId);
                            if (tstate && tstate.connectionStatus === 'connected') {
                                if (tstate.sock && tstate.sock !== qItem.data.sock) {
                                    console.log(`ℹ️ Socket para ${tId} cambió — actualizando referencia para mensaje ${qItem.id} y limpiando espera`);
                                    qItem.data.sock = tstate.sock;
                                }
                                qItem.waiting = false;
                            }
                        } catch (err) {
                            console.error('Error re-evaluando item en espera:', err?.message || err);
                        }
                    }
                } else {
                    queueRef.shift();
                    queueRef.push(item);
                }
                continue;
            }
            try {
                console.log(`⏳ Procesando mensaje ${item.id} (${item.data.type}) a ${item.data.number || item.data.groupJid} para ${tenantId}`);
                const tenantIdFromData = item.data?.tenantId || tenantId;
                const tenantState = getTenantState(tenantIdFromData);
                if (!tenantState || tenantState.connectionStatus !== 'connected') {
                    console.log(`⚠️ Tenant ${tenantIdFromData} desconectado — marcando mensaje ${item.id} en espera`);
                    item.waiting = true;
                    queueRef.shift();
                    queueRef.push(item);
                    continue;
                }
                if (tenantState.sock && tenantState.sock !== item.data.sock) {
                    console.log(`ℹ️ Socket para ${tenantIdFromData} cambió — actualizando referencia para mensaje ${item.id}`);
                    item.data.sock = tenantState.sock;
                }
                const result = await this.sendMessage(item);
                item.resolve(result);
                if (item.waiting) item.waiting = false;
                queueRef.shift();
                stats.totalSent++;
                stats.currentQueueSize = queueRef.length;
                console.log(`✅ Mensaje enviado exitosamente (${queueRef.length} restantes en cola para ${tenantId})`);
                if (queueRef.length > 0) {
                    const dynamicDelay = this.calculateDynamicDelay(tenantId);
                    console.log(`⏱️ Esperando ${dynamicDelay}ms (${(dynamicDelay/1000).toFixed(1)}s) antes del siguiente mensaje para ${tenantId}...`);
                    this.tenants[tenantId].lastSendTime = Date.now();
                    await this.sleep(dynamicDelay);
                }
            } catch (error) {
                console.error(`❌ Error al enviar mensaje ${item.id}:`, error.message);
                // Manejo especial para errores graves de sesión
                if (error.message && error.message.includes('Bad MAC')) {
                    console.error(`🚨 Sesión ${tenantId} marcada como fallida por error de cifrado (Bad MAC). Deteniendo solo esta cola.`);
                    // Marcar la sesión como fallida y limpiar la cola
                    this.tenants[tenantId].isProcessing = false;
                    this.tenants[tenantId].failed = true;
                    // Opcional: limpiar la cola para evitar reintentos infinitos
                    this.tenants[tenantId].queue = [];
                    break;
                }
                if (item.retries < config.maxRetries) {
                    item.retries++;
                    console.log(`🔄 Reintentando mensaje ${item.id} (intento ${item.retries}/${config.maxRetries})`);
                    queueRef.shift();
                    queueRef.push(item);
                    await this.sleep(config.retryDelay);
                } else {
                    console.log(`💀 Mensaje ${item.id} falló después de ${config.maxRetries} intentos`);
                    item.reject(error);
                    queueRef.shift();
                    stats.totalFailed++;
                    stats.currentQueueSize = queueRef.length;
                }
            }
        }
        console.log(`✨ Cola procesada completamente para ${tenantId}`);
        this.tenants[tenantId].isProcessing = false;
    }

    _ensureTenant(tenantId) {
        if (!this.tenants[tenantId]) {
            this.tenants[tenantId] = {
                queue: [],
                isProcessing: false,
                config: {
                    minDelay: 8000,
                    maxDelay: 20000,
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
                consecutiveMessages: 0
            };
        }
    }

    /**
     * Enviar mensaje según el tipo
     */
    async sendMessage(item) {
        const { sock, data } = item;
        
        switch (data.type) {
            case 'text':
                return await this.sendTextMessage(item);
            
            case 'media':
                return await this.sendMediaMessage(item);
            
            case 'group':
                return await this.sendGroupMessage(item);
            
            default:
                throw new Error(`Tipo de mensaje desconocido: ${data.type}`);
        }
    }

    /**
     * Enviar mensaje de texto
     */
    async sendTextMessage(item) {
        const { data } = item;
        const jid = data.number.includes("@") ? data.number : `${data.number}@c.us`;

        // Verificar que el socket del tenant siga siendo el mismo y esté conectado
        const tId = data?.tenantId || 'default';
        const tstate = getTenantState(tId);
        if (!tstate || tstate.connectionStatus !== 'connected' || tstate.sock !== data.sock) {
            console.log(`⚠️ Socket no conectado o cambiado para tenant ${tId}, abortando envío temporalmente`);
            throw new Error('Connection Closed');
        }

        const response = await data.sock.sendMessage(jid, { text: data.message });

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
        const jid = data.number.includes("@") ? data.number : `${data.number}@c.us`;
        
        let messageContent = {};
        const file = data.file;
        let mimeType = file.mimetype || "";

        // Forzar MIME por extensión si el header es incorrecto
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
        if (
            !mimeType ||
            mimeType === "application/octet-stream" ||
            (forcedMime && mimeType !== forcedMime)
        ) {
            mimeType = forcedMime || mimeType || "application/octet-stream";
        }

        console.log("🧩 sendMediaMessage: tipos detectados", {
            fileName: file.name,
            originalMime: file.mimetype,
            selectedMime: mimeType,
            ext
        });
        
        if (mimeType.startsWith("image/")) {
            messageContent = {
                image: file.data,
                caption: data.caption || "",
                mimetype: mimeType
            };
        } else if (mimeType.startsWith("video/")) {
            messageContent = {
                video: file.data,
                caption: data.caption || "",
                mimetype: mimeType
            };
        } else if (mimeType.startsWith("audio/")) {
            messageContent = {
                audio: file.data,
                mimetype: mimeType
            };
        } else {
            messageContent = {
                document: file.data,
                mimetype: mimeType,
                fileName: file.name,
                caption: data.caption || ""
            };
        }
        
        // Verificar socket activo antes de enviar
        const tId = data?.tenantId || 'default';
        const tstate = getTenantState(tId);
        if (!tstate || tstate.connectionStatus !== 'connected' || tstate.sock !== data.sock) {
            console.log(`⚠️ Socket no conectado o cambiado para tenant ${tId}, abortando envío de media temporalmente`);
            throw new Error('Connection Closed');
        }

        const response = await data.sock.sendMessage(jid, messageContent);
        
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
        const jid = data.groupJid.includes("@") ? data.groupJid : `${data.groupJid}@g.us`;

        // Verificar socket activo antes de enviar a grupo
        const tId = data?.tenantId || 'default';
        const tstate = getTenantState(tId);
        if (!tstate || tstate.connectionStatus !== 'connected' || tstate.sock !== data.sock) {
            console.log(`⚠️ Socket no conectado o cambiado para tenant ${tId}, abortando envío a grupo temporalmente`);
            throw new Error('Connection Closed');
        }

        const response = await data.sock.sendMessage(jid, { text: data.message });

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

    /**
     * Función auxiliar para hacer delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener estadísticas de la cola
     */
    getStats() {
        return {
            ...this.stats,
            isProcessing: this.isProcessing,
            config: this.config
        };
    }

    /**
     * Limpiar cola (cancelar todos los mensajes pendientes)
     */
    clearQueue() {
        const canceledCount = this.queue.length;
        
        // Rechazar todos los mensajes pendientes
        this.queue.forEach(item => {
            item.reject(new Error('Cola cancelada manualmente'));
        });
        
        this.queue = [];
        this.stats.currentQueueSize = 0;
        
        console.log(`🗑️ Cola limpiada (${canceledCount} mensajes cancelados)`);
        
        return { canceled: canceledCount };
    }

    /**
     * Obtener información de la cola actual
     */
    getQueueInfo() {
        const avgDelaySeconds = (this.stats.averageDelay / 1000).toFixed(1);
        const estimatedMinTime = this.queue.length * this.config.minDelay;
        const estimatedMaxTime = this.queue.length * this.config.maxDelay;
        
        return {
            queueSize: this.queue.length,
            isProcessing: this.isProcessing,
            nextMessage: this.queue.length > 0 ? {
                position: 1,
                type: this.queue[0].data.type,
                addedAt: this.queue[0].addedAt,
                retries: this.queue[0].retries
            } : null,
            estimatedWaitTime: {
                min: estimatedMinTime,
                max: estimatedMaxTime,
                minFormatted: `${(estimatedMinTime / 1000 / 60).toFixed(1)} minutos`,
                maxFormatted: `${(estimatedMaxTime / 1000 / 60).toFixed(1)} minutos`
            },
            averageDelay: `${avgDelaySeconds}s`,
            consecutiveMessages: this.consecutiveMessages
        };
    }

    /**
     * Configurar patrón humano (activar/desactivar)
     */
    setHumanPattern(enabled) {
        this.config.humanPattern = enabled;
        console.log(`${enabled ? '✅' : '❌'} Patrón humano ${enabled ? 'activado' : 'desactivado'}`);
    }

    /**
     * Configurar rango de delays con presets
     */
    setDelayPreset(preset) {
        const presets = {
            'rapido': { min: 5000, max: 12000 },      // 5-12s (riesgoso)
            'moderado': { min: 8000, max: 20000 },    // 8-20s (recomendado)
            'seguro': { min: 15000, max: 35000 },     // 15-35s (muy seguro)
            'ultra-seguro': { min: 20000, max: 45000 } // 20-45s (máxima precaución)
        };
        
        if (presets[preset]) {
            this.config.minDelay = presets[preset].min;
            this.config.maxDelay = presets[preset].max;
            console.log(`⚙️ Preset "${preset}" aplicado: ${presets[preset].min}ms - ${presets[preset].max}ms`);
        } else {
            console.log(`❌ Preset desconocido. Opciones: ${Object.keys(presets).join(', ')}`);
        }
    }

    // Importar getTenantState de botState para verificar estado del tenant antes de enviar
}

// Exportar una única instancia (Singleton)
const messageQueue = new MessageQueue();

export default messageQueue;
