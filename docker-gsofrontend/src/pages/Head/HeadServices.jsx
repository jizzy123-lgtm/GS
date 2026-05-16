import { useState, useEffect, useCallback, useReducer, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeadSidebar, HEAD_MENU_ITEMS, HeadNotificationProvider } from '../../components/HeadSidebar';
import Icon from '../../components/Icon';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sidebarReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'TOGGLE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: !state.isMobileMenuOpen };
    case 'CLOSE_MOBILE_MENU':
      return { ...state, isMobileMenuOpen: false };
    default:
      return state;
  }
};

const HeadServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ type_name: '' });
  const [submitting, setSubmitting] = useState(false);

  const [state, dispatch] = useReducer(sidebarReducer, {
    isSidebarCollapsed: true,
    isMobileMenuOpen: false,
  });

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/maintenance-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const url = editingService 
        ? `${API_BASE_URL}/maintenance-types/${editingService.id}`
        : `${API_BASE_URL}/maintenance-types`;
      
      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save service');
      }

      setIsModalOpen(false);
      setEditingService(null);
      setFormData({ type_name: '' });
      fetchServices();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/maintenance-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to delete service');
      fetchServices();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <HeadNotificationProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-black text-white p-4 flex justify-between items-center relative z-30">
          <span className="text-xl md:text-2xl font-extrabold tracking-tight">ManageIT</span>
          <div className="hidden md:block text-xl font-bold text-white">Head Portal</div>
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => dispatch({ type: 'TOGGLE_MOBILE_MENU' })} className="p-2 hover:bg-gray-800 rounded-lg border-2 border-white transition-colors">
              <Icon path="M4 6h16M4 12h16M4 18h16" className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <HeadSidebar 
            isSidebarCollapsed={state.isSidebarCollapsed}
            onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            onLogout={async () => {
              try {
                const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
                if (token) {
                  await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
                    method: "POST",
                    headers: {
                      "Accept": "application/json",
                      "Authorization": `Bearer ${token}`,
                    },
                  });
                }
              } catch (err) {
                console.error(err);
              } finally {
                localStorage.clear();
                sessionStorage.clear();
                navigate("/loginpage", { replace: true });
              }
            }}
          />

          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8 pb-4 border-b">
                <div>
                  <h1 className="text-3xl font-black text-gray-900">Maintenance Services</h1>
                  <p className="text-gray-500 mt-1">Manage the types of services available for maintenance requests.</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingService(null);
                    setFormData({ type_name: '' });
                    setIsModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                  <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-5 h-5" />
                  Add Service
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-xl">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon path="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076.091-2.264.071-2.95.904l-.171.213-2.247 2.81a.75.75 0 0 1-1.157.02L7.5 12.339V14.01a.75.75 0 0 1-.22.53l-3.276 3.277a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 0 1 0-1.06l3.277-3.276a.75.75 0 0 1 .53-.22h1.672l2.836-2.268a.75.75 0 0 1 .933-.02l2.133 2.133c.71-.71.665-1.777.74-2.736a4.5 4.5 0 0 1 6.336-4.486.75.75 0 0 1 .14 1.743l-3.277 3.276a.75.75 0 1 0 1.06 1.06l3.277-3.276a.75.75 0 0 1 .869-.14c.26.113.513.245.75.394Z" className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No services found</h3>
                  <p className="text-gray-500 mt-2">Start by adding a new maintenance service category.</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Service Name</th>
                          <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {services.map((service) => (
                          <tr key={service.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-5">
                              <span className="font-bold text-gray-900 text-lg">{service.type_name}</span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingService(service);
                                    setFormData({ type_name: service.type_name });
                                    setIsModalOpen(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Service"
                                >
                                  <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(service.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Service"
                                >
                                  <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-gray-900">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Service Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-gray-900"
                      placeholder="e.g. Plumbing Maintenance"
                      value={formData.type_name}
                      onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save Service'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </HeadNotificationProvider>
  );
};

export default HeadServices;
