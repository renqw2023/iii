export const createPrompt = {
  'zh-CN': {
    title: '创建提示词',
    subtitle: '分享您的 Midjourney 提示词，帮助其他创作者获得灵感',
    
    basicInfo: {
      title: '基本信息',
      titleLabel: '提示词标题',
      titlePlaceholder: '为您的提示词起一个吸引人的标题',
      titleRequired: '请输入提示词标题',
      promptLabel: '提示词内容',
      promptPlaceholder: '输入您的 Midjourney 提示词，例如：a beautiful sunset over mountains, cinematic lighting, ultra realistic',
      promptRequired: '请输入提示词内容',
      promptMinLength: '提示词内容至少需要10个字符',
      promptMaxLength: '提示词内容不能超过5000个字符',
      descriptionLabel: '描述说明',
      descriptionPlaceholder: '描述这个提示词的用途、特点或使用场景（可选）',
      categoryLabel: '分类',
      difficultyLabel: '难度等级',
      tagsLabel: '标签',
      tagsPlaceholder: '输入标签后按回车键添加，最多10个标签'
    },
    
    categories: {
      other: '其他',
      character: '人物角色',
      landscape: '风景景观',
      architecture: '建筑设计',
      abstract: '抽象艺术',
      fantasy: '奇幻魔法',
      scifi: '科幻未来',
      portrait: '肖像写真',
      animal: '动物生物',
      object: '物品静物',
      style: '风格技法'
    },
    
    difficulty: {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级'
    },
    
    styleParams: {
      title: 'Midjourney 风格参数',
      sref: '风格参考 (--sref)',
      style: '风格模式 (--style)',
      selectStyle: '选择风格模式',
      stylize: '风格化程度 (--stylize)',
      chaos: '混乱度 (--chaos)',
      aspect: '画面比例 (--ar)',
      selectAspect: '选择画面比例',
      aspect11: '正方形 (1:1)',
      aspect169: '宽屏 (16:9)',
      aspect916: '竖屏 (9:16)',
      version: '版本 (--v)',
      selectVersion: '选择版本',
      videoVersion: '视频版本 (--video)',
      quality: '质量 (--q)',
      selectQuality: '选择质量',
      quality025: '快速 (0.25)',
      quality1: '标准 (1)',
      quality2: '高质量 (2)',
      seed: '种子值 (--seed)',
      otherParams: '其他参数',
      otherParamsPlaceholder: '输入其他 Midjourney 参数，如 --tile, --no 等',
      fullPreview: '完整提示词预览',
      promptCopied: '提示词已复制到剪贴板'
    },
    
    advanced: {
      title: '高级信息',
      expectedResultLabel: '预期效果',
      expectedResultPlaceholder: '描述使用这个提示词预期能生成什么样的图像效果',
      tipsLabel: '使用技巧',
      tipsPlaceholder: '分享使用这个提示词的技巧、注意事项或建议'
    },
    
    upload: {
      title: '示例图片',
      description: '上传使用此提示词生成的示例图片或视频（可选，最多9个文件）',
      dragOrClick: '拖拽文件到此处或点击上传',
      dropToUpload: '松开鼠标上传文件',
      supportedFiles: '支持 JPEG、PNG、GIF、WEBP、MP4、MOV、AVI 格式，单个文件最大 200MB',
      preview: '预览',
      altText: '图片描述',
      altTextPlaceholder: '为看不到图片的用户描述图片内容...',
      videoAltText: '视频描述',
      videoAltTextPlaceholder: '为看不到视频的用户描述视频内容...',
      dragDropFiles: '拖拽文件到此处或点击上传',
      supportedFormats: '支持格式',
      maxFileSize: '最大文件大小',
      optional: '可选'
    },
    
    promptPreview: '提示词预览',
    basicPrompt: '基础提示词',
    copy: '复制',
    promptPreviewPlaceholder: '在这里输入您的提示词...',
    fullPrompt: '完整提示词',
    fullPromptPreviewPlaceholder: '完整提示词将在这里显示...',
    previewNote: '预览说明',
    previewNoteText: '这是根据您输入的参数生成的完整提示词预览',
    advancedInfo: '高级信息',
    expectedEffect: '预期效果',
    usageTips: '使用技巧',
    
    buttons: {
      cancel: '取消',
      publishing: '发布中...',
      publish: '发布提示词'
    },
    
    error: {
      fileTooLarge: '文件大小超过限制（最大200MB）',
      fileTypeInvalid: '不支持的文件类型',
      promptTooShort: '提示词内容至少需要10个字符',
      publishFailed: '发布失败，请稍后重试'
    },
    
    success: {
      published: '提示词发布成功！',
      createSuccess: '提示词创建成功！'
    }
  },
  
  'en-US': {
    title: 'Create Prompt',
    subtitle: 'Share your Midjourney prompts to inspire other creators',
    
    basicInfo: {
      title: 'Basic Information',
      titleLabel: 'Prompt Title',
      titlePlaceholder: 'Give your prompt an attractive title',
      titleRequired: 'Please enter prompt title',
      promptLabel: 'Prompt Content',
      promptPlaceholder: 'Enter your Midjourney prompt, e.g.: a beautiful sunset over mountains, cinematic lighting, ultra realistic',
      promptRequired: 'Please enter prompt content',
      promptMinLength: 'Prompt content must be at least 10 characters',
      promptMaxLength: 'Prompt content cannot exceed 5000 characters',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Describe the purpose, features, or use cases of this prompt (optional)',
      categoryLabel: 'Category',
      difficultyLabel: 'Difficulty Level',
      tagsLabel: 'Tags',
      tagsPlaceholder: 'Enter tags and press Enter to add, maximum 10 tags'
    },
    
    categories: {
      other: 'Other',
      character: 'Character',
      landscape: 'Landscape',
      architecture: 'Architecture',
      abstract: 'Abstract',
      fantasy: 'Fantasy',
      scifi: 'Sci-Fi',
      portrait: 'Portrait',
      animal: 'Animal',
      object: 'Object',
      style: 'Style'
    },
    
    difficulty: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    },
    
    styleParams: {
      title: 'Midjourney Style Parameters',
      sref: 'Style Reference (--sref)',
      style: 'Style Mode (--style)',
      selectStyle: 'Select style mode',
      stylize: 'Stylize (--stylize)',
      chaos: 'Chaos (--chaos)',
      aspect: 'Aspect Ratio (--ar)',
      selectAspect: 'Select aspect ratio',
      aspect11: 'Square (1:1)',
      aspect169: 'Widescreen (16:9)',
      aspect916: 'Portrait (9:16)',
      version: 'Version (--v)',
      selectVersion: 'Select version',
      videoVersion: 'Video Version (--video)',
      quality: 'Quality (--q)',
      selectQuality: 'Select quality',
      quality025: 'Fast (0.25)',
      quality1: 'Standard (1)',
      quality2: 'High Quality (2)',
      seed: 'Seed (--seed)',
      otherParams: 'Other Parameters',
      otherParamsPlaceholder: 'Enter other Midjourney parameters like --tile, --no, etc.',
      fullPreview: 'Full Prompt Preview',
      promptCopied: 'Prompt copied to clipboard'
    },
    
    advanced: {
      title: 'Advanced Information',
      expectedResultLabel: 'Expected Result',
      expectedResultPlaceholder: 'Describe what kind of image effects this prompt is expected to generate',
      tipsLabel: 'Usage Tips',
      tipsPlaceholder: 'Share tips, precautions, or suggestions for using this prompt'
    },
    
    upload: {
      title: 'Example Images',
      description: 'Upload example images or videos generated with this prompt (optional, max 9 files)',
      dragOrClick: 'Drag files here or click to upload',
      dropToUpload: 'Release to upload files',
      supportedFiles: 'Supports JPEG, PNG, GIF, WEBP, MP4, MOV, AVI formats, max 200MB per file',
      preview: 'Preview',
      altText: 'Image Description',
      altTextPlaceholder: 'Describe the image content for users who cannot see it...',
      videoAltText: 'Video Description',
      videoAltTextPlaceholder: 'Describe the video content for users who cannot see it...',
      dragDropFiles: 'Drag files here or click to upload',
      supportedFormats: 'Supported Formats',
      maxFileSize: 'Max File Size',
      optional: 'Optional'
    },
    
    promptPreview: 'Prompt Preview',
    basicPrompt: 'Basic Prompt',
    copy: 'Copy',
    promptPreviewPlaceholder: 'Enter your prompt here...',
    fullPrompt: 'Full Prompt',
    fullPromptPreviewPlaceholder: 'Full prompt will be displayed here...',
    previewNote: 'Preview Note',
    previewNoteText: 'This is the complete prompt preview generated from your input parameters',
    advancedInfo: 'Advanced Information',
    expectedEffect: 'Expected Effect',
    usageTips: 'Usage Tips',
    
    buttons: {
      cancel: 'Cancel',
      publishing: 'Publishing...',
      publish: 'Publish Prompt'
    },
    
    error: {
      fileTooLarge: 'File size exceeds limit (max 200MB)',
      fileTypeInvalid: 'Unsupported file type',
      promptTooShort: 'Prompt content must be at least 10 characters',
      publishFailed: 'Publish failed, please try again later'
    },
    
    success: {
      published: 'Prompt published successfully!',
      createSuccess: 'Prompt created successfully!'
    }
  },
  
  'ja-JP': {
    title: 'プロンプト作成',
    subtitle: 'あなたのMidjourneyプロンプトを共有して、他のクリエイターにインスピレーションを与えましょう',
    
    basicInfo: {
      title: '基本情報',
      titleLabel: 'プロンプトタイトル',
      titlePlaceholder: 'プロンプトに魅力的なタイトルを付けてください',
      titleRequired: 'プロンプトタイトルを入力してください',
      promptLabel: 'プロンプト内容',
      promptPlaceholder: 'Midjourneyプロンプトを入力してください。例：a beautiful sunset over mountains, cinematic lighting, ultra realistic',
      promptRequired: 'プロンプト内容を入力してください',
      promptMinLength: 'プロンプト内容は最低10文字必要です',
      promptMaxLength: 'プロンプト内容は5000文字を超えることはできません',
      descriptionLabel: '説明',
      descriptionPlaceholder: 'このプロンプトの用途、特徴、使用場面を説明してください（任意）',
      categoryLabel: 'カテゴリ',
      difficultyLabel: '難易度レベル',
      tagsLabel: 'タグ',
      tagsPlaceholder: 'タグを入力してEnterキーで追加、最大10個のタグ'
    },
    
    categories: {
      other: 'その他',
      character: 'キャラクター',
      landscape: '風景',
      architecture: '建築',
      abstract: '抽象',
      fantasy: 'ファンタジー',
      scifi: 'SF',
      portrait: 'ポートレート',
      animal: '動物',
      object: 'オブジェクト',
      style: 'スタイル'
    },
    
    difficulty: {
      beginner: '初級',
      intermediate: '中級',
      advanced: '上級'
    },
    
    styleParams: {
      title: 'Midjourneyスタイルパラメータ',
      sref: 'スタイル参照 (--sref)',
      style: 'スタイルモード (--style)',
      selectStyle: 'スタイルモードを選択',
      stylize: 'スタイライズ (--stylize)',
      chaos: 'カオス (--chaos)',
      aspect: 'アスペクト比 (--ar)',
      selectAspect: 'アスペクト比を選択',
      aspect11: '正方形 (1:1)',
      aspect169: 'ワイドスクリーン (16:9)',
      aspect916: 'ポートレート (9:16)',
      version: 'バージョン (--v)',
      selectVersion: 'バージョンを選択',
      videoVersion: 'ビデオバージョン (--video)',
      quality: '品質 (--q)',
      selectQuality: '品質を選択',
      quality025: '高速 (0.25)',
      quality1: '標準 (1)',
      quality2: '高品質 (2)',
      seed: 'シード (--seed)',
      otherParams: 'その他のパラメータ',
      otherParamsPlaceholder: '--tile、--noなどの他のMidjourneyパラメータを入力',
      fullPreview: '完全プロンプトプレビュー',
      promptCopied: 'プロンプトがクリップボードにコピーされました'
    },
    
    advanced: {
      title: '高度な情報',
      expectedResultLabel: '期待される結果',
      expectedResultPlaceholder: 'このプロンプトで生成される画像効果を説明してください',
      tipsLabel: '使用のコツ',
      tipsPlaceholder: 'このプロンプトを使用するためのコツ、注意事項、提案を共有してください'
    },
    
    upload: {
      title: 'サンプル画像',
      description: 'このプロンプトで生成されたサンプル画像や動画をアップロード（任意、最大9ファイル）',
      dragOrClick: 'ファイルをここにドラッグするかクリックしてアップロード',
      dropToUpload: 'マウスを離してファイルをアップロード',
      supportedFiles: 'JPEG、PNG、GIF、WEBP、MP4、MOV、AVI形式をサポート、ファイルあたり最大200MB',
      preview: 'プレビュー',
      altText: '画像説明',
      altTextPlaceholder: '画像を見ることができないユーザーのために画像の内容を説明してください...',
      videoAltText: '動画説明',
      videoAltTextPlaceholder: '動画を見ることができないユーザーのために動画の内容を説明してください...',
      dragDropFiles: 'ファイルをここにドラッグするかクリックしてアップロード',
      supportedFormats: 'サポート形式',
      maxFileSize: '最大ファイルサイズ',
      optional: '任意'
    },
    
    promptPreview: 'プロンプトプレビュー',
    basicPrompt: '基本プロンプト',
    copy: 'コピー',
    promptPreviewPlaceholder: 'ここにプロンプトを入力してください...',
    fullPrompt: '完全プロンプト',
    fullPromptPreviewPlaceholder: '完全プロンプトがここに表示されます...',
    previewNote: 'プレビュー注記',
    previewNoteText: 'これは入力パラメータから生成された完全プロンプトプレビューです',
    advancedInfo: '高度な情報',
    expectedEffect: '期待される効果',
    usageTips: '使用のコツ',
    
    buttons: {
      cancel: 'キャンセル',
      publishing: '公開中...',
      publish: 'プロンプトを公開'
    },
    
    error: {
      fileTooLarge: 'ファイルサイズが制限を超えています（最大200MB）',
      fileTypeInvalid: 'サポートされていないファイルタイプ',
      promptTooShort: 'プロンプト内容は最低10文字必要です',
      publishFailed: '公開に失敗しました。後でもう一度お試しください'
    },
    
    success: {
      published: 'プロンプトが正常に公開されました！',
      createSuccess: 'プロンプトが正常に作成されました！'
    }
  }
};