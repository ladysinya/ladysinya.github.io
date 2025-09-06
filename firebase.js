  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAFnfiMmZlcH7XeQNfuqXWaQJYKg4tHl-Q",
    authDomain: "ladysinyagithub.firebaseapp.com",
    projectId: "ladysinyagithub",
    storageBucket: "ladysinyagithub.firebasestorage.app",
    messagingSenderId: "800328484512",
    appId: "1:800328484512:web:0802f10bf805253becebc5",
    measurementId: "G-9EYSSRJ4CM"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);