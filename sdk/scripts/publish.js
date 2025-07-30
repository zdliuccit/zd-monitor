#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n📋 ${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    log(`✅ ${description} 完成`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} 失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkWorkingDirectory() {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    log('❌ 工作目录不干净，请先提交所有更改', 'red');
    process.exit(1);
  }
  log('✅ 工作目录干净', 'green');
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function updateVersion(type) {
  const validTypes = ['patch', 'minor', 'major'];
  if (!validTypes.includes(type)) {
    log(`❌ 无效的版本类型: ${type}. 使用: ${validTypes.join(', ')}`, 'red');
    process.exit(1);
  }
  
  execCommand(`npm version ${type}`, `更新版本 (${type})`);
  return getCurrentVersion();
}

function buildProject() {
  // 清理旧的构建文件
  execCommand('yarn clean', '清理构建文件');
  
  // 运行类型检查
  execCommand('yarn type-check', 'TypeScript 类型检查');
  
  // 运行构建
  execCommand('yarn build', '构建项目');
  
  // 检查构建输出
  const distFiles = ['index.js', 'index.esm.js', 'web-monitor-sdk.min.js', 'index.d.ts'];
  distFiles.forEach(file => {
    const filePath = path.join('dist', file);
    if (!fs.existsSync(filePath)) {
      log(`❌ 构建文件缺失: ${filePath}`, 'red');
      process.exit(1);
    }
  });
  
  log('✅ 所有构建文件生成成功', 'green');
}

function publishToNpm(tag = 'latest') {
  const validTags = ['latest', 'beta', 'alpha', 'next'];
  if (!validTags.includes(tag)) {
    log(`❌ 无效的发布标签: ${tag}. 使用: ${validTags.join(', ')}`, 'red');
    process.exit(1);
  }
  
  // 检查是否已登录 npm
  try {
    execSync('npm whoami', { encoding: 'utf8' });
  } catch (error) {
    log('❌ 请先登录 npm: npm login', 'red');
    process.exit(1);
  }
  
  execCommand(`npm publish --tag ${tag}`, `发布到 npm (${tag})`);
}

function pushToGit() {
  execCommand('git push', '推送代码到远程仓库');
  execCommand('git push --tags', '推送标签到远程仓库');
}

function generateReleaseNotes(version) {
  const releaseNotes = `
# Release ${version}

## 更新内容

请在此处添加版本更新的详细说明...

## 发布时间

${new Date().toISOString().split('T')[0]}

---

完整的更改日志请查看: [CHANGELOG.md](./CHANGELOG.md)
`;
  
  const releaseNotesPath = `RELEASE_NOTES_${version}.md`;
  fs.writeFileSync(releaseNotesPath, releaseNotes.trim());
  log(`📝 生成发布说明: ${releaseNotesPath}`, 'blue');
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  const tag = args[1] || 'latest';
  const skipBuild = args.includes('--skip-build');
  const skipGit = args.includes('--skip-git');
  
  log('🚀 开始发布流程...', 'blue');
  log(`📦 版本类型: ${versionType}`, 'yellow');
  log(`🏷️  发布标签: ${tag}`, 'yellow');
  
  // 检查工作目录
  if (!skipGit) {
    checkWorkingDirectory();
  }
  
  // 获取当前版本
  const oldVersion = getCurrentVersion();
  log(`📌 当前版本: ${oldVersion}`, 'yellow');
  
  // 更新版本
  const newVersion = updateVersion(versionType);
  log(`🆙 新版本: ${newVersion}`, 'green');
  
  // 构建项目
  if (!skipBuild) {
    buildProject();
  }
  
  // 生成发布说明
  generateReleaseNotes(newVersion);
  
  // 发布到 npm
  publishToNpm(tag);
  
  // 推送到 Git
  if (!skipGit) {
    pushToGit();
  }
  
  log('\n🎉 发布完成!', 'green');
  log(`📦 包名: web-monitor-sdk@${newVersion}`, 'blue');
  log(`🔗 查看: https://www.npmjs.com/package/web-monitor-sdk`, 'blue');
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`❌ 未捕获的异常: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`❌ 未处理的 Promise 拒绝: ${reason}`, 'red');
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main();
}