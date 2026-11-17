import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const templatePath = path.resolve(distDir, 'index.html');
const serverEntryPath = path.resolve(__dirname, '../dist-server/entry-server.js');

async function prerender() {
  if (!fs.existsSync(templatePath)) {
    console.error('Template index.html not found in dist. Run vite build first.');
    process.exit(1);
  }

  if (!fs.existsSync(serverEntryPath)) {
    console.error('Server entry not found in dist-server.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  const { render } = await import(serverEntryPath);

  // Routes to statically pre-render at build time for instant SSR performance and SEO
  const routesToPrerender = [
    '/',
    '/leaderboard',
    '/terms',
    '/privacy',
    '/about',
    '/faq',
    '/spotify-disclaimer',
  ];

  console.log(`[SSR Pre-render] Generating static HTML for ${routesToPrerender.length} routes...`);

  for (const url of routesToPrerender) {
    try {
      const { html: appHtml } = render(url);
      const renderedHtml = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );

      const filePath =
        url === '/'
          ? templatePath
          : path.resolve(distDir, `${url.slice(1)}/index.html`);

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, renderedHtml);
      console.log(`  ✓ Pre-rendered: ${url} -> ${path.relative(distDir, filePath)}`);
    } catch (err) {
      console.error(`  ✗ Error rendering ${url}:`, err);
    }
  }

  console.log('[SSR Pre-render] Completed successfully.');
}

prerender();
