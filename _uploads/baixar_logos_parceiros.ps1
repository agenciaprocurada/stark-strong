$destPath = "C:\Users\agenc\meusprojetos\starkstrong\_uploads"
if (!(Test-Path $destPath)) { New-Item -ItemType Directory -Path $destPath -Force }
$headers = @{ "Referer" = "https://www.starkstrong.com.br/"; "User-Agent" = "Mozilla/5.0" }

Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/396/logo-goioere-6841c86302566.png" -OutFile "$destPath\parceiro_01.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/380/11-6841c80ab36de.png" -OutFile "$destPath\parceiro_02.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/381/12-6841c8121b456.png" -OutFile "$destPath\parceiro_03.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/382/13-6841c8179e629.png" -OutFile "$destPath\parceiro_04.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/383/14-6841c81eaaf29.png" -OutFile "$destPath\parceiro_05.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/384/15-6841c82c251fa.png" -OutFile "$destPath\parceiro_06.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/385/19-6841c831b616d.png" -OutFile "$destPath\parceiro_07.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/386/20-6841c836094e2.png" -OutFile "$destPath\parceiro_08.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/387/21-6841c839dfbca.png" -OutFile "$destPath\parceiro_09.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/388/22-6841c83f3d5ff.png" -OutFile "$destPath\parceiro_10.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/398/images-68a3401952c94.jpg" -OutFile "$destPath\parceiro_11.jpg" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/367/iron-6841a586a2ae7.png" -OutFile "$destPath\parceiro_12.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/368/7-6841a5915c63d.png" -OutFile "$destPath\parceiro_13.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/369/8-6841a5988a2d3.png" -OutFile "$destPath\parceiro_14.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/370/logo-333616333-1718375692-d544acecaa0115222a7c7e8a731303fd1718375693-6848436f77d14.png" -OutFile "$destPath\parceiro_15.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/371/1-6841a5a7ce4e4.png" -OutFile "$destPath\parceiro_16.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/372/logouplay4-6841a5b1525f1.png" -OutFile "$destPath\parceiro_17.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/373/logostartgymvermelho-6841a5bb77edb.png" -OutFile "$destPath\parceiro_18.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/374/2-6841a73bc68ec.png" -OutFile "$destPath\parceiro_19.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/375/6-6841a7466790b.png" -OutFile "$destPath\parceiro_20.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/389/23-6841c84573346.png" -OutFile "$destPath\parceiro_21.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/390/24-6841c8493cd79.png" -OutFile "$destPath\parceiro_22.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/391/25-6841c84ce7d29.png" -OutFile "$destPath\parceiro_23.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/392/26-6841c852afdd0.png" -OutFile "$destPath\parceiro_24.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/376/31851077462-6841c7f539a7a.png" -OutFile "$destPath\parceiro_25.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/393/27-6841c85670cfc.png" -OutFile "$destPath\parceiro_26.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/377/4-6841c7f8cf59e.png" -OutFile "$destPath\parceiro_27.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/394/28-6841c85a188dc.png" -OutFile "$destPath\parceiro_28.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/378/5-6841c7fc90ab9.png" -OutFile "$destPath\parceiro_29.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/395/29-6841c85e4f457.png" -OutFile "$destPath\parceiro_30.png" -Headers $headers -UseBasicParsing
Invoke-WebRequest -Uri "https://www.starkstrong.com.br/image/post/89/379/arms-6848438dce4ce.png" -OutFile "$destPath\parceiro_31.png" -Headers $headers -UseBasicParsing

Write-Host "Todos os 31 logos baixados com sucesso!"