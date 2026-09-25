// The 表示 / 編集 mode switch in the settings pane's header: it swaps
// the main view and which settings groups are shown, so it sits above all
// of them as a two-way segmented control that always shows the current mode.
const MODES = [
  { mode: "cheatSheet", label: "表示" },
  { mode: "edit", label: "編集" },
];

export function renderModeAction(container, { mode }, onSelect) {
  container.replaceChildren(...MODES.map(({ mode: value, label }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-switch-button";
    button.classList.toggle("is-active", value === mode);
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(value === mode));
    button.textContent = label;
    button.addEventListener("click", () => {
      if (value !== mode) onSelect(value);
    });
    return button;
  }));
}
