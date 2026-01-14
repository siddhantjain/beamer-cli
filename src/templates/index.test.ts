import { describe, it, expect } from 'vitest';
import { getTemplate, listTemplates } from './index.js';

describe('templates', () => {
  it('lists available templates', () => {
    const templates = listTemplates();
    expect(templates).toContain('main');
    expect(templates).toContain('code');
    expect(templates).toContain('quote');
  });

  it('generates main template', () => {
    const output = getTemplate('main', {
      title: 'Test Presentation',
      theme: 'Madrid',
      colorTheme: 'default',
      aspectRatio: '169',
    });
    expect(output).toContain('\\documentclass');
    expect(output).toContain('Test Presentation');
  });

  it('generates code template', () => {
    const output = getTemplate('code');
    expect(output).toContain('lstlisting');
  });

  it('generates quote template with escaped backticks', () => {
    const output = getTemplate('quote');
    expect(output).toContain('quote');
    expect(output).toContain('Alan Kay');
  });
});
