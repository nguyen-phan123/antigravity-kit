#!/bin/bash
# sync-registry.sh - Sync .agent content to nguyencoder-kit/registry

set -e

echo "🔄 Syncing .agent to nguyencoder-kit/registry..."

cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"
AGENT_DIR="$SCRIPT_DIR/.agent"
REGISTRY_DIR="$SCRIPT_DIR/nguyencoder-kit/registry"

# Clean and recreate registry
echo "  📁 Cleaning registry directory..."
rm -rf "$REGISTRY_DIR"
mkdir -p "$REGISTRY_DIR/root"

# Copy all components
echo "  📦 Copying agents..."
cp -r "$AGENT_DIR/agents" "$REGISTRY_DIR/"

echo "  📦 Copying skills..."
cp -r "$AGENT_DIR/skills" "$REGISTRY_DIR/"

echo "  📦 Copying workflows..."
cp -r "$AGENT_DIR/workflows" "$REGISTRY_DIR/"

echo "  📦 Copying rules..."
cp -r "$AGENT_DIR/rules" "$REGISTRY_DIR/"

echo "  📦 Copying shared resources..."
cp -r "$AGENT_DIR/.shared" "$REGISTRY_DIR/"

echo "  📦 Copying ARCHITECTURE.md..."
cp "$AGENT_DIR/ARCHITECTURE.md" "$REGISTRY_DIR/root/"

echo "✅ Registry sync complete!"
echo ""
echo "Registry structure:"
ls -la "$REGISTRY_DIR"
