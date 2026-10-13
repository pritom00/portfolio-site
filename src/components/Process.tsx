import { processSteps } from '@/data/content';

export default function Process() {
  return (
    <section id="process" className="section">
      <h2 className="sec-title">From idea to deploy</h2>
      <div className="proc-line" aria-hidden="true" />
      <ol className="proc-grid" style={{ listStyle: 'none', padding: 0 }}>
        {processSteps.map((s, i) => (
          <li key={s.title} className="proc-card glass">
            <div className="proc-num" style={{ background: s.color }} aria-hidden="true">{i + 1}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
