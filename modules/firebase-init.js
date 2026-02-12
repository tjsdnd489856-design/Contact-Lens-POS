// Firebase configuration
// You should replace these with your actual Firebase project configuration
// from your Firebase project settings.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "contectlenspos", // This comes from .firebaserc
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get a reference to the Firestore service
const db = firebase.firestore();

export { db };
