import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Make sure you have GOOGLE_APPLICATION_CREDENTIALS set if you are running outside of GCP, or provide the service account key path directly. For our purpose, if not provided it might fail, let's just initialize it so it uses the standard behavior or can be configured later.
    storageBucket: process.env.FIREBASE_BUCKET_URL
  });
}

const bucket = admin.storage().bucket();

export { admin, bucket };
