export SRC_DIR=$(cd "$(dirname "$0")/.."; pwd)
cp ./private_configs/demo-config.env .env.development
cp ./private_configs/demo-config.env .env.production
# cp ./private_configs/demo-functions-env.env ./.env
export GOOGLE_APPLICATION_CREDENTIALS="$SRC_DIR/private_configs/staging-google-app-credentials.json"
export NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST="127.0.0.1:8071"
export NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9089"
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9089"
export GCLOUD_PROJECT="demo-immmersive"
export PROJECT_ENV="demo"
firebase use staging