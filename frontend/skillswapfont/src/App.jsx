import { useState } from 'react';
import './App.css';
import axios from "axios"
import Navbar from './Navbar';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Homepage from './pages/Homepage';
import SkillSync from './pages/SkillSync'
import SkillSync1 from './pages/SkillSync1'

function App() {

  return (
    <div>

      <Router>
        <Navbar />

        <Routes>
          <Route path='' element={<SkillSync />} />
          <Route path="/about" element={<About />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/SkillSync" element={<SkillSync />} />
        </Routes>
      </Router>

    </div>

  )

}


export default App;