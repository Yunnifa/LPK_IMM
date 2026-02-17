import { useState, useEffect } from 'react';
import { getVehicles } from '../services/apiService';

interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: string;
  capacity: number;
  fuelType: string;
  transmission: string;
  status: string;
  dailyRate: string;
  description: string;
}

function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Available Vehicles</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="card">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Year:</span>
                <span className="font-semibold">{vehicle.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold capitalize">{vehicle.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transmission:</span>
                <span className="font-semibold capitalize">{vehicle.transmission}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-semibold">{vehicle.capacity} seats</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-semibold ${
                    vehicle.status === 'available'
                      ? 'text-success'
                      : 'text-danger'
                  }`}
                >
                  {vehicle.status}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  Rp {parseInt(vehicle.dailyRate).toLocaleString('id-ID')}
                  <span className="text-sm text-gray-500">/day</span>
                </span>
                {vehicle.status === 'available' && (
                  <button className="btn btn-primary btn-sm">
                    Rent Now
                  </button>
                )}
              </div>
            </div>

            {vehicle.description && (
              <p className="mt-4 text-sm text-gray-600">{vehicle.description}</p>
            )}
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No vehicles available at the moment.
        </div>
      )}
    </div>
  );
}

export default VehicleList;
