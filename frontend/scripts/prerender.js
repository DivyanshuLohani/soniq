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
    { url: '/', title: 'soniq — Speed Music Quiz & Artist Trivia', desc: 'Hear 10 quick song clips, guess the right track, and test your music knowledge.' },
    { url: '/leaderboard', title: 'Leaderboard — soniq Speed Music Trivia', desc: 'See who has the sharpest ears and highest scores on the global music leaderboard.' },
    { url: '/terms', title: 'Terms of Service — soniq', desc: 'Terms and conditions for using soniq speed music quiz.' },
    { url: '/privacy', title: 'Privacy Policy — soniq', desc: 'Privacy policy and data handling information for soniq.' },
    { url: '/about', title: 'About soniq — The Music Guesser Game', desc: 'Learn about soniq, built by Divyanshu Lohani (dibbu.dev).' },
    { url: '/faq', title: 'Frequently Asked Questions — soniq', desc: 'FAQ about audio previews, Spotify accounts, and score calculations on soniq.' },
    { url: '/spotify-disclaimer', title: 'Spotify & Audio Disclaimer — soniq', desc: 'Spotify API usage guidelines and preview audio attribution.' },
  ];

  console.log(`[SSR Pre-render] Generating static HTML for ${routesToPrerender.length} routes...`);

  for (const item of routesToPrerender) {
    const { url, title, desc } = item;
    try {
      const { html: appHtml } = render(url);
      let renderedHtml = template.replace(
        '<div id="root"></div>',
        `<div id="root">${appHtml}</div>`
      );

      // Customize per-page meta title and description for search engines & Open Graph
      renderedHtml = renderedHtml
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${desc}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://soniq.dibbu.dev${url === '/' ? '' : url}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://soniq.dibbu.dev${url === '/' ? '' : url}" />`);

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
