

/**
 * Portfolio content configuration.
 * Personal details, system layers, projects, ticker, and process steps.
 */
export const profile = {
  name: 'Estiaz Nur Pritom',
  shortName: 'Estiaz Pritom',
  initials: 'EP',
  role: 'Full-Stack Developer',
  headline: ['Full Stack', 'Developer'] as const,
  pitch:
    'I build practical web applications, from intuitive interfaces to secure backend services.',
  github: 'https://github.com/pritom00',
  githubUser: 'pritom00',
  email: 'pritomofficial00@gmail.com',
  linkedin: 'https://www.linkedin.com/in/estiaz-nur-pritom-2b807221b/',
  Resume: 'resume.pdf',
  availability: {
    open: true,
    label: 'Open to work',
    detail: 'Internships and software engineering opportunities',
  },
  building: {
    name: 'CourierHub',
    note: 'Multi-role courier and logistics platform',
  },
};


export const rotatingWords = [
  'full-stack applications',
  'backend systems',
  'secure APIs',
  'useful products',
];

export type Layer = {
  id: string;
  name: string;
  color: string;
  rgb: string;
  desc: string;
  tools: string[];
  level?: number;
};

export const layers: Layer[] = [
  {
    id: 'frontend',
    name: 'Frontend',
    color: '#FFCE06',
    rgb: '255,206,6',
    desc: 'Building responsive interfaces and user-friendly web experiences.',
    tools: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
  },
  {
    id: 'backend',
    name: 'Backend',
    color: '#B5FDCE',
    rgb: '181,253,206',
    desc: 'Developing APIs, authentication, business logic, and server-side features.',
    tools: ['Node.js', 'Express.js', 'REST APIs', 'Authentication'],
  },
  {
    id: 'ai',
    name: 'AI & Agents',
    color: '#20BE35',
    rgb: '32,190,53',
    desc: 'Exploring AI-powered features and practical ways to integrate intelligent tools.',
    tools: ['AI APIs', 'Automation', 'Integration'],
  },
  {
    id: 'data',
    name: 'Data',
    color: '#B5FDCE',
    rgb: '181,253,206',
    desc: 'Working with application data, database models, and persistent storage.',
    tools: ['PostgreSQL', 'Prisma', 'SQL'],
  },
  {
    id: 'devops',
    name: 'DevOps',
    color: '#FFFFFF',
    rgb: '255,255,255',
    desc: 'Learning deployment, environment configuration, and reliable application delivery.',
    tools: ['Git', 'Docker', 'Render', 'Vercel'],
  },
];

export type ProjectKind = 'chat' | 'dash' | 'graph' | 'term';
export type ProjectCat = 'ai' | 'fullstack' | 'tools';

export type Project = {
  id: number;
  cat: ProjectCat;
  catLabel: string;
  kind: ProjectKind;
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
  demo: string;
  repo: string;
};

export const projects: Project[] = [
  {
    id: 1,
    cat: 'fullstack',
    catLabel: 'Full-stack · Logistics',
    kind: 'dash',
    title: 'CourierHub',
    blurb:
      'A multi-role courier and logistics platform with customer, courier, and admin workflows.',
    tag: 'Live',
    color: '#FFCE06',
    rgb: '255,206,6',
    stack: [
      'Next.js 15',
      'TypeScript',
      'TanStack Query',
      'Zustand',
      'Stripe',
    ],
    metric: '3 role-based workflows',
    problem:
      'Logistics platforms need different workflows for customers, couriers, and administrators. This project brings those experiences together in one application.',
    solution:
      'The frontend includes role-specific interfaces, protected routes, a shipment booking flow, price estimates, and Stripe payment integration.',
    result:
      'Designed to support the shipment lifecycle from customer booking to administrator assignment and courier status updates. Verify the complete payment flow against the deployed application before claiming end-to-end verification.',
    metrics: [
      { v: '3', l: 'Roles' },
      { v: 'Stripe', l: 'Payments' },
      { v: 'BFF', l: 'Architecture' },
    ],
    demo: 'https://courier-frontend-hi8r.onrender.com',
    repo: 'https://github.com/pritom00/courier-frontend',
  },
  {
    id: 2,
    cat: 'fullstack',
    catLabel: 'Full-stack · Marketplace',
    kind: 'dash',
    title: 'RentNest',
    blurb:
      'A rental property marketplace connecting tenants, landlords, and administrators.',
    tag: 'Live',
    color: '#20BE35',
    rgb: '32,190,53',
    stack: [
      'Next.js 14',
      'TypeScript',
      'TanStack Query',
      'Zustand',
      'Stripe',
      'Prisma',
    ],
    metric: 'Tenant-to-landlord workflows',
    problem:
      'Rental marketplaces need a clear way to discover properties, manage rental requests, and support different user roles.',
    solution:
      'The frontend provides role-specific dashboards, property management interfaces, rental request workflows, and payment integration.',
    result:
      'Designed to connect property discovery, rental requests, and payment workflows. Verify the deployed application and payment flow before claiming end-to-end verification.',
    metrics: [
      { v: '3', l: 'Roles' },
      { v: 'Stripe', l: 'Payments' },
      { v: 'E2E', l: 'Test the flow' },
    ],
    demo: 'https://rentnest-frontend.onrender.com',
    repo: 'https://github.com/pritom00/rentnest-frontend',
  },

  {
    id: 3,
    cat: 'fullstack',
    catLabel: 'Full-stack · Developer Analytics',
    kind: 'dash',
    title: 'DevPulse',
    blurb:
      'A full-stack developer analytics platform with a dedicated web frontend and backend API.',
    tag: 'Live',
    color: '#B5FDCE',
    rgb: '181,253,206',
    stack: [
      'Next.js',
      'TypeScript',
      'Node.js',
      'Express.js',
      'PostgreSQL',
      'Prisma',
    ],
    metric: 'Full-stack web application',
    problem:
      'Developers need a convenient interface to explore useful project data and insights.',
    solution:
      'Built a web frontend connected to a dedicated backend API, separating the user interface from server-side application logic.',
    result:
      'Deployed the frontend on Vercel with separate source repositories for the frontend and API.',
    metrics: [
      { v: '2', l: 'Codebases' },
      { v: 'API', l: 'Backend' },
      { v: 'Web', l: 'Frontend' },
    ],
    demo: 'https://devpulse-web-lake.vercel.app/',
    repo: 'https://github.com/pritom00/devpulse-web',
  },


];

export const tickerItems = [
  'Next.js',
  'TypeScript',
  'React',
  'Node.js',
  'Express.js',
  'PostgreSQL',
  'Prisma',
  'TanStack Query',
  'Zustand',
  'Stripe',
  'Git',
  'Docker',
  'Render',
  'Vercel',
];

export const processSteps = [
  {
    title: 'Idea',
    text: 'Understand the problem, the intended users, and the features the application needs.',
    color: '#20BE35',
  },
  {
    title: 'Design',
    text: 'Plan the user interface, application architecture, API contracts, and data model.',
    color: '#B5FDCE',
  },
  {
    title: 'Build',
    text: 'Implement the frontend, backend integrations, authentication, and application workflows.',
    color: '#FFCE06',
  },
  {
    title: 'Deploy',
    text: 'Deploy the application, test important user journeys, and improve it using feedback.',
    color: '#FFFFFF',
  },
];

export const chatSuggestions = [
  'What have you built?',
  "What's your tech stack?",
  'Are you available for opportunities?',
];
