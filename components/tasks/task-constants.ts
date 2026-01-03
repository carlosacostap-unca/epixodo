export const TASK_STATUSES = [
  { id: 'pending', label: 'Pendiente', color: 'gray', icon: 'Circle' },
  { id: 'waiting_response', label: 'En espera de respuesta', color: 'orange', icon: 'Clock' },
  { id: 'blocked', label: 'Bloqueada', color: 'red', icon: 'Ban' },
  { id: 'completed', label: 'Completada', color: 'green', icon: 'CheckCircle2' },
] as const;

export type TaskStatus = typeof TASK_STATUSES[number]['id'];

export const getTaskStatusInfo = (status: string) => {
  return TASK_STATUSES.find(s => s.id === status) || TASK_STATUSES[0];
};
