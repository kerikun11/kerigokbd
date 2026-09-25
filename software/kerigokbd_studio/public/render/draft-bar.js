import { keycodeSummary, layerName } from "../keycodes/keycode-format.js";

/**
 * The edit view's staged-edit controls, split in two:
 * - `bar` (right of the layer tabs): how many edits are waiting, a toggle
 *   for their list, and the explicit すべて破棄 / 実機に書き込む -- the only
 *   ways a staged edit is dropped or reaches the device. 実機に書き込む is
 *   always pressable; the caller reports why nothing was written.
 * - `panel` (full width under that row): the latest status message and,
 *   when opened, every staged key with its own 取り消す.
 */
export function renderDraftBar({ bar, panel }, { drafts, busy, status, listOpen }, handlers) {
  const draftCount = drafts.length;
  bar.classList.toggle("has-drafts", draftCount > 0);

  let summary;
  if (draftCount > 0) {
    summary = document.createElement("button");
    summary.type = "button";
    summary.className = "draft-summary";
    summary.setAttribute("aria-expanded", String(listOpen));
    summary.textContent = `未書き込み ${draftCount}件 ${listOpen ? "▴" : "▾"}`;
    summary.title = listOpen ? "変更一覧を閉じる" : "変更一覧を開く";
    summary.addEventListener("click", handlers.onToggleList);
  } else {
    summary = document.createElement("span");
    summary.className = "draft-summary is-empty";
    summary.textContent = "未書き込みの変更なし";
  }

  const discardButton = document.createElement("button");
  discardButton.type = "button";
  discardButton.className = "secondary-button";
  discardButton.textContent = "すべて破棄";
  discardButton.disabled = busy || draftCount === 0;
  discardButton.addEventListener("click", handlers.onDiscard);
  const writeButton = document.createElement("button");
  writeButton.type = "button";
  writeButton.className = "primary-button";
  writeButton.textContent = draftCount > 0 ? `実機に書き込む (${draftCount})` : "実機に書き込む";
  writeButton.disabled = busy;
  writeButton.addEventListener("click", handlers.onWrite);
  bar.replaceChildren(summary, discardButton, writeButton);

  const panelNodes = [];
  if (status) {
    const text = document.createElement("p");
    text.className = "draft-status";
    text.setAttribute("role", "status");
    text.textContent = status;
    panelNodes.push(text);
  }
  if (listOpen && draftCount > 0) {
    const list = document.createElement("ul");
    list.className = "draft-list";
    list.setAttribute("aria-label", "未書き込みの変更一覧");
    for (const draft of drafts) {
      const item = document.createElement("li");
      item.className = "draft-list-item";
      const target = document.createElement("button");
      target.type = "button";
      target.className = "draft-list-target";
      target.title = "このキーを選択";
      target.textContent = `${layerName(draft.layer)} / row ${draft.row}, col ${draft.col}：${keycodeSummary(draft.liveValue)} → ${keycodeSummary(draft.value)}`;
      target.addEventListener("click", () => handlers.onSelectKey(draft.layer, draft.keyIndex));
      const revert = document.createElement("button");
      revert.type = "button";
      revert.className = "draft-list-revert";
      revert.textContent = "取り消す";
      revert.disabled = busy;
      revert.addEventListener("click", () => handlers.onRevertKey(draft.layer, draft.keyIndex));
      item.append(target, revert);
      list.append(item);
    }
    panelNodes.push(list);
  }
  panel.hidden = panelNodes.length === 0;
  panel.replaceChildren(...panelNodes);
}
