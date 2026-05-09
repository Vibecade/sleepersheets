const NEWS_SOURCES = [
  {
    id: 'cbs-nfl',
    name: 'CBS Sports NFL',
    url: 'https://www.cbssports.com/rss/headlines/nfl/',
  },
  {
    id: 'nbc-pft',
    name: 'NBC ProFootballTalk',
    url: 'https://www.nbcsports.com/profootballtalk.rss',
  },
  {
    id: 'pff',
    name: 'PFF',
    url: 'https://www.pff.com/feed',
  },
];

const INJURY_PATTERNS = [
  /\binjur(?:y|ies|ed)\b/i,
  /\bquestionable\b/i,
  /\bdoubtful\b/i,
  /\bout for\b/i,
  /\bout with\b/i,
  /\binjured reserve\b/i,
  /\bir\b/i,
  /\bhamstring\b/i,
  /\bankle\b/i,
  /\bknee\b/i,
  /\bconcussion\b/i,
  /\bacl\b/i,
  /\bmcl\b/i,
  /\bbroken\b/i,
];

const ROOKIE_PATTERNS = [
  /\brookie(?:s)?\b/i,
  /\bnfl draft\b/i,
  /\bdraft prospect(?:s)?\b/i,
  /\bcombine\b/i,
  /\bfirst(?:\s|-)?round\b/i,
  /\bundrafted\b/i,
  /\budfa\b/i,
  /\btraining camp battle\b/i,
];

const REQUEST_TIMEOUT_MS = 7000;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripCdata = (value) =>
  value
    .replace(/^<!\[CDATA\[/i, '')
    .replace(/\]\]>$/i, '')
    .trim();

const decodeXmlEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isNaN(parsed) ? _ : String.fromCodePoint(parsed);
    })
    .replace(/&#([0-9]+);/g, (_, code) => {
      const parsed = Number.parseInt(code, 10);
      return Number.isNaN(parsed) ? _ : String.fromCodePoint(parsed);
    });

const stripHtml = (value) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const extractTag = (block, tagName) => {
  const pattern = new RegExp(`<${escapeRegExp(tagName)}[^>]*>([\\s\\S]*?)</${escapeRegExp(tagName)}>`, 'i');
  const match = block.match(pattern);
  return match ? decodeXmlEntities(stripCdata(match[1])) : '';
};

const parseDate = (rawDate) => {
  const timestamp = rawDate ? Date.parse(rawDate) : NaN;
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp).toISOString();
};

const classifyItem = (text) => {
  if (INJURY_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'injury';
  }
  if (ROOKIE_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'rookie';
  }
  return 'general';
};

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Sleepersheets-NewsBot/1.0 (+https://www.sleepersheets.com)',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!response.ok) {
      throw new Error(`Source request failed with status ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const parseRssItems = (xml, source) => {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const items = [];

  for (const itemBlock of itemMatches) {
    const title = extractTag(itemBlock, 'title');
    const link = extractTag(itemBlock, 'link');
    const description = extractTag(itemBlock, 'description') || extractTag(itemBlock, 'content:encoded');
    const categoryRaw = extractTag(itemBlock, 'category');
    const pubDateRaw = extractTag(itemBlock, 'pubDate') || extractTag(itemBlock, 'dc:date');
    const publishedAt = parseDate(pubDateRaw);

    if (!title || !link) {
      continue;
    }

    const textForClassification = `${title} ${description} ${categoryRaw}`;
    const summary = stripHtml(description).slice(0, 260);

    items.push({
      id: `${source.id}:${link}`,
      title,
      link,
      summary,
      source: source.name,
      sourceId: source.id,
      category: classifyItem(textForClassification),
      publishedAt,
    });
  }

  return items;
};

const sortByPublishedAtDesc = (left, right) => {
  const leftTimestamp = left.publishedAt ? Date.parse(left.publishedAt) : 0;
  const rightTimestamp = right.publishedAt ? Date.parse(right.publishedAt) : 0;
  return rightTimestamp - leftTimestamp;
};

export default async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const limitRaw = Number(req.query?.limit || DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), MAX_LIMIT) : DEFAULT_LIMIT;
  const category = typeof req.query?.category === 'string' ? req.query.category.toLowerCase() : 'all';

  const sourceResults = await Promise.allSettled(
    NEWS_SOURCES.map(async (source) => {
      const xml = await fetchWithTimeout(source.url);
      return parseRssItems(xml, source);
    })
  );

  const allItems = [];
  const sourceErrors = [];

  sourceResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
      return;
    }
    sourceErrors.push({
      source: NEWS_SOURCES[index].name,
      message: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });

  const dedupedItems = Array.from(
    new Map(allItems.map((item) => [item.link, item])).values()
  );

  const filteredItems = dedupedItems
    .filter((item) => (category === 'all' ? true : item.category === category))
    .sort(sortByPublishedAtDesc)
    .slice(0, limit);

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).json({
    items: filteredItems,
    fetchedAt: new Date().toISOString(),
    category,
    limit,
    sources: NEWS_SOURCES.map(({ id, name }) => ({ id, name })),
    sourceErrors,
  });
}
