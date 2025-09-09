import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './admin.css'
import axios from 'axios'

export const Admin = () => {
  const keyRef = useRef();
  const sessionRef = useRef();
  const navi = useNavigate();

  const handleAdmin = async () => {
    let logkey = keyRef.current.value;
    let sessionkey = sessionRef.current.value;
    sessionStorage.setItem("sessionkey", sessionkey);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api.php?endpoint=admin`, {logkey});
      console.log(response.data);
      sessionStorage.setItem("token", response.data.token);
      if (response.data.status) {
        alert("✅ Admin Login Successful");
        navi("/StudentReg");
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
    <div className="adm">
      <section className="admsec">
        <h2 className="adm-title">🔑 Admin Login</h2>
        <input type="password" placeholder="Enter Login Key..." ref={keyRef} />
        <select ref={sessionRef} name="session" defaultValue="">
          <option value="" disabled>
            Enter Session (2025-26)
          </option>
          <option value="2025-26">2025-26</option>
          <option value="2026-27">2026-27</option>
          <option value="2027-28">2027-28</option>
          <option value="2028-29">2028-29</option>
          <option value="2029-30">2029-30</option>
        </select>
        <button onClick={handleAdmin}>Enter</button>
      </section>
    </div>
  )
}