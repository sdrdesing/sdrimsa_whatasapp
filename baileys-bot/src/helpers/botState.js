// Estado global y por-tenant
export const botState = {
  // Valores globales (no específicos por tenant)
  botInfo: { startTime: new Date() },
  messageStats: { sent: 0, received: 0 },
  PORT: 3000, // Puerto fijo solicitado por el usuario
  // Opciones compartidas para generar QR
  qrOptions: {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.85,
    margin: 1,
    width: 280
  },
  globalLogs: [],
  MAX_LOGS: 100
};

// Mapa para estados específicos por tenantID
export const tenantStates = new Map();

/**
 * Obtener estado de un tenant, inicializándolo si no existe
 */
export const getTenantState = (tenantId) => {
  if (!tenantId) tenantId = 'default';
  if (!tenantStates.has(tenantId)) {
    tenantStates.set(tenantId, {
      isAuthenticated: false,
      connectionStatus: 'disconnected',
      qrCode: null,
      botInfo: { phoneNumber: null },
      messageStats: { sent: 0, received: 0 },
      sock: null
    });
  }
  return tenantStates.get(tenantId);
};

/**
 * Actualizar estado de un tenant de forma parcial
 */
export const setTenantState = (tenantId, newState) => {
  if (!tenantId) tenantId = 'default';
  const currentState = getTenantState(tenantId);
  tenantStates.set(tenantId, { ...currentState, ...newState });
};

/**
 * Eliminar estado de un tenant
 */
export const deleteTenantState = (tenantId) => {
  if (tenantId) {
    tenantStates.delete(tenantId);
  }
};

export const addGlobalLog = (tenantId, type, number, status, error = null) => {
  const log = {
    id: Date.now() + Math.random(),
    tenantId,
    type,
    number,
    status, // 'sent', 'failed'
    error,
    timestamp: new Date().toISOString()
  };
  botState.globalLogs.unshift(log);
  if (botState.globalLogs.length > botState.MAX_LOGS) {
    botState.globalLogs.pop();
  }
  
  // También actualizar estadísticas globales si fue exitoso
  if (status === 'sent') {
    botState.messageStats.sent++;
  }
  
  return log;
};

export const getGlobalStats = () => {
  let totalSent = 0;
  let totalReceived = 0;
  let activeBots = 0;

  for (const state of tenantStates.values()) {
    totalSent += state.messageStats.sent || 0;
    totalReceived += state.messageStats.received || 0;
    if (state.connectionStatus === 'connected') {
      activeBots++;
    }
  }

  return { totalSent, totalReceived, activeBots };
};
