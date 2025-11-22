import React, { useState } from 'react'
import { registerUser } from '../firebase/auth'
import logo from './../assets/logo.png'
import IllustrationSlide from '../components/IllustrationSlide'

function Register() {
    const [email, setEmail] = useState("");  
    const [message, setMessage] = useState("");
     const [error, setError] = useState("")

    const handleRegister = async (e) => {
        e.preventDefault()
        setError("")
        setMessage("")

        try {
           const result = await registerUser(email)
            if( result.needsVerification){
                alert("A verification link has been sent to your email. Please verify before logging in.")
            }
        } catch (err) {
            console.error("Error", err);
            setError(err.message)
        }
    }
    return (
        <div className="min-h-screen flex bg-white">
            <div className="hidden md:flex flex-1 items-center justify-center bg-[#39424c]">
                <IllustrationSlide />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-10 md:p-16 bg-[#333a42] shadow-lg">
                <div className="mb-12 text-center">
                    <img src={logo} alt="" className='w-28 flex mx-14'/>
                    <h3 className="text-gray-900 font-bold text-3xl mb-1">Welcome to Notiq</h3>
                 </div>
                <div className="card w-96 bg-[#252b31] shadow-xl">
                    <form className="card-body" onSubmit={handleRegister}>
                        <h2 className="text-2xl font-bold text-center">Create Account</h2>

                        <input type="email" placeholder="Email" className="input input-bordered w-full" onChange={(e) => setEmail(e.target.value)} value={email} required />
 
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button className="btn btn-primary w-full" type="submit">
                            Sign Up
                        </button>

                            {message && <p>{message}</p>}
                        <a href="/login" className="text-sm text-center mt-2 link">
                            Already have an account? Login
                        </a>
                    </form>
                </div>

                <p className='text-sm text-gray-500 mt-5 max-w-md text-center'>
                    By continuing, you agree to the <a className="underline" href=''>Terms & Conditions</a> and <a className="underline" href=''>Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}

export default Register
