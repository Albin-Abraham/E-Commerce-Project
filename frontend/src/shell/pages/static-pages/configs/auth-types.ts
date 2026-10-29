/*
 * Auth Portal Config Types — V4 (View State) contract
 *
 * `auth_mode` is deliberately NOT part of either form's data payload.
 * It lives here as page-level view state: routing between the login and
 * signup schemas. The schema-delivered segmented control carries this
 * props object so the page only supplies state, never chrome.
 */

export type AuthMode = "login" | "signup";

export interface AuthModeToggleProps {
  mode: AuthMode;
  isSwapping?: boolean;
  onModeChange: (mode: AuthMode) => void;
}
