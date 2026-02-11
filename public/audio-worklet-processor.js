class LinearPCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = []
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const channelData = input[0]

    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      this._buffer.push(sample * 32767)
    }

    // Send 80ms chunks (1280 samples at 16kHz)
    while (this._buffer.length >= 1280) {
      const chunk = new Int16Array(this._buffer.splice(0, 1280))
      this.port.postMessage(chunk.buffer, [chunk.buffer])
    }

    return true
  }
}

registerProcessor("linear-pcm-processor", LinearPCMProcessor)
