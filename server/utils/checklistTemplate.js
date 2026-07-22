// Template de etapas + checklist documental usado ao criar um processo novo.
// Espelha src/data.js do front-end (mesma numeração de etapas e categorias),
// para que o checklist gerado pelo back-end seja idêntico ao que o produto
// já promete nas telas.

export function provasNomePara(tipo) {
  if (tipo === 'IP') return 'Provas de Indicação de Procedência';
  if (tipo === 'DO') return 'Provas de Denominação de Origem';
  return 'Provas (a definir)';
}

export function etapasTemplate(tipo) {
  const provasNome = provasNomePara(tipo);
  return [
    { ordem: 1, nome: 'Definição do tipo de IG', obrigatoria: true },
    { ordem: 2, nome: 'Entidade requerente', obrigatoria: true },
    { ordem: 3, nome: 'Atos constitutivos e atas', obrigatoria: true },
    { ordem: 4, nome: 'Caderno de Especificações Técnicas do Açaí', obrigatoria: true },
    { ordem: 5, nome: 'Produtores e território', obrigatoria: true },
    { ordem: 6, nome: provasNome, obrigatoria: true },
    { ordem: 7, nome: 'Delimitação geográfica da várzea', obrigatoria: true },
    { ordem: 8, nome: 'Representação gráfica', obrigatoria: false },
    { ordem: 9, nome: 'Procuração', obrigatoria: false },
    { ordem: 10, nome: 'GRU e comprovante', obrigatoria: true },
    { ordem: 11, nome: 'Conferência pré-protocolo', obrigatoria: true },
  ];
}

export function documentosTemplate(tipo) {
  const provasNome = provasNomePara(tipo);
  return [
    { etapaOrdem: 1, categoria: 'Jurídico da Entidade', nome: 'Definição formal: IP, DO ou a definir', req: 'obrigatorio' },
    { etapaOrdem: 2, categoria: 'Jurídico da Entidade', nome: 'Estatuto social da entidade registrado', req: 'obrigatorio' },
    { etapaOrdem: 2, categoria: 'Jurídico da Entidade', nome: 'CNPJ da entidade', req: 'obrigatorio' },
    { etapaOrdem: 3, categoria: 'Jurídico da Entidade', nome: 'Ata de aprovação do estatuto', req: 'obrigatorio' },
    { etapaOrdem: 3, categoria: 'Jurídico da Entidade', nome: 'Ata de posse da diretoria atual', req: 'obrigatorio' },
    { etapaOrdem: 3, categoria: 'Jurídico da Entidade', nome: 'RG e CPF dos representantes legais', req: 'obrigatorio' },
    { etapaOrdem: 3, categoria: 'Jurídico da Entidade', nome: 'Procuração do representante', req: 'opcional' },
    { etapaOrdem: 4, categoria: 'Caderno Técnico', nome: 'Caderno de Especificações Técnicas do Açaí', req: 'obrigatorio' },
    { etapaOrdem: 4, categoria: 'Caderno Técnico', nome: 'Ata de aprovação do Caderno Técnico', req: 'obrigatorio' },
    { etapaOrdem: 4, categoria: 'Caderno Técnico', nome: 'Lista de presença da assembleia de extrativistas', req: 'obrigatorio' },
    { etapaOrdem: 4, categoria: 'Caderno Técnico', nome: 'Regras de manejo sustentável do açaizal e sanções', req: 'recomendado' },
    { etapaOrdem: 5, categoria: 'Produtores e Território', nome: 'Declaração dos extrativistas estabelecidos na área', req: 'obrigatorio' },
    { etapaOrdem: 5, categoria: 'Produtores e Território', nome: 'Lista de produtores com CPF/CNPJ', req: 'obrigatorio' },
    { etapaOrdem: 5, categoria: 'Produtores e Território', nome: 'Comprovação de vínculo com o extrativismo do açaí', req: 'recomendado' },
    { etapaOrdem: 6, categoria: provasNome, nome: 'Provas de reputação ou estudos técnicos', req: 'obrigatorio' },
    { etapaOrdem: 6, categoria: provasNome, nome: 'Laudo ou levantamento técnico do produto', req: 'obrigatorio' },
    { etapaOrdem: 6, categoria: provasNome, nome: 'Comprovação do nexo com o território', req: 'obrigatorio' },
    { etapaOrdem: 6, categoria: provasNome, nome: 'Material complementar de apoio', req: 'recomendado' },
    { etapaOrdem: 7, categoria: 'Delimitação Geográfica', nome: 'Instrumento oficial de delimitação da área', req: 'obrigatorio' },
    { etapaOrdem: 7, categoria: 'Delimitação Geográfica', nome: 'Mapa da área delimitada', req: 'obrigatorio' },
    { etapaOrdem: 7, categoria: 'Delimitação Geográfica', nome: 'Justificativa técnica da área', req: 'recomendado' },
    { etapaOrdem: 8, categoria: 'Delimitação Geográfica', nome: 'Representação gráfica / etiqueta do selo (JPG)', req: 'opcional' },
    { etapaOrdem: 10, categoria: 'GRU e INPI', nome: 'Comprovante de pagamento da GRU', req: 'obrigatorio' },
    { etapaOrdem: 10, categoria: 'GRU e INPI', nome: 'Guia GRU preenchida', req: 'obrigatorio' },
  ];
}
