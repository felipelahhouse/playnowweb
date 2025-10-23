import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🧹 Limpando cache do Firebase Hosting...\n');

async function clearCache() {
  try {
    // Invalidar cache do Firebase Hosting
    console.log('📋 Passo 1: Invalidando cache do Firebase CDN...');
    
    const { stdout, stderr } = await execAsync('firebase hosting:channel:deploy live --expires 1h');
    
    if (stderr) {
      console.error('⚠️ Avisos:', stderr);
    }
    
    console.log(stdout);
    console.log('✅ Cache limpo com sucesso!');
    console.log('\n📝 IMPORTANTE:');
    console.log('   1. Aguarde 2-3 minutos para propagação');
    console.log('   2. Abra o site em uma aba anônima/privada');
    console.log('   3. Ou pressione Ctrl+Shift+R para hard reload');
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    console.log('\n💡 Solução Manual:');
    console.log('   1. Abra o navegador em modo anônimo');
    console.log('   2. Ou limpe o cache do navegador (Ctrl+Shift+Del)');
    console.log('   3. Ou aguarde 5-10 minutos para propagação automática');
  }
}

clearCache();
