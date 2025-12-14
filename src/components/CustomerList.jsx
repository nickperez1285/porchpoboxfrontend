import React, { useEffect, useState } from "react";
import axios from "axios";
// import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap is included

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/customers");
        setCustomers(response.data.customers);
      } catch (err) {
        setError("Failed to load customer data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p>{error}</p>;

  // Function to generate random background color for cards
  const getRandomColor = () => {
    const colors = ["bg-dark", "bg-dark", "bg-dark", "bg-dark", "bg-dark"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return randomColor;
  };

  return (
    <div className="container mt-2">
      <h1 className="fw-bold text-center mb-4">Customer Details</h1>
      <div className="row">
        {customers.map((customer) => (
          <div key={customer.customerId} className="col-md-4 mb-3">
            <div className={`card text-white ${getRandomColor()}`}>
              <div className="card-body shadow-lg">
                <h2 className="card-title text-warning mb-2">
                  {customer.customerName}
                </h2>
                <ul className="list-unstyled">
                  {customer.plans.length > 0 ? (
                    customer.plans.map((plan) => (
                      <li key={plan.planId}>
                        <p>
                          <strong>Amount:</strong> {plan.amount} {plan.currency}
                        </p>
                        <p>
                          <strong>Interval:</strong> {plan.interval}
                        </p>
                        <p>
                          <strong>Status:</strong> {plan.status}
                        </p>
                        <p>
                          <strong>Start Date:</strong>{" "}
                          {new Date(plan.start_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>End Date:</strong>{" "}
                          {new Date(
                            plan.current_period_end
                          ).toLocaleDateString()}
                        </p>
                      </li>
                    ))
                  ) : (
                    <p>No active plans for this customer.</p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerList;
