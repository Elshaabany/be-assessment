const User = require('../models/user');
const CustomError = require('../helpers/CustomError');
const transporter = require('../util/mail');
const { senderMail } = require('../util/config');

exports.postSignup = async (req, res, next) => {

    const code = Math.floor(100000 + Math.random() * 900000);

    const user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        verificationCode: code
    });

    const token = await user.generateToken();

    transporter.sendMail({
        to: req.body.email,
        from: senderMail,
        subject: 'verification code',
        html:
            `
            <h1> you successfully signed up!</h1>
            <p> your verification code is: ${code} </p>
        `
    })
        .then(console.log)
        .catch(console.error);

    res.json({
        message: 'user created successfully',
        user,
        token,
        redirectPath: "/user/verify"
    });

};

exports.postVerify = async (req, res, next) => {

    const code = req.body.code;
    const user = req.user;

    if (user.isVerified) {
        res.status(400).json({
            message: "this email is verified already"
        })
    } else if (code === user.verificationCode) {
        user.isVerified = true;
        await user.save();
        res.json({
            message: "email verified successfully"
        })
    } else {
        res.status(400).json({
            message: "wrong verification code!"
        })
    }

};

exports.postSignin = async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new CustomError('email or password is not correct', 401);
    const isMatch = await user.checkPassword(req.body.password);
    if (!isMatch) throw new CustomError('email or password is not correct', 401);

    const token = await user.generateToken();

    res.json({
        message: 'loged in successfully',
        user,
        token
    });

};
