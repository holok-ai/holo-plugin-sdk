Great — here’s the updated design doc with an **“ErrorResponse vs NormalResponse” contrast section** added.

---

# 🛡️ Guard Failure Error Response Design

## **1. Motivation**

When requests fail **pre-execution guard checks** (e.g., PII detection, profanity, policy violations), we must provide a **synthetic error response** that looks indistinguishable from a provider’s natural streaming output.

This ensures:
- **Statelessness** – clients don’t need to special-case “errors.”
- **Losslessness** – round-tripping between providers preserves fidelity.
- **Uniformity** – Claude, OpenAI, Ollama, and others all receive equivalent responses.

---

## **2. Canonical Holo Model**

All guard-failure responses normalize into a standard **HoloStreamChunk sequence**:

### Example (text)
```ts
message_start → content_delta → message_stop
```

### Example (json)
```ts
message_start → content_delta (JSON string) → message_stop
```

Each sequence:
- **MUST include** `message_start` and `message_stop`.
- **MUST wrap** payloads inside `content_delta`.
- **SHOULD send entire error message as one delta** (no artificial chunking).
- **MAY embed structured JSON** (stringified) if response_format = json.

---

## **3. HoloStreamChunk Examples**

### A. Text
```jsonc
{
  "id": "err-123",
  "model": "guard-checker",
  "delta": { "type": "message_start", "provider": "holo", "delta": { "role": "assistant" } }
}
{
  "id": "err-123",
  "model": "guard-checker",
  "delta": { "type": "content_delta", "provider": "holo", "delta": { "content": "We were unable to process your request due to failing security checks." } }
}
{
  "id": "err-123",
  "model": "guard-checker",
  "delta": { "type": "message_stop", "provider": "holo", "delta": {} },
  "finish_reason": "stop"
}
```

### B. JSON
```jsonc
{
  "id": "err-124",
  "model": "guard-checker",
  "delta": { "type": "message_start", "provider": "holo", "delta": { "role": "assistant" } }
}
{
  "id": "err-124",
  "model": "guard-checker",
  "delta": { "type": "content_delta", "provider": "holo", "delta": { "content": "{\"error\":\"Request failed guard checks\",\"guards\":[{\"name\":\"PII_Detector\",\"errors\":[\"Detected SSN-like pattern\"]}]}" } }
}
{
  "id": "err-124",
  "model": "guard-checker",
  "delta": { "type": "message_stop", "provider": "holo", "delta": {} },
  "finish_reason": "stop"
}
```

---

## **4. Provider Translations**

- **Claude**  
  Requires: `message_start → content_block_start → content_block_delta → content_block_stop → message_stop`  
  JSON is stringified inside a **content block**.

- **OpenAI**  
  Requires: streamed `chat.completion.chunk`s.  
  One delta sets `role=assistant`.  
  One delta carries **text or JSON string**.  
  Final delta has `finish_reason: stop`.

- **Ollama**  
  Streams with `"response"` keys.  
  Text or JSON string is sent as a single `"response"`.  
  `"done": true` marks completion.

---

## **5. Implementation Notes**

- **Max delta size**: For guard failures, send the entire error as one chunk (since it’s synthetic, not generated).
- **Round-trip safety**: If a client replays this through another provider translator, it will no-op where necessary.
- **Stateless orchestration**: No prior context required; every error response is fully self-contained.

---

## **6. Example Guard Failure**

### User request:
```text
"What is my SSN? It's 123-45-6789"
```

### Response (text):
```text
We were unable to process your request due to failing security checks.
```

### Response (json):
```json
{
  "error": "Request failed guard checks",
  "guards": [
    {"name":"PII_Detector","errors":["Detected SSN-like pattern"]}
  ]
}
```

---

# ⚖️ 7. ErrorResponse vs NormalResponse Contrast

To avoid confusion, here’s a side-by-side look at how **success** vs **guard failure** differs — structurally the same, semantically different.

| **Stage**     | **Normal Response (Chat, Text)**                                                                                 | **Error Response (Guard Failure, Text)**                                                                    |
|---------------|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `message_start` | role=assistant                                                                                                   | role=assistant                                                                                              |
| `content_delta` | `"Sure, here’s the answer: 42."`                                                                                | `"We were unable to process your request due to failing security checks."`                                   |
| `message_stop`  | `finish_reason: stop`                                                                                           | `finish_reason: stop`                                                                                       |

| **Stage**     | **Normal Response (Chat, JSON)**                                                                                 | **Error Response (Guard Failure, JSON)**                                                                    |
|---------------|------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `message_start` | role=assistant                                                                                                   | role=assistant                                                                                              |
| `content_delta` | `{"result":42}`                                                                                                  | `{"error":"Request failed guard checks","guards":[{"name":"PII_Detector","errors":["Detected SSN-like pattern"]}]}` |
| `message_stop`  | `finish_reason: stop`                                                                                           | `finish_reason: stop`                                                                                       |

**Key insight:**
- Both flows use identical **streaming primitives** (`message_start → content_delta → message_stop`).
- The **only difference** is **content semantics** (answer vs error).
- This ensures clients can consume guard failures exactly like normal output.

---

# 📊 8. Provider Comparison Appendix

| **Stage**              | **Holo (canonical)**                                                                                                      | **Claude**                                                                                                                                | **OpenAI**                                                                                                                     | **Ollama**                                                                                           |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| **Start**               | `message_start` with `role: assistant`                                                                                   | `{"type":"message_start","message":{"id":"…","role":"assistant"}}`                                                                        | `{"object":"chat.completion.chunk","choices":[{"delta":{"role":"assistant"}}]}`                                                | `{ "response": "", "done": false }` (first empty frame optional)                                     |
| **Content/Text**        | `content_delta` with `delta.content = "We were unable to process..."`                                                     | `{"type":"content_block_start","index":0,"content_block":{"type":"text"}}` <br> `{"type":"content_block_delta","delta":{"text":"We…"}}`   | `{"object":"chat.completion.chunk","choices":[{"delta":{"content":"We were unable to process…"}}]}`                             | `{ "response": "We were unable to process your request due to failing security checks.", "done": false }` |
| **Content/JSON**        | `content_delta` with `delta.content = JSON.stringify({...})`                                                              | Same as above but inside `content_block_delta.text`                                                                                       | Same as above but inside `delta.content` (stringified JSON)                                                                     | `{ "response": "{\"error\":\"…\"}", "done": false }`                                                 |
| **Stop**                | `message_stop` with `finish_reason: stop`                                                                                 | `{"type":"content_block_stop","index":0}` <br> `{"type":"message_stop"}`                                                                  | `{"object":"chat.completion.chunk","choices":[{"finish_reason":"stop"}]}`                                                       | `{ "done": true }`                                                                                   |

---

✅ With this contrast added, devs can clearly see:
- Errors **look like normal responses**, just with different content.
- Clients need **no special branching**.

---

Would you like me to also add **sample code snippets** (TypeScript functions) that generate both a text and JSON guard error in Holo format? That would make it directly plug-and-play in your orchestrator.
