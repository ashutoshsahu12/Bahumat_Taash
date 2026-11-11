const REQUEST_TIMEOUT_MS = 8000;
const RECONNECT_DELAY_MS = 1500;

export function getRoomSocketUrl() {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (configuredUrl) return configuredUrl;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = ["5173", "4173"].includes(window.location.port) ? ":8080" : "";
  return `${protocol}//${window.location.hostname}${port}`;
}

export class RoomConnection {
  constructor({ onStatusChange, onMessage }) {
    this.onStatusChange = onStatusChange;
    this.onMessage = onMessage;
    this.socket = null;
    this.pending = new Map();
    this.requestId = 0;
    this.credentials = null;
    this.reconnectTimer = null;
    this.disposed = false;
  }

  connect() {
    if (this.disposed) return Promise.reject(new Error("Connection has been closed."));
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.onStatusChange("connecting");
    this.connectPromise = new Promise((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(getRoomSocketUrl());
      this.socket = socket;

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.close();
        reject(new Error("Could not connect to the room server. Try again or play offline."));
      }, REQUEST_TIMEOUT_MS);

      socket.addEventListener("open", () => {
        clearTimeout(timeout);
        this.onStatusChange("connected");
        if (this.credentials) {
          this.requestOnOpen({ t: "resume", ...this.credentials });
        }
        settled = true;
        resolve();
      }, { once: true });

      socket.addEventListener("message", (event) => this.handleMessage(event));
      socket.addEventListener("error", () => {
        if (!settled) {
          clearTimeout(timeout);
          settled = true;
          reject(new Error("Could not connect to the room server. Try again or play offline."));
        }
      });
      socket.addEventListener("close", () => {
        clearTimeout(timeout);
        this.socket = null;
        this.connectPromise = null;
        this.onStatusChange("disconnected");
        this.rejectPending(new Error("Connection to the room server was lost."));
        if (this.credentials && !this.disposed) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.connect().catch(() => {});
          }, RECONNECT_DELAY_MS);
        }
      }, { once: true });
    });

    return this.connectPromise;
  }

  requestOnOpen(payload) {
    const requestId = `room-${++this.requestId}`;
    this.pending.set(requestId, {
      resolve: () => {},
      reject: () => {},
      timeout: setTimeout(() => this.pending.delete(requestId), REQUEST_TIMEOUT_MS)
    });
    this.socket.send(JSON.stringify({ ...payload, requestId }));
  }

  async request(payload) {
    await this.connect();
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Connection to the room server is unavailable.");
    }

    const requestId = `room-${++this.requestId}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("The room server did not respond. Please try again."));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(requestId, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ ...payload, requestId }));
    });
  }

  handleMessage(event) {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      this.onStatusChange("disconnected");
      return;
    }

    if (message.requestId && this.pending.has(message.requestId)) {
      const request = this.pending.get(message.requestId);
      clearTimeout(request.timeout);
      this.pending.delete(message.requestId);
      if (message.t === "error") request.reject(new Error(message.message || "Room request failed."));
      else request.resolve(message);
    }
    this.onMessage(message);
  }

  setCredentials(credentials) {
    if (!credentials && this.credentials) {
      this.send({ t: "leave", code: this.credentials.code });
    }
    this.credentials = credentials;
    if (!credentials) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  rejectPending(error) {
    this.pending.forEach((request) => {
      clearTimeout(request.timeout);
      request.reject(error);
    });
    this.pending.clear();
  }

  close() {
    this.disposed = true;
    clearTimeout(this.reconnectTimer);
    this.credentials = null;
    this.rejectPending(new Error("Connection closed."));
    this.socket?.close();
    this.socket = null;
  }
}
