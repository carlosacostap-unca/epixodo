export const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'UTC';

/**
 * Formatea una fecha ISO (UTC) a la zona horaria configurada.
 * Ejemplo: "30/12/2025"
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Convierte una fecha ISO (UTC) al formato YYYY-MM-DD en la zona horaria configurada,
 * para usar en inputs tipo date.
 */
export function toInputDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  
  // Obtenemos las partes en la zona horaria destino
  const parts = new Intl.DateTimeFormat('en-CA', { // en-CA usa YYYY-MM-DD
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Toma una fecha YYYY-MM-DD (del input) y devuelve un ISO string UTC
 * que representa las 00:00:00 de ese día en la zona horaria configurada.
 */
export function fromInputDateToUTC(dateString: string): string {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Algoritmo robusto para encontrar el instante UTC que corresponde a las 00:00:00 en la zona horaria destino.
  // Usamos 00:00:00 (medianoche) como solicitado.
  
  // 1. Creamos una fecha base UTC en la medianoche
  const baseDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  
  // 2. Formateamos esa fecha base en la zona horaria destino para ver qué "hora local" cree que es
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(baseDate);
  
  const part = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  
  // Reconstruimos la fecha que "ve" la zona horaria, pero interpretada como UTC para poder calcular diferencias
  // Nota: Mes en formatToParts es 1-based, en Date.UTC es 0-based.
  const tzYear = part('year');
  const tzMonth = part('month');
  const tzDay = part('day');
  const tzHour = part('hour'); // 0-23 si hour12: false
  
  const tzDateAsUTC = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, 0, 0));
  
  // 3. Calculamos la diferencia entre la hora base y la hora "percibida"
  const diff = baseDate.getTime() - tzDateAsUTC.getTime();
  
  // 4. Aplicamos la diferencia a la base para obtener el timestamp UTC real
  // Si base (12h UTC) se ve como 9h (TZ), diff = +3h.
  // Queremos que sea 12h (TZ).
  // adjusted = base + diff = 12h UTC + 3h = 15h UTC.
  // 15h UTC en TZ (-3) = 12h. Correcto.
  const adjustedDate = new Date(baseDate.getTime() + diff);
  
  return adjustedDate.toISOString();
}

/**
 * Comprueba si una fecha ha vencido comparando con la fecha actual en la zona horaria.
 */
export function isOverdue(isoString: string, completed: boolean): boolean {
  if (!isoString || completed) return false;
  
  const now = new Date();
  const date = new Date(isoString);
  
  // Comparamos timestamps directamente es lo más preciso
  // Pero queremos saber si venció EL DIA.
  // Si vence el 30/12. Estamos a 30/12 10:00. ¿Venció? No. Vence al final del día normalmente.
  // O al principio? "Due Date" suele ser "Vence este día".
  // Si asumimos vencimiento a final del día (23:59:59 en TIMEZONE).
  
  // Simplificación: Si la fecha actual (en timezone) es mayor que la fecha de vencimiento (en timezone + 1 día).
  // O simplemente: Hoy es 31, vencía el 30. Vencida.
  // Hoy es 30, vencía el 30. No vencida (vence hoy).
  
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);
  const dueDateStr = toInputDate(isoString);
  
  return todayStr > dueDateStr;
}

/**
 * Formatea una fecha ISO (UTC) a fecha y hora en la zona horaria configurada.
 * Ejemplo: "30/12/2025 14:30"
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Convierte una fecha ISO (UTC) al formato YYYY-MM-DDTHH:mm en la zona horaria configurada,
 * para usar en inputs tipo datetime-local.
 */
export function toInputDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  
  const parts = new Intl.DateTimeFormat('en-GB', { // en-GB usa DD/MM/YYYY, pero formatToParts es más seguro
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const part = (type: string) => parts.find(p => p.type === type)?.value;
  
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

/**
 * Toma una fecha YYYY-MM-DDTHH:mm (del input) y devuelve un ISO string UTC.
 */
export function fromInputDateTimeToUTC(dateTimeString: string): string {
  if (!dateTimeString) return '';
  
  // input datetime-local format: YYYY-MM-DDTHH:mm
  const [datePart, timePart] = dateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  
  // Creamos fecha base UTC
  const baseDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  
  // Calculamos offset de zona horaria para ese momento específico
  // Usamos el mismo algoritmo de ajuste que en fromInputDateToUTC pero con hora precisa
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(baseDate);
  
  const part = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  
  const tzYear = part('year');
  const tzMonth = part('month');
  const tzDay = part('day');
  const tzHour = part('hour');
  const tzMinute = part('minute');
  
  const tzDateAsUTC = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0));
  
  const diff = baseDate.getTime() - tzDateAsUTC.getTime();
  
  return new Date(baseDate.getTime() + diff).toISOString();
}

/**
 * Calcula la próxima fecha de cierre para una tarjeta de crédito
 * basándose en el día de cierre y la zona horaria configurada.
 */
export function getNextClosingDate(closingDay: number): Date {
  const now = new Date();
  
  // Obtenemos la fecha actual en la zona horaria
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(now);
  
  const currentYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const currentMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0'); // 1-based
  const currentDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');

  let targetYear = currentYear;
  let targetMonth = currentMonth;

  // Si el día actual es mayor al día de cierre, es el próximo mes
  if (currentDay > closingDay) {
    targetMonth++;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear++;
    }
  }

  // Ajustar si el día de cierre no existe en el mes objetivo
  // new Date(year, month, 0) devuelve el último día del mes anterior (si month es 1-based para Date.UTC pero aquí usamos constructor Date(y, m, d))
  // Date(year, monthIndex, 0). monthIndex 0 = Ene. monthIndex 1 = Feb.
  // targetMonth es 1-based (1=Ene). 
  // new Date(targetYear, targetMonth, 0) -> Si targetMonth=1 (Ene), queremos saber días de Enero.
  // No, Date(2025, 1, 0) -> 31 Enero. (Porque 1 es Feb, dia 0 es dia anterior a 1 Feb).
  // Entonces: new Date(targetYear, targetMonth, 0) da el último día del mes `targetMonth`. Correcto.
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const actualClosingDay = Math.min(closingDay, daysInMonth);

  // Construir la fecha en UTC que corresponde a ese día en la zona horaria.
  const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(actualClosingDay).padStart(2, '0')}`;
  
  // Devolvemos objeto Date (parseado desde ISO)
  return new Date(fromInputDateToUTC(dateStr));
}
