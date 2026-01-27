#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { downloadTemplate } from 'giget';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_REPO = 'github:nguyen-phan123/antigravity-kit';
const CONFIG_FILE = 'agent.config.json';
const TEMP_DIR = '.temp_nguyencoder_kit';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Read agent.config.json from current directory
 */
function readConfig(targetDir) {
    const configPath = path.join(targetDir, CONFIG_FILE);
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return null;
}

/**
 * Write agent.config.json to current directory
 */
function writeConfig(targetDir, config) {
    const configPath = path.join(targetDir, CONFIG_FILE);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Load a preset from the registry
 */
function loadPreset(tempDir, presetName) {
    // Support both "presets/minimal" and "minimal" formats
    let presetPath = path.join(tempDir, presetName);
    if (!presetPath.endsWith('.json')) {
        presetPath += '.json';
    }
    
    // If not found, try nguyencoder-kit subdirectory (for full repo downloads)
    if (!fs.existsSync(presetPath)) {
        presetPath = path.join(tempDir, 'nguyencoder-kit', presetName);
        if (!presetPath.endsWith('.json')) {
            presetPath += '.json';
        }
    }
    
    // If still not found and presetName doesn't start with "presets/", try adding it
    if (!fs.existsSync(presetPath) && !presetName.startsWith('presets/')) {
        presetPath = path.join(tempDir, 'nguyencoder-kit', 'presets', presetName);
        if (!presetPath.endsWith('.json')) {
            presetPath += '.json';
        }
    }
    
    if (!fs.existsSync(presetPath)) {
        throw new Error(`Preset "${presetName}" not found`);
    }
    return JSON.parse(fs.readFileSync(presetPath, 'utf-8'));
}

/**
 * Resolve final list of modules from config
 */
function resolveModules(preset, include = [], exclude = []) {
    let modules = [...preset.modules];
    
    // Add included modules
    include.forEach(mod => {
        if (!modules.includes(mod)) {
            modules.push(mod);
        }
    });
    
    // Remove excluded modules
    modules = modules.filter(mod => !exclude.includes(mod));
    
    return modules;
}

/**
 * Copy a module from registry to .agent folder
 */
function copyModule(tempDir, destAgentDir, modulePath) {
    // Try multiple possible source locations
    let sourcePath = path.join(tempDir, 'registry', modulePath);
    let foundInRegistry = true;
    
    // Try to find module with exact path, then with .md extension
    if (!fs.existsSync(sourcePath)) {
        // Try .md extension in registry
        if (fs.existsSync(sourcePath + '.md')) {
            sourcePath += '.md';
        } else {
            // Try nguyencoder-kit/registry (for full repo downloads)
            sourcePath = path.join(tempDir, 'nguyencoder-kit', 'registry', modulePath);
            if (!fs.existsSync(sourcePath)) {
                if (fs.existsSync(sourcePath + '.md')) {
                    sourcePath += '.md';
                } else {
                    // Try .agent directory (for antigravity-kit repo)
                    sourcePath = path.join(tempDir, '.agent', modulePath);
                    if (!fs.existsSync(sourcePath)) {
                        if (fs.existsSync(sourcePath + '.md')) {
                            sourcePath += '.md';
                        } else {
                            // Not in registry, try root level (for backward compatibility)
                            sourcePath = path.join(tempDir, modulePath);
                            foundInRegistry = false;
                            
                            if (!fs.existsSync(sourcePath)) {
                                // Try .md extension in root
                                if (fs.existsSync(sourcePath + '.md')) {
                                    sourcePath += '.md';
                                } else {
                                    console.warn(chalk.yellow(`  ⚠ Module not found: ${modulePath}`));
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Determine destination based on module type
    const parts = modulePath.split('/');
    const type = parts[0]; // skills, agents, workflows, rules, root
    const name = parts.slice(1).join('/');
    
    let destPath;
    if (type === 'root') {
        destPath = path.join(destAgentDir, name);
    } else {
        destPath = path.join(destAgentDir, type, name);
    }
    
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    // Copy file or folder
    if (fs.statSync(sourcePath).isDirectory()) {
        fs.cpSync(sourcePath, destPath, { recursive: true });
    } else {
        // If it's a file, ensure destination has extension if source has one
        if (path.extname(sourcePath) && !path.extname(destPath)) {
            destPath += path.extname(sourcePath);
        }
        fs.copyFileSync(sourcePath, destPath);
    }
    
    return true;
}

/**
 * Apply local overrides
 */
function applyOverrides(destAgentDir, overrides) {
    for (const [modulePath, localPath] of Object.entries(overrides)) {
        const destPath = path.join(destAgentDir, modulePath);
        const sourcePath = path.resolve(localPath);
        
        if (!fs.existsSync(sourcePath)) {
            console.warn(chalk.yellow(`  ⚠ Override not found: ${localPath}`));
            continue;
        }
        
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        
        if (fs.statSync(sourcePath).isDirectory()) {
            fs.cpSync(sourcePath, destPath, { recursive: true });
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}

// ============================================================================
// COMMANDS
// ============================================================================

const program = new Command();

program
    .name('ncli')
    .description('Modular Assembler for NguyenCoder AI Kit')
    .version('2.2.0');

// ─────────────────────────────────────────────────────────────
// INIT COMMAND - Initialize with a preset
// ─────────────────────────────────────────────────────────────
program
    .command('init')
    .description('Initialize a new agent.config.json with a preset')
    .option('-k, --kit <preset>', 'Preset kit to use (web-full, backend-full, minimal)', 'minimal')
    .option('-s, --source <repo>', 'GitHub repository source', DEFAULT_REPO)
    .action(async (options) => {
        console.log(chalk.bold.blue('\n🚀 NguyenCoder Kit - Modular Assembler\n'));
        
        const targetDir = process.cwd();
        const configPath = path.join(targetDir, CONFIG_FILE);
        
        // Check if config already exists
        if (fs.existsSync(configPath)) {
            const { overwrite } = await inquirer.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: `${CONFIG_FILE} already exists. Overwrite?`,
                default: false
            }]);
            
            if (!overwrite) {
                console.log(chalk.yellow('Operation cancelled.'));
                return;
            }
        }
        
        // Create config file
        const config = {
            source: options.source,
            base: `presets/${options.kit}`,
            include: [],
            exclude: [],
            overrides: {}
        };
        
        writeConfig(targetDir, config);
        
        console.log(chalk.green(`✓ Created ${CONFIG_FILE}`));
        console.log(chalk.gray(`  Base: ${options.kit}`));
        console.log(chalk.gray(`  Source: ${options.source}\n`));
        console.log(chalk.white('Run ') + chalk.cyan('nguyencoder-cli install') + chalk.white(' to assemble .agent folder.\n'));
    });

// ─────────────────────────────────────────────────────────────
// INSTALL COMMAND - Assemble .agent from config
// ─────────────────────────────────────────────────────────────
program
    .command('install')
    .description('Assemble .agent folder based on agent.config.json')
    .option('-f, --force', 'Overwrite existing .agent folder', false)
    .action(async (options) => {
        console.log(chalk.bold.blue('\n🔧 NguyenCoder Kit - Installing...\n'));
        
        const targetDir = process.cwd();
        const config = readConfig(targetDir);
        
        if (!config) {
            console.log(chalk.red(`Error: ${CONFIG_FILE} not found.`));
            console.log(chalk.yellow(`Run ${chalk.cyan('nguyencoder-cli init')} first.\n`));
            return;
        }
        
        const destAgentDir = path.join(targetDir, '.agent');
        
        // Check if .agent exists
        if (fs.existsSync(destAgentDir) && !options.force) {
            const { overwrite } = await inquirer.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: '.agent folder exists. Overwrite?',
                default: false
            }]);
            
            if (!overwrite) {
                console.log(chalk.yellow('Operation cancelled.'));
                return;
            }
        }
        
        const spinner = ora(`Fetching registry from ${config.source}...`).start();
        const tempDir = path.join(targetDir, TEMP_DIR);
        
        try {
            // Determine if source is local or remote
            const isExplicitLocalPath = config.source.startsWith('./') || 
                                       config.source.startsWith('../') || 
                                       config.source.startsWith('/') ||
                                       config.source.startsWith('~');
            
            const isGitHubFormat = config.source.startsWith('github:') || 
                                  config.source.includes('/') && !config.source.includes('\\');
            
            // Priority: Explicit local > GitHub format > Implicit local fallback
            if (isExplicitLocalPath) {
                // User explicitly wants a local path (./path or ../path or /abs/path)
                const resolvedPath = path.resolve(config.source);
                spinner.text = 'Using local source...';
                
                if (!fs.existsSync(resolvedPath)) {
                    throw new Error(`Local path not found: ${resolvedPath}`);
                }
                
                if (!fs.statSync(resolvedPath).isDirectory()) {
                    throw new Error(`Source is not a directory: ${resolvedPath}`);
                }
                
                // Clean temp dir
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }

                // Copy local source to temp
                fs.cpSync(resolvedPath, tempDir, { 
                    recursive: true,
                    filter: (src) => !src.includes('.git') && !src.includes('node_modules')
                });
            } else if (isGitHubFormat || !fs.existsSync(config.source)) {
                // Use giget for remote sources (GitHub repos)
                spinner.text = 'Downloading from GitHub...';
                try {
                    await downloadTemplate(config.source, {
                        dir: tempDir,
                        force: true
                    });
                } catch (downloadErr) {
                    if (downloadErr.message.includes('404')) {
                        throw new Error(`Repository not found: ${config.source}\n    👉 Tip: If this is a private repo, check your auth token.\n    👉 Tip: For local paths, use ./path or ../path (explicit local)`);
                    }
                    throw downloadErr;
                }
            } else {
                // Fallback: Ambiguous name that exists as local directory
                // Warn the user about this behavior
                spinner.warn(chalk.yellow(`Using local directory: ${config.source}`));
                spinner.text = 'Copying local source...';
                console.log(chalk.gray(`    💡 Tip: Use ./${config.source} to avoid ambiguity\n`));
                
                if (!fs.statSync(config.source).isDirectory()) {
                    throw new Error(`Source is not a directory: ${config.source}`);
                }
                
                // Clean temp dir
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }

                // Copy local source to temp
                fs.cpSync(config.source, tempDir, { 
                    recursive: true,
                    filter: (src) => !src.includes('.git') && !src.includes('node_modules')
                });
                
                spinner.start();
            }
            
            // ─────────────────────────────────────────────────────────
            // CORE COMPONENTS INSTALLATION (Auto-include)
            // ─────────────────────────────────────────────────────────
            spinner.text = 'Installing core components (Agents, Architecture, Shared)...';
            
            // Determine registry path (support multiple structures)
            let registryDir;
            if (fs.existsSync(path.join(tempDir, 'registry'))) {
                // Standalone nguyencoder-kit with registry folder
                registryDir = path.join(tempDir, 'registry');
            } else if (fs.existsSync(path.join(tempDir, 'nguyencoder-kit', 'registry'))) {
                // Full repo with nguyencoder-kit subdirectory
                registryDir = path.join(tempDir, 'nguyencoder-kit', 'registry');
            } else if (fs.existsSync(path.join(tempDir, '.agent'))) {
                // Full antigravity-kit repo - use .agent directly
                registryDir = path.join(tempDir, '.agent');
            } else {
                // Fallback to root
                registryDir = tempDir;
            }
            
            // 1. Copy All Agents
            const agentsSource = path.join(registryDir, 'agents');
            const agentsDest = path.join(destAgentDir, 'agents');
            if (fs.existsSync(agentsSource)) {
                fs.mkdirSync(agentsDest, { recursive: true });
                fs.cpSync(agentsSource, agentsDest, { recursive: true });
            }

            // 2. Copy Architecture
            const archSource = path.join(registryDir, 'root', 'ARCHITECTURE.md');
            const archSourceAlt = path.join(registryDir, 'ARCHITECTURE.md');
            const archDest = path.join(destAgentDir, 'ARCHITECTURE.md');
            if (fs.existsSync(archSource)) {
                fs.copyFileSync(archSource, archDest);
            } else if (fs.existsSync(archSourceAlt)) {
                fs.copyFileSync(archSourceAlt, archDest);
            }

            // 3. Copy Shared Resources
            const sharedSource = path.join(registryDir, '.shared');
            const sharedDest = path.join(destAgentDir, '.shared');
            if (fs.existsSync(sharedSource)) {
                fs.mkdirSync(sharedDest, { recursive: true });
                fs.cpSync(sharedSource, sharedDest, { recursive: true });
            }

            // ─────────────────────────────────────────────────────────
            // MODULAR ASSEMBLY
            // ─────────────────────────────────────────────────────────
            spinner.text = 'Resolving modules...';
            
            // Load preset
            const preset = loadPreset(tempDir, config.base);
            
            // Resolve final module list
            const modules = resolveModules(preset, config.include, config.exclude);
            
            spinner.text = `Assembling ${modules.length} optional modules...`;
            
            // Clean destination? NO, we just created it with core components.
            // But we need to ensure destAgentDir exists if core components didn't create it (unlikely)
            if (!fs.existsSync(destAgentDir)) fs.mkdirSync(destAgentDir, { recursive: true });
            
            // Copy each module
            let copied = 0;
            for (const mod of modules) {
                // Skip if it tries to copy agents or root/ARCH again (though safe to overwrite, better to skip)
                if (mod.startsWith('agents/') || mod === 'root/ARCHITECTURE.md') {
                    continue; 
                }
                
                if (copyModule(tempDir, destAgentDir, mod)) {
                    copied++;
                }
            }
            
            // Apply overrides
            if (config.overrides && Object.keys(config.overrides).length > 0) {
                spinner.text = 'Applying overrides...';
                applyOverrides(destAgentDir, config.overrides);
            }
            
            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });
            
            spinner.succeed(chalk.green(`Successfully assembled ${copied}/${modules.length} modules!`));
            console.log(chalk.gray('\n────────────────────────────────────────'));
            console.log(`Source:  ${chalk.cyan(config.source)}`);
            console.log(`Base:    ${chalk.cyan(preset.name)}`);
            console.log(`Include: ${chalk.gray(config.include.length ? config.include.join(', ') : '(none)')}`);
            console.log(`Exclude: ${chalk.gray(config.exclude.length ? config.exclude.join(', ') : '(none)')}`);
            console.log(chalk.gray('────────────────────────────────────────\n'));
            
        } catch (err) {
            spinner.fail(chalk.red('Installation failed.'));
            console.error(chalk.red(err.message));
            if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

// ─────────────────────────────────────────────────────────────
// ADD COMMAND - Add a module to config
// ─────────────────────────────────────────────────────────────
// Helper for add commands
function addToConfig(type, name) {
    const targetDir = process.cwd();
    const config = readConfig(targetDir);
    
    if (!config) {
        console.log(chalk.red(`Error: ${CONFIG_FILE} not found.\n`));
        return;
    }
    
    const modulePath = `${type}/${name}`;
    
    // Remove from exclude if present
    config.exclude = config.exclude.filter(m => m !== modulePath);
    
    // Add to include if not present
    if (!config.include.includes(modulePath)) {
        config.include.push(modulePath);
    }
    
    writeConfig(targetDir, config);
    console.log(chalk.green(`✓ Added ${chalk.cyan(modulePath)} to include list.`));
    console.log(chalk.gray(`Run ${chalk.cyan('nguyencoder-cli install')} to apply changes.\n`));
}

// Helper for remove commands
function removeFromConfig(type, name) {
    const targetDir = process.cwd();
    const config = readConfig(targetDir);
    
    if (!config) {
        console.log(chalk.red(`Error: ${CONFIG_FILE} not found.\n`));
        return;
    }
    
    const modulePath = `${type}/${name}`;
    
    // Remove from include if present
    config.include = config.include.filter(m => m !== modulePath);
    
    // Add to exclude if not present
    if (!config.exclude.includes(modulePath)) {
        config.exclude.push(modulePath);
    }
    
    writeConfig(targetDir, config);
    console.log(chalk.green(`✓ Added ${chalk.cyan(modulePath)} to exclude list.`));
    console.log(chalk.gray(`Run ${chalk.cyan('nguyencoder-cli install')} to apply changes.\n`));
}

// ─────────────────────────────────────────────────────────────
// GENERIC ADD/REMOVE MODULE COMMANDS
// ─────────────────────────────────────────────────────────────
program
    .command('add <type> <name>')
    .description('Add a module (e.g., add skills docker-expert)')
    .action((type, name) => addToConfig(type, name));

program
    .command('remove <type> <name>')
    .description('Remove a module (e.g., remove skills tailwind-patterns)')
    .action((type, name) => removeFromConfig(type, name));

// ─────────────────────────────────────────────────────────────
// DEDICATED ADD COMMANDS
// ─────────────────────────────────────────────────────────────
program.command('add-skill <name>').description('Add a skill').action(name => addToConfig('skills', name));
program.command('add-agent <name>').description('Add an agent').action(name => addToConfig('agents', name));
program.command('add-workflow <name>').description('Add a workflow').action(name => addToConfig('workflows', name));
program.command('add-rule <name>').description('Add a rule').action(name => addToConfig('rules', name));
program.command('add-root <name>').description('Add a root file').action(name => addToConfig('root', name));

// ─────────────────────────────────────────────────────────────
// DEDICATED REMOVE COMMANDS
// ─────────────────────────────────────────────────────────────
program.command('remove-skill <name>').description('Remove a skill').action(name => removeFromConfig('skills', name));
program.command('remove-agent <name>').description('Remove an agent').action(name => removeFromConfig('agents', name));
program.command('remove-workflow <name>').description('Remove a workflow').action(name => removeFromConfig('workflows', name));
program.command('remove-rule <name>').description('Remove a rule').action(name => removeFromConfig('rules', name));
program.command('remove-root <name>').description('Remove a root file').action(name => removeFromConfig('root', name));

// ─────────────────────────────────────────────────────────────
// LIST COMMAND - List available presets
// ─────────────────────────────────────────────────────────────
program
    .command('list')
    .description('List available presets from registry')
    .option('-s, --source <repo>', 'GitHub repository source', DEFAULT_REPO)
    .action(async (options) => {
        const spinner = ora('Fetching presets...').start();
        const tempDir = path.join(process.cwd(), TEMP_DIR);
        
        try {
            // Determine if source is local or remote (same logic as install)
            const isExplicitLocalPath = options.source.startsWith('./') || 
                                       options.source.startsWith('../') || 
                                       options.source.startsWith('/') ||
                                       options.source.startsWith('~');
            
            const isGitHubFormat = options.source.startsWith('github:') || 
                                  options.source.includes('/') && !options.source.includes('\\');
            
            if (isExplicitLocalPath) {
                // User explicitly wants a local path
                const resolvedPath = path.resolve(options.source);
                spinner.text = 'Using local source...';
                
                if (!fs.existsSync(resolvedPath)) {
                    throw new Error(`Local path not found: ${resolvedPath}`);
                }
                
                if (!fs.statSync(resolvedPath).isDirectory()) {
                    throw new Error(`Source is not a directory: ${resolvedPath}`);
                }
                
                // Clean temp dir
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                
                // Copy local source to temp
                fs.cpSync(resolvedPath, tempDir, { 
                    recursive: true,
                    filter: (src) => !src.includes('.git') && !src.includes('node_modules')
                });
            } else if (isGitHubFormat || !fs.existsSync(options.source)) {
                // Use giget for remote sources
                spinner.text = 'Downloading from GitHub...';
                await downloadTemplate(options.source, {
                    dir: tempDir,
                    force: true
                });
            } else {
                // Fallback: Ambiguous name that exists as local directory
                spinner.warn(chalk.yellow(`Using local directory: ${options.source}`));
                spinner.text = 'Copying local source...';
                console.log(chalk.gray(`    💡 Tip: Use ./${options.source} to avoid ambiguity\n`));
                
                if (!fs.statSync(options.source).isDirectory()) {
                    throw new Error(`Source is not a directory: ${options.source}`);
                }
                
                // Clean temp dir
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                
                // Copy local source to temp
                fs.cpSync(options.source, tempDir, { 
                    recursive: true,
                    filter: (src) => !src.includes('.git') && !src.includes('node_modules')
                });
                
                spinner.start();
            }
            
            // Try to find presets directory (might be at root or in nguyencoder-kit/)
            let presetsDir = path.join(tempDir, 'presets');
            if (!fs.existsSync(presetsDir)) {
                // Try nguyencoder-kit subdirectory (for full repo downloads)
                presetsDir = path.join(tempDir, 'nguyencoder-kit', 'presets');
                if (!fs.existsSync(presetsDir)) {
                    throw new Error('No presets folder found in registry.');
                }
            }
            
            const files = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json'));
            
            spinner.stop();
            console.log(chalk.bold.blue('\n📦 Available Presets:\n'));
            
            for (const file of files) {
                const preset = JSON.parse(fs.readFileSync(path.join(presetsDir, file), 'utf-8'));
                const name = file.replace('.json', '');
                console.log(`  ${chalk.cyan(name)}`);
                console.log(`    ${chalk.gray(preset.description || 'No description')}`);
                console.log(`    ${chalk.gray(`Modules: ${preset.modules.length}`)}\n`);
            }
            
            fs.rmSync(tempDir, { recursive: true, force: true });
            
        } catch (err) {
            spinner.fail(chalk.red('Failed to fetch presets.'));
            console.error(chalk.red(err.message));
            if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

program.parse();
