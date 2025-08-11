import axios from 'axios';
import AuthService from './auth-service';
import CookieService from './cookie-service';



interface UpdateUserData {
  id?: string;
  resource_owner_id?: string;
  target_savings_amount?: number | null;
  savings_purpose?: string | null;
  income_range?: string | null;
  saving_frequency?: string | null;
  username?: string;
  email?: string;
  full_name?: string;
  phone_number?: string;
  role?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  // Add more fields as needed
}

// Format the data to match the API expectations
const formatUserData = (userData: UpdateUserData): UpdateUserData => {
  // Create a new object with the same properties
  const formattedData: UpdateUserData = { ...userData };
  
  // Ensure target_savings_amount is a number
  if (formattedData.target_savings_amount !== undefined) {
    // Convert to number or null
    formattedData.target_savings_amount = formattedData.target_savings_amount === null 
      ? null 
      : Number(formattedData.target_savings_amount);
    
    // If it's NaN, set to 0
    if (isNaN(formattedData.target_savings_amount as number)) {
      formattedData.target_savings_amount = 0;
    }
  }

  // Ensure required fields have default values
  formattedData.is_email_verified = formattedData.is_email_verified !== undefined ? formattedData.is_email_verified : false;
  formattedData.is_phone_verified = formattedData.is_phone_verified !== undefined ? formattedData.is_phone_verified : false;
  formattedData.created_at = formattedData.created_at || new Date().toISOString();
  formattedData.updated_at = new Date().toISOString();
  
  return formattedData;
};

const UserService = {
  // Update user profile
  async updateUser(userId: string, userData: UpdateUserData) {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Format the data to match API expectations
      const formattedData = formatUserData(userData);
      console.log('Formatted user data for API:', formattedData);

      // Use the local proxy endpoint instead of direct API call
      const endpoint = `/api/users/${userId}`;
      
      console.log(`Sending update request to: ${endpoint}`);
      
      // Make the API call
      const response = await axios.patch(endpoint, formattedData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('User update response:', response.data);
      
      // Update the user in cookies
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...response.data };
        CookieService.setUser(updatedUser);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request was made but no response received:', error.request);
      }
      throw error;
    }
  },

  // Get user by ID
  async getUserById(userId: string) {
    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Always use direct API for getting user data
      const endpoint = `${API_URL}/api/v1/users/${userId}`;
      console.log(`Fetching user data from: ${endpoint}`);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update cookies with the fresh data
      if (response.data) {
        CookieService.setUser(response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
  
  // Add mock functionality for development/testing when API is unavailable
  mockUpdateUser(userId: string, userData: UpdateUserData) {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        // Get current user from cookies
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          // Update user data
          const updatedUser = { ...currentUser, ...userData };
          // Store updated user in cookies
          CookieService.setUser(updatedUser);
          resolve(updatedUser);
        } else {
          resolve({ id: userId, ...userData });
        }
      }, 1000); // 1 second delay to simulate API call
    });
  }
};

export default UserService; 