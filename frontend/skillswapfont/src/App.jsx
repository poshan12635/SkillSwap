import { useState } from 'react';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState(null); 
  const [username, setUsername] = useState('');
  const [confirmpassword, setConfirmPassword] = useState('');
  const [password, setPassword] = useState('');
  

  const handleLoginClick = () => {
    setActiveView(prev => (prev === 'login' ? null : 'login'));
  };

  const handleEventClick = () => {
    setActiveView(prev => (prev === 'event' ? null : 'event'));
  };
  const handleRegisterClick = () => {
    setActiveView(prev => (prev === 'register' ? null : 'register'));
  };

   
 
  
  return (
    <div>
      <div id="header">
        <div className='left'>
        <button className="text">Home</button>
        <button className="text">About Us</button>
        <button className="text" onClick={handleEventClick}>Event</button>
        <button className="text">Contact Us</button>
       </div>
       <div className='right'>
        
         <button className="text" onClick={handleLoginClick}>Login</button>
        <button className="text"  onClick={handleRegisterClick} >Register</button>
        <input type='search' placeholder='search...'className='search-box'/>
        </div>
      </div>
      <br></br>

      {activeView === 'login' && (
        <div className="l1">
          <h4>Login</h4>
          <form>
            <input type="email" placeholder="username"value={username} onChange={e => setUsername(e.target.value)} className="box" />
            <input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} className="box" />
            <button type="submit">Login</button>
          </form>
        </div>
      )}

      {activeView === 'event' && (
        <div>
          <h1>Event List</h1>
        </div>
      )}
   
    {activeView === 'register' && (
      <div className='r1'>
      <form>
      <h1>Register</h1>
        <input type="email" placeholder='email' value={username}  onChange={e => setUsername(e.target.value)} className='box' /> <br />
       <input type="password" placeholder='password' value={password} onChange={e => setPassword(e.target.value)} className='box' /> <br />
        <input type="password" placeholder='confirm password' value={confirmpassword} onChange={e => setConfirmPassword(e.target.value)} className='box' /> <br />
       <div className='b1'>

     
        <button type='submit'> register</button>
        <button type='button' onClick ={() => {setActiveView(null)}}> back </button>
          </div>
   </form>
  </div>
 )} 
 
  </div>

  /*const [username,setusername ] = useState()
const[password,setpassword]= useState()
const[currentForm,setCurrentForm]=useState('Login')


const handleClick=()=>{
  navigate('/app');
}
  return (
    
   <div className='page1'>
    <div className='header'>

  
   
        
        <div className='button'>
          <button className={currentForm === 'Login' ? 'button active': 'button'} onClick={()=> setCurrentForm( 'Login' ) } > Login </button>
        <button className={currentForm === 'Register' ? 'button active':'button'} onClick={()=>setCurrentForm( 'Register' ) }> Register </button>
      
        </div>
        
</div>
        {currentForm === 'Login' &&(
<div className='loginpage'>

        <form>
          <h1>Login</h1>
        <input type="email" placeholder='email' value={username} onChange={(e) => setUsername(e.target.value)} className='box' /> <br />
        <input type="password" placeholder='password' value={password} onChange={e => setPassword(e.target.value)} className='box' /> <br />
        <button type='submit'>login</button>
        

          
        <a href="#">Forget password</a>

      </form>
      </div>
    )}
    {currentForm === 'Register' &&(
      
        <div className='register'>
<form>
       
        <h1>Register</h1>
        <input type="email" placeholder='email' value={username} onChange={(e) => setUsername(e.target.value)} className='box' /> <br />
       <input type="password" placeholder='password' value={password} onChange={e => setPassword(e.target.value)} className='box' /> <br />
        <input type="password" placeholder='password' value={password} onChange={e => setPassword(e.target.value)} className='box' /> <br />

      </form>
       </div> 
       
    )}
     
      </div>*/
     
    
  );
};

export default App;
