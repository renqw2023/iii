export const imageUpload = {
  'zh-CN': {
    imageUpload: {
      dragHere: '拖拽文件到这里',
      dropHere: '释放文件到这里',
      or: '或者',
      clickToSelect: '点击选择文件',
      supportedFiles: '支持图片和视频文件',
      fileLimits: '最大 {{maxSize}}MB，最多 {{maxFiles}} 个文件',
      uploading: '上传中...',
      startUpload: '开始上传',
      errors: {
        fileTooLarge: '文件 {{fileName}} 太大，最大支持 {{maxSize}}MB',
        invalidFileType: '文件 {{fileName}} 格式不支持',
        tooManyFiles: '最多只能上传 {{maxFiles}} 个文件',
        uploadFailed: '部分文件上传失败'
      },
      messages: {
        uploadSuccess: '文件上传成功'
      }
    }
  },
  'en-US': {
    imageUpload: {
      dragHere: 'Drag files here',
      dropHere: 'Drop files here',
      or: 'or',
      clickToSelect: 'click to select files',
      supportedFiles: 'Supports image and video files',
      fileLimits: 'Max {{maxSize}}MB, up to {{maxFiles}} files',
      uploading: 'Uploading...',
      startUpload: 'Start Upload',
      errors: {
        fileTooLarge: 'File {{fileName}} is too large, max {{maxSize}}MB supported',
        invalidFileType: 'File {{fileName}} format not supported',
        tooManyFiles: 'Can only upload up to {{maxFiles}} files',
        uploadFailed: 'Some files failed to upload'
      },
      messages: {
        uploadSuccess: 'Files uploaded successfully'
      }
    }
  },
  'ja-JP': {
    imageUpload: {
      dragHere: 'ファイルをここにドラッグ',
      dropHere: 'ファイルをここにドロップ',
      or: 'または',
      clickToSelect: 'クリックしてファイルを選択',
      supportedFiles: '画像と動画ファイルをサポート',
      fileLimits: '最大{{maxSize}}MB、最大{{maxFiles}}ファイル',
      uploading: 'アップロード中...',
      startUpload: 'アップロード開始',
      errors: {
        fileTooLarge: 'ファイル{{fileName}}が大きすぎます。最大{{maxSize}}MBまでサポート',
        invalidFileType: 'ファイル{{fileName}}の形式はサポートされていません',
        tooManyFiles: '最大{{maxFiles}}ファイルまでアップロード可能',
        uploadFailed: '一部のファイルのアップロードに失敗しました'
      },
      messages: {
        uploadSuccess: 'ファイルが正常にアップロードされました'
      }
    }
  }
};

export default imageUpload;