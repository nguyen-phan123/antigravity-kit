# Repository Separation Strategy

**Date**: 2026-01-27  
**Proposal**: Split monorepo into 3 focused repositories  
**Status**: 📋 PLANNING

> **Note**: Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username throughout this document.

---

## Current Problem

The `antigravity-kit` monorepo mixes three concerns:

```
antigravity-kit/                    # MONOREPO (confusing)
├── .agent/                         # Agent content (what users download)
├── nguyencoder-cli/               # CLI tool (how users install)
├── nguyencoder-kit/               # Preset configs (metadata)
└── web/                           # Documentation (info)
```

**Issues:**
1. CLI downloads from the repo it lives in (circular)
2. Can't version content separately from CLI
3. Unclear what users should do: clone repo or use CLI?
4. npm publishing confusion: publish CLI? content? both?

---

## Proposed Architecture

### 🎯 Three Separate Repositories

#### 1. `YOUR_GITHUB_USERNAME/agent-kit` - Content Repository
```
agent-kit/                          # THE SOURCE OF TRUTH
├── agents/                         # 16 agents
├── skills/                         # 40+ skills
├── workflows/                      # 11 workflows
├── rules/                          # GEMINI.md
├── .shared/                        # Shared resources
├── ARCHITECTURE.md
├── presets/                        # Preset configurations
│   ├── minimal.json
│   ├── web-full.json
│   └── backend-full.json
└── README.md
```

**Purpose**: 
- Contains ALL agent/skill/workflow content
- Users DON'T clone this (unless contributing)
- CLI downloads from this automatically
- Versioned independently: v1.0.0, v1.1.0, etc.

**NOT published to npm** (content-only repo)

---

#### 2. `YOUR_GITHUB_USERNAME/ncli` - CLI Tool
```
ncli/                               # CLI INSTALLER
├── bin/
│   └── index.js                    # CLI logic
├── package.json
├── README.md
└── .gitignore

DEFAULT_REPO: 'github:YOUR_GITHUB_USERNAME/agent-kit'
```

**Purpose**:
- Standalone CLI installer
- Published to npm as `@YOUR_NPM_USERNAME/ncli` (or just `ncli` if available)
- Downloads from `agent-kit` by default
- Versioned independently: v2.0.0, v2.1.0, etc.

**Usage:**
```bash
npm install -g @YOUR_NPM_USERNAME/ncli
ncli init --kit minimal
ncli install
```

---

#### 3. `YOUR_GITHUB_USERNAME/antigravity-kit` - Documentation
```
antigravity-kit/                    # DOCS SITE
├── web/                            # Next.js website
└── README.md                       # Ecosystem overview
```

**Purpose**:
- Project documentation website
- Links to agent-kit and ncli repos
- Explains ecosystem architecture

---

## Benefits

### ✅ Clear Separation of Concerns

| Repository | Contains | Users Do | Published |
|------------|----------|----------|-----------|
| `agent-kit` | Agent content | Browse/fork/contribute | No (GitHub only) |
| `ncli` | CLI tool | `npm i -g @YOUR_GITHUB_USERNAME/ncli` | Yes (npm) |
| `antigravity-kit` | Docs website | Read docs | No (Vercel deploy) |

### ✅ Independent Versioning

```
agent-kit v1.0.0 + ncli v2.0.0
agent-kit v1.5.0 + ncli v2.0.0  ← Content updated, CLI unchanged
agent-kit v1.5.0 + ncli v2.1.0  ← Both updated
agent-kit v2.0.0 + ncli v3.0.0  ← Breaking changes in both
```

### ✅ Clean Dependencies

```
ncli → (downloads) → agent-kit
ncli → (creates) → user's .agent/ folder
antigravity-kit → (documents) → ncli + agent-kit
```

**No circular dependencies!**

### ✅ Better npm Experience

```bash
npm install -g @YOUR_GITHUB_USERNAME/ncli        # Just CLI tool (~2MB)
# NOT: npm install antigravity-kit  # Would be 50MB+ with content
```

### ✅ Contribution Clarity

