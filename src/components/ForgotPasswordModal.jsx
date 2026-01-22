import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Check } from 'lucide-react';
import { useToast } from './CustomToast';

export default function ForgotPasswordModal({ isOpen, onClose, email }) {
  const [step, setStep] = useState('otp'); // 'otp' | 'reset'
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const toast = useToast();
  
  // Password Reset State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const otpInputRefs = useRef([]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isOpen && step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('otp');
      setTimer(30);
      setOtp(['', '', '', '']);
      setPasswords({ newPassword: '', confirmPassword: '' });
    }
  }, [isOpen]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }
    // Mock verification
    if (enteredOtp === '1234') { 
        toast.success('OTP Verified Successfully');
        setStep('reset');
    } else {
        // allowing any OTP for demo purposes if not 1234, or could be strict. 
        // Let's make it always success for UI Demo as user didn't provide backend
        toast.success('OTP Verified'); 
        setStep('reset');
    }
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= 8 && password.length <= 16,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const criteria = validatePassword(passwords.newPassword);

  const handleResetPassword = () => {
    if (!criteria.length || !criteria.upper || !criteria.lower || !criteria.number || !criteria.special) {
      toast.error("Password does not meet requirements");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // API Call would go here
    toast.success("Password Reset Successfully");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl w-full max-w-4xl p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors border border-red-200"
        >
          <X className="w-6 h-6 text-red-500" />
        </button>

        {step === 'otp' ? (
          /* OTP Section */
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <h2 className="text-4xl font-normal mb-8 text-black">Forgot Password ?</h2>
            
            <p className="text-gray-600 mb-2 font-medium">
              We have sent One Time Password (OTP) via email to this Account
            </p>
            <p className="text-[#4c5add] font-semibold text-lg mb-12">
              {email || 'example@gmail.com'}
            </p>

            <div className="flex gap-6 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-16 h-16 border-[1.5px] border-[#373d8b]/40 rounded-xl text-center text-2xl font-semibold text-[#373d8b] focus:border-[#4c5add] focus:ring-4 focus:ring-[#4c5add]/10 outline-none transition-all"
                />
              ))}
            </div>

            <div className="text-[#373d8b] font-medium mb-10">
              Resent in <span className="font-bold">00.{timer.toString().padStart(2, '0')}</span>
            </div>

            <button
              onClick={handleVerifyOtp}
              className="w-64 py-3.5 bg-[#4c5add] hover:bg-[#3f4bc0] text-white rounded-full font-semibold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02]"
            >
              Verify OTP
            </button>
          </div>
        ) : (
          /* Reset Password Section */
          <div className="py-6 px-4">
            <h2 className="text-4xl font-normal text-center mb-12 text-black">Reset your Password</h2>
            
            <div className="flex flex-col lg:flex-row gap-16 justify-center max-w-5xl mx-auto">
              {/* Left Column: Inputs */}
              <div className="flex-1 space-y-8 max-w-md">
                <div className="space-y-3">
                  <label className="text-lg font-semibold ml-1 text-black">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      className="w-full px-6 py-3.5 rounded-full border border-[#373d8b]/30 text-gray-800 focus:border-[#4c5add] focus:ring-4 focus:ring-[#4c5add]/10 outline-none transition-all placeholder-gray-400"
                      placeholder="Create your new Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#373d8b]"
                    >
                        {showNewPass ? <EyeOff size={22}/> : <Eye size={22}/>}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-lg font-semibold ml-1 text-black">Re-Enter Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                      className="w-full px-6 py-3.5 rounded-full border border-[#373d8b]/30 text-gray-800 focus:border-[#4c5add] focus:ring-4 focus:ring-[#4c5add]/10 outline-none transition-all placeholder-gray-400"
                      placeholder="Re - Enter your Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#373d8b]"
                    >
                        {showConfirmPass ? <EyeOff size={22}/> : <Eye size={22}/>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Requirements */}
              <div className="flex-1 space-y-5 pt-2 max-w-md bg-transparent">
                  <RequirementItemV2 met={criteria.length} text="Minimum 8 characters (Maximum 16 characters)" />
                  <RequirementItemV2 met={criteria.upper} text="At least 1 uppercase letter (A-Z)" />
                  <RequirementItemV2 met={criteria.lower} text="At least 1 lowercase letter (a-z)" />
                  <RequirementItemV2 met={criteria.number} text="At least 1 number (0-9)" />
                  <RequirementItemV2 met={criteria.special} text="At least 1 special character (! @ # $ % ^ & *)" />
              </div>
            </div>

            <div className="flex justify-center mt-12">
                <button
                onClick={handleResetPassword}
                className="w-72 py-3.5 bg-[#4c5add] hover:bg-[#3f4bc0] text-white rounded-full font-semibold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02]"
                >
                Reset Password
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RequirementItemV2({ met, text }) {
    return (
      <div className="flex items-center gap-3">
        {met ? (
          <Check className="w-5 h-5 text-green-500 shrink-0" strokeWidth={2.5} />
        ) : (
          <Check className="w-5 h-5 text-red-500 shrink-0" strokeWidth={2.5} /> 
        )}
         <span className={`text-[15px] font-medium ${met ? 'text-gray-700' : 'text-gray-500'}`}>{text}</span>
      </div>
    );
}
