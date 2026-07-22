export default function Gru() {
  return (
    <section className="view-enter">
      <div className="eyebrow">Central de ajuda</div>
      <h1 className="page-title">Pagamento da GRU</h1>
      <p className="page-sub">
        A guia é emitida no{' '}
        <a href="https://meu.inpi.gov.br/pag/" target="_blank" rel="noreferrer" style={{ color: 'var(--acai)' }}>
          Sistema de Emissão de GRU do INPI ↗
        </a>
        . Veja as regras para não perder o valor pago.
      </p>

      <div className="guide-grid">
        <div>
          <div className="guide-card">
            <h3>Regras para não perder o dinheiro</h3>
            <ul>
              <li>
                <b>Pague antes de enviar o pedido</b> — não deixe o boleto agendado para depois.
              </li>
              <li>
                <b>Espere 1 hora</b> depois de gerar o boleto para conseguir pagar, e evite gerar depois das 22h.
              </li>
              <li>
                <b>Formas aceitas:</b> banco, aplicativo, PIX ou cartão — sempre pelo código de barras do boleto.
              </li>
            </ul>
            <div className="callout warn">
              <strong>Atenção a golpes</strong>O INPI nunca envia boleto por e‑mail, carta ou WhatsApp, e nunca recebe
              por transferência direta (TED, DOC ou PIX). O boleto é sempre gerado por você, no site.
            </div>
          </div>

          <div className="guide-card">
            <h3>Desconto de 50% — quem tem direito</h3>
            <div className="discount-row">
              <span className="discount-chip">Pessoa física</span>
              <span className="discount-chip">MEI / ME / pequeno porte</span>
              <span className="discount-chip">ONGs, escolas e órgãos públicos</span>
            </div>
            <p>
              O desconto é aplicado automaticamente, desde que o cadastro no site do INPI esteja com o tipo de pessoa
              correto. Para corrigir: entre em <b>Custos e Pagamento → Sistema de Emissão de GRU → "Alteração de
              cadastro e emissão de recibo"</b>, ajuste o tipo de pessoa e salve.
            </p>
          </div>

          <div className="guide-card">
            <h3>Restituição de retribuição</h3>
            <p>
              Você pode pedir o dinheiro de volta se pagou e desistiu do pedido, pagou em duplicidade, pagou valor
              maior que o necessário, ou usou o código errado. O prazo é de até 5 anos após o pagamento, e o pedido
              é gratuito.
            </p>
            <p style={{ marginTop: 10 }}>
              <b>Documentos necessários:</b> comprovante de pagamento e dados da conta bancária do titular do boleto
              (ou procuração, se for de terceiros; contrato social, se for sócio de empresa).
            </p>
          </div>
        </div>

        <div>
          <div className="guide-card">
            <h3>Segunda via e acompanhamento</h3>
            <p>
              Perdeu o boleto pago? Acesse <b>Minhas GRUs</b> no site do INPI para consultar todos os seus boletos.
            </p>
            <p>
              Se o INPI pedir mais documentos por e‑mail, você tem <b>30 dias</b> para responder. O resultado sai na
              RPI, e dúvidas financeiras podem ser enviadas pelo Fale Conosco (resposta em até 7 dias).
            </p>
          </div>
          <div className="callout gold">
            <strong>Dica</strong>Guarde o número da GRU logo após o pagamento — ele será pedido no formulário do e‑IG.
          </div>
        </div>
      </div>
    </section>
  );
}
