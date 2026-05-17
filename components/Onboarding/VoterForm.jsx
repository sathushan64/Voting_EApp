import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import { VotingContext } from '../../context/Voter';
import Button from '../Button';
import Input from '../Input';

const VoterForm = ({ activeTab }) => {
    const { currentAccount, uploadToIPFS, uploadJSONToIPFS, checkOnboardStatus } = useContext(VotingContext);
    const router = useRouter();

    const [electionPin, setElectionPin] = useState(router.query.pin || "");
    const [electionName, setElectionName] = useState("");
    const [pinLoading, setPinLoading] = useState(false);
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        nic: "",
        dob: "",
        gender: "Male",
        address: ""
    });

    const [files, setFiles] = useState({
        nicFront: null,
        nicBack: null,
        selfie: null
    });

    const createDropzone = (field) => {
        const onDrop = useCallback((acceptedFiles) => {
            setFiles((prev) => ({ ...prev, [field]: acceptedFiles[0] }));
        }, []);
        return useDropzone({ onDrop, accept: {'image/*': []}, maxFiles: 1 });
    };

    const dropNicFront = createDropzone("nicFront");
    const dropNicBack = createDropzone("nicBack");
    const dropSelfie = createDropzone("selfie");

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

    const handleNext = () => {
        setErrorMsg("");
        if (step === 1) {
            if (!electionName || electionName === "Invalid PIN" || electionName === "Error") {
                return setErrorMsg("Please enter a valid 6-Digit Election PIN before proceeding.");
            }
            if (!formData.name || !formData.nic || !formData.dob || !formData.address) {
                return setErrorMsg("Please fill in all personal information fields.");
            }
            if (!/^\d{12}$/.test(formData.nic)) {
                return setErrorMsg("National ID (NIC) must be exactly 12 numbers.");
            }
            
            const dobDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }
            if (age < 18) {
                return setErrorMsg("You must be at least 18 years old to register.");
            }
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
            const frontUrl = await uploadToIPFS(files.nicFront);
            const backUrl = await uploadToIPFS(files.nicBack);
            const selfieUrl = await uploadToIPFS(files.selfie);

            if (!frontUrl || !backUrl || !selfieUrl) {
                throw new Error("Failed to upload verification documents to IPFS.");
            }

            const masterPayload = {
                walletAddress: currentAccount,
                role: activeTab,
                personalDetails: {
                    name: formData.name,
                    nic: formData.nic,
                    dob: formData.dob,
                    gender: formData.gender,
                    address: formData.address,
                },
                verification: {
                    nicFront: frontUrl,
                    nicBack: backUrl,
                    selfie: selfieUrl
                },
                timestamp: Date.now()
            };

            const masterIpfsUrl = await uploadJSONToIPFS(masterPayload);
            if (!masterIpfsUrl) {
                throw new Error("Failed to secure profile data to IPFS.");
            }

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

            await checkOnboardStatus(currentAccount);
            router.push('/');
        } catch (error) {
            console.error("Submission Error:", error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const removeFile = (e, field) => {
        e.stopPropagation();
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
        <>
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

            {step === 1 && (
                <div className="animate-fade-in space-y-4">
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
                        <Input title="National ID (NIC)" placeholder="123456789012" inputType="text" value={formData.nic} handleClick={(e) => setFormData({...formData, nic: e.target.value})} />
                        <Input title="Date of Birth" placeholder="" inputType="date" value={formData.dob} handleClick={(e) => setFormData({...formData, dob: e.target.value})} />
                        
                        <div className="w-full">
                            <p className="text-sm font-semibold text-gray-300 mb-2">Gender</p>
                            <select className="w-full bg-background border border-gray-700 text-white p-3 rounded-xl focus:outline-none focus:border-primary" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-300 mb-2">Home Address</p>
                        <textarea className="w-full bg-background border border-gray-700 text-white p-3 rounded-xl focus:outline-none focus:border-primary resize-none h-24" placeholder="Your full residential address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                    </div>
                </div>
            )}

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
    );
};

export default VoterForm;
