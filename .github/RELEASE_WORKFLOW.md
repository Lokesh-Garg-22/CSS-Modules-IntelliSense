# Release Workflow Guide

This document explains how to use the automated release workflow for the
CSS/SCSS Modules IntelliSense extension.

## 🚀 Quick Start

### Quick Steps to Release

1. **Update CHANGELOG.md** - Add your changes under `[Unreleased]`:

   ```markdown
   ## [Unreleased]

   ### Added

   - Your new features

   ### Fixed

   - Your bug fixes
   ```

2. **Go to GitHub Actions**

   - Visit: <https://github.com/Lokesh-Garg-22/CSS-Modules-IntelliSense/actions>
   - Click "Release and Publish"
   - Click "Run workflow"

3. **Select Version Type**

   - `patch` → Bug fixes (0.1.4 → 0.1.5)
   - `minor` → New features (0.1.4 → 0.2.0)
   - `major` → Breaking changes (0.1.4 → 1.0.0)

4. **Click "Run workflow"** ✅

### What Happens Automatically

- ✅ Updates CHANGELOG.md
- ✅ Bumps package.json version
- ✅ Runs tests
- ✅ Creates git tag
- ✅ Publishes to VS Code Marketplace
- ✅ Creates GitHub Release
- ❌ **Rolls back everything if anything fails!**

---

## Overview

The `release.yml` GitHub Actions workflow automates the entire release process:

1. ✅ Updates CHANGELOG.md from `[Unreleased]` to versioned release
2. ✅ Bumps version in package.json
3. ✅ Runs compilation and tests
4. ✅ Creates a git tag with release notes
5. ✅ Publishes to VS Code Marketplace
6. ✅ Creates a GitHub Release with VSIX file
7. ✅ **Automatic rollback** if anything fails

## Prerequisites

### 1. Setup VS Code Marketplace Token

You need a Personal Access Token (PAT) from Visual Studio Marketplace:

1. Go to [https://dev.azure.com/](https://dev.azure.com/)
2. Click on your profile → Security → Personal Access Tokens
3. Create a new token with:
   - **Organization:** All accessible organizations
   - **Scopes:** Marketplace → Manage
4. Copy the token

### 2. Add Secret to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `VSCE_PAT`
5. Value: Paste your token
6. Click "Add secret"

## How to Release

### Step 1: Add Changes to CHANGELOG

Before releasing, ensure your `CHANGELOG.md` has
an `[Unreleased]` section with your changes:

```markdown
## [Unreleased]

### Added

- New feature descriptions

### Changed

- Modified functionality

### Fixed

- Bug fixes
```

### Step 2: Trigger the Workflow

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Release and Publish** workflow
4. Click **Run workflow** button
5. Select version type:
   - **patch** (0.1.4 → 0.1.5) - Bug fixes
   - **minor** (0.1.4 → 0.2.0) - New features
   - **major** (0.1.4 → 1.0.0) - Breaking changes
6. Click **Run workflow**

### Step 3: Monitor Progress

The workflow will:

- ⏳ Extract changes from `[Unreleased]`
- ⏳ Update CHANGELOG.md and package.json
- ⏳ Run tests
- ⏳ Create git tag
- ⏳ Publish to marketplace
- ⏳ Create GitHub release

### Step 4: Verify Release

Once complete, verify:

- ✅ New version appears on [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=lokesh-garg.css-scss-modules-intellisense)
- ✅ GitHub release created with tag
- ✅ CHANGELOG.md updated
- ✅ package.json version bumped

## What Happens on Failure?

If **any step fails**, the workflow automatically:

1. ❌ Restores original package.json and CHANGELOG.md
2. ❌ Resets git to the commit before the workflow ran
3. ❌ Deletes any created tags (local and remote)
4. ❌ Force pushes to reset the remote branch
5. ❌ Exits with an error message

**You can safely retry after fixing the issue!**

## Workflow Steps Detail

### Version Calculation

- **Current version:** Read from package.json
- **New version:** Calculated based on semver (major.minor.patch)

### CHANGELOG Update

```markdown
## [Unreleased]

## [0.1.5] – 2025-12-02

### Added

- Your changes here
```

The workflow:

1. Keeps `[Unreleased]` section header (empty for next release)
2. Converts previous unreleased content to new version
3. Adds comparison link at bottom

### Tag Creation

- Tag name: `v{version}` (e.g., `v0.1.5`)
- Tag message: Content from `[Unreleased]` section
- Pushed to remote repository

### Publishing

- Packages extension as `.vsix` file
- Publishes to VS Code Marketplace using `vsce publish`
- Uploads `.vsix` to GitHub Release

## Troubleshooting

### "No [Unreleased] section found"

**Solution:** Add an `[Unreleased]` section to CHANGELOG.md with your changes

### "No changes found in [Unreleased] section"

**Solution:** Add at least one change under the `[Unreleased]` heading

### "VSCE_PAT secret not found"

**Solution:** Add your Visual Studio Marketplace token as a GitHub secret (see Prerequisites)

### "Tests failed"

**Solution:** Fix test failures locally first, then retry the workflow

### "Permission denied" errors

**Solution:** Ensure the workflow has write permissions in repository settings

## Manual Rollback

If you need to manually rollback a release:

```bash
# Delete local tag
git tag -d v0.1.5

# Delete remote tag
git push origin :refs/tags/v0.1.5

# Reset to previous commit
git reset --hard HEAD~1
git push origin main --force
```

Then manually revert CHANGELOG.md and package.json changes.

## Best Practices

1. **Always test locally** before releasing
2. **Keep [Unreleased] section updated** as you make changes
3. **Use semantic versioning** appropriately:
   - patch: backwards-compatible bug fixes
   - minor: backwards-compatible new features
   - major: breaking changes
4. **Review the CHANGELOG** before triggering release
5. **Monitor the workflow** in Actions tab during release

## Version History Format

The CHANGELOG follows [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]

## [0.2.0] – 2025-12-15

### Added

- New feature

## [0.1.5] – 2025-12-02

### Fixed

- Bug fix
```

## GitHub Actions Limits

- Public repositories: Unlimited minutes
- Private repositories: 2,000 minutes/month (free tier)
- Workflow typically takes 3-5 minutes

## Security

- **Never commit** your VSCE_PAT token to the repository
- Use GitHub Secrets for sensitive data
- Tokens are masked in workflow logs
- Review workflow permissions regularly
