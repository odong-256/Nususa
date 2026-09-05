import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  User, 
  Mail, 
  IdCard, 
  Phone, 
  Building2, 
  GraduationCap, 
  FileText, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';

export const MyProfile: React.FC = () => {
  const { userProfile, currentUser, refreshProfile } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [faculty, setFaculty] = useState(userProfile?.faculty || '');
  const [department, setDepartment] = useState(userProfile?.department || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [photoInput, setPhotoInput] = useState('');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile && !currentUser) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const targetUid = userProfile?.id || currentUser?.uid;
    if (!targetUid) {
      setErrorMsg('User ID is missing');
      setSaving(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', targetUid);
      const updatePayload: Record<string, any> = {
        phoneNumber: phoneNumber.trim(),
        faculty: faculty.trim(),
        department: department.trim(),
        bio: bio.trim(),
        updatedAt: new Date().toISOString()
      };

      if (photoURL) {
        updatePayload.photoURL = photoURL;
      }

      await updateDoc(userRef, updatePayload);
      await refreshProfile();
      setSuccessMsg('Your profile and contact details have been successfully updated!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoURL(reader.result as string);
      setIsEditingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-50 border-2 border-emerald-200 overflow-hidden flex items-center justify-center text-emerald-800 font-bold text-2xl shadow-inner">
              {photoURL || userProfile?.photoURL ? (
                <img 
                  src={photoURL || userProfile?.photoURL} 
                  alt={userProfile?.fullName || 'Profile'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{userProfile?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsEditingPhoto(!isEditingPhoto)}
              className="absolute -bottom-2 -right-2 p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md transition-transform hover:scale-105 cursor-pointer"
              title="Change profile photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {userProfile?.fullName || 'Student Voter'}
              </h1>
              {userProfile?.status && <StatusBadge status={userProfile.status} />}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5">
              ID: {userProfile?.studentId || 'N/A'} • {userProfile?.email}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                {userProfile?.role === 'admin' ? 'Electoral Commission Admin' : 'Registered NUSUSA Voter'}
              </span>
              {userProfile?.approvedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Verified on {new Date(userProfile.approvedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Photo edit popup/drawer */}
      {isEditingPhoto && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-700" />
              Update Profile Photo
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingPhoto(false)}
              className="text-xs text-emerald-800 font-semibold hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-900 mb-1.5">
                Upload image file (Max 2MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-900 mb-1.5">
                Or paste image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-emerald-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (photoInput.trim()) {
                      setPhotoURL(photoInput.trim());
                      setPhotoInput('');
                      setIsEditingPhoto(false);
                    }
                  }}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Registration Details (Read-only Institutional Records) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <IdCard className="w-5 h-5 text-emerald-700" />
              Institutional Student Registration Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These immutable credentials are officially linked to your Soroti University student registry account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Full Legal Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={userProfile?.fullName || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 pl-10 cursor-not-allowed"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Institutional Email (@sun.ac.ug)
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={userProfile?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 pl-10 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Student Registration / ID Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={userProfile?.studentId || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 pl-10 cursor-not-allowed font-mono"
                />
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Electoral Status
              </label>
              <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>Voter Eligibility</span>
                {userProfile?.status && <StatusBadge status={userProfile.status} />}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Contact & Academic Information */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-700" />
              Contact & Academic Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep your contact details up to date to receive electoral notices, reminders, and verification updates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Phone Number (WhatsApp / SMS)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+256 700 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 pl-10 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Faculty / School
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. School of Health Sciences / Engineering"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 pl-10 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all"
                />
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Department / Course of Study
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Bachelor of Medicine & Bachelor of Surgery (MBChB)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 pl-10 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Bio / Student Notes
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Brief note about your year of study, campus hall, or student association..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 pl-10 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="save-profile-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MyProfile;
