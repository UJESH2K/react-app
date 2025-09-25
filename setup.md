# Quick Setup Guide

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed  # This will populate the database with products
npm run dev   # Start the backend server on port 5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start     # Start the Expo development server
```

### 3. Access the App
- **Mobile**: Scan the QR code with Expo Go app
- **Web**: Press 'w' in the terminal or go to http://localhost:8081
- **Android**: Press 'a' in the terminal
- **iOS**: Press 'i' in the terminal

## 🔧 Environment Variables

The backend needs these environment variables in `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://ujeshyadav007_db_user:2q8TaUcZQ8ZMigwo@casapp.7t1zwgh.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=casapp
GOOGLE_CLIENT_ID=948047525047-2j18q6nme6furh2t06sl5hv69i70ppt0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JWT_SECRET=casa_ecommerce_jwt_secret_key_2024_secure_random_string
SESSION_SECRET=casa_ecommerce_session_secret_2024_secure_random_string
NODE_ENV=development
```

## 🛠️ Troubleshooting

### Backend Issues
- If you get "OAuth2Strategy is not a constructor", the Google OAuth fix has been applied
- If you get MongoDB connection errors, check your MONGO_URI
- Make sure port 5000 is not being used by another application

### Frontend Issues
- If you get "Cannot find module 'nativewind/metro'", run `npm install nativewind@^2.0.11`
- If the app doesn't load, try clearing the cache: `npx expo start -c`
- Make sure the backend is running before starting the frontend

## 📱 Testing the App

1. **Authentication**: Try email/phone OTP or Google Sign-in
2. **Browse Products**: Navigate through different categories
3. **Add to Cart**: Add items and check cart functionality
4. **Wishlist**: Add items to wishlist
5. **Checkout**: Test the complete checkout flow

## 🎯 Features Working

- ✅ User authentication (Email/Phone OTP + Google)
- ✅ Product catalog with 30 items
- ✅ Shopping cart and wishlist
- ✅ Search and filtering
- ✅ Checkout process
- ✅ Order management
- ✅ Responsive design
- ✅ Real-time updates

## 📞 Support

If you encounter any issues:
1. Check the terminal logs for error messages
2. Ensure all dependencies are installed
3. Verify environment variables are set correctly
4. Make sure both backend and frontend are running

Happy coding! 🎉
