# Status — Spec 01: Migração de Storage (Firebase → MinIO)

**Spec:** `docs/spec/01-migracao-minio.md`
**Data de criação:** 2026-10-09
**Data de revisão:** 2026-10-09 (abordagem redefinida com o usuário)
**Status atual:** 🟡 Planejamento — implementação NÃO iniciada

---

## 1. Abordagem definida

Centralizar TODO o storage no microsserviço **`squamata-upload`** (presente nesta workspace), com uma **feature flag** que alterna entre **Firebase** e **MinIO**. O Calango Food continua chamando apenas o `squamata-upload` e deixa de montar URLs do Firebase no frontend.

Isso significa que:

1. A lógica de MinIO (`S3Client` + `forcePathStyle: true` + `PutObjectCommand`/`DeleteObjectCommand`) vai para o **`squamata-upload`**, não para o backend do Calango Food.
2. O Calango Food apenas consome a resposta padronizada `{ uploadUrl, publicUrl, filePath }` do `squamata-upload`.
3. A feature flag `STORAGE_PROVIDER=firebase|minio` fica no **`squamata-upload`** (fonte única de verdade), com fallback `firebase` para retrocompatibilidade.

---

## 2. Verificação do `squamata-upload` (estado atual)

**Conclusão: NÃO tem nenhuma configuração de MinIO.** Ele hoje é 100% Firebase.

| Item | Estado atual |
|------|--------------|
| `package.json` | Só `firebase-admin`, `express`, `cors`, `dotenv`. **Sem `@aws-sdk/*`.** |
| `.env` | Só `PORT`, `API_SECRET_KEY`, `FIREBASE_BUCKET`. **Sem variáveis `S3_*`.** |
| `index.js` | Só gera URL assinada via `firebase-admin`. **Sem feature flag, sem MinIO, sem endpoint de deleção.** |
| `.env.example` | **Não existe** (precisa ser criado). |
| `docker-compose.yml` | Monta `credentials.json` (Firebase) como volume. |
| `readme.md` | Documenta API com `publicUrl`/`tenantId`/`project`, mas o código não implementa isso (doc desatualizada). |

### O que falta no `squamata-upload` para suportar MinIO
1. Adicionar `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`.
2. Criar `.env.example` + adicionar `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME` e `STORAGE_PROVIDER`.
3. Criar o `S3Client` com `forcePathStyle: true`.
4. Adicionar feature flag e branch de geração de presigned URL (MinIO) vs Firebase.
5. Adicionar endpoint de deleção (`DeleteObjectCommand` no MinIO / `file.delete()` no Firebase).
6. Padronizar a resposta para incluir `publicUrl` (padrão `{S3_ENDPOINT}/{S3_BUCKET_NAME}/{filePath}` no MinIO).

---

## 3. Feature flag (decisão)

- **Onde:** `squamata-upload` (env `STORAGE_PROVIDER=firebase|minio`, default `firebase`).
- **Por quê:** é o centralizador de storage; o Calango Food e demais apps não precisam saber qual provider está ativo.
- **Comportamento:** `squamata-upload` retorna sempre `{ uploadUrl, publicUrl, filePath }`, transparente para o cliente.

---

## 4. Plano de arquivos (checklist)

### `Squamata-upload` (repositório na workspace)

- [ ] `package.json` — adicionar `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`.
- [ ] `.env` — adicionar `STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME` (manter `FIREBASE_BUCKET` para o provider firebase).
- [ ] `.env.example` (NOVO) — template das variáveis acima (sem segredos).
- [ ] `src/config/storage.js` (NOVO) — instanciar `S3Client` (`forcePathStyle: true`) e/ou bucket Firebase conforme `STORAGE_PROVIDER`; exportar provider ativo.
- [ ] `src/services/storageService.js` (NOVO) — `generateUploadUrl(fileName, contentType)` e `deleteObject(filePath)` com branch por provider.
- [ ] `index.js` — usar o service; retornar `{ uploadUrl, publicUrl, filePath }`; adicionar rota `POST /delete-object` (auth) e rota `GET /health`.
- [ ] `docker-compose.yml` — manter volume `credentials.json` (firebase); validar envs.
- [ ] `readme.md` — alinhar a documentação com o comportamento real (providers + flag).

### `Calango Food` (este repositório)

- [ ] `packages/frontend/src/pages/Products.jsx` — usar `publicUrl` retornado pelo `squamata-upload`; remover a montagem da URL Firebase e `VITE_FIREBASE_BUCKET` (linhas 134–136).
- [ ] `packages/frontend/src/services/api.js` — manter `uploadAPI.getSignedUrl` (endpoint não muda); opcionalmente adicionar `deleteObject` para futura deleção.
- [ ] `.env` / `.env.example` — remover `FIREBASE_BUCKET_URL` e `VITE_FIREBASE_BUCKET`; remover variáveis `S3_*` antigas que não são usadas pelo Calango Food (a responsabilidade passou ao `squamata-upload`).
- [ ] `storage-cors.json` — revisar/remover (CORS do MinIO é configurado no MinIO/Cloudflare, não neste arquivo Firebase-specific).
- [ ] `docs/MEMORY.md` (NOVO) — registrar a entrega ao concluir (regra do `ai-rules.md`).

---

## 5. Critérios de aceite (adaptados à nova abordagem)

- [ ] `squamata-upload` com `@aws-sdk/client-s3` + `s3-request-presigner` instalados.
- [ ] `S3Client` com `forcePathStyle: true` no `squamata-upload`.
- [ ] Feature flag `STORAGE_PROVIDER` funcionando (firebase/minio).
- [ ] Resposta padronizada com `publicUrl` no padrão MinIO.
- [ ] Endpoint de deleção via `DeleteObjectCommand` (MinIO).
- [ ] Calango Food sem nenhuma referência a Firebase Storage (URLs, envs, bucket).

---

## 6. Decisões em aberto

- **Nome da flag:** `STORAGE_PROVIDER` (recomendado) — confirmar.
- **Nomenclatura S3 no `squamata-upload`:** alinhar à convenção do ecossistema já usada pelo `squamata-headless` (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`), em vez do padrão da spec do Calango Food (`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`). Referência registrada na spec `Squamata-upload/docs/spec/01-suporte-minio.md`.
- **Deleção de imagem no Calango Food:** integrar `deleteProduct` → chamar `squamata-upload /delete-object` (opcional nesta fase) — confirmar se entra no escopo agora ou depois.
