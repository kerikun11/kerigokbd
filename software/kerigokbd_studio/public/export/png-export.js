// Rasterizes a live DOM element (the cheat sheet) to a PNG, for the
// "PNGをコピー" / "PNGをダウンロード" buttons.
//
// Hand-drawing the keyboard a second time onto a <canvas> with the 2D
// drawing API would mean re-deriving every position, font size and icon
// this app already computed once for the live cheat sheet. Instead, this
// clones the already-rendered element into a standalone SVG (via
// <foreignObject>, with the stylesheet and icon defs inlined so it doesn't
// depend on the surrounding page) and draws *that* onto a canvas -- the
// same DOM/CSS the browser already rendered on screen, captured as-is.

const STYLESHEET_HREF = "editor.css";
const SVG_NS = "http://www.w3.org/2000/svg";
const XHTML_NS = "http://www.w3.org/1999/xhtml";

let cachedCssText = null;

async function loadStylesheetText() {
  if (cachedCssText !== null) return cachedCssText;
  const response = await fetch(STYLESHEET_HREF);
  if (!response.ok) throw new Error(`Failed to load ${STYLESHEET_HREF}: ${response.status}`);
  cachedCssText = await response.text();
  return cachedCssText;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の生成に失敗しました"));
    image.src = src;
  });
}

/**
 * @param {HTMLElement} element the element to rasterize (captured at its
 *   current rendered size; must not be `hidden` or zero-sized).
 * @param {{scale?: number, background?: string}} [options] `scale` controls
 *   output resolution (2 = retina-ish), `background` fills in behind any
 *   transparent pixels (canvas PNGs are otherwise transparent there).
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderElementToCanvas(element, { scale = 2, background = "#fbfaf6" } = {}) {
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (rect.width === 0 || rect.height === 0) {
    throw new Error("表示されていない要素はPNGに変換できません");
  }

  const [cssText] = await Promise.all([loadStylesheetText()]);
  const iconDefs = document.querySelector(".svg-definitions defs");

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const style = document.createElementNS(SVG_NS, "style");
  style.textContent = cssText;
  svg.append(style);
  if (iconDefs) svg.append(iconDefs.cloneNode(true));

  const foreignObject = document.createElementNS(SVG_NS, "foreignObject");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("width", String(width));
  foreignObject.setAttribute("height", String(height));

  const wrapper = document.createElementNS(XHTML_NS, "div");
  wrapper.setAttribute("xmlns", XHTML_NS);
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.background = background;
  wrapper.append(element.cloneNode(true));
  foreignObject.append(wrapper);
  svg.append(foreignObject);

  const svgText = new XMLSerializer().serializeToString(svg);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  const image = await loadImage(svgUrl);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNGへの変換に失敗しました"))), "image/png");
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function copyBlobToClipboard(blob) {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("このブラウザはPNGのクリップボードコピーに対応していません");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
