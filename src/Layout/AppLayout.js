import { Outlet, useLocation } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import { Suspense, useContext } from "react"
import ProtectedRoute from "../Routes/ProtectedRoute"
import { ConfigContext } from "../Context/ConfigContext"
import useDocumentTitle from "../hooks/useDocumentTitle"


export default function AppLayout() {
    const location = useLocation();
    const { getCurrentUser } = useContext(ConfigContext);
    
    // Get current user data
    const currentUser = getCurrentUser();
    
    // Generate dynamic title based on user
    const getPageTitle = () => {
        if (currentUser && currentUser.name) {
            return `${currentUser.name}`;
        }
        return "ipshopy workspace";
    };
    
    // Use the custom hook to update document title
    useDocumentTitle(getPageTitle());
    
    // Define routes where header should not be shown
    const noHeaderRoutes = ['/Login', '/SignUp', '/SetPassword'];
    const shouldShowHeader = !noHeaderRoutes.includes(location.pathname);
    
    return (
        <ProtectedRoute>
            {shouldShowHeader && <Header />}
            <main>
                <Suspense fallback={<div>Loading...</div>}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
        </ProtectedRoute>
    )
}