export const validateSignUp = (data) => {
  const { email, password, firstName, lastName, studentStaffId, role } = data;

  const allowedRoles = ["student", "staff", "ta", "professor"];
  if (!allowedRoles.includes(role.toLowerCase())) {
    throw new Error("Only Students, Staff, TAs, or Professors can sign up.");
  }

  const gucEmailRegex = /^[a-zA-Z0-9._%+-]+@(student\.)?guc\.edu\.eg$/;
  if (!gucEmailRegex.test(email)) {
    throw new Error("Please use your official GUC email.");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  if (!studentStaffId || !/^[0-9]+$/.test(studentStaffId)) {
    throw new Error("A valid Student/Staff ID is required.");
  }

  return true;
};
