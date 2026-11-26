import React, { useState, useEffect, ChangeEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { JobSeekerProfile } from '../types';

export interface UseSeekerProfileFormOptions {
  onSuccess?: (msg?: string) => void;
  onError?: (err: string) => void;
}

export function useSeekerProfileForm(
  initialProfile?: JobSeekerProfile | null,
  options?: UseSeekerProfileFormOptions
) {
  const { updateJobSeekerProfile } = useApp();
  const { showToast } = useToast();

  // Personal Information State
  const [firstName, setFirstName] = useState(initialProfile?.firstName || '');
  const [middleName, setMiddleName] = useState(initialProfile?.middleName || '');
  const [lastName, setLastName] = useState(initialProfile?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialProfile?.dateOfBirth || '');
  const [age, setAge] = useState<string>(initialProfile?.age ? String(initialProfile.age) : '');
  const [civilStatus, setCivilStatus] = useState<string>(initialProfile?.civilStatus || '');
  const [sex, setSex] = useState<string>(initialProfile?.sex || '');
  const [barangay, setBarangay] = useState(initialProfile?.barangay || '');
  const [municipality, setMunicipality] = useState(initialProfile?.municipality || '');
  const [address, setAddress] = useState(initialProfile?.address || '');
  const [contactNumber, setContactNumber] = useState(initialProfile?.contactNumber || '');
  const [summary, setSummary] = useState(
    initialProfile?.professionalSummary || initialProfile?.summary || ''
  );
  const [primaryDegree, setPrimaryDegree] = useState(initialProfile?.primaryDegree || '');
  const [educationalAttainment, setEducationalAttainment] = useState(
    initialProfile?.educationalAttainment || ''
  );
  const [profilePicture, setProfilePicture] = useState(initialProfile?.profilePicture || '');

  // Job Preferences State
  const [prefCategories, setPrefCategories] = useState<string[]>(
    initialProfile?.jobPreferences?.categories || []
  );
  const [prefMunicipalities, setPrefMunicipalities] = useState<string[]>(
    initialProfile?.jobPreferences?.municipalities || []
  );
  const [prefEmploymentTypes, setPrefEmploymentTypes] = useState<string[]>(
    initialProfile?.jobPreferences?.employmentTypes || []
  );
  const [prefMinSalary, setPrefMinSalary] = useState<string>(
    initialProfile?.jobPreferences?.minSalary || ''
  );

  // Re-hydrate when initialProfile updates
  useEffect(() => {
    if (initialProfile) {
      setFirstName(initialProfile.firstName || '');
      setMiddleName(initialProfile.middleName || '');
      setLastName(initialProfile.lastName || '');
      setDateOfBirth(initialProfile.dateOfBirth || '');
      setAge(initialProfile.age ? String(initialProfile.age) : '');
      setCivilStatus(initialProfile.civilStatus || '');
      setSex(initialProfile.sex || '');
      setBarangay(initialProfile.barangay || '');
      setMunicipality(initialProfile.municipality || '');
      setAddress(initialProfile.address || '');
      setContactNumber(initialProfile.contactNumber || '');
      setSummary(initialProfile.professionalSummary || initialProfile.summary || '');
      setPrimaryDegree(initialProfile.primaryDegree || '');
      setEducationalAttainment(initialProfile.educationalAttainment || '');
      setProfilePicture(initialProfile.profilePicture || '');

      if (initialProfile.jobPreferences) {
        setPrefCategories(initialProfile.jobPreferences.categories || []);
        setPrefMunicipalities(initialProfile.jobPreferences.municipalities || []);
        setPrefEmploymentTypes(initialProfile.jobPreferences.employmentTypes || []);
        setPrefMinSalary(initialProfile.jobPreferences.minSalary || '');
      }
    }
  }, [initialProfile?.id]);

  const handleAvatarFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'alert',
        title: 'Image File Too Large',
        message: 'Please choose an image file under 5MB.'
      });
      options?.onError?.('Image file exceeds 5MB size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfilePicture(dataUrl);

      if (initialProfile?.id) {
        updateJobSeekerProfile(initialProfile.id, { profilePicture: dataUrl });
      }

      showToast({
        type: 'success',
        title: 'Profile Photo Updated! 📸',
        message: 'Your profile picture has been saved successfully.'
      });
      options?.onSuccess?.('Profile picture saved successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePersonalInfo = async (overrides?: Partial<JobSeekerProfile>) => {
    if (!initialProfile?.id) return;

    const payload: Partial<JobSeekerProfile> = {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      age: age ? parseInt(age, 10) : undefined,
      civilStatus,
      sex,
      barangay,
      municipality,
      address,
      contactNumber,
      professionalSummary: summary,
      summary,
      primaryDegree,
      educationalAttainment,
      profilePicture,
      ...overrides
    };

    updateJobSeekerProfile(initialProfile.id, payload);

    showToast({
      type: 'success',
      title: 'Profile Saved! ✨',
      message: 'Your personal information has been updated.'
    });
    options?.onSuccess?.('Profile saved successfully.');
  };

  const handleSavePreferences = async (overrides?: Partial<JobSeekerProfile['jobPreferences']>) => {
    if (!initialProfile?.id) return;

    const updatedPreferences = {
      categories: prefCategories,
      municipalities: prefMunicipalities,
      employmentTypes: prefEmploymentTypes,
      minSalary: prefMinSalary,
      ...overrides
    };

    updateJobSeekerProfile(initialProfile.id, {
      jobPreferences: updatedPreferences
    });

    showToast({
      type: 'success',
      title: 'Preferences Updated! 🎯',
      message: 'Your job search preferences and target industries have been saved.'
    });
    options?.onSuccess?.('Job preferences updated successfully.');
  };

  const resetForm = () => {
    if (initialProfile) {
      setFirstName(initialProfile.firstName || '');
      setMiddleName(initialProfile.middleName || '');
      setLastName(initialProfile.lastName || '');
      setDateOfBirth(initialProfile.dateOfBirth || '');
      setAge(initialProfile.age ? String(initialProfile.age) : '');
      setCivilStatus(initialProfile.civilStatus || 'Single');
      setSex(initialProfile.sex || '');
      setBarangay(initialProfile.barangay || '');
      setMunicipality(initialProfile.municipality || 'Roxas');
      setAddress(initialProfile.address || '');
      setContactNumber(initialProfile.contactNumber || '');
      setSummary(initialProfile.professionalSummary || initialProfile.summary || '');
      setPrimaryDegree(initialProfile.primaryDegree || '');
      setEducationalAttainment(initialProfile.educationalAttainment || "Bachelor's Degree");
      setProfilePicture(initialProfile.profilePicture || '');
    }
  };

  return {
    // Form State
    firstName,
    setFirstName,
    middleName,
    setMiddleName,
    lastName,
    setLastName,
    dateOfBirth,
    setDateOfBirth,
    age,
    setAge,
    civilStatus,
    setCivilStatus,
    sex,
    setSex,
    barangay,
    setBarangay,
    municipality,
    setMunicipality,
    address,
    setAddress,
    contactNumber,
    setContactNumber,
    summary,
    setSummary,
    primaryDegree,
    setPrimaryDegree,
    educationalAttainment,
    setEducationalAttainment,
    profilePicture,
    setProfilePicture,

    // Preferences State
    prefCategories,
    setPrefCategories,
    prefMunicipalities,
    setPrefMunicipalities,
    prefEmploymentTypes,
    setPrefEmploymentTypes,
    prefMinSalary,
    setPrefMinSalary,

    // Actions
    handleAvatarFileUpload,
    handleSavePersonalInfo,
    handleSavePreferences,
    resetForm
  };
}
