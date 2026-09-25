// Per-layer show/hide switches for the cheat sheet, so a crowded key can be
// decluttered down to just the layers someone cares about right now. Short
// layer names only (the group title says "表示するレイヤー"), so all four
// fit on one row.
const TOGGLES = [
  { key: "nums", label: "Num", colorClass: "toggle-nums" },
  { key: "func", label: "Fn", colorClass: "toggle-func" },
  { key: "extra", label: "Extra", colorClass: "toggle-extra" },
  { key: "mouse", label: "Trackpad", colorClass: "toggle-mouse" },
];

export function renderLayerToggles(container, { visibility, showMouseToggle }, onChange) {
  const fragment = document.createDocumentFragment();
  for (const { key, label, colorClass } of TOGGLES) {
    if (key === "mouse" && !showMouseToggle) continue;

    const wrapper = document.createElement("label");
    wrapper.className = "layer-toggle";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = visibility[key];
    input.addEventListener("change", () => onChange(key, input.checked));

    const track = document.createElement("span");
    track.className = `toggle-track ${colorClass}`;
    track.setAttribute("aria-hidden", "true");
    track.append(document.createElement("span"));

    const text = document.createElement("span");
    text.textContent = label;

    wrapper.append(input, track, text);
    fragment.append(wrapper);
  }
  container.replaceChildren(fragment);
}
