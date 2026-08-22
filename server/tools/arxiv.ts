import { ArxivSearchInput, ArxivSearchResult } from './types';

/**
 * Real arXiv API Search Tool
 * Uses public arXiv API: https://export.arxiv.org/api/query
 * Normalizes results into ArxivSearchResult structure without fabricating any papers.
 */
export async function search_arxiv(params: ArxivSearchInput): Promise<ArxivSearchResult[]> {
  const { query, max_results = 5 } = params;
  if (!query || !query.trim()) {
    return [];
  }

  const cleanQuery = query.trim();
  const limit = Math.min(Math.max(1, max_results), 15);
  const items: ArxivSearchResult[] = [];

  // Build formatted query for arXiv syntax
  // If query does not already contain field prefixes like "all:", "ti:", "abs:", prepend "all:"
  let formattedQuery = cleanQuery;
  if (!/(ti|au|abs|co|jr|rn|all):/.test(cleanQuery)) {
    // Sanitize quotes and special characters for arXiv query string
    const tokens = cleanQuery
      .replace(/[^\w\s\-"']/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);

    if (tokens.length > 0) {
      formattedQuery = `all:${tokens.join(' AND all:')}`;
    } else {
      formattedQuery = `all:${cleanQuery}`;
    }
  }

  const encodedQuery = encodeURIComponent(formattedQuery);
  const url = `https://export.arxiv.org/api/query?search_query=${encodedQuery}&start=0&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'HackVerse-Intel-Tracker/1.0 (academic research client)',
        Accept: 'application/atom+xml, application/xml, text/xml'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`arXiv API returned status ${res.status}: ${res.statusText}`);
      return [];
    }

    const xmlText = await res.text();

    // Regex-based XML extraction for ATOM feed entries
    const entryRegex = /<entry[\s\S]*?>([\s\S]*?)<\/entry>/gi;
    let match;

    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryBlock = match[1];

      // Title
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(entryBlock);
      const rawTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

      // Summary / Abstract
      const summaryMatch = /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(entryBlock);
      const rawSummary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';

      // Published Date
      const publishedMatch = /<published[^>]*>([\s\S]*?)<\/published>/i.exec(entryBlock);
      const publishedDate = publishedMatch ? publishedMatch[1].trim() : new Date().toISOString();

      // Canonical ID / Link
      const idMatch = /<id[^>]*>([\s\S]*?)<\/id>/i.exec(entryBlock);
      let canonicalUrl = idMatch ? idMatch[1].trim() : '';
      if (canonicalUrl.startsWith('http://')) {
        canonicalUrl = canonicalUrl.replace('http://', 'https://');
      }

      // Authors extraction
      const authors: string[] = [];
      const authorRegex = /<author[\s\S]*?>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi;
      let authorMatch;
      while ((authorMatch = authorRegex.exec(entryBlock)) !== null) {
        const authorName = authorMatch[1].replace(/\s+/g, ' ').trim();
        if (authorName && !authors.includes(authorName)) {
          authors.push(authorName);
        }
      }

      if (rawTitle && rawSummary) {
        items.push({
          source: 'arXiv',
          title: rawTitle,
          authors: authors.length > 0 ? authors : ['ArXiv Research Author'],
          published: publishedDate,
          summary: rawSummary,
          url: canonicalUrl || `https://arxiv.org/abs/${encodeURIComponent(rawTitle.slice(0, 20))}`,
          tool: 'search_arxiv'
        });
      }
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('arXiv API request timed out after 8s');
    } else {
      console.warn('arXiv API fetch error:', err.message || err);
    }
    // Return whatever was collected or empty array on failure
  }

  return items;
}
