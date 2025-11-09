# ESLint + Prettier + Reviewdog Setup

This document describes the complete linting and formatting setup for the Eventy project, including ESLint with Prettier integration, pre-commit hooks, and GitHub Actions with Reviewdog.

## 🎯 Overview

The project uses:
- **ESLint v9** - JavaScript/TypeScript linter with flat config
- **Prettier** - Code formatter
- **eslint-plugin-prettier** - Runs Prettier as an ESLint rule
- **eslint-config-prettier** - Disables conflicting ESLint rules
- **Husky** - Git hooks manager
- **lint-staged** - Run linters on staged files
- **Reviewdog** - Automated code review on GitHub PRs

## 📦 Installed Packages

### Core Linting & Formatting
- `eslint` - Main linter
- `prettier` - Code formatter
- `eslint-plugin-prettier` - Prettier integration
- `eslint-config-prettier` - Turn off conflicting rules

### ESLint Plugins
- `@typescript-eslint/eslint-plugin` - TypeScript rules
- `@typescript-eslint/parser` - TypeScript parser
- `eslint-plugin-react` - React-specific rules
- `eslint-plugin-react-hooks` - React Hooks rules

### Git Hooks
- `husky` - Git hooks manager
- `lint-staged` - Run on staged files only

## 🔧 Configuration Files

### 1. `eslint.config.js` (ESLint v9 Flat Config)

The new flat config format with:
- JavaScript/JSX configuration
- TypeScript/TSX configuration
- React and React Hooks support
- Prettier integration
- Automatic file ignoring

**Key Rules:**
- Prettier errors trigger ESLint errors
- React JSX doesn't require React import
- Unused variables with `_` prefix are allowed
- Console statements allowed (warn/error only)
- TypeScript `any` type warnings

### 2. `.prettierrc.json`

Prettier formatting rules:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 3. `.prettierignore`

Files excluded from Prettier formatting.

### 4. `package.json` Scripts

```json
{
  "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
  "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
  "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\"",
  "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\""
}
```

### 5. `lint-staged` Configuration

```json
{
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "**/*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

## 🚀 Usage

### Manual Commands

#### Check for linting errors
```bash
npm run lint
```

#### Fix linting errors automatically
```bash
npm run lint:fix
```

#### Format all files
```bash
npm run format
```

#### Check if files are formatted
```bash
npm run format:check
```

### Pre-Commit Hook (Automatic)

Every commit automatically:
1. Runs ESLint with auto-fix on staged JS/TS files
2. Runs Prettier on staged files
3. Stages the fixed files
4. Completes the commit

**Example:**
```bash
git add .
git commit -m "feat: add new feature"
# ESLint and Prettier run automatically
```

### Bypass Hook (Emergency Only)
```bash
git commit --no-verify -m "emergency fix"
```

## 🔄 GitHub Actions Workflow

### Workflow: `lint-and-format.yml`

**Triggers:**
- Pull requests to `main`
- Pushes to `main`

**Steps:**
1. **Prettier Check** - Ensures all files are formatted
2. **ESLint** - Lints all JavaScript/TypeScript files
3. **Reviewdog** - Posts inline comments on PRs with ESLint issues

**Example PR Comment:**
```
AdminHeader.tsx:15
warning: 'User' is defined but never used (@typescript-eslint/no-unused-vars)
```

### Reviewdog Features

- 📝 Inline PR comments on exact lines
- 🎯 Only comments on changed lines
- ✅ Auto-resolves when issues are fixed
- 🚦 Doesn't fail the build (warnings only)

## 📋 ESLint Rules Summary

### JavaScript/TypeScript Common Rules
- ✅ Prettier errors are ESLint errors
- ⚠️ Unused variables (use `_` prefix to ignore)
- ⚠️ `console.log` statements (allow `console.warn/error`)
- ✅ React imports not required in JSX files

### TypeScript-Specific Rules
- ⚠️ `any` type usage (warning)
- ⚠️ Unused variables with `_` prefix allowed
- ❌ Explicit return types not required

### React-Specific Rules
- ✅ React Hooks rules enforced
- ❌ PropTypes not required (using TypeScript)
- ⚠️ Hook dependencies checked

## 🛠️ Customization

### Adding New ESLint Rules

Edit `eslint.config.js`:
```javascript
rules: {
  "no-console": "error", // Change console to error
  "prefer-const": "warn", // Add new rule
}
```

### Changing Prettier Rules

Edit `.prettierrc.json`:
```json
{
  "singleQuote": true,  // Use single quotes
  "printWidth": 100     // Longer lines
}
```

### Excluding Files from Linting

Edit the `ignores` array in `eslint.config.js`:
```javascript
ignores: [
  "**/generated/**",  // Add new pattern
]
```

## 🧪 Testing Your Setup

### 1. Test Prettier
```bash
npm run format:check
```
Should show which files need formatting.

### 2. Test ESLint
```bash
npm run lint
```
Should show linting errors and warnings.

### 3. Test Pre-Commit Hook
```bash
# Make a change
echo "const test = 1" >> test.js
git add test.js
git commit -m "test"
# Should auto-fix and format
```

### 4. Test Auto-Fix
```bash
npm run lint:fix
npm run format
```
Should fix most issues automatically.

## 🔍 Common Issues & Solutions

### Issue: ESLint finds too many errors
**Solution:** Run auto-fix first
```bash
npm run lint:fix
npm run format
```

### Issue: Pre-commit hook is slow
**Solution:** lint-staged only runs on changed files, but if you have many staged files, it may be slow. Commit in smaller chunks.

### Issue: Prettier and ESLint conflict
**Solution:** We use `eslint-config-prettier` to disable conflicting rules. If you see conflicts, this config may need updating.

### Issue: Hook doesn't run
**Solution:** Reinitialize Husky
```bash
npm run prepare
```

### Issue: Want to skip hooks temporarily
**Solution:** Use `--no-verify` (not recommended)
```bash
git commit --no-verify -m "skip hooks"
```

## 📊 Integration Benefits

### For Developers
- ✅ Automatic code formatting
- ✅ Catch errors before commit
- ✅ Consistent code style
- ✅ Less time in code review

### For Code Review
- ✅ Focus on logic, not style
- ✅ Automated feedback on PRs
- ✅ Faster review process
- ✅ Consistent standards

### For CI/CD
- ✅ Fail fast on formatting issues
- ✅ Automated quality checks
- ✅ No unformatted code in main branch

## 🔗 Resources

- [ESLint v9 Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Reviewdog GitHub Action](https://github.com/reviewdog/reviewdog)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Check linting | `npm run lint` |
| Fix linting | `npm run lint:fix` |
| Check formatting | `npm run format:check` |
| Format code | `npm run format` |
| Run both | `npm run lint:fix && npm run format` |
| Skip pre-commit | `git commit --no-verify` |
| Reinit hooks | `npm run prepare` |

---

**Last Updated**: November 9, 2025
