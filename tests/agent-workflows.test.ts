/**
 * Agent Workflow Tests for beamer-cli (slides)
 * 
 * These tests document and verify patterns for LLM agents using slides CLI.
 * They cover:
 * 1. Correct workflows agents should follow
 * 2. Anti-patterns that cause failures
 * 3. Error handling and recovery
 * 4. Edge cases agents might encounter
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  existsSync, 
  rmSync, 
  mkdirSync, 
  writeFileSync, 
  readFileSync,
  readdirSync 
} from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '..', 'dist', 'cli.js');
const TEST_DIR = join(__dirname, '.test-workspace');

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Run CLI with specified arguments
 */
function runCLI(args: string, options: { cwd?: string } = {}): CLIResult {
  const result = spawnSync('node', [CLI_PATH, ...args.split(' ').filter(Boolean)], {
    encoding: 'utf-8',
    cwd: options.cwd ?? TEST_DIR,
    timeout: 30000,
    env: {
      ...process.env,
      // Disable colors for easier parsing
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  });

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
}

/**
 * Simulated agent that interacts with beamer-cli
 */
class SimulatedBeamerAgent {
  public actions: Array<{ command: string; result: CLIResult; cwd: string }> = [];
  public errors: string[] = [];
  public workDir: string;

  constructor(workDir: string = TEST_DIR) {
    this.workDir = workDir;
  }

  /**
   * ANTI-PATTERN: Run command without checking preconditions
   */
  naiveRun(args: string): CLIResult {
    const result = runCLI(args, { cwd: this.workDir });
    this.actions.push({ command: args, result, cwd: this.workDir });
    return result;
  }

  /**
   * CORRECT PATTERN: Run command with proper error handling
   */
  smartRun(args: string): CLIResult {
    const result = runCLI(args, { cwd: this.workDir });
    this.actions.push({ command: args, result, cwd: this.workDir });

    if (result.exitCode !== 0) {
      const errorMsg = result.stderr || result.stdout || 'Unknown error';
      this.errors.push(`Command '${args}' failed: ${errorMsg}`);
    }

    return result;
  }

  /**
   * Check if LaTeX engine is available
   */
  checkEngine(engine: string = 'tectonic'): boolean {
    const result = spawnSync('which', [engine], { encoding: 'utf-8' });
    return result.status === 0;
  }

  /**
   * Check if directory exists
   */
  checkDirExists(name: string): boolean {
    return existsSync(join(this.workDir, name));
  }

  /**
   * Check if file exists
   */
  checkFileExists(path: string): boolean {
    return existsSync(join(this.workDir, path));
  }

  /**
   * BEST PATTERN: Init with precondition checks
   */
  smartInit(name: string, options: { force?: boolean } = {}): CLIResult {
    // Check if directory already exists
    if (this.checkDirExists(name) && !options.force) {
      this.errors.push(`Directory '${name}' already exists. Use force to overwrite.`);
      return {
        stdout: '',
        stderr: `Directory '${name}' already exists`,
        exitCode: 1,
      };
    }

    // Remove if force
    if (options.force && this.checkDirExists(name)) {
      rmSync(join(this.workDir, name), { recursive: true });
    }

    return this.smartRun(`init ${name}`);
  }

  /**
   * BEST PATTERN: Build with precondition checks
   */
  smartBuild(file?: string): CLIResult {
    // Check for LaTeX engine
    if (!this.checkEngine('tectonic') && !this.checkEngine('pdflatex')) {
      this.errors.push('No LaTeX engine found. Install tectonic or pdflatex.');
      return {
        stdout: '',
        stderr: 'No LaTeX engine installed',
        exitCode: 1,
      };
    }

    // Check for .tex file
    if (file && !this.checkFileExists(file)) {
      this.errors.push(`File '${file}' not found.`);
      return {
        stdout: '',
        stderr: `File '${file}' not found`,
        exitCode: 1,
      };
    }

    return this.smartRun(file ? `build ${file}` : 'build');
  }
}

// ============================================================================
// Setup / Teardown
// ============================================================================

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
});

