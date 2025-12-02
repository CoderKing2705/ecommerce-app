import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Clock } from 'lucide-react';
import { checkoutAPI } from '../utils/api';

const CheckoutSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyPayment = async () => {
            const params = new URLSearchParams(location.search);
            const sessionId = params.get('session_id');

            if (sessionId) {
                try {
                    const response = await checkoutAPI.verifyPayment({ sessionId });
                    setOrder(response.data.order);
                } catch (error) {
                    console.error('Payment verification failed:', error);
                }
            }
            setLoading(false);
        };

        verifyPayment();
    }, [location]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-2xl mx-auto px-4 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Payment Successful!</h2>
                {order && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-8">
                        <p className="text-sm text-gray-600 mb-2">Order ID</p>
                        <p className="text-xl font-bold text-gray-800">{order.id}</p>
                        <p className="text-gray-600 mt-4">Total: ${order.total_amount}</p>
                    </div>
                )}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default CheckoutSuccess;