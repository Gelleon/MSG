$server = "root@37.233.84.128"
$serverPath = "/root/MSG/backend/dev.db"
$localPath = "C:\Users\ethan\Desktop\project\MSG\backend\dev.db"

Write-Host "Подключение к серверу и копирование базы данных..." -ForegroundColor Green
scp $server`:$serverPath $localPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "База данных успешно скопирована!" -ForegroundColor Green
    Write-Host "Расположение: $localPath" -ForegroundColor Cyan
} else {
    Write-Host "Ошибка при копировании базы данных" -ForegroundColor Red
    Write-Host "Убедитесь, что:"
    Write-Host "1. Установлен OpenSSH Client (Windows Settings > Apps > Optional Features > OpenSSH Client)"
    Write-Host "2. Сервер доступен по адресу 37.233.84.128"
    Write-Host "3. База данных существует на сервере"
}
