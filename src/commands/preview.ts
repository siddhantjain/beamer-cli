/**
 * slides preview - Preview PDF slides in terminal
 */

import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { basename } from 'node:path';
import chalk from 'chalk';

interface PreviewOptions {
  page?: string;
  all?: boolean;
  width?: string;
}

/**
 * Find a suitable terminal image viewer
 */
function findImageViewer(): { cmd: string; args: string[] } | null {
  // Check for common terminal image viewers in order of preference
  const viewers = [
    { cmd: 'timg', check: 'timg --version', args: [] },
    { cmd: 'chafa', check: 'chafa --version', args: ['--size', '80'] },
    { cmd: 'kitty', check: 'kitty +kitten icat --help', args: ['+kitten', 'icat'] },
    { cmd: 'viu', check: 'viu --version', args: [] },
  ];

  for (const viewer of viewers) {
    try {
      execSync(viewer.check, { stdio: 'ignore' });
      return { cmd: viewer.cmd, args: viewer.args };
    } catch {
      // Viewer not available
    }
  }

  return null;
}

/**
 * Check if pdftoppm is available
 */
function hasPdftoppm(): boolean {
  try {
    execSync('pdftoppm -v', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Find PDF file in current directory
 */
function findPdfFile(file?: string): string {
  if (file) {
    if (!existsSync(file)) {
      console.error(chalk.red(`Error: File '${file}' not found`));
      process.exit(1);
    }
    return file;
  }

  // Look for PDF matching directory name or any PDF
  const dirName = basename(process.cwd());
  const candidates = [`${dirName}.pdf`, 'main.pdf'];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Find any PDF
  const pdfs = readdirSync('.').filter((f: string) => f.endsWith('.pdf'));

  if (pdfs.length === 0) {
    console.error(chalk.red('Error: No PDF files found'));
    console.error(chalk.yellow('Run `slides build` first'));
    process.exit(1);
  }

  if (pdfs.length === 1) {
    return pdfs[0];
  }

  console.error(chalk.red(`Multiple PDFs found: ${pdfs.join(', ')}`));
  console.error(chalk.yellow('Specify with: slides preview <file.pdf>'));
  process.exit(1);
}

/**
 * Convert PDF page to image and display
 */
function displayPage(pdfFile: string, page: number, viewer: { cmd: string; args: string[] }, width: number): void {
  const tmpFile = `/tmp/beamer-preview-${page}`;

  // Convert PDF page to PNG
  const ppmResult = spawnSync('pdftoppm', [
    '-png',
    '-f', String(page),
    '-l', String(page),
    '-scale-to', String(width),
    pdfFile,
    tmpFile,
  ], { stdio: 'pipe' });

  if (ppmResult.status !== 0) {
    console.error(chalk.red('Error converting PDF to image'));
    return;
  }

  const imgFile = `${tmpFile}-${String(page).padStart(1, '0')}.png`;

  if (!existsSync(imgFile)) {
    // pdftoppm uses different naming for different versions
    const altFile = `${tmpFile}-1.png`;
    if (existsSync(altFile)) {
      displayImage(altFile, viewer);
    } else {
      console.error(chalk.red(`Could not find converted image for page ${page}`));
    }
    return;
  }

  displayImage(imgFile, viewer);
}

/**
 * Display image with terminal viewer
 */
function displayImage(imgFile: string, viewer: { cmd: string; args: string[] }): void {
  const result = spawnSync(viewer.cmd, [...viewer.args, imgFile], { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error(chalk.red(`Error displaying image with ${viewer.cmd}`));
  }

  // Clean up temp file
  try {
    unlinkSync(imgFile);
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Get total pages in PDF
 */
function getPdfPageCount(pdfFile: string): number {
  try {
    const result = execSync(`pdfinfo "${pdfFile}" | grep "Pages:" | awk '{print $2}'`, {
      encoding: 'utf-8',
    });
    return parseInt(result.trim(), 10) || 1;
  } catch {
    return 1;
  }
}

export function preview(file: string | undefined, options: PreviewOptions): void {
  // Check dependencies
  if (!hasPdftoppm()) {
    console.error(chalk.red('Error: pdftoppm not found'));
    console.error(chalk.yellow('Install with: apt install poppler-utils'));
    process.exit(1);
  }

  const viewer = findImageViewer();
  if (!viewer) {
    console.error(chalk.red('Error: No terminal image viewer found'));
    console.error(chalk.yellow('Install one of: timg, chafa, viu'));
    console.error(chalk.gray('  apt install timg'));
    console.error(chalk.gray('  apt install chafa'));
    process.exit(1);
  }

  const pdfFile = findPdfFile(file);
  const width = parseInt(options.width ?? '800', 10);

  console.log(chalk.blue(`Previewing ${pdfFile} with ${viewer.cmd}...`));

  if (options.all) {
    // Show all pages as thumbnails
    const pageCount = getPdfPageCount(pdfFile);
    console.log(chalk.gray(`${pageCount} slides\n`));

    for (let i = 1; i <= pageCount; i++) {
      console.log(chalk.yellow(`--- Slide ${i} ---`));
      displayPage(pdfFile, i, viewer, Math.min(width, 400)); // Smaller for thumbnail grid
      console.log('');
    }
  } else {
    // Show single page
    const page = parseInt(options.page ?? '1', 10);
    displayPage(pdfFile, page, viewer, width);
  }
}
