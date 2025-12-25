// src/components/Footer.jsx
const Footer = () => {
  return (
    <footer className="bg-[#020617] border-t border-slate-800 mt-16 py-10 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-2">TechPhone Store</h3>
          <p className="text-sm">
            Chuyên điện thoại chính hãng, giá tốt cho sinh viên.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-2">Hỗ trợ</h3>
          <ul className="text-sm space-y-1">
            <li>Hotline: 1900 9999</li>
            <li>Zalo CSKH</li>
            <li>Đổi trả & bảo hành</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-2">Kết nối</h3>
          <ul className="text-sm space-y-1">
            <li className="hover:text-sky-400 transition cursor-pointer">Facebook</li>
            <li className="hover:text-sky-400 transition cursor-pointer">TikTok</li>
            <li className="hover:text-sky-400 transition cursor-pointer">
              Shopee / Lazada
            </li>
          </ul>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-8">
        © 2025 TechPhone. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
