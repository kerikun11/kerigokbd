// Physical key placement math shared by every keyboard-shaped renderer
// (the per-layer editor view and the all-layers cheat sheet view).

// A handful of thumb-cluster keys are stored pre-rotation (KLE convention:
// rotate around (rotationX, rotationY) by `rotation` degrees) -- their raw
// x/y is not where they end up on screen, so both the grid extent and each
// key's position must go through this before being used as a percentage.
export function rotatePoint(x, y, originX, originY, degrees) {
  const radians = (degrees * Math.PI) / 180;
  const deltaX = x - originX;
  const deltaY = y - originY;
  return {
    x: originX + Math.cos(radians) * deltaX - Math.sin(radians) * deltaY,
    y: originY + Math.sin(radians) * deltaX + Math.cos(radians) * deltaY,
  };
}

export function keyPosition(key) {
  return rotatePoint(key.x, key.y, key.rotationX, key.rotationY, key.rotation);
}

export function layoutExtent(layout) {
  let maxX = 0;
  let maxY = 0;
  for (const key of layout.keys) {
    const position = keyPosition(key);
    maxX = Math.max(maxX, position.x + key.width);
    maxY = Math.max(maxY, position.y + key.height);
  }
  return { columns: maxX, rows: maxY };
}
