import { sendRegistrationEmail } from "./src/features/auth/email.service.js";

// Dummy user object to simulate a real registration
const user = {
  name: "Test User",
  email: "walidmoussa00@gmail.com", // use your own email to test
};

sendRegistrationEmail(user);
