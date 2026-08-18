# 🚀 Como Executar o Auto-Retry da VM Ampere A1 (Oracle Cloud)

Este pacote contém o script inteligente com **auto-descoberta de IDs** e **tentativas contínuas a cada 60 segundos** até a Oracle liberar capacidade em São Paulo.

---

## 📋 Passo a Passo Rápido no Terminal da sua VM

### 1️⃣ Acesse sua VM via SSH
Conecte-se na sua VM atual pelo terminal ou PuTTY:
```bash
ssh opc@SEU_IP_ATUAL -i sua_chave.key
# (ou ubuntu@SEU_IP_ATUAL se for Ubuntu)
```

---

### 2️⃣ Instale a OCI CLI e configure as credenciais

Rode o comando abaixo:
```bash
sudo dnf install -y python3-pip || sudo apt update && sudo apt install -y python3-pip
pip3 install oci-cli
```

Em seguida, configure as credenciais:
```bash
oci setup config
```

O assistente solicitará:
1. **User OCID:** Cole seu OCID de usuário (*Perfil > User Settings* no painel da Oracle).
2. **Tenancy OCID:** Cole o OCID da sua Tenancy (*Tenancy details* no painel).
3. **Region:** Digite `sa-saopaulo-1` (ou a sua região).
4. **RSA Key:** Pressione `y` (Enter) para gerar uma nova chave automaticamente.

> **IMPORTANTE:** O assistente exibirá o caminho da chave pública (geralmente `~/.oci/oci_api_key_public.pem`). Exiba o conteúdo com `cat ~/.oci/oci_api_key_public.pem`, copie o texto, vá no painel da Oracle Cloud em **Profile (Perfil) > User Settings > API Keys > Add API Key**, cole a chave e confirme.

---

### 3️⃣ Inicie o Script de Auto-Retry

Crie a pasta e baixe/cole o script:
```bash
mkdir -p ~/oracle_retry && cd ~/oracle_retry
nano auto_create_ampere.py
```
*(Cole o conteúdo do arquivo `auto_create_ampere.py` e salve com `Ctrl + O`, `Enter` e `Ctrl + X`)*.

Execute em **segundo plano** (o script continuará rodando mesmo se você fechar o SSH):
```bash
nohup python3 auto_create_ampere.py > ampere_retry.log 2>&1 &
```

---

## 📊 Como Acompanhar o Status

* **Ver os logs ao vivo:**
  ```bash
  tail -f ~/oracle_retry/ampere_retry.log
  ```

* **Ver se o script está rodando:**
  ```bash
  ps aux | grep auto_create_ampere
  ```

* **Parar o script (se necessário):**
  ```bash
  pkill -f auto_create_ampere.py
  ```

---

## 🎉 O que acontece quando der sucesso?
Assim que a Oracle liberar vaga para os processadores Ampere ARM em São Paulo:
1. A máquina será **provisionada imediatamente** com 4 OCPUs e 24 GB de RAM.
2. O arquivo `sucesso_ampere.json` será criado com os dados completos da nova instância (incluindo IP público e OCID).
3. O script finalizará a execução automaticamente.
