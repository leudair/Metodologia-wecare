# Metodologia WeCare — Landing Page

Landing page da **Metodologia WeCare** (Agência WeCare Digital). Site estático em HTML, CSS e JavaScript puros, sem build: pode ser publicado diretamente na Vercel, Netlify ou em qualquer hospedagem estática.

## Estrutura

```
index.html            Página principal (Apresentação + vídeo, Conceito, Como funciona, Agência + CTA, FAQ)
termos.html           Termos de Uso
privacidade.html      Política de Privacidade (LGPD)
cookies.html          Política de Cookies
assets/css/styles.css Design system e layout
assets/js/hero3d.js   Título WECARE em 3D real (WebGL/three.js, com fallback em CSS)
assets/vendor/three/  three.js r160 (MIT) + fonte 3D gerada a partir do Inter Black
assets/fonts/         Inter (SIL OFL) hospedada localmente, sem Google Fonts
assets/js/config.js   ← Configuração (vídeo, WhatsApp, Pixel, links)
assets/js/tracking.js Consentimento + Meta Pixel + dataLayer
assets/js/video.js    Player (YouTube, Vimeo ou MP4) + eventos de visualização
assets/js/main.js     Interações e animações
assets/img/           Logo, miniatura do vídeo e fotos institucionais
```

## Arquivos pendentes (adicionar em `assets/img/`)

| Arquivo | Uso |
|---|---|
| `logo-wecare.png` | Logo oficial com fundo transparente (cabeçalho, institucional, rodapé e favicon). Enquanto não existir, aparece um texto provisório. |
| `video-poster.jpg` | Miniatura oficial do vídeo (16:9, ~1920×1080, JPG otimizado). |
| `agencia-01.jpg`, `agencia-02.jpg`, `agencia-03.jpg` | Fotos reais da equipe e da estrutura. As ausentes são ocultadas automaticamente. |

Depois de inserir a logo, confirme o vermelho institucional em `--red` (`assets/css/styles.css`).

## Configuração (`assets/js/config.js`)

- **whatsapp.number**: número comercial com DDI e DDD, somente dígitos (ex.: `5547999999999`).
- **video**: o arquivo original (`.mov`, ~800 MB) não deve ficar no repositório. Hospede o vídeo e informe:
  - `provider: "youtube"` + `id` (vídeo não listado), ou
  - `provider: "vimeo"` + `id`, ou
  - `provider: "html5"` + `src` (MP4 H.264 em CDN, por exemplo Bunny Stream ou Cloudflare R2).
- **pixel.id**: ID do Meta Pixel. Com `requireConsent: true`, o Pixel só carrega após o aceite.

## Eventos de vídeo (Meta Pixel `trackCustom` + `dataLayer`)

| Evento | Quando |
|---|---|
| `MetodologiaVideoPlay` | Primeira reprodução |
| `MetodologiaVideo10` / `25` / `50` / `75` | Tempo **efetivamente assistido**; saltos na linha do tempo não contam |
| `MetodologiaVideo100` | 97% ou mais do vídeo efetivamente assistido |
| `Contact` (padrão) | Clique em qualquer botão de WhatsApp |

Cada evento é enviado uma vez por carregamento de página. Nenhum evento sai antes do consentimento: o visitante escolhe entre Aceitar todos, Recusar ou Personalizar, e pode mudar a escolha em "Preferências de cookies" no rodapé. Ao revogar, os cookies `_fbp`/`_fbc` são removidos.

Recursos para incentivar a visualização completa: barra de progresso abaixo do vídeo, mini player fixo quando o visitante rola a página com o vídeo tocando e tela final com o botão de WhatsApp. O carregamento da página não gera nenhum evento de vídeo.

Para criar públicos no Gerenciador de Eventos, use *Público personalizado → Website → Eventos → MetodologiaVideo100*. A elegibilidade depende das regras da Meta, do consentimento do visitante e do tamanho mínimo do público.

## Rodar localmente

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```
