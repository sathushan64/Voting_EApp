import React, { useState, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

// INTERNAL IMPORT
import { VotingContext } from '../context/Voter';

const NavBar = () => {
    const { connectWallet, error, currentAccount } = useContext(VotingContext);
    const router = useRouter();

    const [openNav, setOpenNav] = useState(false);

    const activeLink = 'text-accent font-bold cursor-pointer';
    const normalLink = 'text-text hover:text-primary transition-all duration-300 cursor-pointer';

    return (
        <div className="w-full bg-paper/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-800">
            <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
                {/* LOGO */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-white text-xl">
                        V
                    </div>
                    <h1 className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Voting EApp
                    </h1>
                </div>

                {/* DESKTOP MENU */}
                <div className="hidden md:flex items-center gap-8 font-medium">
                    <Link href={{ pathname: '/' }}>
                        <p className={router.pathname === '/' ? activeLink : normalLink}>Home</p>
                    </Link>
                    <Link href={{ pathname: '/candidate-registration' }}>
                        <p className={router.pathname === '/candidate-registration' ? activeLink : normalLink}>Candidate</p>
                    </Link>
                    <Link href={{ pathname: '/allowed-voters' }}>
                        <p className={router.pathname === '/allowed-voters' ? activeLink : normalLink}>Voter Reg</p>
                    </Link>
                    <Link href={{ pathname: '/voterList' }}>
                        <p className={router.pathname === '/voterList' ? activeLink : normalLink}>Voter List</p>
                    </Link>
                </div>

                {/* CONNECT BUTTON */}
                <div className="hidden md:flex">
                    {currentAccount ? (
                        <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-gray-900 border border-orange-500/50 shadow-lg shadow-orange-500/10 cursor-default">
                            <div className="w-6 h-6">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" />
                            </div>
                            <span className="font-mono text-sm font-bold text-gray-300">
                                {currentAccount.slice(0, 6)}...{currentAccount.slice(38)}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => connectWallet()}
                            className="group flex items-center gap-3 px-6 py-2 rounded-full bg-white text-gray-900 font-bold hover:bg-gray-100 border border-gray-200 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        >
                            <div className="w-6 h-6">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" />
                            </div>
                            Connect MetaMask
                        </button>
                    )}
                </div>

                {/* MOBILE MENU ICON */}
                <div className="md:hidden text-2xl cursor-pointer text-text" onClick={() => setOpenNav(!openNav)}>
                    {/* Hamburger Icon */}
                    ☰
                </div>
            </div>

            {/* MOBILE MENU LIST */}
            {openNav && (
                <div className="md:hidden flex flex-col items-center gap-4 py-8 bg-paper border-t border-gray-800 absolute w-full left-0 animate-fade-in-down">
                    <Link href={{ pathname: '/' }}>
                        <p onClick={() => setOpenNav(false)} className={router.pathname === '/' ? activeLink : normalLink}>Home</p>
                    </Link>
                    <Link href={{ pathname: '/candidate-registration' }}>
                        <p onClick={() => setOpenNav(false)} className={router.pathname === '/candidate-registration' ? activeLink : normalLink}>Candidate Registration</p>
                    </Link>
                    <Link href={{ pathname: '/allowed-voters' }}>
                        <p onClick={() => setOpenNav(false)} className={router.pathname === '/allowed-voters' ? activeLink : normalLink}>Voter Registration</p>
                    </Link>
                    <Link href={{ pathname: '/voterList' }}>
                        <p onClick={() => setOpenNav(false)} className={router.pathname === '/voterList' ? activeLink : normalLink}>Voter List</p>
                    </Link>

                    <div className="mt-4">
                        {currentAccount ? (
                            <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-gray-900 border border-orange-500/50">
                                <div className="w-6 h-6">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" />
                                </div>
                                <span className="font-mono text-sm font-bold text-gray-300">
                                    {currentAccount.slice(0, 6)}...
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={() => { connectWallet(); setOpenNav(false); }}
                                className="flex items-center gap-3 px-6 py-2 rounded-full bg-white text-gray-900 font-bold hover:bg-gray-100 shadow-lg"
                            >
                                <div className="w-6 h-6">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" />
                                </div>
                                Connect MetaMask
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ERROR ERROR */}
            {error && (
                <div className="absolute top-20 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-xl animate-bounce">
                    {error}
                </div>
            )}
        </div>
    );
};

export default NavBar;
