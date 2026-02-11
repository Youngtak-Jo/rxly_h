import { createClient, type DeepgramClient } from "@deepgram/sdk"

let _client: DeepgramClient | null = null

export function getDeepgramClient(): DeepgramClient {
  if (!_client) {
    _client = createClient(process.env.DEEPGRAM_API_KEY!)
  }
  return _client
}
