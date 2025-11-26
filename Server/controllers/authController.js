import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import userModel from "../model/userModel.js";
import transporter from "../Conig/nodemailer.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exist" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPassword });
    await user.save();

    //Generating token
    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    //Sending welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to Techie",
      text: `Welcome to Techie website. Your account has been created with email id: ${email}`,
    };
    await transporter.sendMail(mailOptions);
    return res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//Login function
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid email" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//send veriication otp to the user's email
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }
    //Generating 6 digits random number if account not verified yet
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    //save user in the database
    await user.save();
    //sending otp to user
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Verify your account as techie member",
      text: `Your OTP is ${otp}. Verify your account using this OTP`,
    };
    await transporter.sendMail(mailOption);
    res.json({ success: true, message: "Verification OTP sent to the email." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//Gets OTP and verify (Email veriication function)
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    res.json({ success: false, message: "Missing details" });
  }

  try {
    //Finding user with userId
    const user = await userModel.findById(userId);

    if (!user) {
      res.json({ success: false, message: "User not found" });
    }
    if (user.verifyOtp === "" || user.verifyOtp !== otp) {
      res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      res.json({ success: false, message: "OTP has expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;

    await user.save();
    return res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//Project
// import bcrypt from "bcryptjs";
// import JWT from "jsonwebtoken";
// import userModel from "../model/userModel.js";

// /* ============================================================
//     ADMIN CREATES USER (teacher or student)
//     - Only admin can access this route
//     - Role must be provided by admin
// ============================================================ */
// export const adminCreateUser = async (req, res) => {
//   const { name, email, password, role } = req.body;

//   if (!name || !email || !password || !role) {
//     return res.json({ success: false, message: "Missing fields" });
//   }

//   // ensure valid role
//   const allowedRoles = ["teacher", "student"];
//   if (!allowedRoles.includes(role)) {
//     return res.json({
//       success: false,
//       message: "Invalid role. Role must be teacher or student.",
//     });
//   }

//   try {
//     // check if email exists
//     const existing = await userModel.findOne({ email });
//     if (existing) {
//       return res.json({ success: false, message: "Email already exists" });
//     }

//     // hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // create user
//     const newUser = await userModel.create({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//     });

//     return res.json({
//       success: true,
//       message: `${role} account created successfully`,
//       userId: newUser._id,
//     });
//   } catch (err) {
//     return res.json({ success: false, message: err.message });
//   }
// };

// /* ============================================================
//     LOGIN USER (admin/teacher/student)
// ============================================================ */
// export const login = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.json({ success: false, message: "Missing credentials" });
//   }

//   try {
//     const user = await userModel.findOne({ email });
//     if (!user) return res.json({ success: false, message: "Invalid email" });

//     // compare password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.json({ success: false, message: "Invalid password" });

//     // create jwt token including user role
//     const token = JWT.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // store token in cookie
//     res.cookie("token", token, {
//       httpOnly: true, // prevents JS access
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     return res.json({
//       success: true,
//       message: "Login successful",
//       role: user.role,
//     });
//   } catch (err) {
//     return res.json({ success: false, message: err.message });
//   }
// };

// /* ============================================================
//     LOGOUT USER
// ============================================================ */
// export const logout = async (req, res) => {
//   try {
//     res.clearCookie("token", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//     });

//     return res.json({ success: true, message: "Logged out successfully" });
//   } catch (err) {
//     return res.json({ success: false, message: err.message });
//   }
// };

// /* ============================================================
//     GET LOGGED-IN USER PROFILE
//     - Helps frontend know who is logged in and what dashboard to show
// ============================================================ */
// export const getProfile = async (req, res) => {
//   try {
//     const user = await userModel.findById(req.user.id).select("-password");

//     if (!user) return res.json({ success: false, message: "User not found" });

//     return res.json({ success: true, user });
//   } catch (err) {
//     return res.json({ success: false, message: err.message });
//   }
// };
