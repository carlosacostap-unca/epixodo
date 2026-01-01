import { formatDate, toInputDate, isOverdue } from '../date-utils';

describe('Date Utils', () => {
  // Configurar un entorno predecible si es necesario
  // Nota: Las funciones dependen de Intl.DateTimeFormat y la timezone
  
  describe('formatDate', () => {
    it('should return empty string for empty input', () => {
      expect(formatDate('')).toBe('');
    });

    it('should format valid ISO date correctly', () => {
      // Usamos una fecha fija. Dependiendo de la timezone del sistema donde corre el test
      // el resultado podría variar si no mockeamos la timezone.
      // Sin embargo, date-utils usa process.env.NEXT_PUBLIC_TIMEZONE || 'UTC'
      // Por defecto en test environment será UTC.
      
      const isoDate = '2025-12-30T12:00:00.000Z';
      // En UTC, esto es 30/12/2025
      expect(formatDate(isoDate)).toBe('30/12/2025');
    });
  });

  describe('toInputDate', () => {
    it('should convert ISO date to YYYY-MM-DD format', () => {
      const isoDate = '2025-12-30T15:30:00.000Z';
      expect(toInputDate(isoDate)).toBe('2025-12-30');
    });
  });

  describe('isOverdue', () => {
    beforeAll(() => {
      // Mockear la fecha actual
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return false if completed is true', () => {
      expect(isOverdue('2020-01-01', true)).toBe(false);
    });

    it('should return true if date is in the past', () => {
      // 2025 es pasado respecto a 2026
      expect(isOverdue('2025-12-31', false)).toBe(true);
    });

    it('should return false if date is in the future', () => {
      // 2027 es futuro respecto a 2026
      expect(isOverdue('2027-01-01', false)).toBe(false);
    });
  });
});
