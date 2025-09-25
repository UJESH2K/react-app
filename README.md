# Casa E-commerce App

A full-stack e-commerce application built with React Native (Expo) frontend and Node.js/Express backend with MongoDB.

## Features

### Frontend (React Native + Expo)
- 🛍️ Product catalog with categories (Casual, Formal, Streetwear, Seasonal, Special)
- 🔍 Search and filter products
- 🛒 Shopping cart functionality
- ❤️ Wishlist management
- 👤 User authentication (Email/Phone OTP + Google Sign-in)
- 💳 Checkout and payment processing
- 📱 Responsive design with NativeWind (Tailwind CSS)
- 🎨 Modern UI with smooth animations

### Backend (Node.js + Express + MongoDB)
- 🔐 JWT-based authentication
- 📧 Email/SMS OTP verification
- 🔑 Google OAuth integration
- 🛍️ Product management with variants
- 🛒 Cart and wishlist APIs
- 💳 Stripe payment integration
- 📦 Order management
- 🔒 Security middleware (Helmet, Rate limiting, CORS)
- 📊 Admin panel for order management

## Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **NativeWind** (Tailwind CSS for React Native)
- **Zustand** for state management
- **Expo Router** for navigation
- **Expo Auth Session** for Google OAuth

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Stripe** for payments
- **Passport.js** for OAuth
- **Nodemailer** for email OTP
- **Twilio** for SMS OTP
- **Cloudinary** for image storage

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Google Cloud Console account (for OAuth)
- Stripe account (for payments)
- Twilio account (for SMS OTP)
- Gmail account (for email OTP)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd react-app
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000

# MongoDB Atlas connection
MONGO_URI=mongodb+srv://ujeshyadav007_db_user:2q8TaUcZQ8ZMigwo@casapp.7t1zwgh.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=casapp

# Google OAuth
GOOGLE_CLIENT_ID=948047525047-2j18q6nme6furh2t06sl5hv69i70ppt0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# JWT Secret
JWT_SECRET=casa_ecommerce_jwt_secret_key_2024_secure_random_string

# Session Secret
SESSION_SECRET=casa_ecommerce_session_secret_2024_secure_random_string

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Environment
NODE_ENV=development
```

### 3. Seed the Database

```bash
npm run seed
```

### 4. Start the Backend Server

```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

### 5. Frontend Setup

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email/phone
- `POST /api/auth/login-email` - Login with email OTP
- `POST /api/auth/login-phone` - Login with phone OTP
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/search/:query` - Search products
- `POST /api/products/:id/reviews` - Add product review

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart
- `GET /api/cart/count` - Get cart item count
- `POST /api/cart/validate` - Validate cart before checkout

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist/add` - Add item to wishlist
- `DELETE /api/wishlist/remove` - Remove item from wishlist
- `DELETE /api/wishlist/clear` - Clear wishlist
- `GET /api/wishlist/check/:productId` - Check if item is in wishlist
- `GET /api/wishlist/count` - Get wishlist item count
- `POST /api/wishlist/move-to-cart` - Move item from wishlist to cart

### Orders
- `POST /api/orders/create` - Create order and payment intent
- `POST /api/orders/confirm-payment` - Confirm payment
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/cancel` - Cancel order

## Environment Variables Setup

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - For mobile: Use your Expo client URL

### Stripe Setup
1. Create a [Stripe account](https://stripe.com/)
2. Get your API keys from the dashboard
3. Set up webhooks for payment events
4. Add webhook endpoint: `http://localhost:5000/api/orders/webhook`

### Twilio Setup (for SMS OTP)
1. Create a [Twilio account](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number for SMS

### Gmail Setup (for Email OTP)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in EMAIL_PASS

## Project Structure

```
react-app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── wishlist.js
│   │   └── orders.js
│   ├── scripts/
│   │   └── seedDatabase.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── app/
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── cart.tsx
│   │   ├── wishlist.tsx
│   │   ├── checkout.tsx
│   │   ├── checkout-success.tsx
│   │   └── profile.tsx
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── state/
│   │       ├── auth.ts
│   │       ├── cart.ts
│   │       └── wishlist.ts
│   └── package.json
└── README.md
```

## Usage

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Open the app:**
   - Scan the QR code with Expo Go app on your phone
   - Or press 'w' to open in web browser
   - Or press 'a' for Android emulator
   - Or press 'i' for iOS simulator

### Testing the App

1. **Authentication:**
   - Try email/phone OTP login
   - Test Google Sign-in
   - Verify user profile management

2. **Shopping:**
   - Browse products by category
   - Search for specific items
   - Add items to cart and wishlist
   - Test cart quantity updates

3. **Checkout:**
   - Add items to cart
   - Proceed to checkout
   - Test payment flow (use Stripe test cards)
   - Verify order confirmation

## Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)

1. Set up environment variables in your hosting platform
2. Deploy the backend code
3. Update frontend API URLs to point to production backend

### Frontend Deployment (Expo/EAS)

1. Configure EAS Build
2. Build for production
3. Submit to app stores

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@casa.com or create an issue in the repository.

---

**Note:** Make sure to replace all placeholder values in the environment variables with your actual credentials before running the application.
