import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/categories';

// AI search and assistant crawlers, named so it is explicit that they are welcome
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'DuckAssistBot', 'meta-externalagent',
];

export default function robots(): MetadataRoute.Robots {
  const open = { allow: '/', disallow: ['/api/', '/signup'] };
  return {
    rules: [
      { userAgent: '*', ...open },
      { userAgent: AI_CRAWLERS, ...open },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
