import React, { useState } from 'react';
import { X, Upload, Camera, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { authAPI } from '../services/api';

export default function KYCModal({ isOpen, onClose, onSuccess, user }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: '',
    father_name: '',
    grandfather_name: '',
    occupation: '',
    marital_status: 'Single',
    permanent_address: '',
    current_address: '',
    document_type: 'Citizenship ID',
    document_number: '',
    issued_date: '',
    issued_district: '',
  });
  
  const [files, setFiles] = useState({
    front_image: null,
    back_image: null,
    selfie_image: null,
  });

  const [previews, setPreviews] = useState({
    front: null,
    back: null,
    selfie: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isCitizenship = formData.document_type === 'Citizenship ID' || formData.document_type === 'Citizenship';

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field.replace('_image', '')]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.gender || !formData.father_name || !formData.grandfather_name) {
        setError('Please fill all required personal details');
        return;
      }
    } else if (step === 2) {
      if (!formData.permanent_address || !formData.current_address) {
        setError('Please fill all address details');
        return;
      }
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.front_image || !files.selfie_image || !formData.document_number) {
      setError('Document info and images are required');
      return;
    }
    if (isCitizenship && !files.back_image) {
      setError('Back image is required for Citizenship ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key]);
      });

      await authAPI.uploadKyc(data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload KYC documents');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPermanentAddress = () => {
    setFormData(prev => ({ ...prev, current_address: prev.permanent_address }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Verify Your Identity</h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Step {step} of 3: {step === 1 ? 'Personal Details' : step === 2 ? 'Address Information' : 'Document Upload'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className={`h-full bg-red-600 transition-all duration-300 ${s <= step ? 'w-full' : 'w-0'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <form id="kyc-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2 duration-200">
                <AlertTriangle size={18} className="shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Gender <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Marital Status</label>
                    <select
                      value={formData.marital_status}
                      onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Father's Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Father's Name"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Grandfather's Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Grandfather's Name"
                      value={formData.grandfather_name}
                      onChange={(e) => setFormData({ ...formData, grandfather_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Occupation (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineer, Student"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Details */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-black text-slate-500 uppercase">Permanent Address <span className="text-red-500">*</span></label>
                    </div>
                    <textarea
                      required
                      rows={2}
                      placeholder="House No, Street, Ward, Rural/Municipality, District, Province"
                      value={formData.permanent_address}
                      onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-xs font-black text-slate-500 uppercase">Current Address <span className="text-red-500">*</span></label>
                      <button 
                        type="button" 
                        onClick={copyPermanentAddress}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded-lg transition-colors"
                      >
                        Same as Permanent
                      </button>
                    </div>
                    <textarea
                      required
                      rows={2}
                      placeholder="House No, Street, Ward, Rural/Municipality, District, Province"
                      value={formData.current_address}
                      onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Document Details */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Document Type <span className="text-red-500">*</span></label>
                    <select
                      value={formData.document_type}
                      onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="Citizenship ID">Citizenship ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Document Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.document_number}
                      onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                      placeholder="Enter ID number"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Issued Date</label>
                    <input
                      type="date"
                      value={formData.issued_date}
                      onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Issued District</label>
                    <input
                      type="text"
                      value={formData.issued_district}
                      onChange={(e) => setFormData({ ...formData, issued_district: e.target.value })}
                      placeholder="e.g. Kathmandu"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Image */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase ml-1">Front Side <span className="text-red-500">*</span></p>
                    <div 
                      className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${
                        previews.front ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/30'
                      }`}
                      onClick={() => document.getElementById('front-upload').click()}
                    >
                      {previews.front ? (
                        <img src={previews.front} className="absolute inset-0 w-full h-full object-cover" alt="Front" />
                      ) : (
                        <Upload size={24} className="text-slate-300" />
                      )}
                      <input id="front-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'front_image')} />
                    </div>
                  </div>

                  {/* Back Image (Conditional) */}
                  <div className={`space-y-2 transition-opacity duration-300 ${isCitizenship ? 'opacity-100' : 'opacity-40 cursor-not-allowed grayscale'}`}>
                    <p className="text-xs font-bold text-slate-500 uppercase ml-1">Back Side {isCitizenship && <span className="text-red-500">*</span>}</p>
                    <div 
                      className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${
                        previews.back ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'
                      } ${!isCitizenship && 'pointer-events-none'}`}
                      onClick={() => isCitizenship && document.getElementById('back-upload').click()}
                    >
                      {previews.back ? (
                        <img src={previews.back} className="absolute inset-0 w-full h-full object-cover" alt="Back" />
                      ) : (
                        <Upload size={24} className="text-slate-300" />
                      )}
                      <input id="back-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'back_image')} />
                    </div>
                  </div>
                </div>

                {/* Selfie */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase ml-1">Selfie with Document <span className="text-red-500">*</span></p>
                  <div 
                    className={`relative h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 ${
                      previews.selfie ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'
                    }`}
                    onClick={() => document.getElementById('selfie-upload').click()}
                  >
                    {previews.selfie ? (
                      <img src={previews.selfie} className="absolute inset-0 w-full h-full object-cover" alt="Selfie" />
                    ) : (
                      <Camera size={24} className="text-slate-300" />
                    )}
                    <input id="selfie-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie_image')} />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] py-3 px-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-200"
            >
              Continue to {step === 1 ? 'Address' : 'Documents'}
            </button>
          ) : (
            <button
              form="kyc-form"
              type="submit"
              disabled={isLoading || !files.front_image || !files.selfie_image || !formData.document_number || (isCitizenship && !files.back_image)}
              className="flex-[2] py-3 px-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-red-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={18} /> Submitting...</>
              ) : (
                <><CheckCircle size={18} /> Submit for Review</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Shield(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