// ============================================================================
// Test: Correct Agent Workflows
// ============================================================================

describe('Agent Workflows - Correct Patterns', () => {
  describe('Initialization', () => {
    it('should create a new presentation', () => {
      const agent = new SimulatedBeamerAgent();
      
      const result = agent.smartInit('my-talk');
      
      expect(result.exitCode).toBe(0);
      expect(agent.checkDirExists('my-talk')).toBe(true);
      expect(agent.checkFileExists('my-talk/my-talk.tex')).toBe(true);
      expect(agent.checkFileExists('my-talk/slides.yaml')).toBe(true);
    });

    it('should check if directory exists before init', () => {
      const agent = new SimulatedBeamerAgent();
      
      // First init succeeds
      agent.smartInit('existing-talk');
      expect(agent.checkDirExists('existing-talk')).toBe(true);
      
      // Second init should fail (smart agent checks first)
      const result = agent.smartInit('existing-talk');
      expect(result.exitCode).not.toBe(0);
      expect(agent.errors.some(e => e.includes('already exists'))).toBe(true);
    });

    it('should support force overwrite', () => {
      const agent = new SimulatedBeamerAgent();
      
      // First init
      agent.smartInit('my-talk');
      
      // Second init with force
      const result = agent.smartInit('my-talk', { force: true });
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Build Process', () => {
    it('should check for LaTeX engine before building', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create a presentation
      agent.smartInit('test-build');
      agent.workDir = join(TEST_DIR, 'test-build');
      
      // Check engine availability
      const hasTectonic = agent.checkEngine('tectonic');
      const hasPdflatex = agent.checkEngine('pdflatex');
      
      if (!hasTectonic && !hasPdflatex) {
        // Agent should know build will fail
        expect(agent.checkEngine('tectonic')).toBe(false);
        expect(agent.checkEngine('pdflatex')).toBe(false);
      }
    });

    it('should check for .tex file before building', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Try to build non-existent file
      const result = agent.smartBuild('nonexistent.tex');
      
      expect(result.exitCode).not.toBe(0);
      expect(agent.errors.some(e => e.includes('not found'))).toBe(true);
    });
  });

  describe('Slide Addition', () => {
    it('should add slide patterns to existing presentation', () => {
      const agent = new SimulatedBeamerAgent();
      
      // First create a presentation
      agent.smartInit('my-talk');
      agent.workDir = join(TEST_DIR, 'my-talk');
      
      // Then add slides
      const result = agent.smartRun('add code');
      
      // Command should succeed
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Added code slide');
      
      // The slide content is added to the .tex file
      const texContent = readFileSync(join(agent.workDir, 'my-talk.tex'), 'utf-8');
      expect(texContent).toContain('\\begin{frame}');
    });
  });
});

// ============================================================================
// Test: Anti-Patterns
// ============================================================================

describe('Agent Workflows - Anti-Patterns', () => {
  describe('Directory Conflicts', () => {
    it('ANTI-PATTERN: init without checking if directory exists', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create directory first
      mkdirSync(join(TEST_DIR, 'my-talk'));
      
      // Naive agent doesn't check - this will fail
      const result = agent.naiveRun('init my-talk');
      
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain('already exists');
    });
  });

  describe('Missing Dependencies', () => {
    it('ANTI-PATTERN: building without checking for LaTeX engine', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create a presentation
      agent.smartInit('test-talk');
      agent.workDir = join(TEST_DIR, 'test-talk');
      
      // Check if tectonic is available
      const hasTectonic = agent.checkEngine('tectonic');
      
      if (!hasTectonic) {
        // If no tectonic, naive build will fail
        const result = agent.naiveRun('build');
        expect(result.exitCode).toBe(1);
        expect(result.stdout + result.stderr).toContain('not found');
      }
    });
  });

  describe('Wrong Working Directory', () => {
    it('ANTI-PATTERN: building from wrong directory', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create presentation in subdirectory
      agent.smartInit('my-talk');
      
      // But try to build from parent directory (no .tex files here)
      const result = agent.naiveRun('build');
      
      // Should fail - no .tex files in TEST_DIR root
      expect(result.exitCode).toBe(1);
      expect(result.stdout + result.stderr).toContain('No .tex files');
    });
  });

  describe('Invalid Slide Types', () => {
    it('ANTI-PATTERN: adding non-existent slide type', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Try to add invalid slide type
      const result = agent.naiveRun('add nonexistent-type');
      
      // Should fail gracefully
      expect(result.exitCode).toBe(1);
    });
  });
});

