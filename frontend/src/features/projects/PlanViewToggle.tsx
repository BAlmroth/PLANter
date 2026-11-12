import { ViewToggle } from "../../components/ViewToggle";
import { usePlanView } from "./usePlanView";

const OPTIONS = [
  { value: "list", label: "List" },
  { value: "map", label: "Map" },
] as const;

// The List / Map switch of the Items page, shown in the sub header. The view itself lives in usePlanView.
export function PlanViewToggle() {
  const { view, setView } = usePlanView();
  return <ViewToggle label="Plan view" options={OPTIONS} value={view} onChange={setView} />;
}
