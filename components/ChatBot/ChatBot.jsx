import React, { useState, useEffect, useRef } from "react";

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState([
        { text: "Hello! I am the Voting Assistant. How can I help you today?", isBot: true }
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const faqs = [
        {
            question: "How to register a candidate?",
            answer: "Only the Admin can register a candidate. The Admin must go to the 'Candidate' page in the top menu, fill in the candidate's details (Name, Address, Age), upload their photo, and click 'Authorize Candidate'."
        },
        {
            question: "How to register a voter?",
            answer: "Only the Admin can authorize voters. The Admin must go to the 'Voter Reg' page, fill in the voter's details, upload their photo, and submit. Once registered, the user's wallet is authorized to vote."
        },
        {
            question: "Who is the admin?",
            answer: "The Admin (or Election Organizer) is the person who originally deployed the blockchain smart contract. They hold the cryptographic keys to authorize participants."
        },
        {
            question: "Who can add candidates and voters?",
            answer: "For strict security, ONLY the Admin can add candidates and voters to the blockchain. Standard users cannot authorize themselves."
        },
        {
            question: "How to use this application?",
            answer: "1. Connect your MetaMask wallet.\n2. Wait for the Admin to authorize you as a voter.\n3. Browse the Candidates on the Home Page.\n4. Click 'Vote' on your preferred candidate and sign the MetaMask transaction."
        },
        {
            question: "What is MetaMask?",
            answer: "MetaMask is a cryptocurrency wallet and gateway to blockchain apps. It acts as your digital identity device, allowing you to securely connect to our Voting App."
        },
        {
            question: "Why use a wallet?",
            answer: "A digital wallet is required because this is a Decentralized Application (dApp). Your wallet ensures absolute security, anonymity, and guarantees that it is impossible for anyone to duplicate or fake your vote."
        },
        {
            question: "How to vote?",
            answer: "Ensure you are registered, connect your MetaMask wallet, go to the Homepage, review the candidates, and click the 'Vote' button. Only one vote is allowed per wallet!"
        }
    ];

    const handleQuestionClick = (faq) => {
        // Add User Question
        setMessages((prev) => [...prev, { text: faq.question, isBot: false }]);
        
        // Add Bot Thinking Delay -> Answer
        setTimeout(() => {
            setMessages((prev) => [...prev, { text: faq.answer, isBot: true }]);
        }, 600);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Chat Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-red-500 hover:bg-red-600 rotate-90' : 'bg-primary hover:bg-secondary hover:-translate-y-2'}`}
            >
                {isOpen ? (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-paper border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-2 animate-fade-in-up origin-bottom-right h-[550px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-accent p-4 text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Voting AI</h3>
                            <p className="text-xs text-white/80">Always active</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-background/50 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gray-700">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.isBot ? 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700' : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-800 bg-gray-900">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (inputText.trim() === '') return;

                                // Add User Message
                                setMessages((prev) => [...prev, { text: inputText, isBot: false }]);
                                const userText = inputText.toLowerCase();
                                setInputText('');

                                // Simple Keyword Matching Logic
                                setTimeout(() => {
                                    let botResponse = "I'm not sure about that. Try asking 'How to vote' or 'who is admin'.";
                                    
                                    // Strip punctuation for easier matching
                                    const cleanText = userText.replace(/[^\w\s]/gi, '');

                                    if (cleanText.includes("candidate")) {
                                        botResponse = faqs[0].answer;
                                    } else if (cleanText.includes("register") || cleanText.includes("voter")) {
                                        botResponse = faqs[1].answer;
                                    } else if (cleanText.includes("admin") || cleanText.includes("organizer")) {
                                        botResponse = faqs[2].answer;
                                    } else if (cleanText.includes("who can add") || cleanText.includes("who adds")) {
                                        botResponse = faqs[3].answer;
                                    } else if (cleanText.includes("how to use") || cleanText.includes("help") || cleanText.includes("guide")) {
                                        botResponse = faqs[4].answer;
                                    } else if (cleanText.includes("metamask")) {
                                        botResponse = faqs[5].answer;
                                    } else if (cleanText.includes("wallet")) {
                                        botResponse = faqs[6].answer;
                                    } else if (cleanText.includes("vote")) {
                                        botResponse = faqs[7].answer;
                                    } else if (cleanText.includes("hi") || cleanText.includes("hello")) {
                                        botResponse = "Hello! Ask me a question about the voting app.";
                                    }

                                    setMessages((prev) => [...prev, { text: botResponse, isBot: true }]);
                                }, 600);
                            }}
                            className="flex items-center bg-background rounded-full border border-gray-700 overflow-hidden"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Ask me something..."
                                className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 placeholder-gray-500 text-sm"
                            />
                            <button
                                type="submit"
                                className="w-12 h-12 flex items-center justify-center bg-primary hover:bg-secondary text-white transition-colors flex-shrink-0"
                            >
                                <svg className="w-5 h-5 -ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </form>
                        
                        {/* Quick suggestions if empty */}
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <button onClick={() => handleQuestionClick(faqs[2])} className="whitespace-nowrap bg-gray-800 text-xs text-gray-400 px-3 py-1.5 rounded-full hover:bg-gray-700 border border-gray-700 transition-colors">Who is admin?</button>
                            <button onClick={() => handleQuestionClick(faqs[7])} className="whitespace-nowrap bg-gray-800 text-xs text-gray-400 px-3 py-1.5 rounded-full hover:bg-gray-700 border border-gray-700 transition-colors">How to vote?</button>
                            <button onClick={() => handleQuestionClick(faqs[0])} className="whitespace-nowrap bg-gray-800 text-xs text-gray-400 px-3 py-1.5 rounded-full hover:bg-gray-700 border border-gray-700 transition-colors">Add candidate?</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;
