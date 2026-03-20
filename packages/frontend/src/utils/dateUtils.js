// packages/frontend/src/utils/dateUtils.js

/**
 * Valida se o restaurante está aberto com base na hora atual do sistema.
 * @param {Array} operatingHours - Array de horários do restaurante
 */
export const isStoreOpen = (operatingHours) => {
  if (!operatingHours || operatingHours.length === 0) return false;

  const now = new Date();
  const day = now.getDay(); // 0-6 (Domingo-Sábado)
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todaySchedule = operatingHours.find(h => h.day === day);
  
  // Se não houver horário cadastrado ou estiver marcado como fechado
  if (!todaySchedule || !todaySchedule.open) return false;

  const [openH, openM] = todaySchedule.start.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.end.split(':').map(Number);
  
  const openTotalMinutes = openH * 60 + openM;
  const closeTotalMinutes = closeH * 60 + closeM;

  return currentTime >= openTotalMinutes && currentTime <= closeTotalMinutes;
};