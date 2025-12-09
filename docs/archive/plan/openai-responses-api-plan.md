# OpenAI Responses API Integration Plan

**Status:** Ready to Execute
**SDK Version:** Latest (upgraded ✓, compiles ✓)

---

## Overview

Integrate OpenAI's Responses API following the same pattern as ChatCompletions:
1. Upgrade SDK ✓
2. Export type aliases from SDK in `types/responses.ts`
3. Create validators using arktype in `validators/openai.responses.ts`
4. For EACH type: export → validate → build → next type

**Key Principles:**
- Types are IN ORDER from basic to complex in the SDK
- NEVER use `any` or `unknown` - use existing types like `stringOrNull` or define properly
- Naming: `OpenAI` + SDK's type name (e.g., `OpenAIResponseError = ResponseError`)
- Comment ONLY when code is obtuse
- One type at a time, validate compilation after each

---

## Phase 1: SDK Upgrade ✓ COMPLETE

- [x] Run `npm install openai@latest --save`
- [x] Run `npm run build` to verify compilation
- [x] Examined SDK types file: `node_modules/openai/src/resources/responses/responses.ts`
- [x] Created implementation status catalog: `src/providers/openai/IMPLEMENTATION_STATUS.md`

---

## Phase 2: Reorganize Existing Types (Execute FIRST)

### Rationale
Current files `requests.ts` and `responses.ts` are ambiguous. They actually contain ChatCompletion types, not generic request/response types. We need to:
1. Rename them to `chatcompletion.types.ts` to clarify they're for the ChatCompletions API
2. Keep `responses.ts` available for the new Responses API types
3. Update validators to match the new naming

### Tasks
- [ ] 1. Rename `types/requests.ts` → `types/chatcompletion.types.ts`
- [ ] 2. Move content from `types/responses.ts` into `types/chatcompletion.types.ts` (consolidate ChatCompletion types)
- [ ] 3. Delete old `types/responses.ts` (will recreate for Responses API)
- [ ] 4. Create new empty `types/responses.ts` for Responses API types
- [ ] 5. Rename `validators/openai.requests.ts` → `validators/openai.chatcompletion.validators.ts`
- [ ] 6. Move content from `validators/openai.responses.ts` into `validators/openai.chatcompletion.validators.ts`
- [ ] 7. Delete old `validators/openai.responses.ts` (will recreate for Responses API)
- [ ] 8. Create new empty `validators/openai.responses.validators.ts` for Responses API validators
- [ ] 9. Update `types/index.ts` to export from new file names
- [ ] 10. Update `validators/index.ts` to export from new file names
- [ ] 11. Run `npm run build` to verify no broken imports
- [ ] 12. Search codebase for imports from old paths and update if needed

**Expected File Structure After:**
```
types/
  ├── chatcompletion.types.ts    (ChatCompletion request + response types)
  └── responses.ts               (Empty, ready for Responses API types)
validators/
  ├── openai.chatcompletion.validators.ts  (ChatCompletion validators)
  └── openai.responses.validators.ts       (Empty, ready for Responses API validators)
```

---

## Phase 3: Type Export & Validation (Execute in Order)

### Instructions for Each Type:
1. Export type alias in `src/providers/openai/types/responses.ts`
2. Create validator in `src/providers/openai/validators/openai.responses.validators.ts`
3. Run `npm run build` to verify
4. Move to next type

### Type Checklist (In Dependency Order)

#### Basic Types (No Dependencies)
- [ ] 1. `ResponseStatus` (line 4497) - union type
- [ ] 2. `ResponseIncludable` (line 2266) - union type
- [ ] 3. `ToolChoiceOptions` (line 5273) - union type

#### Input Content Types (Basic Building Blocks)
- [ ] 4. `ResponseInputText` (line 2941)
- [ ] 5. `ResponseInputTextContent` (line 2956)
- [ ] 6. `ResponseInputImageContent` (line 2425)
- [ ] 7. `ResponseInputImage` (line 2397)
- [ ] 8. `ResponseInputFileContent` (line 2366)
- [ ] 9. `ResponseInputFile` (line 2336)
- [ ] 10. `ResponseInputContent` (line 2331) - union of above
- [ ] 11. `ResponseInputAudio` + `ResponseInputAudio.InputAudio` (line 2305)
- [ ] 12. `ResponseInputMessageContentList` (line 2907) - array of ResponseInputContent

