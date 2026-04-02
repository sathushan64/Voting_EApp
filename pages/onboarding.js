import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// INTERNAL IMPORT
import { VotingContext } from '../context/Voter';
import Button from '../components/Button';
import Input from '../components/Input';

const Onboarding = () => {
    const { currentAccount, votingOrganizer, uploadToIPFS, uploadJSONToIPFS, checkOnboardStatus } = useContext(VotingContext);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("Voter");

    const [electionPin, setElectionPin] = useState("");
    const [electionName, setElectionName] = useState("");
    const [pinLoading, setPinLoading] = useState(false);
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Form State (Voter/Candidate)
    const [formData, setFormData] = useState({
        name: "",
        nic: "",
        dob: "",
        gender: "Male",
        phone: "",
        email: "",
        address: ""
    });

    // Admin Form State
    const [adminData, setAdminData] = useState({
        name: "",
        age: "",
        position: "",
        email: ""
    });

    // OTP State
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showOtpPhone, setShowOtpPhone] = useState(false);
    const [showOtpEmail, setShowOtpEmail] = useState(false);
    const [otpInputs, setOtpInputs] = useState({ phone: "", email: "" });
    const [verifying, setVerifying] = useState({ phone: false, email: false });

    // Verification Images State
    const [files, setFiles] = useState({
        nicFront: null,
        nicBack: null,
        selfie: null
    });
    
    // IPFS URLs
    const [ipfsUrls, setIpfsUrls] = useState({
        nicFront: "",
        nicBack: "",
        selfie: ""
    });

    // Dropzone logic 
    const createDropzone = (field) => {
        const onDrop = useCallback((acceptedFiles) => {
            setFiles((prev) => ({ ...prev, [field]: acceptedFiles[0] }));
        }, []);
        return useDropzone({ onDrop, accept: {'image/*': []}, maxFiles: 1 });
    };

    const dropNicFront = createDropzone("nicFront");
    const dropNicBack = createDropzone("nicBack");
    const dropSelfie = createDropzone("selfie");

    // Initialize PIN from query if passed from homepage
    useEffect(() => {
        if (router.query.pin) {
            setElectionPin(router.query.pin);
        }
    }, [router.query.pin]);

    // Auto-verify PIN when it reaches 6 digits
    useEffect(() => {
        if (electionPin && electionPin.length === 6) {
            const verifyPin = async () => {
                setPinLoading(true);
                try {
                    const res = await fetch('/api/verifyCode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: electionPin })
                    });
                    const data = await res.json();
                    if (data.valid) {
                        setElectionName(data.electionTitle);
                    } else {
                        setElectionName("Invalid PIN");
                    }
                } catch (err) {
                    setElectionName("Error");
                }
                setPinLoading(false);
            };
            verifyPin();
        } else {
            setElectionName("");
        }
    }, [electionPin]);

    const sendOtp = async (type, target) => {
        if (!target) return setErrorMsg(`Please input a valid ${type} first.`);
        setVerifying(prev => ({...prev, [type]: true}));
        try {
            const res = await axios.post('/api/otp', { action: 'send', target });
            if (type === 'phone') setShowOtpPhone(true);
            if (type === 'email') setShowOtpEmail(true);
            setErrorMsg(""); // clear error
            alert(`MOCK SMS/EMAIL SYSTEM\n\nYour 6-Digit Verification Code for ${target} is:\n\n >>  ${res.data.code}  <<`);
        } catch (error) {
            setErrorMsg(error.response?.data?.error || "Failed to send code.");
        }
        setVerifying(prev => ({...prev, [type]: false}));
    };

    const verifyOtp = async (type, target) => {
        const code = otpInputs[type];
        if (!code || code.length !== 6) return setErrorMsg(`Please enter a valid 6-digit code.`);
        setVerifying(prev => ({...prev, [type]: true}));
        try {
            await axios.post('/api/otp', { action: 'verify', target, code });
            if (type === 'phone') {
                setIsPhoneVerified(true);
                setShowOtpPhone(false);
            }
            if (type === 'email') {
                setIsEmailVerified(true);
                setShowOtpEmail(false);
            }
            setErrorMsg(""); 
        } catch (error) {
            setErrorMsg(error.response?.data?.error || "Invalid code.");
        }
        setVerifying(prev => ({...prev, [type]: false}));
    };

    const handleNext = () => {
        setErrorMsg("");
        if (step === 1) {
            if (!electionName || electionName === "Invalid PIN" || electionName === "Error") {
                return setErrorMsg("Please enter a valid 6-Digit Election PIN before proceeding.");
            }
            if (!formData.name || !formData.nic || !formData.dob || !formData.phone || !formData.email || !formData.address) {
                return setErrorMsg("Please fill in all personal information fields.");
            }
            if (formData.nic.length < 10) return setErrorMsg("Invalid NIC format.");
            if (!isPhoneVerified || !isEmailVerified) return setErrorMsg("You must verify your Phone and Email via OTP to proceed.");
        }
        if (step === 2) {
            if (!files.nicFront || !files.nicBack || !files.selfie) {
                return setErrorMsg("Please upload all required verification documents.");
            }
        }
        setStep(step + 1);
    };

    const handlePrev = () => setStep(step - 1);

    const handleSubmit = async () => {
        setLoading(true);
        setErrorMsg("");

        try {
            // 1. Upload images to IPFS
            const frontUrl = await uploadToIPFS(files.nicFront);
            const backUrl = await uploadToIPFS(files.nicBack);
            const selfieUrl = await uploadToIPFS(files.selfie);

            if (!frontUrl || !backUrl || !selfieUrl) {
                throw new Error("Failed to upload verification documents to IPFS.");
            }

            // 2. Build Master JSON Payload
            const masterPayload = {
                walletAddress: currentAccount,
                role: activeTab,
                personalDetails: {
                    name: formData.name,
                    nic: formData.nic,
                    dob: formData.dob,
                    gender: formData.gender,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                },
                verification: {
                    nicFront: frontUrl,
                    nicBack: backUrl,
                    selfie: selfieUrl
                },
                timestamp: Date.now()
            };

            // 3. Pin Master Payload to IPFS
            const masterIpfsUrl = await uploadJSONToIPFS(masterPayload);
            if (!masterIpfsUrl) {
                throw new Error("Failed to secure profile data to IPFS.");
            }

            // 4. Save to Mock DB API mapping Address -> IPFS Master Link
            const apiPayload = {
                address: currentAccount,
                role: activeTab,
                electionPin: electionPin || "N/A",
                cid: masterIpfsUrl
            };

            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to save user details.");
            }

            // 4. Update the global context status and Redirect
            await checkOnboardStatus(currentAccount);
            router.push('/');
        } catch (error) {
            console.error("Submission Error:", error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdminSubmit = async () => {
        setLoading(true);
        setErrorMsg("");

        if (!adminData.name || !adminData.age || !adminData.position || !adminData.email) {
            setErrorMsg("Please fill in all admin details fields.");
            setLoading(false);
            return;
        }

        try {
            // 1. Build Master Admin Payload
            const masterPayload = {
                walletAddress: currentAccount,
                role: "Admin",
                personalDetails: {
                    name: adminData.name,
                    age: adminData.age,
                    position: adminData.position,
                    email: adminData.email,
                },
                timestamp: Date.now()
            };

            // 2. Pin Master Payload to IPFS (no images)
            const masterIpfsUrl = await uploadJSONToIPFS(masterPayload);
            if (!masterIpfsUrl) {
                throw new Error("Failed to secure profile data to IPFS.");
            }

            // 3. Save to API mapping
            const apiPayload = {
                address: currentAccount,
                role: "Admin",
                cid: masterIpfsUrl
            };

            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to save admin details.");
            }

            // 4. Update the global context status and Redirect to create election
            await checkOnboardStatus(currentAccount);
            router.push('/create-election');
        } catch (error) {
            console.error("Admin Submission Error:", error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const removeFile = (e, field) => {
        e.stopPropagation(); // Prevent opening file dialog
        setFiles(prev => ({ ...prev, [field]: null }));
    };

    const renderDropzone = (dropzone, file, label, icon, field) => (
        <div className="mb-6 w-full">
            <h3 className="text-white text-sm mb-2">{label}</h3>
            <div {...dropzone.getRootProps()} className="w-full h-32 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700 hover:border-primary transition-all flex items-center justify-center cursor-pointer relative overflow-hidden group">
                <input {...dropzone.getInputProps()} />
                {file ? (
                    <>
                        <img src={URL.createObjectURL(file)} alt={label} className="w-full h-full object-cover" />
                        <button 
                            type="button" 
                            onClick={(e) => removeFile(e, field)}
                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-transform transform hover:scale-110 z-10"
                            title="Remove image"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </>
                ) : (
                    <div className="text-center p-4 flex flex-col items-center">
                        <span className="text-2xl mb-1">{icon}</span>
                        <p className="text-gray-400 text-xs group-hover:text-primary transition-colors">Drag & Drop or Click</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 pt-24">
            <div className="bg-paper p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-3xl relative overflow-hidden">
                
                {/* MetaMask Mobile Warning */}
                {(!currentAccount && typeof window !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) && (
                    <div className="bg-yellow-900/40 border border-yellow-500/50 text-yellow-200 p-4 rounded-xl mb-6 text-sm flex gap-3">
                        <svg className="w-6 h-6 shrink-0 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <strong className="block mb-1">Mobile Users Alert</strong>
                            Please manually open this link inside the <strong>MetaMask Application Browser</strong>. Web3 connections will not work in standard Safari or Chrome.
                        </div>
                    </div>
                )}

                {/* (Election Banner Removed as it is now in the form below) */}

                {/* Role Tabs */}
                <div className="flex w-full mt-2 mb-8 bg-black/40 rounded-xl p-1 border border-gray-800 relative z-10">
                    {["Voter", "Candidate", "Admin"].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => { setActiveTab(tab); setErrorMsg(""); setStep(1); }}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab !== "Admin" ? (
                    <>
                        {/* Header & Progress */}
                        <div className="mb-8 border-b border-gray-800 pb-6 text-center">
                            <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
                            <p className="text-gray-400">Mandatory verification to participate as a {activeTab}.</p>
                            
                            <div className="flex items-center justify-center gap-2 mt-6">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center w-24">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-primary text-white' : 'bg-gray-800 text-gray-500'}`}>
                                    {s}
                                </div>
                                <span className={`text-xs mt-2 ${step >= s ? 'text-primary' : 'text-gray-600'}`}>
                                    {s === 1 ? 'Personal' : s === 2 ? 'Verification' : 'Blockchain'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
                        {errorMsg}
                    </div>
                )}

                {/* STEP 1: Personal Info */}
                {step === 1 && (
                    <div className="animate-fade-in space-y-4">
                        {/* Election Context */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-800">
                            <div className="w-full">
                                <p className="text-sm font-semibold text-gray-300 mb-2">Election PIN (6-Digit)</p>
                                <input 
                                    type="text" 
                                    maxLength={6} 
                                    className="w-full bg-background border border-gray-700 text-white p-3 rounded-xl focus:outline-none focus:border-primary tracking-widest text-lg font-mono text-center" 
                                    placeholder="123456" 
                                    value={electionPin} 
                                    onChange={(e) => setElectionPin(e.target.value.replace(/\D/g, ''))} 
                                />
                            </div>
                            <div className="w-full">
                                <p className="text-sm font-semibold text-gray-300 mb-2">Election Name</p>
                                <input 
                                    type="text" 
                                    disabled
                                    className={`w-full bg-background border border-gray-700 p-3 rounded-xl focus:outline-none placeholder-gray-600 text-center ${electionName === "Invalid PIN" ? "text-red-500" : "text-green-400 font-bold"}`}
                                    placeholder={pinLoading ? "Verifying..." : "Auto-fills after PIN"} 
                                    value={electionName} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input title="Full Name" placeholder="John Doe" inputType="text" value={formData.name} handleClick={(e) => setFormData({...formData, name: e.target.value})} />
                            <Input title="National ID (NIC)" placeholder="123456789V" inputType="text" value={formData.nic} handleClick={(e) => setFormData({...formData, nic: e.target.value})} />
                            <Input title="Date of Birth" placeholder="" inputType="date" value={formData.dob} handleClick={(e) => setFormData({...formData, dob: e.target.value})} />
                            
                            <div className="w-full">
                                <p className="text-sm font-semibold text-gray-300 mb-2">Gender</p>
                                <select className="w-full bg-background border border-gray-700 text-white p-3 rounded-xl focus:outline-none focus:border-primary" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            {/* Phone Input with OTP inline */}
                            <div className="w-full relative">
                                {!showOtpPhone ? (
                                    <>
                                        <Input title="Phone Number" placeholder="0701234567" inputType="number" value={formData.phone} handleClick={(e) => setFormData({...formData, phone: e.target.value})} />
                                        <button type="button" onClick={() => sendOtp('phone', formData.phone)} disabled={isPhoneVerified} className={`absolute right-2 top-9 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPhoneVerified ? 'bg-green-500/20 text-green-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/80'}`}>
                                            {isPhoneVerified ? 'Verified ✅' : 'Verify'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-gray-300 mb-2">Enter 6-Digit Phone SMS Code</p>
                                        <div className="relative">
                                            <input type="text" maxLength={6} className="w-full bg-background border border-primary text-white p-3 rounded-xl focus:outline-none" placeholder="123456" value={otpInputs.phone} onChange={(e) => setOtpInputs({...otpInputs, phone: e.target.value})} />
                                            <button type="button" onClick={() => verifyOtp('phone', formData.phone)} className="absolute right-2 top-1.5 bg-primary px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg">Confirm</button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Email Input with OTP inline */}
                            <div className="w-full relative">
                                {!showOtpEmail ? (
                                    <>
                                        <Input title="Email Address" placeholder="john@example.com" inputType="email" value={formData.email} handleClick={(e) => setFormData({...formData, email: e.target.value})} />
                                        <button type="button" onClick={() => sendOtp('email', formData.email)} disabled={isEmailVerified} className={`absolute right-2 top-9 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEmailVerified ? 'bg-green-500/20 text-green-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/80'}`}>
                                            {isEmailVerified ? 'Verified ✅' : 'Verify'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-gray-300 mb-2">Enter 6-Digit Email OTP</p>
                                        <div className="relative">
                                            <input type="text" maxLength={6} className="w-full bg-background border border-primary text-white p-3 rounded-xl focus:outline-none" placeholder="123456" value={otpInputs.email} onChange={(e) => setOtpInputs({...otpInputs, email: e.target.value})} />
                                            <button type="button" onClick={() => verifyOtp('email', formData.email)} className="absolute right-2 top-1.5 bg-primary px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg">Confirm</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-300 mb-2">Home Address</p>
                            <textarea className="w-full bg-background border border-gray-700 text-white p-3 rounded-xl focus:outline-none focus:border-primary resize-none h-24" placeholder="Your full residential address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                        </div>
                    </div>
                )}

                {/* STEP 2: Identity Verification */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl mb-6 text-blue-300 text-sm">
                            <p><strong>Identity Verification:</strong> Please upload high-quality images of your National ID (Front & Back) along with a clear selfie for facial verification. Max size 5MB each.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderDropzone(dropNicFront, files.nicFront, "NIC Front Image", "🪪", "nicFront")}
                            {renderDropzone(dropNicBack, files.nicBack, "NIC Back Image", "💳", "nicBack")}
                        </div>
                        <div className="w-full md:w-1/2 mx-auto">
                            {renderDropzone(dropSelfie, files.selfie, "Clear Selfie (Face)", "📷", "selfie")}
                        </div>
                    </div>
                )}

                {/* STEP 3: Blockchain Info */}
                {step === 3 && (
                    <div className="animate-fade-in flex flex-col items-center justify-center py-6 text-center">
                        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 w-full mb-8">
                            <div className="mb-4 text-primary">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Blockchain Wallet Link</h3>
                            <p className="text-gray-400 mb-4 text-sm">Your identity will be securely bound to the following Web3 decentralized address.</p>
                            <div className="bg-black/40 px-6 py-4 rounded-lg border border-primary/20 inline-block">
                                <p className="font-mono text-primary text-lg tracking-wider">
                                    {currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : 'Not Connected'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-green-900/10 border border-green-500/20 p-4 rounded-xl text-green-400 text-sm">
                            <p>All inputs are recorded securely off-chain. By clicking Submit, your verification proofs will be pinned to IPFS and linked permanently.</p>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-10 flex justify-between gap-4 pt-6 border-t border-gray-800">
                    <button 
                        onClick={handlePrev}
                        disabled={step === 1 || loading}
                        className={`px-8 py-3 rounded-xl font-bold transition-all ${step === 1 || loading ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                    >
                        Back
                    </button>

                    {step < 3 ? (
                        <Button btnName="Next Step" handleClick={handleNext} />
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={loading || !currentAccount}
                            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center min-w-[150px] ${loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/80 hover:shadow-primary/50'}`}
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "Submit Profile"}
                        </button>
                    )}
                </div>
                    </>
                ) : (
                    <>
                        {/* ADMIN FORM */}
                        <div className="mb-8 border-b border-gray-800 pb-6 text-center">
                            <h1 className="text-3xl font-bold text-white mb-2">Admin Initialization</h1>
                            <p className="text-gray-400">Set up your Organizer Profile before creating an election.</p>
                        </div>
                        
                        {!currentAccount ? (
                            <div className="w-full text-center py-10 flex flex-col items-center">
                                <div className="text-red-500 mb-6">
                                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Wallet Not Connected</h2>
                                <p className="text-gray-400 text-sm max-w-sm mb-4">
                                    Please connect your MetaMask wallet first to register as an Election Admin.
                                </p>
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input title="Full Name" placeholder="Jane Doe" inputType="text" value={adminData.name} handleClick={(e) => setAdminData({...adminData, name: e.target.value})} />
                                    <Input title="Age" placeholder="35" inputType="number" value={adminData.age} handleClick={(e) => setAdminData({...adminData, age: e.target.value})} />
                                    <Input title="Position" placeholder="Chief Electoral Officer" inputType="text" value={adminData.position} handleClick={(e) => setAdminData({...adminData, position: e.target.value})} />
                                    <Input title="Email Address" placeholder="admin@election.org" inputType="email" value={adminData.email} handleClick={(e) => setAdminData({...adminData, email: e.target.value})} />
                                </div>
                                
                                <div className="w-full mt-4 bg-gray-900 border border-primary/20 p-4 rounded-xl">
                                    <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Verified Contract Address</p>
                                    <input 
                                        type="text" 
                                        disabled
                                        className="w-full bg-black border border-gray-800 p-3 rounded-lg text-gray-400 font-mono text-sm opacity-80"
                                        value={currentAccount || 'Not Connected'} 
                                    />
                                </div>

                                <div className="pt-6 border-t border-gray-800 mt-8">
                                    <button 
                                        onClick={handleAdminSubmit}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center ${loading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/80 hover:shadow-primary/50'}`}
                                    >
                                        {loading ? "Initializing..." : "Complete Setup & Proceed to Dashboard"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
};

export default Onboarding;
