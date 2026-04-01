/**
 * Calcula las próximas fechas de reunión de un grupo según su configuración.
 * Usado al crear un grupo para generar los próximos N eventos automáticamente (US-03 Scenario 11).
 */

type Frequency = 'semanal' | 'quincenal' | 'mensual'

// Mapeo de nombre de día a índice JS (0 = domingo ... 6 = sábado)
const DAY_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
}

/**
 * Devuelve la fecha del próximo día de la semana `targetDay` a partir de `from` (inclusive).
 */
function nextWeekday(from: Date, targetDay: number): Date {
  const result = new Date(from)
  const current = result.getDay()
  const diff = (targetDay - current + 7) % 7
  result.setDate(result.getDate() + diff)
  return result
}

/**
 * Devuelve el N-ésimo `targetDay` del mes de `referenceDate`.
 * - week 1..4: primera, segunda, tercera, cuarta ocurrencia
 * - week 5: última ocurrencia del mes
 * Retorna null si no existe esa ocurrencia (ej. 5° lunes en un mes donde solo hay 4).
 */
function nthWeekdayOfMonth(year: number, month: number, targetDay: number, week: number): Date | null {
  if (week === 5) {
    // Última ocurrencia: empezar desde el final del mes
    const lastDay = new Date(year, month + 1, 0)
    while (lastDay.getDay() !== targetDay) {
      lastDay.setDate(lastDay.getDate() - 1)
    }
    return lastDay
  }

  // N-ésima ocurrencia (1-4)
  const first = new Date(year, month, 1)
  const firstTargetDay = (targetDay - first.getDay() + 7) % 7
  const date = new Date(year, month, 1 + firstTargetDay + (week - 1) * 7)
  // Verificar que sigue en el mismo mes
  if (date.getMonth() !== month) return null
  return date
}

/**
 * Calcula las próximas `count` fechas de reunión de un grupo a partir de `fromDate`.
 * Si la fecha de la próxima ocurrencia dentro del mes actual ya pasó, se omite ese mes.
 *
 * @param frequency  - 'semanal' | 'quincenal' | 'mensual'
 * @param meetingWeek - null para semanal; 1|2 para quincenal (1=1° y 3°, 2=2° y 4°); 1-5 para mensual
 * @param meetingDayOfWeek - nombre del día en español (lunes, martes, etc.)
 * @param fromDate - fecha base para el cálculo (normalmente Date.now())
 * @param count - cantidad de fechas a generar (default 3)
 */
export function getNextEventDates(
  frequency: Frequency,
  meetingWeek: number | null,
  meetingDayOfWeek: string,
  fromDate: Date = new Date(),
  count: number = 3,
): Date[] {
  const targetDay = DAY_INDEX[meetingDayOfWeek]
  if (targetDay === undefined) {
    throw new Error(`Día inválido: ${meetingDayOfWeek}`)
  }

  const dates: Date[] = []

  if (frequency === 'semanal') {
    // Próximos N días con el targetDay a partir de fromDate (inclusive si es hoy mismo)
    let cursor = nextWeekday(fromDate, targetDay)
    // Si cursor es hoy y targetDay es hoy, empezamos desde hoy
    for (let i = 0; i < count; i++) {
      dates.push(new Date(cursor))
      cursor = new Date(cursor)
      cursor.setDate(cursor.getDate() + 7)
    }
    return dates
  }

  if (frequency === 'mensual') {
    // meetingWeek: 1-5 (5 = última semana del mes)
    let year = fromDate.getFullYear()
    let month = fromDate.getMonth()

    while (dates.length < count) {
      const candidate = nthWeekdayOfMonth(year, month, targetDay, meetingWeek!)
      if (candidate !== null && candidate >= fromDate) {
        dates.push(candidate)
      }
      month++
      if (month > 11) {
        month = 0
        year++
      }
    }
    return dates
  }

  if (frequency === 'quincenal') {
    // meetingWeek = 1 → semanas 1 y 3 del mes
    // meetingWeek = 2 → semanas 2 y 4 del mes
    const weeksInMonth = meetingWeek === 1 ? [1, 3] : [2, 4]

    let year = fromDate.getFullYear()
    let month = fromDate.getMonth()

    while (dates.length < count) {
      for (const week of weeksInMonth) {
        if (dates.length >= count) break
        const candidate = nthWeekdayOfMonth(year, month, targetDay, week)
        if (candidate !== null && candidate >= fromDate) {
          dates.push(candidate)
        }
      }
      month++
      if (month > 11) {
        month = 0
        year++
      }
    }
    return dates
  }

  return dates
}

/**
 * Dado un Date, devuelve el primer día del mes en formato 'YYYY-MM-DD'.
 * Usado para el campo `month` de la tabla `events`.
 */
export function toMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}
