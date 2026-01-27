# Fork Configuration Guide

This is a fork-friendly project! If you've forked this repository, follow these steps to configure it for your own use.

## Step 1: Update Repository URLs

### Main package.json
```bash
# File: package.json
# Update these fields with your GitHub username:
{
  "repository": {
    "url": "git+https://github.com/YOUR_GITHUB_USERNAME/antigravity-kit.git"
  },
  "homepage": "https://github.com/YOUR_GITHUB_USERNAME/antigravity-kit#readme",
  "bugs": {
    "url": "https://github.com/YOUR_GITHUB_USERNAME/antigravity-kit/issues"
  },
  "author": "YOUR_NAME"
}
```

### CLI Default Repository
```bash
# File: nguyencoder-cli/bin/index.js
# Line 15: Update DEFAULT_REPO
const DEFAULT_REPO = 'github:YOUR_GITHUB_USERNAME/antigravity-kit';
```

### CLI Package Name (if publishing to npm)
```bash
# File: nguyencoder-cli/package.json
{
  "name": "@YOUR_NPM_USERNAME/ncli",  # Or just "ncli" if available
  "author": "YOUR_NAME"
}
```

## Step 2: Test Locally

```bash
# Test the CLI with local source
cd /tmp/test-install
node /path/to/your-fork/nguyencoder-cli/bin/index.js init --kit minimal --source /path/to/your-fork
node /path/to/your-fork/nguyencoder-cli/bin/index.js install

# Verify .agent folder was created
ls -la .agent/
```

## Step 3: Commit and Push

```bash
cd /path/to/your-fork
git add package.json nguyencoder-cli/bin/index.js
git commit -m "Configure fork for YOUR_GITHUB_USERNAME"
git push origin main
```

## Step 4: Test GitHub Download

After pushing to GitHub:

```bash
cd /tmp/test-github
node /path/to/your-fork/nguyencoder-cli/bin/index.js list
# Should download from your GitHub repo and list presets
```

## Step 5: Publish CLI to npm (Optional)

If you want to publish your CLI to npm:

```bash
cd nguyencoder-cli

# Login to npm
npm login

# Publish (make sure package.json name is unique)
npm publish --access public

# Now users can install:
npm install -g @YOUR_NPM_USERNAME/ncli
ncli init --kit minimal
ncli install
```

## Step 6: Update Documentation

Replace placeholders in documentation:

```bash
# Replace YOUR_GITHUB_USERNAME with your actual username
find . -name "*.md" -type f -exec sed -i '' 's/YOUR_GITHUB_USERNAME/your-actual-username/g' {} +

# Replace YOUR_NPM_USERNAME with your npm username
find . -name "*.md" -type f -exec sed -i '' 's/YOUR_NPM_USERNAME/your-actual-npm-username/g' {} +
```

## Repository Separation (Advanced)

If you want to split this into separate repos (recommended for production):

See [REPO_SEPARATION_STRATEGY.md](./REPO_SEPARATION_STRATEGY.md) for detailed instructions.

**Quick overview:**
1. Create `YOUR_GITHUB_USERNAME/agent-kit` - Contains .agent/ content
2. Create `YOUR_GITHUB_USERNAME/ncli` - Contains CLI tool
3. Keep `antigravity-kit` for documentation (optional)

## Configuration Checklist

- [ ] Updated `package.json` repository URLs
- [ ] Updated `nguyencoder-cli/bin/index.js` DEFAULT_REPO
- [ ] Updated `nguyencoder-cli/package.json` name and author
- [ ] Tested CLI with local source
- [ ] Committed and pushed to GitHub
- [ ] Tested CLI with GitHub download
- [ ] (Optional) Published CLI to npm
- [ ] (Optional) Updated all documentation placeholders
- [ ] (Optional) Separated into multiple repos

## Quick One-Liner Configuration

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Set your username
GITHUB_USER="your-github-username"

# Update all files
sed -i '' "s/YOUR_GITHUB_USERNAME/$GITHUB_USER/g" package.json
sed -i '' "s/YOUR_GITHUB_USERNAME/$GITHUB_USER/g" nguyencoder-cli/bin/index.js
sed -i '' "s/YOUR_GITHUB_USERNAME/$GITHUB_USER/g" README.md

# Commit
git add .
git commit -m "Configure fork for $GITHUB_USER"
git push origin main
```

## Support

If you run into issues:

1. Check that all URLs point to your fork
2. Verify the repository is public (or you have access)
3. Test with `--source` flag pointing to your repo explicitly
4. Open an issue in your fork or the original repo

## License

This fork maintains the MIT license from the original project.
