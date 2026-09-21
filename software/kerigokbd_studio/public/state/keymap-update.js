import { readLayerKeycodes } from "../hid/via-protocol.js";

// Snapshot all addressed keys before writing. Verify writes by reading the device back.
export async function overwriteKeymap(client, layout, layers, onProgress = () => {}) {
  const read = async () => {
    const result = [];
    for (let layer = 0; layer < layers.length; layer++) {
      const grid = await readLayerKeycodes(client, layer, layout.matrixRows, layout.matrixCols);
      result.push(layout.keys.map(({ matrix: [row, col] }) => grid[row][col]));
    }
    return result;
  };
  const write = async (values, progress) => {
    const total = values.length * layout.keys.length;
    let done = 0;
    for (let layer = 0; layer < values.length; layer++) {
      for (let index = 0; index < layout.keys.length; index++) {
        const [row, col] = layout.keys[index].matrix;
        await client.setKeycode(layer, row, col, values[layer][index]);
        if (++done % 12 === 0 || done === total) onProgress(`${progress} ${done}/${total}`);
      }
    }
  };
  onProgress("現在のキーマップを保存しています…");
  const backup = await read();
  try {
    await write(layers, "最新版を書き込み中…");
    const actual = await read();
    if (JSON.stringify(actual) !== JSON.stringify(layers)) throw new Error("書き込み後の照合に失敗しました。");
    return actual;
  } catch (error) {
    try {
      await write(backup, "更新前のキーマップに復元中…");
      if (JSON.stringify(await read()) !== JSON.stringify(backup)) throw new Error("復元の照合に失敗しました。");
    } catch {
      throw new Error("更新と復元に失敗しました。キーマップが一部だけ変更されている可能性があります。再接続して再読込し、再度更新してください。", { cause: error });
    }
    throw new Error("更新に失敗したため、更新前のキーマップに戻しました。", { cause: error });
  }
}