#### Output Content Types
- [ ] 13. `ResponseOutputRefusal` (line 3847)
- [ ] 14. `ResponseOutputText.Logprob` (line 4000)
- [ ] 15. `ResponseOutputText.Logprob.TopLogprob` (line 4010)
- [ ] 16. `ResponseOutputText.FileCitation` (line 3890)
- [ ] 17. `ResponseOutputText.URLCitation` (line 3915)
- [ ] 18. `ResponseOutputText.ContainerFileCitation` (line 3945)
- [ ] 19. `ResponseOutputText.FilePath` (line 3980)
- [ ] 20. `ResponseOutputText` (line 3862)
- [ ] 21. `ResponseOutputAudio` (line 3494)
- [ ] 22. `ResponseContent.ReasoningTextContent` (line 1317)
- [ ] 23. `ResponseContent` (line 1305) - union type

#### Error Types
- [ ] 24. `ResponseError` (line 1583)

#### Usage Types
- [ ] 25. `ResponseUsage.InputTokensDetails` (line 4781)
- [ ] 26. `ResponseUsage.OutputTokensDetails` (line 4792)
- [ ] 27. `ResponseUsage` (line 4750)

#### Tool Types (Basic)
- [ ] 28. `FunctionTool` (line 368)
- [ ] 29. `CustomTool` (line 239)
- [ ] 30. `ComputerTool` (line 213)
- [ ] 31. `FileSearchTool.RankingOptions.HybridSearch` (line 349)
- [ ] 32. `FileSearchTool.RankingOptions` (line 324)
- [ ] 33. `FileSearchTool` (line 292)
- [ ] 34. `WebSearchTool.Filters` (line 5392)
- [ ] 35. `WebSearchTool.UserLocation` (line 5405)
- [ ] 36. `WebSearchTool` (line 5365)
- [ ] 37. `WebSearchPreviewTool.UserLocation` (line 5331)
- [ ] 38. `WebSearchPreviewTool` (line 5308)
- [ ] 39. `Tool.CodeInterpreter.CodeInterpreterToolAuto` (line 5064)
- [ ] 40. `Tool.CodeInterpreter` (line 5046)
- [ ] 41. `Tool.ImageGeneration.InputImageMask` (line 5153)
- [ ] 42. `Tool.ImageGeneration` (line 5082)
- [ ] 43. `Tool.LocalShell` (line 5169)
- [ ] 44. `Tool.Mcp.McpToolFilter` (line 4973)
- [ ] 45. `Tool.Mcp.McpToolApprovalFilter.Always` (line 5008)
- [ ] 46. `Tool.Mcp.McpToolApprovalFilter.Never` (line 5026)
- [ ] 47. `Tool.Mcp.McpToolApprovalFilter` (line 4992)
- [ ] 48. `Tool.Mcp` (line 4896)
- [ ] 49. `Tool` (line 4878) - union type
- [ ] 50. `ToolChoiceAllowed` (line 5180)
- [ ] 51. `ToolChoiceCustom` (line 5215)
- [ ] 52. `ToolChoiceFunction` (line 5230)
- [ ] 53. `ToolChoiceMcp` (line 5246)
- [ ] 54. `ToolChoiceTypes` (line 5279)

