# Firebase Setup Instructions

## 1. Apply Firestore Security Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **serali-comidas**
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of `firestore.rules` and paste them into the rules editor
6. Click **Publish** to apply the rules

**Important**: The updated rules now include the `banners` collection which is required for the seed script to work properly.

## 2. Set Up Storage Rules (REQUIRED for image uploads)

**This is critical for creating products with images and uploading payment proofs!**

1. Navigate to **Storage** in the Firebase Console
2. Click on the **Rules** tab
3. Replace the rules with:

\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /brand/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /banners/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /payment-proofs/{imageId} {
      allow read: if request.auth != null;
      allow write: if true;
    }
  }
}
\`\`\`

4. Click **Publish**

**Without these Storage rules, image uploads will fail and product creation will hang!**

## 3. Enable Authentication

1. In the Firebase Console, navigate to **Authentication**
2. Click on **Get Started** if not already enabled
3. Go to the **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click **Save**

## 4. Create Admin User

1. In the Firebase Console, go to **Authentication** > **Users**
2. Click **Add user**
3. Enter an email and password for your admin account
4. Click **Add user**

## 5. Initialize Collections (Optional)

The app will automatically create collections when you add data, but you can pre-create them:

1. Go to **Firestore Database**
2. Click **Start collection**
3. Create these collections:
   - `categories`
   - `products`
   - `orders`
   - `banners`
   - `config`

## 6. Test the Application

1. Visit the customer ordering page - you should see categories and products (once added)
2. Log in to the admin panel with your created admin credentials
3. Use the "Inicializar DB" option to seed the database with sample data
4. Test placing an order as a customer
5. Check the Clientes section to see customer order history

## Troubleshooting

### Product Creation Hangs or Gets Stuck
- **Most Common Cause**: Firebase Storage rules are not configured
- **Solution**: Follow Step 2 above to set up Storage rules
- **Check**: Look at browser console for errors mentioning "storage/unauthorized"

### Permission Denied Errors
- Make sure you've published the Firestore security rules including the banners collection
- Verify you're logged in as an admin user

### Authentication Issues
- Verify Email/Password is enabled in Authentication settings
- Make sure you've created an admin user

### Image Upload Fails
- Check that Storage rules are configured correctly (Step 2)
- Verify you're logged in as an authenticated user
- Check browser console for specific error messages

### Seed Script Fails
- Ensure you're logged in as an admin
- Verify all Firestore security rules are published
- Check that the banners collection rules are included
