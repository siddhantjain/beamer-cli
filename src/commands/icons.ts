/**
 * slides icons - Search FontAwesome icons
 */

import chalk from 'chalk';

// Common FontAwesome 5 icons for presentations
const ICONS: Record<string, { code: string; aliases: string[] }> = {
  // Arrows & Navigation
  'arrow-right': { code: '\\faIcon{arrow-right}', aliases: ['next', 'forward'] },
  'arrow-left': { code: '\\faIcon{arrow-left}', aliases: ['back', 'previous'] },
  'arrow-up': { code: '\\faIcon{arrow-up}', aliases: ['up'] },
  'arrow-down': { code: '\\faIcon{arrow-down}', aliases: ['down'] },
  'arrows-alt': { code: '\\faIcon{arrows-alt}', aliases: ['move', 'drag'] },
  
  // Common UI
  'check': { code: '\\faIcon{check}', aliases: ['done', 'success', 'yes', 'tick'] },
  'times': { code: '\\faIcon{times}', aliases: ['close', 'x', 'no', 'cancel'] },
  'plus': { code: '\\faIcon{plus}', aliases: ['add', 'new'] },
  'minus': { code: '\\faIcon{minus}', aliases: ['remove', 'subtract'] },
  'search': { code: '\\faIcon{search}', aliases: ['find', 'magnify'] },
  'cog': { code: '\\faIcon{cog}', aliases: ['settings', 'gear', 'config'] },
  'cogs': { code: '\\faIcon{cogs}', aliases: ['settings', 'gears'] },
  
  // Communication
  'envelope': { code: '\\faIcon{envelope}', aliases: ['email', 'mail', 'message'] },
  'phone': { code: '\\faIcon{phone}', aliases: ['call', 'telephone'] },
  'comment': { code: '\\faIcon{comment}', aliases: ['chat', 'message', 'talk'] },
  'comments': { code: '\\faIcon{comments}', aliases: ['chat', 'discussion'] },
  
  // Data & Files
  'database': { code: '\\faIcon{database}', aliases: ['db', 'storage', 'data'] },
  'file': { code: '\\faIcon{file}', aliases: ['document', 'doc'] },
  'folder': { code: '\\faIcon{folder}', aliases: ['directory', 'dir'] },
  'cloud': { code: '\\faIcon{cloud}', aliases: ['storage', 'upload'] },
  
  // Tech
  'server': { code: '\\faIcon{server}', aliases: ['backend', 'host'] },
  'laptop': { code: '\\faIcon{laptop}', aliases: ['computer', 'pc'] },
  'mobile': { code: '\\faIcon{mobile}', aliases: ['phone', 'smartphone'] },
  'code': { code: '\\faIcon{code}', aliases: ['programming', 'dev'] },
  'terminal': { code: '\\faIcon{terminal}', aliases: ['cli', 'console', 'shell'] },
  'globe': { code: '\\faIcon{globe}', aliases: ['web', 'internet', 'world'] },
  'lock': { code: '\\faIcon{lock}', aliases: ['secure', 'security', 'private'] },
  'unlock': { code: '\\faIcon{unlock}', aliases: ['open', 'public'] },
  'key': { code: '\\faIcon{key}', aliases: ['password', 'auth', 'secret'] },
  
  // People
  'user': { code: '\\faIcon{user}', aliases: ['person', 'account', 'profile'] },
  'users': { code: '\\faIcon{users}', aliases: ['people', 'team', 'group'] },
  
  // Actions
  'play': { code: '\\faIcon{play}', aliases: ['start', 'run', 'begin'] },
  'pause': { code: '\\faIcon{pause}', aliases: ['wait', 'hold'] },
  'stop': { code: '\\faIcon{stop}', aliases: ['end', 'halt'] },
  'sync': { code: '\\faIcon{sync}', aliases: ['refresh', 'reload', 'update'] },
  'download': { code: '\\faIcon{download}', aliases: ['save', 'get'] },
  'upload': { code: '\\faIcon{upload}', aliases: ['send', 'push'] },
  
  // Status
  'exclamation': { code: '\\faIcon{exclamation}', aliases: ['warning', 'alert'] },
  'question': { code: '\\faIcon{question}', aliases: ['help', 'unknown'] },
  'info': { code: '\\faIcon{info}', aliases: ['information', 'about'] },
  'bell': { code: '\\faIcon{bell}', aliases: ['notification', 'alert'] },
  
  // Brands
  'github': { code: '\\faIcon{github}', aliases: ['git', 'repo'] },
  'docker': { code: '\\faIcon{docker}', aliases: ['container'] },
  'python': { code: '\\faIcon{python}', aliases: ['py'] },
  'js': { code: '\\faIcon{js}', aliases: ['javascript', 'node'] },
  'aws': { code: '\\faIcon{aws}', aliases: ['amazon', 'cloud'] },
  'google': { code: '\\faIcon{google}', aliases: [] },
  'slack': { code: '\\faIcon{slack}', aliases: [] },
  'discord': { code: '\\faIcon{discord}', aliases: [] },
  'telegram': { code: '\\faIcon{telegram}', aliases: [] },
  
  // Charts & Data
  'chart-bar': { code: '\\faIcon{chart-bar}', aliases: ['graph', 'stats', 'bar'] },
  'chart-line': { code: '\\faIcon{chart-line}', aliases: ['graph', 'trend', 'line'] },
  'chart-pie': { code: '\\faIcon{chart-pie}', aliases: ['pie', 'breakdown'] },
  
  // Misc
  'lightbulb': { code: '\\faIcon{lightbulb}', aliases: ['idea', 'tip', 'hint'] },
  'rocket': { code: '\\faIcon{rocket}', aliases: ['launch', 'deploy', 'fast'] },
  'heart': { code: '\\faIcon{heart}', aliases: ['love', 'like', 'favorite'] },
  'star': { code: '\\faIcon{star}', aliases: ['favorite', 'rating'] },
  'clock': { code: '\\faIcon{clock}', aliases: ['time', 'schedule'] },
  'calendar': { code: '\\faIcon{calendar}', aliases: ['date', 'schedule', 'event'] },
};

interface IconsOptions {
  limit: string;
}

export function icons(query: string, options: IconsOptions): void {
  const limit = parseInt(options.limit, 10);
  const q = query.toLowerCase();

  const matches: Array<{ name: string; code: string; matchType: string }> = [];

  for (const [name, { code, aliases }] of Object.entries(ICONS)) {
    // Exact match on name
    if (name === q) {
      matches.unshift({ name, code, matchType: 'exact' });
      continue;
    }
    
    // Partial match on name
    if (name.includes(q)) {
      matches.push({ name, code, matchType: 'name' });
      continue;
    }
    
    // Match on aliases
    if (aliases.some(a => a.includes(q))) {
      matches.push({ name, code, matchType: 'alias' });
    }
  }

  if (matches.length === 0) {
    console.log(chalk.yellow(`No icons found for "${query}"`));
    console.log(chalk.gray('Try: slides icons list'));
    return;
  }

  console.log(chalk.blue(`Icons matching "${query}":\n`));
  
  matches.slice(0, limit).forEach(({ name, code }) => {
    console.log(`  ${chalk.green(name.padEnd(20))} ${chalk.cyan(code)}`);
  });

  if (matches.length > limit) {
    console.log(chalk.gray(`\n  ... and ${matches.length - limit} more`));
  }

  console.log('');
  console.log(chalk.gray('Usage in LaTeX: \\faIcon{icon-name}'));
  console.log(chalk.gray('Requires: \\usepackage{fontawesome5}'));
}
