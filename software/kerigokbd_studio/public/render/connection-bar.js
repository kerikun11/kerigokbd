import { HidTransport } from "../hid/hid-transport.js";

const STATE_LABELS = {
  disconnected: "未接続",
  connecting: "接続中…",
  connected: "接続済み",
  error: "エラー",
};

/**
 * Renders the デバイス group's connection pieces: a status pill, one
 * button that toggles between 実機に接続 and 切断, and a single muted
 * info line (protocol + VID:PID, the connection error, or the WebHID
 * warning) -- kept to as few rows as possible.
 */
export function renderConnectionBar({ status, toggle, info }, store, handlers) {
  const { connectionState, connectionError, protocolVersion, deviceInfo } = store;
  const supported = HidTransport.isSupported();

  status.className = `connection-status is-${connectionState}`;
  status.textContent = STATE_LABELS[connectionState] ?? connectionState;

  const button = document.createElement("button");
  button.type = "button";
  if (connectionState === "connected") {
    button.className = "secondary-button";
    button.textContent = "切断";
    button.addEventListener("click", handlers.onDisconnect);
  } else {
    button.className = "primary-button";
    button.textContent = connectionState === "connecting" ? "接続中…" : "実機に接続";
    button.disabled = !supported || connectionState === "connecting";
    button.addEventListener("click", handlers.onConnect);
  }
  toggle.replaceChildren(button);

  info.classList.toggle("is-warning", !supported || connectionState === "error");
  if (!supported) {
    info.textContent = "このブラウザはWebHIDに対応していません。Chrome/Edgeでお試しください。";
  } else if (connectionState === "connected" && protocolVersion !== null) {
    const hex = (value) => value.toString(16).toUpperCase().padStart(4, "0");
    const ids = deviceInfo ? ` · VID:PID ${hex(deviceInfo.vendorId)}:${hex(deviceInfo.productId)}` : "";
    info.textContent = `VIA 0x${hex(protocolVersion)}${ids}`;
  } else if (connectionState === "error" && connectionError) {
    info.textContent = connectionError;
  } else {
    info.textContent = "";
  }
}
