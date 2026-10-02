export const categories = [
 { name: 'Markets & Trades', slug: 'markets-trades', description: 'Observations, trade hypotheses, and reviews of decisions under uncertainty.' },
 { name: 'Research & Models', slug: 'research-models', description: 'Questions made testable. Models, experiments, and the assumptions behind them.' },
 { name: 'Learning Notes', slug: 'learning-notes', description: 'Working through finance, probability, and quantitative ideas from first principles.' },
 { name: 'Thinking', slug: 'thinking', description: 'Reflections on judgment, learning, and the process of changing my mind.' }
];
export const dateLabel = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const newestFirst = (a: any, b: any) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id);

export const readingTime = (body = '') => Math.max(1, Math.ceil(body.replace(/```[\s\S]*?```/g, '').replace(/<[^>]*>/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g,'').trim().split(/\s+/).filter(Boolean).length / 220));
