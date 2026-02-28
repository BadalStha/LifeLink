import React, { useState } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';

export default function ContactModal({ isOpen, onClose, donorName }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onClose();
      setMessage("");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-red-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} />
            <div>
              <h3 className="font-bold text-lg">Contact Donor</h3>
              <p className="text-red-100 text-xs font-medium">Recipient: {donorName}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-red-700 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {sent ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={30} />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Message Sent!</h4>
              <p className="text-slate-500 mt-2">The donor has been notified via LifeLink SMS.</p>
            </div>
          ) : (
            <form onSubmit={handleSend}>
              <label className="block text-sm font-bold text-slate-700 mb-2">Your Message</label>
              <textarea
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 h-40 resize-none transition-all"
                placeholder={`Hi ${donorName}, we have an emergency at...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
              
              <div className="mt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  Send <Send size={18} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}