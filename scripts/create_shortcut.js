const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const iconIco = path.join(assetsDir, 'app_icon.ico');
const targetBat = path.join(rootDir, 'INSTALAR_E_INICIAR.bat');

const psScript = `
$desktop = [Environment]::GetFolderPath('Desktop')
Get-ChildItem -Path $desktop -Filter "*BellaGest*" -ErrorAction SilentlyContinue | Remove-Item -Force

$WshShell = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $desktop "BellaGestao Studio.lnk"
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "${targetBat.replace(/\\/g, '\\\\')}"
$Shortcut.WorkingDirectory = "${rootDir.replace(/\\/g, '\\\\')}"
$Shortcut.Description = "BellaGestao Studio - Sistema de Gestao para Salao de Beleza e Estetica"
if (Test-Path "${iconIco.replace(/\\/g, '\\\\')}") {
    $Shortcut.IconLocation = "${iconIco.replace(/\\/g, '\\\\')},0"
}
$Shortcut.Save()
Write-Output "SHORTCUT_SAVED: $shortcutPath"
`;

const tempPs = path.join(assetsDir, 'create_lnk.ps1');
fs.writeFileSync(tempPs, psScript, 'utf8');

try {
  execSync(`powershell -ExecutionPolicy Bypass -File "${tempPs}"`, { stdio: 'inherit' });
} finally {
  if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs);
}
