/**
 * slides watch - Watch and rebuild on changes
 */

import { watch as chokidarWatch } from 'chokidar';
import chalk from 'chalk';
import { build } from './build.js';

export function watch(file?: string): void {
  const pattern = file ?? '*.tex';
  
  console.log(chalk.blue(`Watching ${pattern} for changes...`));
  console.log(chalk.gray('Press Ctrl+C to stop'));
  console.log('');

  const watcher = chokidarWatch(pattern, {
    persistent: true,
    ignoreInitial: false,
  });

  let building = false;
  let pendingBuild = false;

  const doBuild = (path: string) => {
    if (building) {
      pendingBuild = true;
      return;
    }

    building = true;
    console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}] Change detected: ${path}`));
    
    try {
      build(path, { engine: 'tectonic' });
    } catch {
      // Error already logged by build
    }

    building = false;

    if (pendingBuild) {
      pendingBuild = false;
      doBuild(path);
    }
  };

  watcher.on('change', doBuild);
  watcher.on('add', (path) => {
    console.log(chalk.green(`Found: ${path}`));
    doBuild(path);
  });

  // Keep process alive
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nStopping watch...'));
    watcher.close();
    process.exit(0);
  });
}
