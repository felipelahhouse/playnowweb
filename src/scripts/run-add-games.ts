import { addTestGames } from './add-test-games';

console.log('🚀 Iniciando script para adicionar jogos de teste...');

addTestGames()
  .then(() => {
    console.log('✅ Script concluído com sucesso!');
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
  });