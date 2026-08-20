# Atualizacao de Credencial Brevo

## Publicar a correcao atual

O arquivo `backend/.env` contem a credencial ativa e nao deve ser adicionado ao Git. Antes de publicar, confirme que `ecosystem.config.js` nao possui `BREVO_API_KEY` e que `bellagestao_deploy.tar.gz` aparece como removido.

```powershell
Set-Location 'C:\Users\rgfer\OneDrive\Documentos\repositorioIA\projetoSalao'
git status
git add -A -- .gitignore ecosystem.config.js ATUALIZACAO_SEGURANCA.md bellagestao_deploy.tar.gz
git commit -m "security: move Brevo credential to environment"
git push origin main
```

Substitua `main` pelo nome da branch publicada, se necessario.

## Limpar o historico remoto

A remocao no commit atual nao apaga a credencial dos commits anteriores. Coordene a reescrita com qualquer pessoa que use o repositorio. Instale `git-filter-repo`, crie um arquivo temporario fora do repositorio contendo a credencial revogada e execute:

```text
<credencial-revogada>==>REMOVED
```

```powershell
$originUrl = git remote get-url origin
git filter-repo --replace-text C:\caminho\seguro\brevo-replacements.txt --path bellagestao_deploy.tar.gz --invert-paths --force
git remote add origin $originUrl
git push --force origin main
git push --force --tags origin
Remove-Item C:\caminho\seguro\brevo-replacements.txt
```

Depois da reescrita, cada clone existente deve ser recriado ou sincronizado com `git fetch --all --prune` e `git reset --hard origin/main`.

## Atualizar a VM Oracle

Use a chave privada autorizada para o usuario `ubuntu`. O caminho padrao no Windows e `$env:USERPROFILE\.ssh\oci_key`.

```powershell
ssh -i "$env:USERPROFILE\.ssh\oci_key" ubuntu@137.131.221.53
```

Na VM, atualize o codigo e edite somente o arquivo de ambiente ignorado. Nao informe a credencial em comandos com historico de shell.

```bash
cd /var/www/bellagestao
git pull --ff-only
umask 077
nano backend/.env
pm2 restart bellagestao --update-env
pm2 restart bellagestao-whatsapp --update-env
pm2 save
pm2 status
```

No `backend/.env`, atualize exclusivamente a linha `BREVO_API_KEY` com a nova chave ativa. O arquivo precisa permanecer com permissao `600` e propriedade do usuario que executa o PM2:

```bash
chmod 600 backend/.env
node -e "require('dotenv').config({ path: 'backend/.env' }); if (!process.env.BREVO_API_KEY) process.exit(1); console.log('Brevo configurado')"
```

Se o repositorio ou o PM2 estiverem em outro diretorio, localize-os antes de executar os comandos acima:

```bash
find /var/www /home/ubuntu -maxdepth 3 -type d -name .git -printf '%h\n'
pm2 status
```