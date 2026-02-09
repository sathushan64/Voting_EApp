import '../styles/globals.css';
import { VotingProvider } from '../context/Voter';
import NavBar from '../components/NavBar';
import ChatBot from '../components/ChatBot';

const MyApp = ({ Component, pageProps }) => (
    <VotingProvider>
        <div className="min-h-screen bg-background text-text relative">
            <NavBar />
            <Component {...pageProps} />
            <ChatBot />
        </div>
    </VotingProvider>
);

export default MyApp;
