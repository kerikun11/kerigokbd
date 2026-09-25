export function renderPngExportControls(container, handlers) {
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "secondary-button";
  copyButton.textContent = "PNGをコピー";
  copyButton.addEventListener("click", handlers.onCopy);

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.className = "secondary-button";
  downloadButton.textContent = "PNGを保存";
  downloadButton.title = "PNG画像をダウンロード";
  downloadButton.addEventListener("click", handlers.onDownload);

  container.replaceChildren(copyButton, downloadButton);
}
