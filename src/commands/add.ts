/**
 * slides add - Add slide patterns
 */

import { appendFileSync, readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import chalk from 'chalk';
import { getTemplate, type TemplateName } from '../templates/index.js';

interface AddOptions {
  output?: string;
}

const slideTypes: Record<string, TemplateName> = {
  code: 'code',
  diagram: 'diagram',
  columns: 'columns',
  image: 'image',
  animated: 'animated',
  'animated-diagram': 'animatedDiagram',
  table: 'table',
  quote: 'quote',
  split: 'split',
  timeline: 'timeline',
  comparison: 'comparison',
  highlight: 'highlight',
  notes: 'notes',
};

function findTexFile(output?: string): string {
  if (output) {
    if (!existsSync(output)) {
      console.error(chalk.red(`Error: File '${output}' not found`));
      process.exit(1);
    }
    return output;
  }

  const texFiles = readdirSync('.').filter(f => f.endsWith('.tex'));
  
  if (texFiles.length === 0) {
    console.error(chalk.red('Error: No .tex files found'));
    console.error(chalk.yellow('Specify with: slides add <type> -o <file>'));
    process.exit(1);
  }
  
  if (texFiles.length === 1) {
    return texFiles[0];
  }

  const dirName = basename(process.cwd());
  const match = texFiles.find(f => f === `${dirName}.tex` || f === 'main.tex');
  
  if (match) return match;

  console.error(chalk.red(`Multiple .tex files found: ${texFiles.join(', ')}`));
  console.error(chalk.yellow('Specify with: slides add <type> -o <file>'));
  process.exit(1);
}

export function add(type: string, options: AddOptions): void {
  const templateName = slideTypes[type];
  
  if (!templateName) {
    console.error(chalk.red(`Unknown slide type: ${type}`));
    console.error(chalk.yellow('Available types:'));
    Object.keys(slideTypes).forEach(t => console.error(`  - ${t}`));
    process.exit(1);
  }

  const texFile = findTexFile(options.output);
  const template = getTemplate(templateName as Exclude<TemplateName, 'main'>);

  // Read file and insert before \end{document}
  const content = readFileSync(texFile, 'utf-8');
  const endDocIndex = content.lastIndexOf('\\end{document}');
  
  if (endDocIndex === -1) {
    // Just append
    appendFileSync(texFile, template);
  } else {
    // Insert before \end{document}
    const newContent = 
      content.slice(0, endDocIndex) + 
      template + '\n' + 
      content.slice(endDocIndex);
    writeFileSync(texFile, newContent);
  }

  console.log(chalk.green(`✓ Added ${type} slide to ${texFile}`));
  console.log(chalk.gray('Run `slides build` to compile'));
}
