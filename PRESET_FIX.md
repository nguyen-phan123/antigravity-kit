# Preset Installation Fix - Summary

## Issues Identified

### 1. Missing Registry Structure
**Problem**: The CLI expected content in `nguyencoder-kit/registry/` but only `nguyencoder-kit/presets/` existed.

**Impact**: The install command couldn't find any modules to copy, causing installation to fail silently or with "module not found" warnings.

**Fix**: Created complete registry structure with all agent system content:
```
nguyencoder-kit/registry/
├── agents/        # All 16 agents
├── skills/        # All 40+ skills  
├── workflows/     # All 11 workflows
├── rules/         # GEMINI.md and other rules
├── .shared/       # Shared resources
└── root/          # ARCHITECTURE.md
```

### 2. Hardcoded Registry Path
**Problem**: The CLI only looked for modules in `{tempDir}/registry/` with no fallback.

**Impact**: Couldn't support root-level structures or local development paths.

**Fix**: Updated `copyModule()` and core installation logic to:
- Check `registry/` first, then fall back to root level
- Auto-detect registry vs root-level structures
- Provide better error messages showing both paths tried

### 2b. File Extension Logic Order
**Problem**: The `.md` extension check happened AFTER the registry→root fallback, so it never tried `registry/workflows/deploy.md` after finding `registry/workflows/deploy` didn't exist.

**Impact**: All workflow files (`.md`) failed to install, showing "Module not found" warnings.

**Fix**: Restructured `copyModule()` to:
- Try exact path in registry
- If not found, try with `.md` extension in registry
- Only then fall back to root level (with same extension logic)
- Show all 4 paths tried in error message

### 3. Inflexible Preset Loading
**Problem**: `loadPreset()` always appended `.json`, breaking paths like `presets/minimal`.

**Impact**: Config with `base: "presets/minimal"` would look for `presets/minimal.json.json`.

**Fix**: Updated to handle both formats:
- `"minimal"` → `minimal.json`
- `"presets/minimal"` → `presets/minimal.json`
- Improved error message with full path

### 4. Typo in minimal.json
**Problem**: Referenced `"agens/mobile-developer.md"` instead of `"agents/"`.

**Impact**: Module would never be found, causing warning during installation.

**Fix**: Removed the incorrect entry entirely (agents are auto-installed, no need to specify in preset).

## Files Changed

### nguyencoder-cli/bin/index.js
- `loadPreset()`: Better path handling, supports `presets/` prefix
- `copyModule()`: Registry + root-level fallback, better error messages
- Core installation: Auto-detects registry location

### nguyencoder-kit/
- Created `registry/` structure with full agent system
- Fixed `presets/minimal.json` typo
- Added `README.md` with structure documentation
- Added `.gitignore` to prevent committing duplicated registry
- Created `sync-registry.sh` for easy registry updates

### Root
- Added `sync-registry.sh` for syncing .agent → nguyencoder-kit/registry

## How Preset Installation Now Works

1. **User runs**: `ncli init --kit minimal`
   - Creates `agent.config.json` with `base: "presets/minimal"`

2. **User runs**: `ncli install`
   - Downloads/copies source repo to temp directory
   - **Auto-installs core** (all agents, ARCHITECTURE.md, .shared)
   - Loads preset from `presets/minimal.json`
   - **Installs optional modules** from preset (skills, workflows, rules)
   - Applies any include/exclude overrides
   - Cleans up temp directory

3. **Result**: `.agent/` folder with:
   - All 16 agents (always included)
   - ARCHITECTURE.md (always included)
   - Shared resources (always included)
   - Preset-specific skills/workflows/rules

## Testing the Fix

To test locally:
```bash
# In a test directory
cd ../test-v2

# Initialize with minimal preset
node ../nguyencoder-cli/bin/index.js init --kit minimal --source ../nguyencoder-kit

# Install
node ../nguyencoder-cli/bin/index.js install

# Verify structure
ls -la .agent/
```

## Maintaining the Registry

When .agent content is updated, sync to registry:
```bash
./sync-registry.sh
```

Or manually:
```bash
cd nguyencoder-kit
rm -rf registry
mkdir -p registry/root
cp -r ../.agent/{agents,skills,workflows,rules,.shared} registry/
cp ../.agent/ARCHITECTURE.md registry/root/
```

## Future Improvements

1. **Use symlinks in development** to avoid duplication
2. **Auto-sync on publish** via package.json prepublish hook
3. **Validate presets** ensure all modules exist before publishing
4. **Add preset validator** CLI command to check preset integrity
5. **Support remote registry** separate registry from preset package
