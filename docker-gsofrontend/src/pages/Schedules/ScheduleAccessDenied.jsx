import { useNavigate } from 'react-router-dom';

const ScheduleAccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Authorized</h2>
      <p className="text-gray-600 mb-4">You do not have access to schedules.</p>
      <button
        onClick={() => navigate('/dashboard', { replace: true })}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default ScheduleAccessDenied;
