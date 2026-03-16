#!/usr/bin/env bash
set -eo pipefail

BRANCH="${1:-$(git branch --show-current)}"

REMOTES="types:plugins/types
sdk:plugins/sdk
lib:plugins/lib
openai:plugins/holo-provider-openai
claude:plugins/holo-provider-claude
ollama:plugins/holo-provider-ollama
gemini:plugins/holo-provider-gemini
harness:plugins/test-harness
testutils:plugins/test-utils"

echo "Pushing to branch: $BRANCH"
echo ""

for entry in $REMOTES; do
  remote="${entry%%:*}"
  prefix="${entry#*:}"
  echo "→ $remote ($prefix)"
  git subtree push --prefix="$prefix" "$remote" "$BRANCH"
  echo ""
done

echo "Done. All plugins pushed to '$BRANCH'."