#### Tool Call Types (Output Items - Basic)
- [ ] 55. `ResponseFunctionToolCall` (line 1940)
- [ ] 56. `ResponseFunctionToolCallItem` (line 1978)
- [ ] 57. `ResponseFunctionWebSearch.Search.Source` (line 2061)
- [ ] 58. `ResponseFunctionWebSearch.Search` (line 2040)
- [ ] 59. `ResponseFunctionWebSearch.OpenPage` (line 2077)
- [ ] 60. `ResponseFunctionWebSearch.Find` (line 2092)
- [ ] 61. `ResponseFunctionWebSearch` (line 2019)
- [ ] 62. `ResponseCustomToolCall` (line 1467)
- [ ] 63. `ResponseCustomToolCallOutput` (line 1557)
- [ ] 64. `ResponseFileSearchToolCall.Result` (line 1772)
- [ ] 65. `ResponseFileSearchToolCall` (line 1743)
- [ ] 66. `ResponseComputerToolCall.Click` (line 1012)
- [ ] 67. `ResponseComputerToolCall.DoubleClick` (line 1038)
- [ ] 68. `ResponseComputerToolCall.Drag.Path` (line 1084)
- [ ] 69. `ResponseComputerToolCall.Drag` (line 1059)
- [ ] 70. `ResponseComputerToolCall.Keypress` (line 1100)
- [ ] 71. `ResponseComputerToolCall.Move` (line 1117)
- [ ] 72. `ResponseComputerToolCall.Screenshot` (line 1138)
- [ ] 73. `ResponseComputerToolCall.Scroll` (line 1149)
- [ ] 74. `ResponseComputerToolCall.Type` (line 1180)
- [ ] 75. `ResponseComputerToolCall.Wait` (line 1196)
- [ ] 76. `ResponseComputerToolCall.PendingSafetyCheck` (line 1207)
- [ ] 77. `ResponseComputerToolCall` (line 966)
- [ ] 78. `ResponseComputerToolCallOutputScreenshot` (line 1284)
- [ ] 79. `ResponseComputerToolCallOutputItem.AcknowledgedSafetyCheck` (line 1263)
- [ ] 80. `ResponseComputerToolCallOutputItem` (line 1225)
- [ ] 81. `ResponseCodeInterpreterToolCall.Logs` (line 913)
- [ ] 82. `ResponseCodeInterpreterToolCall.Image` (line 928)
- [ ] 83. `ResponseCodeInterpreterToolCall` (line 875)
- [ ] 84. `ResponseReasoningItem.Summary` (line 4151)
- [ ] 85. `ResponseReasoningItem.Content` (line 4166)
- [ ] 86. `ResponseReasoningItem` (line 4113)

#### Message Types
- [ ] 87. `ResponseOutputMessage` (line 3816)
- [ ] 88. `ResponseInputMessageItem` (line 2909)
- [ ] 89. `EasyInputMessage` (line 268)
- [ ] 90. `ResponseFunctionCallOutputItem` (line 1928) - union type
- [ ] 91. `ResponseFunctionCallOutputItemList` (line 1933)
- [ ] 92. `ResponseFunctionToolCallOutputItem` (line 1985)
- [ ] 93. `ResponseItem.ImageGenerationCall` (line 2993)
- [ ] 94. `ResponseItem.LocalShellCall.Action` (line 3049)
- [ ] 95. `ResponseItem.LocalShellCall` (line 3018)
- [ ] 96. `ResponseItem.LocalShellCallOutput` (line 3085)
- [ ] 97. `ResponseItem.McpListTools.Tool` (line 3141)
- [ ] 98. `ResponseItem.McpListTools` (line 3110)
- [ ] 99. `ResponseItem.McpApprovalRequest` (line 3167)
- [ ] 100. `ResponseItem.McpApprovalResponse` (line 3197)
- [ ] 101. `ResponseItem.McpCall` (line 3227)
- [ ] 102. `ResponseItem` (line 2971) - union type

#### Input Item Types (Complex)
- [ ] 103. `ResponseInputItem.Message` (line 2485)
- [ ] 104. `ResponseInputItem.ComputerCallOutput.AcknowledgedSafetyCheck` (line 2550)
- [ ] 105. `ResponseInputItem.ComputerCallOutput` (line 2512)
- [ ] 106. `ResponseInputItem.FunctionCallOutput` (line 2571)
- [ ] 107. `ResponseInputItem.ImageGenerationCall` (line 2603)
- [ ] 108. `ResponseInputItem.LocalShellCall.Action` (line 2659)
- [ ] 109. `ResponseInputItem.LocalShellCall` (line 2628)
- [ ] 110. `ResponseInputItem.LocalShellCallOutput` (line 2695)
- [ ] 111. `ResponseInputItem.McpListTools.Tool` (line 2751)
- [ ] 112. `ResponseInputItem.McpListTools` (line 2720)
- [ ] 113. `ResponseInputItem.McpApprovalRequest` (line 2777)
- [ ] 114. `ResponseInputItem.McpApprovalResponse` (line 2807)
- [ ] 115. `ResponseInputItem.McpCall` (line 2837)
- [ ] 116. `ResponseInputItem.ItemReference` (line 2890)
- [ ] 117. `ResponseInputItem` (line 2456) - union type
- [ ] 118. `ResponseInput` (line 2300) - array

