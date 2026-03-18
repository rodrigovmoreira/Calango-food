import fetch from 'node-fetch';

const BASE_URL = `http://localhost:${process.env.PORT || 3002}/api`;

const testMotoboysAPI = async () => {
  console.log('--- Iniciando Teste da API de Motoboys ---');
  let token = '';
  let idMotoboy1 = '';
  const testEmail = `test.motoboy.${Date.now()}@calango.com`;

  try {
    // 1. Criar usuário de teste (Lojista) para obter TenantId e Token
    console.log('1. Cadastrando lojista de teste...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Loja Teste Motoboys',
        email: testEmail,
        password: 'password123'
      })
    });
    
    const registerData = await registerRes.json();
    if (!registerRes.ok) throw new Error(registerData.message || 'Falha no registro');
    token = registerData.token;
    console.log('✅ Lojista registrado e autenticado.');

    // 2. Criar Motoboy
    console.log('\n2. Criando um novo motoboy...');
    const createRes = await fetch(`${BASE_URL}/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Motoboy Teste 01',
        whatsapp: '11999999999',
        status: 'disponivel',
        priority: 15
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.message || 'Falha ao criar');
    idMotoboy1 = createData._id;
    console.log(`✅ Motoboy criado com sucesso: ${createData.name} (ID: ${idMotoboy1})`);

    // 3. Listar Motoboys
    console.log('\n3. Listando motoboys...');
    const listRes = await fetch(`${BASE_URL}/drivers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    console.log(`✅ Foram encontrados ${listData.length} motoboy(s).`);
    const found = listData.find(d => d._id === idMotoboy1);
    if (!found) throw new Error("Motoboy criado não apareceu na listagem!");

    // 4. Atualizar Motoboy
    console.log('\n4. Atualizando motoboy (mudando status para ocupado e entregasHoje para 1)...');
    const updateRes = await fetch(`${BASE_URL}/drivers/${idMotoboy1}`, {
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
    console.log('✅ Motoboy atualizado com sucesso.');

    // 5. Deletar (Inativar) Motoboy
    console.log('\n5. Deletando (inativando) motoboy...');
    const deleteRes = await fetch(`${BASE_URL}/drivers/${idMotoboy1}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteData = await deleteRes.json();
    if (!deleteData.driver || deleteData.driver.isActive !== false) {
       throw new Error('Falha ao inativar motoboy.');
    }
    console.log('✅ Motoboy removido (inativado) com sucesso.');

    // 6. Listar novamente para garantir que não aparece
    console.log('\n6. Listando novamente para confirmar inativação...');
    const listAgainRes = await fetch(`${BASE_URL}/drivers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listAgainData = await listAgainRes.json();
    
    const foundInactive = listAgainData.find(d => d._id === idMotoboy1);
    if (foundInactive) throw new Error("Motoboy inativo apareceu na listagem!");
    console.log('✅ Listagem atualizada (motoboy inativo ocultado).');

    console.log('\n🎉 TODOS OS TESTES PASSARAM!');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
  }
};

testMotoboysAPI();
