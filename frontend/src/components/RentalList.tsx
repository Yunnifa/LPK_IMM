import { useState, useEffect } from 'react';
import { getRentals } from '../services/apiService';

interface Rental {
  id: number;
  userId: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalAmount: string;
  status: string;
  purpose: string;
  notes: string;
  createdAt: string;
}

function RentalList() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      const data = await getRentals();
      setRentals(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">My Rentals</h2>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((rental) => (
              <tr key={rental.id}>
                <td>{rental.id}</td>
                <td>{new Date(rental.startDate).toLocaleDateString('id-ID')}</td>
                <td>{new Date(rental.endDate).toLocaleDateString('id-ID')}</td>
                <td>{rental.totalDays}</td>
                <td>Rp {parseInt(rental.totalAmount).toLocaleString('id-ID')}</td>
                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      rental.status
                    )}`}
                  >
                    {rental.status}
                  </span>
                </td>
                <td>
                  <button className="text-primary hover:underline text-sm">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rentals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            You don't have any rentals yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default RentalList;
