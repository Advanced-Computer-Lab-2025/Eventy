# Contributing to Eventy

Thank you for your interest in contributing to Eventy! We welcome contributions from the community and appreciate your help in making this project better.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Issue Creation](#issue-creation)
- [Contribution Guidelines](#contribution-guidelines)
- [Code Review Process](#code-review-process)
- [Development Workflow](#development-workflow)

## Ways to Contribute

We welcome contributions in various forms:

### High Priority Improvements

1. **Implement Real-time Notifications**: Use WebSockets or Server-Sent Events for live updates
2. **Mobile App Development**: Create React Native or Flutter mobile applications
3. **Advanced Search**: Implement Elasticsearch for better search performance
4. **Automated Testing**: Add Jest unit tests and integration tests
5. **Accessibility**: Improve ARIA labels and keyboard navigation

### Medium Priority

6. **Multi-language Support**: Add i18n for Arabic and other languages
7. **Dark Mode Enhancement**: Complete dark mode theming across all components
8. **Analytics Dashboard**: More detailed charts and metrics using Chart.js or Recharts
9. **Advanced Filters**: Add more granular filtering options

### Other Contributions

- Bug fixes
- Documentation improvements
- Performance optimizations
- UI/UX enhancements
- Code refactoring
- Writing tests

## Getting Started

1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Eventy.git
   cd Eventy
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Advanced-Computer-Lab-2025/Eventy.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```
5. **Set up environment variables** - See README.md for details
6. **Create a new branch** for your feature:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Issue Creation

Before starting work on a contribution, please check if an issue already exists. If not, create one!

### Creating a Bug Report

When reporting a bug, please include:

- **Clear, descriptive title**: Summarize the issue in one line
- **Steps to reproduce**: Detailed steps to reproduce the behavior
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Screenshots**: If applicable, add screenshots to help explain the problem
- **Environment details**:
  - OS (Windows, macOS, Linux)
  - Node.js version
  - Browser (if frontend issue)
  - Any relevant console errors

**Example:**

```markdown
**Title:** Login fails with valid credentials

**Steps to reproduce:**

1. Navigate to /login
2. Enter valid email and password
3. Click "Login" button

**Expected:** User should be redirected to dashboard
**Actual:** Error message "Invalid credentials" appears

**Environment:**

- OS: Windows 11
- Node.js: v18.17.0
- Browser: Chrome 120.0
```

### Creating a Feature Request

When requesting a feature, please include:

- **Clear, descriptive title**: Summarize the feature in one line
- **Problem statement**: Describe the problem this feature would solve
- **Proposed solution**: Describe how you envision the feature working
- **Alternatives considered**: Any alternative solutions you've thought about
- **Additional context**: Screenshots, mockups, or examples from other applications

**Example:**

```markdown
**Title:** Add export to PDF option for event reports

**Problem:** Users can only export reports to Excel, but some need PDF format for printing

**Proposed solution:** Add a "Export to PDF" button next to the existing "Export to Excel" button

**Alternatives:** Could offer both formats in a dropdown menu

**Additional context:** Similar to how Google Analytics handles report exports
```

### Creating a Task/Enhancement Issue

For improvements or tasks:

- **Clear, descriptive title**: What needs to be done
- **Description**: Detailed explanation of the task
- **Acceptance criteria**: How to verify the task is complete
- **Related issues**: Link to any related issues or PRs

**Example:**

```markdown
**Title:** Refactor event validation logic into reusable utility

**Description:**
Currently, event validation is duplicated across multiple controllers.
We should extract this into a centralized utility function.

**Acceptance criteria:**

- [ ] Create utils/eventValidation.js
- [ ] Move validation logic from controllers
- [ ] Update all controllers to use the new utility
- [ ] Add unit tests for validation utility
- [ ] Update documentation

**Related issues:** Closes #123
```

## Contribution Guidelines

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feat/` - New features (e.g., `feat/add-calendar-export`)
- `fix/` - Bug fixes (e.g., `fix/login-validation-error`)
- `docs/` - Documentation updates (e.g., `docs/update-api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/event-service`)
- `test/` - Adding or updating tests (e.g., `test/add-user-service-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Commit Message Format

Write clear, descriptive commit messages:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(events): add calendar export functionality

fix(auth): resolve token expiration issue

docs(readme): update installation instructions

refactor(user-service): simplify user validation logic
```

### Code Style

1. **Follow existing patterns**: Match the style of the surrounding code
2. **Use ESLint and Prettier**: Run `npm run lint` and `npm run format` before committing
3. **Naming conventions**:
   - **camelCase** for variables and functions
   - **PascalCase** for React components and classes
   - **UPPER_SNAKE_CASE** for constants
   - **kebab-case** for file names
4. **Write meaningful names**: Variables and functions should be self-documenting
5. **Add comments**: Explain complex logic, but avoid obvious comments
6. **Keep functions small**: Each function should do one thing well

### Testing

- Add tests for new features when possible
- Ensure existing tests pass: `npm test` (when available)
- Test manually in the browser/Postman for user-facing changes
- Include test cases in your PR description

### Documentation

- Update README.md if you add new features or change existing functionality
- Add JSDoc comments for new functions and classes
- Update API documentation if you modify routes
- Include usage examples for new features

## Code Review Process

### Before Submitting a Pull Request

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. **Run linters**:
   ```bash
   npm run lint
   npm run format
   ```
3. **Test your changes** thoroughly
4. **Update documentation** as needed
5. **Write a clear PR description** (see below)

### Pull Request Guidelines

Your PR description should include:

- **Summary**: Brief description of what the PR does
- **Related issues**: Link to related issues (e.g., "Closes #123")
- **Changes made**: List of key changes
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes, include before/after screenshots
- **Checklist**: Use the PR template checklist

**Example PR Description:**

```markdown
## Summary

Adds export to PDF functionality for event reports

## Related Issues

Closes #234

## Changes Made

- Added PDFKit dependency
- Created PDF generation utility in `utils/pdfGenerator.js`
- Added "Export to PDF" button to SalesReport component
- Updated API route to handle PDF export requests

## Testing

- Tested PDF export with various date ranges
- Verified PDF formatting and data accuracy
- Tested in Chrome, Firefox, and Safari

## Screenshots

![PDF Export Button](screenshot-url)
![Generated PDF Sample](pdf-sample-url)

## Checklist

- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Documentation updated
- [x] No new warnings generated
- [x] Tests added (if applicable)
```

### Review Process

1. **Automated checks**: All PRs must pass ESLint, Prettier, and CI/CD checks
2. **Code review**: At least one approval from a maintainer is required
3. **Address feedback**: Respond to all review comments
4. **Make changes**: Push additional commits to address feedback
5. **Re-request review**: After making changes, re-request review from reviewers
6. **Merge**: Maintainers will merge once all checks pass and approvals are received

### What Reviewers Look For

- **Code quality**: Is the code clean, readable, and maintainable?
- **Functionality**: Does it work as intended? Are there edge cases?
- **Performance**: Could this impact performance negatively?
- **Security**: Are there any security concerns?
- **Testing**: Are there adequate tests?
- **Documentation**: Is the code well-documented?
- **Breaking changes**: Does this break existing functionality?

## Development Workflow

### Typical Workflow

1. **Find or create an issue** to work on
2. **Comment on the issue** to let others know you're working on it
3. **Fork and clone** the repository
4. **Create a branch** from `main`
5. **Make your changes** with clear, atomic commits
6. **Test thoroughly** - both automated and manual testing
7. **Push to your fork** and create a pull request
8. **Respond to feedback** during code review
9. **Celebrate!** 🎉 Your contribution has been merged

### Keeping Your Fork in Sync

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Getting Help

If you need help or have questions:

- **Check the documentation**: README.md and code comments
- **Ask in the issue**: Comment on the related issue
- **Contact maintainers**: Reach out via GitHub discussions or issue comments

## Recognition

Contributors will be acknowledged in:

- Release notes for significant contributions
- GitHub's contributor graph

Thank you for contributing to Eventy! 🚀
