Here’s a tight checklist + playbook for a **stateful Claude orchestrator** that injects the extra lifecycle events Claude needs (e.g., `content_block_stop`) while consuming/producing your normalized Holo stream.

# Goals
- Consume **HoloStreamChunk** (stateless, 1 delta at a time).
- Maintain **minimal state** across chunks.
- Emit a **Claude event stream** that includes any **synthetic** events Claude expects but Holo (or other providers) doesn’t expose (notably `content_block_stop`).
- Never mutate payloads; **carry raw provider events** via `provider_delta` when present.

---

# Orchestrator Responsibilities

1) **Track message/session scope**
- `messageId` (from `message_start` or generated for first chunk)
- `model`
- `started` / `stopped` flags

2) **Track active content block**
- `activeBlockIndex: number | null`
- `activeBlockType: 'text' | 'tool_use' | 'image' | 'other' | null`
- `activeToolCallId?: string`
- Whether we’ve **started** the block (emitted `content_block_start`) and whether we’ve **stopped** it (emitted `content_block_stop`)

3) **Track tool-call accumulation (best-effort)**
- For each tool-call index:
    - `id?: string`
    - `name?: string`
    - `argsFragments: string[]` (if you choose to accumulate for downstream convenience; optional)

4) **Event synthesis rules**
- Emit `content_block_start` when:
    - first text/token arrives and no block is active, **or**
    - a new **tool call shell** appears (Holo `message_delta` with tool call shell), **or**
    - the block index changes (`delta.index` differs from `activeBlockIndex`)
- Emit `content_block_stop` when:
    - the block index changes (close previous block), **or**
    - `message_stop` occurs while a block is active, **or**
    - you detect a **tool-args sequence finished** (optional heuristic; otherwise let `message_stop` close it)
- Pass through `content_block_delta` when:
    - text deltas arrive (`content_delta` → `text_delta`)
    - tool-args fragments arrive (Holo `provider_delta` holding Claude `input_json_delta`)
- Emit `message_start` once per reply (if not already seen)
- Emit `message_delta` for usage/finish_reason updates (map from Holo’s `message_delta` where present)
- Emit `message_stop` exactly once, **after** closing any open block

---

# Input → Output Mapping (with state)

### On Holo `message_start`
- If `!started`:
    - Emit **Claude `message_start`** with `{ id, model, role:'assistant', content:[] }`
    - `started = true; stopped = false`

### On Holo `content_delta` (text)
- If `activeBlockIndex == null` **or** index changed:
    - If `activeBlockIndex != null` → **emit `content_block_stop`** for the previous block
    - **emit `content_block_start`** with `{ type:'text' }` (Claude doesn’t require explicit type for text start, but set type if your raw types require)
    - Update `activeBlockIndex = delta.index ?? 0; activeBlockType = 'text'`
- **emit `content_block_delta`** with `{ type:'text_delta', text }`

### On Holo `message_delta` with tool-call *shell* (Holo tool_calls[])
- For each tool call in delta:
    - If block index differs from `activeBlockIndex` and a block is active → **emit `content_block_stop`**
    - **emit `content_block_start`** `{ type:'tool_use', id?, name, input:{} }`
    - `activeBlockIndex = tcIndex; activeBlockType = 'tool_use'; activeToolCallId = id`
    - (Optional) start accumulating tool args: `toolState[index] = { id, name, argsFragments: [] }`

### On Holo `message_delta` with tool-args fragment (`provider_delta` carrying Claude `input_json_delta`)
- Ensure active block is the corresponding tool-use index; if not:
    - Close previous block (if any), start the tool block for that `index`
- **emit `content_block_delta`** `{ type:'input_json_delta', partial_json }`
- (Optional) accumulate fragments in `toolState[index].argsFragments.push(partial_json)`

### On Holo `message_delta` with usage / finish_reason
- **emit `message_delta`** with `{ usage?, stop_reason? }`
    - Map finish_reason via your existing mapper to Claude. (Note: `end_turn` vs `stop`, etc.)
- Do **not** stop message yet; only do that when Holo gives `message_stop` (or your enclosing transport ends).

