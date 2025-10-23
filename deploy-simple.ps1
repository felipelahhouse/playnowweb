$PROJECT_ID = "planowemulator"
$SERVICE_NAME = "multiplayer-socketio"
$REGION = "us-central1"

Write-Host "📦 Deploying to Google Cloud Run..." -ForegroundColor Cyan

$gcloudExists = Get-Command gcloud -ErrorAction SilentlyContinue

if (!$gcloudExists) {
    Write-Host "❌ gcloud CLI not installed!" -ForegroundColor Red
    Write-Host "Download: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

Set-Location python-multiplayer

gcloud run deploy $SERVICE_NAME --source . --platform managed --region $REGION --allow-unauthenticated --project $PROJECT_ID --memory 512Mi

Set-Location ..
