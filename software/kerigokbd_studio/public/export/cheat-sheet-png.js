import { renderElementToCanvas, canvasToPngBlob } from "./png-export.js";

const STAGE_BACKGROUND = "#f3f0e8";

/**
 * Builds the offscreen "poster" version of the cheat sheet for PNG export:
 * the same .editor-card styling (padding, rounded corners, shadow) the page
 * itself uses, plus the keyboard name/layout version header stripped out of
 * the on-page layout -- so the exported image is self-describing rather
 * than a bare key grid with no keyboard/version label.
 */
function buildPngExportCard({ container, title, layoutVersion }) {
  const card = document.createElement("div");
  card.className = "editor-card png-export-card";
  const paneStyle = getComputedStyle(container.closest(".editor-card"));
  const horizontalPadding = parseFloat(paneStyle.paddingLeft) + parseFloat(paneStyle.paddingRight);
  card.style.width = `${container.getBoundingClientRect().width + horizontalPadding}px`;

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const titleElement = document.createElement("h1");
  titleElement.textContent = title;
  const version = document.createElement("p");
  version.className = "layout-version";
  version.textContent = layoutVersion;
  heading.append(titleElement, version);

  const content = container.cloneNode(true);
  content.hidden = false;
  content.removeAttribute("id");
  content.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));

  card.append(heading, content);
  return card;
}

/**
 * Rasterizes the cheat sheet (`container`, with `title`/`layoutVersion` as
 * its header) to a PNG blob.
 */
export async function renderCheatSheetPng(source) {
  // A page-background "stage" padded around the card, just enough for the
  // card's own drop shadow to fall off into instead of being clipped
  // exactly at the card's edge (which would read as an odd flat line) --
  // not a wide frame of empty space around the actual content.
  // The off-screen positioning goes on a separate outer wrapper, never on
  // the stage itself: renderElementToCanvas clones whatever element it's
  // given verbatim, and a cloned `position: fixed; left: -9999px` would
  // carry its offset into the exported image too, rendering blank.
  const stage = document.createElement("div");
  stage.style.padding = "16px";
  stage.style.background = STAGE_BACKGROUND;
  stage.append(buildPngExportCard(source));
  const offscreen = document.createElement("div");
  offscreen.style.position = "fixed";
  offscreen.style.top = "0";
  offscreen.style.left = "-9999px";
  offscreen.append(stage);
  document.body.append(offscreen);
  try {
    const canvas = await renderElementToCanvas(stage, { background: STAGE_BACKGROUND });
    return await canvasToPngBlob(canvas);
  } finally {
    offscreen.remove();
  }
}
