#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import time
from datetime import datetime

# ==============================================================================
# CONFIGURAÇÃO OFICIAL OCI - SÃO PAULO
# ==============================================================================
COMPARTMENT_ID = "ocid1.tenancy.oc1..aaaaaaaaupllx4457yxpevvkrfcjcefv3yy5j2mhdnfqbimnvpg3jeqigasq"
AVAILABILITY_DOMAIN = "EFpd:SA-SAOPAULO-1-AD-1"
SUBNET_ID = "ocid1.subnet.oc1.sa-saopaulo-1.aaaaaaaaswhi6ol6yuglojks3nr5jztrjxiqjmuw4lzik55p4opifi735gua"
IMAGE_ID = "ocid1.image.oc1.sa-saopaulo-1.aaaaaaaan3wnblici7l2kyy4l2k3ukfry22ehibmlal2smnj4x6t73vdxlaa"
SSH_AUTHORIZED_KEYS_FILE = "/home/ubuntu/.ssh/authorized_keys"

# Recursos Ampere A1 (Always Free: 4 OCPUs, 24GB RAM, 50GB Disco)
INSTANCE_DISPLAY_NAME = "ampere-a1-producao"
OCPUS = 4
MEMORY_IN_GBS = 24
BOOT_VOLUME_SIZE_IN_GBS = 50
INTERVALO_SECS = 60

cmd_launch = [
    "/home/ubuntu/.local/bin/oci", "compute", "instance", "launch",
    "--compartment-id", COMPARTMENT_ID,
    "--availability-domain", AVAILABILITY_DOMAIN,
    "--shape", "VM.Standard.A1.Flex",
    "--shape-config", json.dumps({"ocpus": OCPUS, "memoryInGBs": MEMORY_IN_GBS}),
    "--display-name", INSTANCE_DISPLAY_NAME,
    "--image-id", IMAGE_ID,
    "--subnet-id", SUBNET_ID,
    "--assign-public-ip", "true",
    "--ssh-authorized-keys-file", SSH_AUTHORIZED_KEYS_FILE,
    "--boot-volume-size-in-gbs", str(BOOT_VOLUME_SIZE_IN_GBS)
]

tentativa = 0
print("=" * 70, flush=True)
print(f"🚀 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] INICIANDO AUTO-RETRY OCI AMPERE A1 (4 OCPUs, 24GB RAM)...", flush=True)
print(f"📍 Região: sa-saopaulo-1 | AD: {AVAILABILITY_DOMAIN}", flush=True)
print("=" * 70, flush=True)

while True:
    tentativa += 1
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    res = subprocess.run(cmd_launch, capture_output=True, text=True)
    
    if res.returncode == 0:
        msg = f"\n🎉🎉 [{agora}] SUCESSO! Instância Ampere criada após {tentativa} tentativas! 🎉🎉\n"
        print(msg, flush=True)
        with open("/home/ubuntu/sucesso_ampere.json", "w", encoding="utf-8") as f:
            f.write(res.stdout)
        break
    else:
        err = res.stderr.lower()
        if "out of host capacity" in err or "out of capacity" in err or "limitexceeded" in err:
            print(f"[{agora}] Tentativa #{tentativa:04d}: ⏳ Sem capacidade no momento na Oracle. Nova tentativa em {INTERVALO_SECS}s...", flush=True)
        elif "authorization failed" in err or "notauthenticated" in err:
            print(f"[{agora}] ❌ Erro de Autenticação na API OCI:\n{res.stderr}", flush=True)
            break
        else:
            print(f"[{agora}] Tentativa #{tentativa:04d} - Resposta:\n{res.stderr.strip()}", flush=True)
            print(f"Tentando novamente em {INTERVALO_SECS}s...", flush=True)
            
    time.sleep(INTERVALO_SECS)
