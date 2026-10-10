# Spec: Migração de Storage - Firebase para MinIO (S3 Compatible)

## 1. Contexto e Objetivo
O sistema **Calango Food** está abandonando o uso do Firebase Storage para o armazenamento de arquivos e imagens. A nova solução de infraestrutura utiliza um servidor MinIO auto-hospedado (S3-compatible) rodando sobre a nossa infraestrutura local (OptiPlex 790/3010 com 1TB via NFS) e exposto via Cloudflare Tunnels.

**Objetivo do Agente:** 
1. Remover todas as dependências e integrações com o Firebase Storage.
2. Implementar o upload e deleção de arquivos utilizando o AWS SDK (`@aws-sdk/client-s3`), conectando-se ao bucket do MinIO.

---

## 2. Dependências
**Remover:**
- Qualquer pacote ou sub-módulo exclusivo do Firebase Storage (ex: `@firebase/storage` ou referências de storage no SDK do Firebase).

**Adicionar:**
- `@aws-sdk/client-s3` (AWS SDK v3)

---

## 3. Variáveis de Ambiente Necessárias
O agente deve garantir que o arquivo `.env.example` e a validação de variáveis de ambiente do sistema incluam as seguintes chaves. O código de conexão deve ler estritamente estas variáveis:

```env
S3_ENDPOINT=         # Ex: [https://storage.dominio-do-cloudflare.com](https://storage.dominio-do-cloudflare.com)
S3_REGION=us-east-1  # Padrão aceito pelo MinIO
S3_ACCESS_KEY=       # Chave gerada no painel MinIO
S3_SECRET_KEY=       # Segredo gerado no painel MinIO
S3_BUCKET_NAME=      # Nome do bucket do Calango Food (ex: calango-food-assets)

```

## 4. Regras de Implementação (CRÍTICO)

**Configuração Obrigatória do Cliente S3:**
Como o MinIO não utiliza o roteamento de DNS nativo da AWS, a instância do S3Client deve obrigatoriamente conter a propriedade forcePathStyle: true.

Exemplo de Inicialização:

```
Javascript
import { S3Client } from "@aws-sdk/client-s3";
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});
```

Permissões (ACL):
Não utilize ACL: 'public-read' se o bucket já estiver configurado como público no painel do MinIO. Apenas envie o arquivo com o ContentType correto (mimetype).

Geração de URL Pública:
Para retornar a URL da imagem salva para o frontend ou banco de dados, o padrão a ser montado manualmente no código de retorno é:
{S3_ENDPOINT}/{S3_BUCKET_NAME}/{NOME_DO_ARQUIVO}

## 5. Arquivos Afetados (Escopo de Busca)
**Agente, por favor, realize as seguintes tarefas de refatoração no repositório:**

Buscar e Identificar: Procure na base de código atual onde o Firebase Storage é inicializado e chamado. Os alvos prováveis são pastas como src/config/, src/services/ (ex: upload.service.ts ou image.service.ts), ou src/utils/.

Substituir Uploads: Refatore os métodos que invocam o upload (ex: envio de fotos de pratos/produtos) para usar o PutObjectCommand do @aws-sdk/client-s3.

Substituir Deleções: Refatore os métodos de remoção para usar o DeleteObjectCommand.

Limpeza: Remova imports ociosos do Firebase nos arquivos alterados.

## 6. Critérios de Aceite (Checklist de Finalização)

[ ] @aws-sdk/client-s3 instalado no package.json.

[ ] .env.example atualizado com as novas variáveis.

[ ] Serviço/Classe de Upload refatorado para utilizar o S3Client com forcePathStyle: true.

[ ] O código deve retornar a URL pública do MinIO após um upload bem-sucedido.

[ ] Nenhuma referência ao Firebase Storage deve permanecer no projeto.

