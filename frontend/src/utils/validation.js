// Validation utilities for forms

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Nepal phone number: 10 digits starting with 98 or 97
  const phoneRegex = /^(98|97)\d{8}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

export const validatePassword = (password) => {
  return {
    isValid: password.length >= 8,
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
};

export const formatPhone = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX for Nepal
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return cleaned;
};

export const validateAge = (year, month, day) => {
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(birthDate.getTime())) {
    return { isValid: false, age: null, message: 'Invalid date' };
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  if (age < 18) {
    return { isValid: false, age, message: 'You must be at least 18 years old' };
  }

  if (age > 65) {
    return { isValid: false, age, message: 'Age must be under 65 for donation' };
  }

  return { isValid: true, age, message: '' };
};

export const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const organTypes = [
  'Kidney',
  'Liver',
  'Heart',
  'Lung',
  'Pancreas',
  'Cornea',
  'Intestine',
  'Bone Marrow'
];

export const urgencyLevels = [
  { value: 'low', label: 'Low - Planned procedure', color: 'green' },
  { value: 'medium', label: 'Medium - Within weeks', color: 'yellow' },
  { value: 'high', label: 'High - Within days', color: 'orange' },
  { value: 'critical', label: 'Critical - Immediate', color: 'red' }
];
