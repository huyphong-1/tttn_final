import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCreditCard, FiTruck, FiMapPin, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/usePrismaAuth';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import CloudinaryImage from '../components/CloudinaryImage';
import { recordOrderSuccess } from '../lib/metrics';

const formatPrice = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const orderPlacedRef = useRef(false);
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || 'Hà Nội',
    paymentMethod: 'cod',
    notes: ''
  });

  useEffect(() => {
    if (items.length === 0 && !orderPlacedRef.current) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verifyOrderCreation = useCallback(async (orderNumber) => {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) throw error;
    return Boolean(data?.id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation chi tiết hơn
    if (!formData.fullName?.trim()) {
      showError('Vui lòng nhập họ và tên');
      return;
    }
    
    if (!formData.phone?.trim()) {
      showError('Vui lòng nhập số điện thoại');
      return;
    }
    
    if (!formData.address?.trim()) {
      showError('Vui lòng nhập địa chỉ giao hàng');
      return;
    }
    
    if (!formData.email?.trim()) {
      showError('Email không được để trống');
      return;
    }

    try {
      setLoading(true);
      setVerifying(false);
      setPaymentVerified(false);
      setVerificationMessage('');
      
      const orderDetails = {
        orderNumber: `TP${Date.now()}`,
        placedAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        total: cartTotal,
        shippingFee: 0,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        customer: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        },
        items: items.map(item => ({
          id: item.id,
          productId: item.productId || item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        }))
      };

      // Tạo order trực tiếp với Supabase - chỉ dùng các cột có trong database
      const orderPayload = {
        user_id: user?.id || null,
        order_number: orderDetails.orderNumber,
        total_amount: cartTotal,
        shipping_fee: 0,
        status: 'pending',
        payment_status: formData.paymentMethod === 'cod' ? 'pending' : 'paid',
        payment_method: formData.paymentMethod,
        customer_name: formData.fullName.trim(),
        customer_email: formData.email.trim(),
        phone: formData.phone.trim(), // Sửa từ customer_phone thành phone
        address: `${formData.address.trim()}, ${formData.city.trim()}`, // Gộp address và city
        notes: formData.notes?.trim() || '',
        items: JSON.stringify(orderDetails.items), // Convert items to JSON string
      };
      
      const { data: savedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();
        
      if (orderError) {
        throw orderError;
      }

      setVerifying(true);
      const verified = await verifyOrderCreation(orderDetails.orderNumber);
      setVerifying(false);

      if (!verified || !savedOrder?.id) {
        setVerificationMessage('Khong the xac thuc thanh toan. Vui long thu lai.');
        throw new Error('Order verification failed');
      }

      setPaymentVerified(true);
      setVerificationMessage('Thanh toan da duoc xac thuc thanh cong.');
      await recordOrderSuccess(cartTotal);

      try {
        localStorage.setItem("lastOrder", JSON.stringify(orderDetails));
      } catch (storageError) {
        console.warn("Cannot persist last order:", storageError);
      }

      showSuccess('Đặt hàng và xác thực thanh toán thành công.');
      orderPlacedRef.current = true;
      clearCart();
      navigate('/checkout/confirmation', { state: { order: orderDetails } });
    } catch (error) {
      showError('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };



  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Thanh toán</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form thông tin */}
        <div className="lg:col-span-2">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Thông tin giao hàng */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FiTruck className="text-blue-400" />
                Thông tin giao hàng
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Nhập email"
                      readOnly
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Số điện thoại *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Thành phố
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP.HCM">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Địa chỉ cụ thể *
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Nhập địa chỉ cụ thể (số nhà, tên đường, phường/xã...)"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Phương thức thanh toán */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FiCreditCard className="text-blue-400" />
                Phương thức thanh toán
              </h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-white font-medium">Thanh toán khi nhận hàng (COD)</div>
                    <div className="text-slate-400 text-sm">Thanh toán bằng tiền mặt khi nhận hàng</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 transition-colors opacity-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    disabled
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-white font-medium">Chuyển khoản ngân hàng</div>
                    <div className="text-slate-400 text-sm">Sắp có (Coming soon)</div>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Ghi chú */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Ghi chú đơn hàng</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)"
              />
            </div>
          </form>
        </div>
        
        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 sticky top-4">
            <h2 className="text-xl font-semibold text-white mb-4">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <CloudinaryImage
                    publicId={item.image}
                    alt={item.name}
                    preset="PRODUCT_THUMB"
                    className="w-16 h-16 rounded-lg"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-slate-400 text-sm">Số lượng: {item.quantity}</p>
                    <p className="text-blue-400 font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Tạm tính:</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Phí vận chuyển:</span>
                <span className="text-green-400">Miễn phí</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white border-t border-slate-700 pt-2">
                <span>Tổng cộng:</span>
                <span className="text-blue-400">{formatPrice(cartTotal)}</span>
              </div>
            </div>
            
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
            >
              {loading ? 'Đang xử lí...' : 'Đặt hàng ngay'}
            </button>

            {verifying}
            {paymentVerified && verificationMessage && (
              <p className="text-xs text-emerald-400 text-center mt-3">{verificationMessage}</p>
            )}
            {!paymentVerified && verificationMessage && !verifying && (
              <p className="text-xs text-red-400 text-center mt-3">{verificationMessage}</p>
            )}

            <p className="text-slate-400 text-xs text-center mt-4">
              Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng của chúng tôi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
