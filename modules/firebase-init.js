// Firebase configuration
// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "contectlenspos",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

/**
 * Initializes Firebase and sets up the Functions emulator for local development.
 */
export function initializeFirebase() {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        window.firebaseFunctions = firebase.functions();
        
        // 🔥 FUNCTIONS EMULATOR 설정 (로컬 개발용) 🔥
        const isCloudWorkstations = location.hostname.includes('cloudworkstations.dev');
        const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
        
        if (isLocalhost || isCloudWorkstations) {
            window.firebaseFunctions.useEmulator("127.0.0.1", 5003); // 5003은 Firebase Functions Emulator의 새 포트입니다.
            console.log('Firebase Functions Emulator is being used.');
        }
        console.log('Firebase application initialized.');
    } else {
        console.warn('Firebase was already initialized or firebase object is not available.');
    }
}