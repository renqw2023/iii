const docsContent = {
  en: {
    pageTitle: 'Quick Start',
    pageDescription:
      'Learn how to browse references, publish work, understand support paths, and review platform policies in one place.',
    leftNavTitle: 'Getting Started',
    leftNavLabel: 'Guides',
    topBadge: 'Getting Started',
    topTitle: 'Quick Start',
    topDescription:
      'III.PICS is a reference-first workspace for AI image and video discovery. Start by browsing examples, save anything worth keeping, then move into publishing and account workflows.',
    sections: [
      {
        id: 'quickstart',
        label: 'Quick Start',
        eyebrow: 'Quick Start',
        title: 'How the product is meant to be used',
        description:
          'The fastest path is discovery first, publishing second, account management last. Treat the platform like a working reference library instead of a brochure site.',
        cards: [
          {
            title: 'Browse reference surfaces',
            body:
              'Use Explore, Gallery, and Seedance to search for styles, prompts, and motion references before you start generating or publishing.',
          },
          {
            title: 'Save useful work',
            body:
              'Use Favorites to keep track of prompts, styles, and media you want to revisit. Use History when you need to jump back into something you just opened.',
          },
          {
            title: 'Publish with context',
            body:
              'Use Create to publish media, prompt parameters, and process notes together so other users can understand the result and reuse the recipe.',
          },
          {
            title: 'Track account activity',
            body:
              'Use Dashboard and Credits for quick status checks, balances, recent activity, and the next action you are likely to take.',
          },
        ],
        callouts: [
          {
            title: 'Product surfaces',
            items: [
              'Explore: style references and searchable inspiration',
              'Gallery: image prompts and visual examples',
              'Seedance: motion and video prompt references',
              'Create: publishing media, prompt parameters, and notes',
            ],
          },
          {
            title: 'Recommended flow',
            items: [
              'Browse and compare references',
              'Save work worth reusing',
              'Publish with prompt context',
              'Return through Dashboard, Favorites, or History',
            ],
          },
        ],
      },
      {
        id: 'about',
        label: 'About',
        eyebrow: 'About',
        title: 'What III.PICS is for',
        description:
          'III.PICS is moving away from a static showcase model and toward a more practical creator utility: discovery, reuse, publishing, and return flows in one workspace.',
        paragraphs: [
          'The platform is designed for creators, prompt collectors, and visual researchers who need to compare references quickly and preserve context around useful work.',
          'Instead of treating prompts, media, and creator notes as separate objects, III.PICS is structured around keeping those layers together so publishing remains reusable.',
        ],
        subSections: [
          {
            id: 'about-positioning',
            title: 'Positioning',
            paragraphs: [
              'Reference-first AI creation workspace',
              'Built for prompt reuse, visual comparison, and creator context',
            ],
          },
          {
            id: 'about-value',
            title: 'Core value',
            paragraphs: [
              'Faster discovery of good references',
              'Cleaner publishing context for reusable prompts and media',
            ],
          },
          {
            id: 'about-direction',
            title: 'Current direction',
            paragraphs: [
              'Useful creator workflows before marketing-heavy pages',
              'A more cohesive system across Dashboard, Favorites, History, and Create',
            ],
          },
        ],
      },
      {
        id: 'help',
        label: 'Help',
        eyebrow: 'Help',
        title: 'Task-based help',
        description:
          'Support content is organized by what users are trying to do, not by a generic FAQ list.',
        subSections: [
          {
            id: 'help-getting-started',
            title: 'Account setup',
            bullets: [
              'Create an account from the public homepage or sign-in modal.',
              'Use the login flow to regain access before contacting support.',
              'After sign-in, the fastest first step is to browse references instead of filling out settings.',
            ],
          },
          {
            id: 'help-publishing',
            title: 'Publishing',
            bullets: [
              'Use Create to upload up to 9 media files per draft.',
              'Keep titles outcome-focused and descriptions process-focused.',
              'Use prompt parameters only when they are reusable or explain the result clearly.',
            ],
          },
          {
            id: 'help-collections',
            title: 'Collections and return flows',
            bullets: [
              'Favorites is for long-term saved work you may reuse later.',
              'History is for recently visited references and fast return.',
              'Dashboard is the overview surface, not the deep management page.',
            ],
          },
          {
            id: 'help-support',
            title: 'When to contact support',
            bullets: [
              'Use email for account issues, billing, and structured support requests.',
              'Use GitHub when you can provide clear reproduction steps.',
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
              'Account details such as username, email, and authentication data',
              'Profile and published content such as media, descriptions, comments, and favorites',
              'Basic usage and device data used for security, debugging, and service improvement',
            ],
          },
          {
            id: 'privacy-usage',
            title: 'How we use it',
            bullets: [
              'To provide account, content, support, and platform functionality',
              'To improve product performance, relevance, and reliability',
              'To protect the service, enforce policies, and investigate abuse',
            ],
          },
          {
            id: 'privacy-sharing',
            title: 'How information may be shared',
            bullets: [
              'Public content is visible to other users by design',
              'Trusted service providers may process data for hosting, analytics, or infrastructure',
              'Information may be disclosed when legally required or necessary to protect the platform',
            ],
          },
          {
            id: 'privacy-rights',
            title: 'User rights',
            bullets: [
              'Request access to your account information',
              'Request correction or deletion where applicable',
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
            title: 'Content responsibilities',
            bullets: [
              'You are responsible for the legality and ownership of content you publish',
              'Publishing content grants the platform permission to display and distribute it within the service',
              'Illegal, abusive, deceptive, or rights-infringing content is prohibited',
            ],
          },
          {
            id: 'terms-conduct',
            title: 'Prohibited behavior',
            bullets: [
              'No abuse, harassment, spam, fraud, or malicious technical activity',
              'No unauthorized automation that damages the service or bypasses protections',
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
          'Use the channel that best matches the kind of response you need. The goal is routing clarity, not decorative contact UI.',
        cards: [
          {
            title: 'General support',
            body: 'Account issues, platform questions, confusing workflows, or access problems.',
          },
          {
            title: 'Bug reports',
            body: 'Include steps, screenshots, expected behavior, and the result you actually saw.',
          },
          {
            title: 'Billing and credits',
            body: 'Credits, invite rewards, payments, purchases, and account status questions.',
          },
          {
            title: 'Business inquiries',
            body: 'Partnerships, licensing, integration opportunities, and collaboration requests.',
          },
        ],
        contactMethods: [
          {
            title: 'Email support',
            description: 'Best for account issues, policy questions, and structured support requests.',
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
    pageTitle: '快速开始',
    pageDescription: '在一个页面中了解如何浏览参考、发布内容、获得支持以及查看平台政策。',
    leftNavTitle: '开始使用',
    leftNavLabel: '文档',
    topBadge: '开始使用',
    topTitle: '快速开始',
    topDescription:
      'III.PICS 是一个以参考发现为核心的 AI 图像与视频工作台。先浏览案例并保存有价值的内容，再进入发布和账户相关流程，会是最自然的使用方式。',
    sections: [
      {
        id: 'quickstart',
        label: '快速开始',
        eyebrow: '快速开始',
        title: '推荐的使用方式',
        description:
          '最顺手的路径是先发现内容，再发布内容，最后再进入账户管理。把平台当作可回访的参考资料库，而不是单纯的展示站。',
        cards: [
          {
            title: '先浏览参考内容',
            body: '先用 Explore、Gallery 和 Seedance 搜索风格、提示词和动态参考，再决定下一步要生成还是发布。',
          },
          {
            title: '保存值得复用的内容',
            body: 'Favorites 适合长期保存值得回看的内容，History 适合快速回到刚刚打开过的页面。',
          },
          {
            title: '带着上下文去发布',
            body: '在 Create 里把媒体、提示词参数和过程说明一起发布，这样其他人才能真正理解和复用。',
          },
          {
            title: '查看账户状态',
            body: '用 Dashboard 和 Credits 快速查看近期活动、余额和下一步操作入口。',
          },
        ],
        callouts: [
          {
            title: '核心页面',
            items: [
              'Explore：风格参考与灵感搜索',
              'Gallery：图像提示词与视觉示例',
              'Seedance：视频和动态参考',
              'Create：发布媒体、参数和说明',
            ],
          },
          {
            title: '推荐流程',
            items: ['先浏览和比较参考', '保存值得复用的内容', '带着参数上下文发布', '通过 Dashboard、Favorites、History 回访'],
          },
        ],
      },
      {
        id: 'about',
        label: '关于',
        eyebrow: '关于',
        title: 'III.PICS 的定位',
        description:
          'III.PICS 正在从静态展示站转向更实用的创作者工具：把发现、复用、发布和回访放进同一套工作流。',
        paragraphs: [
          '平台面向需要高频浏览视觉参考的创作者、提示词收藏者和视觉研究者。',
          '我们希望把提示词、媒体和创作说明保留在同一个上下文里，而不是拆散成多个互不关联的页面。',
        ],
        subSections: [
          {
            id: 'about-positioning',
            title: '产品定位',
            paragraphs: ['以参考发现为核心的 AI 创作工作台', '强调提示词复用、视觉比较和创作者上下文'],
          },
          {
            id: 'about-value',
            title: '核心价值',
            paragraphs: ['更快发现高质量参考', '让提示词和媒体的发布更具可复用性'],
          },
          {
            id: 'about-direction',
            title: '当前方向',
            paragraphs: ['优先打磨创作者工作流，而不是营销型页面', '让 Dashboard、Favorites、History、Create 的边界更清晰'],
          },
        ],
      },
      {
        id: 'help',
        label: '帮助',
        eyebrow: '帮助',
        title: '按任务组织的帮助内容',
        description: '帮助信息按“你想完成什么事情”来组织，而不是堆成一整页 FAQ。',
        subSections: [
          {
            id: 'help-getting-started',
            title: '账户与开始使用',
            bullets: ['通过首页或登录弹窗创建账号并登录', '如果无法登录，优先走登录/找回流程，再联系支持', '登录后建议先浏览参考页，而不是先进入设置'],
          },
          {
            id: 'help-publishing',
            title: '发布内容',
            bullets: ['Create 支持一次草稿最多上传 9 个媒体文件', '标题更适合描述结果，描述区更适合写过程和提示词上下文', '只有在参数真的有复用价值时再展示出来'],
          },
          {
            id: 'help-collections',
            title: '收藏与回访',
            bullets: ['Favorites 适合长期收藏', 'History 适合回到最近看过的内容', 'Dashboard 是总览页，不是深度管理页'],
          },
          {
            id: 'help-support',
            title: '何时联系支持',
            bullets: ['账号、支付和明确问题优先走邮件', '能复现的技术问题优先走 GitHub', '轻量沟通和公开更新可以走社交渠道'],
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
            bullets: ['账号信息，例如用户名、邮箱和认证信息', '个人资料和发布内容，例如媒体、描述、评论和收藏', '基础使用和设备数据，用于安全、排错和服务改进'],
          },
          {
            id: 'privacy-usage',
            title: '我们如何使用',
            bullets: ['提供账号、内容、支持和平台功能', '改进产品性能、相关性和稳定性', '保护服务安全、执行规则、处理滥用行为'],
          },
          {
            id: 'privacy-sharing',
            title: '信息可能如何共享',
            bullets: ['公开发布的内容会天然对其他用户可见', '受信任的服务提供商可能参与托管、分析和基础设施处理', '在法律要求或保护平台的必要情况下可能会披露信息'],
          },
          {
            id: 'privacy-rights',
            title: '你的权利',
            bullets: ['申请访问你的账户信息', '在适用情况下申请更正或删除', '咨询数据保留、传输或处理方式'],
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
            bullets: ['用户需要提供真实有效的账户信息', '你有责任保护自己的登录凭据', '若违反规则，平台可以暂停或终止访问权限'],
          },
          {
            id: 'terms-content',
            title: '内容责任',
            bullets: ['你需要对自己发布内容的合法性和权利归属负责', '发布内容即表示允许平台在服务内展示和分发这些内容', '禁止发布违法、侵权、欺骗性或有害内容'],
          },
          {
            id: 'terms-conduct',
            title: '禁止行为',
            bullets: ['禁止骚扰、垃圾信息、欺诈和恶意技术行为', '禁止绕过平台保护机制或进行破坏性自动化访问', '禁止损害平台安全或用户体验的行为'],
          },
          {
            id: 'terms-legal',
            title: '法律限制',
            bullets: ['服务按当前可用状态提供，并可能随时间调整', '责任范围在法律允许的前提下受到限制', '政策与法律问题可通过支持入口联系平台'],
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
          { title: '一般支持', body: '账号问题、页面使用疑问、功能困惑或访问异常。' },
          { title: 'Bug 反馈', body: '请附上复现步骤、截图、预期结果和实际结果。' },
          { title: '支付与积分', body: '积分、邀请奖励、购买、订单和账户状态。' },
          { title: '商务合作', body: '合作、授权、集成和商务沟通。' },
        ],
        contactMethods: [
          { title: '邮件支持', description: '适合账号问题、政策问题和结构化支持请求。', href: 'mailto:i@mail.iii.pics', actionLabel: 'i@mail.iii.pics' },
          { title: 'GitHub', description: '适合可复现的技术问题和实现层反馈。', href: 'https://github.com/renqw2023', actionLabel: 'renqw2023' },
          { title: 'X / 微信', description: '适合轻量沟通，或在邮件太慢时快速跟进。', href: 'https://x.com/renqw5271', actionLabel: 'RPW000 / @renqw5271' },
        ],
      },
    ],
  },
  ja: {
    pageTitle: 'クイックスタート',
    pageDescription: '参考の閲覧、公開、サポート、ポリシー確認までを 1 つのページで把握できます。',
    leftNavTitle: 'はじめに',
    leftNavLabel: 'ガイド',
    topBadge: 'はじめに',
    topTitle: 'クイックスタート',
    topDescription:
      'III.PICS は、AI 画像と動画の参考探索を中心にしたワークスペースです。まず参考を見て保存し、その後に公開やアカウント関連の操作へ進むのが最も自然な使い方です。',
    sections: [
      {
        id: 'quickstart',
        label: 'クイックスタート',
        eyebrow: 'クイックスタート',
        title: 'おすすめの使い方',
        description:
          '最初に参考を探し、次に公開し、最後にアカウント管理を行う流れが最もスムーズです。プラットフォームを紹介ページではなく、再訪できる参考ライブラリとして使ってください。',
        cards: [
          { title: '参考を先に探す', body: 'Explore、Gallery、Seedance でスタイル、プロンプト、動画参考を探してから次の作業に進みます。' },
          { title: '再利用したいものを保存する', body: 'Favorites は長期保存向け、History は直前に見たものへ戻るために使います。' },
          { title: '文脈付きで公開する', body: 'Create ではメディア、プロンプトパラメータ、制作メモを一緒に公開し、他の人が理解しやすい形にします。' },
          { title: 'アカウント状況を確認する', body: 'Dashboard と Credits で最近の動き、残高、次に取りやすい行動を素早く確認できます。' },
        ],
        callouts: [
          {
            title: '主な画面',
            items: ['Explore: スタイル参考と検索', 'Gallery: 画像プロンプトと作例', 'Seedance: 動画とモーション参考', 'Create: メディアとパラメータの公開'],
          },
          {
            title: 'おすすめの流れ',
            items: ['参考を探して比較する', '再利用したいものを保存する', '文脈付きで公開する', 'Dashboard、Favorites、History から再訪する'],
          },
        ],
      },
      {
        id: 'about',
        label: '概要',
        eyebrow: '概要',
        title: 'III.PICS の役割',
        description:
          'III.PICS は静的なショーケースから、より実用的なクリエイターツールへ移行しています。発見、再利用、公開、再訪を 1 つの流れにまとめることが目的です。',
        paragraphs: [
          'このプラットフォームは、参考画像を頻繁に比較したいクリエイター、プロンプト収集者、ビジュアルリサーチャー向けです。',
          'プロンプト、メディア、制作メモを分断せず、同じ文脈の中に保つことを重視しています。',
        ],
        subSections: [
          { id: 'about-positioning', title: 'ポジショニング', paragraphs: ['参考探索を中心にした AI 制作ワークスペース', 'プロンプト再利用とビジュアル比較を重視'] },
          { id: 'about-value', title: 'コア価値', paragraphs: ['良い参考を素早く見つけられること', 'プロンプトとメディアを再利用しやすい形で公開できること'] },
          { id: 'about-direction', title: '現在の方向性', paragraphs: ['マーケティングより先に制作ワークフローを整える', 'Dashboard、Favorites、History、Create の役割を明確にする'] },
        ],
      },
      {
        id: 'help',
        label: 'ヘルプ',
        eyebrow: 'ヘルプ',
        title: 'タスク別ヘルプ',
        description: 'ヘルプは一般的な FAQ ではなく、やりたいことごとに整理されています。',
        subSections: [
          { id: 'help-getting-started', title: 'アカウントと開始方法', bullets: ['公開ホームまたはサインインモーダルからアカウントを作成します', 'ログインできない場合はまず認証フローを確認します', 'ログイン後は設定より先に参考ページを見るのがおすすめです'] },
          { id: 'help-publishing', title: '公開', bullets: ['Create では 1 つの下書きに最大 9 ファイルを追加できます', 'タイトルは結果、説明文は制作背景や文脈に使います', '再利用価値のあるパラメータだけを見せるのが効果的です'] },
          { id: 'help-collections', title: '保存と再訪', bullets: ['Favorites は長期保存向けです', 'History は最近見たものへ戻るために使います', 'Dashboard は全体の確認用であり、詳細管理ページではありません'] },
          { id: 'help-support', title: 'サポートに連絡するべき時', bullets: ['アカウントや課金関連はまずメールを使ってください', '再現できる技術的な問題は GitHub が適しています', '軽いやり取りや告知は SNS が向いています'] },
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
          { id: 'privacy-data', title: '収集する情報', bullets: ['ユーザー名、メール、認証情報などのアカウント情報', 'プロフィールや投稿コンテンツ、コメント、保存情報', 'セキュリティや改善のための基本的な利用・端末データ'] },
          { id: 'privacy-usage', title: '利用目的', bullets: ['アカウント、コンテンツ、サポート機能の提供', '性能、信頼性、関連性の改善', '不正利用の防止とルールの適用'] },
          { id: 'privacy-sharing', title: '共有される可能性があるケース', bullets: ['公開コンテンツは他のユーザーから閲覧可能です', '信頼できるインフラ・分析提供者が処理を行う場合があります', '法的要請またはサービス保護のために開示する場合があります'] },
          { id: 'privacy-rights', title: 'ユーザーの権利', bullets: ['自分の情報へのアクセス申請', '必要に応じた訂正や削除申請', '保持期間や処理方法に関する問い合わせ'] },
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
          { id: 'terms-eligibility', title: '利用資格とアカウント', bullets: ['正確なアカウント情報を提供する必要があります', 'ログイン情報の管理はユーザーの責任です', '規約違反がある場合、利用停止や終了が行われることがあります'] },
          { id: 'terms-content', title: 'コンテンツに関する責任', bullets: ['公開する内容の適法性と権利関係はユーザーの責任です', '公開した内容はサービス内で表示・配信される許可を与えることになります', '違法・侵害・有害な内容は禁止されています'] },
          { id: 'terms-conduct', title: '禁止行為', bullets: ['嫌がらせ、スパム、詐欺、悪意ある技術行為は禁止です', '保護機構の回避や破壊的な自動アクセスは禁止です', 'サービスやユーザー体験を損なう行為は禁止です'] },
          { id: 'terms-legal', title: '法的制限', bullets: ['サービスは現状ベースで提供され、内容は変更されることがあります', '責任の範囲は法令の許す限りで制限されます', 'ポリシーや法的な質問はサポート窓口で受け付けます'] },
        ],
      },
      {
        id: 'contact',
        label: 'お問い合わせ',
        eyebrow: 'お問い合わせ',
        title: 'サポートとビジネス連絡先',
        description: '必要な返答に合ったチャネルを選んでください。見た目よりも、適切な振り分けを優先しています。',
        cards: [
          { title: '一般サポート', body: 'アカウントの問題、ページの使い方、機能の疑問など。' },
          { title: 'バグ報告', body: '再現手順、スクリーンショット、期待結果、実際の結果を含めてください。' },
          { title: '課金とクレジット', body: 'クレジット、招待報酬、支払い、購入、アカウント状態。' },
          { title: 'ビジネス相談', body: '提携、ライセンス、連携、コラボレーション。' },
        ],
        contactMethods: [
          { title: 'メールサポート', description: 'アカウント、ポリシー、構造化された問い合わせに最適です。', href: 'mailto:i@mail.iii.pics', actionLabel: 'i@mail.iii.pics' },
          { title: 'GitHub', description: '再現可能な技術課題の報告に適しています。', href: 'https://github.com/renqw2023', actionLabel: 'renqw2023' },
          { title: 'X / WeChat', description: '軽いやり取りや素早いフォローアップに適しています。', href: 'https://x.com/renqw5271', actionLabel: 'RPW000 / @renqw5271' },
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

