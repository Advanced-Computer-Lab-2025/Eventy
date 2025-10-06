import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../config/firebase.js";
import { validateSignUp } from "./auth.validation.js";
import { User } from "../users/User.model.js";

export const signUpUser = async (data) => {
  validateSignUp(data);

  const { email, password, firstName, lastName, studentStaffId, role, companyName, companyLogoUrl, taxCardUrl, representatives } = data;

  try {
    // 1️⃣ Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2️⃣ Set display name in Firebase
    await updateProfile(user, { displayName: `${firstName} ${lastName}` });

    // 3️⃣ Store user in MongoDB using your schema
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // stored because your schema requires it — can remove if using Firebase only
      studentStaffId: role !== "vendor" ? studentStaffId : undefined,
      companyName: role === "vendor" ? companyName : undefined,
      companyLogoUrl: role === "vendor" ? companyLogoUrl : undefined,
      taxCardUrl: role === "vendor" ? taxCardUrl : undefined,
      role,
      status: "pending",
      walletBalance: 0,
      representatives: role === "vendor" ? representatives || [] : [],
    });

    await newUser.save();

    // 4️⃣ Return sanitized response
    return {
      uid: user.uid,
      email: user.email,
      role,
      firstName,
      lastName,
    };
  } catch (error) {
    console.error("Service error:", error.message);
    throw new Error(error.message);
  }
};
