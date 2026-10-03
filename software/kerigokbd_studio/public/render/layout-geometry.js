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

/**
 * The tight bounding box of every key (all four corners, after rotation)
 * and the trackpad, in key units: `originX`/`originY` is its top-left, to
 * subtract from each position, so a layout whose VIA JSON starts away
 * from (0, 0) (kerigokbd_corne_v4's starts at (0.5, 1)) isn't drawn with
 * that empty margin.
 */
export function layoutExtent(layout) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = ({ x, y }) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const key of layout.keys) {
    for (const [dx, dy] of [[0, 0], [key.width, 0], [0, key.height], [key.width, key.height]]) {
      include(rotatePoint(key.x + dx, key.y + dy, key.rotationX, key.rotationY, key.rotation));
    }
  }
  const { trackpad } = layout;
  if (trackpad) {
    include({ x: trackpad.x, y: trackpad.y });
    include({ x: trackpad.x + trackpad.width, y: trackpad.y + trackpad.height });
  }
  return { originX: minX, originY: minY, columns: maxX - minX, rows: maxY - minY };
}
