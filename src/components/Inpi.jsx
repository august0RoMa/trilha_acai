export default function Inpi() {
  return (
    <section className="view-enter">
      <div className="eyebrow">Central de ajuda</div>
      <h1 className="page-title">Acompanhar processos no INPI</h1>
      <p className="page-sub">
        A ferramenta "Meus Pedidos" do INPI avisa por e‑mail sempre que houver movimentação no processo — inclusive
        de marcas, patentes e outros registros.
      </p>

      <div className="guide-grid">
        <div>
          <div className="guide-card">
            <h3>Como cadastrar um processo para acompanhar</h3>
            <ol className="steps-list">
              <li>
                <div>
                  <div className="stitle">Fazer login no portal do INPI</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="stitle">Acessar a ferramenta Busca Web</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="stitle">Escolher o tipo de processo</div>
                  <div className="sdesc">Indicação geográfica, marca, patente, entre outros.</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="stitle">Informar o número e pesquisar</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="stitle">Confirmar em "Meus Pedidos"</div>
                </div>
              </li>
            </ol>
          </div>
          <div className="guide-card">
            <h3>Acompanhar vários processos de uma vez</h3>
            <p>
              É possível pesquisar pelo CPF ou CNPJ do titular — todos os processos vinculados aparecem juntos e
              podem ser adicionados de uma só vez, o que ajuda cooperativas com vários pedidos em andamento.
            </p>
          </div>
        </div>
        <div>
          <div className="guide-card">
            <h3>Funcionalidades</h3>
            <ul>
              <li>
                <b>Meus Pedidos</b> — lista de tudo que você está acompanhando.
              </li>
              <li>
                <b>Meus Pedidos da Semana</b> — o que foi publicado na última RPI.
              </li>
            </ul>
          </div>
          <div className="callout info">
            <strong>Bom saber</strong>Você pode acompanhar um processo mesmo sem ser o titular dele. Quem já usava o
            antigo PUSH‑INPI foi migrado automaticamente para o Meus Pedidos.
          </div>
        </div>
      </div>
    </section>
  );
}
