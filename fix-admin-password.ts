import prisma from '@GCMC-KAJ/db';
import { auth } from '@GCMC-KAJ/auth';

async function fixAdminPassword() {
  try {
    const email = 'admin@test.gcmc.com';
    const newPassword = 'TestPassword123!';

    console.log('🔍 Checking admin user:', email);

    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    });

    if (!existingUser) {
      console.log('❌ User not found, creating new admin user...');

      // Create user with Better Auth sign up
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password: newPassword,
          name: 'Test Admin User'
        }
      });

      console.log('✅ Created new admin user:', result);
      return;
    }

    console.log('✅ User exists:', existingUser.email);

    // Check if credential account exists
    const credentialAccount = existingUser.accounts.find(
      account => account.providerId === 'credential'
    );

    if (!credentialAccount) {
      console.log('❌ No credential account found, creating one...');
      // This shouldn't happen with Better Auth, but let's handle it
      await auth.api.signUpEmail({
        body: {
          email,
          password: newPassword,
          name: existingUser.name || 'Test Admin User'
        }
      });
    }

    // Test if current password works
    console.log('🧪 Testing current password...');

    try {
      const signInResult = await auth.api.signInEmail({
        body: {
          email,
          password: newPassword
        }
      });

      if (signInResult) {
        console.log('✅ Password is already correct! Login should work.');
        return;
      }
    } catch (loginError: any) {
      console.log('❌ Current password doesn\'t work:', loginError?.message || 'Login failed');
    }

    console.log('🔄 Resetting password...');

    // Delete existing credential account and recreate
    if (credentialAccount) {
      await prisma.account.delete({
        where: { id: credentialAccount.id }
      });
      console.log('🗑️ Deleted old credential account');
    }

    // Create new credential account with correct password
    await auth.api.signUpEmail({
      body: {
        email,
        password: newPassword,
        name: existingUser.name || 'Test Admin User'
      }
    });

    console.log('✅ Password reset complete!');

    // Test the new password
    console.log('🧪 Testing new password...');
    const testResult = await auth.api.signInEmail({
      body: {
        email,
        password: newPassword
      }
    });

    if (testResult) {
      console.log('🎉 SUCCESS! Login now works with:', email, '/', newPassword);
    } else {
      console.log('❌ Still not working...');
    }

  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();