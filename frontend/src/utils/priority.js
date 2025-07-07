// frontend/src/utils/priority.js

export const getPriorityInfo = (deadline) => {
  if (!deadline) {
    return null; // Sem prazo, sem prioridade
  }

  const hoje = new Date();
  const prazo = new Date(deadline);

  // Zera as horas para comparar apenas as datas
  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);

  // Calcula a diferença em milissegundos e converte para dias
  const diffTime = prazo.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Atrasado ${Math.abs(diffDays)}d`, color: 'error', days: diffDays };
  }
  if (diffDays >= 0 && diffDays <= 3) {
    return { label: `Crítico (${diffDays}d)`, color: 'error', days: diffDays };
  }
  if (diffDays >= 4 && diffDays <= 7) {
    return { label: `Atenção (${diffDays}d)`, color: 'warning', days: diffDays };
  }
  if (diffDays >= 8 && diffDays <= 15) {
    return { label: `Normal (${diffDays}d)`, color: 'info', days: diffDays };
  }
  if (diffDays >= 16) {
    return { label: `Prazo OK (${diffDays}d)`, color: 'success', days: diffDays };
  }

  return null;
};