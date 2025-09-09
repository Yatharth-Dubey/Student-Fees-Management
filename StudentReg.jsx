import React, { useEffect, useRef, useState } from "react";
import "./StudentReg.css";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
function StudentReg() {
  const navigate = useNavigate();
  const location = useLocation();
  const classref = useRef();
  const sessionref = useRef();
  const [timeRecord, settimeRecord] = useState("");
  // Register Class
  const handleRegister = async () => {
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    let now = new Date();
    let time = now.toLocaleTimeString();
    let date = now.toLocaleDateString();
    let milliseconds = now.getMilliseconds().toString().padStart(3, "0");
    let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
    settimeRecord(timeStamp);
    sessionStorage.setItem("classid", classid);
    sessionStorage.setItem("classsession", classsession);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=StudentReg/register`, {
        classid,
        classsession,
        timeRecord: timeStamp,
      });
      if (response.data.status) {
        alert("✅ Class Registered");
        navigate("/StudentReg/Structure");
      }
    } catch (error) {
      alert("⚠️ Server error, please try again later");
      console.error("Error:", error);
    }
  };
  // Navigation
  const handleReport = () => {
    navigate("/StudentReg/Report");
  };
  const handleFeesCreate = () => {
    navigate("/StudentReg/Structure");
    sessionStorage.removeItem("classid");
  };
  const handleFees = () => {
    navigate("/StudentReg/Fees");
  };
  const handleCreate = () => {
    navigate("/StudentReg/Reg");
  };
  const handleViewStructure = () => {
    navigate("/StudentReg/ViewStructure");
  };
  const handleHome = () => {
    navigate("/StudentReg");
  };
  const handleAbout = () => {
    navigate("/StudentReg/About")
  }
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };
  // Token check
  useEffect(() => {
    const tok = sessionStorage.getItem("token");
    if (!tok) navigate("/");
  }, [navigate]);
  return (
    <div className="stu">
      {/* Header */}
      <header className="headstu">
        <div className="logo-section">
          <img src="kratos.jpg" alt="school_logo" />
          <h1>RBS PUBLIC SCHOOL</h1>
        </div>
        <ul>
          <li onClick={handleHome}>Home</li>
          <li onClick={handleAbout}>About Dev</li>
          <li onClick={handleLogout} className="logout">
            Log Out
          </li>
        </ul>
      </header>
      {/* Sidebar + Content */}
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidenav">
          <button onClick={handleCreate}>🧑‍🎓 Create Student</button>
          <button onClick={handleFeesCreate}>🧑‍💻 Create Fees Structure</button>
          <button onClick={handleFees}>💵 Fees Submission Portal</button>
          <button onClick={handleViewStructure}>💹 Fees Structure</button>
          <button onClick={handleReport}>📟 Student Fees Report</button>
        </aside>
        {/* Main Content */}
        <section className="sect">
          <Outlet />
          {location.pathname === "/StudentReg" && (
            <>
              <h2>🎓 Class Registration Portal</h2>
              <div className="regStu">
                <p className="label">Register Class🏛️</p>
                <div className="selectors">
                  <input type="text" id="classreg" ref={classref} placeholder="Class (Eg: 3A)" />
                  <input
                    type="text"
                    id="select"
                    ref={sessionref}
                    value={sessionStorage.getItem("sessionkey" || "")}
                    readOnly
                  />
                </div>
              </div>
              <button onClick={handleRegister} className="regbtn">
                Register
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
export default StudentReg;