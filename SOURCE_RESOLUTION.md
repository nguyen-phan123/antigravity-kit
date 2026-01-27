# Source Path Resolution - Improved Logic

## Problem with Previous Approach

**OLD LOGIC** (Local First):
```
if (fs.existsSync(source)) → Use local
else → Try GitHub
```

**Issues**:
1. ❌ Ambiguous behavior: `my-kit` could be local folder OR GitHub repo
2. ❌ Security risk: Local folder could intercept GitHub repo names
3. ❌ Unexpected in production: Most users expect GitHub by default
4. ❌ Performance: Extra filesystem check for every GitHub repo

---

## New Improved Logic

**Priority Order**:
1. **Explicit Local Path** (highest priority)
2. **GitHub Format**
3. **Implicit Local Fallback** (with warning)

### Implementation

```javascript
const isExplicitLocalPath = source.startsWith('./') || 
                           source.startsWith('../') || 
                           source.startsWith('/') ||
                           source.startsWith('~');

const isGitHubFormat = source.startsWith('github:') || 
                      source.includes('/') && !source.includes('\\');

if (isExplicitLocalPath) {
    // Use local path (explicit user intent)
} else if (isGitHubFormat || !fs.existsSync(source)) {
    // Try GitHub (default for remote repos)
} else {
    // WARN: Ambiguous local fallback
    console.warn("Using local directory: " + source);
    console.log("💡 Tip: Use ./" + source + " to avoid ambiguity");
}
```

---

## Source Format Examples

### ✅ Explicit Local Paths (Always Local)

| Format | Example | Behavior |
|--------|---------|----------|
| Relative (`./`) | `./my-kit` | Use local `./my-kit` |
| Relative (`../`) | `../nguyencoder-kit` | Use local parent dir |
| Absolute | `/Users/me/kit` | Use absolute path |
| Home (`~`) | `~/projects/kit` | Use home directory |

**Guarantees**: These ALWAYS use local filesystem, never try GitHub.

### ✅ GitHub Format (Always Remote)

| Format | Example | Behavior |
|--------|---------|----------|
| GitHub prefix | `github:user/repo` | Download from GitHub |
| User/repo | `YOUR_GITHUB_USERNAME/antigravity-kit` | Download from GitHub |
| With branch | `github:user/repo#dev` | Download specific branch |
| Subdirectory | `github:user/repo/sub` | Download with subdirectory |

**Guarantees**: These ALWAYS try GitHub first, never check local filesystem.

### ⚠️ Ambiguous Format (Local Fallback with Warning)

| Format | Example | Behavior |
|--------|---------|----------|
| Bare name | `my-kit` | **WARNING** then use local if exists |
| Name only | `antigravity-kit` | Try GitHub, fallback to local if 404 |

**Warning shown**:
```
⚠ Using local directory: my-kit
    💡 Tip: Use ./my-kit to avoid ambiguity
```

**Why warn?**: User might think they're using GitHub when they're actually using a local folder.

---

## Decision Matrix

| Source | Exists Locally? | Behavior |
|--------|----------------|----------|
| `../nguyencoder-kit` | ✓ Yes | ✅ Use local (explicit) |
| `../nguyencoder-kit` | ✗ No | ❌ Error: path not found |
| `github:user/repo` | ✓ Yes | ✅ Download from GitHub (ignore local) |
| `github:user/repo` | ✗ No | ✅ Download from GitHub |
| `user/repo` | ✓ Yes | ✅ Download from GitHub (ignore local) |
| `user/repo` | ✗ No | ✅ Download from GitHub |
| `my-kit` | ✓ Yes | ⚠️ Use local (WITH WARNING) |
| `my-kit` | ✗ No | ✅ Try GitHub (will likely 404) |

---

## Usage Recommendations

### For Development (Local Testing)
```bash
# ✅ RECOMMENDED: Explicit relative path
ncli init --source ../nguyencoder-kit
ncli init --source ./my-local-kit

# ❌ AVOID: Ambiguous bare name
ncli init --source nguyencoder-kit  # Confusing: local or GitHub?
```

