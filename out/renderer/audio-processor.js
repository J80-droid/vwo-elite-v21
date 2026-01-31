// public/audio-processor.js

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // ~128ms chunks
    this.buffer = new Float32Array(this.bufferSize);
    this.byteCount = 0;

    // Drempelwaarde voor stilte (aanpasbaar)
    // 0.01 is meestal goed voor normale spraak. Zet lager (0.005) als mic zacht is.
    this.silenceThreshold = 0.01;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const channelData = input[0];

      // 1. Bereken gemiddeld volume van dit kleine blokje (RMS)
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);

      // 2. Als het muisstil is, negeer dit blokje direct (bespaart CPU en buffer logica)
      // We gebruiken een iets lagere threshold hier om niet te agressief woord-eindes af te kappen
      if (rms < this.silenceThreshold) {
        // Optioneel: Je zou hier een teller kunnen bijhouden om na X seconden stilte 
        // een signaal naar de UI te sturen dat de user zwijgt.
        return true;
      }

      // 3. Alleen als er geluid is, vullen we de buffer
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.byteCount] = channelData[i];
        this.byteCount++;

        if (this.byteCount === this.bufferSize) {
          this.port.postMessage(this.buffer.slice());
          this.byteCount = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