#### Output Item Types (Complex)
- [ ] 119. `ResponseOutputItem.ImageGenerationCall` (line 3533)
- [ ] 120. `ResponseOutputItem.LocalShellCall.Action` (line 3589)
- [ ] 121. `ResponseOutputItem.LocalShellCall` (line 3558)
- [ ] 122. `ResponseOutputItem.McpCall` (line 3625)
- [ ] 123. `ResponseOutputItem.McpListTools.Tool` (line 3709)
- [ ] 124. `ResponseOutputItem.McpListTools` (line 3678)
- [ ] 125. `ResponseOutputItem.McpApprovalRequest` (line 3735)
- [ ] 126. `ResponseOutputItem` (line 3514) - union type

#### Response Configuration Types
- [ ] 127. `ResponseConversationParam` (line 1437)
- [ ] 128. `ResponsePrompt` (line 4068)
- [ ] 129. `ResponseFormatTextJSONSchemaConfig` (line 1829)
- [ ] 130. `ResponseFormatTextConfig` (line 1819) - union type
- [ ] 131. `ResponseTextConfig` (line 4564)
- [ ] 132. `Response.IncompleteDetails` (line 644)
- [ ] 133. `Response.Conversation` (line 655)
- [ ] 134. `Response` (line 396) - main response object

#### Stream Event Types (Delta Events)
- [ ] 135. `ResponseTextDeltaEvent.Logprob.TopLogprob` (line 4654)
- [ ] 136. `ResponseTextDeltaEvent.Logprob` (line 4636)
- [ ] 137. `ResponseTextDeltaEvent` (line 4593)
- [ ] 138. `ResponseTextDoneEvent.Logprob.TopLogprob` (line 4731)
- [ ] 139. `ResponseTextDoneEvent.Logprob` (line 4714)
- [ ] 140. `ResponseTextDoneEvent` (line 4671)
- [ ] 141. `ResponseRefusalDeltaEvent` (line 4426)
- [ ] 142. `ResponseRefusalDoneEvent` (line 4461)
- [ ] 143. `ResponseContentPartAddedEvent.ReasoningText` (line 1369)
- [ ] 144. `ResponseContentPartAddedEvent` (line 1332)
- [ ] 145. `ResponseContentPartDoneEvent.ReasoningText` (line 1421)
- [ ] 146. `ResponseContentPartDoneEvent` (line 1385)
- [ ] 147. `ResponseFunctionCallArgumentsDeltaEvent` (line 1866)
- [ ] 148. `ResponseFunctionCallArgumentsDoneEvent` (line 1896)
- [ ] 149. `ResponseCustomToolCallInputDeltaEvent` (line 1497)
- [ ] 150. `ResponseCustomToolCallInputDoneEvent` (line 1525)
- [ ] 151. `ResponseAudioDeltaEvent` (line 666)
- [ ] 152. `ResponseAudioDoneEvent` (line 686)
- [ ] 153. `ResponseAudioTranscriptDeltaEvent` (line 701)
- [ ] 154. `ResponseAudioTranscriptDoneEvent` (line 721)
- [ ] 155. `ResponseCodeInterpreterCallCodeDeltaEvent` (line 736)
- [ ] 156. `ResponseCodeInterpreterCallCodeDoneEvent` (line 767)
- [ ] 157. `ResponseCodeInterpreterCallCompletedEvent` (line 797)
- [ ] 158. `ResponseCodeInterpreterCallInProgressEvent` (line 822)
- [ ] 159. `ResponseCodeInterpreterCallInterpretingEvent` (line 849)
- [ ] 160. `ResponseReasoningSummaryPartAddedEvent.Part` (line 4218)
- [ ] 161. `ResponseReasoningSummaryPartAddedEvent` (line 4182)
- [ ] 162. `ResponseReasoningSummaryPartDoneEvent.Part` (line 4270)
- [ ] 163. `ResponseReasoningSummaryPartDoneEvent` (line 4234)
- [ ] 164. `ResponseReasoningSummaryTextDeltaEvent` (line 4286)
- [ ] 165. `ResponseReasoningSummaryTextDoneEvent` (line 4321)
- [ ] 166. `ResponseReasoningTextDeltaEvent` (line 4356)
- [ ] 167. `ResponseReasoningTextDoneEvent` (line 4391)
- [ ] 168. `ResponseFileSearchCallCompletedEvent` (line 1665)
- [ ] 169. `ResponseFileSearchCallInProgressEvent` (line 1691)
- [ ] 170. `ResponseFileSearchCallSearchingEvent` (line 1717)
- [ ] 171. `ResponseWebSearchCallCompletedEvent` (line 4802)
- [ ] 172. `ResponseWebSearchCallInProgressEvent` (line 4828)
- [ ] 173. `ResponseWebSearchCallSearchingEvent` (line 4852)
- [ ] 174. `ResponseImageGenCallCompletedEvent` (line 2114)
- [ ] 175. `ResponseImageGenCallGeneratingEvent` (line 2140)
- [ ] 176. `ResponseImageGenCallInProgressEvent` (line 2165)
- [ ] 177. `ResponseImageGenCallPartialImageEvent` (line 2190)
- [ ] 178. `ResponseMcpCallArgumentsDeltaEvent` (line 3282)
- [ ] 179. `ResponseMcpCallArgumentsDoneEvent` (line 3313)
- [ ] 180. `ResponseMcpCallCompletedEvent` (line 3343)
- [ ] 181. `ResponseMcpCallFailedEvent` (line 3368)
- [ ] 182. `ResponseMcpCallInProgressEvent` (line 3393)
- [ ] 183. `ResponseMcpListToolsCompletedEvent` (line 3418)
- [ ] 184. `ResponseMcpListToolsFailedEvent` (line 3443)
- [ ] 185. `ResponseMcpListToolsInProgressEvent` (line 3469)
- [ ] 186. `ResponseOutputItemAddedEvent` (line 3766)
- [ ] 187. `ResponseOutputItemDoneEvent` (line 3791)
- [ ] 188. `ResponseOutputTextAnnotationAddedEvent` (line 4027)

