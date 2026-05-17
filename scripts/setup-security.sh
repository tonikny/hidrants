#!/bin/bash
# ------------------------------------------------------------------------------
# HIDRANTS - Security Setup Script for Debian 13 (Trixie)
# ------------------------------------------------------------------------------

set -e

echo "🔒 Iniciant instal·lació d'eines de seguretat..."

# 1. Actualització de paquets i dependències
sudo apt update
sudo apt install -y lynis logwatch goaccess jq curl

# 2. Instal·lació de CrowdSec
echo "🕵️ Instal·lant CrowdSec..."
if ! command -v cscli &> /dev/null; then
    curl -s https://install.crowdsec.net | sudo sh
    sudo apt install -y crowdsec crowdsec-firewall-bouncer-iptables
fi

# 3. Configuració de Col·leccions de CrowdSec
echo "📦 Configurant col·leccions de CrowdSec per al stack Docker/Nginx..."
sudo cscli collections install crowdsecurity/sshd
sudo cscli collections install crowdsecurity/nginx
sudo cscli collections install crowdsecurity/docker
sudo systemctl restart crowdsec

# 4. Desactivació de Fail2Ban (opcional, si ja es fa servir CrowdSec)
if systemctl is-active --quiet fail2ban; then
    echo "👮 Fail2Ban detectat. Es recomana migrar totalment a CrowdSec."
    echo "⚠️ Pots desactivar-lo amb: sudo systemctl stop fail2ban && sudo systemctl disable fail2ban"
fi

echo "✅ Instal·lació completada."
echo "------------------------------------------------------------------------------"
echo "🛠️ COMANDES ÚTILS:"
echo "- Veure bloquejos:   sudo cscli decisions list"
echo "- Mètriques:         sudo cscli metrics"
echo "- Auditoria sistema: sudo lynis audit system"
echo "- Tràfic Nginx:      sudo goaccess /var/log/nginx/access.log --log-format=COMBINED"
echo "------------------------------------------------------------------------------"
