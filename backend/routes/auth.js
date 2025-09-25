const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { validateUserRegistration, validateOTP } = require('../middleware/validation');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const router = express.Router();

// Configure Google OAuth Strategy (only if environment variables are set)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      user.googleId = profile.id;
      user.picture = profile.photos[0].value;
      await user.save();
      return done(null, user);
    }

    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0].value,
      isEmailVerified: true
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
  }));
}

// Email transporter for OTP (only if configured)
const createEmailTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Twilio client for SMS OTP (only if configured)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Send OTP via email or phone
router.post('/send-otp', async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required'
      });
    }

    const isEmail = emailOrPhone.includes('@');
    let user;

    if (isEmail) {
      user = await User.findOne({ email: emailOrPhone });
      if (!user) {
        user = new User({ email: emailOrPhone, name: 'User' });
      }
    } else {
      user = await User.findOne({ phone: emailOrPhone });
      if (!user) {
        user = new User({ phone: emailOrPhone, name: 'User' });
      }
    }

    const otp = user.generateOTP();
    await user.save();

    if (isEmail) {
      // Send email OTP
      const transporter = createEmailTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: emailOrPhone,
          subject: 'Casa - Your OTP Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Your Casa OTP Code</h2>
              <p>Your one-time password is:</p>
              <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
          `
        });
      } else {
        console.log(`Email OTP for ${emailOrPhone}: ${otp}`);
      }
    } else {
      // Send SMS OTP
      if (twilioClient) {
        await twilioClient.messages.create({
          body: `Your Casa OTP code is: ${otp}. This code expires in 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: emailOrPhone
        });
      } else {
        console.log(`SMS OTP for ${emailOrPhone}: ${otp}`);
      }
    }

    res.json({
      success: true,
      message: `OTP sent to ${isEmail ? 'email' : 'phone'}`
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

// Login with email OTP
router.post('/login-email', validateOTP, async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidOTP = await user.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.isEmailVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        token
      }
    });

  } catch (error) {
    console.error('Email login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Login with phone OTP
router.post('/login-phone', validateOTP, async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidOTP = await user.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.isPhoneVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        token
      }
    });

  } catch (error) {
    console.error('Phone login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({
        success: false,
        message: 'Google OAuth not configured'
      });
    }

    // Verify Google ID token (in production, use google-auth-library)
    // For now, we'll create a simple verification
    const { GoogleAuth } = require('google-auth-library');
    const auth = new GoogleAuth();
    
    const ticket = await auth.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });
    
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.picture = picture;
        await user.save();
      } else {
        user = new User({
          googleId,
          email,
          name,
          picture,
          isEmailVerified: true
        });
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        preferences: user.preferences,
        token
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google login failed'
    });
  }
});

// Google OAuth callback (for web) - only if Google OAuth is configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
      const token = generateToken(req.user._id);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8081'}/auth/callback?token=${token}`);
    }
  );
}

// Get current user profile
router.get('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Update user profile
router.put('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const { name, preferences, addresses } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (addresses) user.addresses = addresses;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;
