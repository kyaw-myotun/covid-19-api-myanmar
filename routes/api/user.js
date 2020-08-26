const Router = require("express").Router();

const { isAuth } = require("../../auth");
const {
  loginValidation,
  registerValidation,
  getErrorMessage,
} = require("../../util/utils");
Router.post("/user/login", [loginValidation()], async (req, res, next) => {
  const errors = getErrorMessage(req);
  if (errors.length > 0) {
    return res.status(404).json(errors);
  }
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) return getErrorLogin(res);
    if (!isEqual(password, user.password)) return getErrorLogin(res);
    await user.save();
    res.status(200).json(user.getResult());
  } catch (error) {
    next(error);
  }
});
Router.post(
  "/user/register",
  [registerValidation()],
  async (req, res, next) => {
    const errors = getErrorMessage(req);

    if (errors.length > 0) {
      return res.status(404).json(errors);
    }
    const { username, email, password } = req.body;
    console.log(req.body);
    if (await User.findOne({ email: email }))
      return res
        .status(404)
        .json([{ email: "User with this email already exit" }]);
    try {
      const user = new User({ username, email, password });
      await user.save();
      return res.status(200).json(user.getResult().getResult());
    } catch (error) {
      next(error);
    }
  }
);
Router.get("/user", isAuth, (req, res, next) => {
  const user = Object.assign({}, req.user._doc);

  delete user.password;
  delete user.token;
  res.json(user);
});
Router.get("/user/logout", isAuth, async (req, res, next) => {
  const user = req.user;

  try {
    user.token = undefined;
    await user.save();
    return res.json({ message: "Logout Complete" });
  } catch (error) {
    next(error);
  }
});

Router.put("/user", isAuth, async (req, res, next) => {
  const user = req.user;
  const { username, email } = req.body;
  if (user.email !== email) {
    const us = await User.findOne({ email: email });
    if (us) return res.status(400).json({ email: "Email Already Exists" });
  }

  try {
    await User.updateOne({ _id: user._id }, { username, email });
    return res.status(200).json({ message: "edit complete" });
  } catch (error) {
    next(error);
  }
});
Router.put("/user/change", isAuth, async (req, res, next) => {
  const user = req.user;
  const { old_password, new_password, confirm_password } = req.body;
  if (!old_password)
    return res
      .status(400)
      .json({ old_password: "Please provide old password" });
  if (!new_password)
    return res
      .status(400)
      .json({ new_password: "Please provide new password" });

  if (new_password.length < 6)
    return res
      .status(400)
      .json({ new_password: "Password Must Be 6 Character Long" });
  if (!(new_password == confirm_password))
    return res
      .status(404)
      .json({ confirm_password: "Password Must Be same new and confirm" });

  try {
    const user_old_password = user.password;
    if (!isEqual(old_password, user_old_password))
      return res.status(404).json({ old_password: "Old Password incorect" });
    user.password = new_password;
    user.token = undefined;
    await user.save();
    return res.json({ message: "Password Changed Completed" });
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
});

module.exports = Router;