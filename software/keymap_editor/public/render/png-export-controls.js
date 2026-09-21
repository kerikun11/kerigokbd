export function renderPngExportControls(container, { enabled }, handlers) {
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "secondary-button";
  copyButton.textContent = "PNG画像をコピー";
  copyButton.disabled = !enabled;
  copyButton.title = enabled ? "" : "早見表を表示しているときだけ使えます";
  copyButton.addEventListener("click", handlers.onCopy);

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.className = "secondary-button";
  downloadButton.textContent = "PNG画像をダウンロード";
  downloadButton.disabled = !enabled;
  downloadButton.title = enabled ? "" : "早見表を表示しているときだけ使えます";
  downloadButton.addEventListener("click", handlers.onDownload);

  container.replaceChildren(copyButton, downloadButton);
}
