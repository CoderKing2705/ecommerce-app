import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag } from 'lucide-react';

const OAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="flex justify-center mb-6"
                >
                    <div className="relative">
                        <ShoppingBag className="h-16 w-16 text-green-600" />
                        <CheckCircle className="h-8 w-8 text-green-600 absolute -top-2 -right-2 bg-white rounded-full" />
                    </div>
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Successfully Signed In!
                </h2>

                <p className="text-gray-600 mb-6">
                    Welcome to FashionStore! You're being redirected to your dashboard.
                </p>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.5, duration: 2 }}
                    className="h-2 bg-green-600 rounded-full"
                />

                <p className="text-sm text-gray-500 mt-4">
                    Redirecting...
                </p>
            </motion.div>
        </div>
    );
};

export default OAuthSuccess;