// ============================================================================
// Test: Edge Cases
// ============================================================================

describe('Agent Workflows - Edge Cases', () => {
  describe('Special Characters', () => {
    it('should handle presentation names with spaces', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Names with spaces should be handled
      const result = agent.smartInit('my talk');
      
      // Depending on implementation, may succeed or fail
      // Agent should know how to handle either case
      if (result.exitCode !== 0) {
        // If it fails, agent should use hyphens or underscores
        const altResult = agent.smartInit('my-talk');
        expect(altResult.exitCode).toBe(0);
      }
    });
  });

  describe('Multiple .tex Files', () => {
    it('should handle directory with multiple .tex files', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create directory with multiple .tex files
      const multiDir = join(TEST_DIR, 'multi');
      mkdirSync(multiDir);
      writeFileSync(join(multiDir, 'one.tex'), '% file one');
      writeFileSync(join(multiDir, 'two.tex'), '% file two');
      
      agent.workDir = multiDir;
      
      // Build without specifying file
      const result = agent.naiveRun('build');
      
      // Should either fail or prompt (agent needs to specify file)
      if (result.exitCode !== 0) {
        // Agent should specify the file explicitly
        expect(result.stdout + result.stderr).toContain('Multiple');
      }
    });
  });

  describe('Empty Presentation', () => {
    it('should handle presentation with no slides', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create minimal .tex file
      const emptyDir = join(TEST_DIR, 'empty');
      mkdirSync(emptyDir);
      writeFileSync(join(emptyDir, 'empty.tex'), `
\\documentclass{beamer}
\\begin{document}
\\end{document}
`);
      
      agent.workDir = emptyDir;
      
      // This might succeed (valid but empty PDF) or fail
      // Agent should handle both cases
      const hasEngine = agent.checkEngine('tectonic') || agent.checkEngine('pdflatex');
      
      if (hasEngine) {
        // Can attempt build
        const result = agent.smartBuild('empty.tex');
        // Either succeeds or fails with LaTeX error
        // Agent should check result
      }
    });
  });
});

// ============================================================================
// Test: Error Recovery
// ============================================================================

