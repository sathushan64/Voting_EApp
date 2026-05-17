import '../styles/globals.css';
import { VotingProvider, VotingContext } from '../context/Voter';
import NavBar from '../components/NavBar';
import ChatBot from '../components/ChatBot';
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

const RouteGuard = ({ children }) => {
    const { currentAccount, votingOrganizer, isOnboarded } = useContext(VotingContext);
    const router = useRouter();

    useEffect(() => {
        if (!currentAccount || !votingOrganizer || isOnboarded === null) return;
        
        const isOrganizer = currentAccount.toLowerCase() === votingOrganizer.toLowerCase();
        
        // 1. If not organizer and not registered at all, must go to onboarding
        if (!isOrganizer && isOnboarded === 'unregistered' && router.pathname !== '/onboarding') {
            router.push('/onboarding');
        }

        // 2. If not organizer and is pending approval, must go to pending page
        if (!isOrganizer && isOnboarded === 'pending' && router.pathname !== '/pending') {
            router.push('/pending');
        }
        
        // 3. If organizer tries to access onboarding/pending
        if (isOrganizer && (router.pathname === '/onboarding' || router.pathname === '/pending')) {
            router.push('/');
        }

        // 4. If regular user is already approved but manually navigated to /onboarding or /pending
        if (!isOrganizer && isOnboarded === 'approved' && (router.pathname === '/onboarding' || router.pathname === '/pending')) {
            router.push('/');
        }
    }, [currentAccount, votingOrganizer, isOnboarded, router.pathname]);

    return children;
};

const MyApp = ({ Component, pageProps }) => (
    <VotingProvider>
        <RouteGuard>
            <div className="min-h-screen bg-background text-text relative">
                <NavBar />
                <Component {...pageProps} />
                <ChatBot />
            </div>
        </RouteGuard>
    </VotingProvider>
);

export default MyApp;