### For Production (GitHub Repos)
```bash
# ✅ RECOMMENDED: GitHub format
ncli init --source github:YOUR_GITHUB_USERNAME/antigravity-kit
ncli init --source YOUR_GITHUB_USERNAME/antigravity-kit

# ✅ OK: With branch
ncli init --source github:YOUR_GITHUB_USERNAME/antigravity-kit#main
```

### For Published npm Package
```bash
# ✅ DEFAULT: Uses DEFAULT_REPO constant
ncli init --kit minimal
# Uses: github:diqit/nguyencoder-kit (from config)
```

---

## Benefits of New Approach

### Security
✅ **Prevents Local Hijacking**: `github:user/repo` NEVER checks local filesystem
✅ **Explicit Intent**: User must use `./` for local, making intent clear
✅ **Warnings**: Ambiguous cases show warning to alert user

### User Experience
✅ **Predictable**: Clear rules, no surprises
✅ **Helpful Tips**: Warnings include suggestions (use `./name`)
✅ **Fast**: GitHub repos don't waste time checking filesystem

### Developer Experience
✅ **Easy Testing**: `../path` always works for local dev
✅ **No Conflicts**: Can have local folder AND use GitHub with same name
✅ **Clear Errors**: Path not found errors are immediate and clear

---

## Migration from Old Logic

### Old Behavior
```bash
# Had local folder "my-kit" but wanted GitHub
ncli init --source my-kit
# ❌ OLD: Silently used local folder
```

### New Behavior
```bash
# Same command, new behavior
ncli init --source my-kit
# ⚠️ NEW: Uses local but WARNS user

# To force GitHub (ignore local):
ncli init --source github:user/my-kit
# ✅ Explicitly uses GitHub

# To use local without warning:
ncli init --source ./my-kit
# ✅ Explicitly uses local
```

---

## Edge Cases Handled

| Case | Old Behavior | New Behavior |
|------|-------------|--------------|
| Folder named `github:repo` | ❌ Used local | ✅ Error (invalid path) |
| Path with spaces | ❌ Unpredictable | ✅ Error with clear message |
| Windows backslash | ❌ Could break | ✅ Treated as local path |
| Non-existent local path | ❌ Silent GitHub fallback | ✅ Immediate error |
| Invalid GitHub format | ❌ Confusing error | ✅ Clear 404 with tips |

---

## Testing Coverage

### Test Cases
- [x] Explicit local `../path` → Uses local
- [x] Explicit local `./path` → Uses local
- [x] GitHub format `github:user/repo` → Uses GitHub
- [x] GitHub format `user/repo` → Uses GitHub
- [x] Ambiguous `name` with local folder → Warns + uses local
- [x] Ambiguous `name` without local → Tries GitHub
- [x] Non-existent explicit local → Error
- [x] Invalid GitHub repo → 404 with helpful tips

### Command Coverage
- [x] `ncli init --source <path>`
- [x] `ncli install` (uses config.source)
- [x] `ncli list --source <path>`

---

## Configuration

Default GitHub repo is set in CLI:
```javascript
const DEFAULT_REPO = 'github:diqit/nguyencoder-kit';
```

Users can override:
```bash
ncli init --kit minimal --source github:myuser/my-fork
```

Or edit `agent.config.json`:
```json
{
  "source": "github:myuser/my-fork",
  "base": "presets/minimal"
}
```

---

## Future Improvements

1. **Support npm packages**: `npm:package-name`
2. **Support URLs**: `https://example.com/kit.tar.gz`
3. **Support Git URLs**: `git@github.com:user/repo.git`
4. **Cache downloaded repos**: Avoid re-downloading same repo
5. **Offline mode**: Use cache when network unavailable

---

**Version**: 2.3.0  
**Updated**: 2026-01-27  
**Status**: ✅ Implemented and Tested
