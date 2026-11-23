import type { ActionDef, Operation } from "../../api/client";
import { GlobalActionForm } from "../features/GlobalActionForm.example";
import { GlobalOperationRow } from "../components/GlobalOperationRow.example";
import {
  ACTIONS_BY_SCOPE,
  type GlobalOperationScope,
  type GlobalOperationSelection,
} from "../types/global-operations.example";

type Props = {
  catalog: ActionDef[];
  selection: GlobalOperationSelection;
  adminKey: string;
  operator: string;
  operations: Operation[];
  onSelectionChange: (selection: GlobalOperationSelection) => void;
  onCompleted: (operation: Operation) => void;
  onOpenCases: () => void;
};

const GROUPS: Array<{
  scope: GlobalOperationScope;
  title: string;
  description: string;
}> = [
  { scope: "DATE", title: "Día académico", description: "Validación, asistencia, grabaciones y procesamiento diario." },
  { scope: "SECTION", title: "Sección", description: "Auditoría y asignación del docente de una sección." },
  { scope: "MEETING_CASE", title: "Expediente o reunión", description: "Sincronización y conciliación sobre un expediente seleccionado." },
  { scope: "PIPELINE", title: "Pipeline", description: "Ejecución controlada de una sola etapa del pipeline." },
];

function targetReady(scope: GlobalOperationScope, value: GlobalOperationSelection): boolean {
  if (scope === "DATE" || scope === "PIPELINE") return Boolean(value.processingDate);
  if (scope === "SECTION") return Boolean(value.academicPeriod && value.sectionCode);
  return Boolean(value.masterSessionId && value.academicPeriod && value.sectionCode && value.sessionNumber);
}

export function GlobalOperationsPage(props: Props) {
  const { catalog, selection, onSelectionChange } = props;

  const actionsFor = (scope: GlobalOperationScope) =>
    catalog.filter(
      (action) =>
        action.scope === scope && ACTIONS_BY_SCOPE[scope].includes(action.code),
    );

  return (
    <main className="global-operations-page">
      <header className="page-header">
        <div>
          <h2>Operaciones globales</h2>
          <p>Seleccione primero el contexto y después una operación disponible.</p>
        </div>
      </header>

      <section className="operation-targets panel">
        <label>
          Fecha académica
          <input
            type="date"
            value={selection.processingDate}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                processingDate: event.target.value,
                action: null,
                scope: null,
              })
            }
          />
        </label>

        <label>
          Período académico
          <input
            value={selection.academicPeriod || ""}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                academicPeriod: event.target.value.trim(),
                action: null,
                scope: null,
              })
            }
          />
        </label>

        <label>
          Código completo de sección
          <input
            value={selection.sectionCode || ""}
            onChange={(event) =>
              onSelectionChange({
                ...selection,
                sectionCode: event.target.value.trim(),
                action: null,
                scope: null,
              })
            }
          />
        </label>

        <div className="selected-case-summary">
          <strong>Expediente seleccionado</strong>
          <span>{selection.masterSessionId || "Ninguno"}</span>
          {!selection.masterSessionId && (
            <button type="button" className="secondary" onClick={props.onOpenCases}>
              Seleccionar desde Bandeja
            </button>
          )}
        </div>
      </section>

      {GROUPS.map((group) => (
        <GlobalOperationRow
          key={group.scope}
          title={group.title}
          description={group.description}
          actions={actionsFor(group.scope)}
          selectedCode={
            selection.scope === group.scope ? selection.action?.code : undefined
          }
          targetReady={targetReady(group.scope, selection)}
          targetMessage={
            group.scope === "MEETING_CASE"
              ? "Seleccione un expediente desde Bandeja."
              : group.scope === "SECTION"
                ? "Indique período y código completo de sección."
                : "Seleccione una fecha académica."
          }
          onSelect={(action) =>
            onSelectionChange({
              ...selection,
              action,
              scope: group.scope,
            })
          }
        />
      ))}

      {selection.action && selection.scope && (
        <GlobalActionForm
          action={selection.action}
          scope={selection.scope}
          date={selection.processingDate}
          section={
            selection.academicPeriod && selection.sectionCode
              ? { period: selection.academicPeriod, code: selection.sectionCode }
              : undefined
          }
          masterSessionId={selection.masterSessionId}
          sessionNumber={selection.sessionNumber}
          adminKey={props.adminKey}
          operator={props.operator}
          onCancel={() =>
            onSelectionChange({ ...selection, action: null, scope: null })
          }
          onCompleted={props.onCompleted}
        />
      )}

      <section className="panel operation-monitor">
        <h3>Monitor por request_id</h3>
        <p>El monitor existente debe mantenerse aquí. request_id y process_run_id son identificadores distintos.</p>
      </section>
    </main>
  );
}
