const docsContent = {
  en: {
    pageTitle: 'Docs — III.PICS',
    pageDescription:
      'Learn how to generate AI images, use credits, discover references, and get the most out of III.PICS.',
    leftNavTitle: 'Documentation',
    leftNavLabel: 'Guides',
    topBadge: 'Getting Started',
    topTitle: 'III.PICS Docs',
    topDescription:
      'III.PICS is an AI image and video generation platform with a curated reference library. Generate images with top models, explore thousands of prompts for inspiration, and save the work that matters.',
    sections: [
      {
        id: 'quickstart',
        label: 'Quick Start',
        eyebrow: 'Quick Start',
        title: 'Get up and running in minutes',
        description:
          'The fastest path: sign in → get 40 free daily credits → open the Generate panel → pick a model → write a prompt → generate.',
        cards: [
          {
            title: '1. Sign in',
            body:
              'Create an account with email or sign in with Google. New users receive 40 free credits per day, automatically refreshed every day.',
          },
          {
            title: '2. Generate an image',
            body:
              'Click the wand icon in the bottom dock to open the Generate panel. Pick a model, write a prompt, and hit Generate.',
          },
          {
            title: '3. Browse references',
            body:
              'Use Explore (Sref styles), Gallery (9 000+ Midjourney prompts), and Seedance (video references) for inspiration before you generate.',
          },
          {
            title: '4. Use a reference image',
            body:
              'Click "Use as Reference" on any gallery image to load it into the Generate panel. Upload up to 4 reference images per generation.',
          },
        ],
        callouts: [
          {
            title: 'Main surfaces',
            items: [
              'Explore: Sref style references and searchable inspiration',
              'Gallery: 9 000+ curated Midjourney image prompts',
              'Seedance: video and motion prompt references',
              'Generate panel: multi-model AI image generation (dock icon)',
            ],
          },
          {
            title: 'Recommended flow',
            items: [
              'Browse Gallery or Explore to find a style you like',
              'Click "Use as Reference" to load it into the Generate panel',
              'Write your prompt, choose a model, and generate',
              'Upscale to 2K or 4K if you need a higher-resolution result',
            ],
          },
        ],
      },
      {
        id: 'about',
        label: 'About',
        eyebrow: 'About',
        title: 'What III.PICS is',
        description:
          'A platform built for AI image creators who need both a fast generation tool and a deep reference library in one place.',
        paragraphs: [
          'III.PICS combines a multi-model AI image generation engine with a curated library of over 9 000 Midjourney prompts, Sref style codes, and Seedance video references.',
          'The platform is designed for creators who iterate quickly: pick a reference, generate variants, upscale the best result, and save it to Favorites for the next session.',
        ],
        subSections: [
          {
            id: 'about-features',
            title: 'Core features',
            bullets: [
              'Multi-model generation: Gemini 3 Pro, Imagen 4, GPT Image 1.5, DALL·E 3, and more',
              'Reference image input: attach up to 4 images to guide each generation',
              '2K and 4K upscaling powered by Real-ESRGAN',
              'Gallery with 9 000+ curated Midjourney prompts',
              'Sref style library for Midjourney reference codes',
              'Seedance video prompt reference collection',
              'Generation history with full prompt and model records',
              'Daily free credits (40/day) plus purchasable credits',
              'Invite system: both you and your invitee earn 200 credits',
            ],
          },
          {
            id: 'about-positioning',
            title: 'Who it is for',
            paragraphs: [
              'AI image creators who need a reference library alongside their generation tool',
              'Prompt collectors building a personal library of Midjourney and AI styles',
              'Anyone who wants to generate high-quality images without a subscription lock-in',
            ],
          },
          {
            id: 'acknowledgements',
            title: 'Open Source Acknowledgements',
            paragraphs: [
              'Portions of the Gallery prompt data are sourced from the NanoBanana Trending Prompts dataset — a curated collection of over 1,300 trending AI image prompts gathered from X/Twitter, ranked by community engagement.',
              'This dataset is published under the Creative Commons Attribution 4.0 International license (CC BY 4.0). We gratefully thank the contributors and curators of this open dataset for making high-quality prompt data freely available to the community.',
            ],
          },
        ],
      },
      {
        id: 'credits',
        label: 'Credits',
        eyebrow: 'Credits',
        title: 'How the credits system works',
        description:
          'III.PICS uses a dual-balance system: free daily credits that reset every day, and permanent credits that never expire.',
        notice:
          'Free credits reset to 40 every day at midnight (UTC+8). They are spent first. Permanent credits are only used after your daily free balance runs out.',
        subSections: [
          {
            id: 'credits-balances',
            title: 'Two balances',
            bullets: [
              'Free credits: 40 per day, reset at midnight UTC+8, cannot be purchased',
              'Permanent credits: purchased or earned through referrals, never expire',
              'Free credits are always spent first during a generation',
              'Hover the credits display in the sidebar to see both balances at once',
            ],
          },
          {
            id: 'credits-costs',
            title: 'Generation costs per model',
            bullets: [
              'Gemini 3 Pro — 10 credits',
              'GPT Image 1.5 — 10 credits',
              'Imagen 4 — 8 credits',
              'DALL·E 3 — 8 credits',
              'Z-Image Turbo — 2 credits',
              '2K upscaling — 4 credits (requires at least one prior purchase)',
              '4K upscaling — 8 credits (requires at least one prior purchase)',
            ],
          },
          {
            id: 'credits-earn',
            title: 'How to earn free credits',
            bullets: [
              'Daily: 40 credits automatically refreshed each day — no check-in required',
              'Daily check-in: visit the Dashboard and click Check-In for a bonus',
              'Referrals: share your invite code; both you and your invitee earn 200 permanent credits after their first generation',
            ],
          },
          {
            id: 'credits-purchase',
            title: 'Purchasing credits',
            bullets: [
              'Starter — 1 000 credits',
              'Pro — 2 200 credits',
              'Ultimate — 6 000 credits',
              'Purchasing any plan once unlocks access to 2K and 4K upscaling permanently',
              'Open the Credits modal from the sidebar credits display to view current pricing',
            ],
          },
        ],
      },
      {
        id: 'generate',
        label: 'Generate',
        eyebrow: 'Generate',
        title: 'AI image generation',
        description:
          'The Generate panel is the core creation surface. Open it from the wand icon in the bottom dock.',
        subSections: [
          {
            id: 'generate-models',
            title: 'Available models',
            bullets: [
              'Gemini 3 Pro — high quality, good prompt adherence, 10 credits',
              'GPT Image 1.5 — strong text rendering and compositional accuracy, 10 credits',
              'Imagen 4 — photorealistic results, 8 credits',
              'DALL·E 3 — reliable all-rounder with good style range, 8 credits',
              'Z-Image Turbo — fast and lightweight for quick drafts, 2 credits',
            ],
          },
          {
            id: 'generate-reference',
            title: 'Reference images',
            bullets: [
              'Upload up to 4 reference images to guide the style or composition of a generation',
              'Drag images directly into the reference area, or click to upload from disk',
              'Click "Use as Reference" on any Gallery image to load it automatically',
              'Reference images are sent alongside your text prompt to the chosen model',
            ],
          },
          {
            id: 'generate-upscale',
            title: '2K and 4K upscaling',
            bullets: [
              '2K upscaling uses Real-ESRGAN to double the resolution of a generated image',
              '4K upscaling quadruples the resolution for print-quality output',
              'Upscaling requires at least one prior credit purchase to unlock',
              'Upscaled images are delivered as a download link valid for approximately 1 hour',
            ],
          },
          {
            id: 'generate-history',
            title: 'Generation history',
            bullets: [
              'Every generation is saved to Generation History automatically',
              'History records the prompt, model, reference images used, and result',
              'Access it from the sidebar or from the Generate panel header',
            ],
          },
        ],
      },
      {
        id: 'help',
        label: 'Help',
        eyebrow: 'Help',
        title: 'Common questions',
        description:
          'Help content is organized by what you are trying to do, not by a generic FAQ list.',
        subSections: [
          {
            id: 'help-account',
            title: 'Account setup',
            bullets: [
              'Create an account with email or sign in with Google from the homepage or sign-in modal.',
              'If you cannot log in, use the password reset flow before contacting support.',
              'After signing in, your 40 daily free credits are available immediately.',
            ],
          },
          {
            id: 'help-credits',
            title: 'Credits questions',
            bullets: [
              'Free credits reset at midnight UTC+8 each day — they do not carry over.',
              'If your free balance shows 0, check whether you have permanent credits remaining.',
              'Purchased credits never expire and are not affected by the daily reset.',
              'Contact support with your account email for any billing or payment issues.',
            ],
          },
          {
            id: 'help-generation',
            title: 'Generation issues',
            bullets: [
              'If a generation fails, the credits are not charged — try again with a different prompt or model.',
              'Prompts in English generally produce the most consistent results across all models.',
              'If upscale buttons are greyed out, you need to complete at least one credit purchase to unlock them.',
            ],
          },
          {
            id: 'help-collections',
            title: 'Favorites and history',
            bullets: [
              'Favorites saves Gallery, Sref, and Seedance items for long-term reference.',
              'Browse History tracks the gallery pages you have visited recently.',
              'Generation History tracks every image you have generated, including the prompt and model used.',
            ],
          },
          {
            id: 'help-support',
            title: 'When to contact support',
            bullets: [
              'Use email for account issues, billing, and structured support requests.',
              'Use GitHub when you can provide clear reproduction steps for a bug.',
              'Use social channels for lightweight outreach or public updates.',
            ],
          },
        ],
      },
      {
        id: 'privacy',
        label: 'Privacy',
        eyebrow: 'Privacy',
        title: 'Privacy policy summary',
        description:
          'This summary explains the categories of data the platform handles and how that data is used, stored, and protected.',
        notice:
          'Using III.PICS means you agree to the collection and processing described here. Contact us if you need clarification or a specific data request.',
        subSections: [
          {
            id: 'privacy-data',
            title: 'What we collect',
            bullets: [
              'Account details such as username, email, and authentication data (including Google OAuth if used)',
              'Generated images, prompts, reference images, and favorites',
              'Credit transaction records and purchase history',
              'Basic usage and device data used for security, debugging, and service improvement',
            ],
          },
          {
            id: 'privacy-usage',
            title: 'How we use it',
            bullets: [
              'To provide account, generation, gallery, and platform functionality',
              'To improve generation quality, model routing, and platform performance',
              'To protect the service, enforce policies, and investigate abuse',
            ],
          },
          {
            id: 'privacy-sharing',
            title: 'How information may be shared',
            bullets: [
              'Generated images you share publicly are visible to other users by design',
              'Prompts sent to AI models are processed by the respective model providers (Google, OpenAI, etc.)',
              'Trusted service providers may process data for hosting, analytics, or infrastructure',
              'Information may be disclosed when legally required or necessary to protect the platform',
            ],
          },
          {
            id: 'privacy-rights',
            title: 'User rights',
            bullets: [
              'Request access to your account information',
              'Request deletion of your generated content or account',
              'Ask questions about retention, transfers, or data handling',
            ],
          },
        ],
      },
      {
        id: 'terms',
        label: 'Terms',
        eyebrow: 'Terms',
        title: 'Terms of service summary',
        description:
          'These terms define who can use the platform, what kinds of behavior are allowed, and how content and accounts are handled.',
        notice:
          'By using III.PICS, you agree to these terms. Do not use the service if you do not accept the rules described here.',
        subSections: [
          {
            id: 'terms-eligibility',
            title: 'Eligibility and accounts',
            bullets: [
              'Users must provide accurate account information',
              'You are responsible for keeping your login credentials secure',
              'We may suspend or terminate access when the rules are violated',
            ],
          },
          {
            id: 'terms-content',
            title: 'Content and generation',
            bullets: [
              'You are responsible for the prompts you submit and the images you generate',
              'Do not generate or attempt to generate illegal, abusive, or rights-infringing content',
              'Generated images may be used for personal and commercial purposes unless otherwise restricted by the underlying model provider',
              'Publishing or sharing generated content publicly grants the platform permission to display it within the service',
            ],
          },
          {
            id: 'terms-credits',
            title: 'Credits and payments',
            bullets: [
              'Credits are non-refundable once consumed through a generation',
              'Daily free credits have no cash value and cannot be transferred',
              'Purchased credits do not expire but cannot be exchanged for cash',
              'Refer to the pricing page for current plan costs and credit amounts',
            ],
          },
          {
            id: 'terms-conduct',
            title: 'Prohibited behavior',
            bullets: [
              'No abuse, harassment, spam, fraud, or malicious technical activity',
              'No unauthorized automation that bypasses rate limits or platform protections',
              'No behavior that compromises platform security or user experience',
            ],
          },
          {
            id: 'terms-legal',
            title: 'Legal limitations',
            bullets: [
              'The service is provided as available and may change over time',
              'Liability is limited to the extent allowed by law',
              'Policy and legal questions can be routed through the support contact channels',
            ],
          },
        ],
      },
      {
        id: 'contact',
        label: 'Contact',
        eyebrow: 'Contact',
        title: 'Support and business contact',
        description:
          'Use the channel that best matches the kind of response you need.',
        cards: [
          {
            title: 'General support',
            body: 'Account issues, platform questions, generation problems, or access issues.',
          },
          {
            title: 'Bug reports',
            body: 'Include steps to reproduce, screenshots, expected behavior, and the actual result.',
          },
          {
            title: 'Billing and credits',
            body: 'Credits, invite rewards, purchases, payment issues, and account status questions.',
          },
          {
            title: 'Business inquiries',
            body: 'Partnerships, licensing, integration opportunities, and collaboration requests.',
          },
        ],
        contactMethods: [
          {
            title: 'Email support',
            description: 'Best for account issues, billing, policy questions, and structured support requests.',
            href: 'mailto:i@mail.iii.pics',
            actionLabel: 'i@mail.iii.pics',
          },
          {
            title: 'GitHub',
            description: 'Best for technical issues when you can share reproducible details.',
            href: 'https://github.com/renqw2023',
            actionLabel: 'renqw2023',
          },
          {
            title: 'X / WeChat',
            description: 'Best for lightweight outreach or fast follow-up when email is too slow.',
            href: 'https://x.com/renqw5271',
            actionLabel: 'RPW000 / @renqw5271',
          },
        ],
      },
    ],
  },

  zh: {
    pageTitle: '文档 — III.PICS',
    pageDescription: '了解如何生成 AI 图像、使用积分、探索参考素材，充分发挥 III.PICS 的全部功能。',
    leftNavTitle: '文档中心',
    leftNavLabel: '文档',
    topBadge: '开始使用',
    topTitle: 'III.PICS 文档',
    topDescription:
      'III.PICS 是一个集多模型 AI 图像生成与精选参考库于一体的创作平台。使用顶级模型生成图像、在数千个提示词中寻找灵感、收藏值得复用的内容。',
    sections: [
      {
        id: 'quickstart',
        label: '快速开始',
        eyebrow: '快速开始',
        title: '几分钟内上手',
        description:
          '最快的路径：登录 → 获得每日 40 免费积分 → 打开生成面板 → 选模型 → 写提示词 → 生成。',
        cards: [
          {
            title: '1. 登录账号',
            body: '用邮箱注册或 Google 一键登录。新用户每天自动获得 40 免费积分，无需任何操作。',
          },
          {
            title: '2. 生成图像',
            body: '点击底部 Dock 的魔杖图标打开生成面板，选择模型、写提示词，点击生成。',
          },
          {
            title: '3. 浏览参考素材',
            body: '生成前先用 Explore（Sref 风格）、Gallery（9000+ Midjourney 提示词）或 Seedance（视频参考）找灵感。',
          },
          {
            title: '4. 使用参考图',
            body: '在任意 Gallery 图片上点击"用作参考图"，即可将其加载到生成面板。每次生成最多支持 4 张参考图。',
          },
        ],
        callouts: [
          {
            title: '核心页面',
            items: [
              'Explore：Sref 风格参考与灵感搜索',
              'Gallery：9000+ 精选 Midjourney 图像提示词',
              'Seedance：视频与动态提示词参考',
              '生成面板：多模型 AI 图像生成（底部 Dock 魔杖图标）',
            ],
          },
          {
            title: '推荐工作流',
            items: [
              '浏览 Gallery 或 Explore 找到喜欢的风格',
              '点击"用作参考图"将其加入生成面板',
              '写提示词、选模型、生成',
              '需要高分辨率时使用 2K 或 4K 放大',
            ],
          },
        ],
      },
      {
        id: 'about',
        label: '关于',
        eyebrow: '关于',
        title: 'III.PICS 是什么',
        description: '一个为 AI 图像创作者打造的平台：高效的生成工具 + 深度参考库，合二为一。',
        paragraphs: [
          'III.PICS 将多模型 AI 图像生成引擎与超过 9000 条精选 Midjourney 提示词、Sref 风格代码和 Seedance 视频参考融合在一起。',
          '平台专为快速迭代的创作者设计：找到参考 → 生成变体 → 放大最佳结果 → 收藏备用，形成完整的创作闭环。',
        ],
        subSections: [
          {
            id: 'about-features',
            title: '核心功能',
            bullets: [
              '多模型生成：Gemini 3 Pro、Imagen 4、GPT Image 1.5、DALL·E 3 等',
              '参考图输入：每次生成最多上传 4 张参考图',
              '2K/4K 放大：基于 Real-ESRGAN 的高清放大',
              'Gallery：9000+ 精选 Midjourney 提示词',
              'Sref 风格库：Midjourney 风格参考代码合集',
              'Seedance：视频提示词参考集合',
              '生成历史：完整记录每次生成的提示词、模型和结果',
              '每日免费积分（40 积分/天）+ 可购买永久积分',
              '邀请系统：邀请人与被邀请人各得 200 积分',
            ],
          },
          {
            id: 'about-positioning',
            title: '适合谁用',
            paragraphs: [
              '需要在生成工具旁边有参考库的 AI 图像创作者',
              '正在整理个人 Midjourney 和 AI 风格素材库的提示词收藏者',
              '希望按需付费生成高质量图像、不想被订阅制锁定的用户',
            ],
          },
          {
            id: 'acknowledgements',
            title: '开源致谢',
            paragraphs: [
              'Gallery 部分提示词数据来源于 NanoBanana Trending Prompts 数据集——一个从 X/Twitter 精心整理的 1,300+ 条热门 AI 图像提示词集合，按社区互动量排名。',
              '该数据集以 CC BY 4.0（知识共享署名 4.0 国际）许可证发布。我们衷心感谢该开源数据集的贡献者与维护者，让高质量提示词数据向社区免费开放。',
            ],
          },
        ],
      },
      {
        id: 'credits',
        label: '积分',
        eyebrow: '积分',
        title: '积分系统说明',
        description: 'III.PICS 采用双余额体系：每天重置的免费积分，以及永不过期的永久积分。',
        notice: '免费积分每天凌晨 0 点（UTC+8）重置为 40，优先消耗，不可累积。永久积分仅在免费积分用完后才会扣除。',
        subSections: [
          {
            id: 'credits-balances',
            title: '两种余额',
            bullets: [
              '免费积分：每天 40 积分，午夜 UTC+8 重置，不可购买',
              '永久积分：通过购买或邀请获得，永不过期',
              '每次生成时优先消耗免费积分',
              '悬停侧边栏的积分显示区，可同时查看两种余额',
            ],
          },
          {
            id: 'credits-costs',
            title: '各模型消耗积分',
            bullets: [
              'Gemini 3 Pro — 10 积分',
              'GPT Image 1.5 — 10 积分',
              'Imagen 4 — 8 积分',
              'DALL·E 3 — 8 积分',
              'Z-Image Turbo — 2 积分',
              '2K 放大 — 4 积分（需至少完成一次付费购买）',
              '4K 放大 — 8 积分（需至少完成一次付费购买）',
            ],
          },
          {
            id: 'credits-earn',
            title: '如何获得免费积分',
            bullets: [
              '每日：每天自动刷新 40 免费积分，无需签到',
              '每日签到：在 Dashboard 点击"签到"领取额外奖励',
              '邀请好友：分享邀请码，对方完成首次生成后，双方各得 200 永久积分',
            ],
          },
          {
            id: 'credits-purchase',
            title: '购买积分',
            bullets: [
              'Starter — 1000 积分',
              'Pro — 2200 积分',
              'Ultimate — 6000 积分',
              '任意套餐购买一次，即永久解锁 2K 和 4K 放大功能',
              '在侧边栏积分区点击打开积分弹窗，查看当前价格',
            ],
          },
        ],
      },
      {
        id: 'generate',
        label: '图像生成',
        eyebrow: '图像生成',
        title: 'AI 图像生成',
        description: '生成面板是核心创作入口，点击底部 Dock 的魔杖图标即可打开。',
        subSections: [
          {
            id: 'generate-models',
            title: '可用模型',
            bullets: [
              'Gemini 3 Pro — 高质量，提示词还原度强，10 积分',
              'GPT Image 1.5 — 文字渲染与构图精准，10 积分',
              'Imagen 4 — 写实效果出色，8 积分',
              'DALL·E 3 — 风格覆盖广，稳定可靠，8 积分',
              'Z-Image Turbo — 快速出图，适合快速草稿，2 积分',
            ],
          },
          {
            id: 'generate-reference',
            title: '参考图',
            bullets: [
              '每次生成最多上传 4 张参考图，用于引导风格或构图',
              '直接拖拽图片到参考区，或点击从本地上传',
              '在 Gallery 图片上点击"用作参考图"即可自动加载',
              '参考图与文字提示词一起发送给所选模型',
            ],
          },
          {
            id: 'generate-upscale',
            title: '2K / 4K 放大',
            bullets: [
              '2K 放大使用 Real-ESRGAN 将生成图像分辨率翻倍',
              '4K 放大将分辨率提升 4 倍，可用于印刷级输出',
              '放大功能需至少完成一次积分购买后解锁',
              '放大后图像以下载链接形式提供，有效期约 1 小时',
            ],
          },
          {
            id: 'generate-history',
            title: '生成历史',
            bullets: [
              '每次生成均自动保存至生成历史',
              '历史记录包含提示词、所用模型、参考图和生成结果',
              '可从侧边栏或生成面板顶部访问',
            ],
          },
        ],
      },
      {
        id: 'help',
        label: '帮助',
        eyebrow: '帮助',
        title: '常见问题',
        description: '帮助内容按"你想完成什么事情"组织，而不是堆成一整页 FAQ。',
        subSections: [
          {
            id: 'help-account',
            title: '账户与开始使用',
            bullets: [
              '通过首页或登录弹窗用邮箱注册，或使用 Google 一键登录。',
              '如果无法登录，优先走密码找回流程，再联系支持。',
              '登录后每天 40 免费积分立即可用。',
            ],
          },
          {
            id: 'help-credits',
            title: '积分相关',
            bullets: [
              '免费积分每天午夜（UTC+8）重置，不累积到第二天。',
              '若免费积分显示 0，请检查永久积分余额是否还有剩余。',
              '购买的积分永不过期，不受每日重置影响。',
              '支付或账单问题请附上账户邮箱联系支持。',
            ],
          },
          {
            id: 'help-generation',
            title: '生成问题',
            bullets: [
              '生成失败时积分不会被扣除，可换提示词或模型重试。',
              '使用英文提示词通常能在所有模型上获得最稳定的结果。',
              '如果 2K/4K 放大按钮显示为灰色，需要先完成至少一次积分购买来解锁。',
            ],
          },
          {
            id: 'help-collections',
            title: '收藏与历史',
            bullets: [
              'Favorites 收藏 Gallery、Sref 和 Seedance 内容，长期备用。',
              'Browse History 记录你最近浏览的 Gallery 页面。',
              'Generation History 记录你生成过的所有图像，包括提示词和模型。',
            ],
          },
          {
            id: 'help-support',
            title: '何时联系支持',
            bullets: [
              '账号、支付和明确问题优先走邮件。',
              '能复现的技术问题优先走 GitHub。',
              '轻量沟通和公开更新可以走社交渠道。',
            ],
          },
        ],
      },
      {
        id: 'privacy',
        label: '隐私',
        eyebrow: '隐私',
        title: '隐私政策摘要',
        description: '这里说明平台会处理哪些数据、如何使用、如何存储，以及你有哪些相关权利。',
        notice: '使用 III.PICS 即表示你同意这里描述的数据处理方式。如需发起具体的数据请求，请联系支持。',
        subSections: [
          {
            id: 'privacy-data',
            title: '我们收集什么',
            bullets: [
              '账号信息，例如用户名、邮箱和认证信息（包括 Google OAuth）',
              '生成图像、提示词、参考图和收藏内容',
              '积分流水记录和购买历史',
              '基础使用和设备数据，用于安全、排错和服务改进',
            ],
          },
          {
            id: 'privacy-usage',
            title: '我们如何使用',
            bullets: [
              '提供账号、生成、Gallery 和平台核心功能',
              '改进生成质量、模型路由和平台性能',
              '保护服务安全、执行规则、处理滥用行为',
            ],
          },
          {
            id: 'privacy-sharing',
            title: '信息可能如何共享',
            bullets: [
              '你公开分享的生成图像会对其他用户可见',
              '发送给 AI 模型的提示词由相应的模型提供商（Google、OpenAI 等）处理',
              '受信任的服务提供商可能参与托管、分析和基础设施处理',
              '在法律要求或保护平台的必要情况下可能会披露信息',
            ],
          },
          {
            id: 'privacy-rights',
            title: '你的权利',
            bullets: [
              '申请访问你的账户信息',
              '申请删除你的生成内容或账号',
              '咨询数据保留、传输或处理方式',
            ],
          },
        ],
      },
      {
        id: 'terms',
        label: '条款',
        eyebrow: '条款',
        title: '服务条款摘要',
        description: '这里定义谁可以使用平台、哪些行为被允许，以及账户和内容会如何处理。',
        notice: '使用 III.PICS 即表示你接受这些条款。如果你不同意这些规则，请不要使用服务。',
        subSections: [
          {
            id: 'terms-eligibility',
            title: '资格与账户',
            bullets: [
              '用户需要提供真实有效的账户信息',
              '你有责任保护自己的登录凭据',
              '若违反规则，平台可以暂停或终止访问权限',
            ],
          },
          {
            id: 'terms-content',
            title: '内容与生成',
            bullets: [
              '你需要对自己提交的提示词和生成的图像负责',
              '禁止生成或尝试生成违法、侵权或有害内容',
              '除非底层模型提供商另有限制，生成图像可用于个人和商业用途',
              '公开分享的生成内容即表示允许平台在服务内展示',
            ],
          },
          {
            id: 'terms-credits',
            title: '积分与支付',
            bullets: [
              '已通过生成消耗的积分不予退还',
              '每日免费积分无现金价值，不可转让',
              '购买的积分不过期，但不可兑换现金',
              '请参阅定价页面了解当前套餐费用和积分数量',
            ],
          },
          {
            id: 'terms-conduct',
            title: '禁止行为',
            bullets: [
              '禁止骚扰、垃圾信息、欺诈和恶意技术行为',
              '禁止绕过限速或平台保护机制的未授权自动化',
              '禁止损害平台安全或用户体验的行为',
            ],
          },
          {
            id: 'terms-legal',
            title: '法律限制',
            bullets: [
              '服务按当前可用状态提供，并可能随时间调整',
              '责任范围在法律允许的前提下受到限制',
              '政策与法律问题可通过支持入口联系平台',
            ],
          },
        ],
      },
      {
        id: 'contact',
        label: '联系',
        eyebrow: '联系',
        title: '支持与商务联系',
        description: '优先选择最适合的联系渠道。重点是分流清晰，而不是做一个华而不实的联系页。',
        cards: [
          { title: '一般支持', body: '账号问题、页面使用疑问、生成问题或访问异常。' },
          { title: 'Bug 反馈', body: '请附上复现步骤、截图、预期结果和实际结果。' },
          { title: '支付与积分', body: '积分、邀请奖励、购买、订单和账户状态。' },
          { title: '商务合作', body: '合作、授权、集成和商务沟通。' },
        ],
        contactMethods: [
          {
            title: '邮件支持',
            description: '适合账号问题、支付问题、政策问题和结构化支持请求。',
            href: 'mailto:i@mail.iii.pics',
            actionLabel: 'i@mail.iii.pics',
          },
          {
            title: 'GitHub',
            description: '适合可复现的技术问题和实现层反馈。',
            href: 'https://github.com/renqw2023',
            actionLabel: 'renqw2023',
          },
          {
            title: 'X / 微信',
            description: '适合轻量沟通，或在邮件太慢时快速跟进。',
            href: 'https://x.com/renqw5271',
            actionLabel: 'RPW000 / @renqw5271',
          },
        ],
      },
    ],
  },

  ja: {
    pageTitle: 'ドキュメント — III.PICS',
    pageDescription: 'AI 画像生成の使い方、クレジット、参考素材の探し方など III.PICS の全機能を解説します。',
    leftNavTitle: 'ドキュメント',
    leftNavLabel: 'ガイド',
    topBadge: 'はじめに',
    topTitle: 'III.PICS ドキュメント',
    topDescription:
      'III.PICS はマルチモデル AI 画像生成エンジンと精選された参考ライブラリを一体化したクリエイター向けプラットフォームです。トップモデルで画像を生成し、数千のプロンプトでインスピレーションを探しましょう。',
    sections: [
      {
        id: 'quickstart',
        label: 'クイックスタート',
        eyebrow: 'クイックスタート',
        title: '数分で使い始める',
        description:
          '最短ルート：サインイン → 毎日 40 無料クレジット取得 → 生成パネルを開く → モデル選択 → プロンプト入力 → 生成。',
        cards: [
          {
            title: '1. サインイン',
            body: 'メールアカウントを作成するか Google でサインイン。新規ユーザーには毎日 40 無料クレジットが自動付与されます。',
          },
          {
            title: '2. 画像を生成する',
            body: '下部 Dock の杖アイコンをクリックして生成パネルを開き、モデルを選んでプロンプトを入力して生成します。',
          },
          {
            title: '3. 参考素材を探す',
            body: '生成前に Explore（Sref スタイル）、Gallery（9 000+ Midjourney プロンプト）、Seedance（動画参考）でインスピレーションを探しましょう。',
          },
          {
            title: '4. 参考画像を使う',
            body: 'Gallery 画像で「参考として使用」をクリックすると生成パネルに読み込まれます。1 回の生成につき最大 4 枚の参考画像に対応しています。',
          },
        ],
        callouts: [
          {
            title: '主な画面',
            items: [
              'Explore: Sref スタイル参考と検索',
              'Gallery: 9 000+ 精選 Midjourney 画像プロンプト',
              'Seedance: 動画とモーション参考',
              '生成パネル: マルチモデル AI 画像生成（下部 Dock 杖アイコン）',
            ],
          },
          {
            title: 'おすすめのワークフロー',
            items: [
              'Gallery か Explore で気に入ったスタイルを探す',
              '「参考として使用」で生成パネルに読み込む',
              'プロンプトを書いてモデルを選んで生成する',
              '高解像度が必要なら 2K または 4K アップスケールを使う',
            ],
          },
        ],
      },
      {
        id: 'about',
        label: '概要',
        eyebrow: '概要',
        title: 'III.PICS とは',
        description: 'AI 画像クリエイター向けに設計されたプラットフォーム：高速な生成ツールと深い参考ライブラリを一体化。',
        paragraphs: [
          'III.PICS はマルチモデル AI 画像生成エンジンと、9 000 件以上の精選 Midjourney プロンプト・Sref スタイルコード・Seedance 動画参考を融合させたプラットフォームです。',
          '素早いイテレーションを好むクリエイター向けに設計されています：参考を見つけ、バリアントを生成し、最良の結果をアップスケールして Favorites に保存する、というサイクルが自然に回ります。',
        ],
        subSections: [
          {
            id: 'about-features',
            title: 'コア機能',
            bullets: [
              'マルチモデル生成: Gemini 3 Pro、Imagen 4、GPT Image 1.5、DALL·E 3 など',
              '参考画像入力: 1 回の生成につき最大 4 枚の参考画像',
              '2K/4K アップスケール: Real-ESRGAN による高解像度化',
              'Gallery: 9 000+ 精選 Midjourney プロンプト',
              'Sref スタイルライブラリ: Midjourney スタイル参考コードコレクション',
              'Seedance: 動画プロンプト参考コレクション',
              '生成履歴: プロンプト・モデル・結果の完全な記録',
              '毎日無料クレジット（40/日）＋購入可能な永久クレジット',
              '招待システム: 招待した側・された側の両方が 200 クレジット獲得',
            ],
          },
          {
            id: 'about-positioning',
            title: '対象ユーザー',
            paragraphs: [
              '生成ツールの隣に参考ライブラリが必要な AI 画像クリエイター',
              'Midjourney や AI スタイルの個人ライブラリを構築しているプロンプトコレクター',
              'サブスクリプションに縛られず高品質な画像を従量制で生成したいユーザー',
            ],
          },
          {
            id: 'acknowledgements',
            title: 'オープンソース謝辞',
            paragraphs: [
              'Gallery のプロンプトデータの一部は、NanoBanana Trending Prompts データセットを出典としています。これは X/Twitter からキュレーションされた 1,300 件以上のトレンド AI 画像プロンプトのコレクションで、コミュニティのエンゲージメント数でランク付けされています。',
              'このデータセットは CC BY 4.0（クリエイティブ・コモンズ 表示 4.0 国際）ライセンスのもとで公開されています。高品質なプロンプトデータをコミュニティに無償で提供してくださった貢献者とキュレーターの皆様に深く感謝します。',
            ],
          },
        ],
      },
      {
        id: 'credits',
        label: 'クレジット',
        eyebrow: 'クレジット',
        title: 'クレジットシステムの説明',
        description: 'III.PICS は 2 種類のクレジット残高を使用します：毎日リセットされる無料クレジットと、期限なしの永久クレジット。',
        notice: '無料クレジットは毎日深夜 0 時（UTC+8）に 40 にリセットされます。常に優先消費され、翌日に繰り越されません。永久クレジットは無料クレジットがなくなってから消費されます。',
        subSections: [
          {
            id: 'credits-balances',
            title: '2 種類の残高',
            bullets: [
              '無料クレジット: 毎日 40 クレジット、UTC+8 深夜にリセット、購入不可',
              '永久クレジット: 購入または招待で獲得、期限なし',
              '生成時は常に無料クレジットが優先消費される',
              'サイドバーのクレジット表示にホバーすると両方の残高を確認できる',
            ],
          },
          {
            id: 'credits-costs',
            title: 'モデル別消費クレジット',
            bullets: [
              'Gemini 3 Pro — 10 クレジット',
              'GPT Image 1.5 — 10 クレジット',
              'Imagen 4 — 8 クレジット',
              'DALL·E 3 — 8 クレジット',
              'Z-Image Turbo — 2 クレジット',
              '2K アップスケール — 4 クレジット（要：1 回以上の購入実績）',
              '4K アップスケール — 8 クレジット（要：1 回以上の購入実績）',
            ],
          },
          {
            id: 'credits-earn',
            title: '無料クレジットの獲得方法',
            bullets: [
              '毎日: チェックイン不要で 40 クレジットが自動付与',
              '毎日チェックイン: Dashboard の「チェックイン」ボタンでボーナス獲得',
              '友人招待: 招待コードを共有し、招待相手が初回生成を完了すると双方に 200 永久クレジット',
            ],
          },
          {
            id: 'credits-purchase',
            title: 'クレジットの購入',
            bullets: [
              'Starter — 1 000 クレジット',
              'Pro — 2 200 クレジット',
              'Ultimate — 6 000 クレジット',
              'いずれかのプランを 1 回購入すると 2K/4K アップスケールが永久解放',
              'サイドバーのクレジット表示をクリックしてクレジットモーダルで現在の価格を確認',
            ],
          },
        ],
      },
      {
        id: 'generate',
        label: '画像生成',
        eyebrow: '画像生成',
        title: 'AI 画像生成',
        description: '生成パネルはコアの制作画面です。下部 Dock の杖アイコンをクリックして開きます。',
        subSections: [
          {
            id: 'generate-models',
            title: '利用可能なモデル',
            bullets: [
              'Gemini 3 Pro — 高品質、プロンプト再現性が高い、10 クレジット',
              'GPT Image 1.5 — テキスト描画と構図精度が強い、10 クレジット',
              'Imagen 4 — フォトリアリスティックな結果、8 クレジット',
              'DALL·E 3 — 幅広いスタイルに対応する安定したモデル、8 クレジット',
              'Z-Image Turbo — 高速で手軽なドラフト生成向け、2 クレジット',
            ],
          },
          {
            id: 'generate-reference',
            title: '参考画像',
            bullets: [
              '1 回の生成につき最大 4 枚の参考画像でスタイルや構図を誘導できる',
              '参考エリアに直接ドラッグするか、クリックしてローカルからアップロード',
              'Gallery 画像で「参考として使用」をクリックすると自動で読み込まれる',
              '参考画像はテキストプロンプトと一緒に選択したモデルに送信される',
            ],
          },
          {
            id: 'generate-upscale',
            title: '2K / 4K アップスケール',
            bullets: [
              '2K アップスケールは Real-ESRGAN で生成画像の解像度を 2 倍にする',
              '4K アップスケールは解像度を 4 倍にし、印刷品質の出力が可能',
              'アップスケール機能は 1 回以上のクレジット購入後に解放される',
              'アップスケール後の画像はダウンロードリンクとして約 1 時間有効',
            ],
          },
          {
            id: 'generate-history',
            title: '生成履歴',
            bullets: [
              'すべての生成は自動的に生成履歴に保存される',
              '履歴にはプロンプト、使用モデル、参考画像、結果が記録される',
              'サイドバーまたは生成パネルのヘッダーからアクセス可能',
            ],
          },
        ],
      },
      {
        id: 'help',
        label: 'ヘルプ',
        eyebrow: 'ヘルプ',
        title: 'よくある質問',
        description: 'ヘルプは一般的な FAQ ではなく、やりたいことごとに整理されています。',
        subSections: [
          {
            id: 'help-account',
            title: 'アカウントと開始方法',
            bullets: [
              'ホームページまたはサインインモーダルからメールでアカウント作成、または Google でサインイン。',
              'ログインできない場合はまずパスワードリセットフローを試してください。',
              'サインイン後すぐに 40 日次無料クレジットが利用可能です。',
            ],
          },
          {
            id: 'help-credits',
            title: 'クレジットに関する質問',
            bullets: [
              '無料クレジットは毎日深夜（UTC+8）にリセットされ、翌日へ繰り越されません。',
              '無料残高が 0 の場合は永久クレジットの残高を確認してください。',
              '購入したクレジットは期限なしで、日次リセットの影響を受けません。',
              '決済や請求の問題はアカウントのメールアドレスを添えてサポートへ連絡してください。',
            ],
          },
          {
            id: 'help-generation',
            title: '生成に関する問題',
            bullets: [
              '生成が失敗した場合、クレジットは消費されません。プロンプトやモデルを変えて再試行してください。',
              '英語のプロンプトはすべてのモデルで最も安定した結果が得られる傾向があります。',
              '2K/4K アップスケールボタンがグレーアウトしている場合は、少なくとも 1 回のクレジット購入が必要です。',
            ],
          },
          {
            id: 'help-collections',
            title: '保存と履歴',
            bullets: [
              'Favorites は Gallery、Sref、Seedance アイテムを長期参考用に保存します。',
              'Browse History は最近訪問した Gallery ページを追跡します。',
              'Generation History はプロンプトと使用モデルを含む生成したすべての画像を記録します。',
            ],
          },
          {
            id: 'help-support',
            title: 'サポートに連絡するべき時',
            bullets: [
              'アカウントや課金関連はまずメールを使ってください。',
              '再現できる技術的な問題は GitHub が適しています。',
              '軽いやり取りや告知は SNS が向いています。',
            ],
          },
        ],
      },
      {
        id: 'privacy',
        label: 'プライバシー',
        eyebrow: 'プライバシー',
        title: 'プライバシーポリシー概要',
        description: 'どのようなデータを扱い、どう使い、どう保護するかを簡潔にまとめています。',
        notice: 'III.PICS を利用することで、ここで説明するデータ処理に同意したものとみなされます。詳細なデータ依頼はサポートへお問い合わせください。',
        subSections: [
          {
            id: 'privacy-data',
            title: '収集する情報',
            bullets: [
              'ユーザー名、メール、認証情報などのアカウント情報（Google OAuth を含む）',
              '生成画像、プロンプト、参考画像、保存コンテンツ',
              'クレジット取引記録と購入履歴',
              'セキュリティや改善のための基本的な利用・端末データ',
            ],
          },
          {
            id: 'privacy-usage',
            title: '利用目的',
            bullets: [
              'アカウント、生成、Gallery、プラットフォーム機能の提供',
              '生成品質、モデルルーティング、プラットフォームパフォーマンスの改善',
              '不正利用の防止とルールの適用',
            ],
          },
          {
            id: 'privacy-sharing',
            title: '共有される可能性があるケース',
            bullets: [
              '公開した生成画像は他のユーザーから閲覧可能です',
              'AI モデルに送信されたプロンプトは各モデルプロバイダー（Google、OpenAI 等）により処理されます',
              '信頼できるインフラ・分析提供者が処理を行う場合があります',
              '法的要請またはサービス保護のために開示する場合があります',
            ],
          },
          {
            id: 'privacy-rights',
            title: 'ユーザーの権利',
            bullets: [
              '自分の情報へのアクセス申請',
              '生成コンテンツやアカウントの削除申請',
              '保持期間や処理方法に関する問い合わせ',
            ],
          },
        ],
      },
      {
        id: 'terms',
        label: '利用規約',
        eyebrow: '利用規約',
        title: '利用規約概要',
        description: '誰が利用できるか、どの行為が許可されるか、コンテンツやアカウントをどう扱うかを定義しています。',
        notice: 'III.PICS を利用することで、これらの規約に同意したものとみなされます。規約に同意できない場合は利用しないでください。',
        subSections: [
          {
            id: 'terms-eligibility',
            title: '利用資格とアカウント',
            bullets: [
              '正確なアカウント情報を提供する必要があります',
              'ログイン情報の管理はユーザーの責任です',
              '規約違反がある場合、利用停止や終了が行われることがあります',
            ],
          },
          {
            id: 'terms-content',
            title: 'コンテンツと生成',
            bullets: [
              '送信するプロンプトと生成する画像に対する責任はユーザーにあります',
              '違法・侵害・有害なコンテンツの生成または試みは禁止されています',
              '基盤となるモデルプロバイダーが別途制限しない限り、生成画像は個人・商用目的で使用できます',
              '公開した生成コンテンツはサービス内で表示・配信される許可を与えることになります',
            ],
          },
          {
            id: 'terms-credits',
            title: 'クレジットと支払い',
            bullets: [
              '生成に消費されたクレジットは返金されません',
              '日次無料クレジットには現金価値がなく、譲渡もできません',
              '購入したクレジットは期限なしですが、現金に交換できません',
              '現在のプラン費用とクレジット数は料金ページをご参照ください',
            ],
          },
          {
            id: 'terms-conduct',
            title: '禁止行為',
            bullets: [
              '嫌がらせ、スパム、詐欺、悪意ある技術行為は禁止です',
              'レート制限や保護機構を回避する不正な自動化は禁止です',
              'サービスやユーザー体験を損なう行為は禁止です',
            ],
          },
          {
            id: 'terms-legal',
            title: '法的制限',
            bullets: [
              'サービスは現状ベースで提供され、内容は変更されることがあります',
              '責任の範囲は法令の許す限りで制限されます',
              'ポリシーや法的な質問はサポート窓口で受け付けます',
            ],
          },
        ],
      },
      {
        id: 'contact',
        label: 'お問い合わせ',
        eyebrow: 'お問い合わせ',
        title: 'サポートとビジネス連絡先',
        description: '必要な返答に合ったチャネルを選んでください。見た目よりも、適切な振り分けを優先しています。',
        cards: [
          { title: '一般サポート', body: 'アカウントの問題、ページの使い方、生成の問題など。' },
          { title: 'バグ報告', body: '再現手順、スクリーンショット、期待結果、実際の結果を含めてください。' },
          { title: '課金とクレジット', body: 'クレジット、招待報酬、支払い、購入、アカウント状態。' },
          { title: 'ビジネス相談', body: '提携、ライセンス、連携、コラボレーション。' },
        ],
        contactMethods: [
          {
            title: 'メールサポート',
            description: 'アカウント、課金、ポリシー、構造化された問い合わせに最適です。',
            href: 'mailto:i@mail.iii.pics',
            actionLabel: 'i@mail.iii.pics',
          },
          {
            title: 'GitHub',
            description: '再現可能な技術課題の報告に適しています。',
            href: 'https://github.com/renqw2023',
            actionLabel: 'renqw2023',
          },
          {
            title: 'X / WeChat',
            description: '軽いやり取りや素早いフォローアップに適しています。',
            href: 'https://x.com/renqw5271',
            actionLabel: 'RPW000 / @renqw5271',
          },
        ],
      },
    ],
  },
};

const normalizeLanguage = (language = 'en-US') => {
  if (language.startsWith('zh')) return 'zh';
  if (language.startsWith('ja')) return 'ja';
  return 'en';
};

export const getDocsContent = (language) => docsContent[normalizeLanguage(language)] || docsContent.en;
