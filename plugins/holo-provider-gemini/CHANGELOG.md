# @holokai/holo-provider-gemini

## 1.2.2

### Patch Changes

- Add historical pricing datasets with compiled snapshot normalization
    - Add PricingDataset types and normalizePricingDataset() engine to SDK that compiles raw pricing snapshots into
      complete point-in-time sheets with model carry-forward, alias expansion, shutdown removal, and effective_to date
      ranges
    - Create historical pricing datasets for Claude (15 snapshots back to 2023-03), Gemini (7 snapshots back to
      2024-02), and OpenAI (12 snapshots back to 2023-06)
    - All plugins now implement getPricingSheets() returning full history; plugin service registers all sheets with
      effective_to for accurate historical cost calculation
    - Fix unhandled promise rejections in streaming paths for OpenAI, Gemini, and Ollama providers by deferring work
      into final() instead of starting floating IIFEs
