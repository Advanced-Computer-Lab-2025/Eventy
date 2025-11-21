# Prettier Pre-Commit Hook Setup

This document describes the Prettier code formatting setup with pre-commit hooks for the Eventy project.

## 🎯 Overview

The project uses **Prettier** for automatic code formatting, integrated with **Husky** and **lint-staged** to ensure all committed code is properly formatted.

## 📦 Components

### 1. Prettier

- **Purpose**: Opinionated code formatter
- **Config File**: `.prettierrc.json`
- **Ignore File**: `.prettierignore`

### 2. Husky

- **Purpose**: Git hooks management
- **Config**: `.husky/` directory
- **Version**: 9.1.7

### 3. lint-staged

- **Purpose**: Run Prettier only on staged files
- **Config**: `lint-staged` section in `package.json`

## 🔧 Configuration Details

### Prettier Rules (`.prettierrc.json`)

```json
{
  "semi": true, // Add semicolons
  "trailingComma": "es5", // Trailing commas where valid in ES5
  "singleQuote": false, // Use double quotes
  "printWidth": 80, // Line length limit
  "tabWidth": 2, // 2 spaces per indentation
  "useTabs": false, // Use spaces, not tabs
  "arrowParens": "always", // Always use parens for arrow functions
  "endOfLine": "lf", // Unix-style line endings
  "bracketSpacing": true, // Spaces in object literals
  "bracketSameLine": false, // JSX closing bracket on new line
  "proseWrap": "preserve" // Don't wrap markdown text
}
```

### Supported File Types

Prettier will format the following file types:

- JavaScript (`.js`)
- JSX (`.jsx`)
- TypeScript (`.ts`, `.tsx`)
- JSON (`.json`)
- CSS (`.css`)
- SCSS (`.scss`)
- Markdown (`.md`)

### Excluded Files (`.prettierignore`)

The following are automatically excluded from formatting:

- Dependencies (`node_modules`, lock files)
- Build outputs (`dist`, `build`, `.next`, etc.)
- Generated files (`.cache`, `*.tsbuildinfo`, etc.)
- Environment files (`.env*`)
- Public/static assets
- Database files
- IDE directories (`.vscode`, `.idea`, `.local`)

## 🚀 Usage

### Automatic Formatting (Pre-Commit Hook)

Every time you commit code, the pre-commit hook will:

1. Detect all staged files matching the configured patterns
2. Run Prettier on those files
3. Add the formatted changes to the commit
4. Complete the commit

**Example:**

```bash
git add .
git commit -m "feat: add new feature"
# Prettier runs automatically on staged files
```

### Manual Formatting

#### Format All Files

```bash
npm run format
```

#### Check Formatting Without Changes

```bash
npm run format:check
```

This is useful for CI/CD pipelines to verify code is properly formatted.

## 🔍 How It Works

### Pre-Commit Hook Flow

```
Developer commits code
        ↓
Husky triggers .husky/pre-commit
        ↓
lint-staged runs on staged files
        ↓
Prettier formats matching files
        ↓
Formatted changes added to commit
        ↓
Commit completes
```

### lint-staged Configuration

In `package.json`:

```json
{
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx,json,css,scss,md}": ["prettier --write"]
  }
}
```

This tells lint-staged to:

- Match staged files with the specified extensions
- Run `prettier --write` on them
- Stage the formatted changes

## 🛠️ Maintenance

### Updating Prettier Rules

1. Edit `.prettierrc.json` with your desired rules
2. Run `npm run format` to apply new rules to all files
3. Commit the changes

### Adding File Types

To format additional file types:

1. Update the glob pattern in `package.json` under `lint-staged`
2. Update the scripts section if needed
3. Test with `npm run format:check`

### Excluding Additional Files

Add patterns to `.prettierignore`:

```
# Example: Exclude generated API files
src/api/generated/**
```

## 🧪 Testing the Setup

### Test the Pre-Commit Hook

1. Make a change to any file
2. Stage the file: `git add <file>`
3. Commit: `git commit -m "test: verify prettier hook"`
4. Check the output - you should see lint-staged running

### Verify Configuration

```bash
# Check which files would be formatted
npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,scss,md}"

# Format all files and see what changes
npm run format
```

## 🔗 Integration with CI/CD

### GitHub Actions Example

Add this to your workflow for the reviewdog integration:

```yaml
- name: Check code formatting
  run: npm run format:check
```

This will fail the CI pipeline if any files are not properly formatted.

## 📚 Resources

- [Prettier Documentation](https://prettier.io/docs/en/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)

## 🆘 Troubleshooting

### Hook Not Running

```bash
# Reinitialize Husky
npm run prepare
```

### Files Not Being Formatted

1. Check if the file type is in the lint-staged pattern
2. Verify the file isn't in `.prettierignore`
3. Run manually: `npx prettier --write <file>`

### Bypass Hook (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
```

**Note**: Only use this in emergencies. All code should be properly formatted.

## ✅ Benefits

- **Consistency**: All code follows the same style rules
- **Automation**: No manual formatting needed
- **Code Review**: Focus on logic, not style
- **Onboarding**: New developers don't need to learn style rules
- **Clean Commits**: Every commit has properly formatted code

---

**Last Updated**: November 8, 2025
