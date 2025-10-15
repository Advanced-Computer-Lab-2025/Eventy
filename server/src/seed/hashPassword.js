import bcrypt from "bcrypt";

const plainPassword = "test123"; // the password you want
const saltRounds = 10;

const hashPassword = async () => {
  const hashed = await bcrypt.hash(plainPassword, saltRounds);
  console.log("Hashed password:", hashed);
};

hashPassword();
