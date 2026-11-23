type EffectiveSchedule = {
  session_number?: number | null;
  subject?: string | null;
  processing_date?: string | null;
  original_start_time?: string | null;
  effective_start_time?: string | null;
  duration_minutes?: number | null;
  change_approved?: boolean | null;
  within_24_hour_rule?: boolean | null;
  requested_by?: string | null;
  approved_by?: string | null;
  reason?: string | null;
  [key: string]: unknown;
};

type Props = {
  schedule?: EffectiveSchedule | null;
};

const value = (input: unknown): string => {
  if (input === null || input === undefined || input === "") return "No disponible";
  if (typeof input === "boolean") return input ? "Sí" : "No";
  return String(input);
};

export function EffectiveScheduleCard({ schedule }: Props) {
  if (!schedule) {
    return (
      <section className="effective-schedule panel">
        <h3>Horario efectivo</h3>
        <p className="muted">No hay horario efectivo disponible.</p>
      </section>
    );
  }

  return (
    <section className="effective-schedule panel">
      <h3>Horario efectivo</h3>

      <dl className="effective-schedule-grid">
        <div><dt>Sesión</dt><dd>{value(schedule.session_number)}</dd></div>
        <div><dt>Asignatura</dt><dd>{value(schedule.subject)}</dd></div>
        <div><dt>Fecha</dt><dd>{value(schedule.processing_date)}</dd></div>
        <div><dt>Hora original</dt><dd>{value(schedule.original_start_time)}</dd></div>
        <div><dt>Hora efectiva</dt><dd>{value(schedule.effective_start_time)}</dd></div>
        <div><dt>Duración</dt><dd>{schedule.duration_minutes == null ? "No disponible" : `${schedule.duration_minutes} minutos`}</dd></div>
        <div><dt>Cambio aprobado</dt><dd>{value(schedule.change_approved)}</dd></div>
        <div><dt>Regla de 24 horas</dt><dd>{value(schedule.within_24_hour_rule)}</dd></div>
        <div><dt>Solicitado por</dt><dd>{value(schedule.requested_by)}</dd></div>
        <div><dt>Aprobado por</dt><dd>{value(schedule.approved_by)}</dd></div>
        <div className="full-row"><dt>Motivo</dt><dd>{value(schedule.reason)}</dd></div>
      </dl>

      <details>
        <summary>Datos técnicos</summary>
        <pre>{JSON.stringify(schedule, null, 2)}</pre>
      </details>
    </section>
  );
}
