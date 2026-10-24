import { LEGAL_ENTITY } from "@/config/legal-entity";
import type { LegalDocumentContent } from "@/content/legal/types";

export const privacyPtPt: LegalDocumentContent = {
  title: "Política de Privacidade",
  description:
    "Esta Política de Privacidade descreve como a Artecium trata dados pessoais no website, nos formulários públicos e na Área de Cliente.",
  lastUpdated: "Última atualização: 25 de setembro de 2026",
  disclaimer:
    "Este documento é um draft informativo para o website da Artecium e não constitui aconselhamento jurídico. Recomenda-se validação jurídica antes de utilização definitiva.",
  showToc: true,
  tocLabel: "Índice",
  sections: [
    {
      id: "responsavel",
      title: "1. Responsável pelo tratamento",
      blocks: [
        {
          type: "p",
          text: `A marca ${LEGAL_ENTITY.brand} é utilizada por ${LEGAL_ENTITY.providerName}, NIF ${LEGAL_ENTITY.nif}, com morada em ${LEGAL_ENTITY.address}, CIRS ${LEGAL_ENTITY.cirs}, para efeitos de prestação de serviços digitais.`,
        },
        {
          type: "p",
          text: `Para questões relacionadas com privacidade e proteção de dados, pode contactar-nos através de ${LEGAL_ENTITY.email}.`,
        },
      ],
    },
    {
      id: "ambito",
      title: "2. Âmbito",
      blocks: [
        {
          type: "p",
          text: "Esta política aplica-se ao website artecium.com, ao formulário público de contacto (Project Discovery Wizard), à Área de Cliente, à área administrativa interna e aos serviços associados descritos neste website.",
        },
        {
          type: "p",
          text: "A aplicação concreta de certas regras (incluindo contratação à distância, direito de livre resolução ou reclamação perante entidades de resolução alternativa de litígios) pode depender do tipo de cliente, da natureza do contrato e das condições acordadas caso a caso.",
        },
      ],
    },
    {
      id: "dados-recolhidos",
      title: "3. Categorias de dados recolhidos",
      blocks: [
        {
          type: "p",
          text: "Conforme a interação do utilizador com os nossos serviços, podemos tratar as seguintes categorias de dados:",
        },
        {
          type: "ul",
          items: [
            "Dados de identificação e contacto (nome, email, telefone, empresa).",
            "Dados de conta e autenticação (credenciais de acesso, identificador de utilizador, preferências de idioma e moeda).",
            "Dados fornecidos através do Discovery Wizard (tipo de projeto, orçamento, prazos, origem, descrição e método de contacto preferido).",
            "Dados de clientes e projetos na Área de Cliente (informação contratual, comunicações, documentos, tarefas, reuniões e feedback).",
            "Dados financeiros (faturas, pagamentos, referências de transação; não armazenamos dados completos de cartão bancário).",
            "Dados técnicos e de utilização (medição de tráfego e analytics, quando consentidos).",
            "Dados de suporte (tickets, mensagens e anexos).",
          ],
        },
      ],
    },
    {
      id: "discovery",
      title: "4. Discovery Wizard",
      blocks: [
        {
          type: "p",
          text: "Quando utiliza o formulário público de descoberta de projeto, recolhemos os dados que introduz voluntariamente. Se escolher contacto por email, esses dados são enviados por email transacional para a nossa caixa interna através do fornecedor de email configurado (Resend ou, alternativamente, SendGrid).",
        },
        {
          type: "p",
          text: "Nesta fase, os dados submetidos pelo Discovery Wizard não são armazenados automaticamente na base de dados da plataforma. O envio por WhatsApp encaminha o utilizador para a aplicação WhatsApp (Meta), onde a conversa decorre fora deste website.",
        },
        {
          type: "p",
          text: "Antes do envio, o utilizador deve confirmar que leu e aceita esta Política de Privacidade e autoriza o tratamento dos dados para responder ao pedido.",
        },
      ],
    },
    {
      id: "client-area",
      title: "5. Área de Cliente",
      blocks: [
        {
          type: "p",
          text: "A Área de Cliente utiliza autenticação Supabase. Podemos tratar dados de perfil, empresas associadas, projetos, serviços, documentos, faturas, pagamentos, notificações, reuniões, analytics agregados, dados SEO agregados, relatórios, suporte e feedback, conforme funcionalidades disponíveis para cada cliente.",
        },
        {
          type: "p",
          text: "O acesso é restrito a utilizadores autenticados e sujeito a controlos de acesso definidos na plataforma.",
        },
      ],
    },
    {
      id: "finalidades",
      title: "6. Finalidades do tratamento",
      blocks: [
        {
          type: "ul",
          items: [
            "Prestar, gerir e melhorar os serviços contratados.",
            "Responder a pedidos de contacto e oportunidades comerciais.",
            "Gerir contas de cliente, projetos, faturação e pagamentos.",
            "Comunicar com clientes sobre serviços, suporte e entregáveis.",
            "Garantir segurança, autenticação e funcionamento técnico do website e da plataforma.",
            "Medir utilização do website e melhorar a experiência, quando o utilizador consente analytics.",
            "Cumprir obrigações legais, fiscais e contabilísticas aplicáveis.",
          ],
        },
      ],
    },
    {
      id: "bases-legais",
      title: "7. Bases legais",
      blocks: [
        {
          type: "p",
          text: "O tratamento de dados pessoais pode assentar, consoante o contexto, em execução de contrato ou diligências pré-contratuais, cumprimento de obrigações legais, interesse legítimo ou consentimento do titular.",
        },
        {
          type: "p",
          text: "A base legal aplicável a cada operação concreta depende da natureza da interação (por exemplo, pedido de contacto, relação contratual, cookies opcionais ou comunicações de suporte). Quando a base legal aplicável não puder ser determinada de forma segura apenas com base na informação disponível neste website, a análise deverá ser complementada no contexto do contrato ou pedido específico.",
        },
      ],
    },
    {
      id: "subcontratantes",
      title: "8. Prestadores e subcontratantes tecnológicos",
      blocks: [
        {
          type: "p",
          text: "Para operar o website e a plataforma, recorremos a prestadores de serviços que podem tratar dados em nosso nome ou como responsáveis independentes, incluindo:",
        },
        {
          type: "ul",
          items: [
            "Supabase — autenticação, base de dados e armazenamento de ficheiros.",
            "Stripe — processamento de pagamentos e checkout.",
            "Resend — envio de emails transacionais (alternativa configurável: SendGrid).",
            "Vercel — alojamento e infraestrutura do website, quando aplicável.",
            "Google Analytics — medição de tráfego, apenas após consentimento de analytics.",
            "Microsoft Clarity — analytics comportamental, apenas após consentimento de analytics.",
            "WhatsApp / Meta — quando o utilizador escolhe contacto por WhatsApp.",
          ],
        },
        {
          type: "p",
          text: "A lista reflete integrações identificadas no código do website. Outros prestadores podem ser utilizados no âmbito de projetos específicos de clientes, conforme acordado contratualmente.",
        },
      ],
    },
    {
      id: "transferencias",
      title: "9. Transferências internacionais",
      blocks: [
        {
          type: "p",
          text: "Alguns dos prestadores indicados podem tratar dados fora do Espaço Económico Europeu. Quando tal ocorrer, serão aplicadas as garantias legalmente exigíveis, tais como cláusulas contratuais-tipo ou outros mecanismos previstos na legislação aplicável.",
        },
        {
          type: "p",
          text: "A localização exata do tratamento por cada prestador depende da configuração da conta e da região do serviço contratado, não sendo sempre determinável apenas através deste website.",
        },
      ],
    },
    {
      id: "cookies",
      title: "10. Cookies e tecnologias semelhantes",
      blocks: [
        {
          type: "p",
          text: "Utilizamos cookies e tecnologias semelhantes para funcionamento, preferências e analytics. Os cookies opcionais de analytics (Google Analytics e Microsoft Clarity) só são carregados após o utilizador conceder consentimento através do sistema de gestão de cookies do website.",
        },
        {
          type: "p",
          text: "Para informação detalhada, consulte a nossa Política de Cookies.",
        },
      ],
    },
    {
      id: "direitos",
      title: "11. Direitos dos titulares",
      blocks: [
        {
          type: "p",
          text: "Nos termos legalmente aplicáveis, o titular dos dados pode exercer direitos de acesso, retificação, apagamento, limitação, oposição, portabilidade e retirada de consentimento, quando aplicável.",
        },
        {
          type: "p",
          text: "Também pode apresentar reclamação junto da autoridade de controlo competente, nomeadamente a Comissão Nacional de Proteção de Dados (CNPD), quando entenda que o tratamento viola a legislação aplicável.",
        },
      ],
    },
    {
      id: "exercicio",
      title: "12. Como exercer os seus direitos",
      blocks: [
        {
          type: "p",
          text: `Para exercer os seus direitos ou esclarecer dúvidas sobre privacidade, contacte-nos através de ${LEGAL_ENTITY.email}, indicando a natureza do pedido e informação que permita identificar a relação ou interação relevante.`,
        },
        {
          type: "p",
          text: "Responderemos dentro dos prazos legalmente aplicáveis, podendo solicitar informação adicional para confirmar a identidade do requerente quando necessário.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "13. Segurança",
      blocks: [
        {
          type: "p",
          text: "Implementamos medidas técnicas e organizativas adequadas para proteger os dados pessoais, incluindo autenticação, controlos de acesso, políticas de segurança na base de dados e comunicações encriptadas quando aplicável.",
        },
        {
          type: "p",
          text: "Nenhum sistema é totalmente imune a riscos. Em caso de incidente com impacto relevante para os titulares, adotaremos as medidas previstas na legislação aplicável.",
        },
      ],
    },
    {
      id: "conservacao",
      title: "14. Conservação dos dados",
      blocks: [
        {
          type: "p",
          text: "Conservamos os dados pessoais apenas pelo período necessário para cumprir as finalidades para que foram recolhidos, incluindo obrigações legais, fiscais, contabilísticas, contratuais e de resolução de litígios.",
        },
        {
          type: "p",
          text: "Os prazos concretos podem variar consoante a categoria de dados, a relação comercial e os requisitos legais aplicáveis. Quando deixarem de ser necessários, os dados serão eliminados ou anonimizados, salvo imposição legal de conservação.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "15. Alterações a esta política",
      blocks: [
        {
          type: "p",
          text: "Podemos atualizar esta Política de Privacidade para refletir alterações legais, técnicas ou operacionais. A versão publicada nesta página indica a data da última atualização.",
        },
      ],
    },
    {
      id: "contacto",
      title: "16. Contacto",
      blocks: [
        {
          type: "p",
          text: `${LEGAL_ENTITY.brand} — marca comercial de ${LEGAL_ENTITY.providerName}`,
        },
        {
          type: "p",
          text: `NIF: ${LEGAL_ENTITY.nif}`,
        },
        {
          type: "p",
          text: `Morada: ${LEGAL_ENTITY.address}`,
        },
        {
          type: "p",
          text: `Email: ${LEGAL_ENTITY.email}`,
        },
      ],
    },
  ],
};
