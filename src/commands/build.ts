/**
 * slides build - Compile .tex to PDF
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';
import chalk from 'chalk';

interface BuildOptions {
  watch?: boolean;
  output?: string;
  engine: string;
}

function findTexFile(file?: string): string {
  if (file) {
    if (!existsSync(file)) {
      console.error(chalk.red(`Error: File '${file}' not found`));
      process.exit(1);
    }
    return file;
  }

  // Look for .tex files in current directory
  const texFiles = readdirSync('.').filter(f => f.endsWith('.tex'));
  
  if (texFiles.length === 0) {
    console.error(chalk.red('Error: No .tex files found in current directory'));
    process.exit(1);
  }
  
  if (texFiles.length === 1) {
    return texFiles[0];
  }

  // Multiple files - look for one matching directory name or main.tex
  const dirName = basename(process.cwd());
  const match = texFiles.find(f => f === `${dirName}.tex` || f === 'main.tex');
  
  if (match) return match;

  console.error(chalk.yellow(`Multiple .tex files found: ${texFiles.join(', ')}`));
  console.error(chalk.yellow(`Specify one: slides build <file>`));
  process.exit(1);
}

function checkEngine(engine: string): void {
  try {
    execSync(`which ${engine}`, { stdio: 'ignore' });
  } catch {
    console.error(chalk.red(`Error: '${engine}' not found`));
    console.error(chalk.yellow('Install with:'));
    if (engine === 'tectonic') {
      console.error('  curl --proto "=https" --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh');
    } else {
      console.error('  apt install texlive-latex-base texlive-fonts-recommended');
    }
    process.exit(1);
  }
}

export function build(file: string | undefined, options: BuildOptions): void {
  const texFile = findTexFile(file);
  const engine = options.engine;

  console.log(chalk.blue(`Building ${texFile} with ${engine}...`));

  checkEngine(engine);

  const startTime = Date.now();

  try {
    let cmd: string;
    
    switch (engine) {
      case 'tectonic':
        cmd = `tectonic ${texFile}`;
        break;
      case 'pdflatex':
      case 'xelatex':
      case 'lualatex':
        cmd = `${engine} -interaction=nonstopmode ${texFile}`;
        break;
      default:
        console.error(chalk.red(`Unknown engine: ${engine}`));
        process.exit(1);
    }

    execSync(cmd, { stdio: 'inherit' });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pdfFile = texFile.replace('.tex', '.pdf');
    
    console.log('');
    console.log(chalk.green(`✓ Built ${pdfFile} in ${elapsed}s`));
  } catch {
    console.error(chalk.red('Build failed'));
    process.exit(1);
  }
}
