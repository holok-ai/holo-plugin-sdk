import {HoloContent, HoloMessage, HoloMessageValidator, HoloRequest} from "../../holo";
import {OllamaChatRequest, OllamaMessage, OllamaMessageValidator} from "../types";
import {isUint8Array, uint8ToDataUrl} from "../../../utils";
import {FieldTranslator, TranslatorGuard, TranslateFunc} from "../../types";

// Individual message translator functions
export const fromHoloMessageTranslator: TranslateFunc<HoloMessage, OllamaMessage> =
    async (holoMessage): Promise<Partial<OllamaMessage>> => {
        const out: Partial<OllamaMessage> = {role: holoMessage.role as OllamaMessage["role"]};

        // content → string (+ images[])
        if (typeof holoMessage.content === "string") {
            out.content = holoMessage.content;
        } else if (Array.isArray(holoMessage.content)) {
            const textParts: string[] = [];
            const images: string[] = [];

            for (const part of holoMessage.content) {
                if (part.type === "text") textParts.push(part.text);
                else if (part.type === "image") images.push(part.url);
            }

            out.content = textParts.length ? textParts.join("\n") : "";
            if (images.length) out.images = images;
        } else {
            out.content = "";
        }

        if (holoMessage.tool_calls?.length) {
            out.tool_calls = holoMessage.tool_calls.map((tc) => ({
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments ?? {},
                },
            }));
        }

        return out;
    };

export const toHoloMessageTranslator: TranslateFunc<OllamaMessage, HoloMessage> =
    async (ollamaMessage): Promise<Partial<HoloMessage>> => {
        const role: HoloMessage["role"] =
            ollamaMessage.role === "assistant" || ollamaMessage.role === "user" || ollamaMessage.role === "tool"
                ? ollamaMessage.role
                : "user";

        const contentParts: HoloContent[] = [];

        if (ollamaMessage.content) {
            contentParts.push({type: "text", text: String(ollamaMessage.content)});
        }

        if (Array.isArray(ollamaMessage.images) && ollamaMessage.images.length) {
            for (const img of ollamaMessage.images) {
                if (typeof img === "string") {
                    contentParts.push({type: "image", url: img});
                } else if (isUint8Array(img)) {
                    // preserve image via data URL
                    contentParts.push({type: "image", url: uint8ToDataUrl(img)});
                }
            }
        }

        const holoOut: Partial<HoloMessage> = {role};

        if (!contentParts.length) {
            holoOut.content = ""; // keep schema happy
        } else if (contentParts.length === 1 && contentParts[0].type === "text") {
            holoOut.content = contentParts[0].text;
        } else {
            holoOut.content = contentParts;
        }

        if (ollamaMessage.tool_calls?.length) {
            holoOut.tool_calls = ollamaMessage.tool_calls.map((tc, idx) => {
                const args = tc.function?.arguments;
                let parsed: unknown = args;
                if (typeof args === "string") {
                    try {
                        parsed = JSON.parse(args);
                    } catch { /* keep as string */
                    }
                }
                return {
                    id: `${tc.function?.name ?? "call"}#${idx}`,
                    type: "function" as const,
                    function: {
                        name: tc.function.name,
                        arguments: parsed as any,
                    },
                };
            });
        }

        return holoOut;
    };

// Guards for message validation
export const portableMessageOnlyGuard = new TranslatorGuard<HoloMessage>(
    "portableMessageOnly",
    async (m) => m.role === "user" || m.role === "assistant" || m.role === "tool"
);

// Individual message translator
export const OllamaMessageTranslator = new FieldTranslator<HoloMessage, OllamaMessage>(
    HoloMessageValidator,
    OllamaMessageValidator,
    [fromHoloMessageTranslator],
    [toHoloMessageTranslator],
    {
        fromHoloGuards: [portableMessageOnlyGuard],
        name: 'OllamaMessageTranslator'
    }
);

// HoloRequest.messages[] -> OllamaChatRequest.messages[] (prepend system if present)
export const fromHoloMessagesTranslator: TranslateFunc<HoloRequest, OllamaChatRequest> =
    async (holoReq) => {
        const translated = await OllamaMessageTranslator.fromHoloArray(holoReq.messages ?? []);
        const messages: OllamaMessage[] = [...translated];

        if (holoReq.system) {
            messages.unshift({role: "system", content: holoReq.system});
        }

        return messages.length ? {messages} : {};
    };

export const toHoloMessagesTranslator: TranslateFunc<OllamaChatRequest, HoloRequest> =
    async (ollamaReq) => {
        if (!ollamaReq.messages?.length) return {};

        const nonSystem = ollamaReq.messages.filter((m) => m.role !== "system");
        if (!nonSystem.length) return {messages: []};

        const holoMsgs = await Promise.all(nonSystem.map((m) => OllamaMessageTranslator.toHolo(m)));
        const valid = holoMsgs.filter((m) => Object.keys(m).length) as HoloMessage[];

        return {messages: valid};
    };
