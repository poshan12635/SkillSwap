import { useState, useEffect } from 'react';
import './App.css';
import axios from "axios";
import Navbar from './Navbar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Homepage from './pages/Homepage';
import SkillSync from './pages/SkillSync';
import SkillSync1 from './pages/SkillSync1';
import Profile from './pages/Profile';
import Post from './pages/Post'
import Details from './pages/Details'
import Message from './pages/Message';
function App() {


  return (
    <Router>
      <Navbar />


      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<SkillSync />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/skillSync1"
          element={<SkillSync1 />}
        />
        <Route path='/profile' element={<Profile />} />
        <Route path='/post' element={<Post />} />
        <Route path='/de' element={<Details />} />
        <Route path='/message' element={<Message />} />
      </Routes>
    </Router>
  );
}

export default App;
