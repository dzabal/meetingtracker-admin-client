import { useMemo, useRef, useState } from "react";
import {
  multiScopeApi,
  type ActionDef,
  type Operation,
  type ScopeActionPayload,
} from "../../api/client";
import type { GlobalOperationScope } from "../types-global-operations";

type Props = {
  action: ActionDef;
  scope: GlobalOperationScope;
  date: string;
  section?: { period: string; code: string };
  masterSessionId?: string;
  sessionNumber?: number;
  adminKey: string;
  operator: string;
  onCompleted: (operation: Operation) => void;
  onCancel: () => void;
};

const MUTATING_OPERATIONS = new Set([
  "APPLY",
  "ENQUEUE",
  "PROCESS",
  "APPLY_ATTENDANCE",
  "APPLY_RECORDINGS",
  "ENQUEUE_RECORDINGS",
  "ATTENDANCE_ENQUEUE",
  "RECORDINGS_ENQUEUE",
  "RECORDINGS_PROCESS",
]);

function initialOperation(code: string): string {
  if (code === "PROCESS_ACADEMIC_DAY") return "PREVIEW_ATTENDANCE";
  if (code === "RUN_ACADEMIC_PIPELINE") return "VALIDATE";
  if (code === "VALIDATE_ACADEMIC_DAY") return "VALIDATE";
  return "PREVIEW";
}

export function GlobalActionForm(props: Props) {
  const [operation, setOperation] = useState(initialOperation(props.action.code));
  const [reason, setReason] = useState("");
  const [maximum, setMaximum] = useState(20);
  const [onlyIssues, setOnlyIssues] = useState(true);
  const [includeGraph, setIncludeGraph] = useState(false);
  const [instructorName, setInstructorName] = useState("");
  const [instructorUpn, setInstructorUpn] = useState("");
  const [removeProvisional, setRemoveProvisional] = useState(true);
  const [roleCode, setRoleCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef<string>();

  const isMutating = MUTATING_OPERATIONS.has(operation);

  const payload = useMemo<ScopeActionPayload>(() => {
    const base = {
      action_code: props.action.code,
      reason: reason.trim() || undefined,
    };

    switch (props.action.code) {
      case "VALIDATE_ACADEMIC_DAY":
        return { ...base, parameters: { only_issues: onlyIssues } };
      case "AUDIT_SECTION_MEETINGS":
        return { ...base, parameters: { include_graph: includeGraph, maximum_items: maximum } };
      case "ASSIGN_SECTION_INSTRUCTOR":
        return {
          ...base,
          parameters: {
            operation,
            instructor_name: instructorName.trim(),
            instructor_upn: instructorUpn.trim(),
            remove_provisional: removeProvisional,
            instructor_object_id: undefined,
          },
        };
      case "SYNC_MEETING_INSTRUCTOR":
        return {
          ...base,
          parameters: {
            operation,
            academic_period: props.section?.period,
            section_code: props.section?.code,
            session_number: props.sessionNumber,
          },
        };
      case "RECONCILE_MEETING_COORGANIZERS":
        return {
          ...base,
          parameters: {
            operation,
            academic_period: props.section?.period,
            section_code: props.section?.code,
            session_number: props.sessionNumber,
            maximum,
            role_code: roleCode.trim() || undefined,
          },
        };
      case "RECONCILE_SUPPORT_COORGANIZERS":
        return {
          ...base,
          parameters: {
            operation,
            academic_period: props.section?.period,
            section_code: props.section?.code,
            session_number: props.sessionNumber,
            maximum,
          },
        };
      case "ENQUEUE_ATTENDANCE_BY_DATE":
      case "SYNC_RECORDINGS_BY_DATE":
        return { ...base, parameters: { operation, maximum_jobs: maximum } };
      case "PROCESS_ACADEMIC_DAY":
        return { ...base, parameters: { mode: operation, maximum_items: maximum } };
      case "RUN_ACADEMIC_PIPELINE":
        return { ...base, parameters: { step: operation, maximum_items: maximum, only_issues: onlyIssues } };
      default:
        throw new Error(`Acción no soportada: ${props.action.code}`);
    }
  }, [
    props,
    operation,
    reason,
    maximum,
    onlyIssues,
    includeGraph,
    instructorName,
    instructorUpn,
    removeProvisional,
    roleCode,
  ]);

  async function submit() {
    if (isMutating && reason.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres.");
      return;
    }

    if (props.scope === "MEETING_CASE" && !props.masterSessionId) {
      setError("Seleccione un expediente antes de continuar.");
      return;
    }

    if (props.scope === "SECTION" && (!props.section?.period || !props.section.code)) {
      setError("Indique período y código completo de sección.");
      return;
    }

    idempotencyKey.current ||= crypto.randomUUID();
    setBusy(true);
    setError("");

    try {
      let result: Operation;
      if (props.scope === "MEETING_CASE") {
        result = await multiScopeApi.executeMeetingCaseAction(
          props.masterSessionId!, props.adminKey, props.operator, payload, idempotencyKey.current,
        ) as Operation;
      } else if (props.scope === "SECTION") {
        result = await multiScopeApi.executeSectionAction(
          props.section!.period, props.section!.code, props.adminKey, props.operator, payload, idempotencyKey.current,
        ) as Operation;
      } else if (props.scope === "PIPELINE") {
        result = await multiScopeApi.executePipelineAction(
          props.date, props.adminKey, props.operator, payload, idempotencyKey.current,
        ) as Operation;
      } else {
        result = await multiScopeApi.executeAcademicDayAction(
          props.date, props.adminKey, props.operator, payload, idempotencyKey.current,
        ) as Operation;
      }
      props.onCompleted(result);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="global-form panel">
      <h3>{props.action.label || props.action.code}</h3>
      <p className="muted">{props.scope} · {props.action.code}</p>

      {/* El cliente final debe renderizar aquí los controles específicos indicados en INSTRUCTIONS.md. */}

      {isMutating && (
        <label>
          Motivo administrativo
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
      )}

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="button" onClick={submit} disabled={busy}>
          {busy ? "Enviando…" : "Confirmar"}
        </button>
        <button type="button" className="secondary" onClick={props.onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
