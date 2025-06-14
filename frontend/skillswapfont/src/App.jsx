import { useState } from 'react';
import './App.css';
import axios from "axios"
import Navbar from './Navbar';


function App() {
  const [logindata, setloginData] = useState({ "username": "", "password": "" });
  const [registerdata, setregisterdata] = useState({ "username": "", "password": "", "email": "" })

  const handlesubmit = async (type) => {
    const url = 'http://127.0.0.1:8000/register'
    try {
      const res = await axios.post(url, registerdata)
      alert(res.data.message);
    }
    catch (err) {
      alert(err.response.data.detail)
    }
  }

  const handlesubmit2 = async (type) => {
    const url = 'http://127.0.0.1:8000/login'
    try {
      const res = await axios.post(url, logindata);
      alert(res.data.message)
    }
    catch (err) {
      alert(err.response.data.message)
    }
  }
  return (
    <div>
      <Navbar />
    </div>

  )

}


export default App;