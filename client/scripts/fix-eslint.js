const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ESLint修复脚本
class ESLintFixer {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.fixedFiles = [];
    this.errors = [];
  }

  // 自动修复可修复的ESLint问题
  autoFix() {
    try {
      console.log('🔧 开始自动修复ESLint问题...');
      
      // 运行ESLint自动修复
      execSync('npx eslint src --fix --ext .js,.jsx,.ts,.tsx', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      
      console.log('✅ ESLint自动修复完成');
    } catch (error) {
      console.log('⚠️  自动修复过程中发现一些需要手动处理的问题');
    }
  }

  // 移除未使用的导入
  removeUnusedImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 跳过明显未使用的导入（简单检测）
      if (line.includes('import') && this.isUnusedImport(line, content)) {
        console.log(`移除未使用的导入: ${line.trim()}`);
        continue;
      }
      
      newLines.push(line);
    }
    
    if (newLines.length !== lines.length) {
      fs.writeFileSync(filePath, newLines.join('\n'));
      this.fixedFiles.push(filePath);
    }
  }

  // 简单检测是否为未使用的导入
  isUnusedImport(importLine, fileContent) {
    // 提取导入的变量名
    const match = importLine.match(/import\s+{?\s*([^}]+)\s*}?\s+from/);
    if (!match) return false;
    
    const imports = match[1].split(',').map(imp => imp.trim().split(' as ')[0]);
    
    // 检查是否在文件中使用
    return imports.every(imp => {
      const regex = new RegExp(`\\b${imp}\\b`, 'g');
      const matches = fileContent.match(regex);
      return !matches || matches.length <= 1; // 只在import语句中出现
    });
  }

  // 添加ESLint禁用注释
  addDisableComments() {
    const commonDisables = [
      {
        pattern: /React Hook useEffect has a missing dependency/,
        comment: '// eslint-disable-next-line react-hooks/exhaustive-deps'
      },
      {
        pattern: /'\w+' is defined but never used/,
        comment: '// eslint-disable-next-line no-unused-vars'
      },
      {
        pattern: /'\w+' is assigned a value but never used/,
        comment: '// eslint-disable-next-line no-unused-vars'
      }
    ];

    // 这里可以添加更复杂的逻辑来自动添加禁用注释
    console.log('💡 对于无法自动修复的问题，请手动添加 eslint-disable 注释');
  }

  // 生成修复报告
  generateReport() {
    const reportPath = path.join(__dirname, '../eslint-fix-report.md');
    const report = `# ESLint修复报告

生成时间: ${new Date().toLocaleString()}

## 已修复文件
${this.fixedFiles.map(file => `- ${file}`).join('\n')}

## 需要手动处理的问题

### 1. 未使用的变量
- 删除未使用的变量声明
- 或在变量名前添加下划线 (_variable) 表示故意未使用

### 2. React Hook依赖
- 添加缺失的依赖到依赖数组
- 或使用 useCallback/useMemo 包装函数
- 或添加 // eslint-disable-next-line react-hooks/exhaustive-deps

### 3. 重复的键
- 检查对象中的重复键并移除

### 4. 匿名默认导出
- 将匿名对象赋值给变量后再导出

## 建议的修复命令
\`\`\`bash
# 自动修复
npm run lint:fix

# 检查剩余问题
npm run lint
\`\`\`
`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`📋 修复报告已生成: ${reportPath}`);
  }

  // 运行完整修复流程
  run() {
    console.log('🚀 开始ESLint修复流程...');
    
    this.autoFix();
    this.addDisableComments();
    this.generateReport();
    
    console.log('✨ ESLint修复流程完成!');
    console.log('📝 请查看生成的报告文件了解详细信息');
  }
}

// 运行修复器
if (require.main === module) {
  const fixer = new ESLintFixer();
  fixer.run();
}

module.exports = ESLintFixer;