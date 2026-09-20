(() => {
  "use strict";

  const VIEWER_CONFIG = Object.freeze({
    layoutColumns: 15,
    layoutRows: 5,
    mouseLabelBottom: 12,
    mouseLabelBottomWithHold: 24,
    keyGapXPercent: 0.55,
    keyGapYPercent: 0.7,
    pngPadding: 18,
    pngScale: 2,
  });
  const PNG_TYPOGRAPHY = Object.freeze({
    main: 20,
    mainCompact: 16,
    auxiliary: 13,
    auxiliarySingle: 15,
    auxiliaryCompact: 13,
  });
  const LARGE_VIEW_BOX_ICONS = new Set(["backspace", "delete", "move", "scroll", "zoom"]);
  const CLICK_ICONS = Object.freeze({
    "1": "mouse-left",
    "2": "mouse-right",
    "3": "mouse-middle",
  });
  const CLICK_MODES = Object.freeze({
    "1": "left",
    "2": "right",
    "3": "middle",
  });
  const CLICK_PATTERN = /^M([123])$/;
  const POINTER_PATTERN = /^M([⬅⬇⬆➡])$/;
  const WHEEL_PATTERN = /^W([⬅⬇⬆➡])$/;
  const HORIZONTAL_ARROWS = new Set(["⬅", "➡"]);

  const requiredElement = (selector) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Required element is missing: ${selector}`);
    return element;
  };

  let data = window.KEYMAP_DATA?.keyboards?.kerigokbd_v2;
  if (!data) {
    requiredElement("main").innerHTML = "<p>キーマップデータを読み込めませんでした。</p>";
    return;
  }

  const elements = Object.freeze({
    keyboard: requiredElement("#keyboard"),
    keyboardSelect: requiredElement("#keyboard-select"),
    keyboardName: requiredElement("#keyboard-name"),
    layoutVersion: requiredElement("#layout-version"),
    numToggle: requiredElement("#toggle-num"),
    fnToggle: requiredElement("#toggle-fn"),
    escapeToggle: requiredElement("#toggle-escape"),
    escapeDescription: requiredElement(".legend-layer-escape"),
    escapeGuide: requiredElement(".guide-escape"),
    mouseToggle: requiredElement("#toggle-auto-mouse"),
    mouseToggleLabel: requiredElement('label[for="toggle-auto-mouse"]'),
    mouseGuide: requiredElement(".guide-auto-mouse"),
    mouseLegend: requiredElement(".legend-auto-section"),
    mouseDescription: requiredElement(".legend-layer-mouse"),
    copyButton: requiredElement("#copy-png"),
    downloadButton: requiredElement("#download-png"),
    copyStatus: requiredElement("#copy-status"),
  });
  const keyboard = elements.keyboard;
  const autoMouseToggle = elements.mouseToggle;
  for (const [layer, toggle] of [["num", elements.numToggle], ["fn", elements.fnToggle]]) {
    const update = () => {
      keyboard.classList.toggle(`hide-${layer}`, !toggle.checked);
      requiredElement(`.legend-layer-${layer}`).hidden = !toggle.checked;
      requiredElement(layer === "num" ? ".guide-nums" : ".guide-func").hidden = !toggle.checked;
      if (layer === "fn") {
        requiredElement(".legend-clicks").hidden = !toggle.checked;
        requiredElement(".legend-mouse").hidden = !toggle.checked;
      }
    };
    toggle.addEventListener("change", update);
    update();
  }

  const unitX = 100 / VIEWER_CONFIG.layoutColumns;
  const unitY = 100 / VIEWER_CONFIG.layoutRows;
  document.documentElement.style.setProperty(
    "--mouse-label-bottom",
    `${VIEWER_CONFIG.mouseLabelBottom}px`,
  );

  document.documentElement.style.setProperty(
    "--mouse-label-bottom-with-hold",
    `${VIEWER_CONFIG.mouseLabelBottomWithHold}px`,
  );

  const rotatePoint = (x, y, originX, originY, degrees) => {
    const radians = degrees * Math.PI / 180;
    const deltaX = x - originX;
    const deltaY = y - originY;
    return {
      x: originX + Math.cos(radians) * deltaX - Math.sin(radians) * deltaY,
      y: originY + Math.sin(radians) * deltaX + Math.cos(radians) * deltaY,
    };
  };

  const matrixId = (matrix) => matrix.join(",");
  let trackpadKeys = new Set();
  const hasJapanese = (label) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(label);
  const labelFontSize = (label, size) => size * (hasJapanese(label) ? 0.8 : 1);
  const isCompactMainLabel = (label) => label !== "Backspace" && label.length > 1;
  const pngAuxiliaryFontSize = (label, forceStandard = false) => {
    let size = PNG_TYPOGRAPHY.auxiliary;
    if (!forceStandard) {
      if (label.length > 1) size = PNG_TYPOGRAPHY.auxiliaryCompact;
      else if (label.length === 1) size = PNG_TYPOGRAPHY.auxiliarySingle;
    }
    return labelFontSize(label, size);
  };

  const createIcon = (name) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.classList.add("operation-icon");
    svg.setAttribute("viewBox", LARGE_VIEW_BOX_ICONS.has(name) ? "0 0 24 24" : "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `#icon-${name}`);
    svg.append(use);
    return svg;
  };

  const createKeyLabel = (className, value) => {
    const span = document.createElement("span");
    span.className = className;
    span.classList.toggle("single-label", value.length === 1);
    span.classList.toggle("long-label", value.length > 1);
    const mouseClick = value.match(CLICK_PATTERN);
    const mouseOperation = value.match(POINTER_PATTERN);
    const wheelOperation = value.match(WHEEL_PATTERN);

    if (value === "Backspace") {
      span.classList.add("icon-only");
      span.append(createIcon("backspace"));
    } else if (value === "Scroll") {
      span.classList.add("icon-only");
      span.append(createIcon("scroll"));
    } else if (value === "Zoom") {
      span.classList.add("icon-only");
      span.append(createIcon("zoom"));
    } else if (mouseClick) {
      span.classList.add("click-operation");
      span.append(createIcon(CLICK_ICONS[mouseClick[1]]));
    } else if (mouseOperation) {
      span.classList.add("pointer-operation");
      if (HORIZONTAL_ARROWS.has(mouseOperation[1])) {
        span.classList.add("horizontal-pointer-operation");
      }
      span.append(createIcon("mouse"), mouseOperation[1]);
    } else if (wheelOperation) {
      span.classList.add("pointer-operation");
      if (HORIZONTAL_ARROWS.has(wheelOperation[1])) {
        span.classList.add("horizontal-pointer-operation");
      }
      span.append(createIcon("wheel"), wheelOperation[1]);
    } else if (value === "Alt+PrSc") {
      span.classList.add("stacked-operation");
      span.append("Alt+", document.createElement("br"), "PrSc");
    } else {
      if (hasJapanese(value)) {
        const text = document.createElement("span");
        text.className = "japanese-label";
        text.textContent = value;
        span.append(text);
      } else {
        span.textContent = value;
      }
    }
    return span;
  };

  const createMouseLabel = (layer) => {
    if (!layer.label) return createKeyLabel("key-auto-mouse", "");
    if (layer.expanded === "KC_BSPC" || layer.expanded === "KC_DEL") {
      const span = document.createElement("span");
      span.className = "key-auto-mouse icon-only";
      span.append(createIcon(layer.expanded === "KC_BSPC" ? "backspace" : "delete"));
      return span;
    }
    return createKeyLabel("key-auto-mouse", layer.label);
  };

  const keyClassNames = (key) => {
    const classNames = ["key", key.main.state];
    if (key.main.hold) classNames.push("has-hold");
    if (key.autoMouse.label) classNames.push("has-auto-mouse");
    if (isCompactMainLabel(key.main.label)) classNames.push("compact-main-label");
    if (key.nums.label === "Alt+PrSc") classNames.push("stacked-nums-label");
    else if (key.nums.label.length > 1) classNames.push("long-nums-label");
    if (key.func.label.length > 1) classNames.push("long-func-label");
    if (key.nums.label.length === 1) classNames.push("single-nums-label");
    if (key.func.label.length === 1) classNames.push("single-func-label");
    return classNames.join(" ");
  };

  const createKeyElement = (key) => {
    const position = rotatePoint(key.x, key.y, key.rotationX, key.rotationY, key.rotation);
    const keyElement = document.createElement("div");
    keyElement.className = keyClassNames(key);
    keyElement.style.left = `${position.x * unitX}%`;
    keyElement.style.top = `${position.y * unitY}%`;
    keyElement.style.width = `${key.width * unitX - VIEWER_CONFIG.keyGapXPercent}%`;
    keyElement.style.height = `${key.height * unitY - VIEWER_CONFIG.keyGapYPercent}%`;
    keyElement.style.setProperty("--rotation", `${key.rotation}deg`);
    const accessibleLabels = [
      key.main.label,
      key.main.shift,
      key.nums.label,
      key.autoMouse.label,
      key.func.label,
      key.main.hold,
    ].filter(Boolean);
    keyElement.setAttribute("aria-label", accessibleLabels.join(", "));
    keyElement.append(
      createKeyLabel("key-main", key.main.label),
      createKeyLabel("key-main-shift", key.main.shift),
      createKeyLabel("key-nums", key.nums.label),
      createMouseLabel(key.autoMouse),
      createKeyLabel("key-func", key.func.label),
    );
    const escape = createKeyLabel("key-escape", key.escape.label);
    keyElement.append(escape);
    if (key.main.hold) {
      const hold = createKeyLabel("key-hold", key.main.hold);
      if (key.main.hold === "Num") hold.classList.add("hold-nums");
      if (key.main.hold === "Fn") hold.classList.add("hold-func");
      if (key.main.hold === "Extra") hold.classList.add("hold-extra");
      keyElement.append(hold);
    }
    return keyElement;
  };

  const createTrackpadElement = () => {
    const trackpad = document.createElement("div");
    const trackpadMain = document.createElement("div");
    const trackpadName = document.createElement("span");
    const trackpadHold = document.createElement("span");
    trackpad.className = "trackpad";
    trackpad.setAttribute("aria-label", "Trackpad, Mouse");
    trackpad.style.left = `${data.trackpad.x * unitX}%`;
    trackpad.style.top = `${data.trackpad.y * unitY}%`;
    trackpad.style.width = `${data.trackpad.width * unitX - VIEWER_CONFIG.keyGapXPercent}%`;
    trackpadMain.className = "trackpad-main";
    trackpadName.textContent = "Trackpad";
    trackpadHold.className = "trackpad-hold";
    trackpadHold.textContent = "Mouse";
    trackpadMain.append(createIcon("mouse-left"), trackpadName);
    trackpad.append(trackpadMain, trackpadHold);
    return trackpad;
  };

  const renderKeyboard = () => {
    trackpadKeys = new Set(data.trackpad?.replaces.map(matrixId) ?? []);
    elements.keyboardName.textContent = data.keyboard;
    elements.layoutVersion.textContent = `Layout ${data.layoutVersion}`;
    const fragment = document.createDocumentFragment();
    data.keys
      .filter((key) => !trackpadKeys.has(matrixId(key.matrix)))
      .forEach((key) => fragment.append(createKeyElement(key)));
    if (data.trackpad) fragment.append(createTrackpadElement());
    keyboard.replaceChildren(fragment);
    autoMouseToggle.disabled = !data.trackpad;
    elements.mouseToggleLabel.hidden = !data.trackpad;
  };

  const setAutoMouseVisibility = (visible) => {
    visible = visible && Boolean(data.trackpad);
    elements.mouseDescription.hidden = !visible;
    keyboard.classList.toggle("show-auto-mouse", visible);
    keyboard.setAttribute("data-auto-mouse-visible", String(visible));
    elements.mouseGuide.hidden = !visible;
    elements.mouseLegend.hidden = !visible;
  };
  autoMouseToggle.addEventListener("change", () => {
    setAutoMouseVisibility(autoMouseToggle.checked);
  });

  const updateEscapeVisibility = () => {
    keyboard.classList.toggle("show-escape", elements.escapeToggle.checked);
    elements.escapeDescription.hidden = !elements.escapeToggle.checked;
    elements.escapeGuide.hidden = !elements.escapeToggle.checked;
  };
  elements.escapeToggle.addEventListener("change", updateEscapeVisibility);
  updateEscapeVisibility();

  const syncLegendKeySize = () => {
    const guide = requiredElement(".legend-key-guide");
    const referenceKey = [...keyboard.querySelectorAll(".key")]
      .find((key) => key.style.getPropertyValue("--rotation") === "0deg");
    if (!referenceKey) return;
    const referenceBounds = referenceKey.getBoundingClientRect();
    guide.style.width = `${referenceBounds.width}px`;
    guide.style.height = `${referenceBounds.height}px`;
  };
  const selectKeyboard = (keyboardId) => {
    data = window.KEYMAP_DATA.keyboards[keyboardId];
    renderKeyboard();
    setAutoMouseVisibility(autoMouseToggle.checked);
    syncLegendKeySize();
    elements.copyStatus.textContent = "";
  };
  selectKeyboard(elements.keyboardSelect.value);
  window.addEventListener("resize", syncLegendKeySize);
  elements.keyboardSelect.addEventListener("change", () => {
    selectKeyboard(elements.keyboardSelect.value);
  });

  const renderCardToPng = async () => {
    syncLegendKeySize();
    const card = document.querySelector(".keyboard-card");
    const keyboardBounds = keyboard.getBoundingClientRect();
    const bounds = card.getBoundingClientRect();
    const cardWidth = Math.max(bounds.width, card.scrollWidth);
    const padding = VIEWER_CONFIG.pngPadding;
    const width = Math.ceil(cardWidth + padding * 2);
    const height = Math.ceil(bounds.height + padding * 2);
    const scale = VIEWER_CONFIG.pngScale;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    context.scale(scale, scale);

    const rootStyle = getComputedStyle(document.documentElement);
    const color = (name) => rootStyle.getPropertyValue(name).trim();
    const colors = {
      page: color("--page"), card: color("--card"), ink: color("--ink"),
      muted: color("--muted"), nums: color("--nums"), func: color("--func"),
      escape: color("--escape"),
      autoMouse: color("--auto-mouse"), hold: color("--hold"),
      key: color("--key"), border: color("--key-border"),
      rule: color("--rule"),
    };
    const holdColors = { Num: colors.nums, Fn: colors.func, Extra: colors.escape };
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const cardX = padding;
    const cardY = padding;

    const roundedRectangle = (x, y, w, h, radius) => {
      context.beginPath();
      context.roundRect(x, y, w, h, radius);
    };
    const drawMouse = (x, y, mode = "pointer", drawColor = colors.func, iconScale = 1) => {
      context.save();
      context.translate(x, y);
      context.scale(iconScale, iconScale);
      context.lineWidth = 1.2;
      context.strokeStyle = drawColor;
      if (mode === "left" || mode === "right") {
        context.beginPath();
        if (mode === "left") {
          context.moveTo(0, -7);
          context.bezierCurveTo(-2.76, -7, -5, -4.76, -5, -2);
          context.lineTo(-5, 0);
          context.lineTo(0, 0);
        } else {
          context.moveTo(0, -7);
          context.bezierCurveTo(2.76, -7, 5, -4.76, 5, -2);
          context.lineTo(5, 0);
          context.lineTo(0, 0);
        }
        context.closePath();
        context.fillStyle = drawColor;
        context.fill();
      }
      roundedRectangle(-5, -7, 10, 14, 5);
      context.stroke();
      if (mode === "middle") {
        context.beginPath();
        context.moveTo(-4.5, 0);
        context.lineTo(4.5, 0);
        context.stroke();
      }
      if (mode === "wheel" || mode === "middle") {
        context.fillStyle = drawColor;
        roundedRectangle(-1.6, -5.6, 3.2, 5.6, 1.6);
        context.fill();
      } else {
        context.beginPath();
        context.moveTo(0, -6.5);
        context.lineTo(0, 0);
        context.moveTo(-4.5, 0);
        context.lineTo(4.5, 0);
        context.stroke();
      }
      context.restore();
    };
    const drawScrollIcon = (centerX, centerY, size = 12) => {
      context.save();
      context.translate(centerX - size / 2, centerY - size / 2);
      context.scale(size / 24, size / 24);
      context.strokeStyle = colors.autoMouse;
      context.lineWidth = 1.8;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      [[7, 5, 14, 5], [7, 9, 12, 9], [7, 13, 14, 13], [7, 17, 12, 17],
       [18, 4, 18, 20], [15, 17, 18, 20], [18, 20, 21, 17],
       [15, 7, 18, 4], [18, 4, 21, 7]].forEach(([x1, y1, x2, y2]) => {
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
      });
      context.stroke();
      context.restore();
    };
    const drawMoveIcon = (centerX, centerY, size = 18) => {
      context.save();
      context.translate(centerX - size / 2, centerY - size / 2);
      context.scale(size / 24, size / 24);
      context.fillStyle = colors.func;
      const polygon = (points) => {
        context.beginPath();
        context.moveTo(points[0][0], points[0][1]);
        points.slice(1).forEach(([x, y]) => context.lineTo(x, y));
        context.closePath();
        context.fill();
      };
      polygon([
        [12, 1], [17, 6], [14, 6], [14, 10], [18, 10], [18, 7],
        [23, 12], [18, 17], [18, 14], [14, 14], [14, 18], [17, 18],
        [12, 23], [7, 18], [10, 18], [10, 14], [6, 14], [6, 17],
        [1, 12], [6, 7], [6, 10], [10, 10], [10, 6], [7, 6],
      ]);
      context.restore();
    };
    const drawZoomIcon = (centerX, centerY, size = 12) => {
      context.save();
      context.translate(centerX - size / 2, centerY - size / 2);
      context.scale(size / 24, size / 24);
      context.strokeStyle = colors.autoMouse;
      context.lineWidth = 1.8;
      context.lineCap = "round";
      context.beginPath();
      context.arc(10, 10, 6, 0, Math.PI * 2);
      context.moveTo(14.5, 14.5);
      context.lineTo(19.5, 19.5);
      context.moveTo(10, 7);
      context.lineTo(10, 13);
      context.moveTo(7, 10);
      context.lineTo(13, 10);
      context.stroke();
      context.restore();
    };
    const drawAutoMouseValue = (layer, centerX, centerY) => {
      const value = layer.label;
      const click = value.match(CLICK_PATTERN);
      if (click) {
        drawMouse(centerX, centerY, CLICK_MODES[click[1]], colors.autoMouse);
        return;
      }
      if (value === "Scroll") {
        drawScrollIcon(centerX, centerY, 17);
        return;
      }
      if (value === "Zoom") {
        drawZoomIcon(centerX, centerY, 17);
        return;
      }
      if (layer.expanded === "KC_BSPC") {
        drawBackspace(centerX, centerY, colors.autoMouse, .65);
        return;
      }
      if (layer.expanded === "KC_DEL") {
        drawDelete(centerX, centerY, colors.autoMouse, .65);
        return;
      }
      context.font = `800 ${pngAuxiliaryFontSize(value)}px ${fontFamily}`;
      context.fillStyle = colors.autoMouse;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(value, centerX, centerY);
    };
    const drawOperation = (value, x, y, align, fontSize, color = colors.func) => {
      const click = value.match(CLICK_PATTERN);
      const operation = value.match(/^([MW])([⬅⬇⬆➡])$/);
      context.font = `750 ${fontSize}px ${fontFamily}`;
      context.textBaseline = "bottom";
      context.fillStyle = color;
      context.textAlign = "left";
      if (click) {
        const start = align === "right" ? x - 12 : align === "center" ? x - 6 : x;
        drawMouse(start + 5, y - fontSize / 2, CLICK_MODES[click[1]], color);
        return;
      }
      if (!operation) {
        context.textAlign = align;
        context.fillText(value, x, y);
        return;
      }
      const suffixWidth = context.measureText(operation[2]).width;
      const iconAdvance = operation[2] === "⬅" || operation[2] === "➡" ? 10 : 9;
      const totalWidth = iconAdvance + suffixWidth;
      let start = x;
      if (align === "right") start -= totalWidth;
      if (align === "center") start -= totalWidth / 2;
      drawMouse(start + 5, y - fontSize / 2, operation[1] === "W" ? "wheel" : "pointer", color);
      context.fillText(operation[2], start + iconAdvance, y);
    };
    const drawBackspace = (centerX, centerY, strokeColor = colors.ink, iconScale = 1) => {
      context.save();
      context.translate(centerX, centerY);
      context.scale(iconScale, iconScale);
      context.strokeStyle = strokeColor;
      context.lineWidth = 1.6;
      context.beginPath();
      context.moveTo(-10, 0);
      context.lineTo(-5, -6);
      context.lineTo(9, -6);
      context.lineTo(9, 6);
      context.lineTo(-5, 6);
      context.closePath();
      context.moveTo(-1, -3);
      context.lineTo(5, 3);
      context.moveTo(5, -3);
      context.lineTo(-1, 3);
      context.stroke();
      context.restore();
    };
    const drawDelete = (centerX, centerY, strokeColor = colors.ink, iconScale = 1) => {
      context.save();
      context.translate(centerX, centerY);
      context.scale(iconScale, iconScale);
      context.strokeStyle = strokeColor;
      context.lineWidth = 1.6;
      context.beginPath();
      context.moveTo(-9, -6);
      context.lineTo(5, -6);
      context.lineTo(10, 0);
      context.lineTo(5, 6);
      context.lineTo(-9, 6);
      context.closePath();
      context.moveTo(-5, -3);
      context.lineTo(1, 3);
      context.moveTo(1, -3);
      context.lineTo(-5, 3);
      context.stroke();
      context.restore();
    };
    context.fillStyle = colors.page;
    context.fillRect(0, 0, width, height);
    context.save();
    context.shadowColor = "rgba(50,47,36,.13)";
    context.shadowBlur = 20;
    context.shadowOffsetY = 8;
    roundedRectangle(cardX, cardY, cardWidth, bounds.height, 24);
    context.fillStyle = colors.card;
    context.fill();
    context.restore();
    roundedRectangle(cardX, cardY, cardWidth, bounds.height, 24);
    context.strokeStyle = colors.rule;
    context.stroke();

    const drawDomText = (selector, weight, fallbackSize, fill) => {
      const element = document.querySelector(selector);
      const rect = element.getBoundingClientRect();
      const computed = getComputedStyle(element);
      const fontSize = Number.parseFloat(computed.fontSize) || fallbackSize;
      context.font = `${weight} ${fontSize}px ${fontFamily}`;
      context.fillStyle = fill;
      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillText(element.textContent, cardX + rect.left - bounds.left, cardY + rect.top - bounds.top);
    };
    drawDomText("#keyboard-name", 750, 27, colors.ink);
    drawDomText("#layout-version", 650, 13, colors.muted);

    const keyboardX = cardX + keyboardBounds.left - bounds.left;
    const keyboardY = cardY + keyboardBounds.top - bounds.top;
    const keyUnitX = keyboardBounds.width / VIEWER_CONFIG.layoutColumns;
    const keyUnitY = keyboardBounds.height / VIEWER_CONFIG.layoutRows;
    const drawKeys = () => {
      data.keys.forEach((key) => {
        if (trackpadKeys.has(matrixId(key.matrix))) return;
        const position = rotatePoint(key.x, key.y, key.rotationX, key.rotationY, key.rotation);
        const x = keyboardX + position.x * keyUnitX;
        const y = keyboardY + position.y * keyUnitY;
        const keyWidth = key.width * keyUnitX
          - keyboardBounds.width * VIEWER_CONFIG.keyGapXPercent / 100;
        const keyHeight = key.height * keyUnitY
          - keyboardBounds.height * VIEWER_CONFIG.keyGapYPercent / 100;
        context.save();
        context.translate(x, y);
        context.rotate(key.rotation * Math.PI / 180);
        context.shadowColor = "rgba(45,43,34,.12)";
        context.shadowBlur = 6;
        context.shadowOffsetY = 3;
        const gradient = context.createLinearGradient(0, 0, keyWidth, keyHeight);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#f2f0e8");
        roundedRectangle(0, 0, keyWidth, keyHeight, 9);
        context.fillStyle = gradient;
        context.fill();
        context.shadowColor = "transparent";
        context.strokeStyle = colors.border;
        context.lineWidth = 1;
        context.stroke();

        const mainSize = isCompactMainLabel(key.main.label)
          ? PNG_TYPOGRAPHY.mainCompact
          : PNG_TYPOGRAPHY.main;
        if (key.main.label === "Backspace") {
          drawBackspace(keyWidth / 2, 17);
        } else if (CLICK_PATTERN.test(key.main.label)) {
          const click = key.main.label.match(CLICK_PATTERN);
          drawMouse(keyWidth / 2, 4 + mainSize / 2, CLICK_MODES[click[1]], colors.ink, mainSize / 16);
        } else {
          context.font = `750 ${labelFontSize(key.main.label, mainSize)}px ${fontFamily}`;
          context.fillStyle = colors.ink;
          context.textAlign = "center";
          context.textBaseline = "top";
          context.fillText(key.main.label, keyWidth / 2, 4);
        }
        if (key.main.shift) {
          context.font = `750 ${labelFontSize(key.main.shift, mainSize)}px ${fontFamily}`;
          context.fillStyle = colors.ink;
          context.textAlign = "right";
          context.textBaseline = "top";
          context.fillText(key.main.shift, keyWidth - 7, 4);
        }

        if (elements.escapeToggle.checked && key.escape.label) {
          if (WHEEL_PATTERN.test(key.escape.label) || POINTER_PATTERN.test(key.escape.label) || CLICK_PATTERN.test(key.escape.label)) {
            const size = pngAuxiliaryFontSize(key.escape.label);
            drawOperation(key.escape.label, keyWidth / 2, keyHeight * .5 + size / 2, "center", size, colors.escape);
          } else {
          context.font = `750 ${pngAuxiliaryFontSize(key.escape.label)}px ${fontFamily}`;
          context.fillStyle = colors.escape;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(key.escape.label, keyWidth / 2, keyHeight * .5, keyWidth - 8);
          }
        }

        const auxiliaryY = keyHeight - (key.main.hold ? 18 : 6);
        const hasStackedNums = key.nums.label === "Alt+PrSc";
        const numsSize = pngAuxiliaryFontSize(key.nums.label, hasStackedNums);
        const funcSize = pngAuxiliaryFontSize(key.func.label, hasStackedNums);
        const numsX = key.nums.label === "Alt+PrSc" ? 4 : 5;
        const funcX = keyWidth - (key.nums.label === "Alt+PrSc" ? 3 : 5);
        context.fillStyle = colors.nums;
        context.font = `750 ${numsSize}px ${fontFamily}`;
        context.textAlign = "left";
        context.textBaseline = "bottom";
        if (elements.numToggle.checked) {
          if (key.nums.label === "Alt+PrSc") {
            context.fillText("Alt+", numsX, auxiliaryY - numsSize);
            context.fillText("PrSc", numsX, auxiliaryY);
          } else {
            context.fillText(key.nums.label, numsX, auxiliaryY);
          }
        }
        if (elements.fnToggle.checked) drawOperation(key.func.label, funcX, auxiliaryY, "right", funcSize);
        if (data.trackpad && autoMouseToggle.checked && key.autoMouse.label) {
          const mouseBottom = key.main.hold
            ? VIEWER_CONFIG.mouseLabelBottomWithHold
            : VIEWER_CONFIG.mouseLabelBottom;
          drawAutoMouseValue(key.autoMouse, keyWidth / 2, keyHeight - mouseBottom);
        }

        if (key.main.hold) {
          const holdColor = holdColors[key.main.hold] ?? colors.hold;
          context.beginPath();
          context.moveTo(5, keyHeight - 15);
          context.lineTo(keyWidth - 5, keyHeight - 15);
          context.strokeStyle = colors.ink;
          context.lineWidth = .7;
          context.stroke();
          context.font = `500 ${labelFontSize(key.main.hold, PNG_TYPOGRAPHY.auxiliary)}px ${fontFamily}`;
          context.fillStyle = holdColor;
          context.textAlign = "center";
          context.textBaseline = "bottom";
          context.fillText(key.main.hold, keyWidth / 2, keyHeight - 2);
        }
        context.restore();
      });
    };

    const drawTrackpad = () => {
      if (data.trackpad) {
        const trackpadX = keyboardX + data.trackpad.x * keyUnitX;
        const trackpadY = keyboardY + data.trackpad.y * keyUnitY;
        const diameter = data.trackpad.width * keyUnitX - keyboardBounds.width * .0055;
        context.save();
        context.shadowColor = "rgba(45,43,34,.13)";
        context.shadowBlur = 7;
        context.shadowOffsetY = 3;
        context.beginPath();
        context.arc(trackpadX + diameter / 2, trackpadY + diameter / 2, diameter / 2, 0, Math.PI * 2);
        context.fillStyle = colors.key;
        context.fill();
        context.shadowColor = "transparent";
        context.strokeStyle = colors.border;
        context.stroke();
        context.fillStyle = "#777a73";
        context.textAlign = "center";
        context.textBaseline = "middle";
        drawMouse(
          trackpadX + diameter / 2,
          trackpadY + diameter * .39,
          "left",
          colors.autoMouse,
          1,
        );
        context.font = `700 12px ${fontFamily}`;
        context.fillText("Trackpad", trackpadX + diameter / 2, trackpadY + diameter * .58);
        context.beginPath();
        context.moveTo(trackpadX + diameter * .15, trackpadY + diameter * .79);
        context.lineTo(trackpadX + diameter * .85, trackpadY + diameter * .79);
        context.strokeStyle = colors.ink;
        context.stroke();
        context.font = `500 13px ${fontFamily}`;
        context.fillStyle = colors.autoMouse;
        context.fillText("Mouse", trackpadX + diameter / 2, trackpadY + diameter * .87);
        context.restore();
      }
    };

    const drawLegend = () => {
      const legend = document.querySelector(".legend").getBoundingClientRect();
      const legendY = cardY + legend.top - bounds.top;
      context.beginPath();
      context.moveTo(cardX + 24, legendY);
      context.lineTo(cardX + cardWidth - 24, legendY);
      context.strokeStyle = colors.rule;
      context.stroke();
      drawDomText(".legend-title", 700, 12, colors.muted);
      const guideBounds = document.querySelector(".legend-key-guide").getBoundingClientRect();
      const guideX = cardX + guideBounds.left - bounds.left;
      const guideY = cardY + guideBounds.top - bounds.top;
      context.save();
      context.shadowColor = "rgba(45,43,34,.08)";
      context.shadowBlur = 7;
      context.shadowOffsetY = 3;
      roundedRectangle(guideX, guideY, guideBounds.width, guideBounds.height, 9);
      context.fillStyle = colors.key;
      context.fill();
      context.restore();
      roundedRectangle(guideX, guideY, guideBounds.width, guideBounds.height, 9);
      context.strokeStyle = colors.border;
      context.lineWidth = 1;
      context.stroke();
      context.font = `750 10px ${fontFamily}`;
      context.textBaseline = "top";
      context.textAlign = "center";
      context.fillStyle = colors.ink;
      context.fillText("Main", guideX + guideBounds.width / 2, guideY + 7);
      if (elements.escapeToggle.checked) {
        context.fillStyle = colors.escape;
        context.fillText("Extra", guideX + guideBounds.width / 2, guideY + 19);
      }
      context.textBaseline = "bottom";
      context.textAlign = "left";
      context.fillStyle = colors.nums;
      if (elements.numToggle.checked) context.fillText("Num", guideX + 5, guideY + guideBounds.height - 18);
      if (data.trackpad && autoMouseToggle.checked) {
        context.textAlign = "center";
        context.fillStyle = colors.autoMouse;
        context.fillText("Mouse", guideX + guideBounds.width / 2, guideY + guideBounds.height - 31);
      }
      context.textAlign = "right";
      context.fillStyle = colors.func;
      if (elements.fnToggle.checked) context.fillText("Fn", guideX + guideBounds.width - 5, guideY + guideBounds.height - 18);
      context.beginPath();
      context.moveTo(guideX + 5, guideY + guideBounds.height - 12);
      context.lineTo(guideX + guideBounds.width - 5, guideY + guideBounds.height - 12);
      context.strokeStyle = colors.ink;
      context.stroke();
      context.font = `500 10px ${fontFamily}`;
      context.fillStyle = colors.hold;
      context.textAlign = "center";
      context.fillText("Hold", guideX + guideBounds.width / 2, guideY + guideBounds.height - 2);

      [...document.querySelectorAll(".legend-layer-descriptions > span")].forEach((row) => {
        if (row.hidden) return;
        [row.querySelector("b"), row.querySelector("small")].forEach((element) => {
          const elementBounds = element.getBoundingClientRect();
          const elementStyle = getComputedStyle(element);
          context.font = `${elementStyle.fontWeight} ${elementStyle.fontSize} ${fontFamily}`;
          context.fillStyle = elementStyle.color;
          context.textAlign = "left";
          context.textBaseline = "top";
          context.fillText(
            element.textContent,
            cardX + elementBounds.left - bounds.left,
            cardY + elementBounds.top - bounds.top,
          );
        });
      });

      const drawLegendColumn = (selector, modes, hasArrowLabel, drawColor = colors.func) => {
        const rows = [...document.querySelector(selector).children];
        rows.forEach((row, index) => {
          const iconBounds = row.querySelector("svg").getBoundingClientRect();
          const iconX = cardX + iconBounds.left + iconBounds.width / 2 - bounds.left;
          const iconY = cardY + iconBounds.top + iconBounds.height / 2 - bounds.top;
          drawMouse(iconX, iconY, modes[index], drawColor);

          if (hasArrowLabel) {
            const moveBounds = row.querySelector(".move-icon").getBoundingClientRect();
            drawMoveIcon(
              cardX + moveBounds.left + moveBounds.width / 2 - bounds.left,
              cardY + moveBounds.top + moveBounds.height / 2 - bounds.top,
              moveBounds.width,
            );
          }

          const description = row.querySelector("small");
          const descriptionBounds = description.getBoundingClientRect();
          const descriptionStyle = getComputedStyle(description);
          context.font = `${descriptionStyle.fontWeight} ${descriptionStyle.fontSize} ${fontFamily}`;
          context.fillStyle = colors.muted;
          context.textAlign = "left";
          context.textBaseline = "top";
          context.fillText(
            description.textContent,
            cardX + descriptionBounds.left - bounds.left,
            cardY + descriptionBounds.top - bounds.top,
          );
        });
      };
      if (elements.fnToggle.checked) {
        drawLegendColumn(".legend-clicks", ["left", "right", "middle"], false);
        drawLegendColumn(".legend-mouse", ["pointer", "wheel"], true);
      }
      if (data.trackpad && autoMouseToggle.checked) {
        drawLegendColumn(
          ".legend-auto-clicks",
          ["left", "right", "middle"],
          false,
          colors.autoMouse,
        );
        [...document.querySelector(".legend-auto-actions").children].forEach((row, index) => {
          const iconBounds = row.querySelector("svg").getBoundingClientRect();
          const iconX = cardX + iconBounds.left + iconBounds.width / 2 - bounds.left;
          const iconY = cardY + iconBounds.top + iconBounds.height / 2 - bounds.top;
          if (index === 0) drawScrollIcon(iconX, iconY, 18);
          else drawZoomIcon(iconX, iconY, 18);

          const description = row.querySelector("small");
          const descriptionBounds = description.getBoundingClientRect();
          const descriptionStyle = getComputedStyle(description);
          context.font = `${descriptionStyle.fontWeight} ${descriptionStyle.fontSize} ${fontFamily}`;
          context.fillStyle = colors.muted;
          context.textAlign = "left";
          context.textBaseline = "top";
          context.fillText(
            description.textContent,
            cardX + descriptionBounds.left - bounds.left,
            cardY + descriptionBounds.top - bounds.top,
          );
        });
      }
    };

    const drawFooter = () => {
      const footerDivider = document.querySelector(".footer-divider").getBoundingClientRect();
      const footerDividerY = cardY + footerDivider.top - bounds.top + footerDivider.height / 2;
      context.beginPath();
      context.moveTo(cardX + footerDivider.left - bounds.left, footerDividerY);
      context.lineTo(cardX + footerDivider.right - bounds.left, footerDividerY);
      context.strokeStyle = colors.rule;
      context.lineWidth = 1;
      context.stroke();

      const copyright = document.querySelector(".copyright");
      const copyrightBounds = copyright.getBoundingClientRect();
      const copyrightStyle = getComputedStyle(copyright);
      const copyrightAlign = copyrightStyle.textAlign;
      const copyrightX = copyrightAlign === "right" ? copyrightBounds.right : copyrightBounds.left;
      context.font = `${copyrightStyle.fontWeight} ${copyrightStyle.fontSize} ${fontFamily}`;
      context.fillStyle = copyrightStyle.color;
      context.textAlign = copyrightAlign;
      context.textBaseline = "top";
      context.fillText(
        copyright.textContent,
        cardX + copyrightX - bounds.left,
        cardY + copyrightBounds.top - bounds.top,
      );
    };

    drawKeys();
    drawTrackpad();
    drawLegend();
    drawFooter();

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG conversion failed")), "image/png");
    });
  };

  const copyPng = async () => {
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      throw new Error("Clipboard API is unavailable");
    }
    const png = await renderCardToPng();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
  };

  const downloadPng = async () => {
    const png = await renderCardToPng();
    const url = URL.createObjectURL(png);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.id}_keymap_${data.layoutVersion}.png`;
    document.body.append(link);
    try {
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  };

  const runPngExport = async (exportPng, successMessage, errorMessage) => {
    const controls = [elements.numToggle, elements.fnToggle, elements.keyboardSelect, elements.escapeToggle, elements.copyButton, elements.downloadButton];
    controls.forEach((control) => { control.disabled = true; });
    elements.copyStatus.textContent = "PNGを生成しています…";
    try {
      await exportPng();
      elements.copyStatus.textContent = successMessage;
    } catch (error) {
      console.error(error);
      elements.copyStatus.textContent = errorMessage;
    } finally {
      controls.forEach((control) => { control.disabled = false; });
    }
  };

  elements.copyButton.addEventListener("click", () => runPngExport(
    copyPng,
    "PNGをクリップボードにコピーしました。",
    "コピーできませんでした。Chromeなどの対応ブラウザで開いてください。",
  ));
  elements.downloadButton.addEventListener("click", () => runPngExport(
    downloadPng,
    "PNGのダウンロードを開始しました。",
    "PNGをダウンロードできませんでした。もう一度お試しください。",
  ));
})();
