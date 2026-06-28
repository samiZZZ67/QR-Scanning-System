import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const staffPin = process.env.STAFF_PIN || '1234';

if (nodeEnv === 'production' && staffPin === '1234') {
  console.warn(
    '[SECURITY WARNING] STAFF_PIN is set to the default "1234" in production. ' +
    'Set a strong STAFF_PIN environment variable immediately.'
  );
}

const config = Object.freeze({
  port: Number(process.env.PORT) || 5000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv,
  staffPin,

  databasePath: process.env.DATABASE_PATH || './data/hotel.sqlite',
  databaseUrl: process.env.DATABASE_URL || '',

  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5173',

  cloudinary: Object.freeze({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'qr-menu'
  }),

  telegram: Object.freeze({
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || ''
  }),

  grok: Object.freeze({
    apiKey: process.env.GROK_API_KEY || process.env.XAI_API_KEY || '',
    textModel: process.env.GROK_MODEL || 'grok-4-latest',
    imageModel: process.env.GROK_IMAGE_MODEL || 'grok-2-image-latest'
  }),

  jsonLimit: process.env.JSON_LIMIT || '15mb',
  forceHttps: process.env.FORCE_HTTPS !== 'false'
});

export default config;
