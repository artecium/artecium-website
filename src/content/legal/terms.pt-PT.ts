import { LEGAL_ENTITY } from "@/config/legal-entity";
import type { LegalDocumentContent } from "@/content/legal/types";

export const termsPtPt: LegalDocumentContent = {
  title: "Termos e Condições",
  description:
    "Estes Termos e Condições regulam a utilização do website Artecium e a prestação de serviços digitais sob a marca Artecium.",
  lastUpdated: "Última atualização: 25 de setembro de 2026",
  disclaimer:
    "Este documento é um draft informativo para o website da Artecium e não constitui aconselhamento jurídico. Recomenda-se validação jurídica antes de utilização definitiva.",
  showToc: true,
  tocLabel: "Índice",
  sections: [
    {
      id: "identificacao",
      title: "1. Identificação do prestador",
      blocks: [
        {
          type: "p",
          text: `${LEGAL_ENTITY.brand} é uma marca comercial utilizada por ${LEGAL_ENTITY.providerName}, NIF ${LEGAL_ENTITY.nif}, com morada em ${LEGAL_ENTITY.address}, CIRS ${LEGAL_ENTITY.cirs}.`,
        },
        {
          type: "p",
          text: `Contacto: ${LEGAL_ENTITY.email}. A Artecium não constitui uma sociedade comercial autónoma para efeitos destes Termos; a prestação de serviços é realizada pelo prestador identificado acima.`,
        },
      ],
    },
    {
      id: "natureza-relacao",
      title: "2. Natureza da relação contratual",
      blocks: [
        {
          type: "p",
          text: "A relação entre o prestador e o cliente depende da qualificação jurídica da contratação e do contexto concreto de cada prestação.",
        },
        {
          type: "p",
          text: "Quando o cliente contrata no âmbito da sua atividade profissional, comercial ou empresarial, a relação será, em regra, de natureza business-to-business (B2B).",
        },
        {
          type: "p",
          text: "Quando o cliente actue como consumidor, nos termos legalmente aplicáveis, aplicam-se as normas imperativas de proteção do consumidor que sejam legalmente exigíveis, incluindo, quando relevantes, regras sobre contratação à distância, informação pré-contratual, direito de livre resolução e resolução alternativa de litígios.",
        },
        {
          type: "p",
          text: "As condições específicas da proposta, orçamento, contrato ou ordem de serviço aplicável podem complementar estes Termos. Em caso de conflito, as condições específicas acordadas prevalecem sobre estes Termos gerais, sem prejuízo das normas legais imperativas aplicáveis.",
        },
      ],
    },
    {
      id: "objeto",
      title: "3. Objeto dos serviços",
      blocks: [
        {
          type: "p",
          text: "A Artecium presta serviços de engenharia de software, produtos digitais, automação, inteligência artificial, SEO, marketing digital e serviços relacionados, conforme descrito no website e acordado com cada cliente.",
        },
      ],
    },
    {
      id: "websites",
      title: "4. Websites e aplicações",
      blocks: [
        {
          type: "p",
          text: "Podemos conceber, desenvolver, implementar e manter websites, aplicações web, aplicações móveis e plataformas digitais. O âmbito, tecnologias, prazos e entregáveis são definidos na proposta ou contrato aplicável.",
        },
      ],
    },
    {
      id: "desenvolvimento",
      title: "5. Desenvolvimento e implementação",
      blocks: [
        {
          type: "p",
          text: "Os serviços de desenvolvimento incluem, consoante acordado, análise, design, implementação, testes, documentação e formação. Alterações de âmbito podem implicar revisão de prazos e condições comerciais.",
        },
      ],
    },
    {
      id: "seo-marketing",
      title: "6. SEO e marketing digital",
      blocks: [
        {
          type: "p",
          text: "Serviços de SEO, analytics, campanhas digitais e presença online são prestados conforme acordado. Resultados podem variar consoante mercado, concorrência, plataformas de terceiros e factores externos fora do nosso controlo directo.",
        },
      ],
    },
    {
      id: "ia-automacao",
      title: "7. Inteligência artificial e automação",
      blocks: [
        {
          type: "p",
          text: "Soluções de IA e automação podem integrar serviços de terceiros (APIs, modelos, plataformas cloud). O cliente é responsável por utilizar estas soluções em conformidade com a legislação aplicável e com os termos dos fornecedores envolvidos.",
        },
        {
          type: "p",
          text: "Sistemas de IA podem produzir resultados incorrectos, incompletos ou inadequados. Quando aplicável, o cliente deve validar outputs antes de os utilizar em decisões, conteúdos, comunicações ou processos relevantes.",
        },
        {
          type: "p",
          text: "Ferramentas, modelos e plataformas de terceiros podem ter condições, limitações, políticas de utilização e requisitos de conformidade próprios. O âmbito concreto da utilização de IA em cada projecto será definido na proposta ou contrato quando relevante.",
        },
      ],
    },
    {
      id: "orcamentos",
      title: "8. Orçamentos e propostas",
      blocks: [
        {
          type: "p",
          text: "Orçamentos e propostas comerciais têm validade indicada em cada documento. Salvo acordo expresso, não vinculam até aceitação formal pelo cliente.",
        },
        {
          type: "p",
          text: "As condições específicas constantes da proposta, orçamento, contrato ou ordem de serviço aplicável prevalecem sobre estes Termos em caso de conflito, sem prejuízo das normas legais imperativas.",
        },
      ],
    },
    {
      id: "pagamentos",
      title: "9. Pagamentos, cancelamentos e reembolsos",
      blocks: [
        {
          type: "p",
          text: "Os pagamentos são processados conforme condições acordadas. Condições de pagamento, fases, valores, subscrições e eventuais pagamentos recorrentes são definidos na proposta ou contrato aplicável.",
        },
        {
          type: "p",
          text: "Pagamentos online podem ser processados através da Stripe. O cliente deve fornecer informação de faturação exacta.",
        },
        {
          type: "p",
          text: "Eventuais cancelamentos, suspensões por falta de pagamento, penalizações ou reembolsos dependem do contrato aplicável e da legislação legalmente exigível. Os direitos dos consumidores que não possam ser legalmente excluídos permanecem salvaguardados.",
        },
      ],
    },
    {
      id: "livre-resolucao",
      title: "10. Direito de livre resolução",
      blocks: [
        {
          type: "p",
          text: "Quando o cliente seja consumidor e o contrato esteja abrangido pelo regime legal aplicável aos contratos celebrados à distância ou fora do estabelecimento comercial, poderá existir um direito legal de livre resolução, nos termos e prazos previstos na legislação aplicável.",
        },
        {
          type: "p",
          text: "O exercício desse direito, bem como eventuais excepções, dependem da natureza do contrato, do tipo de prestação e das circunstâncias concretas de cada contratação.",
        },
        {
          type: "p",
          text: "Quando a prestação de serviços comece antes do termo do período legal de livre resolução a pedido do consumidor, serão observados os requisitos legais aplicáveis relativamente ao início da prestação, informação prévia e eventual pagamento proporcional, quando exigível.",
        },
        {
          type: "p",
          text: "Algumas situações podem estar sujeitas a excepções legais ao direito de livre resolução. Os direitos legalmente imperativos dos consumidores prevalecem sobre qualquer disposição destes Termos que lhes seja contrária.",
        },
        {
          type: "p",
          text: "Quando legalmente aplicável, serão fornecidas ao consumidor as informações pré-contratuais legalmente exigidas e o formulário de livre resolução aplicável.",
        },
      ],
    },
    {
      id: "prazos",
      title: "11. Prazos",
      blocks: [
        {
          type: "p",
          text: "Os prazos indicados são estimativas baseadas no âmbito acordado e na colaboração do cliente. Atrasos causados por falta de feedback, materiais incompletos, dependências de terceiros ou alterações de âmbito podem afectar calendários.",
        },
      ],
    },
    {
      id: "obrigacoes-cliente",
      title: "12. Obrigações do cliente",
      blocks: [
        {
          type: "ul",
          items: [
            "Fornecer informação completa, exacta e atempada.",
            "Designar interlocutores com capacidade de decisão quando necessário.",
            "Validar entregáveis dentro dos prazos acordados.",
            "Garantir direitos sobre materiais fornecidos.",
            "Cumprir obrigações de pagamento.",
          ],
        },
      ],
    },
    {
      id: "conteudos-cliente",
      title: "13. Conteúdos e materiais fornecidos pelo cliente",
      blocks: [
        {
          type: "p",
          text: "O cliente garante que possui os direitos necessários sobre textos, imagens, marcas, dados e outros materiais fornecidos, e que estes não infringem direitos de terceiros nem legislação aplicável.",
        },
      ],
    },
    {
      id: "pi",
      title: "14. Propriedade intelectual",
      blocks: [
        {
          type: "p",
          text: "Para efeitos destes Termos, distinguem-se, consoante aplicável:",
        },
        {
          type: "ul",
          items: [
            "Entregáveis desenvolvidos especificamente para o cliente no âmbito do projecto acordado.",
            "Componentes, bibliotecas, templates, código, metodologias, frameworks e know-how pré-existentes ou reutilizáveis da Artecium.",
            "Software open-source integrado nos projectos.",
            "Serviços SaaS, APIs, plataformas e ferramentas de terceiros.",
          ],
        },
        {
          type: "p",
          text: "A titularidade ou licença dos entregáveis específicos desenvolvidos para o cliente será definida na proposta ou contrato aplicável. O pagamento integral das quantias devidas pode constituir condição para transferência ou licença definitiva, quando isso tiver sido expressamente acordado.",
        },
        {
          type: "p",
          text: "Componentes pré-existentes, reutilizáveis ou genéricos da Artecium permanecem propriedade do prestador, podendo ser concedida ao cliente a licença necessária para utilização dos entregáveis finais, nos termos definidos na proposta ou contrato, salvo acordo escrito em contrário.",
        },
        {
          type: "p",
          text: "Software open-source continua sujeito às licenças open-source aplicáveis. Serviços SaaS, APIs e plataformas de terceiros continuam sujeitos às condições, licenças e políticas dos respetivos fornecedores.",
        },
        {
          type: "p",
          text: "A marca Artecium, identidade visual, metodologias proprietárias e know-how pré-existente não são transferidos ao cliente, salvo licenciamento expresso.",
        },
      ],
    },
    {
      id: "licencas-terceiros",
      title: "15. Licenças de software e serviços de terceiros",
      blocks: [
        {
          type: "p",
          text: "Projectos podem depender de software open-source, SaaS, APIs e serviços cloud sujeitos a licenças próprias. O cliente é responsável por custos recorrentes de terceiros acordados (alojamento, domínios, ferramentas, APIs), salvo indicação contrária.",
        },
      ],
    },
    {
      id: "dominios",
      title: "16. Domínios e alojamento",
      blocks: [
        {
          type: "p",
          text: "Registo de domínios, DNS, alojamento, certificados SSL e infraestrutura podem ser geridos pela Artecium ou pelo cliente, conforme acordado. A titularidade de domínios e contas deve ser definida contratualmente.",
        },
      ],
    },
    {
      id: "manutencao",
      title: "17. Manutenção e suporte",
      blocks: [
        {
          type: "p",
          text: "Serviços de manutenção, suporte e evolução contínua, incluindo SLAs ou tempos de resposta, aplicam-se apenas quando expressamente contratados. Fora desse âmbito, o suporte é prestado em base comercial razoável.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "18. Alterações e pedidos adicionais",
      blocks: [
        {
          type: "p",
          text: "Pedidos adicionais, alterações de âmbito ou novas funcionalidades podem requerer orçamento e acordo separados. Trabalho extra não incluído no âmbito original pode ser facturado conforme condições acordadas.",
        },
      ],
    },
    {
      id: "responsabilidade",
      title: "19. Limitações de responsabilidade",
      blocks: [
        {
          type: "p",
          text: "Qualquer limitação ou exclusão de responsabilidade prevista nestes Termos aplica-se apenas na medida permitida pela legislação aplicável e não prejudica direitos ou responsabilidades que não possam ser legalmente excluídos ou limitados.",
        },
        {
          type: "p",
          text: "Na medida legalmente permitida, a responsabilidade do prestador por danos indirectos, lucros cessantes, perda de dados ou interrupção de negócio pode ser limitada conforme acordado contratualmente.",
        },
        {
          type: "p",
          text: "Não garantimos resultados comerciais específicos, posicionamento SEO permanente, disponibilidade ininterrupta de serviços de terceiros ou ausência total de vulnerabilidades técnicas. Sistemas digitais podem estar sujeitos a riscos técnicos, alterações de plataformas, indisponibilidades ou limitações de serviços externos.",
        },
      ],
    },
    {
      id: "terceiros",
      title: "20. Serviços de terceiros",
      blocks: [
        {
          type: "p",
          text: "Integrações com Stripe, Supabase, fornecedores de email, analytics, plataformas cloud, redes sociais e outras ferramentas estão sujeitas aos termos e disponibilidade desses fornecedores. Não somos responsáveis por alterações, interrupções ou políticas de terceiros, na medida legalmente permitida.",
        },
      ],
    },
    {
      id: "suspensao",
      title: "21. Suspensão e terminação",
      blocks: [
        {
          type: "p",
          text: "Podemos suspender ou terminar serviços em caso de incumprimento grave, falta de pagamento, uso abusivo ou exigência legal, com aviso quando razoavelmente possível. Condições específicas de denúncia e efeitos pós-terminação constam do contrato aplicável.",
        },
      ],
    },
    {
      id: "confidencialidade",
      title: "22. Confidencialidade",
      blocks: [
        {
          type: "p",
          text: "Cada parte compromete-se a proteger informação confidencial da outra, excepto quando divulgação for exigida por lei ou necessária à execução do serviço (incluindo subcontratantes sujeitos a deveres de confidencialidade).",
        },
      ],
    },
    {
      id: "protecao-dados",
      title: "23. Proteção de dados",
      blocks: [
        {
          type: "p",
          text: "O tratamento de dados pessoais rege-se pela Política de Privacidade. Quando aplicável, acordos de tratamento de dados ou cláusulas específicas serão definidos contratualmente consoante o papel de cada parte.",
        },
      ],
    },
    {
      id: "lei",
      title: "24. Lei aplicável",
      blocks: [
        {
          type: "p",
          text: "Estes Termos são regidos pela lei portuguesa, sem prejuízo de normas imperativas aplicáveis a consumidores ou a relações transfronteiriças, quando relevantes.",
        },
      ],
    },
    {
      id: "litigios",
      title: "25. Resolução de litígios",
      blocks: [
        {
          type: "p",
          text: "Em caso de litígio, as partes procurarão primeiro uma solução amigável.",
        },
        {
          type: "p",
          text: "Quando legalmente aplicável, o consumidor pode recorrer a mecanismos de resolução alternativa de litígios (RAL) ou aos tribunais competentes conforme a sua qualificação jurídica.",
        },
        {
          type: "p",
          text: "Quando o cliente seja consumidor, serão respeitadas as obrigações legais de informação relativas à resolução alternativa de litígios que sejam aplicáveis à relação concreta. A entidade RAL competente depende da actividade e das circunstâncias legalmente aplicáveis.",
        },
        {
          type: "p",
          text: "A competência territorial e os mecanismos aplicáveis dependem da natureza da relação (B2B ou B2C) e das condições contratuais específicas.",
        },
      ],
    },
    {
      id: "contacto",
      title: "26. Contacto",
      blocks: [
        {
          type: "p",
          text: `${LEGAL_ENTITY.brand} — marca comercial de ${LEGAL_ENTITY.providerName}`,
        },
        {
          type: "p",
          text: `NIF: ${LEGAL_ENTITY.nif} · ${LEGAL_ENTITY.address} · ${LEGAL_ENTITY.email}`,
        },
      ],
    },
  ],
};
