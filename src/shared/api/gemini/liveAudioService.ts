/**
 * LiveAudioService
 * Handles high-performance, low-latency audio capture and playback for Gemini Live.
 * Uses AudioWorklet for off-main-thread PCM processing.
 */
export class LiveAudioService {
    private audioContext: AudioContext | null = null;
    private processor: AudioWorkletNode | null = null;
    private stream: MediaStream | null = null;
    private isRunning = false;

    constructor(private onAudioData: (base64: string) => void) { }

    async start() {
        if (this.isRunning) return;

        try {
            // 1. Initialize Context with 'interactive' latency hint
            // Note: We use 16000Hz because Gemini expects 16kHz Mono PCM for input
            this.audioContext = new AudioContext({
                latencyHint: "interactive",
                sampleRate: 16000,
            });

            // 2. Access Microphone with standard VWO Elite quality constraints
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                },
            });

            const source = this.audioContext.createMediaStreamSource(this.stream);

            // 3. Load and connect AudioWorklet
            // Note: pcm-processor.js must be in the public/ folder
            await this.audioContext.audioWorklet.addModule("/pcm-processor.js");
            this.processor = new AudioWorkletNode(this.audioContext, "pcm-processor");

            this.processor.port.onmessage = (event) => {
                // Event data is the Int16 ArrayBuffer
                const buffer = event.data;
                const base64 = this.arrayBufferToBase64(buffer);
                this.onAudioData(base64);
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRunning = true;
            console.log("[LiveAudioService] Started (16kHz, Interactive Latency)");
        } catch (error) {
            console.error("[LiveAudioService] Start failed:", error);
            throw error;
        }
    }

    /**
     * Play incoming raw PCM binary from the model
     * Models like Gemini 2.0/2.5 Native Audio return 24kHz PCM
     */
    async playRawChunk(arrayBuffer: ArrayBuffer, sampleRate = 24000) {
        if (!this.audioContext) return;

        // Convert Int16 to Float32 for Web Audio playback
        const int16 = new Int16Array(arrayBuffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            const val = int16[i];
            if (val !== undefined) {
                float32[i] = val / 32768.0;
            }
        }

        const buffer = this.audioContext.createBuffer(1, float32.length, sampleRate);
        buffer.getChannelData(0).set(float32);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        // Resume context if suspended (common browser policy)
        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        source.start(0);
    }

    /**
     * Play a pre-decoded AudioBuffer
     */
    async playAudioBuffer(buffer: AudioBuffer) {
        if (!this.audioContext) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
        source.start(0);
    }

    stop() {
        this.isRunning = false;
        this.processor?.disconnect();
        this.stream?.getTracks().forEach((t) => t.stop());
        this.audioContext?.close().catch(() => { });

        this.processor = null;
        this.stream = null;
        this.audioContext = null;
        console.log("[LiveAudioService] Stopped");
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]!);
        }
        return window.btoa(binary);
    }
}
