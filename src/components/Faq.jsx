import { useState } from 'react';
import { FAQ } from '../data.js';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="view-enter">
      <div className="eyebrow">Central de ajuda</div>
      <h1 className="page-title">Perguntas frequentes</h1>
      <p className="page-sub">Dúvidas comuns de produtores e cooperativas de açaí sobre o registro de Indicação Geográfica.</p>

      <div>
        {FAQ.map((f, i) => {
          const open = openIndex === i;
          return (
            <div className={`faq-item ${open ? 'open' : ''}`} key={f.q}>
              <button className="faq-q" aria-expanded={open} onClick={() => setOpenIndex(open ? -1 : i)}>
                <span>{f.q}</span>
                <span className="car">+</span>
              </button>
              {open && <div className="faq-a" dangerouslySetInnerHTML={{ __html: `<p>${f.a}</p>` }} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
