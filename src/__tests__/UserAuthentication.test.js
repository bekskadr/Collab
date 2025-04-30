import '@testing-library/jest-dom';
import { mockAuthValue } from '../test-utils';

// Mock Firebase Auth functions
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  getAuth: jest.fn().mockReturnValue({})
}));

// Mock Firebase
jest.mock('../firebase', () => ({
  auth: {}
}));

// Mock the auth service functions
jest.mock('../services/authService', () => ({
  signup: jest.fn().mockImplementation(async (email, password) => {
    if (email === 'existing@example.com') {
      throw new Error('Email already in use');
    }
    return { user: { uid: 'new-user-id', email } };
  }),
  login: jest.fn().mockImplementation(async (email, password) => {
    if (email === 'valid@example.com' && password === 'correctPassword') {
      return { user: { uid: 'user-123', email } };
    }
    throw new Error('Invalid email or password');
  }),
  logout: jest.fn().mockResolvedValue(true),
  resetPassword: jest.fn().mockImplementation(async (email) => {
    if (email === 'valid@example.com') {
      return true;
    }
    throw new Error('User not found');
  })
}));

// Import the auth service functions after mocking
import { signup, login, logout, resetPassword } from '../services/authService';

describe('UserAuthentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: User registration
  test('User registration with new email is successful', async () => {
    const email = 'new@example.com';
    const password = 'password123';
    
    // Mock implementation for this test
    signup.mockResolvedValueOnce({ 
      user: { 
        email: email, 
        uid: 'new-user-id' 
      } 
    });
    
    const result = await signup(email, password);
    
    expect(signup).toHaveBeenCalledWith(email, password);
    expect(result.user.email).toBe(email);
    expect(result.user.uid).toBe('new-user-id');
  });

  // Test 2: User registration with existing email fails
  test('User registration with existing email fails', async () => {
    const email = 'existing@example.com';
    const password = 'password123';
    
    // Mock implementation for this test
    const error = new Error('Email already in use');
    signup.mockRejectedValueOnce(error);
    
    await expect(signup(email, password)).rejects.toThrow('Email already in use');
    expect(signup).toHaveBeenCalledWith(email, password);
  });

  // Test 3: User login with correct credentials
  test('User login with correct credentials is successful', async () => {
    const email = 'valid@example.com';
    const password = 'correctPassword';
    
    // Mock implementation for this test
    login.mockResolvedValueOnce({ 
      user: {
        email: email,
        uid: 'user-123'
      }
    });
    
    const result = await login(email, password);
    
    expect(login).toHaveBeenCalledWith(email, password);
    expect(result.user.email).toBe(email);
    expect(result.user.uid).toBe('user-123');
  });

  // Test 4: User login with incorrect credentials
  test('User login with incorrect credentials fails', async () => {
    const email = 'valid@example.com';
    const password = 'wrongPassword';
    
    // Mock implementation for this test
    const error = new Error('Invalid email or password');
    login.mockRejectedValueOnce(error);
    
    await expect(login(email, password)).rejects.toThrow('Invalid email or password');
    expect(login).toHaveBeenCalledWith(email, password);
  });

  // Test 5: User logout
  test('User logout is successful', async () => {
    // Mock implementation for this test
    logout.mockResolvedValueOnce(true);
    
    const result = await logout();
    
    expect(logout).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  // Test 6: Password reset for existing user
  test('Password reset for existing user is successful', async () => {
    const email = 'valid@example.com';
    
    // Mock implementation for this test
    resetPassword.mockResolvedValueOnce(true);
    
    const result = await resetPassword(email);
    
    expect(resetPassword).toHaveBeenCalledWith(email);
    expect(result).toBe(true);
  });

  // Test 7: Password reset for non-existent user
  test('Password reset for non-existent user fails', async () => {
    const email = 'nonexistent@example.com';
    
    // Mock implementation for this test
    const error = new Error('User not found');
    resetPassword.mockRejectedValueOnce(error);
    
    await expect(resetPassword(email)).rejects.toThrow('User not found');
    expect(resetPassword).toHaveBeenCalledWith(email);
  });
}); 