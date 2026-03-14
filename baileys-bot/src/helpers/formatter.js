/**
 * Formatea un número de teléfono al formato correcto de WhatsApp (Baileys v7+)
 * @param {string} number - Número de teléfono a formatear
 * @returns {string} - Número formateado con @s.whatsapp.net
 */
export const phoneNumberFormatter = (number) => {
    // Eliminar todos los caracteres no numéricos
    let formatted = number.replace(/\D/g, "");

    // Si el número comienza con 0, quitarlo (formato local)
    if (formatted.startsWith("0")) {
        formatted = formatted.substring(1);
    }

    // Baileys v7+ usa @s.whatsapp.net para contactos individuales
    if (!formatted.includes("@")) {
        formatted = `${formatted}@s.whatsapp.net`;
    }

    return formatted;
};

/**
 * Formatea un JID de grupo
 * @param {string} groupId - ID del grupo
 * @returns {string} - JID formateado para grupos (@g.us)
 */
export const groupJidFormatter = (groupId) => {
    let formatted = groupId.replace(/\D/g, "");

    if (!formatted.includes("@")) {
        formatted = `${formatted}@g.us`;
    }

    return formatted;
};
