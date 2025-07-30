#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 发布前检查脚本
function checkPackageJson() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // 必需字段检查
  const requiredFields = ['name', 'version', 'description', 'main', 'module', 'types'];
  const missingFields = requiredFields.filter(field => !packageJson[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ package.json 缺少必需字段: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  
  // 检查文件是否存在
  const files = [packageJson.main, packageJson.module, packageJson.types];
  const missingFiles = files.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error(`❌ 构建文件不存在: ${missingFiles.join(', ')}`);
    console.error('请先运行: yarn build');
    process.exit(1);
  }
  
  console.log('✅ package.json 检查通过');
}

function checkReadme() {
  if (!fs.existsSync('README.md')) {
    console.error('❌ README.md 文件不存在');
    process.exit(1);
  }
  
  const readme = fs.readFileSync('README.md', 'utf8');
  if (readme.length < 100) {
    console.error('❌ README.md 内容太少，请完善文档');
    process.exit(1);
  }
  
  console.log('✅ README.md 检查通过');
}

function checkLicense() {
  if (!fs.existsSync('LICENSE')) {
    console.warn('⚠️  LICENSE 文件不存在，建议添加许可证');
  } else {
    console.log('✅ LICENSE 文件存在');
  }
}

function main() {
  console.log('🔍 执行发布前检查...');
  
  checkPackageJson();
  checkReadme();
  checkLicense();
  
  console.log('✅ 所有检查通过，可以发布');
}

if (require.main === module) {
  main();
}