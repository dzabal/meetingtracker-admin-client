// EJEMPLO DE INTEGRACION. No reemplazar App.tsx completo.
import { useState } from "react";
import { GlobalOperationsPage } from "./pages/GlobalOperationsPage.example";
import type { GlobalOperationSelection } from "./types/global-operations.example";

const today = new Date().toISOString().slice(0, 10);

export function AppIntegrationExample() {
  const [view, setView] = useState("summary");
  const [globalSelection, setGlobalSelection] = useState<GlobalOperationSelection>({
    action: null,
    scope: null,
    processingDate: today,
  });

  // Al seleccionar un expediente desde Bandeja:
  function useMeetingCase(caseDetail: {
    master_session_id: string;
    academic_period: string;
    section_code: string;
    session_number: number;
  }) {
    setGlobalSelection((current) => ({
      ...current,
      action: null,
      scope: null,
      masterSessionId: caseDetail.master_session_id,
      academicPeriod: caseDetail.academic_period,
      sectionCode: caseDetail.section_code,
      sessionNumber: caseDetail.session_number,
    }));
  }

  // El Catálogo solo informa. Este botón navega sin elegir acción.
  function openGlobalOperations() {
    setView("global-operations");
  }

  return view === "global-operations" ? (
    <GlobalOperationsPage
      catalog={[]}
      selection={globalSelection}
      onSelectionChange={setGlobalSelection}
      selectedCase={undefined}
      adminKey=""
      operator=""
      operations={[]}
      onCompleted={() => undefined}
      onOpenCases={() => setView("cases")}
    />
  ) : (
    <button type="button" onClick={openGlobalOperations}>
      Ir a Operaciones globales
    </button>
  );
}
