import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage'
import 'firebase/compat/database'


const firebaseConfig = {
    apiKey: "AIzaSyD7XSoNDoxXcKXWtUsYs5_wkMaWft_InqE",
    authDomain: "bajarangi-industries-2023.firebaseapp.com",
    projectId: "bajarangi-industries-2023",
    storageBucket: "bajarangi-industries-2023.appspot.com",
    messagingSenderId: "1040653341814",
    appId: "1:1040653341814:web:2f32d2e89eeb588c01bb57",
    measurementId: "G-NFJVR2P4X7"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
 export const db = firebase.firestore();
 export const storage = firebase.storage();
 export const database = firebase.database();


 export default firebase;