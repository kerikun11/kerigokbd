import { HidTransport } from "../hid/hid-transport.js";

const STATE_LABELS = {
  disconnected: "未接続",
  connecting: "接続中…",
  connected: "接続済み",
  error: "エラー",
};

export function renderConnectionBar(container, store, handlers) {
  const { connectionState, connectionError, protocolVersion, keyboardId, deviceInfo } = store;

  const status = document.createElement("span");
  status.className = `connection-status is-${connectionState}`;
  status.textContent = STATE_LABELS[connectionState] ?? connectionState;

  const info = document.createElement("span");
  info.className = "connection-info";
  if (connectionState === "connected" && protocolVersion !== null) {
    info.textContent = `${keyboardId} / VIA protocol 0x${protocolVersion.toString(16).padStart(4, "0")}`;
    if (deviceInfo) {
      const hex = (value) => value.toString(16).toUpperCase().padStart(4, "0");
      const ids = document.createElement("span");
      ids.className = "connection-device-ids";
      ids.textContent = `VID:PID ${hex(deviceInfo.vendorId)}:${hex(deviceInfo.productId)}`;
      info.append(ids);
    }
  } else if (connectionState === "error" && connectionError) {
    info.textContent = connectionError;
  }

  const connectButton = document.createElement("button");
  connectButton.type = "button";
  connectButton.className = "primary-button";
  connectButton.textContent = "実機に接続";
  connectButton.disabled = connectionState === "connecting" || connectionState === "connected";
  connectButton.addEventListener("click", handlers.onConnect);

  const disconnectButton = document.createElement("button");
  disconnectButton.type = "button";
  disconnectButton.className = "secondary-button";
  disconnectButton.textContent = "切断";
  disconnectButton.disabled = connectionState !== "connected";
  disconnectButton.addEventListener("click", handlers.onDisconnect);

  const nodes = [status];
  if (!HidTransport.isSupported()) {
    const warning = document.createElement("span");
    warning.className = "connection-warning";
    warning.textContent = "このブラウザはWebHIDに対応していません。Chrome/Edgeでお試しください。";
    nodes.push(warning);
  } else {
    nodes.push(connectButton, disconnectButton, info);
  }
  container.replaceChildren(...nodes);
}
