# AGENTS.md - Coding Agent Guidelines

> Quick reference for AI coding agents working in the antigravity-kit repository

---

## Project Overview

This is a monorepo containing AI agent templates with Skills, Agents, and Workflows for enhanced coding assistance. Main components:
- `.agent/` - Core agent system (16 agents, 40 skills, 11 workflows)
- `web/` - Next.js documentation website
- `nguyencoder-cli/` - CLI tool for installing agent templates
- `nguyencoder-kit/` - Preset configurations

---

## Build, Lint & Test Commands

### Web Application (Next.js)
```bash
# Working directory: ./web
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### CLI Tool
```bash
# Working directory: ./nguyencoder-cli
npm install              # Install dependencies
node bin/index.js        # Run CLI locally
```

### Running Single Tests
No test framework is currently configured in package.json. If you add tests:
- For Jest: `npm test -- path/to/test.spec.ts`
- For Vitest: `npm test path/to/test.spec.ts`

---

## Code Style Guidelines

### General Principles (from .agent/rules/GEMINI.md)
Follow clean-code standards - **concise, direct, solution-focused**:
- **SRP**: Single Responsibility - one function/class does ONE thing
- **DRY**: Don't Repeat Yourself - extract duplicates
- **KISS**: Keep It Simple - simplest solution that works
- **YAGNI**: Don't build unused features
- **Boy Scout Rule**: Leave code cleaner than you found it

### Formatting (.editorconfig)
```
indent_style = space
indent_size = 4              # Default for most files
indent_size = 2              # For JSON, YAML, YML
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### TypeScript Configuration (web/tsconfig.json)
```json
{
  "compilerOptions": {
    "strict": true,           # Strict type checking enabled
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]      # Use @ for src imports
    }
  }
}
```

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase, reveal intent | `userCount`, not `n` |
| Functions | verb + noun | `getUserById()`, not `user()` |
| Booleans | Question form | `isActive`, `hasPermission`, `canEdit` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| React Components | PascalCase | `CodeBlock`, `UserProfile` |

### Import Order
1. External packages (React, Next.js, etc.)
2. Internal modules with `@/` prefix
3. Relative imports
4. Type imports (if separated)

Example:
```typescript
import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";
import { Lightbulb, Palette } from "lucide-react";
```

### Function Rules
- **Small**: Max 20 lines, ideally 5-10
- **One Thing**: Does one thing, does it well
- **Few Args**: Max 3 arguments, prefer 0-2
- **No Side Effects**: Don't mutate inputs unexpectedly
- **Guard Clauses**: Use early returns for edge cases
- **Flat > Nested**: Avoid deep nesting (max 2 levels)

### Error Handling
- Use try-catch for async operations
- Handle errors at appropriate boundaries
- Don't swallow errors silently
- Return meaningful error messages

### Comments
- **Avoid obvious comments** - code should be self-documenting
- Only comment WHY, not WHAT
- If you need a comment to explain a name, rename it instead
- JSDoc for public APIs only

### React/Next.js Specific
- Use functional components with hooks
- Prefer `type` over `interface` for component props
- Export metadata for pages: `export const metadata: Metadata = {...}`
- Use `@/` path alias for imports from `src/`
- Follow Next.js App Router conventions (app directory)

---

## Anti-Patterns (DON'T)

| ❌ Avoid | ✅ Do Instead |
|---------|---------------|
| Comment every line | Delete obvious comments |
| Helper for one-liner | Inline the code |
| Deep nesting (>2 levels) | Use guard clauses |
| Magic numbers | Named constants |
| 100+ line functions | Split by responsibility |
| `utils.ts` with 1 function | Put code where it's used |
| Verbose explanations in code | Just write clean code |

---

## File Dependencies Protocol

**CRITICAL: Before modifying ANY file, ask:**
1. What imports this file? (They might break)
2. What does this file import? (Interface changes propagate)
3. What tests cover this? (Tests might fail)
4. Is this a shared component? (Multiple places affected)

**Rule**: Edit the file + all dependent files in the SAME task. Never leave broken imports.

---

## Workflow Integration

### Slash Commands Available
When working with agents, these workflows are available:
- `/brainstorm` - Explore options before implementation
- `/create` - Create new features or apps
- `/debug` - Systematic debugging
- `/deploy` - Deploy application
- `/enhance` - Improve existing code
- `/plan` - Create task breakdown
- `/test` - Generate and run tests

### Socratic Gate Protocol
**MANDATORY for complex requests:**
- For new features: Ask minimum 3 strategic questions
- For code edits: Confirm understanding + ask impact questions
- Never assume - if 1% is unclear, ASK
- Do NOT invoke tools until user clears the gate

---

## Verification Scripts

Agents must run relevant verification scripts after completing work:

| Script | When to Use | Command |
|--------|-------------|---------|
| Lint | Every code change | `python .agent/skills/lint-and-validate/scripts/lint_runner.py .` |
| Security Scan | Always on deploy | `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .` |
| UX Audit | After UI change | `python .agent/skills/frontend-design/scripts/ux_audit.py .` |
| Test Runner | After logic change | `python .agent/skills/testing-patterns/scripts/test_runner.py .` |
| Schema Validator | After DB change | `python .agent/skills/database-design/scripts/schema_validator.py .` |

**Script Output Protocol:**
1. Run script and capture output
2. Parse errors, warnings, passes
3. Summarize to user with counts
4. Ask for confirmation before fixing
5. Re-run after fixes to confirm

---

## Self-Check Before Completing

**Before saying "task complete", verify:**
- ✅ Goal met? (Did exactly what user asked)
- ✅ Files edited? (All necessary files modified)
- ✅ Code works? (Tested/verified the change)
- ✅ No errors? (Lint and TypeScript pass)
- ✅ Nothing forgotten? (Edge cases handled)

**If ANY check fails, fix it before completing.**

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `.agent/rules/GEMINI.md` | Master AI orchestrator rules (P0 priority) |
| `.agent/ARCHITECTURE.md` | Full system documentation |
| `.editorconfig` | Formatting standards |
| `web/tsconfig.json` | TypeScript configuration |
| `web/eslint.config.mjs` | ESLint rules |

---

## Quick Tips

1. **Start with planning** - Use `/plan` or `/brainstorm` for complex features
2. **Write code directly** - Don't write tutorials, write working code
3. **Let code self-document** - Rename instead of commenting
4. **Fix bugs immediately** - Don't explain the fix first
5. **Keep functions small** - 5-10 lines is ideal
6. **Use guard clauses** - Early returns over deep nesting
7. **Run verification** - Always verify with appropriate scripts
8. **Read before editing** - Understand agent/skill rules first

---

**Version**: 2.0  
**Last Updated**: 2026-01-27  
**Priority**: CRITICAL - All agents must follow these guidelines
