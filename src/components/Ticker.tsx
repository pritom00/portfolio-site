import { tickerItems } from '@/data/content';

function Row({ rev }: { rev?: boolean }) {
  const items = [...tickerItems, ...tickerItems];
  return (
    <div className={`ticker${rev ? ' rev' : ''}`} aria-hidden="true">
      <div className="tick-track">
        {items.map((t, i) => (
          <span key={i} className="chip tick-chip">{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function Ticker() {
  return (
    <div>
      <Row />
      <Row rev />
    </div>
  );
}
