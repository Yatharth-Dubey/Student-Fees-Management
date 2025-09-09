import React, { useState, useRef, use, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "axios";
import "./Reg.css";
export const Reg = () => {
  const [classes, setclasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [excelData, setExcelData] = useState([]); // store excel records
  useEffect(() => {
    let classsession = sessionref.current.value;
    const fetchclasses = async () => {
      try{
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=StudentReg/fetch`, {classsession});
        setclasses(response.data.result || []);
      }catch(error){
        console.log("Error fetching classes:", error);
        setclasses([])
      }
    };
    fetchclasses();
  }, []);
  const rollref = useRef();
  const studentref = useRef();
  const motherref = useRef();
  const fatherref = useRef();
  const classref = useRef();
  const sessionref = useRef();
  const addref = useRef();
  const phoneref = useRef();
  const navi = useNavigate();
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0]; // first sheet
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log("Excel Data:", jsonData);
      setExcelData(jsonData);
    };
    reader.readAsBinaryString(file);
  };
  const handleBulk = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=reg/bulk`, {
        students: excelData, // send all excel rows
      });
      alert("✅ Bulk Upload Done!");
      console.log(response.data);
    } catch (error) {
      console.error("Bulk upload error:", error);
    }
  };
  // Handle submit
  const handleSubmit = async (e) => {
    let rollno = rollref.current.value;
    let studentname = studentref.current.value;
    let mothername = motherref.current.value;
    let fathername = fatherref.current.value;
    let classid = classref.current.value;
    let classsession = sessionref.current.value;
    let address = addref.current.value;
    let phone = phoneref.current.value;
    let now = new Date();
    let time = now.toLocaleTimeString();
    let date = now.toLocaleDateString();
    let milliseconds = now.getMilliseconds().toString().padStart(3, "0"); // always 3 digits
    let timeStamp = `Date: ${date}, Time: ${time}.${milliseconds}`;
    try{
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=reg`, {rollno, studentname, mothername, fathername, classid, classsession, address, phone, timeRecord: timeStamp});
      console.log(response.data);
      if(response.data.status){
        alert("✅Student Registered");
        navi("/StudentReg");
      }
    }catch(error){
      if (error.response && error.response.status === 401) {
        alert("❌ Wrong Credentials");
      } else {
        alert("⚠️ Server error, please try again later");
        console.log("Error:", error);
      }
    }
    e.preventDefault();  
  };
  return (
      <div className="reg-container">
        <h2>Student Registration</h2>
        <form className="reg-form" onSubmit={handleSubmit}>
          {/* Academic Info Section */}
          <div className="form-section">
            <h3>Academic Info</h3>
            <div className="form-grid">
              <div>
                <label>Roll No.</label>
                <input
                  type="text"
                  name="rollno"
                  ref={rollref}
                  placeholder="Enter Roll No."
                />
              </div>
              <div>
                <label>Class</label>
                <select ref={classref} required onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.classno} value={cls.class}>
                      {cls.class} 
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Session</label>
                <input type="text" value={sessionStorage.getItem("sessionkey")} ref={sessionref} readOnly/>
                {/* <select ref={sessionref} required disabled={!selectedClass}>
                  <option value="">Select Session</option>
                  {classes.filter((cls) => cls.class === selectedClass) // only sessions of selected class
                  .map((cls, idx) => (
                  <option key={idx} value={cls.classsession}>
                    {cls.classsession}
                  </option>
                  ))}
                </select> */}
              </div>
              <div>
                <label>Student's Name</label>
                <input
                  type="text"
                  name="studentname"
                  ref={studentref}
                  placeholder="Enter Student's Name"
                />
              </div>
            </div>
          </div>
          {/* Personal Info Section */}
          <div className="form-section">
            <h3>Personal Info</h3>
            <div className="form-grid">
              <div>
                <label>Mother's Name</label>
                <input
                  type="text"
                  name="mothername"
                  ref={motherref}
                  placeholder="Enter Mother's Name"
                />
              </div>
              <div>
                <label>Father's Name</label>
                <input
                  type="text"
                  name="fathername"
                  ref={fatherref}
                  placeholder="Enter Father's Name"
                />
              </div>
              <div>
                <label>Phone No.</label>
                <input
                  type="text"
                  name="phone"
                  ref={phoneref}
                  placeholder="Enter Phone No."
                />
              </div>
              <div className="address-field">
                <label>Address</label>
                <textarea
                  name="address"
                  ref={addref}
                  placeholder="Enter Address"
                />
              </div>
            </div>
          </div>
          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>
        <div className="upload-section">
          <label>Upload Excel File: </label>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload}/>
          {excelData.length > 0 && (
            <button className="bulk-btn" onClick={handleBulk}>
              Bulk Upload ({excelData.length} students)
            </button>
          )}
        </div>
      </div>
  );
};
