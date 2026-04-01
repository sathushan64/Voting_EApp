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
        
        // 1. If not organizer, completely not onboarded, and trying to browse the app
        if (!isOrganizer && isOnboarded === false && router.pathname !== '/onboarding') {
            router.push('/onboarding');
        }
        
        // 2. If organizer tries to access the onboarding page (they don't need to)
        if (isOrganizer && router.pathname === '/onboarding') {
            router.push('/');
        }

        // 3. If regular user is already onboarded but manually navigated to /onboarding
        if (!isOrganizer && isOnboarded === true && router.pathname === '/onboarding') {
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
