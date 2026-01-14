/**
 * slides lint - Validate LaTeX before compiling
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import chalk from 'chalk';

interface LintOptions {
  fix?: boolean;
}

interface LintIssue {
  line: number;
  column?: number;
  severity: 'error' | 'warning';
  message: string;
  rule: string;
}

// Common LaTeX/Beamer issues to check
const rules = {
  // Structural checks
  missingDocumentClass: (content: string): LintIssue | null => {
    if (!content.includes('\\documentclass')) {
      return { line: 1, severity: 'error', message: 'Missing \\documentclass', rule: 'document-class' };
    }
    return null;
  },

  missingBeginDocument: (content: string): LintIssue | null => {
    if (!content.includes('\\begin{document}')) {
      return { line: 1, severity: 'error', message: 'Missing \\begin{document}', rule: 'begin-document' };
    }
    return null;
  },

  missingEndDocument: (content: string): LintIssue | null => {
    if (!content.includes('\\end{document}')) {
      return { line: 1, severity: 'error', message: 'Missing \\end{document}', rule: 'end-document' };
    }
    return null;
  },

  // Balance checks
  unmatchedBraces: (content: string, lines: string[]): LintIssue[] => {
    const issues: LintIssue[] = [];
    let braceCount = 0;
    
    lines.forEach((line, idx) => {
      // Skip comments
      const commentIdx = line.indexOf('%');
      const activePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
      
      for (const char of activePart) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        
        if (braceCount < 0) {
          issues.push({
            line: idx + 1,
            severity: 'error',
            message: 'Unmatched closing brace }',
            rule: 'brace-balance',
          });
          braceCount = 0;
        }
      }
    });

    if (braceCount > 0) {
      issues.push({
        line: lines.length,
        severity: 'error',
        message: `${braceCount} unclosed brace(s) {`,
        rule: 'brace-balance',
      });
    }

    return issues;
  },

  unmatchedEnvironments: (content: string, lines: string[]): LintIssue[] => {
    const issues: LintIssue[] = [];
    const stack: Array<{ name: string; line: number }> = [];
    
    lines.forEach((line, idx) => {
      const beginMatch = line.match(/\\begin\{(\w+)\}/g);
      const endMatch = line.match(/\\end\{(\w+)\}/g);

      if (beginMatch) {
        beginMatch.forEach(m => {
          const name = m.match(/\\begin\{(\w+)\}/)![1];
          stack.push({ name, line: idx + 1 });
        });
      }

      if (endMatch) {
        endMatch.forEach(m => {
          const name = m.match(/\\end\{(\w+)\}/)![1];
          if (stack.length === 0) {
            issues.push({
              line: idx + 1,
              severity: 'error',
              message: `\\end{${name}} without matching \\begin`,
              rule: 'env-balance',
            });
          } else {
            const top = stack.pop()!;
            if (top.name !== name) {
              issues.push({
                line: idx + 1,
                severity: 'error',
                message: `\\end{${name}} doesn't match \\begin{${top.name}} from line ${top.line}`,
                rule: 'env-balance',
              });
            }
          }
        });
      }
    });

    stack.forEach(({ name, line }) => {
      issues.push({
        line,
        severity: 'error',
        message: `\\begin{${name}} never closed`,
        rule: 'env-balance',
      });
    });

    return issues;
  },

  // Style warnings
  frameWithoutTitle: (content: string, lines: string[]): LintIssue[] => {
    const issues: LintIssue[] = [];
    
    lines.forEach((line, idx) => {
      if (line.includes('\\begin{frame}') && !line.includes('{') && !lines[idx + 1]?.includes('\\frametitle') && !lines[idx + 1]?.includes('\\titlepage')) {
        // Check if it's not a special frame
        if (!line.includes('[fragile]') && !line.includes('[plain]') && !line.includes('[standout]')) {
          issues.push({
            line: idx + 1,
            severity: 'warning',
            message: 'Frame without title',
            rule: 'frame-title',
          });
        }
      }
    });

    return issues;
  },

  // Common mistakes
  underscoreInText: (content: string, lines: string[]): LintIssue[] => {
    const issues: LintIssue[] = [];
    let inMath = false;
    let inLstlisting = false;
    let inVerbatim = false;

    lines.forEach((line, idx) => {
      if (line.includes('\\begin{lstlisting}') || line.includes('\\begin{verbatim}')) {
        inLstlisting = true;
      }
      if (line.includes('\\end{lstlisting}') || line.includes('\\end{verbatim}')) {
        inLstlisting = false;
      }

      if (inLstlisting) return;

      // Check for unescaped underscores outside math mode and commands
      const stripped = line
        .replace(/\$[^$]+\$/g, '') // Remove inline math
        .replace(/\\texttt\{[^}]+\}/g, '') // Remove texttt
        .replace(/\\_/g, '') // Remove escaped underscores
        .replace(/\\[a-zA-Z]+/g, ''); // Remove commands

      if (stripped.includes('_')) {
        issues.push({
          line: idx + 1,
          severity: 'warning',
          message: 'Unescaped underscore (use \\_ or $var_x$)',
          rule: 'underscore',
        });
      }
    });

    return issues;
  },
};

function findTexFile(file?: string): string {
  if (file) {
    if (!existsSync(file)) {
      console.error(chalk.red(`Error: File '${file}' not found`));
      process.exit(1);
    }
    return file;
  }

  const texFiles = readdirSync('.').filter(f => f.endsWith('.tex'));
  
  if (texFiles.length === 0) {
    console.error(chalk.red('Error: No .tex files found'));
    process.exit(1);
  }
  
  if (texFiles.length === 1) return texFiles[0];

  const dirName = basename(process.cwd());
  return texFiles.find(f => f === `${dirName}.tex` || f === 'main.tex') ?? texFiles[0];
}

export function lint(file: string | undefined, options: LintOptions): void {
  const texFile = findTexFile(file);
  
  console.log(chalk.blue(`Linting ${texFile}...`));
  console.log('');

  const content = readFileSync(texFile, 'utf-8');
  const lines = content.split('\n');
  
  const issues: LintIssue[] = [];

  // Run structural checks
  const docClass = rules.missingDocumentClass(content);
  if (docClass) issues.push(docClass);
  
  const beginDoc = rules.missingBeginDocument(content);
  if (beginDoc) issues.push(beginDoc);
  
  const endDoc = rules.missingEndDocument(content);
  if (endDoc) issues.push(endDoc);

  // Run balance checks
  issues.push(...rules.unmatchedBraces(content, lines));
  issues.push(...rules.unmatchedEnvironments(content, lines));

  // Run style checks
  issues.push(...rules.frameWithoutTitle(content, lines));
  issues.push(...rules.underscoreInText(content, lines));

  // Sort by line number
  issues.sort((a, b) => a.line - b.line);

  // Report
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  issues.forEach(issue => {
    const icon = issue.severity === 'error' ? chalk.red('✗') : chalk.yellow('⚠');
    const loc = chalk.gray(`${texFile}:${issue.line}`);
    const msg = issue.severity === 'error' ? chalk.red(issue.message) : chalk.yellow(issue.message);
    const rule = chalk.gray(`(${issue.rule})`);
    
    console.log(`  ${icon} ${loc} ${msg} ${rule}`);
  });

  if (issues.length === 0) {
    console.log(chalk.green('  ✓ No issues found'));
  }

  console.log('');
  console.log(chalk.gray(`  ${errors.length} error(s), ${warnings.length} warning(s)`));

  if (errors.length > 0) {
    process.exit(1);
  }
}
