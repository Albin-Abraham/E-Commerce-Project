import {
  SelectionBarAction,
  SelectionBarActions,
  SelectionBarModes,
} from "./SelectionActions";
import { SelectionActionBarRoot, SelectionBarInfo } from "./SelectionCore";

export const SelectionActionBar = Object.assign(SelectionActionBarRoot, {
  Info: SelectionBarInfo,
  Modes: SelectionBarModes,
  Action: SelectionBarAction,
  Actions: SelectionBarActions,
});

export * from "./SelectionCore";
export * from "./SelectionActions";
