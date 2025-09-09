import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Reg.css";
export const Structure = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [feesData, setFeesData] = useState({});
  const [timeRecord, settimeRecord] = useState("");
  const navi = useNavigate();
  const monthsList = [
    "January","February","March","April",
    "May","June","July","August",
    "September","October","November","December"
  ];
  // Load class+session from sessionStorage
  useEffect(() => {
    const classid = sessionStorage.getItem("classid");
    const classsession = sessionStorage.getItem("classsession");
    if (classid && classsession) {
      setSelectedClass(classid);
      setSelectedSession(classsession);
    } else {
      const classsession = sessionStorage.getItem("sessionkey");
      const fetchclasses = async () => {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=StudentReg/fetch`, {classsession});
          setClasses(response.data.result || []);
        } catch (error) {
          console.log("Error fetching classes:", error);
          setClasses([]);
        }
      };
      fetchclasses();
    }
  }, [navi]);
  // Handle change in fees input
  const handleFeeChange = (month, value) => {
    setFeesData(prev => ({
      ...prev,
      [month.toLowerCase()]: value
    }));
  };
  // Save to DB
  const handleSave = async (e) => {
    e.preventDefault();
    let now = new Date();
    let time = now.toLocaleTimeString();
    let date = now.toLocaleDateString();
    let milliseconds = now.getMilliseconds().toString().padStart(3, "0"); // always 3 digits
    let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
    settimeRecord(timeStamp);
    console.log(timeStamp);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=fees-structure`, {
        classid: selectedClass,
        classsession: sessionStorage.getItem("sessionkey"),
        ...feesData,
        timeRecord: timeStamp
      });
      if (response.data.status) {
        alert("✅ Fees Structure Saved Successfully");
        setFeesData({});
        navi("/StudentReg");
      }
    } catch (error) {
      alert("⚠️ Server error, please try again later");
      console.log("Error:", error);
    }
  };
  return (
    <div className="reg-container">
      <h2>Fees Structure</h2>
      {/* Fixed Class & Session */}
      <div className="form-section">
  <div className="form-grid">
    <div>
      <label>Class</label>
      {sessionStorage.getItem("classid") ? (
        <input type="text" value={selectedClass} readOnly className="class-session"/>
      ) : (
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="class-session">
          <option value="">Select Class</option>
          {classes.map((cls, idx) => (
            <option key={idx} value={cls.class}>{cls.class}</option>
          ))}
        </select>
      )}
    </div>
    <div>
      <label>Session</label>
      <input type="text" value={sessionStorage.getItem("sessionkey")} readOnly className="class-session" />
        </div>
      </div>
    </div>
      {/* Fees Table */}
      <div className="form-section">
        <h3>Monthly Fees</h3>
        <table className="fees-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Fees</th>
            </tr>
          </thead>
          <tbody>
            {monthsList.map((month, idx) => (
              <tr key={idx}>
                <td>{month}</td>
                <td className="month-table">
                  <input
                    type="number"
                    placeholder="Enter Fees"
                    value={feesData[month.toLowerCase()] || ""}
                    onChange={(e) => handleFeeChange(month, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={handleSave} className="submit-btn">
        💾 Save Fees Structure
      </button>
    </div>
  );
};