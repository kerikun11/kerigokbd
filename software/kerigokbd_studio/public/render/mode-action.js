// A single dedicated button that switches between the cheat sheet (the
// default landing view) and the per-layer editor, rather than a pair of
// symmetric tabs -- editing is a deliberate, separate action from just
// looking up what a key does.
export function renderModeAction(container, { mode }, onToggle) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = mode === "edit" ? "secondary-button mode-action-button" : "primary-button mode-action-button";
  button.textContent = mode === "edit" ? "← 早見表に戻る" : "キーマップを編集する →";
  button.addEventListener("click", () => onToggle(mode === "edit" ? "cheatSheet" : "edit"));
  container.replaceChildren(button);
}
