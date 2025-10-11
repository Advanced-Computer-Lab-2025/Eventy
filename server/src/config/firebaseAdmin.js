import admin from "firebase-admin";
import serviceAccount from "./firebaseServiceAccount.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