- Agent/skill updates → PR to `agent-kit`
- CLI features → PR to `ncli`
- Documentation → PR to `antigravity-kit`

---

## Migration Plan

### Phase 1: Create `agent-kit` Repository

**Steps:**
1. Create new GitHub repo: `YOUR_GITHUB_USERNAME/agent-kit`
2. Copy structure:
   ```bash
   cp -r antigravity-kit/.agent/* agent-kit/
   cp -r antigravity-kit/nguyencoder-kit/presets agent-kit/
   ```
3. Add `package.json` (metadata only, not published)
4. Create README explaining structure
5. Tag as `v1.0.0`

**Timeline:** 1 day

---

### Phase 2: Extract `ncli` Repository

**Steps:**
1. Create new GitHub repo: `YOUR_GITHUB_USERNAME/ncli`
2. Copy CLI files:
   ```bash
   cp -r antigravity-kit/nguyencoder-cli/* ncli/
   ```
3. **Update DEFAULT_REPO**:
   ```javascript
   const DEFAULT_REPO = 'github:YOUR_GITHUB_USERNAME/agent-kit';
   ```
4. Update `package.json`:
   ```json
   {
     "name": "@YOUR_GITHUB_USERNAME/ncli",
     "version": "2.0.0",
     "bin": {"ncli": "./bin/index.js"}
   }
   ```
5. Tag as `v2.0.0`
6. **Publish to npm**: `npm publish --access public`

**Timeline:** 1 day

---

### Phase 3: Simplify `antigravity-kit`

**Steps:**
1. Remove obsolete folders:
   ```bash
   rm -rf .agent/ nguyencoder-cli/ nguyencoder-kit/
   ```
2. Keep only:
   ```
   antigravity-kit/
   ├── web/           # Docs website
   └── README.md      # Ecosystem overview
   ```
3. Update README to link to new repos
4. Update website to reference new structure

**Timeline:** Half day

---

## User Experience After Separation

### Before (Confusing)
```bash
# What should I do?
git clone https://github.com/YOUR_GITHUB_USERNAME/antigravity-kit  # Clone everything?
cd antigravity-kit
# Now what? Use .agent directly? Install CLI from subfolder?
```

### After (Clear)
```bash
# Install CLI globally
npm install -g @YOUR_GITHUB_USERNAME/ncli

# Use it anywhere
mkdir my-project && cd my-project
ncli init --kit minimal
ncli install
# → Downloads from agent-kit, creates .agent/
```

---

## Versioning Strategy

### `agent-kit` Versioning (Content)

**Semver for content changes:**
- **Patch** (1.0.x): Bug fixes in existing skills/agents
- **Minor** (1.x.0): New agents, skills, workflows added
- **Major** (x.0.0): Breaking structure changes

**Examples:**
```
v1.0.0 - Initial release
v1.1.0 - Added skill: atomic-commits
v1.2.0 - Added agent: mobile-developer
v2.0.0 - BREAKING: Changed folder structure
```

---

### `ncli` Versioning (Tool)

**Semver for CLI features:**
- **Patch** (2.0.x): Bug fixes
- **Minor** (2.x.0): New CLI commands/features
- **Major** (x.0.0): Breaking CLI changes

**Examples:**
```
v2.0.0 - Initial standalone release
v2.1.0 - Added: ncli upgrade command
v2.2.0 - Added: ncli doctor (validate .agent)
v3.0.0 - BREAKING: Changed argument syntax
```

---

## Compatibility Matrix

| ncli Version | agent-kit Version | Compatible? |
|--------------|-------------------|-------------|
| v2.0.0 | v1.x.x | ✅ Yes |
| v2.1.0 | v1.x.x | ✅ Yes |
| v2.x.x | v2.x.x | ✅ Yes |
| v3.0.0 | v1.x.x | ⚠️ Maybe (depends on changes) |

**Strategy**: ncli maintains backward compatibility with older agent-kit versions when possible.

---

## Key Technical Changes

### 1. DEFAULT_REPO Update

**Before (ncli in monorepo):**
```javascript
// nguyencoder-cli/bin/index.js:15
const DEFAULT_REPO = 'github:YOUR_GITHUB_USERNAME/antigravity-kit';
```

