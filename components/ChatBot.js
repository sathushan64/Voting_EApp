import React, { useState, useEffect, useRef } from 'react';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm your Voting Assistant. Beep Boop! 🤖 How can I help you today?", isBot: true }
    ]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        // User Message
        const userMsg = { text: inputText, isBot: false };
        setMessages(prev => [...prev, userMsg]);

        // Bot Logic
        const lowerInput = inputText.toLowerCase();
        let botResponse = "I'm not sure about that. Try asking 'How to vote' or 'How to register'.";

        if (lowerInput.includes('pending') || lowerInput.includes('take time')) {
            botResponse = "When your registration is 'Pending', it means your details have been submitted and are waiting for the Election Admin to manually verify them. Yes, it can take some time because the Admin must review your profile and authorize your account on the blockchain before you can vote.";
        } else if (lowerInput.includes('what time') || lowerInput.includes('release') || lowerInput.includes('when')) {
            botResponse = "The election results are released immediately at the exact 'End Time' of the election. This exact time is configured by the Admin when the election is created. Once the end time is reached, the 'Home' page will automatically display the Final Election Winner.";
        } else if (lowerInput.includes('result') || lowerInput.includes('winner') || lowerInput.includes('leader') || lowerInput.includes('end time')) {
            botResponse = "The final election results and the winning candidate will only be displayed on the Home page once the election has officially ended. During the active election, the results are hidden.";
        } else if (lowerInput.includes('wait') || lowerInput.includes('approval')) {
            botResponse = "After submitting your registration profile, your account is in a 'Pending' state. The Election Admin must review and authorize your account on the blockchain before you are permitted to vote.";
        } else if (lowerInput.includes('data') || lowerInput.includes('store') || lowerInput.includes('ipfs')) {
            botResponse = "Your user profile is securely stored on IPFS (InterPlanetary File System), a decentralized storage network, while your authorization status is strictly managed on the blockchain.";
        } else if (lowerInput.includes('log out') || lowerInput.includes('logout') || lowerInput.includes('disconnect')) {
            botResponse = "To log out, you must disconnect your account directly from your MetaMask wallet extension. This application securely reads your active account directly from MetaMask.";
        } else if (lowerInput.includes('vote') || lowerInput.includes('voting')) {
            botResponse = "To vote: \n1. Go to the Home page. \n2. Connect your wallet. \n3. Click 'Vote' on a candidate card. \n4. Confirm the transaction in MetaMask.";
        } else if (lowerInput.includes('register') || lowerInput.includes('candidate')) {
            botResponse = "To register as a candidate: \n1. Go to 'Candidate Registration'. \n2. Fill in your name, age, and upload a photo. \n3. Submitting requires a small interaction fee.";
        } else if (lowerInput.includes('voter') || lowerInput.includes('allowed')) {
            botResponse = "To become a voter: \n1. You must be added by the Organizer (Admin). \n2. Check 'Voter List' to see if you are approved.";
        } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            botResponse = "Hello there! Ready to cast your vote? 🗳️";
        } else if (lowerInput.includes('wallet') || lowerInput.includes('metamask')) {
            botResponse = "You need a MetaMask wallet to use this app. Click 'Connect Wallet' in the top right corner to link it.";
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
        }, 600);

        setInputText("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div className={`
                pointer-events-auto
                bg-paper border border-gray-700
                rounded-2xl shadow-2xl
                w-80 h-96 
                mb-4 
                flex flex-col 
                transition-all duration-300 origin-bottom-right
                ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 overflow-hidden h-0 mb-0'}
            `}>
                {/* Header */}
                <div className="bg-primary/20 p-4 border-b border-gray-700 flex justify-between items-center rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🤖</span>
                        <h3 className="font-bold text-white">Voting Assistant</h3>
                    </div>
                    <button onClick={toggleChat} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                            <div className={`
                                max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                                ${msg.isBot
                                    ? 'bg-gray-800 text-gray-200 rounded-tl-none'
                                    : 'bg-primary text-white rounded-tr-none'}
                            `}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-700 bg-background/50 rounded-b-2xl flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me something..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        className="bg-primary hover:bg-secondary text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg"
                    >
                        ➤
                    </button>
                </div>
            </div>

            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className={`
                    pointer-events-auto
                    w-14 h-14 rounded-full 
                    bg-gradient-to-r from-primary to-secondary 
                    shadow-lg hover:shadow-primary/50 
                    flex items-center justify-center 
                    text-3xl transition-transform hover:scale-110 active:scale-95
                    ${isOpen ? 'rotate-90' : 'rotate-0'}
                `}
            >
                {isOpen ? '✕' : '🤖'}
            </button>
        </div>
    );
};

export default ChatBot;
