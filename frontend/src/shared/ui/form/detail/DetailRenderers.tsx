import {
  DetailBottomActions,
  DetailHeader,
  DetailKeyDetailsCard,
  DetailKeyValueRow,
  DetailValueDisplay,
} from "./components";

export {
  DetailHeader,
  DetailKeyDetailsCard,
  DetailBottomActions,
  DetailKeyValueRow,
  DetailValueDisplay,
} from "./components";

export {
  isSafeUrl,
  isSafeEmail,
  isSafePhone,
  normalizeDisplayModel,
} from "./formatters";

export type {
  HeaderRendererProps,
  KeyDetailsCardRendererProps,
  BottomActionSlotRendererProps,
  KeyValueRowProps,
  ValueDisplayProps,
  NormalizedDisplayModel,
} from "./types";

/**
 * Standardized Slot Renderers object dictionary (retained for backward compatibility).
 * @deprecated Prefer compound `DetailRenderer.Header` or standalone `DetailHeader`.
 */
export const DetailRenderers = {
  Header: DetailHeader,
  KeyDetailsCard: DetailKeyDetailsCard,
  BottomActionSlot: DetailBottomActions,
  BottomActions: DetailBottomActions,
  KeyValueRow: DetailKeyValueRow,
  ValueDisplay: DetailValueDisplay,
};
