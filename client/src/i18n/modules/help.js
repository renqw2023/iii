// 帮助页面翻译模块
export const help = {
  'zh-CN': {
    title: '帮助中心',
    subtitle: '常见问题解答',
    searchPlaceholder: '搜索问题...',
    sections: {
      gettingStarted: {
        title: '快速入门',
        questions: {
          howToRegister: {
            question: '如何注册账号？',
            answer: '点击右上角的"注册"按钮，填写用户名、邮箱和密码即可完成注册。注册后您可以发布作品、收藏喜欢的内容。'
          },
          howToLogin: {
            question: '如何登录？',
            answer: '点击右上角的"登录"按钮，输入您的邮箱和密码即可登录。如果忘记密码，可以通过邮箱重置。'
          },
          firstSteps: {
            question: '首次使用应该做什么？',
            answer: '建议先浏览"发现"页面了解平台内容，然后完善个人资料，开始关注感兴趣的创作者，最后尝试发布您的第一个作品。'
          }
        }
      },
      creatingPosts: {
        title: '发布作品',
        questions: {
          howToPost: {
            question: '如何发布新作品？',
            answer: '登录后点击"创作"按钮或右上角的"+"图标，上传图片或视频，填写标题、描述和Midjourney参数，然后点击发布。'
          },
          supportedFormats: {
            question: '支持哪些文件格式？',
            answer: '图片支持 JPG、PNG、GIF、WEBP 格式，视频支持 MP4 格式。单个文件大小不超过 200MB，每次最多上传 9 个文件。'
          },
          addingParams: {
            question: '如何添加Midjourney参数？',
            answer: '在发布页面的"参数"字段中输入完整的Midjourney提示词，包括主要描述、风格参数、比例设置等。这有助于其他用户学习和参考。'
          },
          editPosts: {
            question: '可以编辑已发布的作品吗？',
            answer: '目前暂不支持编辑已发布的作品，请在发布前仔细检查内容。如需修改，可以删除后重新发布。'
          }
        }
      },
      browsing: {
        title: '浏览和发现',
        questions: {
          howToSearch: {
            question: '如何搜索作品？',
            answer: '使用顶部搜索框输入关键词，可以搜索标题、描述、标签等内容。支持按时间、热度、收藏数等方式排序。'
          },
          usingTags: {
            question: '如何使用标签？',
            answer: '点击作品下方的标签可以查看相同标签的其他作品。您也可以在搜索时使用标签进行筛选。'
          },
          featuredWorks: {
            question: '什么是精选作品？',
            answer: '精选作品是由管理员挑选的高质量内容，通常具有优秀的视觉效果和实用的参数参考价值。'
          }
        }
      },
      interaction: {
        title: '互动功能',
        questions: {
          howToFavorite: {
            question: '如何收藏作品？',
            answer: '点击作品右下角的心形图标即可收藏。收藏的作品可以在"我的收藏"页面查看。'
          },
          howToFollow: {
            question: '如何关注其他用户？',
            answer: '访问用户主页，点击"关注"按钮。关注后可以在首页看到他们的最新作品。'
          },
          howToComment: {
            question: '如何评论作品？',
            answer: '在作品详情页面底部的评论区输入您的想法，可以询问参数细节、分享创作心得或表达喜爱。'
          },
          howToShare: {
            question: '如何分享作品？',
            answer: '点击作品的分享按钮，可以复制链接分享给朋友，或分享到社交媒体平台。'
          }
        }
      },
      profile: {
        title: '个人资料',
        questions: {
          editProfile: {
            question: '如何完善个人资料？',
            answer: '进入"设置"页面，可以修改头像、用户名、个人简介等信息。完善的资料有助于其他用户了解您。'
          },
          changePassword: {
            question: '如何修改密码？',
            answer: '在"设置"页面的"安全设置"部分，输入当前密码和新密码即可修改。建议使用强密码保护账号安全。'
          },
          viewStats: {
            question: '如何查看我的作品统计？',
            answer: '在"个人中心"页面可以查看您的作品数量、获得的收藏数、关注者数量等统计信息。'
          }
        }
      },
      midjourneyParams: {
        title: 'Midjourney风格参数指南',
        questions: {
          whatAreParams: {
            question: '什么是Midjourney风格参数？',
            answer: 'Midjourney风格参数是用于控制AI生成图像效果的特殊指令，通过在提示词后添加参数（如 --v 6、--ar 16:9、--s 750等）来调整图像的版本、比例、风格化程度等属性。'
          },
          basicFormat: {
            question: '基础参数格式和使用规则',
            answer: '参数必须放在提示词的最后，以双横线开头（--），参数与提示词之间用空格分隔。例如："beautiful landscape --v 6 --ar 16:9 --s 500"。不要在参数中使用逗号、句号等标点符号。'
          },
          versionParam: {
            question: '版本参数 --v 如何使用？',
            answer: '版本参数控制使用哪个Midjourney模型。当前可用版本：--v 7.0（最新）、--v 6.1、--v 6.0、--v 5.2。不同版本在图像质量、细节处理和风格上各有特色。默认使用最新版本，建议新手使用 --v 6.1 获得更好的效果。'
          },
          aspectRatio: {
            question: '宽高比参数 --ar 怎么设置？',
            answer: '宽高比参数控制图像的长宽比例。常用比例：--ar 1:1（正方形）、--ar 16:9（宽屏）、--ar 9:16（竖屏）、--ar 3:2（相机比例）、--ar 2:3（肖像比例）。默认为 1:1。'
          }
        }
      },
      promptLibrary: {
        title: '提示词库',
        questions: {
          whatIsPromptLibrary: {
            question: '什么是提示词库？',
            answer: '提示词库是一个收集和分享优质 AI 绘画提示词的平台。用户可以在这里发现、创建和分享各种风格的提示词，帮助生成更好的 AI 艺术作品。'
          },
          howToCreatePrompt: {
            question: '如何创建提示词？',
            answer: '点击"创建提示词"按钮，填写提示词标题、内容、描述等信息，选择合适的分类和难度等级，上传示例图片，最后发布即可。'
          },
          promptCategories: {
            question: '提示词有哪些分类？',
            answer: '提示词分为多个分类：人物肖像、风景自然、抽象艺术、建筑设计、动物宠物、科幻未来、复古怀旧、卡通动漫等，方便用户按需查找。'
          },
          difficultyLevels: {
            question: '难度等级是什么意思？',
            answer: '难度等级分为初级、中级、高级三个层次。初级适合新手，中级适合有一定经验的用户，高级适合专业用户和复杂创作需求。'
          },
          howToUsePrompts: {
            question: '如何使用他人的提示词？',
            answer: '浏览提示词详情页面，点击"复制提示词"按钮即可复制到剪贴板，然后粘贴到您的 AI 绘画工具中使用。记得根据需要调整参数。'
          },
          promptTips: {
            question: '创建优质提示词的技巧？',
            answer: '1. 描述要具体明确；2. 合理使用风格关键词；3. 添加适当的参数设置；4. 提供清晰的示例图片；5. 写好详细的使用说明和技巧。'
          }
        }
      }
    },
    quickNavigation: '快速导航',
    contact: {
      title: '还有其他问题？',
      description: '如果您没有找到想要的答案，欢迎随时联系我们的支持团队',
      emailButton: '发送邮件',
      wechat: '微信: RPW000'
    }
  },
  'en-US': {
    title: 'Help Center',
    subtitle: 'Frequently Asked Questions',
    searchPlaceholder: 'Search questions...',
    sections: {
      gettingStarted: {
        title: 'Getting Started',
        questions: {
          howToRegister: {
            question: 'How to register an account?',
            answer: 'Click the "Register" button in the top right corner, fill in your username, email, and password to complete registration. After registration, you can publish works and favorite content you like.'
          },
          howToLogin: {
            question: 'How to log in?',
            answer: 'Click the "Login" button in the top right corner, enter your email and password to log in. If you forget your password, you can reset it via email.'
          },
          firstSteps: {
            question: 'What should I do when using for the first time?',
            answer: 'We recommend first browsing the "Explore" page to understand the platform content, then complete your profile, start following creators you\'re interested in, and finally try publishing your first work.'
          }
        }
      },
      creatingPosts: {
        title: 'Publishing Works',
        questions: {
          howToPost: {
            question: 'How to publish new works?',
            answer: 'After logging in, click the "Create" button or the "+" icon in the top right corner, upload images or videos, fill in the title, description, and Midjourney parameters, then click publish.'
          },
          supportedFormats: {
            question: 'What file formats are supported?',
            answer: 'Images support JPG, PNG, GIF, WEBP formats, videos support MP4 format. Single file size should not exceed 200MB, up to 9 files can be uploaded at once.'
          },
          addingParams: {
            question: 'How to add Midjourney parameters?',
            answer: 'Enter the complete Midjourney prompt in the "Parameters" field on the publish page, including main description, style parameters, aspect ratio settings, etc. This helps other users learn and reference.'
          },
          editPosts: {
            question: 'Can I edit published works?',
            answer: 'Currently editing published works is not supported. Please check content carefully before publishing. If modification is needed, you can delete and republish.'
          }
        }
      },
      browsing: {
        title: 'Browsing and Discovery',
        questions: {
          howToSearch: {
            question: 'How to search for works?',
            answer: 'Use the search box at the top to enter keywords, you can search titles, descriptions, tags, etc. Supports sorting by time, popularity, favorites count, etc.'
          },
          usingTags: {
            question: 'How to use tags?',
            answer: 'Click on tags below works to view other works with the same tags. You can also use tags for filtering when searching.'
          },
          featuredWorks: {
            question: 'What are featured works?',
            answer: 'Featured works are high-quality content selected by administrators, usually with excellent visual effects and practical parameter reference value.'
          }
        }
      },
      interaction: {
        title: 'Interactive Features',
        questions: {
          howToFavorite: {
            question: 'How to favorite works?',
            answer: 'Click the heart icon in the bottom right corner of the work to favorite it. Favorited works can be viewed on the "My Favorites" page.'
          },
          howToFollow: {
            question: 'How to follow other users?',
            answer: 'Visit the user\'s homepage and click the "Follow" button. After following, you can see their latest works on the homepage.'
          },
          howToComment: {
            question: 'How to comment on works?',
            answer: 'Enter your thoughts in the comment section at the bottom of the work detail page. You can ask about parameter details, share creative insights, or express appreciation.'
          },
          howToShare: {
            question: 'How to share works?',
            answer: 'Click the share button on the work to copy the link to share with friends, or share to social media platforms.'
          }
        }
      },
      profile: {
        title: 'Profile',
        questions: {
          editProfile: {
            question: 'How to complete personal profile?',
            answer: 'Go to the "Settings" page where you can modify avatar, username, personal bio, and other information. A complete profile helps other users understand you.'
          },
          changePassword: {
            question: 'How to change password?',
            answer: 'In the "Security Settings" section of the "Settings" page, enter your current password and new password to modify. We recommend using a strong password to protect account security.'
          },
          viewStats: {
            question: 'How to view my work statistics?',
            answer: 'On the "Profile" page, you can view your work count, favorites received, follower count, and other statistical information.'
          }
        }
      },
      midjourneyParams: {
        title: 'Midjourney Style Parameters Guide',
        questions: {
          whatAreParams: {
            question: 'What are Midjourney style parameters?',
            answer: 'Midjourney style parameters are special instructions used to control AI-generated image effects. By adding parameters after prompts (like --v 6, --ar 16:9, --s 750, etc.), you can adjust image version, aspect ratio, stylization level, and other attributes.'
          },
          basicFormat: {
            question: 'Basic parameter format and usage rules',
            answer: 'Parameters must be placed at the end of the prompt, starting with double dashes (--), separated from the prompt by spaces. For example: "beautiful landscape --v 6 --ar 16:9 --s 500". Do not use commas, periods, or other punctuation in parameters.'
          },
          versionParam: {
            question: 'How to use version parameter --v?',
            answer: 'Version parameter controls which Midjourney model to use. Currently available versions: --v 7.0 (latest), --v 6.1, --v 6.0, --v 5.2. Different versions have their own characteristics in image quality, detail processing, and style. Default uses the latest version, beginners are recommended to use --v 6.1 for better results.'
          },
          aspectRatio: {
            question: 'How to set aspect ratio parameter --ar?',
            answer: 'Aspect ratio parameter controls the width-to-height ratio of the image. Common ratios: --ar 1:1 (square), --ar 16:9 (widescreen), --ar 9:16 (portrait), --ar 3:2 (camera ratio), --ar 2:3 (portrait ratio). Default is 1:1.'
          }
        }
      },
      promptLibrary: {
        title: 'Prompt Library',
        questions: {
          whatIsPromptLibrary: {
            question: 'What is the Prompt Library?',
            answer: 'The Prompt Library is a platform for collecting and sharing high-quality AI art prompts. Users can discover, create, and share various style prompts to help generate better AI artwork.'
          },
          howToCreatePrompt: {
            question: 'How to create a prompt?',
            answer: 'Click the "Create Prompt" button, fill in the prompt title, content, description, select appropriate category and difficulty level, upload example images, and then publish.'
          },
          promptCategories: {
            question: 'What are the prompt categories?',
            answer: 'Prompts are divided into multiple categories: Portrait, Landscape & Nature, Abstract Art, Architecture, Animals & Pets, Sci-Fi & Future, Retro & Vintage, Cartoon & Anime, etc., making it easy for users to find what they need.'
          },
          difficultyLevels: {
            question: 'What do difficulty levels mean?',
            answer: 'Difficulty levels are divided into three tiers: Beginner, Intermediate, and Advanced. Beginner is suitable for newcomers, Intermediate for users with some experience, and Advanced for professional users and complex creative needs.'
          },
          howToUsePrompts: {
            question: 'How to use others\' prompts?',
            answer: 'Browse the prompt detail page and click the "Copy Prompt" button to copy it to your clipboard, then paste it into your AI art tool. Remember to adjust parameters as needed.'
          },
          promptTips: {
            question: 'Tips for creating quality prompts?',
            answer: '1. Be specific and clear in descriptions; 2. Use style keywords appropriately; 3. Add proper parameter settings; 4. Provide clear example images; 5. Write detailed usage instructions and tips.'
          }
        }
      }
    },
    quickNavigation: 'Quick Navigation',
    contact: {
      title: 'Have other questions?',
      description: 'If you didn\'t find the answer you were looking for, feel free to contact our support team anytime',
      emailButton: 'Send Email',
      wechat: 'WeChat: RPW000'
    }
  },
  'ja-JP': {
    title: 'ヘルプセンター',
    subtitle: 'よくある質問',
    searchPlaceholder: '質問を検索...',
    sections: {
      gettingStarted: {
        title: '始め方',
        questions: {
          howToRegister: {
            question: 'アカウントの登録方法は？',
            answer: '右上の「登録」ボタンをクリックし、ユーザー名、メールアドレス、パスワードを入力して登録を完了してください。登録後、作品の投稿やお気に入りのコンテンツの保存ができます。'
          },
          howToLogin: {
            question: 'ログイン方法は？',
            answer: '右上の「ログイン」ボタンをクリックし、メールアドレスとパスワードを入力してログインしてください。パスワードを忘れた場合は、メールでリセットできます。'
          },
          firstSteps: {
            question: '初回使用時に何をすべきですか？',
            answer: 'まず「発見」ページを閲覧してプラットフォームのコンテンツを理解し、次にプロフィールを完成させ、興味のあるクリエイターをフォローし、最後に最初の作品を投稿してみることをお勧めします。'
          }
        }
      },
      creatingPosts: {
        title: '作品の投稿',
        questions: {
          howToPost: {
            question: '新しい作品を投稿するには？',
            answer: 'ログイン後、「作成」ボタンまたは右上の「+」アイコンをクリックし、画像や動画をアップロードし、タイトル、説明、Midjourneyパラメータを入力して投稿をクリックしてください。'
          },
          supportedFormats: {
            question: 'サポートされているファイル形式は？',
            answer: '画像はJPG、PNG、GIF、WEBP形式、動画はMP4形式をサポートしています。単一ファイルサイズは200MBを超えず、一度に最大9ファイルまでアップロードできます。'
          },
          addingParams: {
            question: 'Midjourneyパラメータの追加方法は？',
            answer: '投稿ページの「パラメータ」フィールドに、主要な説明、スタイルパラメータ、アスペクト比設定などを含む完全なMidjourneyプロンプトを入力してください。これは他のユーザーの学習と参考に役立ちます。'
          },
          editPosts: {
            question: '投稿済みの作品を編集できますか？',
            answer: '現在、投稿済みの作品の編集はサポートされていません。投稿前に内容を慎重に確認してください。修正が必要な場合は、削除して再投稿できます。'
          }
        }
      },
      browsing: {
        title: '閲覧と発見',
        questions: {
          howToSearch: {
            question: '作品の検索方法は？',
            answer: '上部の検索ボックスにキーワードを入力して、タイトル、説明、タグなどのコンテンツを検索できます。時間、人気度、お気に入り数などで並び替えもサポートしています。'
          },
          usingTags: {
            question: 'タグの使用方法は？',
            answer: '作品下のタグをクリックすると、同じタグの他の作品を表示できます。検索時にタグを使用してフィルタリングすることもできます。'
          },
          featuredWorks: {
            question: '注目作品とは何ですか？',
            answer: '注目作品は管理者が選んだ高品質なコンテンツで、通常優れた視覚効果と実用的なパラメータ参考価値を持っています。'
          }
        }
      },
      interaction: {
        title: 'インタラクション機能',
        questions: {
          howToFavorite: {
            question: '作品をお気に入りに追加するには？',
            answer: '作品の右下のハートアイコンをクリックしてお気に入りに追加できます。お気に入りの作品は「マイお気に入り」ページで確認できます。'
          },
          howToFollow: {
            question: '他のユーザーをフォローするには？',
            answer: 'ユーザーのホームページにアクセスし、「フォロー」ボタンをクリックしてください。フォロー後、ホームページで彼らの最新作品を見ることができます。'
          },
          howToComment: {
            question: '作品にコメントするには？',
            answer: '作品詳細ページ下部のコメント欄にあなたの考えを入力してください。パラメータの詳細を質問したり、創作の心得を共有したり、愛を表現したりできます。'
          },
          howToShare: {
            question: '作品を共有するには？',
            answer: '作品の共有ボタンをクリックして、リンクをコピーして友達と共有したり、ソーシャルメディアプラットフォームに共有したりできます。'
          }
        }
      },
      profile: {
        title: 'プロフィール',
        questions: {
          editProfile: {
            question: '個人プロフィールを完成させるには？',
            answer: '「設定」ページに移動して、アバター、ユーザー名、個人紹介などの情報を修正できます。完成したプロフィールは他のユーザーがあなたを理解するのに役立ちます。'
          },
          changePassword: {
            question: 'パスワードを変更するには？',
            answer: '「設定」ページの「セキュリティ設定」セクションで、現在のパスワードと新しいパスワードを入力して変更できます。アカウントのセキュリティを保護するために強力なパスワードの使用をお勧めします。'
          },
          viewStats: {
            question: '作品統計を確認するには？',
            answer: '「プロフィール」ページで、作品数、獲得したお気に入り数、フォロワー数などの統計情報を確認できます。'
          }
        }
      },
      midjourneyParams: {
        title: 'Midjourneyスタイルパラメータガイド',
        questions: {
          whatAreParams: {
            question: 'Midjourneyスタイルパラメータとは何ですか？',
            answer: 'MidjourneyスタイルパラメータはAI生成画像の効果を制御するための特別な指示です。プロンプトの後にパラメータ（--v 6、--ar 16:9、--s 750など）を追加することで、画像のバージョン、アスペクト比、スタイル化レベルなどの属性を調整できます。'
          },
          basicFormat: {
            question: '基本パラメータ形式と使用ルール',
            answer: 'パラメータはプロンプトの最後に配置し、ダブルダッシュ（--）で始まり、プロンプトとはスペースで区切る必要があります。例："beautiful landscape --v 6 --ar 16:9 --s 500"。パラメータにはコンマ、ピリオドなどの句読点を使用しないでください。'
          },
          versionParam: {
            question: 'バージョンパラメータ --v の使用方法は？',
            answer: 'バージョンパラメータは使用するMidjourneyモデルを制御します。現在利用可能なバージョン：--v 7.0（最新）、--v 6.1、--v 6.0、--v 5.2。異なるバージョンは画像品質、詳細処理、スタイルにそれぞれ特徴があります。デフォルトは最新バージョンを使用し、初心者には --v 6.1 をお勧めします。'
          },
          aspectRatio: {
            question: 'アスペクト比パラメータ --ar の設定方法は？',
            answer: 'アスペクト比パラメータは画像の幅と高さの比率を制御します。一般的な比率：--ar 1:1（正方形）、--ar 16:9（ワイドスクリーン）、--ar 9:16（ポートレート）、--ar 3:2（カメラ比率）、--ar 2:3（ポートレート比率）。デフォルトは1:1です。'
          }
        }
      },
      promptLibrary: {
        title: 'プロンプトライブラリ',
        questions: {
          whatIsPromptLibrary: {
            question: 'プロンプトライブラリとは何ですか？',
            answer: 'プロンプトライブラリは高品質なAIアートプロンプトを収集・共有するプラットフォームです。ユーザーは様々なスタイルのプロンプトを発見、作成、共有して、より良いAIアートワークの生成に役立てることができます。'
          },
          howToCreatePrompt: {
            question: 'プロンプトの作成方法は？',
            answer: '「プロンプト作成」ボタンをクリックし、プロンプトのタイトル、内容、説明を入力し、適切なカテゴリと難易度レベルを選択し、サンプル画像をアップロードして公開します。'
          },
          promptCategories: {
            question: 'プロンプトのカテゴリは何がありますか？',
            answer: 'プロンプトは複数のカテゴリに分かれています：ポートレート、風景・自然、抽象アート、建築、動物・ペット、SF・未来、レトロ・ヴィンテージ、カートゥーン・アニメなど、ユーザーが必要に応じて見つけやすくなっています。'
          },
          difficultyLevels: {
            question: '難易度レベルとは何ですか？',
            answer: '難易度レベルは初級、中級、上級の3段階に分かれています。初級は初心者向け、中級は経験のあるユーザー向け、上級は専門ユーザーや複雑な創作ニーズ向けです。'
          },
          howToUsePrompts: {
            question: '他の人のプロンプトの使用方法は？',
            answer: 'プロンプト詳細ページを閲覧し、「プロンプトをコピー」ボタンをクリックしてクリップボードにコピーし、AIアートツールに貼り付けて使用します。必要に応じてパラメータを調整することを忘れないでください。'
          },
          promptTips: {
            question: '高品質なプロンプト作成のコツは？',
            answer: '1. 具体的で明確な説明をする；2. スタイルキーワードを適切に使用する；3. 適切なパラメータ設定を追加する；4. 明確なサンプル画像を提供する；5. 詳細な使用説明とコツを書く。'
          }
        }
      }
    },
    quickNavigation: 'クイックナビゲーション',
    contact: {
      title: '他にご質問はありますか？',
      description: 'お探しの回答が見つからない場合は、いつでもサポートチームにお気軽にお問い合わせください',
      emailButton: 'メール送信',
      wechat: 'WeChat: RPW000'
    }
  }
};