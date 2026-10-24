import { COOKIE_CONSENT_MAX_AGE, COOKIE_CONSENT_NAME } from "@/lib/cookies/consent";
import { LEGAL_ENTITY } from "@/config/legal-entity";
import type { LegalDocumentContent } from "@/content/legal/types";

const consentMaxAgeDays = Math.round(COOKIE_CONSENT_MAX_AGE / (60 * 60 * 24));

export const cookiesPtPt: LegalDocumentContent = {
  title: "Política de Cookies",
  description:
    "Esta Política de Cookies explica como o website Artecium utiliza cookies e tecnologias semelhantes.",
  lastUpdated: "Última atualização: 25 de setembro de 2026",
  disclaimer:
    "Este documento é um draft informativo para o website da Artecium e não constitui aconselhamento jurídico.",
  showToc: true,
  tocLabel: "Índice",
  sections: [
    {
      id: "introducao",
      title: "1. O que são cookies",
      blocks: [
        {
          type: "p",
          text: "Cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando visita um website. Podem ser utilizados para garantir o funcionamento do site, recordar preferências ou medir utilização.",
        },
      ],
    },
    {
      id: "consentimento",
      title: "2. Gestão de consentimento",
      blocks: [
        {
          type: "p",
          text: "Utilizamos um sistema de gestão de cookies que lhe permite aceitar todos os cookies opcionais, recusar os opcionais ou personalizar categorias. Os cookies opcionais de analytics só são carregados após consentimento explícito para a categoria Analytics.",
        },
        {
          type: "p",
          text: `A sua escolha é guardada num cookie first-party (${COOKIE_CONSENT_NAME}) durante ${consentMaxAgeDays} dias, sem incluir dados pessoais identificativos.`,
        },
      ],
    },
    {
      id: "categorias",
      title: "3. Categorias de cookies",
      blocks: [
        {
          type: "table",
          headers: ["Categoria", "Finalidade", "Obrigatório?"],
          rows: [
            ["Necessários", "Funcionamento, autenticação e segurança", "Sim"],
            ["Preferências", "Idioma e definições de experiência", "Opcional"],
            ["Analytics", "Medição de utilização (GA, Clarity)", "Opcional"],
            ["Marketing", "Publicidade e campanhas", "Opcional (atualmente sem cookies de marketing implementados)"],
          ],
        },
      ],
    },
    {
      id: "necessarios",
      title: "4. Cookies necessários",
      blocks: [
        {
          type: "p",
          text: "Incluem cookies de autenticação geridos pelo Supabase para login, sessão, Área de Cliente e área administrativa. Os nomes exactos, duração e conteúdo são geridos pela biblioteca Supabase SSR e não são determináveis apenas através do código público deste website.",
        },
        {
          type: "p",
          text: "Estes cookies são necessários ao funcionamento das áreas autenticadas e não devem ser bloqueados se pretender utilizar essas funcionalidades.",
        },
      ],
    },
    {
      id: "preferencias",
      title: "5. Cookies de preferências",
      blocks: [
        {
          type: "table",
          headers: ["Nome", "Fornecedor", "Finalidade", "Duração", "Tipo"],
          rows: [
            [
              "artecium_locale",
              "Artecium (first-party)",
              "Guardar preferência de idioma (pt-PT / en)",
              `${consentMaxAgeDays} dias`,
              "First-party",
            ],
          ],
        },
        {
          type: "p",
          text: "A categoria Preferências no sistema de consentimento inclui cookies opcionais deste tipo. O cookie de idioma é utilizado independentemente para manter a experiência multilingue do website.",
        },
      ],
    },
    {
      id: "consent-cookie",
      title: "6. Cookie de consentimento",
      blocks: [
        {
          type: "table",
          headers: ["Nome", "Fornecedor", "Finalidade", "Duração", "Tipo"],
          rows: [
            [
              COOKIE_CONSENT_NAME,
              "Artecium (first-party)",
              "Registar escolhas de consentimento (necessary, preferences, analytics, marketing)",
              `${consentMaxAgeDays} dias`,
              "First-party",
            ],
          ],
        },
      ],
    },
    {
      id: "analytics",
      title: "7. Cookies de analytics",
      blocks: [
        {
          type: "p",
          text: "Quando aceita a categoria Analytics, o website pode carregar Google Analytics e Microsoft Clarity. Estes serviços podem definir cookies no seu dispositivo.",
        },
        {
          type: "ul",
          items: [
            "Google Analytics — medição de tráfego e eventos.",
            "Microsoft Clarity — gravações de sessão, heatmaps e eventos.",
          ],
        },
        {
          type: "p",
          text: "Os nomes exactos, duração e conteúdo dos cookies definidos por Google Analytics e Microsoft Clarity não são determináveis apenas através do código deste website e podem ser alterados pelos respetivos fornecedores.",
        },
      ],
    },
    {
      id: "marketing",
      title: "8. Cookies de marketing",
      blocks: [
        {
          type: "p",
          text: "Atualmente não existem cookies de marketing ou publicidade implementados no código deste website. A categoria Marketing está disponível no sistema de consentimento para uso futuro, caso venha a ser necessária.",
        },
      ],
    },
    {
      id: "terceiros",
      title: "9. Cookies de terceiros",
      blocks: [
        {
          type: "p",
          text: "Durante o pagamento de faturas, o utilizador pode ser redireccionado para o checkout Stripe (stripe.com), onde cookies de terceiros podem ser definidos pela Stripe. Os detalhes dependem da interacção e não são controlados directamente por este website.",
        },
        {
          type: "p",
          text: "Se escolher contacto por WhatsApp no Discovery Wizard, será encaminhado para WhatsApp (Meta), onde cookies e tratamento de dados são regidos pelas políticas da Meta/WhatsApp.",
        },
      ],
    },
    {
      id: "gestao",
      title: "10. Como gerir cookies",
      blocks: [
        {
          type: "ul",
          items: [
            "Utilize o banner ou painel «Personalizar» no website para alterar preferências.",
            "Pode também configurar o seu browser para bloquear ou eliminar cookies.",
            "Bloquear cookies necessários pode afectar login e funcionalidades autenticadas.",
          ],
        },
      ],
    },
    {
      id: "contacto",
      title: "11. Contacto",
      blocks: [
        {
          type: "p",
          text: `Para questões sobre cookies, contacte ${LEGAL_ENTITY.email}.`,
        },
      ],
    },
  ],
};
