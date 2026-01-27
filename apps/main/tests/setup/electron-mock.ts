/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { EventEmitter } from "events";

// Simuleer de IPC bus
export const ipcBus = new EventEmitter();

// Helper om logs te onderdrukken tenzij debugging aan staat
const logError = (context: string, error: any) => {
  if (process.env.DEBUG_MOCKS === "true") {
    console.error(`[Electron Mock] Error in ${context}:`, error);
  }
};

export const app = {
  getPath: () => "/tmp/vwo-elite-test-data",
  isPackaged: false,
  whenReady: () => Promise.resolve(),
};

export const BrowserWindow = {
  getAllWindows: () => [
    {
      webContents: {
        send: (channel: string, ...args: any[]) => {
          ipcBus.emit(`renderer:${channel}`, ...args);
        },
      },
      isDestroyed: () => false,
    },
  ],
  fromWebContents: () => ({
    webContents: {
      send: (channel: string, ...args: any[]) => {
        ipcBus.emit(`renderer:${channel}`, ...args);
      },
    },
    isDestroyed: () => false,
  }),
};

export const ipcMain = {
  handle: (channel: string, listener: any) => {
    ipcBus.on(`invoke:${channel}`, async ({ id, args }: any) => {
      try {
        // Construct a fake event object
        const event = {
          sender: {
            send: (chan: string, ...a: any[]) =>
              ipcBus.emit(`renderer:${chan}`, ...a),
          },
        };

        const result = await listener(event, args);
        ipcBus.emit(`reply:${id}`, { success: true, result });
      } catch (error) {
        logError(`handler for ${channel}`, error);
        ipcBus.emit(`reply:${id}`, { success: false, error });
      }
    });
  },
  removeHandler: (channel: string) => {
    ipcBus.removeAllListeners(`invoke:${channel}`);
  },
  emit: (channel: string, data: any) => {
    ipcBus.emit(`renderer:${channel}`, data);
  },
  on: (channel: string, listener: any) => {
    ipcBus.on(`main:${channel}`, listener);
  },
  removeListener: (channel: string, listener: any) => {
    ipcBus.removeListener(`main:${channel}`, listener);
  },
  removeAllListeners: (channel?: string) => {
    if (channel) {
      ipcBus.removeAllListeners(channel);
    } else {
      ipcBus.removeAllListeners();
    }
  },
};

export const ipcRenderer = {
  invoke: (channel: string, args: any) => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const replyHandler = ({ success, result, error }: any) => {
        ipcBus.off(`reply:${id}`, replyHandler); // Cleanup listener
        if (success) resolve(result);
        else reject(error);
      };
      ipcBus.on(`reply:${id}`, replyHandler);
      ipcBus.emit(`invoke:${channel}`, { id, args });
    });
  },
  on: (channel: string, listener: any) => {
    ipcBus.on(`renderer:${channel}`, (...args: any[]) => {
      const event = { sender: { send: () => {} } };
      listener(event, ...args);
    });
  },
  send: (channel: string, ...args: any[]) => {
    ipcBus.emit(`main:${channel}`, ...args);
  },
};

// Mock global window for frontend-like usage if needed
if (typeof global !== "undefined") {
  (global as any).window = {
    vwoApi: ipcRenderer,
  };
}
