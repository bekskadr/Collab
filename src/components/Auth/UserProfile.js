import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import styled from 'styled-components';

const ProfileContainer = styled.div`
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: var(--shadow-medium);
`;

const ProfileHeader = styled.div`
  margin-bottom: 30px;
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: 15px;
`;

const ProfileTitle = styled.h2`
  margin: 0;
  color: var(--color-primary);
  font-size: 24px;
`;

const ProfileSection = styled.div`
  margin-bottom: 25px;
`;

const SectionTitle = styled.h3`
  color: var(--color-primary);
  font-size: 18px;
  margin-bottom: 15px;
`;

const InfoItem = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.div`
  font-size: 14px;
  color: var(--color-secondary);
  margin-bottom: 5px;
`;

const Value = styled.div`
  font-size: 16px;
  color: var(--color-primary);
  padding: 8px 0;
`;

const Form = styled.form`
  margin-top: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background-color: var(--bg-tertiary);
  color: var(--color-primary);
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-secondary);
  }
`;

const Button = styled.button`
  padding: 10px 16px;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--accent-primary-hover);
  }
  
  &:disabled {
    background-color: var(--color-tertiary);
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--accent-danger);
  background-color: ${props => props.theme === 'dark' ? 'rgba(244, 67, 54, 0.1)' : '#ffebee'};
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  border-left: 4px solid var(--accent-danger);
`;

const SuccessMessage = styled.div`
  color: var(--accent-success);
  background-color: ${props => props.theme === 'dark' ? 'rgba(76, 175, 80, 0.1)' : '#e8f5e9'};
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  border-left: 4px solid var(--accent-success);
`;

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--border-primary);
`;

const Tab = styled.button`
  padding: 10px 20px;
  background: ${props => props.active ? 'var(--accent-secondary)' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.active ? 'var(--accent-primary)' : 'transparent'};
  color: ${props => props.active ? 'var(--accent-primary)' : 'var(--color-primary)'};
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.active ? 'var(--accent-secondary)' : 'var(--bg-interactive)'};
  }
`;

function UserProfile() {
  const { currentUser, userProfile, updatePassword, fetchUserProfile, resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    
    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser, fetchUserProfile]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
 
    setError('');
    setSuccess('');
    
    
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    
    setLoading(true);
    
    try {
      
      await updatePassword(newPassword);
      
      
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password successfully updated');
    } catch (error) {
      console.error('Error updating password:', error);
      
      
      if (error.code === 'auth/requires-recent-login') {
        setError('For security reasons, please log out and log in again before changing your password');
      } else {
        setError('Failed to update password: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      setSuccess(`Password reset email sent to ${resetEmail}`);
      setResetEmail('');
    } catch (error) {
      console.error('Error sending password reset:', error);
      setError('Failed to send password reset email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <ErrorMessage>You must be logged in to view your profile</ErrorMessage>;
  }

  return (
    <ProfileContainer>
      <ProfileHeader>
        <ProfileTitle>User Profile</ProfileTitle>
      </ProfileHeader>
      
      <Tabs>
        <Tab 
          active={activeTab === 'account'} 
          onClick={() => setActiveTab('account')}
        >
          Account Information
        </Tab>
        <Tab 
          active={activeTab === 'security'} 
          onClick={() => setActiveTab('security')}
        >
          Security
        </Tab>
      </Tabs>
      
      {activeTab === 'account' && (
        <ProfileSection>
          <InfoItem>
            <Label>Email Address</Label>
            <Value>{currentUser.email}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Account Created</Label>
            <Value>{currentUser.metadata.creationTime}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Last Sign In</Label>
            <Value>{currentUser.metadata.lastSignInTime}</Value>
          </InfoItem>
          {userProfile && userProfile.lastLogin && (
            <InfoItem>
              <Label>Last Login (from Firestore)</Label>
              <Value>
                {new Date(userProfile.lastLogin.seconds * 1000).toLocaleString()}
              </Value>
            </InfoItem>
          )}
        </ProfileSection>
      )}
      
      {activeTab === 'security' && (
        <ProfileSection>
          <SectionTitle>Change Password</SectionTitle>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <Form onSubmit={handlePasswordChange}>
            <FormGroup>
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Confirm New Password</Label>
              <Input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </FormGroup>
            
            <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </Form>
          
          <SectionTitle style={{ marginTop: '30px' }}>Forgot Password?</SectionTitle>
          <p>If you're having trouble updating your password, you can request a password reset email:</p>
          
          {!resetSent ? (
            <Form onSubmit={handlePasswordReset}>
              <FormGroup>
                <Label>Email Address</Label>
                <Input 
                  type="email" 
                  value={resetEmail || currentUser.email}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </FormGroup>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </Form>
          ) : (
            <Button onClick={() => setResetSent(false)}>
              Send Another Reset Email
            </Button>
          )}
        </ProfileSection>
      )}
    </ProfileContainer>
  );
}

export default UserProfile; 