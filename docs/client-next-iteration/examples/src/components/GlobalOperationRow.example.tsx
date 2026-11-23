import type { ActionDef } from "../../api/client";
import { isActionAvailable } from "../types/global-operations.example";

type Props = {
  title: string;
  description: string;
  actions: ActionDef[];
  selectedCode?: string;
  targetReady: boolean;
  targetMessage: string;
  onSelect: (action: ActionDef) => void;
};

export function GlobalOperationRow({
  title,
  description,
  actions,
  selectedCode,
  targetReady,
  targetMessage,
  onSelect,
}: Props) {
  return (
    <section className="global-operation-row">
      <header>
        <h3>{title}</h3>
        <p className="muted">{description}</p>
      </header>

      {!targetReady && <p className="warning">{targetMessage}</p>}

      <div className="global-operation-actions">
        {actions.map((action) => {
          const available = isActionAvailable(action) && targetReady;
          const selected = selectedCode === action.code;

          return (
            <button
              key={action.code}
              type="button"
              className={selected ? "operation-card selected" : "operation-card"}
              disabled={!available}
              onClick={() => onSelect(action)}
            >
              <strong>{action.label || action.code}</strong>
              <small>{action.code}</small>
              <span>{available ? "Disponible" : "No disponible"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
