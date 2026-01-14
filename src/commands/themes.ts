/**
 * slides themes - List available Beamer themes
 */

import chalk from 'chalk';

const THEMES = {
  // Presentation themes
  presentation: [
    { name: 'default', desc: 'Clean, minimal' },
    { name: 'AnnArbor', desc: 'Yellow/blue academic' },
    { name: 'Antibes', desc: 'Tree-style navigation' },
    { name: 'Bergen', desc: 'Sidebar navigation' },
    { name: 'Berkeley', desc: 'Sidebar with logo' },
    { name: 'Berlin', desc: 'Miniframes navigation' },
    { name: 'Boadilla', desc: 'Simple with circles' },
    { name: 'CambridgeUS', desc: 'Red/gray professional' },
    { name: 'Copenhagen', desc: 'Blue professional' },
    { name: 'Darmstadt', desc: 'Miniframes + sections' },
    { name: 'Dresden', desc: 'Section navigation' },
    { name: 'Frankfurt', desc: 'Miniframes' },
    { name: 'Goettingen', desc: 'Sidebar right' },
    { name: 'Hannover', desc: 'Sidebar left' },
    { name: 'Ilmenau', desc: 'Three-part header' },
    { name: 'JuanLesPins', desc: 'Tree navigation' },
    { name: 'Luebeck', desc: 'Two-line header' },
    { name: 'Madrid', desc: 'Professional, popular' },
    { name: 'Malmoe', desc: 'Header navigation' },
    { name: 'Marburg', desc: 'Sidebar with sections' },
    { name: 'Montpellier', desc: 'Tree with header' },
    { name: 'PaloAlto', desc: 'Sidebar, clean' },
    { name: 'Pittsburgh', desc: 'Minimal, no nav' },
    { name: 'Rochester', desc: 'Simple sections' },
    { name: 'Singapore', desc: 'Miniframes, compact' },
    { name: 'Szeged', desc: 'Header sections' },
    { name: 'Warsaw', desc: 'Shaded header' },
  ],

  // Color themes
  color: [
    { name: 'default', desc: 'Blue' },
    { name: 'albatross', desc: 'Blue/cyan' },
    { name: 'beaver', desc: 'Gray/red' },
    { name: 'beetle', desc: 'Gray tones' },
    { name: 'crane', desc: 'Yellow/orange' },
    { name: 'dolphin', desc: 'Light blue' },
    { name: 'dove', desc: 'Grayscale' },
    { name: 'fly', desc: 'Gray' },
    { name: 'lily', desc: 'Clean blue' },
    { name: 'monarca', desc: 'Orange/blue' },
    { name: 'orchid', desc: 'Purple' },
    { name: 'rose', desc: 'Pink/red' },
    { name: 'seagull', desc: 'Light' },
    { name: 'seahorse', desc: 'Purple/pink' },
    { name: 'sidebartab', desc: 'For sidebars' },
    { name: 'spruce', desc: 'Green' },
    { name: 'structure', desc: 'Structural only' },
    { name: 'whale', desc: 'Blue sidebar' },
    { name: 'wolverine', desc: 'Yellow/blue' },
  ],
};

export function themes(): void {
  console.log(chalk.blue.bold('\nBeamer Themes\n'));
  
  console.log(chalk.cyan('Presentation Themes:'));
  console.log(chalk.gray('  Use: \\usetheme{Name} or slides init --theme Name\n'));
  
  THEMES.presentation.forEach(({ name, desc }) => {
    console.log(`  ${chalk.green(name.padEnd(16))} ${chalk.gray(desc)}`);
  });

  console.log('');
  console.log(chalk.cyan('Color Themes:'));
  console.log(chalk.gray('  Use: \\usecolortheme{name} or slides init --color name\n'));

  THEMES.color.forEach(({ name, desc }) => {
    console.log(`  ${chalk.green(name.padEnd(16))} ${chalk.gray(desc)}`);
  });

  console.log('');
  console.log(chalk.gray('Tip: Combine them! e.g., slides init talk --theme Berlin --color crane'));
  console.log('');
}