**After (ncli standalone):**
```javascript
// ncli/bin/index.js:15
const DEFAULT_REPO = 'github:YOUR_GITHUB_USERNAME/agent-kit';
```

### 2. Source Detection Logic

Already implemented! The CLI checks:
1. `registry/` - Standalone package
2. `.agent/` - Direct agent-kit repo
3. `nguyencoder-kit/registry/` - Old monorepo structure

**No changes needed** - CLI already supports multiple structures!

### 3. Package Names

| Old | New |
|-----|-----|
| `antigravity-kit` (not published) | `@YOUR_GITHUB_USERNAME/ncli` (published) |
| `nguyencoder-kit` (not published) | `@YOUR_GITHUB_USERNAME/agent-kit` (not published) |

---

## Testing Strategy

### Test Scenarios After Migration

1. **Fresh Install**
   ```bash
   npm install -g @YOUR_GITHUB_USERNAME/ncli
   mkdir test-fresh && cd test-fresh
   ncli init --kit minimal
   ncli install
   # ✅ Should download from agent-kit, create .agent/
   ```

2. **Custom Source**
   ```bash
   ncli init --kit web-full --source github:myuser/my-agents
   ncli install
   # ✅ Should work with forked repos
   ```

3. **Local Development**
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/agent-kit.git
   cd my-project
   ncli init --kit minimal --source ../agent-kit
   ncli install
   # ✅ Should work with local path
   ```

4. **Version Pinning** (Future feature)
   ```bash
   ncli init --kit minimal --version v1.5.0
   ncli install
   # Should download specific version
   ```

---

## Rollout Plan

### Week 1: Preparation
- [ ] Create `agent-kit` repo
- [ ] Create `ncli` repo
- [ ] Test both repos independently
- [ ] Update documentation

### Week 2: Launch
- [ ] Publish `@YOUR_GITHUB_USERNAME/ncli` to npm
- [ ] Tag `agent-kit` v1.0.0
- [ ] Announce on GitHub/social media
- [ ] Monitor for issues

### Week 3: Migration
- [ ] Archive old monorepo structure
- [ ] Update all documentation
- [ ] Add deprecation notice to old paths

---

## Open Questions

1. **Should we keep `antigravity-kit` repo or rename it?**
   - Option A: Keep for docs website
   - Option B: Rename to `agent-kit-docs`
   - **Recommendation**: Keep as-is for docs

2. **Should `agent-kit` be publishable to npm?**
   - Pro: Users could `npm install @YOUR_GITHUB_USERNAME/agent-kit` for local copy
   - Con: Large package size, not needed if CLI works well
   - **Recommendation**: Keep GitHub-only for now

3. **Support old monorepo structure?**
   - CLI already detects multiple structures
   - **Recommendation**: Keep backward compatibility for 6 months

4. **Version sync between repos?**
   - Option A: Independent versioning (recommended)
   - Option B: Keep major versions in sync
   - **Recommendation**: Fully independent

---

## Success Metrics

After migration, success means:

- ✅ Users can install CLI with one command: `npm i -g @YOUR_GITHUB_USERNAME/ncli`
- ✅ CLI downloads from `agent-kit` automatically
- ✅ Clear contribution guidelines (which repo for what)
- ✅ Independent releases for content vs. tool
- ✅ No confusion about cloning vs. installing

---

## Conclusion

**Recommendation: PROCEED with separation**

The split into 3 repos provides:
1. **Clarity**: Each repo has one job
2. **Flexibility**: Version content and tool independently
3. **Scalability**: Can add more presets/skills without bloating CLI
4. **Professionalism**: Standard npm package distribution

**Estimated effort**: 2-3 days for full migration

---

## Next Steps

1. **Decision**: Confirm separation strategy ✋ (awaiting your approval)
2. **Create repos**: Set up `agent-kit` and `ncli` on GitHub
3. **Migrate code**: Copy content to new repos
4. **Test**: Verify installation flows
5. **Publish**: Release to npm and GitHub
6. **Document**: Update all docs and READMEs

**Ready to proceed?**
