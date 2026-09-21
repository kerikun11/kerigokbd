// Thin wrapper around the WebHID API (navigator.hid). This is the only
// module in the editor that touches a browser-only API, so via-protocol.js
// and everything above it can be unit-tested without a browser by passing
// a mock `exchange` function instead of an HidTransport instance.

import { RAW_REPORT_SIZE } from "./via-protocol.js";

// KERIgoKBD's USB VID/PID (software/qmk/keyboards/kerigokbd/*/info.json).
export const KERIGOKBD_USB_FILTER = { vendorId: 0x1209, productId: 0xe501 };
// QMK's raw HID usage page/id (tmk_core/protocol/usb_descriptor.h), shared
// by VIA and this editor -- both talk to the same RAW_ENABLE interface.
const VIA_USAGE_PAGE = 0xff60;
const VIA_USAGE = 0x61;

export class HidUnsupportedError extends Error {
  constructor() {
    super("WebHID is not available in this browser. Use Chrome, Edge, or another Chromium-based browser.");
    this.name = "HidUnsupportedError";
  }
}

export class HidTransport extends EventTarget {
  #device = null;
  #pending = null;

  static isSupported() {
    return typeof navigator !== "undefined" && "hid" in navigator;
  }

  get device() {
    return this.#device;
  }

  get connected() {
    return this.#device?.opened ?? false;
  }

  /** Prompts the user (via the browser's device picker) to choose a keyboard, then opens it. */
  async requestAndOpen() {
    if (!HidTransport.isSupported()) throw new HidUnsupportedError();
    const [device] = await navigator.hid.requestDevice({
      filters: [{ ...KERIGOKBD_USB_FILTER, usagePage: VIA_USAGE_PAGE, usage: VIA_USAGE }],
    });
    if (!device) throw new Error("No device was selected.");
    await this.#open(device);
  }

  /** Re-opens a device the user already granted access to in a previous session, if any is still present. */
  async openPreviouslyGrantedDevice() {
    if (!HidTransport.isSupported()) throw new HidUnsupportedError();
    const devices = await navigator.hid.getDevices();
    const device = devices.find(
      (candidate) => candidate.vendorId === KERIGOKBD_USB_FILTER.vendorId
        && candidate.productId === KERIGOKBD_USB_FILTER.productId
        && candidate.collections.some((collection) => collection.usagePage === VIA_USAGE_PAGE && collection.usage === VIA_USAGE),
    );
    if (!device) return false;
    await this.#open(device);
    return true;
  }

  async #open(device) {
    if (!device.opened) await device.open();
    this.#device = device;
    device.addEventListener("inputreport", this.#onInputReport);
    navigator.hid.addEventListener("disconnect", this.#onDisconnect);
    this.dispatchEvent(new CustomEvent("connect", { detail: { device } }));
  }

  async close() {
    if (!this.#device) return;
    this.#device.removeEventListener("inputreport", this.#onInputReport);
    navigator.hid.removeEventListener("disconnect", this.#onDisconnect);
    if (this.#device.opened) await this.#device.close();
    this.#device = null;
  }

  #onDisconnect = (event) => {
    if (event.device !== this.#device) return;
    this.#device = null;
    this.#pending?.reject(new Error("Device disconnected"));
    this.#pending = null;
    this.dispatchEvent(new CustomEvent("disconnect"));
  };

  #onInputReport = (event) => {
    if (!this.#pending) return; // unsolicited report; VIA is strictly request/response
    const bytes = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
    const { resolve } = this.#pending;
    this.#pending = null;
    resolve(bytes);
  };

  /**
   * Sends one 32-byte VIA report and resolves with the 32-byte response.
   * VIA is a strict request/response protocol over a single report id (0),
   * so calls are serialised: a caller must await one exchange() before
   * issuing the next (sync-engine.js honours this by never firing writes
   * concurrently).
   */
  async exchange(request) {
    if (!this.#device) throw new Error("Not connected");
    if (this.#pending) throw new Error("Another VIA request is already in flight");
    if (request.length !== RAW_REPORT_SIZE) {
      throw new RangeError(`VIA reports must be exactly ${RAW_REPORT_SIZE} bytes`);
    }
    const responsePromise = new Promise((resolve, reject) => {
      this.#pending = { resolve, reject };
    });
    await this.#device.sendReport(0x00, request);
    return responsePromise;
  }
}
