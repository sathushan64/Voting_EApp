import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";

// INTERNAL IMPORTS
import Button from "../components/Button";
import Input from "../components/Input";
import { VotingContext } from "../context/Voter";

const CreateElection = () => {
  const [electionData, setElectionData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    rules: "",
  });
  
  const [qrValue, setQrValue] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorLocal, setErrorLocal] = useState("");

  const { currentAccount, votingOrganizer, checkIfWalletIsConnected } = useContext(VotingContext);
  const router = useRouter();

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const isAuthorized = currentAccount && votingOrganizer && currentAccount.toLowerCase() === votingOrganizer.toLowerCase();

  const handleCreateElection = async () => {
    if (!electionData.title || !electionData.date) {
      setErrorLocal("Please fill out at least the title and date.");
      return;
    }

    setLoading(true);
    setErrorLocal("");

    try {
      const newAccessCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Save data locally (pseudo-backend)
      const res = await fetch("/api/election", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...electionData, accessCode: newAccessCode }),
      });

      if (!res.ok) {
        throw new Error("Failed to save election data");
      }

      setAccessCode(newAccessCode);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorLocal("Error saving election. Please try again.");
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(accessCode);
    alert(`Copied PIN: ${accessCode}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 pt-24">
      <div className="bg-paper p-10 rounded-3xl shadow-2xl border border-gray-800 w-full max-w-4xl">
        {!isAuthorized ? (
          <div className="text-center py-20 flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-4 text-white">Access Denied</h1>
            <p className="text-gray-400 mb-8">
              Only the connected account can create a new election. Please ensure your wallet is active.
            </p>
            <Button btnName="Return Home" handleClick={() => router.push("/")} />
          </div>
        ) : (
          <div className="w-full flex-col flex lg:flex-row gap-12">
            
            {/* Form Section */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-white">Create Election</h1>
              <p className="text-gray-400 mb-8 max-w-lg">
                Fill the details below to generate a new Election 6-Digit PIN Code for your users.
              </p>

              {errorLocal && (
                <p className="text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20 mb-6">
                  {errorLocal}
                </p>
              )}

              <div className="flex flex-col gap-6 mb-8">
                <Input
                  inputType="text"
                  title="Election Title"
                  placeholder="e.g., Presidential Election 2026"
                  handleClick={(e) => setElectionData({ ...electionData, title: e.target.value })}
                />
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-gray-400 text-sm font-semibold mb-2">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-background border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
                      onChange={(e) => setElectionData({ ...electionData, date: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-400 text-sm font-semibold mb-2">Start Time</label>
                    <input 
                      type="time" 
                      className="w-full bg-background border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
                      onChange={(e) => setElectionData({ ...electionData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-400 text-sm font-semibold mb-2">End Time</label>
                    <input 
                      type="time" 
                      className="w-full bg-background border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
                      onChange={(e) => setElectionData({ ...electionData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm font-semibold mb-2">Basic Rules</label>
                  <textarea 
                    className="w-full bg-background border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors resize-none h-32"
                    placeholder="Enter basic rules for this election..."
                    onChange={(e) => setElectionData({ ...electionData, rules: e.target.value })}
                  />
                </div>
              </div>

              <Button
                btnName={loading ? "Generating..." : "Create Election"}
                handleClick={handleCreateElection}
                classStyles="w-full justify-center"
              />
            </div>

            {/* PIN Code Section */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 p-8 rounded-2xl border border-gray-800">
              <h2 className="text-xl font-bold mb-6 text-white text-center">Your Election PIN</h2>
              
              {accessCode ? (
                <div className="flex flex-col items-center">
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm text-center tracking-widest uppercase font-semibold mb-2">Tell users to join using</p>
                    <div className="bg-gradient-to-r from-primary to-secondary p-1 rounded-2xl">
                      <div className="bg-black py-8 px-12 rounded-xl flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                        <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-[0.2em] ml-4">
                          {accessCode}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-8 text-center max-w-sm border border-gray-800 bg-black/50 p-4 rounded-xl">
                    Users can go to the homepage and enter this exact 6-digit PIN to join the active election and complete their voter registration.
                  </p>

                  <Button 
                    btnName="Copy PIN Code" 
                    handleClick={copyToClipboard}
                    classStyles="w-full justify-center bg-transparent border border-primary text-primary hover:bg-primary/10"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-2xl w-full">
                  <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                  <p className="text-gray-500 text-center px-8">Fill out the form and click 'Create Election' to generate a secure PIN.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CreateElection;
