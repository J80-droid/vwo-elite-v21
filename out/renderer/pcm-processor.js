/**
 * PCM Processor (AudioWorklet)
 * Converts Float32 to Int16 and applies silence thresholding in a high-priority thread.
 */
class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 2048;
        this.buffer = new Float32Array(this.bufferSize);
        this.ptr = 0;
        this.silenceThreshold = 0.005; // Slightly more sensitive for VWO Elite
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0];

        // 1. RMS Calculation for noise gate
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        // 2. Gate logic
        if (rms < this.silenceThreshold) {
            return true;
        }

        // 3. Buffer & Convert
        for (let i = 0; i < channelData.length; i++) {
            this.buffer[this.ptr] = channelData[i];
            this.ptr++;

            if (this.ptr === this.bufferSize) {
                // Convert the full buffer to Int16
                const pcm16 = new Int16Array(this.bufferSize);
                for (let j = 0; j < this.bufferSize; j++) {
                    const sample = Math.max(-1, Math.min(1, this.buffer[j]));
                    pcm16[j] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                }

                // Send binary buffer directly (transferable)
                this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
                this.ptr = 0;
            }
        }

        return true;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
