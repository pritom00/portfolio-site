/**
 * All of the words on the site live here.
 * Replace every [bracketed] placeholder with your real content, then save.
 */

export const profile = {
  name: 'Estiaz Nur Pritom',
  shortName: 'Estiaz Pritom',
  initials: 'EP',
  role: 'AI Full Stack Developer',
  headline: ['Full Stack', 'AI Developer'] as const,
  pitch: 'I build and ship AI-powered products, from interface to inference.',
  github: 'https://github.com/pritom00',
  githubUser: 'pritom00',
  email: '', // TODO: your email, e.g. 'you@example.com'
  linkedin: '', // TODO: your LinkedIn URL
  cv: '', // TODO: put your CV in /public and set '/cv.pdf'
  availability: { open: true, label: 'Open to work', detail: 'Freelance & full-time' },
  building: { name: '[Current project]', note: '[One line about what you are building right now]' }
};

export const rotatingWords = ['AI agents', 'RAG apps', 'full-stack products', 'things that ship'];

export type Layer = {
  id: string;
  name: string;
  color: string;
  rgb: string;
  desc: string;
  tools: string[];
  level?: number; // 0-100, optional. Leave undefined to show [%]
};

export const layers: Layer[] = [
  { id: 'frontend', name: 'Frontend', color: '#FFCE06', rgb: '255,206,6', desc: '[How you build fast, accessible interfaces and what you are proud of.]', tools: ['[React]', '[Next.js]', '[Tailwind]'] },
  { id: 'backend', name: 'Backend', color: '#B5FDCE', rgb: '181,253,206', desc: '[How you design APIs, auth and services.]', tools: ['[Node]', '[FastAPI]', '[REST]'] },
  { id: 'ai', name: 'AI & Agents', color: '#20BE35', rgb: '32,190,53', desc: '[How you build LLM features, retrieval and agent workflows.]', tools: ['[LLM APIs]', '[RAG]', '[Agents]'] },
  { id: 'data', name: 'Data', color: '#B5FDCE', rgb: '181,253,206', desc: '[How you model, store and query data.]', tools: ['[Postgres]', '[Vector DB]'] },
  { id: 'devops', name: 'DevOps', color: '#FFFFFF', rgb: '255,255,255', desc: '[How you ship, monitor and scale.]', tools: ['[Docker]', '[Vercel]', '[CI/CD]'] }
];

export type ProjectKind = 'chat' | 'dash' | 'graph' | 'term';
export type ProjectCat = 'ai' | 'fullstack' | 'tools';

export type Project = {
  id: number;
  cat: ProjectCat;
  catLabel: string;
  kind: ProjectKind; // decides which animated preview is drawn on the card
  title: string;
  blurb: string;
  tag: string;
  color: string;
  rgb: string;
  stack: string[];
  metric: string;
  problem: string;
  solution: string;
  result: string;
  metrics: { v: string; l: string }[];
  demo: string; // live URL ('' shows a disabled button)
  repo: string;
};

const m3 = [{ v: '[00]', l: '[Metric]' }, { v: '[00]', l: '[Metric]' }, { v: '[00]', l: '[Metric]' }];

export const projects: Project[] = [
  {
    id: 1, cat: 'ai', catLabel: 'AI · Chat', kind: 'chat', title: '[Project 1 name]',
    blurb: '[One line on what it does and who it is for.]', tag: 'Live', color: '#20BE35', rgb: '32,190,53',
    stack: ['[Next.js]', '[FastAPI]', '[LLM]'], metric: '[Key result]',
    problem: '[The problem you set out to solve, and who had it.]',
    solution: '[What you built and the key technical decisions, including how you used AI tools.]',
    result: '[What changed: numbers, feedback or lessons learned.]',
    metrics: m3, demo: '', repo: 'https://github.com/pritom00'
  },
  {
    id: 2, cat: 'fullstack', catLabel: 'Full-stack · Dashboard', kind: 'dash', title: '[Project 2 name]',
    blurb: '[One line on what it does and who it is for.]', tag: 'In progress', color: '#FFCE06', rgb: '255,206,6',
    stack: ['[React]', '[Node]', '[Postgres]'], metric: '[Key result]',
    problem: '[The problem you set out to solve, and who had it.]',
    solution: '[What you built: frontend, API and data model, and why you chose them.]',
    result: '[What changed: numbers, feedback or lessons learned.]',
    metrics: m3, demo: '', repo: 'https://github.com/pritom00'
  },
  {
    id: 3, cat: 'ai', catLabel: 'AI · Agent', kind: 'graph', title: '[Project 3 name]',
    blurb: '[One line on what it does and who it is for.]', tag: 'Agent', color: '#B5FDCE', rgb: '181,253,206',
    stack: ['[Python]', '[RAG]', '[Docker]'], metric: '[Key result]',
    problem: '[The problem you set out to solve, and who had it.]',
    solution: '[How the agent or retrieval pipeline works, and how you tested it.]',
    result: '[What changed: numbers, feedback or lessons learned.]',
    metrics: m3, demo: '', repo: 'https://github.com/pritom00'
  },
  {
    id: 4, cat: 'tools', catLabel: 'Developer tool', kind: 'term', title: '[Project 4 name]',
    blurb: '[One line on what it does and who it is for.]', tag: 'Open source', color: '#D9FFE8', rgb: '217,255,232',
    stack: ['[TypeScript]', '[CLI]', '[CI/CD]'], metric: '[Key result]',
    problem: '[The problem you set out to solve, and who had it.]',
    solution: '[What you built and how people install and use it.]',
    result: '[What changed: numbers, feedback or lessons learned.]',
    metrics: m3, demo: '', repo: 'https://github.com/pritom00'
  }
];

export const tickerItems = [
  '[React]', '[Next.js]', '[TypeScript]', '[Node]', '[FastAPI]', '[Python]',
  '[LLM APIs]', '[RAG]', '[Agents]', '[Postgres]', '[Vector DB]', '[Docker]'
];

export const processSteps = [
  { title: 'Idea', text: '[How you define the problem and the user.]', color: '#20BE35' },
  { title: 'Design', text: '[How you sketch the UI and data model.]', color: '#B5FDCE' },
  { title: 'Build', text: '[How you code it and direct AI tools.]', color: '#FFCE06' },
  { title: 'Deploy', text: '[How you ship, test and iterate.]', color: '#FFFFFF' }
];

export const chatSuggestions = ['What have you built?', "What's your stack?", 'Are you available?'];
