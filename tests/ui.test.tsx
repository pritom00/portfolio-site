import { JSDOM } from 'jsdom';

// ---------- a minimal browser ----------
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: true, url: 'http://localhost/' });
const g: any = globalThis;
g.window = dom.window; g.document = dom.window.document;
Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true });
for (const k of ['HTMLElement', 'Element', 'Node', 'SVGElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'PointerEvent', 'getComputedStyle']) { if ((dom.window as any)[k]) g[k] = (dom.window as any)[k]; }
g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 16);
g.cancelAnimationFrame = (id: any) => clearTimeout(id);
dom.window.requestAnimationFrame = g.requestAnimationFrame; dom.window.cancelAnimationFrame = g.cancelAnimationFrame;
const mq = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
g.matchMedia = mq; (dom.window as any).matchMedia = mq;
class RO { cb: any; constructor(cb: any) { this.cb = cb; } observe(el: any) { Object.defineProperty(el, 'clientWidth', { value: 1100, configurable: true }); this.cb([]); } disconnect() {} unobserve() {} }
class IO { cb: any; constructor(cb: any) { this.cb = cb; } observe(el: any) { this.cb([{ isIntersecting: true, target: el }]); } disconnect() {} unobserve() {} }
g.ResizeObserver = RO; (dom.window as any).ResizeObserver = RO; g.IntersectionObserver = IO; (dom.window as any).IntersectionObserver = IO;
(dom.window as any).HTMLElement.prototype.focus = function () {};
g.IS_REACT_ACT_ENVIRONMENT = true;

const fetchLog: any[] = [];
g.fetch = async (url: string, init?: any) => {
  fetchLog.push({ url, body: init?.body });
  if (String(url).includes('/api/chat')) { const q = JSON.parse(init.body).messages.slice(-1)[0].text; return { ok: true, json: async () => ({ reply: `Test reply to: ${q}` }) }; }
  return { ok: true, json: async () => ({ counts: Array.from({ length: 48 }, (_, i) => (i % 5)), total: 96, live: true }) };
};

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); if (!ok) failed++; };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const $ = (sel: string, root: ParentNode = document) => root.querySelector(sel) as HTMLElement | null;
const $$ = (sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll(sel)) as HTMLElement[];

