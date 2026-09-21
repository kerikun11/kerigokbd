/** Device group: actions that talk to the connected keyboard directly. */
export function renderDeviceActions(container, { connected }, handlers) {
  const reloadButton = document.createElement("button");
  reloadButton.type = "button";
  reloadButton.className = "secondary-button";
  reloadButton.textContent = "実機から再読込";
  reloadButton.disabled = !connected;
  reloadButton.addEventListener("click", handlers.onReload);

  container.replaceChildren(reloadButton);
}

/** Edit group: turns the current (edited) keymap into something to keep,
 *  or replaces it outright -- update-to-latest and reset both overwrite
 *  every layer, so they sit here rather than in デバイス's read-only
 *  reload, each confirmed via a styled popup (app.js's confirmDialog) and
 *  marked danger-button (a red outline, not a solid fill) since both are
 *  destructive, unrecoverable overwrites of the current keymap. */
export function renderEditActions(container, { connected }, handlers) {
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "secondary-button";
  exportButton.textContent = "keymap.cへ書き出し";
  exportButton.disabled = !connected;
  exportButton.addEventListener("click", handlers.onExport);

  const updateButton = document.createElement("button");
  updateButton.type = "button";
  updateButton.className = "danger-button";
  updateButton.textContent = "最新版レイアウトに更新";
  updateButton.disabled = !connected;
  updateButton.addEventListener("click", handlers.onUpdateLatest);

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "danger-button";
  resetButton.textContent = "ファームウェア初期状態にリセット";
  resetButton.disabled = !connected;
  resetButton.addEventListener("click", handlers.onReset);

  container.replaceChildren(exportButton, updateButton, resetButton);
}

export function renderExportDialog(container, sourceText, onClose) {
  const backdrop = document.createElement("div");
  backdrop.className = "dialog-backdrop";

  const dialog = document.createElement("div");
  dialog.className = "dialog export-dialog";

  const heading = document.createElement("h2");
  heading.textContent = "keymap.c 書き出し";
  const note = document.createElement("p");
  note.className = "dialog-note";
  note.textContent = "実機の現在のキーマップから生成したCソースです。内容を確認のうえ、既存のkeymap.cへ手動で反映してください。";

  const textarea = document.createElement("textarea");
  textarea.className = "export-dialog-textarea";
  textarea.readOnly = true;
  textarea.value = sourceText;

  const actions = document.createElement("div");
  actions.className = "dialog-actions";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "primary-button";
  copyButton.textContent = "コピー";
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(sourceText);
      copyButton.textContent = "コピーしました";
    } catch {
      textarea.select();
      copyButton.textContent = "選択したのでCtrl+Cでコピーしてください";
    }
  });
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "secondary-button";
  closeButton.textContent = "閉じる";
  closeButton.addEventListener("click", onClose);
  actions.append(copyButton, closeButton);

  dialog.append(heading, note, textarea, actions);
  backdrop.append(dialog);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) onClose();
  });
  container.append(backdrop);
}

/**
 * A styled Yes/No popup for a destructive device action (update to latest,
 * reset to firmware defaults) -- replaces window.confirm, which looks like
 * the browser chrome rather than this app, and can't be styled to make the
 * destructive choice visually distinct (danger vs primary button).
 */
export function renderConfirmDialog(container, { heading, message, confirmLabel = "実行", cancelLabel = "キャンセル", danger = false }, onConfirm, onCancel) {
  const backdrop = document.createElement("div");
  backdrop.className = "dialog-backdrop";

  const dialog = document.createElement("div");
  dialog.className = "dialog confirm-dialog";

  const headingEl = document.createElement("h2");
  headingEl.textContent = heading;
  const messageEl = document.createElement("p");
  messageEl.className = "dialog-note";
  messageEl.textContent = message;

  const actions = document.createElement("div");
  actions.className = "dialog-actions";
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "secondary-button";
  cancelButton.textContent = cancelLabel;
  cancelButton.addEventListener("click", onCancel);
  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = danger ? "danger-button" : "primary-button";
  confirmButton.textContent = confirmLabel;
  confirmButton.addEventListener("click", onConfirm);
  actions.append(cancelButton, confirmButton);

  dialog.append(headingEl, messageEl, actions);
  backdrop.append(dialog);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) onCancel();
  });
  container.append(backdrop);
}
