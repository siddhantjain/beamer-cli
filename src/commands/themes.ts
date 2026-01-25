/**
 * slides themes - List available Beamer themes
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import yaml from 'yaml';

const CUSTOM_THEMES_DIR = join(homedir(), '.config', 'beamer-cli', 'themes');

interface CustomTheme {
  name: string;
  base: string;
  color: string;
  aspectRatio?: string;
  fonts?: {
    main?: string;
    mono?: string;
  };
  colors?: {
    primary?: string;
    secondary?: string;
  };
}

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

/**
 * Ensure custom themes directory exists
 */
function ensureThemesDir(): void {
  if (!existsSync(CUSTOM_THEMES_DIR)) {
    mkdirSync(CUSTOM_THEMES_DIR, { recursive: true });
  }
}

/**
 * Load all custom themes
 */
function loadCustomThemes(): CustomTheme[] {
  if (!existsSync(CUSTOM_THEMES_DIR)) {
    return [];
  }

  const themes: CustomTheme[] = [];
  const files = readdirSync(CUSTOM_THEMES_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of files) {
    try {
      const content = readFileSync(join(CUSTOM_THEMES_DIR, file), 'utf-8');
      const theme = yaml.parse(content) as CustomTheme;
      if (theme.name && theme.base && theme.color) {
        themes.push(theme);
      }
    } catch {
      // Skip invalid theme files
    }
  }

  return themes;
}

/**
 * Save a custom theme
 */
export function saveTheme(name: string, theme: Omit<CustomTheme, 'name'>): void {
  ensureThemesDir();
  const themePath = join(CUSTOM_THEMES_DIR, `${name}.yaml`);
  const fullTheme: CustomTheme = { name, ...theme };
  writeFileSync(themePath, yaml.stringify(fullTheme));
  console.log(chalk.green(`✓ Theme '${name}' saved to ${themePath}`));
}

/**
 * Load a custom theme by name
 */
export function loadTheme(name: string): CustomTheme | null {
  const themePath = join(CUSTOM_THEMES_DIR, `${name}.yaml`);
  if (!existsSync(themePath)) {
    return null;
  }

  try {
    const content = readFileSync(themePath, 'utf-8');
    return yaml.parse(content) as CustomTheme;
  } catch {
    return null;
  }
}

interface ThemesOptions {
  save?: string;
  use?: string;
  listCustom?: boolean;
  theme?: string;
  color?: string;
}

export function themes(options: ThemesOptions = {}): void {
  // Save current settings as a theme
  if (options.save) {
    const themeName = options.save;
    const baseTheme = options.theme ?? 'Madrid';
    const colorTheme = options.color ?? 'dolphin';

    saveTheme(themeName, {
      base: baseTheme,
      color: colorTheme,
      aspectRatio: '169',
    });
    return;
  }

  // Show info about a custom theme
  if (options.use) {
    const theme = loadTheme(options.use);
    if (!theme) {
      console.error(chalk.red(`Theme '${options.use}' not found`));
      console.error(chalk.yellow(`Custom themes are stored in: ${CUSTOM_THEMES_DIR}`));
      process.exit(1);
    }

    console.log(chalk.blue.bold(`\nTheme: ${theme.name}\n`));
    console.log(`  Base theme:  ${chalk.green(theme.base)}`);
    console.log(`  Color theme: ${chalk.green(theme.color)}`);
    if (theme.aspectRatio) {
      console.log(`  Aspect ratio: ${chalk.gray(theme.aspectRatio)}`);
    }
    console.log('');
    console.log(chalk.gray(`Use: slides init my-talk --theme ${theme.base} --color ${theme.color}`));
    return;
  }

  // List custom themes only
  if (options.listCustom) {
    const customThemes = loadCustomThemes();

    console.log(chalk.blue.bold('\nCustom Themes\n'));

    if (customThemes.length === 0) {
      console.log(chalk.gray('  No custom themes found.'));
      console.log(chalk.gray(`  Save one with: slides themes --save mytheme --theme Berlin --color crane`));
    } else {
      customThemes.forEach(({ name, base, color }) => {
        console.log(`  ${chalk.green(name.padEnd(16))} ${chalk.gray(`${base} + ${color}`)}`);
      });
    }

    console.log('');
    console.log(chalk.gray(`Themes stored in: ${CUSTOM_THEMES_DIR}`));
    console.log('');
    return;
  }

  // Default: list all built-in themes
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

  // Show custom themes if any
  const customThemes = loadCustomThemes();
  if (customThemes.length > 0) {
    console.log('');
    console.log(chalk.cyan('Custom Themes:'));
    console.log(chalk.gray('  Use: slides themes --use <name> for details\n'));
    customThemes.forEach(({ name, base, color }) => {
      console.log(`  ${chalk.green(name.padEnd(16))} ${chalk.gray(`${base} + ${color}`)}`);
    });
  }

  console.log('');
  console.log(chalk.gray('Tip: Combine them! e.g., slides init talk --theme Berlin --color crane'));
  console.log(chalk.gray('Save favorites: slides themes --save mytheme --theme Berlin --color crane'));
  console.log('');
}
