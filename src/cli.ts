#!/usr/bin/env node
/**
 * beamer-cli - Create LaTeX Beamer presentations with ease
 */

import { Command } from 'commander';
import { init } from './commands/init.js';
import { build } from './commands/build.js';
import { watch } from './commands/watch.js';
import { add } from './commands/add.js';
import { icons } from './commands/icons.js';
import { lint } from './commands/lint.js';
import { fromMd } from './commands/fromMd.js';
import { themes } from './commands/themes.js';
import { preview } from './commands/preview.js';
import { exportPresentation } from './commands/export.js';

const program = new Command();

program
  .name('slides')
  .description('CLI for creating LaTeX Beamer presentations')
  .version('0.1.0');

// slides init
program
  .command('init [name]')
  .description('Create a new presentation')
  .option('-t, --theme <theme>', 'Beamer theme', 'Madrid')
  .option('-c, --color <color>', 'Color theme', 'dolphin')
  .option('--16:9', 'Use 16:9 aspect ratio', true)
  .action(init);

// slides build
program
  .command('build [file]')
  .description('Compile .tex to PDF')
  .option('-w, --watch', 'Watch for changes')
  .option('-o, --output <file>', 'Output PDF name')
  .option('--engine <engine>', 'LaTeX engine (tectonic, pdflatex, xelatex)', 'tectonic')
  .action(build);

// slides watch
program
  .command('watch [file]')
  .description('Watch and rebuild on changes')
  .action(watch);

// slides add <type>
program
  .command('add <type>')
  .description('Add a slide pattern (code, diagram, columns, image, animated, table, quote, split)')
  .option('-o, --output <file>', 'File to append to')
  .action(add);

// slides lint
program
  .command('lint [file]')
  .description('Validate LaTeX before compiling')
  .option('--fix', 'Auto-fix issues where possible')
  .action(lint);

// slides from-md
program
  .command('from-md <file>')
  .description('Convert Markdown to Beamer')
  .option('-o, --output <file>', 'Output .tex file')
  .option('-t, --theme <theme>', 'Beamer theme', 'Madrid')
  .option('-c, --color <color>', 'Color theme', 'dolphin')
  .action(fromMd);

// slides icons <query>
program
  .command('icons <query>')
  .description('Search FontAwesome icons')
  .option('-l, --limit <n>', 'Max results', '10')
  .action(icons);

// slides themes
program
  .command('themes')
  .description('List available Beamer themes')
  .option('--save <name>', 'Save current settings as a custom theme')
  .option('--use <name>', 'Show details of a custom theme')
  .option('--list-custom', 'List only custom themes')
  .option('-t, --theme <theme>', 'Base theme (for --save)', 'Madrid')
  .option('-c, --color <color>', 'Color theme (for --save)', 'dolphin')
  .action(themes);

// slides preview
program
  .command('preview [file]')
  .description('Preview PDF slides in terminal')
  .option('-p, --page <n>', 'Page number to preview', '1')
  .option('-a, --all', 'Show all slides as thumbnails')
  .option('-w, --width <pixels>', 'Image width', '800')
  .action(preview);

// slides export
program
  .command('export [file]')
  .description('Export presentation to HTML (reveal.js)')
  .option('-f, --format <format>', 'Output format (html)', 'html')
  .option('-o, --output <file>', 'Output file name')
  .option('-t, --theme <theme>', 'Reveal.js theme (black, white, league, etc.)', 'black')
  .action(exportPresentation);

program.parse();