async function main() {
  const React = await import('react');
  const { act } = React as any;
  const { createRoot } = await import('react-dom/client');
  const errors: any[] = [];
  const origErr = console.error; console.error = (...a: any[]) => { errors.push(a.map(String).join(' ')); };

  const mount = async (el: any) => {
    const host = document.createElement('div'); document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => { root.render(el); });
    return { host, root, unmount: async () => { await act(async () => root.unmount()); host.remove(); } };
  };
  const click = async (el: HTMLElement | null) => { await act(async () => { el!.dispatchEvent(new (dom.window as any).MouseEvent('click', { bubbles: true })); }); };
  const wait = async (ms: number) => { await act(async () => { await sleep(ms); }); };
  /** polls until cond() is true (or 6s pass). Robust on slow machines, unlike a fixed sleep. */
  const waitFor = async (cond: () => boolean, ms = 6000): Promise<boolean> => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (cond()) return true; await act(async () => { await sleep(25); }); }
    return cond();
  };

  const { default: Hero } = await import('../src/components/Hero');
  const { default: Projects } = await import('../src/components/Projects');
  const { default: Skills } = await import('../src/components/Skills');
  const { default: ChatDemo } = await import('../src/components/ChatDemo');
  const { default: Nav } = await import('../src/components/Nav');
  const { default: Contact } = await import('../src/components/Contact');
  const { default: Snow } = await import('../src/components/Snow');
  const { default: BootIntro } = await import('../src/components/BootIntro');
  const { default: DogCursor } = await import('../src/components/DogCursor');
  const { default: Process } = await import('../src/components/Process');
  const { default: Ticker } = await import('../src/components/Ticker');

  // ---------- Hero + 3D map ----------
  {
    const m = await mount(<Hero />);
    await wait(50);
    check('hero: headline letters rendered', $$('.hl-letter', m.host).length === 'Full Stack'.length);
    check('hero: five clickable layer labels', $$('.hs', m.host).length === 5);
    check('hero: active layer starts on AI & Agents', $('.lc-name', m.host)?.textContent === 'AI & Agents');
    await click($$('.hs', m.host)[0]);
    check('hero: clicking a layer makes it active', $('.lc-name', m.host)?.textContent === 'Frontend');
    check('hero: layer is highlighted in the map', $$('.layer.on', m.host).length === 1);
    const explodeBtn = $$('.ctl-btn', m.host).find((b) => /Collapse|Explode/.test(b.textContent || ''))!;
    const z0 = $$('.layer', m.host)[0].style.transform;
    await click(explodeBtn);
    check('hero: Explode/Collapse changes the layer spacing', $$('.layer', m.host)[0].style.transform !== z0, `${z0} -> ${$$('.layer', m.host)[0].style.transform}`);
    const autoBtn = $$('.ctl-btn', m.host).find((b) => /Auto-tour/.test(b.textContent || ''))!;
    check('hero: tour stopped after manual pick', /off/.test(autoBtn.textContent || ''));
    check('hero: labels counter-rotate (billboards)', /rotateZ\(.*\) rotateX\(.*\)/.test(($('.anchor > div', m.host) as HTMLElement).style.transform));
    check('hero: GitHub heat grid loaded real counts', await waitFor(() => $$('.heat .cell', m.host).length === 48 && /96 public events/.test($('.heat-note', m.host)?.textContent || '')));
    check('hero: availability card shows status', /Open to work/.test(m.host.textContent || ''));
    await m.unmount();
  }

  // ---------- Projects carousel ----------
  {
    const m = await mount(<Projects />);
    await waitFor(() => $$('.pj-card', m.host).length === 4);   // cards are mounted (the entrance animation itself is CSS)
    await wait(2300);                                         // let the entrance phases finish
    check('projects: four cards rendered', $$('.pj-card', m.host).length === 4);
    const title = () => $('.pj-d-title', m.host)?.textContent;
    check('projects: starts on project 1', title() === '[Project 1 name]', String(title()));
    await click($('.pj-arrow.r', m.host)); await waitFor(() => title() === '[Project 2 name]');
    check('projects: next arrow goes to project 2 (title scrambles then resolves)', title() === '[Project 2 name]', String(title()));
    const stage = $('.pj-stage', m.host)!;
    await act(async () => { stage.dispatchEvent(new (dom.window as any).KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); }); await waitFor(() => title() === '[Project 1 name]');
    check('projects: ArrowLeft key goes back', title() === '[Project 1 name]', String(title()));
    await click($$('.pj-dot', m.host)[3]); await waitFor(() => title() === '[Project 4 name]');
    check('projects: dot jumps to project 4', title() === '[Project 4 name]', String(title()));
    check('projects: only the front card animates its preview', $$('.pj-media.off', m.host).length === 3);
    await click($$('.pj-tab', m.host)[1]);
    check('projects: Solution tab shows the solution text', /What you built and how people install/.test($('.pj-text', m.host)?.textContent || ''));
    await click($$('.pj-filter', m.host).find((b) => /^AI/.test(b.textContent || ''))!);
    await waitFor(() => $$('.pj-card', m.host).length === 2 && title() === '[Project 1 name]');
    check('projects: AI filter leaves 2 cards after the explode/reassemble transition', $$('.pj-card', m.host).length === 2 && title() === '[Project 1 name]', `${$$('.pj-card', m.host).length} cards, ${title()}`);
    check('projects: filter counts shown', $$('.pj-filter em', m.host).map((e) => e.textContent).join(',') === '4,2,1,1');
    check('projects: Live demo is disabled until a URL is set', ($$('.pj-actions button', m.host)[0] as HTMLButtonElement)?.disabled === true);
    check('projects: GitHub link points at the real profile', ($('.pj-actions a', m.host) as HTMLAnchorElement)?.href.includes('github.com/pritom00'));
    await click($$('.pj-filter', m.host)[0]); await waitFor(() => $$('.pj-card', m.host).length === 4);
    check('projects: All filter restores 4 cards', $$('.pj-card', m.host).length === 4);
    await m.unmount();
  }

  // ---------- Skills ----------
  {
    const m = await mount(<Skills />);
    const rows = $$('.skill-row', m.host);
    check('skills: AI row open by default', rows[2].getAttribute('aria-expanded') === 'true');
    await click(rows[1]);
    check('skills: clicking Backend opens it and closes AI', $$('.skill-row', m.host)[1].getAttribute('aria-expanded') === 'true' && $$('.skill-row', m.host)[2].getAttribute('aria-expanded') === 'false');
    await m.unmount();
  }

  // ---------- Chat ----------
  {
    const m = await mount(<ChatDemo />);
    check('chat: greeting shown', /portfolio assistant/.test($('.chat-log', m.host)?.textContent || ''));
    const input = $('#chat-q', m.host) as HTMLInputElement;
    const send = $('.chat-send', m.host) as HTMLButtonElement;
    check('chat: Send disabled when empty', send.disabled);
    const setter = Object.getOwnPropertyDescriptor((dom.window as any).HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => { setter.call(input, 'Do you know Rust?'); input.dispatchEvent(new (dom.window as any).Event('input', { bubbles: true })); });
    check('chat: Send enabled after typing', !( $('.chat-send', m.host) as HTMLButtonElement).disabled);
    await act(async () => { ($('.chat-form', m.host) as HTMLFormElement).dispatchEvent(new (dom.window as any).Event('submit', { bubbles: true, cancelable: true })); });
    await waitFor(() => $$('.bubble', m.host).some((b) => b.textContent === 'Test reply to: Do you know Rust?'));
    const bubbles = $$('.bubble', m.host).map((b) => b.textContent);
    check('chat: user message and typed-out reply appear', bubbles.includes('Do you know Rust?') && bubbles.some((t) => t === 'Test reply to: Do you know Rust?'), JSON.stringify(bubbles.slice(0, 2)));
    const call = fetchLog.find((c) => String(c.url).includes('/api/chat'));
    check('chat: posts the conversation to /api/chat', !!call && JSON.parse(call.body).messages.length === 2);
    check('chat: input cleared and ready again', (($('#chat-q', m.host)) as HTMLInputElement).value === '' && !($$('.sugg', m.host)[0] as HTMLButtonElement).disabled);
    await waitFor(() => !($$('.sugg', m.host)[1] as HTMLButtonElement).disabled);
    await click($$('.sugg', m.host)[1]);
    await waitFor(() => $$('.bubble', m.host).some((b) => b.textContent === "Test reply to: What's your stack?"));
    check('chat: suggestion chips send a question', $$('.bubble', m.host).some((b) => b.textContent === "Test reply to: What's your stack?"));
    await m.unmount();
  }

  // ---------- Nav, Contact, Snow, Boot, Dog, static sections ----------
  {
    const m = await mount(<Nav />);
    const t = $('.nav-toggle', m.host)!;
    await click(t);
    check('nav: menu toggle opens the mobile menu', $('#nav-links', m.host)?.classList.contains('open') === true && t.getAttribute('aria-expanded') === 'true');
    await click($$('.nav-link', m.host)[1]);
    check('nav: choosing a link closes the menu', $('#nav-links', m.host)?.classList.contains('open') === false);
    check('nav: scroll progress bar exists', !!$('.nav-progress', m.host));
    await m.unmount();
  }
  {
    const m = await mount(<Contact />);
    const btns = $$('.contact-actions .btn', m.host);
    check('contact: placeholders are disabled, not dead links', (btns[0] as HTMLButtonElement).disabled && /\[your@email.com\]/.test(btns[0].textContent || ''));
    check('contact: GitHub link works', ($$('.contact-actions a', m.host)[0] as HTMLAnchorElement).href.includes('github.com/pritom00'));
    await m.unmount();
  }
  {
    const s = await mount(<Snow />);
    check('snow: flakes created after mount', await waitFor(() => $$('.flake', s.host).length === 80));
    await s.unmount();
    const b = await mount(<BootIntro />);
    check('boot: intro renders', !!$('.boot', b.host));
    await act(async () => { for (const n of ['animationend', 'webkitAnimationEnd']) $('.boot', b.host)!.dispatchEvent(new (dom.window as any).Event(n, { bubbles: true })); });   // jsdom has no AnimationEvent, so React listens for the prefixed name
    check('boot: removes itself when the animation ends', !$('.boot', b.host));
    await b.unmount();
    const d = await mount(<DogCursor />); await wait(30);
    check('dog: wrapper + canvas rendered, nothing crashes without WebGL', !!$('.dog-wrap canvas', d.host));
    await d.unmount();
    const p = await mount(<><Process /><Ticker /></>);
    check('process: four steps', $$('.proc-card', p.host).length === 4);
    check('ticker: two rows', $$('.ticker', p.host).length === 2);
    await p.unmount();
  }

  console.error = origErr;
  const real = errors.filter((e) => !/not wrapped in act|Warning: An update to/.test(e));
  check('no React runtime errors or warnings during the whole run', real.length === 0, real.slice(0, 2).join(' | '));
  console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL UI CHECKS PASSED');
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
