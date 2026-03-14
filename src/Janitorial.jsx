import { Link, useNavigate } from "react-router-dom";

const Janitorial = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 md:p-8 lg:p-10 shadow-lg rounded-lg w-full max-w-md md:max-w-xl lg:max-w-2xl transition-all duration-300">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-gray-800">       
          JOSE RIZAL MEMORIAL STATE UNIVERSITY <br className="hidden sm:block" />
          GENERAL SERVICE OFFICE MANAGEMENT SYSTEM
        </h2>
        <p className="text-sm md:text-base text-center mb-6 md:mb-8">
        User Request Slip (Janitorial Section) <br className="hidden sm:block" />
        </p>

        <form className="space-y-4 md:space-y-6">
          {/* Date Requested */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Date Requested:
            </label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Specific Details */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Specific Details (Situations/Condition/Circumstances):
            </label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              rows="3"
            ></textarea>
          </div>

          {/* Requesting Personnel */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Requesting Personnel (Fullname):
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Position:
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Requesting Office */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Requesting Office (College/Department/Unit):
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2">
              Contact Number:
            </label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
            <button 
              type="button" 
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-2 md:py-3 rounded-lg transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Janitorial;