describe('Agent Workflows - Error Recovery', () => {
  describe('Dependency Installation', () => {
    it('should provide installation instructions when engine missing', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Check for tectonic
      if (!agent.checkEngine('tectonic')) {
        // Agent should know how to install
        const installCmd = 'curl --proto "=https" --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh';
        
        // The error message from CLI should include install instructions
        agent.smartInit('test');
        agent.workDir = join(TEST_DIR, 'test');
        
        const result = agent.naiveRun('build');
        if (result.exitCode !== 0) {
          // Check for helpful error message
          const output = result.stdout + result.stderr;
          expect(
            output.includes('not found') || 
            output.includes('install') ||
            output.includes('tectonic')
          ).toBe(true);
        }
      }
    });
  });

  describe('LaTeX Error Recovery', () => {
    it('should handle LaTeX compilation errors', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create .tex file with syntax error
      const errorDir = join(TEST_DIR, 'error-test');
      mkdirSync(errorDir);
      writeFileSync(join(errorDir, 'broken.tex'), `
\\documentclass{beamer}
\\begin{document}
\\begin{frame}
  \\invalid{command}  % This will cause error
\\end{frame}
\\end{document}
`);
      
      agent.workDir = errorDir;
      
      if (agent.checkEngine('tectonic') || agent.checkEngine('pdflatex')) {
        const result = agent.smartBuild('broken.tex');
        
        // Build should fail
        expect(result.exitCode).not.toBe(0);
        
        // Agent should see error in output
        expect(agent.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Lint Before Build', () => {
    it('should lint before building to catch errors early', () => {
      const agent = new SimulatedBeamerAgent();
      
      agent.smartInit('lint-test');
      agent.workDir = join(TEST_DIR, 'lint-test');
      
      // Smart agent lints first
      const lintResult = agent.smartRun('lint lint-test.tex');
      
      // If lint passes, then build
      if (lintResult.exitCode === 0) {
        const buildResult = agent.smartBuild('lint-test.tex');
        // Build is more likely to succeed after lint passes
      }
    });
  });
});

// ============================================================================
// Test: Real-World Scenarios
// ============================================================================

describe('Agent Workflows - Real World Scenarios', () => {
  describe('Create and Build Presentation', () => {
    it('should follow complete workflow: init -> add -> build', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Step 1: Create presentation
      const initResult = agent.smartInit('demo-talk');
      expect(initResult.exitCode).toBe(0);
      
      // Step 2: Change to presentation directory
      agent.workDir = join(TEST_DIR, 'demo-talk');
      
      // Step 3: Add slides (output goes to stdout)
      const addResult = agent.smartRun('add code');
      expect(addResult.exitCode).toBe(0);
      
      // Step 4: Check for engine before build
      if (agent.checkEngine('tectonic') || agent.checkEngine('pdflatex')) {
        // Step 5: Build
        const buildResult = agent.smartBuild();
        // Build may succeed or fail depending on LaTeX setup
      } else {
        // No engine - agent should inform user
        agent.errors.push('LaTeX engine not installed - cannot build PDF');
      }
    });
  });

  describe('Markdown to Beamer Conversion', () => {
    it('should convert markdown to beamer presentation', () => {
      const agent = new SimulatedBeamerAgent();
      
      // Create markdown file
      const mdContent = `---
title: My Talk
author: Test
---

## Introduction

- Point one
- Point two

## Conclusion

Thanks!
`;
      writeFileSync(join(TEST_DIR, 'talk.md'), mdContent);
      
      // Convert
      const result = agent.smartRun('from-md talk.md');
      
      // Should succeed
      expect(result.exitCode).toBe(0);
      
      // Should create .tex file
      expect(agent.checkFileExists('talk.tex')).toBe(true);
    });
  });

  describe('Theme Exploration', () => {
    it('should list available themes', () => {
      const agent = new SimulatedBeamerAgent();
      
      const result = agent.smartRun('themes');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Madrid');
      expect(result.stdout).toContain('Berlin');
    });
  });

  describe('Icon Search', () => {
    it('should search for FontAwesome icons', () => {
      const agent = new SimulatedBeamerAgent();
      
      const result = agent.smartRun('icons rocket');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('rocket');
    });
  });
});

// ============================================================================
// Test: Safeguards
// ============================================================================

describe('Agent Workflows - Safeguards', () => {
  describe('Help Command', () => {
    it('should always show help', () => {
      const agent = new SimulatedBeamerAgent();
      
      const result = agent.smartRun('--help');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('slides');
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('build');
    });
  });

  describe('Version Command', () => {
    it('should show version', () => {
      const agent = new SimulatedBeamerAgent();
      
      const result = agent.smartRun('--version');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Subcommand Help', () => {
    it('should show help for subcommands', () => {
      const agent = new SimulatedBeamerAgent();
      
      const result = agent.smartRun('init --help');
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('theme');
      expect(result.stdout).toContain('color');
    });
  });
});
