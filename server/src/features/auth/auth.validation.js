// 🔹 Validation for Students / Staff / TA / Professors
export const validateAcademicSignUp = (data) => {
  let { email, password, firstName, lastName, studentStaffId, role } = data;

  // Normalize email
  email = email.toLowerCase().trim();

  const allowedRoles = ["student", "staff", "ta", "professor"];
  if (!allowedRoles.includes(role.toLowerCase())) {
    throw new Error("Invalid role for academic user.");
  }

  const gucEmailRegex = /^[a-zA-Z0-9._%+-]+@(student\.)?guc\.edu\.eg$/;
  if (!gucEmailRegex.test(email)) {
    throw new Error("Please use your official GUC email.");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }
  /*
  if (!studentStaffId || !/^[0-9]+$/.test(studentStaffId)) {
    throw new Error(
      "A valid Student/Staff ID is required (ID has to be only numbers)."
    );
  }
*/
  // Save normalized email back to data
  data.email = email;

  return true;
};

// 🔹 Validation for Vendors
export const validateVendorSignUp = (data) => {
  let { email, password, companyName, companyLogoUrl, taxCardUrl, role } = data;

  // Normalize email
  email = email.toLowerCase().trim();

  if (role.toLowerCase() !== "vendor") {
    throw new Error("Invalid role for vendor sign up.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error("A valid company email is required.");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (!companyName) {
    throw new Error("Company name is required.");
  }

  if (!companyLogoUrl) {
    throw new Error("Company logo URL is required.");
  }

  if (!taxCardUrl) {
    throw new Error("Tax card URL is required.");
  }

  // Save normalized email back to data
  data.email = email;

  return true;
};

export const validateLogin = (data) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // Optional: normalize email
  data.email = email.toLowerCase().trim();

  return true;
};
