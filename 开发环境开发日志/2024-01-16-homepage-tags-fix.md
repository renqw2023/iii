# 首页热门标签显示修复报告

## 问题描述
用户反映程序首页在获取热门标签时出现两个问题：
1. 只显示井号，没有具体的标签内容：`#(19)`
2. 首页应该获取风格参数+提示词两种标签，而不是一种

## 问题分析
通过代码分析发现，问题出现在首页 `Home.js` 中的标签数据合并逻辑：

### 根本原因
两个不同的API返回的标签数据结构不一致：

1. **风格参数API** (`/posts/tags/popular`)：
   ```javascript
   { $project: { name: '$_id', count: 1, _id: 0 } }
   ```
   返回字段：`name`

2. **提示词API** (`/prompts/tags/popular`)：
   ```javascript
   { $project: { tag: '$_id', count: 1, _id: 0 } }
   ```
   返回字段：`tag`

### 原有问题代码
```javascript
allTags.forEach(tag => {
  if (tagMap.has(tag.name)) {
    tagMap.get(tag.name).count += tag.count;
  } else {
    tagMap.set(tag.name, { ...tag });
  }
});
```

这段代码只使用了 `tag.name` 字段，对于提示词API返回的数据（使用`tag.tag`字段），`tag.name` 为 `undefined`，导致标签名显示为空。

## 修复方案

### 修复逻辑
```javascript
allTags.forEach(tag => {
  // 统一标签名字段：风格参数API返回name字段，提示词API返回tag字段
  const tagName = tag.name || tag.tag;
  if (tagName) {
    if (tagMap.has(tagName)) {
      tagMap.get(tagName).count += tag.count;
    } else {
      tagMap.set(tagName, { name: tagName, count: tag.count });
    }
  }
});
```

### 修复要点
1. **字段统一**: 使用 `tag.name || tag.tag` 来兼容两种API的返回格式
2. **空值检查**: 添加 `if (tagName)` 检查，避免处理空标签
3. **数据标准化**: 确保合并后的数据结构统一使用 `name` 字段
4. **计数合并**: 正确合并相同标签的计数

## 修复文件
- `d:\fenge\client\src\pages\Home.js` (第130-150行)

## 修复状态
✅ 已完成

## 预期效果
修复后，首页热门标签应该能够：
1. 正确显示标签名称，而不是只显示井号
2. 同时展示来自风格参数和提示词的热门标签
3. 正确合并相同标签的计数
4. 按照使用频率降序排列

## 测试建议
1. 访问首页，检查热门标签区域是否正确显示标签名称
2. 验证标签计数是否正确
3. 点击标签，确认筛选功能正常工作
4. 检查是否同时包含风格参数和提示词的标签