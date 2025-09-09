import React, { useRef, useState, useEffect } from "react";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "./Fees.css";
import axios from "axios";
export const Fees = () => {
  const [classes, setclasses] = useState([]);
  const [student, setstudent] = useState();
  const [MonthReport, setMonthReport] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [submittedMonths, setsubmittedMonths] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]); // ✅ track selected months
  const [total, setTotal] = useState(0); // ✅ track total fees
  const [timeRecord, settimeRecord] = useState("");
  const months = [
    "january", "february", "march", "april",
    "may", "june", "july", "august",
    "september", "october", "november", "december"
  ];
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
  const rollref = useRef();
  const studentref = useRef();
  const classref = useRef();
  const sessionref = useRef();
  const navi = useNavigate();
  //Handle Check
  const handleCheck = async (e) => {
    e.preventDefault();
    let rollno = rollref.current.value;
    let studentname = studentref.current.value;
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    const fetchmonths = async () => {
      try{
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=Already-Submitted`, {rollno, studentname, classid, classsession});
        setsubmittedMonths(response.data.result || []);
      }catch(error){
        console.log("Error fetching Months:", error);
        setsubmittedMonths([]);
      }
    }
    fetchmonths();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=Check`, {
        rollno, studentname, classid: selectedClass, classsession
      });
      if (response.data.status) {
        setMonthReport(response.data.result);
        alert("✅Select the month(s) for the fees submission");
      } else {
        setMonthReport([]);
        alert("Invalid Access");
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
const handleMonthSelect = (monthIndex) => {
  let newSelected = [...selectedMonths];
  if (selectedMonths.includes(monthIndex)) {
    // allow deselect only if it's the last one
    if (monthIndex === selectedMonths[selectedMonths.length - 1]) {
      newSelected = selectedMonths.slice(0, -1);
    }
  } else {
    // simply allow selection (checkbox is already controlling order)
    newSelected = [...selectedMonths, monthIndex];
  }
  setSelectedMonths(newSelected);
  // ✅ calculate total
  if (MonthReport.length > 0) {
    const student = MonthReport[0];
    const sum = newSelected.reduce(
      (acc, idx) => acc + (parseFloat(student[months[idx]]) || 0),
      0
    );
    setTotal(sum);
  }
};  
  // Handle submit
    const handleSubmit = async (e) => {
    e.preventDefault();
    let rollno = rollref.current.value;
    let studentname = studentref.current.value;
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    let now = new Date();
    let time = now.toLocaleTimeString();
    let date = now.toLocaleDateString();
    let milliseconds = now.getMilliseconds().toString().padStart(3, "0"); // always 3 digits
    let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
    settimeRecord(timeStamp);
    console.log(timeStamp);
    // ✅ last selected month index + 1 (because Jan=1, Feb=2,...)
    const lastPaidMonth = selectedMonths.length > 0 
      ? selectedMonths[selectedMonths.length - 1] + 1 : 0;
    const adjustedMonths = selectedMonths.map(i => i + 1);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=Submitted`, {
        rollno,
        studentname,
        classid,
        classsession,
        selectedMonths: adjustedMonths,  // ✅ send correct month
        total: total,              // ✅ use tracked total fees
        timeRecord: timeStamp
      });
      if (response.data.status) {
        alert(`✅ Fees Submitted Successfully. Total: ₹${total}`);
        const doc = new jsPDF();
        const image = new Image();
        image.src = "/kratos.jpg";
        doc.addImage(image, "JPG", 20, 10, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("RBS School Fees Receipt", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });
        doc.setFontSize(15);
        doc.text(`Student Name: ${studentname}`, 20, 70);
        doc.text(`Roll No: ${rollno}`, 20, 80);
        doc.text(`Class: ${classid}`, 20, 90);
        doc.text(`Session: ${classsession}`, 20, 100);
        // Months paid
        let paidMonths = selectedMonths.map((i) => months[i]).join(", ");
        autoTable(doc, {
          startY: 120,
          head: [["Months Paid", "Total Paid", "Date/Time"]],
          body: [
            [paidMonths, `₹${total}`, timeStamp]
          ]
        });
        doc.text(`Total Paid: ₹${total}`, 20, 280);
        doc.text(`Date/Time: ${timeStamp}`, 20, 290);
        doc.setFontSize(8)
        doc.text("This is a computer-generated receipt.This is not valid without the school's official stamp", 20, 300)
        console.log("Generating PDF..."); // ✅ debug
        setTimeout(() => {
          doc.save(`fees_${rollno}.pdf`);
        }, 100);
        // navi("/StudentReg/Fees");
        handleCheck(e);
        setSelectedMonths([]);
        setTotal(0);
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
  const handleFetchStudent = async () => {
    const rollno = rollref.current.value;
    const classid = classref.current.value;
    const classsession = sessionref.current.value;
    try{
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=fetchStudent`, {rollno, classid, classsession});
      if (response.data.result && response.data.result.length > 0) {
        setstudent(response.data.result[0].studentname); // ✅ only take the name
      } else {
        alert("No such student is registered. Please Register the Student.");
        navi("/StudentReg/Reg");
      }
    }catch(error){
      if (error.response && error.response.status === 401) {
        alert("❌ Wrong Credentials");
      } else {
        alert("⚠️ Server error, please try again later");
        console.log("Error:", error);
      }
    }
  }
  return (
    <div className="fees-container">
      <h2>Fees Submission</h2>
      <form className="reg-form">
        {/* Academic Info Section */}
        <div className="form-section">
          <h3>Student Info</h3>
          <div className="form-grid">
            <div>
              <label>Class</label>
              <select ref={classref} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.classno} value={cls.classid}>{cls.class}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Session</label>
              <input type="text" ref={sessionref} value={sessionStorage.getItem("sessionkey")} readOnly required />
            </div>
            <div>
              <label>Roll No.</label>
              <input type="text" disabled={!selectedClass} ref={rollref} placeholder="Enter Roll No." required onBlur={handleFetchStudent} />
            </div>
            <div>
              <label>Student's Name</label>
              <input type="text" ref={studentref} value={student || ""} placeholder="Enter Student's Name" required readOnly />
            </div>
          </div>
          <button onClick={handleCheck} type="button" className="submit-btn">
            Check Fees
          </button>
        </div>
        <div>
          {MonthReport.length > 0 && (
          <div className="report-results">
          <h3>📊 Fees Table</h3>
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Select</th>
                  <th>Class</th>
                  <th>Session</th>
                  <th>Fees</th>
                </tr>
              </thead>
                <tbody>
                  {months.map((m, i) => {
                    const student = MonthReport[0];

                    // Check if month is already paid in DB
                    const isPaid = submittedMonths.some(sm => sm.month_no === i+1 && sm.status === "Paid");

                    // Allow selection only if previous month is already Paid or selected
                    const prevMonthPaid = i === 0 
                      ? true 
                      : submittedMonths.some(sm => sm.month_no === i && sm.status === "Paid") 
                        || selectedMonths.includes(i - 1);

                    return (
                      <tr key={i}>
                        <td>{m.charAt(0).toUpperCase() + m.slice(1)}</td>
                        <td>
                          {isPaid ? (
                            <span style={{ color: "green", fontWeight: "bold" }}>✅ Paid</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedMonths.includes(i)}
                              onChange={() => handleMonthSelect(i)}
                              disabled={!prevMonthPaid}
                            />
                          )}
                        </td>
                        <td>{student.class}</td>
                        <td>{student.classsession}</td>
                        <td>{student[m]}</td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          </div>
          {/* ✅ Total + Submit button */}
          {selectedMonths.length > 0 && (
            <div className="total-section">
              <h3>Total Fees: ₹{total}</h3>
              <button onClick={handleSubmit} type="submit" className="submit-btn">
                Submit
              </button>
            </div>
          )}
        </div>
        )}
        </div>
      </form>
    </div>
  );
};