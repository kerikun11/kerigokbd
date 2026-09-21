import { LAYOUT as KERIGOKBD_V1 } from "../generated/layout-kerigokbd_v1.js";
import { LAYOUT as KERIGOKBD_V2 } from "../generated/layout-kerigokbd_v2.js";

const LAYOUTS = {
  kerigokbd_v2: KERIGOKBD_V2,
  kerigokbd_v1: KERIGOKBD_V1,
};

// Object key order determines both the <select> option order and its
// default selection (the first one), so kerigokbd_v2 -- the current
// flagship keyboard -- must be listed first here.
export const availableKeyboards = () =>
  Object.values(LAYOUTS).map(({ id, keyboard }) => ({ id, keyboard }));

export function loadLayout(keyboardId) {
  const layout = LAYOUTS[keyboardId];
  if (!layout) throw new Error(`Unknown keyboard: ${keyboardId}`);
  return layout;
}
