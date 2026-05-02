import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UserFeedbackForm = () => {
  const [formData, setFormData] = useState({
    maintenance_request_id: "",
    client_type: "",
    service_type: "",
    date: "",
    sex: "",
    age: "",
    region: "",
    office_visited: "",
    service_availed: "",
    cc1: "",
    cc2: "",
    cc3: "",
    sqd: Array(9).fill(""),
    suggestions: "",
    email: "",
  });

  const [token, setToken] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { id } = useParams();
  
  // Initialize navigate hook
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!authToken) {
      alert("You are not logged in.");
    } else {
      setToken(authToken);
    }

    if (id) {
      setFormData((prev) => ({ ...prev, maintenance_request_id: id }));
    }
  }, [id]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("sqd")) {
      const index = parseInt(name.slice(3));
      setFormData((prev) => {
        const updated = [...prev.sqd];
        updated[index] = value;
        return { ...prev, sqd: updated };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("You are not logged in.");
      return;
    }

    const cc1Options = {
      "1. I know what a CC is and I saw this office’s CC.": 1,
      "2. I know what a CC is but I did NOT see this office’s CC.": 2,
      "3. I know the CC only when I saw this office’s CC.": 3,
      "4. I do not know what a CC is and I did not see one in this office.": 4,
    };

    const cc2Map = {
      "Easy to see": 1,
      "Somewhat visible": 2,
      "Not visible at all": 3,
      "N/A": 4,
    };

    const cc3Map = {
      "Helped very much": 1,
      "Somewhat helped": 2,
      "Did not help": 3,
      "N/A": 4,
    };

    const payload = {
      maintenance_request_id: formData.maintenance_request_id,
      client_type: formData.client_type,
      service_type: formData.service_type,
      date: formData.date,
      sex: formData.sex,
      age: formData.age,
      region: formData.region,
      office_visited: formData.office_visited,
      service_availed: formData.service_availed,
      cc1: cc1Options[formData.cc1] ?? null,
      cc2: cc2Map[formData.cc2] ?? null,
      cc3: cc3Map[formData.cc3] ?? null,
      sqd0: formData.sqd[0],
      sqd1: formData.sqd[1],
      sqd2: formData.sqd[2],
      sqd3: formData.sqd[3],
      sqd4: formData.sqd[4],
      sqd5: formData.sqd[5],
      sqd6: formData.sqd[6],
      sqd7: formData.sqd[7],
      sqd8: formData.sqd[8],
      suggestions: formData.suggestions,
      email: formData.email,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error status:", response.status);
        console.error("Error body:", errorText);
        alert(`Failed to submit feedback. Server responded with status ${response.status}.`);
        return;
      }

      const result = await response.json();
      console.log("Success:", result);

      setSubmitted(true); // Show thank you message

      // Navigate to the request status page after submission
      navigate("/requeststatus"); // Replace with the correct path if needed

    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting your feedback. Please try again.");
    }
  };

  const ccOptions = [
    "1. I know what a CC is and I saw this office’s CC.",
    "2. I know what a CC is but I did NOT see this office’s CC.",
    "3. I know the CC only when I saw this office’s CC.",
    "4. I do not know what a CC is and I did not see one in this office.",
  ];

  const sqdLabels = [
    "I am satisfied with the service that I availed.",
    "I spent a reasonable amount of time for my transaction.",
    "The office followed the transaction’s requirements and steps based on the information provided.",
    "The steps (including payment) I needed to do for my transaction were easy and simple.",
    "I easily found information about my transaction from the office or its website.",
    "I paid a reasonable amount of fees for my transaction.",
    "I felt the office was fair to everyone, or 'walang palakasan', during my transaction.",
    "I was treated courteously by the staff, and (if asked for help) the staff was helpful.",
    "I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.",
  ];

  const ratings = ["5", "4", "3", "2", "1", "N/A"];

  // Conditional rendering for the thank you message
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-white shadow rounded">
        <h2 className="text-2xl font-semibold text-green-600 mb-4">Thank you!</h2>
        <p>Your feedback has been submitted successfully. We appreciate your input.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow space-y-6"
    >
      <h2 className="text-xl font-bold text-center">
        JOSE RIZAL MEMORIAL STATE UNIVERSITY <br />
        CLIENT SATISFACTION MEASUREMENT
      </h2>
      <p className="text-center italic">HELP US SERVE YOU BETTER!</p>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold">Client Type</label>
          <select name="client_type" onChange={handleInput} className="w-full border p-2 rounded">
            <option value="">-- Select --</option>
            <option value="Citizen">Citizen</option>
            <option value="Business">Business</option>
            <option value="Government">Government</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold">Service Type</label>
          <select name="service_type" onChange={handleInput} className="w-full border p-2 rounded">
            <option value="">-- Select --</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
        </div>
        <input type="date" name="date" onChange={handleInput} className="col-span-2 border p-2 rounded" />
        <input name="sex" onChange={handleInput} className="border p-2 rounded" placeholder="Sex" />
        <input name="age" type="number" onChange={handleInput} className="border p-2 rounded" placeholder="Age" />
        <input name="region" onChange={handleInput} className="border p-2 rounded" placeholder="Region of Residence" />
        <input name="office_visited" onChange={handleInput} className="col-span-2 border p-2 rounded" placeholder="Office Visited" />
        <input name="service_availed" onChange={handleInput} className="col-span-2 border p-2 rounded" placeholder="Service Availed" />
      </div>

      {/* CC Section */}
      <div>
        <h3 className="font-semibold">CC1: Awareness of Citizen's Charter (CC)</h3>
        {ccOptions.map((opt, i) => (
          <label key={i} className="block">
            <input
              type="radio"
              name="cc1"
              value={opt}
              onChange={handleInput}
              className="mr-2"
              checked={formData.cc1 === opt}
            />
            {opt}
          </label>
        ))}

        <div className="mt-4">
          <label className="font-semibold">CC2: How visible was the CC?</label>
          <select name="cc2" onChange={handleInput} className="w-full border p-2 rounded mt-1">
            <option value="">-- Select --</option>
            <option value="Easy to see">Easy to see</option>
            <option value="Somewhat visible">Somewhat visible</option>
            <option value="Not visible at all">Not visible at all</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="font-semibold">CC3: How much did it help?</label>
          <select name="cc3" onChange={handleInput} className="w-full border p-2 rounded mt-1">
            <option value="">-- Select --</option>
            <option value="Helped very much">Helped very much</option>
            <option value="Somewhat helped">Somewhat helped</option>
            <option value="Did not help">Did not help</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
      </div>

      {/* SQD Table */}
      <div>
        <h3 className="font-semibold mb-2">SERVICE QUALITY DIMENSIONS</h3>
        <table className="w-full text-sm border border-gray-300 text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Statement</th>
              {ratings.map((r, i) => (
                <th key={i} className="border px-2">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sqdLabels.map((label, i) => (
              <tr key={i} className="odd:bg-white even:bg-gray-50">
                <td className="border text-left px-2 py-1">{label}</td>
                {ratings.map((rating, j) => (
                  <td key={j} className="border">
                    <input
                      type="radio"
                      name={`sqd${i}`}
                      value={rating}
                      checked={formData.sqd[i] === rating}
                      onChange={handleInput}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Suggestions and Email */}
      <div>
        <label className="block font-semibold">Suggestions</label>
        <textarea
          name="suggestions"
          value={formData.suggestions}
          onChange={handleInput}
          className="w-full border p-2 rounded"
          rows="3"
        />
      </div>
      <div>
        <label className="block font-semibold">Email Address (Optional)</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInput}
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Feedback
      </button>
    </form>
  );
};

export default UserFeedbackForm;