#### Lifecycle Event Types
- [ ] 189. `ResponseCreatedEvent` (line 1447)
- [ ] 190. `ResponseInProgressEvent` (line 2226)
- [ ] 191. `ResponseCompletedEvent` (line 944)
- [ ] 192. `ResponseFailedEvent` (line 1646)
- [ ] 193. `ResponseIncompleteEvent` (line 2279)
- [ ] 194. `ResponseErrorEvent` (line 1616)
- [ ] 195. `ResponseQueuedEvent` (line 4090)

#### Top-Level Stream & Request Types
- [ ] 196. `ResponseStreamEvent` (line 4502) - union of all events
- [ ] 197. `ResponseCreateParams.StreamOptions` (line 5695)
- [ ] 198. `ResponseCreateParamsBase` (line 5437)
- [ ] 199. `ResponseCreateParamsNonStreaming` (line 5711)
- [ ] 200. `ResponseCreateParamsStreaming` (line 5723)
- [ ] 201. `ResponseCreateParams` (line 5435) - union
- [ ] 202. `ResponseRetrieveParamsBase` (line 5737)
- [ ] 203. `ResponseRetrieveParamsNonStreaming` (line 5775)
- [ ] 204. `ResponseRetrieveParamsStreaming` (line 5787)
- [ ] 205. `ResponseRetrieveParams` (line 5735) - union

---

## Post-Integration Tasks (After All Types Complete)

- [ ] Final build verification: `npm run build`
- [ ] Document type coverage in README (if needed, upon request only)
- [ ] Update plan status to COMPLETE

---

## Notes

- Total types to export & validate: **205**
- Pattern: Simple types first (unions, basic interfaces), complex types last (unions of many types)
- Each type must satisfy its imported SDK type
- No shortcuts - start from beginning, the complex types will be easy once basics are done
