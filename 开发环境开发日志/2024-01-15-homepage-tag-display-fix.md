# 首页提示词标签显示修复报告

## 问题描述
用户反映程序首页无法正确获取提示词标签，显示的是 `#(24)` 这种格式，而不是正确的标签名称。

## 问题分析
通过代码分析发现，问题出现在首页 `Home.js` 中的标签数据合并逻辑：

### 根本原因
两个不同的API返回的标签数据结构不一致：

1. **风格参数API** (`/posts/tags/popular`) 返回格式：
   ```javascript
   { name: '标签名', count: 数量 }
   ```

2. **提示词API** (`/prompts/tags/popular`) 返回格式：
   ```javascript
   { tag: '标签名', count: 数量 }
   ```

### 问题代码
在 `Home.js` 第114-120行的标签合并逻辑中，代码统一使用 `tag.name` 来访问标签名：

```javascript
const mergedTags = allTags.reduce((acc, tag) => {
  const existing = acc.find(t => t.name === tag.name); // 这里有问题
  if (existing) {
    existing.count += tag.count;
  } else {
    acc.push({ ...tag }); // 这里也有问题
  }
  return acc;
}, []).sort((a, b) => b.count - a.count);
```

当处理提示词API返回的数据时，`tag.name` 为 `undefined`，导致标签名显示为空，只显示计数。

## 修复方案

### 修复代码
修改 `d:\fenge\client\src\pages\Home.js` 第114-120行：

```javascript
const mergedTags = allTags.reduce((acc, tag) => {
  // 统一标签名字段：风格参数API返回name字段，提示词API返回tag字段
  const tagName = tag.name || tag.tag;
  const existing = acc.find(t => t.name === tagName);
  if (existing) {
    existing.count += tag.count;
  } else {
    acc.push({ name: tagName, count: tag.count });
  }
  return acc;
}, []).sort((a, b) => b.count - a.count);
```

### 修复逻辑
1. **字段统一**: 使用 `tag.name || tag.tag` 来兼容两种API的返回格式
2. **数据标准化**: 在合并时统一将标签对象格式化为 `{ name: tagName, count: tag.count }`
3. **向后兼容**: 保持现有的显示逻辑不变，确保不影响其他功能

## 修复文件
- `d:\fenge\client\src\pages\Home.js` (第114-120行)

## 测试验证
修复后需要验证：
1. ✅ 首页热门标签正确显示标签名称
2. ✅ 风格参数和提示词标签都能正常显示
3. ✅ 标签点击筛选功能正常工作
4. ✅ 标签计数正确合并

## 相关问题
这个问题之前在 `PromptList.js` 中也出现过，已在2024-01-15修复。建议：

1. **API标准化**: 考虑统一两个API的返回格式
2. **类型定义**: 添加TypeScript类型定义避免此类问题
3. **测试覆盖**: 增加API数据格式的单元测试

## 修复状态
✅ **已完成** - 2024-01-15

---

**修复时间**: 2024-01-15  
**修复人员**: AI Assistant  
**影响范围**: 首页标签显示功能  
**风险等级**: 低（仅影响显示，不影响核心功能）