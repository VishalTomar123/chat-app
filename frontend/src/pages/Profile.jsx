import { useEffect, useState, useRef  } from "react";
import API from "../services/api";
import "../styles/profile.css";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import {
    FaHome,
    FaUser,
    FaPhoneAlt,
    FaInfoCircle,
    FaTimes, 
    FaSignOutAlt,
    FaIdBadge,
    FaCopy,
    FaCheck,
  } from "react-icons/fa";
import toast from "react-hot-toast";

function Profile() {

    const userId = localStorage.getItem("userId");

    const [uploading, setUploading] = useState(false);

    const { user, setUser, fetchUser, } = useUser();
    
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const modalRef = useRef(null);

    

    const handleChange = (e) => {

        setUser(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));

    };

    const updateProfile = async () => {

        try {

            await API.put("/users/profile", user);

            await fetchUser();

            if (!user) {
                return (
                    <div className="profile-page">
                        <div className="profile-card">
                            <h2>Loading...</h2>
                        </div>
                    </div>
                );
            }

            toast.success("Profile Updated Successfully");

        } catch (err) {

            toast.error("Something Wrong. Please try again later!");

        }

    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
    
        if (!file) return;
    
        const formData = new FormData();
    
        formData.append("avatar", file);
        formData.append("userId", userId);
    
        try {
            setUploading(true);
    
            const res = await API.post(
                "/users/upload-avatar",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
    
            setUser(prev => ({
                ...prev,
                avatar: res.data.avatar,
            }));
    
            // fetchUser();
    
        } catch (err) {
            toast.error(
                err.response?.data?.message || "File upload failed"
            );
        } finally {
            setUploading(false);
        }
    };
    

    useEffect(() => {

        const handleClickOutside = (e) => {
    
            if (
                modalRef.current &&
                !modalRef.current.contains(e.target)
            ) {
    
                setShowLogoutModal(false);
    
            }
    
        };
    
        if (showLogoutModal) {
    
            document.addEventListener(
                "mousedown",
                handleClickOutside
            );
    
        }
    
        return () => {
    
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    
        };
    
    }, [showLogoutModal]);

    useEffect(() => {

        const handleEsc = (e) => {
    
            if (e.key === "Escape") {
    
                setShowLogoutModal(false);
    
            }
    
        };
    
        window.addEventListener("keydown", handleEsc);
    
        return () => {
    
            window.removeEventListener(
                "keydown",
                handleEsc
            );
    
        };
    
    }, []);

    const logout = async () => {

        try {
            const res = await API.post("/auth/logout");
    
            if (res.data.success) {
                toast.success(res.data.message);
    
                localStorage.clear();
    
                navigate("/");
            } else {
                toast.error(res.data.message);
            }
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Logout failed"
            );
        }
    
    };
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = async (chatId) => {
        try {
            await navigator.clipboard.writeText(chatId);

            setCopiedId(chatId);

            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
        } catch (err) {
            // console.error("Copy failed:", err);
            toast.error(
                err || "Copy failed!"
            );
        }
    };

    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    return (

        <div className="profile-page">

            <div className="profile-card">
                <div className="heading">
                <span className="back" onClick={() => navigate("/chat")}><FaHome /></span>

                <h2>My Profile</h2>
                </div>
                <div className="avatar-section">

                <img

src={
user?.avatar ||
`https://ui-avatars.com/api/?name=${user?.username}`
}

alt="avatar"

/>

<label className="upload-btn">

{uploading
    ? "Uploading..."
    : "Change Photo"}

<input
    type="file"
    accept="image/*"
    hidden
    onChange={handleAvatarUpload}
/>

</label>

                </div>

                <div className="input-group1">

                    <label><FaUser /> Name</label>

                    <input
                        name="username"
                        value={user?.username || ''}
                        onChange={handleChange}
                    />

                </div>

                <div className="input-group1">

    <label><FaIdBadge /> Your Chat ID</label>

    <div className="chat-id">

        <span>{user.chat_id}</span>

        <button onClick={() => handleCopy(user?.chat_id || '')} >
            {copiedId === user.chat_id ? (
                <FaCheck />
            ) : (
                <FaCopy />
            )}

        </button>

    </div>

</div>

                <div className="input-group1">

                    <label><FaPhoneAlt /> Phone</label>

                    <input
                        disabled
                        value={user?.phone || ''}
                    />

                </div>

                <div className="input-group1">

                    <label><FaInfoCircle /> About</label>

                    <textarea
                        rows="4"
                        name="about"
                        value={user?.about || ''}
                        onChange={handleChange}
                    />

                </div>

                <button
                    className="save-btn"
                    onClick={updateProfile}
                >
                    Save Changes
                </button>
                
                <button
    className="logout-btn"
    onClick={() => setShowLogoutModal(true)}
>
    <FaSignOutAlt />
    Logout
</button>


            </div>

            {
showLogoutModal && (

<div className="modal-overlay">

    <div
        className="logout-modal"
        ref={modalRef}
    >

        <button
            className="close-btn"
            onClick={() =>
                setShowLogoutModal(false)
            }
        >
            <FaTimes />
        </button>

        <h2>

            Logout

        </h2>

        <p>

            Are you sure you want to logout?

        </p>

        <div className="modal-buttons">

            <button
                className="yes-btn"
                onClick={logout}
            >
                Yes
            </button>

            <button
                className="no-btn"
                onClick={() =>
                    setShowLogoutModal(false)
                }
            >
                No
            </button>

        </div>

    </div>

</div>

)
}

        </div>

    );

}


export default Profile;