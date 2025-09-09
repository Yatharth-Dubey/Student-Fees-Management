import React, { useEffect, useRef, useState } from "react";
import "./ViewStructure.css";
import axios from "axios";

export const ViewStructure = () => {
  const classref = useRef();
  const sessionref = useRef();
  const [classes, setclasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(""); // dropdown
  const [classReport, setClassReport] = useState([]);     // API result
  useEffect(() => {
    const classsession = sessionStorage.getItem("sessionkey")
    const fetchclasses = async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=StudentReg/fetch`, {classsession});
        setclasses(response.data.result || []);
      } catch (error) {
        console.log("Error fetching classes:", error);
        setclasses([]);
      }
    };
    fetchclasses();
  }, []);
  const handleView = async (e) => {
    e.preventDefault();
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=view-structure`, {
        classid,
        classsession,
      });
      console.log(response.data);
      if (response.data.status === "yes") {
        setClassReport(response.data.result); // ✅ save result into report state
      } else {
        setClassReport([]);
        alert("⚠️ No students found for this class/session");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("❌ Wrong Credentials");
      } else {
        alert("⚠️ Server error, please try again later");
        console.log("Error:", error);
      }
    }
  };
  return (
    <div>
      <div className="view-structure">
        <h2>View Fees Structure</h2>
        {/* Class Report Form */}
        <form className="view-form" onSubmit={handleView}>
          <label>Class</label>
          <select
            ref={classref}
            required
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)} // ✅ keep selected class
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.classno} value={cls.class}>
                {cls.class}
              </option>
            ))}
          </select>
          <label>Session</label>
          <input
            type="text"
            name="session"
            value={sessionStorage.getItem("sessionkey")}
            readOnly
            ref={sessionref}
          />
          <button type="submit">View Structure</button>
        </form>
      </div>
      {/* Display backend results */}
      {classReport.length > 0 && (
        <div className="table-wrapper">
          <h3>📊 Fees Structure</h3>
          <div className="table-container">
            <table className="structure-table">
              <thead>
                <tr>
                  <th>Class No</th>
                  <th>Class</th>
                  <th>Session</th>
                  <th>January</th>
                  <th>February</th>
                  <th>March</th>
                  <th>April</th>
                  <th>May</th>
                  <th>June</th>
                  <th>July</th>
                  <th>August</th>
                  <th>September</th>
                  <th>October</th>
                  <th>November</th>
                  <th>December</th>
                </tr>
              </thead>
              <tbody>
                {classReport.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.classno}</td>
                    <td>{row.class}</td>
                    <td>{row.classsession}</td>
                    <td>{row.january}</td>
                    <td>{row.february}</td>
                    <td>{row.march}</td>
                    <td>{row.april}</td>
                    <td>{row.may}</td>
                    <td>{row.june}</td>
                    <td>{row.july}</td>
                    <td>{row.august}</td>
                    <td>{row.september}</td>
                    <td>{row.october}</td>
                    <td>{row.november}</td>
                    <td>{row.december}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
