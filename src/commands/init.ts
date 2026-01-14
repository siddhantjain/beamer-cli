/**
 * slides init - Create a new presentation
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { getTemplate } from '../templates/index.js';

interface InitOptions {
  theme: string;
  color: string;
  '16:9'?: boolean;
}

export function init(name: string | undefined, options: InitOptions): void {
  const projectName = name ?? 'presentation';
  const dir = join(process.cwd(), projectName);

  if (existsSync(dir)) {
    console.error(chalk.red(`Error: Directory '${projectName}' already exists`));
    process.exit(1);
  }

  console.log(chalk.blue(`Creating presentation: ${projectName}`));

  // Create directory
  mkdirSync(dir, { recursive: true });

  // Generate main .tex file
  const template = getTemplate('main', {
    title: projectName,
    theme: options.theme,
    colorTheme: options.color,
    aspectRatio: options['16:9'] ? '169' : '43',
  });

  const texFile = join(dir, `${projectName}.tex`);
  writeFileSync(texFile, template);

  // Create slides config
  const config = {
    name: projectName,
    theme: options.theme,
    colorTheme: options.color,
    engine: 'tectonic',
  };
  writeFileSync(join(dir, 'slides.yaml'), 
    `# Beamer CLI config\n` +
    `name: ${config.name}\n` +
    `theme: ${config.theme}\n` +
    `colorTheme: ${config.colorTheme}\n` +
    `engine: ${config.engine}\n`
  );

  console.log(chalk.green(`✓ Created ${texFile}`));
  console.log(chalk.green(`✓ Created ${join(dir, 'slides.yaml')}`));
  console.log('');
  console.log(chalk.cyan('Next steps:'));
  console.log(`  cd ${projectName}`);
  console.log('  slides build');
  console.log('');
  console.log(chalk.cyan('Add slides with:'));
  console.log('  slides add code');
  console.log('  slides add diagram');
  console.log('  slides add columns');
  console.log('  slides add animated');
}
