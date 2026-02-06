import fs from 'fs';
import path from 'path';

export interface InsightArticle {
  slug: string;
  title: string;
  date: string;
  author: string;
  preview: string;
  readTime: number;
  content: string;
}

export interface InsightMeta {
  slug: string;
  title: string;
  date: string;
  author: string;
  preview: string;
  readTime: number;
}

function parseFrontmatter(fileContent: string): { meta: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);
  
  if (!match) {
    return { meta: {}, content: fileContent };
  }
  
  const frontmatterStr = match[1];
  const content = match[2].trim();
  
  const meta: Record<string, any> = {};
  const lines = frontmatterStr.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Parse numbers
    if (!isNaN(Number(value)) && value !== '') {
      meta[key] = Number(value);
    } else {
      meta[key] = value;
    }
  }
  
  return { meta, content };
}

export function getAllInsights(): InsightMeta[] {
  const insightsDir = path.join(process.cwd(), 'data', 'insights');
  
  if (!fs.existsSync(insightsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(insightsDir).filter(f => f.endsWith('.md'));
  
  const insights: InsightMeta[] = files.map(filename => {
    const filePath = path.join(insightsDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { meta } = parseFrontmatter(fileContent);
    
    return {
      slug: meta.slug || filename.replace('.md', ''),
      title: meta.title || 'Untitled',
      date: meta.date || '',
      author: meta.author || 'Wren',
      preview: meta.preview || '',
      readTime: meta.readTime || 5,
    };
  });
  
  // Sort by date, newest first (secondary sort by slug descending for same-day articles)
  return insights.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    // For same date, sort by slug descending (newer slugs typically have later names)
    return b.slug.localeCompare(a.slug);
  });
}

export function getInsightBySlug(slug: string): InsightArticle | null {
  const insightsDir = path.join(process.cwd(), 'data', 'insights');
  
  if (!fs.existsSync(insightsDir)) {
    return null;
  }
  
  const files = fs.readdirSync(insightsDir).filter(f => f.endsWith('.md'));
  
  for (const filename of files) {
    const filePath = path.join(insightsDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { meta, content } = parseFrontmatter(fileContent);
    
    const articleSlug = meta.slug || filename.replace('.md', '');
    
    if (articleSlug === slug) {
      return {
        slug: articleSlug,
        title: meta.title || 'Untitled',
        date: meta.date || '',
        author: meta.author || 'Wren',
        preview: meta.preview || '',
        readTime: meta.readTime || 5,
        content,
      };
    }
  }
  
  return null;
}

export function getAllSlugs(): string[] {
  const insights = getAllInsights();
  return insights.map(i => i.slug);
}
