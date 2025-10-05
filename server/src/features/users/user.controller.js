import UserService from "./user.service.js";
                         
// Controller to handle account creation
export const createManagementAccountHandler  = async (req, res, next) => {
  try {
    const userData = req.body; 
     const user = await UserService.createManagementAccount(userData); 

    
    res.status(201).json({
      message: "Management account created successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  }catch (err) {
    next(err);
  }
};
