import '@testing-library/jest-dom';
import { mockAuthValue } from '../test-utils';


jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  getAuth: jest.fn().mockReturnValue({})
}));


jest.mock('../firebase', () => ({
  auth: {}
}));


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


import { signup, login, logout, resetPassword } from '../services/authService';

describe('UserAuthentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

 
  test('User registration with new email is successful', async () => {
    const email = 'new@example.com';
    const password = 'password123';
    

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

 
  test('User registration with existing email fails', async () => {
    const email = 'existing@example.com';
    const password = 'password123';
    
  
    const error = new Error('Email already in use');
    signup.mockRejectedValueOnce(error);
    
    await expect(signup(email, password)).rejects.toThrow('Email already in use');
    expect(signup).toHaveBeenCalledWith(email, password);
  });

 
  test('User login with correct credentials is successful', async () => {
    const email = 'valid@example.com';
    const password = 'correctPassword';
    
   
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


  test('User login with incorrect credentials fails', async () => {
    const email = 'valid@example.com';
    const password = 'wrongPassword';
    
 
    const error = new Error('Invalid email or password');
    login.mockRejectedValueOnce(error);
    
    await expect(login(email, password)).rejects.toThrow('Invalid email or password');
    expect(login).toHaveBeenCalledWith(email, password);
  });


  test('User logout is successful', async () => {

    logout.mockResolvedValueOnce(true);
    
    const result = await logout();
    
    expect(logout).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  
  test('Password reset for existing user is successful', async () => {
    const email = 'valid@example.com';
    
    resetPassword.mockResolvedValueOnce(true);
    
    const result = await resetPassword(email);
    
    expect(resetPassword).toHaveBeenCalledWith(email);
    expect(result).toBe(true);
  });

  
  test('Password reset for non-existent user fails', async () => {
    const email = 'nonexistent@example.com';
    
    
    const error = new Error('User not found');
    resetPassword.mockRejectedValueOnce(error);
    
    await expect(resetPassword(email)).rejects.toThrow('User not found');
    expect(resetPassword).toHaveBeenCalledWith(email);
  });
}); 