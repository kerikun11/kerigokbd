(() => {
  "use strict";

  const data = window.KEYMAP_DATA;
  if (!data) {
    document.querySelector("main").innerHTML = "<p>キーマップデータを読み込めませんでした。</p>";
    return;
  }

  const keyboard = document.querySelector("#keyboard");
  const copyButton = document.querySelector("#copy-png");
  const copyStatus = document.querySelector("#copy-status");
  const autoMouseToggle = document.querySelector("#toggle-auto-mouse");
  const autoMouseGuide = document.querySelector(".guide-auto-mouse");
  const autoMouseLegend = document.querySelector(".legend-auto-section");
  const unitX = 100 / 15;
  const layoutRows = 5;
  const unitY = 100 / layoutRows;

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
  const trackpadKeys = new Set(data.trackpad.replaces.map(matrixId));
  const isCompactMainLabel = (label) => label !== "Backspace" && label.length > 1;

  document.querySelector("#keyboard-name").textContent = data.keyboard;
  document.querySelector("#layout-version").textContent = `Layout ${data.layoutVersion}`;

  const icon = (name) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.classList.add("operation-icon");
    svg.setAttribute("viewBox", ["backspace", "delete", "scroll", "zoom", "move"].includes(name)
      ? "0 0 24 24"
      : "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `#icon-${name}`);
    svg.append(use);
    return svg;
  };

  const text = (className, value) => {
    const span = document.createElement("span");
    span.className = className;
    const mouseClick = value.match(/^M([123])$/);
    const mouseOperation = value.match(/^M([⬅⬇⬆➡])$/);
    const wheelOperation = value.match(/^W([⬅⬇⬆➡])$/);
    if (value === "Backspace") {
      span.classList.add("icon-only");
      span.append(icon("backspace"));
    } else if (value === "Scroll") {
      span.classList.add("icon-only");
      span.append(icon("scroll"));
    } else if (value === "Zoom") {
      span.classList.add("icon-only");
      span.append(icon("zoom"));
    } else if (mouseClick) {
      const clickIcons = { "1": "mouse-left", "2": "mouse-right", "3": "mouse-middle" };
      span.classList.add("click-operation");
      span.append(icon(clickIcons[mouseClick[1]]));
    } else if (mouseOperation) {
      span.classList.add("pointer-operation");
      if (mouseOperation[1] === "⬅" || mouseOperation[1] === "➡") {
        span.classList.add("horizontal-pointer-operation");
      }
      span.append(icon("mouse"), mouseOperation[1]);
    } else if (wheelOperation) {
      span.classList.add("pointer-operation");
      if (wheelOperation[1] === "⬅" || wheelOperation[1] === "➡") {
        span.classList.add("horizontal-pointer-operation");
      }
      span.append(icon("wheel"), wheelOperation[1]);
    } else if (value === "Alt+PrSc") {
      span.classList.add("stacked-operation");
      span.append("Alt+", document.createElement("br"), "PrSc");
    } else {
      span.textContent = value;
    }
    return span;
  };

  const autoMouseContent = (layer) => {
    if (!layer.label) return text("key-auto-mouse", "");
    if (layer.expanded === "KC_BSPC" || layer.expanded === "KC_DEL") {
      const span = document.createElement("span");
      span.className = "key-auto-mouse icon-only";
      span.append(icon(layer.expanded === "KC_BSPC" ? "backspace" : "delete"));
      return span;
    }
    return text("key-auto-mouse", layer.label);
  };

  data.keys.forEach((key) => {
    if (trackpadKeys.has(matrixId(key.matrix))) return;
    const position = rotatePoint(key.x, key.y, key.rotationX, key.rotationY, key.rotation);
    const keyElement = document.createElement("div");
    keyElement.className = `key ${key.main.state}`;
    if (key.main.hold) keyElement.classList.add("has-hold");
    if (key.autoMouse.label) keyElement.classList.add("has-auto-mouse");
    keyElement.style.left = `${position.x * unitX}%`;
    keyElement.style.top = `${position.y * unitY}%`;
    keyElement.style.width = `${key.width * unitX - .55}%`;
    keyElement.style.height = `${key.height * unitY - .7}%`;
    keyElement.style.setProperty("--rotation", `${key.rotation}deg`);
    keyElement.setAttribute("aria-label", [key.main.label, key.main.shift, key.nums.label, key.autoMouse.label, key.func.label, key.main.hold].filter(Boolean).join(", "));
    if (isCompactMainLabel(key.main.label)) {
      keyElement.classList.add("compact-main-label");
    }
    if (key.nums.label === "Alt+PrSc") keyElement.classList.add("stacked-nums-label");
    else if (key.nums.label.length > 4) keyElement.classList.add("long-nums-label");
    if (key.func.label.length > 4) keyElement.classList.add("long-func-label");
    if (key.nums.label.length === 1) keyElement.classList.add("single-nums-label");
    if (key.func.label.length === 1) keyElement.classList.add("single-func-label");
    if (key.main.hold.length > 6) keyElement.classList.add("long-hold-label");
    keyElement.append(
      text("key-main", key.main.label),
      text("key-main-shift", key.main.shift),
      text("key-nums", key.nums.label),
      autoMouseContent(key.autoMouse),
      text("key-func", key.func.label),
    );
    if (key.main.hold) {
      const hold = text("key-hold", key.main.hold);
      if (key.main.hold === "Num") hold.classList.add("hold-nums");
      if (key.main.hold === "Fn") hold.classList.add("hold-func");
      keyElement.append(hold);
    }
    keyboard.append(keyElement);
  });

  const trackpad = document.createElement("div");
  trackpad.className = "trackpad";
  trackpad.setAttribute("aria-label", "Trackpad");
  trackpad.style.left = `${data.trackpad.x * unitX}%`;
  trackpad.style.top = `${data.trackpad.y * unitY}%`;
  trackpad.style.width = `${data.trackpad.width * unitX - .55}%`;
  trackpad.innerHTML = `
    <div class="trackpad-main">
      <svg class="operation-icon" viewBox="0 0 16 16" aria-hidden="true"><use href="#icon-mouse-left"></use></svg>
      <span>Trackpad</span>
    </div>
    <span class="trackpad-hold">Mouse</span>`;
  keyboard.append(trackpad);

  document.querySelectorAll(".operation-icon").forEach((svg) => {
    const href = svg.querySelector("use")?.getAttribute("href") || "";
      const usesLargeViewBox = ["backspace", "delete", "scroll", "zoom", "move"]
      .some((name) => href === `#icon-${name}`);
    svg.setAttribute("viewBox", usesLargeViewBox ? "0 0 24 24" : "0 0 16 16");
  });

  const setAutoMouseVisibility = (visible) => {
    keyboard.classList.toggle("show-auto-mouse", visible);
    keyboard.setAttribute("data-auto-mouse-visible", String(visible));
    autoMouseGuide.hidden = !visible;
    autoMouseLegend.hidden = !visible;
  };
  setAutoMouseVisibility(autoMouseToggle.checked);
  autoMouseToggle.addEventListener("change", () => {
    setAutoMouseVisibility(autoMouseToggle.checked);
  });

  const syncLegendKeySize = () => {
    const guide = document.querySelector(".legend-key-guide");
    const referenceKey = [...keyboard.querySelectorAll(".key")]
      .find((key) => key.style.getPropertyValue("--rotation") === "0deg");
    if (!guide || !referenceKey) return;
    const referenceBounds = referenceKey.getBoundingClientRect();
    guide.style.width = `${referenceBounds.width}px`;
    guide.style.height = `${referenceBounds.height}px`;
  };
  syncLegendKeySize();
  window.addEventListener("resize", syncLegendKeySize);

  const renderCardToPng = async () => {
    syncLegendKeySize();
    const card = document.querySelector(".keyboard-card");
    const keyboardBounds = keyboard.getBoundingClientRect();
    const bounds = card.getBoundingClientRect();
    const cardWidth = Math.max(bounds.width, card.scrollWidth);
    const padding = 18;
    const width = Math.ceil(cardWidth + padding * 2);
    const height = Math.ceil(bounds.height + padding * 2);
    const scale = 2;
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
      autoMouse: color("--auto-mouse"), hold: color("--hold"),
      key: color("--key"), border: color("--key-border"),
      rule: color("--rule"),
    };
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
      const click = value.match(/^M([123])$/);
      if (click) {
        const clickModes = { "1": "left", "2": "right", "3": "middle" };
        drawMouse(centerX, centerY, clickModes[click[1]], colors.autoMouse);
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
      context.font = `800 13px ${fontFamily}`;
      context.fillStyle = colors.autoMouse;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(value, centerX, centerY);
    };
    const drawOperation = (value, x, y, align, fontSize) => {
      const click = value.match(/^M([123])$/);
      const operation = value.match(/^([MW])([⬅⬇⬆➡])$/);
      context.font = `750 ${fontSize}px ${fontFamily}`;
      context.textBaseline = "bottom";
      context.fillStyle = colors.func;
      context.textAlign = "left";
      if (click) {
        const clickModes = { "1": "left", "2": "right", "3": "middle" };
        const start = align === "right" ? x - 12 : align === "center" ? x - 6 : x;
        drawMouse(start + 5, y - fontSize / 2, clickModes[click[1]]);
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
      drawMouse(start + 5, y - fontSize / 2, operation[1] === "W" ? "wheel" : "pointer");
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
    const keyUnitX = keyboardBounds.width / 15;
    const keyUnitY = keyboardBounds.height / layoutRows;
    data.keys.forEach((key) => {
      if (trackpadKeys.has(matrixId(key.matrix))) return;
      const position = rotatePoint(key.x, key.y, key.rotationX, key.rotationY, key.rotation);
      const x = keyboardX + position.x * keyUnitX;
      const y = keyboardY + position.y * keyUnitY;
      const keyWidth = key.width * keyUnitX - keyboardBounds.width * .0055;
      const keyHeight = key.height * keyUnitY - keyboardBounds.height * .007;
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

      const mainSize = isCompactMainLabel(key.main.label) ? 16 : 20;
      if (key.main.label === "Backspace") {
        drawBackspace(keyWidth / 2, 21);
      } else {
        context.font = `750 ${mainSize}px ${fontFamily}`;
        context.fillStyle = colors.ink;
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(key.main.label, keyWidth / 2, 8);
      }
      if (key.main.shift) {
        context.font = `750 ${mainSize}px ${fontFamily}`;
        context.fillStyle = colors.ink;
        context.textAlign = "right";
        context.textBaseline = "top";
        context.fillText(key.main.shift, keyWidth - 7, 8);
      }

      const auxiliaryY = keyHeight - (key.main.hold ? 18 : 6);
      const numsSize = key.nums.label === "Alt+PrSc" ? 13 : key.nums.label.length > 4 ? 8.5 : key.nums.label.length === 1 ? 15 : 13;
      const funcSize = key.nums.label === "Alt+PrSc" ? 13 : key.func.label.length > 4 ? 8.5 : key.func.label.length === 1 ? 15 : 13;
      const numsX = key.nums.label === "Alt+PrSc" ? 4 : 5;
      const funcX = keyWidth - (key.nums.label === "Alt+PrSc" ? 3 : 5);
      context.fillStyle = colors.nums;
      context.font = `750 ${numsSize}px ${fontFamily}`;
      context.textAlign = "left";
      context.textBaseline = "bottom";
      if (key.nums.label === "Alt+PrSc") {
        context.fillText("Alt+", numsX, auxiliaryY - numsSize);
        context.fillText("PrSc", numsX, auxiliaryY);
      } else {
        context.fillText(key.nums.label, numsX, auxiliaryY);
      }
      drawOperation(key.func.label, funcX, auxiliaryY, "right", funcSize);
      if (autoMouseToggle.checked && key.autoMouse.label) {
        drawAutoMouseValue(key.autoMouse, keyWidth / 2, keyHeight * .6);
      }

      if (key.main.hold) {
        const holdColor = key.main.hold === "Num" ? colors.nums : key.main.hold === "Fn" ? colors.func : colors.hold;
        context.beginPath();
        context.moveTo(5, keyHeight - 15);
        context.lineTo(keyWidth - 5, keyHeight - 15);
        context.strokeStyle = colors.ink;
        context.lineWidth = .7;
        context.stroke();
        context.font = `500 ${key.main.hold.length > 6 ? 8.5 : 13}px ${fontFamily}`;
        context.fillStyle = holdColor;
        context.textAlign = "center";
        context.textBaseline = "bottom";
        context.fillText(key.main.hold, keyWidth / 2, keyHeight - 2);
      }
      context.restore();
    });

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
    context.textBaseline = "bottom";
    context.textAlign = "left";
    context.fillStyle = colors.nums;
    context.fillText("Num", guideX + 5, guideY + guideBounds.height - 18);
    if (autoMouseToggle.checked) {
      context.textAlign = "center";
      context.fillStyle = colors.autoMouse;
      context.fillText("Mouse", guideX + guideBounds.width / 2, guideY + guideBounds.height - 31);
    }
    context.textAlign = "right";
    context.fillStyle = colors.func;
    context.fillText("Fn", guideX + guideBounds.width - 5, guideY + guideBounds.height - 18);
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
    drawLegendColumn(".legend-clicks", ["left", "right", "middle"], false);
    drawLegendColumn(".legend-mouse", ["pointer", "wheel"], true);
    if (autoMouseToggle.checked) {
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

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG conversion failed")), "image/png");
    });
  };

  copyButton.addEventListener("click", async () => {
    copyButton.disabled = true;
    copyStatus.textContent = "PNGを生成しています…";
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("Clipboard API is unavailable");
      }
      const png = await renderCardToPng();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      copyStatus.textContent = "PNGをクリップボードにコピーしました。";
    } catch (error) {
      console.error(error);
      copyStatus.textContent = "コピーできませんでした。Chromeなどの対応ブラウザで開いてください。";
    } finally {
      copyButton.disabled = false;
    }
  });

})();
