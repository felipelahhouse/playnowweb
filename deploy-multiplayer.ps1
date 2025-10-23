# 🚀 Deploy PlayNowEmulator Multiplayer to Google Cloud Run via Firebase

$PROJECT_ID = "planowemulator"
$SERVICE_NAME = "multiplayer-socketio"
$REGION = "us-central1"
$DIR = "python-multiplayer"

Write-Host "📦 Building and deploying to Cloud Run..." -ForegroundColor Cyan

Set-Location $DIR

# Check if gcloud is installed
$gcloudExists = Get-Command gcloud -ErrorAction SilentlyContinue

if (!$gcloudExists) {
    Write-Host "❌ gcloud CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use alternative deployment:" -ForegroundColor Yellow
    Write-Host "1. Glitch.com (easiest)" -ForegroundColor Green
    Write-Host "2. Railway.app" -ForegroundColor Green
    Write-Host "3. Render.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "See DEPLOY_GUIDE.md for instructions" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME `
  --source . `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --project $PROJECT_ID `
  --memory 512Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 10 `
  --set-env-vars FLASK_ENV=production

if ($LASTEXITCODE -eq 0) {
    # Get service URL
    $SERVICE_URL = gcloud run services describe $SERVICE_NAME `
      --platform managed `
      --region $REGION `
      --project $PROJECT_ID `
      --format 'value(status.url)'

    Write-Host ""
    Write-Host "✅ Deploy completed!" -ForegroundColor Green
    Write-Host "🌐 Service URL: $SERVICE_URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update src/services/multiplayerService.js with URL: $SERVICE_URL"
    Write-Host "2. Run: npm run build"
    Write-Host "3. Run: firebase deploy --only hosting"
    Write-Host ""
}

Set-Location ..

