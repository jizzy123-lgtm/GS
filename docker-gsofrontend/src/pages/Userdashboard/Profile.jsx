import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Icon from '../../components/Icon';
import { Sidebar, MENU_ITEMS as SIDEBAR_MENU_ITEMS } from '../../components/Sidebar';

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'CLOSE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const MENU_ITEMS = SIDEBAR_MENU_ITEMS;

const Profile = () => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false
  });
  const mobileMenuRef  = useRef(null); //mao ni ang ref para sa mobile menu, nga magamit para i-detect kung naay click outside sa menu aron ma-close siya. Ang useRef kay hook nga nag-return og mutable ref object nga mag-hold sa current value sa mobile menu element. Magamit ni siya para i-access ang DOM element sa mobile menu ug i-check kung ang click target kay naa ba sulod sa menu or dili.
  const fileInputRef   = useRef(null); //mao ni ang ref para sa hidden file input, nga magamit para i-trigger ang file picker dialog kung i-click ang "Change Picture" button. Ang useRef kay hook nga nag-return og mutable ref object nga mag-hold sa current value sa file input element. Magamit ni siya para i-access ang DOM element sa file input ug i-call ang click() method para ma-open ang file picker.
  const cameraInputRef = useRef(null); //mao ni ang ref para sa hidden camera input, nga magamit para i-trigger ang camera capture dialog kung i-click ang "Take Photo" button. Ang useRef kay hook nga nag-return og mutable ref object nga mag-hold sa current value sa camera input element. Magamit ni siya para i-access ang DOM element sa camera input ug i-call ang click() method para ma-open ang camera capture.
  const videoRef       = useRef(null); //mao ni ang ref para sa video element sa camera modal, nga magamit para i-attach ang media stream gikan sa getUserMedia. Ang useRef kay hook nga nag-return og mutable ref object nga mag-hold sa current value sa video element. Magamit ni siya para i-access ang DOM element sa video ug i-set ang srcObject property aron ma-display ang camera feed.

  const [profilePicture,     setProfilePicture]     = useState(() => localStorage.getItem('profilePicture') || null); 
  //mao ni ang state para sa profile picture, nga nag-initialize gikan sa localStorage kung naa, or null kung wala. Ang setProfilePicture kay function para i-update ang profile picture state.
  
  const [previewImage,       setPreviewImage]       = useState(null); //mao ni ang state para sa preview image, nga mag-hold sa temporary URL sa image nga gi-select gikan sa file input or camera. Magamit ni siya para i-preview ang bag-ong picture before i-upload.
  const [selectedFile,       setSelectedFile]       = useState(null); //mao ni ang state para sa selected file, nga mag-hold sa actual File object nga gi-select gikan sa file input or camera. Magamit ni siya para i-upload ang picture sa backend.
  const [isUploadingPicture, setIsUploadingPicture] = useState(false); //mao ni ang state para sa upload status, nga boolean nga nag-indicate kung nag-upload ba siya or dili. Magamit ni siya para i-disable ang upload button ug i-show ang loading state while nag-upload.
  const [imgError,           setImgError]           = useState(false); //mao ni ang state para sa image error, nga boolean nga nag-indicate kung naay error sa pag-load sa profile picture. Magamit ni siya para i-fallback sa initial if naay error, ug para i-avoid ang infinite loading state kung broken ang image URL.
  const [showCameraModal,    setShowCameraModal]    = useState(false); //mao ni ang state para sa camera modal, nga boolean nga nag-indicate kung ipakita ba ang camera modal or dili. Magamit ni siya para i-toggle ang visibility sa camera modal.
  const [stream,             setStream]             = useState(null);  //mao ni ang state para sa media stream, nga mag-hold sa MediaStream object nga nakuha gikan sa getUserMedia. Magamit ni siya para i-attach sa video element sa camera modal, ug para i-stop ang stream kung tapos na.
  const [showUploadOptions,  setShowUploadOptions]  = useState(false); //mao ni ang state para sa upload options, nga boolean nga nag-indicate kung ipakita ba ang upload options (gallery or camera) or dili. Magamit ni siya para i-toggle ang visibility sa upload options menu.

  const [formData, setFormData] = useState({
    requesting_personnel: '',
    position:             '',
    requesting_office:    '',
    contact_number:       '',
    username:             '',
    email:                '',
    role_id:              ''
  });

  const [editFormData, setEditFormData] = useState({
    full_name:             '',
    position:              '',
    office:                '',
    contact_number:        '',
    username:              '',
    email:                 '',
    password:              '',
    password_confirmation: ''
  });

  const [isEditing,          setIsEditing]          = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [status, setStatus] = useState({
    isFetchingUserDetails: false,
    isUpdatingProfile:     false,
    error:                 null,
    success:               null
  });

  const [token, setToken] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ── outside-click closes mobile menu ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        dispatch({ type: 'CLOSE_MOBILE_MENU' });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authToken) {
      setStatus(prev => ({ ...prev, error: 'Unauthorized: Please log in to continue', isFetchingUserDetails: false }));
      const timer = setTimeout(() => navigate('/loginpage'), 2000);
      return () => clearTimeout(timer);
    }
    setToken(authToken);
  }, [navigate]);

  // ── fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const fetchUserDetails = async () => {
      try {
        setStatus(prev => ({ ...prev, isFetchingUserDetails: true }));
        const response = await fetch(`${API_BASE_URL}/profile/userInfos`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch user details');

        setFormData(prev => ({
          ...prev,
          requesting_personnel: data.full_name      || '',
          position:             data.position       || '',
          requesting_office:    data.office         || '',
          contact_number:       data.contact_number || '',
          username:             data.username       || '',
          email:                data.email          || '',
          role_id:              data.role_id        || ''
        }));

        setEditFormData(prev => ({
          ...prev,
          full_name:      data.full_name      || '',
          position:       data.position       || '',
          office:         data.office         || '',
          contact_number: data.contact_number || '',
          username:       data.username       || '',
          email:          data.email          || ''
        }));

        // Only update picture if backend returns one — never reset to null
        if (data.profile_picture) {
          setImgError(false);
          const picUrl = data.profile_picture + '?t=' + Date.now();
          setProfilePicture(picUrl);
          localStorage.setItem('profilePicture', data.profile_picture);
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        setStatus(prev => ({ ...prev, error: err.message || 'Failed to fetch user details' }));
      } finally {
        setStatus(prev => ({ ...prev, isFetchingUserDetails: false, success: null }));
      }
    };
    fetchUserDetails();
  }, [token, API_BASE_URL]);

  // ── attach stream to video element ────────────────────────────────────────
  useEffect(() => {
    if (showCameraModal && videoRef.current && stream)
      videoRef.current.srcObject = stream;
  }, [showCameraModal, stream]);

  // ── logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      const t = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!t) throw new Error('No token found');
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${t}` },
        mode: 'cors',
      });
      ['authToken', 'user'].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      navigate('/loginpage', { replace: true });
    } catch (err) {
      console.error(err.message || 'An error occurred during logout');
    }
  }, [navigate, API_BASE_URL]);

  const roles = [
    { label: 'Select Role', value: '',  disabled: true },
    { label: 'Admin',       value: 1 },
    { label: 'Head',        value: 2 },
    { label: 'Staff',       value: 3 },
    { label: 'Requester',   value: 4 },
  ];

  const getRoleLabel = (role_id) => {
    const role = roles.find(r => r.value === Number(role_id));
    return role ? role.label : 'Unknown Role';
  };

  // ── picture handlers ───────────────────────────────────────────────────────
  const handleAvatarClick  = () => setShowUploadOptions(true); //mao ni ang handler para sa pag-click sa avatar/profile picture, nga mag-toggle sa visibility sa upload options (gallery or camera). Ang setShowUploadOptions(true) kay mag-set sa showUploadOptions state to true, nga mag-trigger sa pag-render sa upload options menu.

  const handleGalleryClick = () => { 
    setShowUploadOptions(false);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };
  const handleCameraClick = async () => { //mao ni ang handler para sa pag-click sa "Take Photo" option, nga mag-toggle sa visibility sa camera modal ug mag-request og camera access. Ang setShowUploadOptions(false) kay mag-set sa showUploadOptions state to false, aron ma-hide ang upload options menu. Unya, i-check niya kung mobile ba ang device gamit ang user agent string. Kung mobile, i-trigger niya ang click event sa hidden camera input gamit ang cameraInputRef, aron ma-open ang camera capture dialog. Kung dili mobile, mag-try siya og request sa camera access gamit ang navigator.mediaDevices.getUserMedia. Kung successful, i-set niya ang nakuha nga media stream sa stream state ug i-show ang camera modal. Kung naay error (e.g., access denied), i-set niya ang error message sa status state.
    setShowUploadOptions(false); // Hide upload options menu
    if (/Mobi|Android/i.test(navigator.userAgent)) { //Kini nag-check kung mobile device ang gigamit sa user
      setTimeout(() => cameraInputRef.current?.click(), 100); //Kung mobile device, i-trigger niya ang click event sa hidden camera input gamit ang cameraInputRef, aron ma-open ang camera capture dialog.
    } else {

      // If not mobile, try to access the camera directly using getUserMedia. This will work on desktop browsers that support it, and provide a better experience than the file input method.
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true }); // Mag-request og camera access. Kung successful, makakuha siya og MediaStream object nga nag-represent sa camera feed.
        setStream(mediaStream); // I-set ang nakuha nga media stream sa stream state, aron magamit siya sa video element sa camera modal.
        setShowCameraModal(true); // I-show ang camera modal by setting showCameraModal state to true, aron ma-render ang modal nga nag-display sa camera feed ug mga buttons para mag-capture o mag-cancel.
      } catch {
        setStatus(prev => ({ ...prev, error: 'Camera access denied or not available.' })); // Kung naay error (e.g., access denied, no camera), i-set niya ang error message sa status state aron ma-display sa user.
      }
    }
  };

  // Handler for when the user selects a file from the file input. This will validate the file type and size, and if valid, set the selected file and create a preview URL for it. If invalid, it will set an error message in the status state.
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Ikuha ang unang file nga gi-select sa user gikan sa file input event. Ang e.target.files kay usa ka FileList object nga nag-hold sa mga files nga gi-select, ug [0] kay para makuha ang first file (since single file input). Ang file variable kay mag-represent sa selected file nga i-upload.
    if (!file) return;
    if (!file.type.startsWith('image/')) { // I-check kung ang file type kay image. Kung dili, i-set niya ang error message sa status state aron ma-display sa user, ug i-return para dili mag-proceed sa upload process.
      setStatus(prev => ({ ...prev, error: 'Please select a valid image file.' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // I-check kung ang file size kay mas dako sa 2 MB (2 * 1024 * 1024 bytes). Kung dako, i-set niya ang error message sa status state aron ma-display sa user, ug i-return para dili mag-proceed sa upload process.
      setStatus(prev => ({ ...prev, error: 'Image must be smaller than 2 MB.' }));
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));  // Kung valid ang file, i-set niya ang selected file sa selectedFile state, ug i-create niya ang preview URL gamit ang URL.createObjectURL(file) para ma-preview ang image before i-upload. Ang previewImage state kay mag-hold sa temporary URL nga magamit sa img src para i-display ang preview.
    setImgError(false);
    setStatus(prev => ({ ...prev, error: null })); // I-clear ang previous error message sa status state kung naa, aron ma-reset ang error state kung successful ang file selection.
  };

  // Handler for uploading the selected profile picture to the backend. This will create a FormData object, append the selected file, and send a POST request to the upload endpoint. If successful, it will update the profile picture URL and show a success message. If failed, it will show an error message.
  const uploadProfilePicture = async () => {
    if (!selectedFile) return;
    try {
      setIsUploadingPicture(true);
      setStatus(prev => ({ ...prev, error: null, success: null }));

      const formDataObj = new FormData();
      formDataObj.append('profile_picture', selectedFile);

      const response = await fetch(`${API_BASE_URL}/profile/upload-picture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formDataObj,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to upload picture');

      const newUrl = data.profile_picture
        ? data.profile_picture + '?t=' + Date.now()
        : previewImage;

      setProfilePicture(newUrl);
      setImgError(false);
      if (data.profile_picture) localStorage.setItem('profilePicture', data.profile_picture);

      setPreviewImage(null);
      setSelectedFile(null);
      setStatus(prev => ({ ...prev, success: 'Profile picture updated successfully.' }));
    } catch (err) {
      console.error('Error uploading picture:', err);
      setStatus(prev => ({ ...prev, error: err.message || 'Failed to upload picture' }));
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handler for canceling the picture change process, which will reset the preview image and selected file, and clear the file input value. This will allow the user to start over if they change their mind about uploading a new picture.
  const cancelPictureChange = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handler for capturing a photo from the camera stream. This will draw the current video frame onto a canvas, convert it to a blob, and create a File object from it. Then it will set the selected file and preview image, and close the camera modal. This allows the user to take a new photo using their webcam and use it as their profile picture.
  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(blob));
      setImgError(false);
    }, 'image/jpeg');
    stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setShowCameraModal(false);
  };

  // Handler for closing the camera modal, which will stop the media stream and reset the related states. This will ensure that the camera is turned off and resources are released when the user closes the modal without capturing a photo.
  const closeCameraModal = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setShowCameraModal(false);
  };

  // ── edit form handlers ─────────────────────────────────────────────────────
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
      setShowPasswordFields(false);
    }
  };

  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    if (!showPasswordFields)
      setEditFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
  };

  const refreshUserDetails = () => {
    const currentToken = token;
    setToken('');
    setTimeout(() => setToken(currentToken), 10);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setStatus(prev => ({ ...prev, isUpdatingProfile: true, error: null, success: null }));

      const requestBody = {
        full_name:      editFormData.full_name,
        contact_number: editFormData.contact_number,
        office:         editFormData.office,
        position:       editFormData.position,
        email:          editFormData.email,
        username:       editFormData.username
      };

      if (showPasswordFields && editFormData.password) {
        requestBody.password              = editFormData.password;
        requestBody.password_confirmation = editFormData.password_confirmation;
      }

      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');

      // Update display data directly — no refetch, picture state untouched
      setFormData(prev => ({
        ...prev,
        requesting_personnel: editFormData.full_name,
        position:             editFormData.position,
        requesting_office:    editFormData.office,
        contact_number:       editFormData.contact_number,
        username:             editFormData.username,
        email:                editFormData.email,
      }));

      setStatus(prev => ({ ...prev, success: 'Profile updated successfully' }));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setStatus(prev => ({ ...prev, error: err.message || 'Failed to update profile' }));
    } finally {
      setStatus(prev => ({ ...prev, isUpdatingProfile: false }));
    }
  };

  const displaySrc  = previewImage || (!imgError ? profilePicture : null) || null; // Ang displaySrc kay variable nga mag-determine kung unsang image URL ang i-display sa profile picture. Priority niya ang previewImage (kung naa, gikan sa bag-ong gi-select nga file), unya ang profilePicture (kung wala error sa pag-load), ug kung wala gyud, null (which will trigger the fallback initial). Ang imgError state kay gigamit para i-check kung naay error sa pag-load sa profile picture, aron ma-avoid ang infinite loading state kung broken ang URL.
  const viewInitial = formData.requesting_personnel?.charAt(0)?.toUpperCase() || 'U';
  const editInitial = editFormData.full_name?.charAt(0)?.toUpperCase()        || 'U';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white p-4 flex justify-between items-center relative">
        <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
        <div className="hidden md:block text-xl font-bold text-white">User</div>
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })}
            className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors"
            aria-label="Toggle menu"
            aria-expanded={state.isMobileMenuOpen}
          >
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
          </button>
        </div>
        <div
          ref={mobileMenuRef}
          className={`absolute md:hidden top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-30 transition-all duration-300 ease-out overflow-hidden ${
            state.isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="py-2">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.text}
                to={item.to}
                className="flex items-center px-4 py-3 text-sm hover:bg-gray-700 transition-colors"
                onClick={() => dispatch({ type: 'CLOSE_MOBILE_MENU' })}
              >
                <Icon path={item.icon} className="w-5 h-5 mr-3" />
                {item.text}
              </NavLink>
            ))}
          </nav>
          <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-700">
            Created By Exverter
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isSidebarCollapsed={state.isSidebarCollapsed}
          onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          menuItems={MENU_ITEMS}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 overflow-auto bg-white/95 backdrop-blur-sm">
          <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
              <div className="md:flex">
                <div className="p-8 w-full">

                  <div className="flex justify-between items-center mb-6">
                    <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                      User Profile
                    </div>
                  </div>

                  {status.error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <p className="text-sm text-red-700">{status.error}</p>
                    </div>
                  )}
                  {status.success && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                      <p className="text-sm text-green-700">{status.success}</p>
                    </div>
                  )}

                  {/* Hidden file inputs */}
                  <input ref={fileInputRef}   type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

                  <div className="relative">
                    {!isEditing ? (
                      /* ── View Mode ── */
                      <>
                        {/* Avatar */}
                        <div className="flex flex-col items-center mb-6">
                          <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                            {/* Kung naay picture, i-show ang img, otherwise initial letter */}
                            {displaySrc ? (
                              <img
                                src={displaySrc}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                              />
                            ) : (
                              <span className="text-3xl text-indigo-500 font-medium">{viewInitial}</span>
                            )}
                          </div>
                        </div>

                        {/* Name / position / role */}
                        <div className="mb-6">
                          <h1 className="text-2xl font-bold text-center text-gray-900">
                            {formData.requesting_personnel || 'User Name'}
                          </h1>
                          <p className="text-gray-500 text-center">{formData.position || 'Position'}</p>
                          <p className="text-indigo-500 text-center font-medium mt-1">
                            {getRoleLabel(formData.role_id)}
                          </p>
                        </div>

                        {/* Detail rows */}
                        <div className="space-y-4">
                          {[
                            { label: 'Username',       value: formData.username              },
                            { label: 'Email',          value: formData.email                 },
                            { label: 'Full Name',      value: formData.requesting_personnel  },
                            { label: 'Position',       value: formData.position              },
                            { label: 'Role',           value: getRoleLabel(formData.role_id) },
                            { label: 'Office',         value: formData.requesting_office     },
                            { label: 'Contact Number', value: formData.contact_number        },
                          ].map(({ label, value }) => (
                            <div key={label} className="border-t border-gray-200 pt-4">
                              <div className="flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                                <dd className="text-sm text-gray-900">{value || 'Not Available'}</dd>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Preview bar for new profile picture */}
                        {previewImage && (
                          <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={previewImage} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                              <span className="text-sm text-indigo-700 font-medium">New photo ready</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={uploadProfilePicture}
                                disabled={isUploadingPicture}
                                className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {isUploadingPicture ? 'Uploading…' : 'Save'} 
                              </button>
                              <button
                                onClick={cancelPictureChange}
                                className="px-3 py-1 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-8 space-y-4">
                          <button
                            onClick={toggleEditMode}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={status.isFetchingUserDetails}
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={refreshUserDetails}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={status.isFetchingUserDetails}
                          >
                            {status.isFetchingUserDetails ? 'Refreshing...' : 'Refresh Profile'}
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ── Edit Mode ── */
                      <form onSubmit={updateProfile}>
                        {/* Avatar with camera overlay */}
                        <div className="flex flex-col items-center mb-6">
                          <div className="relative w-24 h-24 cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                              {displaySrc ? (
                                <img
                                  src={displaySrc}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                  onError={() => setImgError(true)}
                                />
                              ) : (
                                <span className="text-3xl text-indigo-500 font-medium">{editInitial}</span>
                              )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-gray-400">Max 2MB</p>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                          {[
                            { id: 'full_name',      label: 'Full Name',      type: 'text',  required: true  },
                            { id: 'username',       label: 'Username',       type: 'text',  required: true  },
                            { id: 'email',          label: 'Email',          type: 'email', required: true  },
                            { id: 'position',       label: 'Position',       type: 'text',  required: false },
                            { id: 'office',         label: 'Office',         type: 'text',  required: false },
                            { id: 'contact_number', label: 'Contact Number', type: 'text',  required: false },
                          ].map(({ id, label, type, required }) => (
                            <div key={id} className="mb-4">
                              <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
                              <input
                                type={type} name={id} id={id}
                                value={editFormData[id]}
                                onChange={handleEditInputChange}
                                required={required}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                          ))}

                          {/* Toggle password */}
                          <div className="mb-4">
                            <button
                              type="button"
                              onClick={togglePasswordFields}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                            >
                              {showPasswordFields ? 'Hide Password Fields' : 'Update Password'}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {showPasswordFields
                                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                }
                              </svg>
                            </button>
                          </div>

                          {showPasswordFields && (
                            <>
                              <div className="mb-4">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                                <input type="password" name="password" id="password"
                                  value={editFormData.password} onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                              </div>
                              <div className="mb-4">
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                <input type="password" name="password_confirmation" id="password_confirmation"
                                  value={editFormData.password_confirmation} onChange={handleEditInputChange}
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                              </div>
                              {editFormData.password && editFormData.password !== editFormData.password_confirmation && (
                                <div className="text-red-500 text-sm mb-4">Passwords do not match</div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Submit / Cancel */}
                        <div className="mt-8 space-y-4">
                          <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={
                              status.isUpdatingProfile ||
                              (showPasswordFields && editFormData.password && editFormData.password !== editFormData.password_confirmation)
                            }
                          >
                            {status.isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={toggleEditMode}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Upload Options Modal (gallery or camera) */}
      {showUploadOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowUploadOptions(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">Update Profile Photo</h3>
            <div className="flex gap-4 justify-center">
              <button type="button" onClick={handleGalleryClick}
                className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 flex-1">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Gallery</span>
              </button>
              <button type="button" onClick={handleCameraClick}
                className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 flex-1">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Camera</span>
              </button>
            </div>
            <button type="button" onClick={() => setShowUploadOptions(false)}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Camera Modal (webcam) */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-md">
            <h3 className="text-base font-semibold text-gray-800 mb-4 text-center">Take a Photo</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black" />
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={capturePhoto}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                📸 Capture
              </button>
              <button type="button" onClick={closeCameraModal}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;