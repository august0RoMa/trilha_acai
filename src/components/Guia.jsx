export default function Guia() {
  return (
    <section className="view-enter">
      <div className="eyebrow">Central de ajuda</div>
      <h1 className="page-title">Guia básico da Indicação Geográfica</h1>
      <p className="page-sub">O essencial para quem está começando a organizar o pedido de IG do açaí junto ao INPI.</p>

      <div className="guide-grid">
        <div>
          <div className="guide-card">
            <h3>O que é uma IG?</h3>
            <p>
              Um registro que liga um produto ou serviço a uma região específica, porque a qualidade, a reputação ou
              as características do que é produzido ali vêm justamente do lugar de origem — como o açaí colhido nas
              várzeas do Pará.
            </p>
            <div className="type-compare">
              <div className="type-box ip">
                <span className="tbadge">IP · INDICAÇÃO DE PROCEDÊNCIA</span>
                <p>O nome do local já é reconhecido por produzir, extrair ou prestar aquele serviço. É preciso comprovar essa fama.</p>
              </div>
              <div className="type-box do">
                <span className="tbadge">DO · DENOMINAÇÃO DE ORIGEM</span>
                <p>As características do produto dependem do meio geográfico — clima, solo, marés — e do modo de fazer local.</p>
              </div>
            </div>
          </div>

          <div className="guide-card">
            <h3>Por que registrar</h3>
            <ul>
              <li>Preserva tradições e saberes dos extrativistas e produtores.</li>
              <li>Diferencia o produto no mercado nacional e internacional.</li>
              <li>Ajuda a movimentar a economia da região produtora.</li>
            </ul>
          </div>

          <div className="guide-card">
            <h3>Como solicitar o registro</h3>
            <ol className="steps-list">
              <li>
                <div>
                  <div className="stitle">Preparar a documentação</div>
                  <div className="sdesc">Reunir os documentos exigidos pelo INPI — eles variam conforme o tipo de IG (IP ou DO) e o solicitante.</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="stitle">Pagar a taxa (GRU)</div>
                  <div className="sdesc">Fazer o cadastro no sistema e‑INPI, emitir a Guia de Recolhimento da União e guardar o número para usar no pedido.</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="stitle">Protocolar o pedido</div>
                  <div className="sdesc">O processo é feito só de forma eletrônica, pelo sistema e‑IG — não existe pedido em papel.</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="stitle">Acompanhar o processo</div>
                  <div className="sdesc">O INPI pode pedir correções ou documentos extras. Acompanhe a Revista da Propriedade Industrial (RPI) para não perder prazos.</div>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div>
          <div className="guide-card">
            <h3>Fontes oficiais de consulta</h3>
            <div className="link-list">
              <a href="https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas/documentos-necessarios-para-pedido-de-ig" target="_blank" rel="noreferrer">
                Documentos necessários para o pedido de IG
              </a>
              <a href="https://manualdeig.inpi.gov.br/projects/manual-de-indicacoes-geograficas/wiki" target="_blank" rel="noreferrer">
                Manual de Indicações Geográficas
              </a>
              <a
                href="https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas/cadernos-de-especificacoes-tecnicas-das-indicacoes-geograficas"
                target="_blank"
                rel="noreferrer"
              >
                Cadernos de Especificações Técnicas
              </a>
              <a href="https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas/pedidos-de-indicacao-geografica-no-brasil" target="_blank" rel="noreferrer">
                IGs já registradas e pedidos em andamento
              </a>
              <a href="http://revistas.inpi.gov.br/rpi/" target="_blank" rel="noreferrer">
                Revista da Propriedade Industrial (RPI)
              </a>
            </div>
          </div>
          <div className="callout info">
            <strong>Validade</strong>Uma IG concedida não tem prazo de validade — não é preciso renovar.
          </div>
        </div>
      </div>
    </section>
  );
}
