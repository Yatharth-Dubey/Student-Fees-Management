import React, { useEffect, useRef, useState } from "react";
import './Report.css'
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import axios from "axios";
export const Report = () => {
  const [view, setView] = useState("class"); // "class" | "student" | "fee"
  const [studentReport, setStudentReport] = useState([]);
  const [monthReport, setMonthReport] = useState([]);
  const [classReport, setClassReport] = useState([]);
  const [classes, setclasses] = useState([]);
  const [feeStatus, setFeeStatus] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedmonth, setSelectedMonth] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const classref = useRef();
  const monthref = useRef();
  const months = [
    "january", "february", "march", "april",
    "may", "june", "july", "august",
    "september", "october", "november", "december"
  ];
  useEffect(() => {
    let classsession = sessionStorage.getItem("sessionkey");
    const fetchclasses = async () => {
      try{
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=StudentReg/fetch`, {classsession});
        setclasses(response.data.result || []);
      }catch(error){
        console.log("Error fetching classes:", error);
        setclasses([]);
      }
    };
    fetchclasses();
  }, []);
  const handleClass = async () => {
    let classsession = sessionStorage.getItem("sessionkey");
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=StudentReg/fetch`, {
        classsession,
      });
      if (response.data.status === "yes") {
        setClassReport(response.data.result);
        setView("class");
      } else {
        alert("⚠️ No Class Registered");
        setClassReport([]);
      }
    } catch (error) {
      alert("⚠️ Server error, please try again later");
      console.error("Error:", error);
    }
  };
  const handleFetchStudent = async (classid, classsession) => {
    setSelectedClass({ classid, classsession });
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=FetchStudents`, {
        classid,
        classsession,
      });
      if (response.data.status === "yes") {
        setStudentReport(response.data.result);
        setView("student");
      } else {
        alert("⚠️ No Registered Student Found!");
      }
    } catch (error) {
      alert("⚠️ Server error, please try again later!");
      console.error("Error:", error);
    }
  };
  const handlemonthfeestatus = async () => {
    const classid = classref.current.value;
    const classsession = sessionStorage.getItem("sessionkey");
    const month_name = monthref.current.value;
    try{
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=FeeMonthStatus`, {
        classid,
        classsession,
        month_name
      });
      setSelectedClass({classid, classsession})
      if(response.data.status === "yes"){
        setMonthReport(response.data.result);
        setView("Monthfee");
      }
    }catch(error){
      alert("⚠️ Server error, please try again later!");
    }
  }
  const handleFeeStatus = async (rollno, studentname, classid, classsession) => {
    setSelectedStudent({ rollno, studentname, classid, classsession });
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=FeeStatusFetch`, {
        rollno,
        studentname,
        classid,
        classsession,
      });
      if (response.data.status === "yes") {
        setFeeStatus(response.data.result);
        setView("fee");
      } else {
        alert("⚠️ No fee records found!");
        setFeeStatus(null);
      }
    } catch (error) {
      alert("⚠️ Server error, please try again later!");
      console.error("Error:", error);
    }
  };
  return (
    <div>
      <div className="Reportslate">
        <div className="Reportbox">
          <h3 className="label">®️ View Registered Classes</h3>
          <br />
          <button className="regbtn" onClick={handleClass}>
            Show
          </button>
        </div>
        <div className="Reportbox">
          <h3 className="label">🔍 Fees Report</h3>
          <br />
          <select className="select_options" ref={classref} required onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.classno} value={cls.class}>
                {cls.class}
              </option>
            ))}
          </select>
          <select className="select_options" ref={monthref} required onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">Select Month</option>
            {months.map((mth, idx) => (
              <option key={idx} value={mth}>
                {mth}
              </option>
            ))}
          </select>
          <button className="regbtn" onClick={handlemonthfeestatus}>
            Check
          </button>
        </div>
      </div>
      <div className="class-registered">
        {view === "class" && classReport.length > 0 && (
          <>
          <br />
            <h3>📊 Registered Classes</h3><br />
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Sr No.</th>
                    <th>Class</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {classReport.map((student, idx) => (
                    <tr
                      key={idx}
                      onClick={() =>
                        handleFetchStudent(student.class, student.classsession)
                      }
                    >
                      <td>{student.classno}</td>
                      <td>{student.class}</td>
                      <td>{student.classsession}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {view === "Monthfee" && (
          <>
          <br />
            <h3>📊 Month Fees Status ({selectedClass.classid} - {selectedClass.classsession})</h3><br />
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    <th>Month</th>
                    <th>Fees Status</th>
                    <th>Time and Date</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReport.map((mth, idx) => (
                    <tr key={idx}>
                      <td>{mth.rollno}</td>
                      <td>{mth.studentname}</td>
                      <td>{mth.month_name}</td>
                      <td style={{color: mth.status === "Paid" ? "green" : "red"}}>{mth.status}</td>
                      <td>{mth.timeRecord}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* ✅ Pie chart */}
              {monthReport.length > 0 && (() => {
                const paidCount = monthReport.filter((m) => m.status === "Paid").length;
                const unpaidCount = monthReport.filter((m) => m.status !== "Paid").length;

                const data = [
                  { name: "Paid", value: paidCount },
                  { name: "Unpaid", value: unpaidCount },
                ];
                const COLORS = ["#4caf50", "#f44336"];
                return (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                    <PieChart width={400} height={300}>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>
                );})()}
            </div>
          </>
        )}
        {view === "student" && (
          <>
          <br />
            <button className="backbtn" onClick={() => setView("class")}>⬅ Back to Classes</button><br />
            <h3>📊 Registered Students ({selectedClass.classid} - {selectedClass.classsession})</h3><br />
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {studentReport.map((student, idx) => (
                    <tr
                      key={idx}
                      onClick={() =>
                        handleFeeStatus(
                          student.rollno,
                          student.studentname,
                          student.class,
                          student.classsession
                        )
                      }
                    >
                      <td>{student.rollno}</td>
                      <td>{student.studentname}</td>
                      <td>{student.class}</td>
                      <td>{student.classsession}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {view === "fee" && (
          <>
          <br />
            <button className="backbtn" onClick={() => setView("student")}>
              ⬅ Back to Students
            </button>
            <h3>
              📊 Fees Status for {selectedStudent.studentname}(
              {selectedStudent.rollno}) ({selectedStudent.classid} -{" "}
              {selectedStudent.classsession})
            </h3><br />
            <div className="table-container">
              {Array.isArray(feeStatus) && feeStatus.length > 0 ? (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeStatus.map((student, idx) => (
                      <tr key={idx}>
                        <td>{student.month_name}</td>
                        <td>{student.amount}</td>
                        <td
                          style={{
                            color: student.status === "Paid" ? "green" : "red",
                          }}
                        >
                          {student.status}
                        </td>
                        <td>{student.timeRecord}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "red" }}>{feeStatus?.message}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};