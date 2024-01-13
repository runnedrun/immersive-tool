export SRC_DIR=$(cd "$(dirname "$0")/.."; pwd)
firebase use staging
cp ./private_configs/staging-config.env .env.development
cp ./private_configs/staging-config.env .env.production
# cp ./private_configs/staging-functions-env.env ./.env
export GOOGLE_APPLICATION_CREDENTIALS="$SRC_DIR/private_configs/staging-google-app-credentials.json"
export GCLOUD_PROJECT="xinqing-david-wedding-staging"
export NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=""
export FIREBASE_AUTH_EMULATOR_HOST=""
export NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=""