import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AdminProfile {
  fullName: string;
  phoneNumber: string;
  email: string;
}

export interface SocietySettings {
  name: string;
  address: string;
  buildingAge: number | '';
  numberOfBlocks: number | '';
  yearOfEstablishment: number | '';
  contactNumber: string;
  email: string;
  logoUrl: string;
}

interface ProfileContextType {
  adminProfile: AdminProfile;
  updateAdminProfile: (profile: AdminProfile) => void;
  societySettings: SocietySettings;
  updateSocietySettings: (settings: SocietySettings) => void;
}

const defaultAdminProfile: AdminProfile = {
  fullName: 'Admin User',
  phoneNumber: '9876543210',
  email: 'admin@society.com',
};

const defaultSocietySettings: SocietySettings = {
  name: 'Grand Horizon Society',
  address: '123 Horizon Avenue, Tech Park, City - 400001',
  buildingAge: 5,
  numberOfBlocks: 3,
  yearOfEstablishment: 2019,
  contactNumber: '022-12345678',
  email: 'contact@grandhorizon.com',
  logoUrl: '',
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(defaultAdminProfile);
  const [societySettings, setSocietySettings] = useState<SocietySettings>(defaultSocietySettings);

  const updateAdminProfile = (profile: AdminProfile) => {
    setAdminProfile(profile);
  };

  const updateSocietySettings = (settings: SocietySettings) => {
    setSocietySettings(settings);
  };

  return (
    <ProfileContext.Provider value={{ adminProfile, updateAdminProfile, societySettings, updateSocietySettings }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