### On Holo `message_stop`
- If a block is active → **emit `content_block_stop`** (synthetic)
- **emit `message_stop`**
- `stopped = true; activeBlockIndex = null; activeBlockType = null; activeToolCallId = undefined;`

---

# State Model (minimal)

```ts
type BlockState = {
  index: number;
  type: 'text' | 'tool_use' | 'image' | 'other';
  toolCallId?: string;
  started: boolean;
  stopped: boolean;
};

type ToolState = {
  id?: string;
  name?: string;
  argsFragments: string[];
};

type OrchestratorState = {
  messageId?: string;
  model?: string;
  started: boolean;
  stopped: boolean;
  active?: BlockState;
  tools: Map<number, ToolState>;
};
```

---

# Orchestrator API (simple)

```ts
class ClaudeOrchestrator {
  private s: OrchestratorState;

  constructor() { this.reset(); }

  reset() { this.s = { started: false, stopped: false, tools: new Map() }; }

  feed(holoChunk: HoloStreamChunk): ClaudeRawMessageStreamEvent[] {
    const out: ClaudeRawMessageStreamEvent[] = [];

    // 1) message_start synthesis
    if (holoChunk.delta?.type === 'message_start' && !this.s.started) {
      out.push(this.emitMessageStart(holoChunk));
    }

    // 2) route deltas
    switch (holoChunk.delta?.type) {
      case 'content_delta': out.push(...this.onContentDelta(holoChunk)); break;
      case 'message_delta': out.push(...this.onMessageDelta(holoChunk)); break;
      case 'message_stop':  out.push(...this.onMessageStop()); break;
    }

    return out;
  }

  // … emitMessageStart, onContentDelta, onMessageDelta, onMessageStop helpers …
}
```

Keep each helper tiny:
- `ensureBlock(type, index, toolMeta?)`: closes old block if needed, opens new `content_block_start`
- `closeActiveBlockIfAny()`: emits `content_block_stop` when `this.s.active`
- `emitMessageStart`, `emitMessageDelta`, `emitMessageStop`, `emitContentBlockStart`, `emitContentBlockDelta`, `emitContentBlockStop`

---

# Ordering Rules (important)
1) For **tool calls** on the same chunk (shell + args):
    - Emit `content_block_start` (shell) **before** any `input_json_delta` fragments.
2) For **index changes**:
    - Always `content_block_stop` old → `content_block_start` new → then deltas for the new block.
3) For **finalization**:
    - `content_block_stop` (if active) **before** `message_stop`.

---

# Edge Cases
- **No `message_start`** but deltas arrive: emit **synthetic `message_start`** with generated id, known model (or defer until model appears; if unknown, still emit—Claude requires it).
- **Empty text fragments**: drop (Claude won’t care).
- **Finish reason arrives before `message_stop`**: still emit `message_delta`; **don’t** stop until `message_stop`.
- **Parallel tool calls**: use per-index block semantics; switch index → close previous → start next.
- **Provider pass-through**: if `provider_delta` already contains a valid Claude event (e.g., raw `content_block_delta`), just forward it and keep state in sync.

---

# What you do **not** put in the orchestrator
- Cross-provider translation logic (that’s your translators).
- Business rules (timeouts, retries, backpressure).
- Accumulating full tool arguments into JSON (optional convenience only).

---

# Minimal Test Matrix

1) **Plain text**: start → multiple text deltas → stop
    - Expect: `message_start`, `content_block_start(text)`, N×`text_delta`, `content_block_stop`, `message_stop`
2) **Single tool call**: start → tool shell → args fragments → stop
    - Expect: `message_start`, `content_block_start(tool_use)`, N×`input_json_delta`, `content_block_stop`, `message_stop`
3) **Multiple tools (index switch)**: shell(0) → args → shell(1) → args → stop
    - Expect block0 stop before block1 start
4) **Usage & finish_reason mid-stream**: deltas with usage updates
    - Expect `message_delta` events interleaved; **no stop** until final
5) **Out-of-order model/id**: emit start with generated id; keep consistent thereafter

---

This gives you a **lean, deterministic** orchestrator that fills the exact gaps needed for Claude’s richer event lifecycle without bloating Holo or your translators.
