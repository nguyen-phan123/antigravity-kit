# NguyenCoder Kit

This package contains the agent preset configurations and registry for the ncli tool.

## Structure

```
nguyencoder-kit/
├── presets/           # Preset configurations (JSON files)
│   ├── minimal.json
│   ├── web-full.json
│   └── backend-full.json
└── registry/          # Full agent system copy
    ├── agents/        # All available agents
    ├── skills/        # All available skills
    ├── workflows/     # All available workflows
    ├── rules/         # System rules
    ├── .shared/       # Shared resources
    └── root/          # Root files (ARCHITECTURE.md)
```

## Presets

### minimal
Bare minimum: core rules and clean code principles only
- skills/clean-code
- skills/brainstorming
- rules/GEMINI.md

### web-full
Complete web development stack with React, Next.js, and frontend tools
- Includes frontend specialist agent
- React, Next.js, Tailwind patterns
- SEO, performance profiling
- Deploy and preview workflows

### backend-full
Complete backend development stack with Node.js, NestJS, and databases
- Includes backend specialist agent
- Node.js, NestJS, Prisma patterns
- Database design, API patterns
- Docker, deployment workflows

## Maintaining the Registry

The `registry/` folder is a copy of the main `.agent/` folder structure. When updating agent content:

1. Update the main `.agent/` folder
2. Sync to registry:
```bash
cd nguyencoder-kit
rm -rf registry
mkdir -p registry/root
cp -r ../.agent/agents registry/
cp -r ../.agent/skills registry/
cp -r ../.agent/workflows registry/
cp -r ../.agent/rules registry/
cp -r ../.agent/.shared registry/
cp ../.agent/ARCHITECTURE.md registry/root/
```

## Usage with ncli

Users install presets via the ncli tool:

```bash
# Initialize with a preset
ncli init --kit minimal

# Install the agent system
ncli install

# Add additional modules
ncli add skills react-patterns
ncli install
```
