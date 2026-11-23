import React, {
    useRef,
    useState,
  } from "react";
  
  import {
    ActionDef,
    api,
  } from "../api/client";
  
  
  export const ACTION_CODES = [
    "REVIEW_NO_ATTENDANCE_REPORT",
    "KEEP_PENDING_REVIEW",
    "CONFIRM_NO_ATTENDANCE_EVIDENCE",
    "CONFIRM_SESSION_NOT_DELIVERED",
    "SYNC_ATTENDANCE_BY_SECTION",
    "ASSIGN_BEST_ATTENDANCE_REPORT",
    "APPROVE_ATTENDANCE_EXCEPTION",
    "PROCESS_TEACHER_ONLY_SESSIONS",
    "CONFIRM_STUDENTS_PRESENT_NO_TEACHER",
    "APPROVE_BEST_RECORDING",
    "ENQUEUE_RECORDING_SHLINK_BY_SECTION",
    "RETRY_ATTENDANCE_STAGE",
    "RETRY_RECORDING_STAGE",
    "RETRY_SHLINK_STAGE",
    "CANCEL_RECORDING_JOB",
  ] as const;
  
  
  const minimumReasonLength: Record<string, number> = {
    REVIEW_NO_ATTENDANCE_REPORT: 0,
  
    KEEP_PENDING_REVIEW: 10,
  
    CONFIRM_NO_ATTENDANCE_EVIDENCE: 10,
  
    CONFIRM_SESSION_NOT_DELIVERED: 10,
  
    SYNC_ATTENDANCE_BY_SECTION: 10,
  
    ASSIGN_BEST_ATTENDANCE_REPORT: 10,
  
    APPROVE_ATTENDANCE_EXCEPTION: 20,
  
    PROCESS_TEACHER_ONLY_SESSIONS: 20,
  
    CONFIRM_STUDENTS_PRESENT_NO_TEACHER: 20,
  
    APPROVE_BEST_RECORDING: 10,
  
    ENQUEUE_RECORDING_SHLINK_BY_SECTION: 10,
  
    RETRY_ATTENDANCE_STAGE: 10,
  
    RETRY_RECORDING_STAGE: 10,
  
    RETRY_SHLINK_STAGE: 10,
  
    CANCEL_RECORDING_JOB: 10,
  };
  
  
  function readNestedValue(
    source: unknown,
    path: string,
  ): unknown {
    return path
      .split(".")
      .reduce<unknown>(
        (
          current,
          segment,
        ) => {
          if (
            current === null ||
            current === undefined ||
            typeof current !== "object"
          ) {
            return undefined;
          }
  
          return (
            current as Record<string, unknown>
          )[segment];
        },
        source,
      );
  }
  
  
  function findArray(
    detail: unknown,
    paths: string[],
  ): any[] {
    for (const path of paths) {
      const value = readNestedValue(
        detail,
        path,
      );
  
      if (Array.isArray(value)) {
        return value;
      }
    }
  
    return [];
  }
  
  
  function getErrorMessage(
    error: unknown,
  ): string {
    if (error instanceof Error) {
      return error.message;
    }
  
    if (
      error !== null &&
      typeof error === "object"
    ) {
      const errorObject =
        error as Record<string, unknown>;
  
      const detail = errorObject.detail;
  
      if (
        detail !== null &&
        typeof detail === "object"
      ) {
        const message = (
          detail as Record<string, unknown>
        ).message;
  
        if (typeof message === "string") {
          return message;
        }
      }
  
      if (
        typeof errorObject.message ===
        "string"
      ) {
        return errorObject.message;
      }
    }
  
    return "No fue posible ejecutar la acción.";
  }
  
  
  type ActionFormProps = {
    detail: any;
    action: ActionDef;
    keyValue: string;
    operator: string;
    onDone: () => Promise<void>;
  };
  
  
  export function ActionForm({
    detail,
    action,
    keyValue,
    operator,
    onDone,
  }: ActionFormProps) {
    const [reason, setReason] =
      useState("");
  
    const [parameters, setParameters] =
      useState<Record<string, unknown>>({});
  
    const [busy, setBusy] =
      useState(false);
  
    const [error, setError] =
      useState("");
  
    /*
     * Se genera una sola clave por intención.
     * Los reintentos conservan la misma clave.
     */
    const idempotencyKeyRef = useRef(
      crypto.randomUUID(),
    );
  
    /*
     * Evita dos solicitudes por doble clic.
     */
    const submittingRef = useRef(false);
  
    const code = action.code;
  
    const reports = findArray(
      detail,
      [
        "attendance.reports",
        "attendance.candidates",
        "attendance_reports",
        "reports",
        "attendance",
      ],
    );
  
    const recordings = findArray(
      detail,
      [
        "recording.recordings",
        "recording_candidates",
        "recordings",
      ],
    );
  
    const jobs = findArray(
      detail,
      [
        "attendance.jobs",
        "recording.jobs",
        "publication.jobs",
        "jobs",
      ],
    );
  
    const minimumLength =
      minimumReasonLength[code] ?? 3;
  
    const setParameter = (
        name: string,
        value: unknown,
      ) => {
        setParameters(
          (previousParameters) => ({
            ...previousParameters,
            [name]: value,
          }),
        );
      };
  
    const masterSessionId = String(
      detail.master_session?.id ||
        detail.master_session_id ||
        "",
    );
  
    const expectedCaseUpdatedAt =
      detail.case_updated_at ||
      detail.summary?.case_updated_at ||
      null;
  
    const reasonIsValid =
      minimumLength === 0 ||
      reason.trim().length >=
        minimumLength;
  
    const requiresAttendanceReport =
      code ===
        "ASSIGN_BEST_ATTENDANCE_REPORT" ||
      code ===
        "APPROVE_ATTENDANCE_EXCEPTION" ||
      code ===
        "CONFIRM_STUDENTS_PRESENT_NO_TEACHER";
  
    const attendanceReportIsValid =
      !requiresAttendanceReport ||
      Boolean(
        parameters.attendance_report_id,
      );
  
    const requiresResolution =
      code ===
      "PROCESS_TEACHER_ONLY_SESSIONS";
  
    const resolutionIsValid =
      !requiresResolution ||
      Boolean(parameters.resolution);
  
    const requiresRecording =
      code ===
      "APPROVE_BEST_RECORDING";
  
    const recordingIsValid =
      !requiresRecording ||
      Boolean(parameters.recording_uuid);
  
    const requiresExceptionData =
      code ===
      "APPROVE_ATTENDANCE_EXCEPTION";
  
    const exceptionDataIsValid =
      !requiresExceptionData ||
      (
        Boolean(parameters.exception_type) &&
        Boolean(
          parameters.evidence_reference,
        )
      );
  
    const canSubmit =
      !busy &&
      reasonIsValid &&
      attendanceReportIsValid &&
      resolutionIsValid &&
      recordingIsValid &&
      exceptionDataIsValid &&
      Boolean(masterSessionId) &&
      Boolean(operator.trim()) &&
      Boolean(keyValue.trim());
  
  
    const submit = async () => {
      if (submittingRef.current) {
        return;
      }
  
      if (!canSubmit) {
        setError(
          "Completa los campos obligatorios antes de confirmar.",
        );
  
        return;
      }
  
      submittingRef.current = true;
  
      setBusy(true);
      setError("");
  
      try {
        await api.execute(
          masterSessionId,
          keyValue,
          operator,
          {
            action_code: code,
  
            reason:
              minimumLength === 0
                ? reason.trim() || null
                : reason.trim(),
  
            expected_case_updated_at:
              expectedCaseUpdatedAt,
  
            parameters,
          },
  
          /*
           * Esta clave se conserva cuando se
           * reintenta la misma intención.
           */
          idempotencyKeyRef.current,
        );
  
        await onDone();
      }
      catch (caughtError) {
        setError(
          getErrorMessage(
            caughtError,
          ),
        );
      }
      finally {
        submittingRef.current = false;
        setBusy(false);
      }
    };
  
  
    return (
      <div className="action-form">
        <h4>
          {action.label || code}
        </h4>
  
        <label>
          Motivo administrativo
  
          <textarea
            value={reason}
            onChange={
              (
                event,
              ) => {
                setReason(
                  event.target.value,
                );
              }
            }
            placeholder={
              minimumLength === 0
                ? "Motivo opcional"
                : `Mínimo ${minimumLength} caracteres`
            }
            disabled={busy}
          />
        </label>
  
        {code ===
          "ASSIGN_BEST_ATTENDANCE_REPORT" && (
          <label>
            Reporte de asistencia
  
            <select
              value={
                String(
                  parameters
                    .attendance_report_id ||
                    "",
                )
              }
              onChange={
                (
                  event,
                ) => {
                  setParameter(
                    "attendance_report_id",
                    event.target.value,
                  );
                }
              }
              disabled={busy}
            >
              <option value="">
                Seleccionar reporte
              </option>
  
              {reports.map(
                (
                  report: any,
                ) => {
                  const reportId =
                    report.report_id ||
                    report.id;
  
                  return (
                    <option
                      key={reportId}
                      value={reportId}
                    >
                      {report.title ||
                        report.report_id ||
                        report.id}
                    </option>
                  );
                },
              )}
            </select>
          </label>
        )}
  
        {code ===
          "CONFIRM_STUDENTS_PRESENT_NO_TEACHER" && (
          <label>
            Reporte principal de asistencia
  
            <select
              value={
                String(
                  parameters
                    .attendance_report_id ||
                    "",
                )
              }
              onChange={
                (
                  event,
                ) => {
                  setParameter(
                    "attendance_report_id",
                    event.target.value,
                  );
                }
              }
              disabled={busy}
            >
              <option value="">
                Seleccionar reporte
              </option>
  
              {reports.map(
                (
                  report: any,
                ) => {
                  const reportId =
                    report.report_id ||
                    report.id;
  
                  const duration =
                    report.duration_minutes;
  
                  const participants =
                    report.total_participants ??
                    report
                      .declared_participant_count;
  
                  const status =
                    report.status ||
                    report.candidate_status;
  
                  const label = [
                    report.title ||
                      reportId,
  
                    duration !==
                    undefined
                      ? `${duration} min`
                      : null,
  
                    participants !==
                    undefined
                      ? `${participants} participantes`
                      : null,
  
                    status || null,
                  ]
                    .filter(Boolean)
                    .join(" | ");
  
                  return (
                    <option
                      key={reportId}
                      value={reportId}
                    >
                      {label}
                    </option>
                  );
                },
              )}
            </select>
          </label>
        )}
  
        {code ===
          "APPROVE_ATTENDANCE_EXCEPTION" && (
          <>
            <label>
              Tipo de excepción
  
              <select
                value={
                  String(
                    parameters
                      .exception_type ||
                      "",
                  )
                }
                onChange={
                  (
                    event,
                  ) => {
                    setParameter(
                      "exception_type",
                      event.target.value,
                    );
                  }
                }
                disabled={busy}
              >
                <option value="">
                  Seleccionar
                </option>
  
                <option
                  value={
                    "INSTRUCTOR_ATTENDANCE_BELOW_THRESHOLD"
                  }
                >
                  INSTRUCTOR_ATTENDANCE_BELOW_THRESHOLD
                </option>
              </select>
            </label>
  
            <label>
              Reporte
  
              <select
                value={
                  String(
                    parameters
                      .attendance_report_id ||
                      "",
                  )
                }
                onChange={
                  (
                    event,
                  ) => {
                    setParameter(
                      "attendance_report_id",
                      event.target.value,
                    );
                  }
                }
                disabled={busy}
              >
                <option value="">
                  Seleccionar reporte
                </option>
  
                {reports.map(
                  (
                    report: any,
                  ) => {
                    const reportId =
                      report.report_id ||
                      report.id;
  
                    return (
                      <option
                        key={reportId}
                        value={reportId}
                      >
                        {report.title ||
                          report.report_id ||
                          report.id}
                      </option>
                    );
                  },
                )}
              </select>
            </label>
  
            <label>
              Referencia de evidencia
  
              <input
                value={
                  String(
                    parameters
                      .evidence_reference ||
                      "",
                  )
                }
                onChange={
                  (
                    event,
                  ) => {
                    setParameter(
                      "evidence_reference",
                      event.target.value,
                    );
                  }
                }
                disabled={busy}
              />
            </label>
          </>
        )}
  
        {code ===
          "PROCESS_TEACHER_ONLY_SESSIONS" && (
          <label>
            Resolución
  
            <select
              value={
                String(
                  parameters.resolution ||
                    "",
                )
              }
              onChange={
                (
                  event,
                ) => {
                  setParameter(
                    "resolution",
                    event.target.value,
                  );
                }
              }
              disabled={busy}
            >
              <option value="">
                Seleccionar
              </option>
  
              <option
                value={
                  "KEEP_PENDING_REVIEW"
                }
              >
                KEEP_PENDING_REVIEW
              </option>
  
              <option
                value={
                  "CONFIRM_SESSION_NOT_DELIVERED"
                }
              >
                CONFIRM_SESSION_NOT_DELIVERED
              </option>
  
              <option
                value={
                  "APPROVE_TEACHER_ONLY_EXCEPTION"
                }
              >
                APPROVE_TEACHER_ONLY_EXCEPTION
              </option>
            </select>
          </label>
        )}
  
        {code ===
          "APPROVE_BEST_RECORDING" && (
          <label>
            Grabación
  
            <select
              value={
                String(
                  parameters.recording_uuid ||
                    "",
                )
              }
              onChange={
                (
                  event,
                ) => {
                  setParameter(
                    "recording_uuid",
                    event.target.value,
                  );
                }
              }
              disabled={busy}
            >
              <option value="">
                Seleccionar grabación
              </option>
  
              {recordings.map(
                (
                  recording: any,
                ) => {
                  const recordingId =
                    recording.recording_uuid ||
                    recording.id;
  
                  const label = [
                    recording.title ||
                      recording.name ||
                      recording.file_name ||
                      recordingId,
  
                    recording.duration_minutes !==
                    undefined
                      ? `${recording.duration_minutes} min`
                      : null,
  
                    recording.drive_item_id
                      ? `Drive: ${recording.drive_item_id}`
                      : null,
  
                    `UUID: ${recordingId}`,
                  ]
                    .filter(Boolean)
                    .join(" | ");
  
                  return (
                    <option
                      key={recordingId}
                      value={recordingId}
                    >
                      {label}
                    </option>
                  );
                },
              )}
            </select>
          </label>
        )}
  
        {[
          "RETRY_ATTENDANCE_STAGE",
          "RETRY_RECORDING_STAGE",
          "RETRY_SHLINK_STAGE",
        ].includes(code) && (
          <label>
            Job
  
            <select
              value={
                String(
                  parameters.job_id ||
                    "",
                )
              }
              onChange={
                (
                  event,
                ) => {
                  setParameter(
                    "job_id",
                    event.target.value,
                  );
                }
              }
              disabled={busy}
            >
              <option value="">
                Usar job del expediente
              </option>
  
              {jobs.map(
                (
                  job: any,
                ) => {
                  const jobId =
                    job.job_id ||
                    job.id;
  
                  return (
                    <option
                      key={jobId}
                      value={jobId}
                    >
                      {jobId}
                    </option>
                  );
                },
              )}
            </select>
          </label>
        )}
  
        {code ===
          "CANCEL_RECORDING_JOB" && (
          <>
            <label>
              Motivo de cancelación
  
              <input
                value={
                  String(
                    parameters
                      .cancellation_reason ||
                      "",
                  )
                }
                onChange={
                  (
                    event,
                  ) => {
                    setParameter(
                      "cancellation_reason",
                      event.target.value,
                    );
                  }
                }
                disabled={busy}
              />
            </label>
  
            <label>
              Detalle
  
              <input
                value={
                  String(
                    parameters.detail ||
                      "",
                  )
                }
                onChange={
                  (
                    event,
                  ) => {
                    setParameter(
                      "detail",
                      event.target.value,
                    );
                  }
                }
                disabled={busy}
              />
            </label>
          </>
        )}
  
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
        >
          {busy
            ? "Enviando…"
            : "Confirmar acción"}
        </button>
  
        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </div>
    );
  }