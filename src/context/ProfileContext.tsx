import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

export interface SocietySettings {
  id: string;
  name: string;
  address: string;
  buildingAge?: number;
  numberOfBlocks?: number;
  yearOfEstablishment?: number;
  contactNumber: string;
  email: string;
  logoUrl?: string;
}

interface ProfileContextType {
  adminProfile: AdminProfile | null;
  societySettings: SocietySettings | null;
  isLoading: boolean;
  updateAdminProfile: (updates: Partial<AdminProfile>) => Promise<void>;
  updateSocietySettings: (updates: Partial<SocietySettings>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [societySettings, setSocietySettings] = useState<SocietySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch admin profile
      const { data: adminData, error: adminError } = await supabase
        .from('admin_profile')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (adminError) throw adminError;

      if (adminData) {
        setAdminProfile({
          id: adminData.id,
          fullName: adminData.full_name,
          phoneNumber: adminData.phone_number,
          email: adminData.email,
        });
      } else {
        // Create default if not exists
        const defaultAdmin = {
          full_name: 'System Admin',
          phone_number: '+91 98765 43210',
          email: 'admin@society.com',
        };
        const { data: newAdmin, error: newAdminError } = await supabase
          .from('admin_profile')
          .insert([defaultAdmin])
          .select()
          .single();
          
        if (!newAdminError && newAdmin) {
          setAdminProfile({
            id: newAdmin.id,
            fullName: newAdmin.full_name,
            phoneNumber: newAdmin.phone_number,
            email: newAdmin.email,
          });
        }
      }

      // Fetch society settings
      const { data: societyData, error: societyError } = await supabase
        .from('society_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (societyError) throw societyError;

      if (societyData) {
        setSocietySettings({
          id: societyData.id,
          name: societyData.name,
          address: societyData.address,
          buildingAge: societyData.building_age,
          numberOfBlocks: societyData.number_of_blocks,
          yearOfEstablishment: societyData.year_of_establishment,
          contactNumber: societyData.contact_number,
          email: societyData.email,
          logoUrl: societyData.logo_url,
        });
      } else {
        // Create default if not exists
        const defaultSettings = {
          name: 'Grand Horizon Heights',
          address: '123, Horizon Avenue, Sector 45',
          contact_number: '+91 22 1234 5678',
          email: 'contact@grandhorizon.com',
        };
        const { data: newSettings, error: newSettingsError } = await supabase
          .from('society_settings')
          .insert([defaultSettings])
          .select()
          .single();
          
        if (!newSettingsError && newSettings) {
          setSocietySettings({
            id: newSettings.id,
            name: newSettings.name,
            address: newSettings.address,
            buildingAge: newSettings.building_age,
            numberOfBlocks: newSettings.number_of_blocks,
            yearOfEstablishment: newSettings.year_of_establishment,
            contactNumber: newSettings.contact_number,
            email: newSettings.email,
            logoUrl: newSettings.logo_url,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAdminProfile = async (updates: Partial<AdminProfile>) => {
    if (!adminProfile?.id) return;
    
    try {
      const dbUpdates: any = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
      if (updates.email !== undefined) dbUpdates.email = updates.email;

      const { error } = await supabase
        .from('admin_profile')
        .update(dbUpdates)
        .eq('id', adminProfile.id);

      if (error) throw error;
      await fetchProfileData();
    } catch (error) {
      console.error('Error updating admin profile:', error);
    }
  };

  const updateSocietySettings = async (updates: Partial<SocietySettings>) => {
    if (!societySettings?.id) return;

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.buildingAge !== undefined) dbUpdates.building_age = updates.buildingAge;
      if (updates.numberOfBlocks !== undefined) dbUpdates.number_of_blocks = updates.numberOfBlocks;
      if (updates.yearOfEstablishment !== undefined) dbUpdates.year_of_establishment = updates.yearOfEstablishment;
      if (updates.contactNumber !== undefined) dbUpdates.contact_number = updates.contactNumber;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;

      const { error } = await supabase
        .from('society_settings')
        .update(dbUpdates)
        .eq('id', societySettings.id);

      if (error) throw error;
      await fetchProfileData();
    } catch (error) {
      console.error('Error updating society settings:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{
      adminProfile,
      societySettings,
      isLoading,
      updateAdminProfile,
      updateSocietySettings
    }}>
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
