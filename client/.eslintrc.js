module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // 处理未使用变量的警告
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    
    // 处理React Hook依赖警告
    'react-hooks/exhaustive-deps': 'warn',
    
    // 处理重复键警告
    'no-dupe-keys': 'error',
    
    // 处理匿名默认导出
    'import/no-anonymous-default-export': [
      'warn',
      {
        allowArray: false,
        allowArrowFunction: false,
        allowAnonymousClass: false,
        allowAnonymousFunction: false,
        allowCallExpression: true,
        allowNew: false,
        allowLiteral: false,
        allowObject: true
      }
    ]
  },
  
  // 忽略某些文件
  ignorePatterns: [
    'build/**/*',
    'node_modules/**/*',
    'public/**/*'
  ]
};