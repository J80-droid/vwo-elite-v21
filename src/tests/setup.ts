
import { vi } from 'vitest';

// Mock the Electron IPC capabilities exposed via contextBridge
// This prevents "window.vwoApi is undefined" errors in unit tests

const mockVwoApi = {
    invoke: vi.fn().mockImplementation((channel, ...args) => {
        console.log(`[MockIPC] invoke: ${channel}`, args);
        return Promise.resolve(null);
    }),
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn(),
    // Add other properties found in your IPC bridge if necessary
    documents: {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        delete: vi.fn(),
    },
    system: {
        getPlatform: vi.fn().mockReturnValue('win32'),
    }
};

// Assign to global window
vi.stubGlobal('vwoApi', mockVwoApi);

// Ensure window.vwoApi is available
if (typeof window !== "undefined") {
    (window as unknown as { vwoApi: typeof mockVwoApi }).vwoApi = mockVwoApi;
}

console.log('✅ Global vwoApi mock initialized for tests');
