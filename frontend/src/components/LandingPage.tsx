import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
      <div className="text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Sistem Peminjaman Kendaraan
          </h1>
          <p className="text-xl text-blue-100">
            LPK IMM - Layanan Permohonan Kendaraan
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-64 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Masuk
          </button>
          
          <div className="text-blue-200 text-sm">atau</div>
          
          <button
            onClick={() => navigate('/permohonan')}
            className="w-64 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg border-2 border-white hover:bg-blue-500 transition-all transform hover:scale-105"
          >
            Permohonan Kendaraan
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-blue-200 text-sm">
          © 2026 LPK IMM. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
