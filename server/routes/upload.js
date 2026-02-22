const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { auth } = require('../middleware/auth');
const config = require('../config');

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

const router = express.Router();

// 确保上传目录存在
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 生成视频缩略图
const generateVideoThumbnail = (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'], // 提取第1秒的帧
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '300x300'
      })
      .on('end', () => {
        console.log('视频缩略图生成成功:', thumbnailPath);
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error('视频缩略图生成失败:', err);
        reject(err);
      });
  });
};

// 异步处理视频缩略图
const processVideoThumbnail = async (videoFilePath, videoFileName, userId) => {
  try {
    const userThumbnailDir = path.join(config.upload.path, 'thumbnails', userId);
    ensureDirectoryExists(userThumbnailDir);
    
    const thumbnailFileName = videoFileName.replace(/\.[^/.]+$/, '.jpg');
    const thumbnailPath = path.join(userThumbnailDir, thumbnailFileName);
    
    await generateVideoThumbnail(videoFilePath, thumbnailPath);
    
    return {
      thumbnailPath,
      thumbnailUrl: `/uploads/thumbnails/${userId}/${thumbnailFileName}`
    };
  } catch (error) {
    console.error('处理视频缩略图失败:', error);
    return null;
  }
};

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 获取用户ID
    const userId = req.userId;
    let uploadPath;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(config.upload.path, 'images', userId);
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = path.join(config.upload.path, 'videos', userId);
    } else {
      uploadPath = path.join(config.upload.path, userId);
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = [...config.upload.allowedImageTypes, ...config.upload.allowedVideoTypes];
  const isAllowed = allowedTypes.includes(file.mimetype);
  
  if (isAllowed) {
    return cb(null, true);
  } else {
    cb(new Error('只支持图片和视频文件'));
  }
};

// 创建multer实例
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles
  },
  fileFilter
});

// 单文件上传
router.post('/single', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const userId = req.userId;
    const fileType = isVideo ? 'videos' : 'images';
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${fileType}/${userId}/${req.file.filename}`,
      type: isVideo ? 'video' : 'image'
    };

    // 如果是视频文件，生成缩略图
    if (isVideo) {
      const thumbnailResult = await processVideoThumbnail(req.file.path, req.file.filename, userId);
      if (thumbnailResult) {
        fileInfo.thumbnailUrl = thumbnailResult.thumbnailUrl;
      }
    }

    res.json({
      message: '文件上传成功',
      file: fileInfo
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ message: '文件上传失败' });
  }
});

// 多文件上传
router.post('/multiple', auth, upload.array('files', 9), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const userId = req.userId;
    const files = await Promise.all(req.files.map(async (file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const fileType = isVideo ? 'videos' : 'images';
      const fileInfo = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${fileType}/${userId}/${file.filename}`,
        type: isVideo ? 'video' : 'image'
      };

      // 如果是视频文件，生成缩略图
      if (isVideo) {
        const thumbnailResult = await processVideoThumbnail(file.path, file.filename, userId);
        if (thumbnailResult) {
          fileInfo.thumbnailUrl = thumbnailResult.thumbnailUrl;
        }
      }

      return fileInfo;
    }));

    res.json({
      message: '文件上传成功',
      files
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ message: '文件上传失败' });
  }
});

// 头像上传
router.post('/avatar', auth, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传头像文件' });
    }

    // 只允许图片文件作为头像
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: '头像只能是图片文件' });
    }

    const userId = req.userId;
    const avatarInfo = {
      filename: req.file.filename,
      url: `/uploads/images/${userId}/${req.file.filename}`,
      size: req.file.size
    };

    res.json({
      message: '头像上传成功',
      avatar: avatarInfo
    });
  } catch (error) {
    console.error('头像上传错误:', error);
    res.status(500).json({ message: '头像上传失败' });
  }
});

// 删除文件
router.delete('/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const userId = req.userId;
    const possiblePaths = [
      path.join(__dirname, '..', 'uploads', filename), // 兼容旧文件
      path.join(__dirname, '..', 'uploads', 'images', filename), // 兼容旧文件
      path.join(__dirname, '..', 'uploads', 'videos', filename), // 兼容旧文件
      path.join(__dirname, '..', 'uploads', 'images', userId, filename), // 新的用户目录
      path.join(__dirname, '..', 'uploads', 'videos', userId, filename), // 新的用户目录
      path.join(__dirname, '..', 'uploads', 'thumbnails', userId, filename) // 缩略图目录
    ];

    let fileDeleted = false;
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileDeleted = true;
        break;
      }
    }

    if (fileDeleted) {
      res.json({ message: '文件删除成功' });
    } else {
      res.status(404).json({ message: '文件不存在' });
    }
  } catch (error) {
    console.error('文件删除错误:', error);
    res.status(500).json({ message: '文件删除失败' });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制，单个文件最大200MB' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: '文件数量超过限制，最多上传9个文件' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: '上传的文件字段不正确' });
    }
  }
  
  if (error.message === '只支持图片和视频文件') {
    return res.status(400).json({ message: '不支持的文件格式，请选择图片或视频文件' });
  }
  
  res.status(500).json({ message: '文件上传失败，请稍后重试' });
});

module.exports = router;