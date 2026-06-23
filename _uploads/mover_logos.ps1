
# Script para mover logos dos parceiros para o destino correto
$source = "$env:USERPROFILE\Downloads"
$dest = "C:\Users\agenc\meusprojetos\starkstrong\_uploads"

# Create destination if not exists
if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force
    Write-Host "Pasta criada: $dest"
}

# Move parceiro_*.png and parceiro_*.jpg files
$files = Get-ChildItem -Path $source -Filter "parceiro_*" | Where-Object { $_.Extension -match "\.(png|jpg|jpeg|gif|webp)$" }
Write-Host "Encontrados $($files.Count) arquivos para mover"

foreach ($file in $files) {
    $destFile = Join-Path $dest $file.Name
    Copy-Item -Path $file.FullName -Destination $destFile -Force
    Write-Host "Copiado: $($file.Name)"
}
Write-Host "Concluido!"
