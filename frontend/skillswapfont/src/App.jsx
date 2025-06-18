import { useState } from 'react';
import './App.css';
import axios from "axios"
import Navbar from './Navbar';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {

  return (
    <div>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
        </Routes>
      </Router>
    </div>

  )

}


export default App;