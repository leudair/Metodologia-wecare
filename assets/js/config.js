/*
 * METODOLOGIA WECARE — configuração da landing page.
 * Altere apenas este arquivo para ajustar vídeo, WhatsApp, Pixel e links.
 */
window.WECARE_CONFIG = {
  // WhatsApp comercial oficial (somente números, com DDI + DDD). Ex.: "5547999999999"
  whatsapp: {
    number: "5547992626235", // (47) 99262-6235
    message: "Olá, tudo bem? Conheci a Metodologia WeCare pelo site e gostaria de aplicar no meu perfil."
  },

  // Vídeo principal
  // provider: "youtube" | "vimeo" | "html5"
  //   youtube -> id: ID do vídeo (ex.: "dQw4w9WgXcQ")
  //   vimeo   -> id: ID numérico do vídeo
  //   html5   -> src: URL do MP4 (H.264/AAC) hospedado em CDN
  video: {
    provider: "youtube",
    id: "8Kf9VPr3VYw", // https://youtu.be/8Kf9VPr3VYw
    src: "",
    poster: "assets/img/video-poster.jpg",
    title: "Apresentação da Metodologia WeCare",

    // Versão em pé (9:16), exibida no celular na vertical. Deixe id vazio para usar a horizontal em todos.
    vertical: {
      id: "",
      poster: "assets/img/video-poster-vertical.jpg"
    }
  },

  // Meta Pixel. Os eventos de vídeo só são enviados com o Pixel carregado.
  pixel: {
    // "Pixel LP" — BM WeCare-Matriz2
    id: "1754238335547745",
    // LGPD: exige consentimento antes de carregar o Pixel
    requireConsent: true
  },

  links: {
    site: "https://www.wecaremidias.com.br",
    instagram: "https://www.instagram.com/agencia.wecare/",
    instagramHandle: "@agencia.wecare",
    privacy: "privacidade.html"
  }
};
