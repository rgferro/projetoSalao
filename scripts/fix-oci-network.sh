#!/usr/bin/env bash
set -euo pipefail

echo '[*] 1. Identificando interface primária...'
PRIMARY_IFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
if [ -z "$PRIMARY_IFACE" ]; then
    PRIMARY_IFACE="ens3"
fi
echo "[+] Interface detectada: $PRIMARY_IFACE"

echo "[*] 2. Ajustando MTU para 1500 na interface $PRIMARY_IFACE..."
ip link set dev "$PRIMARY_IFACE" mtu 1500 2>/dev/null || true

echo "[*] 3. Aplicando otimizações no Kernel (sysctl: PMTUD, BBR, IPv6)..."
cat << 'EOF' > /etc/sysctl.d/99-oci-network-fix.conf
# Habilitar Path MTU Discovery (PMTUD)
net.ipv4.ip_no_pmtu_disc = 0
net.ipv4.tcp_mtu_probing = 1

# Habilitar e configurar IPv6
net.ipv6.conf.all.disable_ipv6 = 0
net.ipv6.conf.default.disable_ipv6 = 0
net.ipv6.conf.all.autoconf = 1
net.ipv6.conf.all.accept_ra = 1

# Algoritmo de congestionamento TCP BBR
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# Buffers de rede otimizados para alta vazao
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
EOF

modprobe tcp_bbr 2>/dev/null || true
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-oci-network-fix.conf

echo "[*] 4. Configurando TCP MSS Clamping e liberação de ICMP no iptables..."
iptables -t mangle -C FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || \
iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

iptables -t mangle -C POSTROUTING -p tcp --tcp-flags SYN,RST SYN -o "$PRIMARY_IFACE" -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || \
iptables -t mangle -A POSTROUTING -p tcp --tcp-flags SYN,RST SYN -o "$PRIMARY_IFACE" -j TCPMSS --clamp-mss-to-pmtu

iptables -C INPUT -p tcp -m multiport --dports 80,443,22 -j ACCEPT 2>/dev/null || \
iptables -I INPUT 1 -p tcp -m multiport --dports 80,443,22 -j ACCEPT

iptables -C INPUT -p icmp -j ACCEPT 2>/dev/null || \
iptables -I INPUT 2 -p icmp -j ACCEPT

if command -v ip6tables &>/dev/null; then
    ip6tables -t mangle -C FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || \
    ip6tables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

    ip6tables -C INPUT -p tcp -m multiport --dports 80,443,22 -j ACCEPT 2>/dev/null || \
    ip6tables -I INPUT 1 -p tcp -m multiport --dports 80,443,22 -j ACCEPT

    ip6tables -C INPUT -p ipv6-icmp -j ACCEPT 2>/dev/null || \
    ip6tables -I INPUT 2 -p ipv6-icmp -j ACCEPT
fi

echo "[*] 5. Persistindo regras de firewall (iptables-persistent)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y >/dev/null 2>&1
apt-get install -y iptables-persistent net-tools >/dev/null 2>&1 || true
netfilter-persistent save >/dev/null 2>&1 || true

echo "[*] 6. Atualizando configuração do Nginx com suporte IPv6..."
if [ -f /tmp/belagestaostudio.conf ]; then
    cp /tmp/belagestaostudio.conf /etc/nginx/sites-available/belagestaostudio.conf
    ln -sf /etc/nginx/sites-available/belagestaostudio.conf /etc/nginx/sites-enabled/belagestaostudio.conf
fi

if [ -f /etc/nginx/sites-available/torquerp.conf ]; then
    if ! grep -q "listen \[::\]:80" /etc/nginx/sites-available/torquerp.conf; then
        sed -i '/listen 80;/a \    listen [::]:80;' /etc/nginx/sites-available/torquerp.conf
    fi
    if ! grep -q "listen \[::\]:443" /etc/nginx/sites-available/torquerp.conf; then
        sed -i '/listen 443 ssl http2;/a \    listen [::]:443 ssl http2;' /etc/nginx/sites-available/torquerp.conf
    fi
fi

nginx -t
systemctl reload nginx

echo "[✓] Configuração concluída com sucesso na VM OCI!"