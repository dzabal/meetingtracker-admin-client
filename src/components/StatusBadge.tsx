export function StatusBadge({value}:{value:string}){return <span className="badge">{value.replaceAll('_',' ')}</span>}
