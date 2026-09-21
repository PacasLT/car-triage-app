# Dizainerio veidrodis (DARBO-SISTEMA §3). Claude Design mato VIENĄ aplanką ir neseka
# Windows nuorodų (junction), todėl laikom tikras kopijas. Paleisti po kiekvieno commit'o:
#   powershell -File tools\veidrodis-dizaineriui.ps1
$src = Split-Path -Parent $PSScriptRoot
$dst = Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads\cartriige-dizaineriui'
New-Item -ItemType Directory -Path $dst -Force | Out-Null
robocopy (Join-Path $src 'frontend') (Join-Path $dst 'frontend') /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
robocopy (Join-Path $src 'pasikeitimai') (Join-Path $dst 'pasikeitimai') /MIR /XF *.zip /NFL /NDL /NJH /NJS /NP | Out-Null
$n = (Get-Content (Join-Path $dst 'frontend\ct-priedai.css')).Count
Write-Output "Veidrodis atnaujintas: $dst (ct-priedai.css $n eil.)"
