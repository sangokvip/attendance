// 生成密码哈希的工具脚本
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // 验证哈希
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification:', isValid);
    
    // 生成SQL语句
    console.log('\nSQL语句:');
    console.log(`INSERT INTO users (username, password_hash, display_name, role, is_active) VALUES`);
    console.log(`    ('admin', '${hash}', '系统管理员', 'admin', true)`);
    console.log(`ON CONFLICT (username) DO NOTHING;`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();
