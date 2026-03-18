import fetch from 'node-fetch';

const BASE_URL = `http://localhost:${process.env.PORT || 3002}/api`;

const testEntregadoresAPI = async () => {
  console.log('--- Iniciando Teste da API de Entregadores ---');
  let token = '';
  let idEntregador1 = '';
  const testEmail = `test.entregador.${Date.now()}@calango.com`;

  try {
    // 1. Criar usuário de teste (Lojista) para obter TenantId e Token
    console.log('1. Cadastrando lojista de teste...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Loja Teste Entregadores',
        email: testEmail,
        password: 'password123'
      })
    });

    const registerData = await registerRes.json();
    if (!registerRes.ok) throw new Error(registerData.message || 'Falha no registro');
    token = registerData.token;
    console.log('✅ Lojista registrado e autenticado.');

    // 2. Criar Entregador
    console.log('\n2. Criando um novo entregador...');
    const createRes = await fetch(`${BASE_URL}/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Entregador Teste 01',
        whatsapp: '11999999999',
        status: 'disponivel',
        priority: 15
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.message || 'Falha ao criar');
    idEntregador1 = createData._id;
    console.log(`✅ Entregador criado com sucesso: ${createData.name} (ID: ${idEntregador1})`);

    // 3. Listar Entregadores
    console.log('\n3. Listando Entregadores...');
    const listRes = await fetch(`${BASE_URL}/drivers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    console.log(`✅ Foram encontrados ${listData.length} entregador(s).`);
    const found = listData.find(d => d._id === idEntregador1);
    if (!found) throw new Error("Entregador criado não apareceu na listagem!");

    // 4. Atualizar Entregador
    console.log('\n4. Atualizando entregador (mudando status para ocupado e entregasHoje para 1)...');
    const updateRes = await fetch(`${BASE_URL}/drivers/${idEntregador1}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'ocupado',
        deliveriesToday: 1
      })
    });
    const updateData = await updateRes.json();
    if (updateData.status !== 'ocupado' || updateData.deliveriesToday !== 1) {
      throw new Error('Atualização não foi refletida.');
    }
    console.log('✅ Entregador atualizado com sucesso.');

    // 5. Deletar (Inativar) Entregador
    console.log('\n5. Deletando (inativando) entregador...');
    const deleteRes = await fetch(`${BASE_URL}/drivers/${idEntregador1}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.driver || deleteData.driver.isActive !== false) {
      throw new Error('Falha ao inativar entregador.');
    }
    console.log('✅ Entregador removido (inativado) com sucesso.');

    // 6. Listar novamente para garantir que não aparece
    console.log('\n6. Listando novamente para confirmar inativação...');
    const listAgainRes = await fetch(`${BASE_URL}/drivers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listAgainData = await listAgainRes.json();

    const foundInactive = listAgainData.find(d => d._id === idEntregador1);
    if (foundInactive) throw new Error("Entregador inativo apareceu na listagem!");
    console.log('✅ Listagem atualizada (entregador inativo ocultado).');

    console.log('\n🎉 TODOS OS TESTES PASSARAM!');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
  }
};

testEntregadoresAPI();
