import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fitzy } from "@/api/fitzyClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Camera, User, Phone, Mail, Loader2, CheckCircle } from "lucide-react";

export default function PersonalInfoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => fitzy.auth.me(),
    retry: false,
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
      setProfilePicPreview(user.profile_picture_url || "");
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (updatedData) => {
      let finalData = { ...updatedData };
      if (profilePicFile) {
        const { file_url } = await fitzy.integrations.Core.UploadFile({ file: profilePicFile });
        finalData.profile_picture_url = file_url;
      }
      await fitzy.auth.updateMe(finalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      // Optionally show a success message
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="min-h-screen pt-20 px-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Personal Info</h1>
      </div>

      {isError && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          We couldn&apos;t reach the Fitzy API right now. You can still review your details, but saving will require the backend to be online.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-400 to-brand-700 overflow-hidden shadow-lg">
              {profilePicPreview ? (
                <img src={profilePicPreview} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
                  {formData.first_name?.[0] || 'U'}
                </div>
              )}
            </div>
            <label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-brand-700 transition-colors border-4 border-white">
              <Camera className="w-5 h-5" />
            </label>
            <input
              id="profile-pic-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-gray-200 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full pl-12 pr-4 py-4 bg-gray-100 text-gray-500 rounded-2xl border-2 border-gray-200 cursor-not-allowed"
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={updateUserMutation.isLoading}
          className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold text-lg rounded-2xl hover:from-brand-700 hover:to-brand-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {updateUserMutation.isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : updateUserMutation.isSuccess ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
