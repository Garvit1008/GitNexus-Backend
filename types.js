const { z } = require("zod");

const userValidateSignUp = z.object({
  username: z.string().min(3).refine((val) => val.trim() !== "", {
    message: "Name is required",
    path: ["name"],
  }),
  email: z.string().email().refine((val) => val.trim() !== "", {
    message: "Email is required",
    path: ["email"],
  }),
  password: z.string().min(6).refine((val) => val.trim() !== "", {
    message: "Password is required",
    path: ["password"],
  }),
});
const userValidateLogin = z.object({
    email: z.string().email().refine((val) => val.trim() !== "", {
      message: "Email is required",
      path: ["email"],
    }),
    password: z.string().min(6).refine((val) => val.trim() !== "", {
      message: "Password is required",
      path: ["password"],
    }),
  });
  
module.exports = { userValidateSignUp,userValidateLogin };
