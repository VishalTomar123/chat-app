import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import socket from "../socket";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import ImageViewer from "../components/ImageViewer";
import DeleteMessageModal from "../components/DeleteMessageModal";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaPaperPlane,
  FaPaperclip,
  FaTrash,
} from "react-icons/fa";
import { BsChatHeart } from "react-icons/bs";

function formatLastSeen(lastSeen) {
  const date = new Date(lastSeen);
  const now = new Date();

  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (diffMin < 1) {
    return "just now";
  }

  if (diffMin < 60) {
    return `${diffMin} min ago`;
  }

  if (diffHours < 24 && date.toDateString() === now.toDateString()) {
    return `today at ${time}`;
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return `yesterday at ${time}`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString() + ` at ${time}`;
}
function Chat() {

const currentUserId = Number(localStorage.getItem("userId"));
const [users, setUsers] = useState([]);
const [selectedUser, setSelectedUser] = useState(null);

const [messages, setMessages] = useState([]);

const [newMessage, setNewMessage] = useState("");

const [onlineUsers, setOnlineUsers] = useState([]);

const [typing, setTyping] = useState(false);

const { user } = useUser();

const messagesEndRef = useRef(null);
const navigate = useNavigate();

const fileInputRef = useRef(null);

const [selectedFile, setSelectedFile] = useState(null);

const [previewURL, setPreviewURL] = useState("");

const [uploadingFile, setUploadingFile] = useState(false);
const [viewerImage, setViewerImage] = useState(null);

const [deleteModal,setDeleteModal]=useState(false);

const [selectedMessage,setSelectedMessage]=useState(null);

const [contextMenu, setContextMenu] = useState(false);
const [contextPosition, setContextPosition] = useState({
  x: 0,
  y: 0,
});

const [searchId, setSearchId] = useState("");

const [searchResult, setSearchResult] = useState(null);

const [searchLoading, setSearchLoading] = useState(false);
const [requests,setRequests]=useState([]);
const [showRequests, setShowRequests] = useState(false);
const [showRemoveModal, setShowRemoveModal] = useState(false);
const [showClearChatModal, setShowClearChatModal] = useState(false);
const [showSidebar, setShowSidebar] = useState(true);

const openChat = (user) => {

  setSelectedUser(user);

  if (window.innerWidth <= 768) {

      setShowSidebar(false);

  }

};

const loadRequests=async()=>{

  const res=await API.get(
  
  `/connections/requests/${currentUserId}`
  
  );
  
  setRequests(res.data);
  
  };

  useEffect(()=>{

    loadRequests();
    
    },[]);

const searchUser = async () => {

  if (!searchId.trim()) return;

  try {

      setSearchLoading(true);

      const res = await API.get(

          `/users/search?chatId=${searchId}&userId=${currentUserId}`

      );

      setSearchResult(res.data);

  } catch (err) {

    toast.error("Something Wrong. Please try again later!" );

  } finally {

      setSearchLoading(false);

  }

};


const openFilePicker = () => {
    fileInputRef.current.click();
};

const [replyMessage, setReplyMessage] =
useState(null);

const handleFileChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith("image")) {

        setPreviewURL(
            URL.createObjectURL(file)
        );

    } else {

        setPreviewURL("");

    }

};
const sendSelectedFile = async () => {

    if (!selectedFile) return;

    await uploadFile(selectedFile);

};
const cancelFile = () => {

    setSelectedFile(null);

    setPreviewURL("");

};

const uploadFile = async (file) => {

    try {

        setUploadingFile(true);

        const formData = new FormData();

        formData.append("file", file);

        formData.append(
            "sender_id",
            currentUserId
        );

        formData.append(
            "receiver_id",
            selectedUser.id
        );
      
        const res = await API.post(
            "/messages/upload",
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
            }
        );

        setMessages(prev => [
            ...prev,
            res.data,
        ]);

        setSelectedFile(null);

setPreviewURL("");

fileInputRef.current.value = "";

        socket.emit(
            "sendMessage",
            res.data
        );

    } catch (err) {

      toast.error(
        err.response?.data?.message || "File upload failed"
    );

    } finally {

        setUploadingFile(false);

        setSelectedFile(null);

    }

};

const fetchUsers = async () => {
    try {
  
      const res = await API.get(
        `/users?userId=${currentUserId}`
      );
  
      setUsers(res.data);
  
    } catch (err) {
      // console.log(err);
      toast.error("Something Wrong. Please try again later!" );
    }
  };
  const loadMessages = async () => {

    if (!selectedUser) return;
  
    try {
  
      const res = await API.get(
        `/messages/${currentUserId}/${selectedUser.id}`
      );
  
      setMessages(res.data);
  
    } catch (err) {
  
      // console.log(err);
      toast.error("Something Wrong. Please try again later!" );
    }
  
  };

  useEffect(() => {

    fetchUsers();
  
    socket.emit("join", currentUserId);
  
  }, []);

  useEffect(() => {

    if (!selectedUser) return;
  
    loadMessages();
  
    API.post("/messages/mark-read", {
  
      sender_id: selectedUser.id,
  
      receiver_id: currentUserId,
  
    });

    setUsers(prev =>
        prev.map(user =>
          user.id === selectedUser.id
            ? {
                ...user,
                unread: 0
              }
            : user
        )
      );
  
  }, [selectedUser]);

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
  
      behavior: "smooth",
  
    });
  
  }, [messages]);

  useEffect(() => {

    socket.on("onlineUsers", (users) => {
  
      setOnlineUsers(users);
  
    });
  
    return () => {
  
      socket.off("onlineUsers");
  
    };
  
  }, []);

  useEffect(() => {

    socket.on("userTyping", () => {
  
      setTyping(true);
  
      setTimeout(() => {
  
        setTyping(false);
  
      }, 1500);
  
    });
  
    return () => {
  
      socket.off("userTyping");
  
    };
  
  }, []);

  useEffect(() => {

    socket.on("receiveMessage", async (message) => {
    if (Number(message.sender_id) === Number(currentUserId)) {
            return;
        }
  
      if (
        Number(message.sender_id) === selectedUser?.id
      ) {
  
        // setMessages(prev => [...prev, message]);
        setMessages(prev => {

          if (prev.some(m => Number(m.id) === Number(message.id))) {
              return prev;
          }
      
          return [...prev, message];
      
      });
  
      }
      
      if (
        selectedUser &&
        Number(selectedUser.id) === Number(message.sender_id)
    ) {

        await API.post("/messages/mark-read", {
            sender_id: message.sender_id,
            receiver_id: currentUserId,
        });

    }
  
    });
  
    return () => {
  
      socket.off("receiveMessage");
  
    };
  
  }, [selectedUser]);

  const sendMessage = async () => {

    if (!newMessage.trim() || !selectedUser) return;
  
    const tempId = Date.now();
  
    const tempMessage = {
      id: tempId,
      tempId,
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      message: newMessage,
      status: "SENT",
      created_at: new Date().toISOString(),
    };
  
    // Instant UI
    setMessages(prev => [...prev, tempMessage]);
  
    // Store before clearing
    const messageText = newMessage;
    const replyId = replyMessage?.id || null;
  
    setNewMessage("");

    setReplyMessage(null);
  
    try {
  
      // Save in database
      const res = await API.post("/messages/send",{

        sender_id:currentUserId,
        
        receiver_id:selectedUser.id,
        
        message:messageText,
        
        reply_to:replyId
        
        });
        setMessages(prev =>
            prev.map(msg =>
                msg.tempId === tempId
                    ? res.data
                    : msg
            )
        );
    
    // socket.emit("sendMessage", {
    
    //     id: res.data.messageId,
    
    //     sender_id: currentUserId,
    
    //     receiver_id: selectedUser.id,
    
    //     message: messageText,
    
    //     created_at: new Date(),
    
    // });
    socket.emit("sendMessage", res.data);
  
    } catch (err) {
  
      // console.log(err);
      toast.error("Something Wrong. Please try again later!" );
  
    }
  
  };
  useEffect(() => {

    socket.on("messageDelivered", ({ tempId }) => {
  
      setMessages(prev =>
  
        prev.map(msg =>
  
          msg.tempId === tempId
  
            ? {
                ...msg,
                status: "DELIVERED",
              }
  
            : msg
  
        )
  
      );
  
    });
  
    return () => {
  
      socket.off("messageDelivered");
  
    };
  
  }, []);

  useEffect(() => {

    socket.on("messageSeen", ({ sender_id }) => {
  
      setMessages(prev =>
  
        prev.map(msg =>
  
          Number(msg.sender_id) === Number(currentUserId)
  
            ? {
                ...msg,
                status: "SEEN",
              }
  
            : msg
  
        )
  
      );
  
    });
  
    return () => {
  
      socket.off("messageSeen");
  
    };
  
  }, []);

  useEffect(() => {

    const handleUnread = ({ sender_id }) => {
  
      if (
        selectedUser &&
        Number(selectedUser.id) === Number(sender_id)
      ) {
        return;
      }
  
      setUsers(prev =>
        prev.map(user =>
          user.id === Number(sender_id)
            ? {
                ...user,
                unread: (user.unread || 0) + 1
              }
            : user
        )
      );
    };
  
    socket.on("newUnread", handleUnread);
  
    return () => {
      socket.off("newUnread", handleUnread);
    };
  
  }, [selectedUser]);

  const deleteMessage = async (type) => {

    try {

        await API.put("/messages/delete", {

            messageId: selectedMessage.id,

            userId: currentUserId,

            type,

        });

        if (type === "me") {

            setMessages(prev =>
                prev.filter(
                    m => m.id !== selectedMessage.id
                )
            );

        } else {

            socket.emit("deleteMessage", {

                receiver_id: selectedMessage.receiver_id,

                messageId: selectedMessage.id,

            });

            setMessages(prev =>
                prev.map(m =>
                    m.id === selectedMessage.id
                        ? {
                              ...m,
                              deleted_for_everyone: 1,
                              message:
                                  "This message was deleted.",
                          }
                        : m
                )
            );

        }

        setDeleteModal(false);

    } catch (err) {

        // console.log(err);
        toast.error("Something Wrong. Please try again later!" );

    }

};
useEffect(() => {

    socket.on("messageDeleted", (data) => {

        setMessages(prev =>

            prev.map(msg =>

                msg.id === data.messageId

                    ? {

                          ...msg,

                          deleted_for_everyone: 1,

                          message:
                              "This message was deleted.",

                      }

                    : msg

            )

        );

    });

    return () => {

        socket.off("messageDeleted");

    };

}, []);

useEffect(() => {

    const close = () => {

        setContextMenu(false);

    };

    window.addEventListener("click", close);

    return () => {

        window.removeEventListener("click", close);

    };

}, []);

const sendConnectionRequest = async () => {

  try {

      const res = await API.post(

          "/connections/send",

          {

              sender_id: currentUserId,

              receiver_id:
                  searchResult.id,

          }

      );

      if (res.data.success) {

        toast.success(
              "Connection Request Sent"
          );


      }

      else {

        toast.error(
              res.data.message
          );

      }
  }

  catch (err) {

    toast.error("Something Wrong. Please try again later!" );

  }

};

const acceptRequest = async (id) => {

  await API.post(

      "/connections/accept",
      {
          requestId: id
      }

  );
  loadRequests();
  fetchUsers();
};

const rejectRequest = async (id) => {

  await API.post(

      "/connections/reject",

      {
          requestId: id
      }

  );

  loadRequests();

};

useEffect(()=>{

  socket.on(
  
  "requestAccepted",
  
  ()=>{
  
    fetchUsers();
  
  loadRequests();
  
  }
  
  );
  
  return ()=>{
  
  socket.off(
  "requestAccepted"
  );
  
  }
  
  },[]);

  useEffect(()=>{

    socket.on(
    
    "newConnectionRequest",
    
    ()=>{
    
    loadRequests();
    
    }
    
    );
    
    return ()=>{
    
    socket.off(
    "newConnectionRequest"
    );
    
    }
    
    },[]);

    const removeConnection = async () => {

      try{
  
          await API.post(
  
              "/connections/remove",
  
              {
                  userId:currentUserId,
                  friendId:selectedUser.id
              }
  
          );
  
          setShowRemoveModal(false);  
          setSelectedUser(null);
          fetchUsers();
  
      }
  
      catch(err){
  
        toast.error("Something Wrong. Please try again later!" );
  
      }
  
  };
  useEffect(()=>{

    socket.on(

        "connectionRemoved",

        ()=>{

            fetchUsers();

            if(selectedUser){

                setSelectedUser(null);

            }

        }

    );

    return()=>{

        socket.off(
            "connectionRemoved"
        );

    };

},[selectedUser]);

const clearChat = async () => {

  try {

      await API.post(
          "/messages/clear-chat",
          {
              userId: currentUserId,
              friendId: selectedUser.id
          }
      );

      setMessages([]);

      setShowClearChatModal(false);

  } catch (err) {

    toast.error("Something Wrong. Please try again later!" );

  }

};

const searchCardRef = useRef(null);

useEffect(() => {

  const handleClickOutside = (e) => {

      if (
          searchCardRef.current &&
          !searchCardRef.current.contains(e.target)
      ) {

          setSearchResult(null);
          setSearchId("");

      }

  };

  document.addEventListener(
      "mousedown",
      handleClickOutside
  );

  return () => {

      document.removeEventListener(
          "mousedown",
          handleClickOutside
      );

  };

}, []);

const handleConnect = async () => {
  await sendConnectionRequest();
  await searchUser();
};
const handleAccept = async () => {
  await acceptRequest(searchResult.connection_id);
  await searchUser();
};
const handleReject = async () => {
  await rejectRequest(searchResult.connection_id);
  await searchUser();
};

    return (
      <div className="chat-container">
  
        {/* Sidebar */}
        <div className={`sidebar ${showSidebar ? "show" : ""}`}>
        
          <div className="sidebar-header">
            <div className="header">
            <h2>Chats</h2>
            <div className="current-user" onClick={() => navigate("/profile")}>

        <img
            src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.username}`
            }
            alt=""
            className="current-avatar"
        />
      
        </div>
        </div>
        <div
    className="search-wrapper"
    ref={searchCardRef}
>
            <div className="search-box">
            <FaSearch />
              <input
                type="text"
                placeholder="Search users..."
                value={searchId}
                onChange={(e)=>setSearchId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                      searchUser();
                  }
              }}
              />
              {/* <button onClick={searchUser}>
              Search
              </button> */}
            </div>
          
          {

searchLoading ?

<p>Searching...</p>

:

searchResult && (

<div className="search-card">

    <img

        src={
            searchResult.avatar ||
            `https://ui-avatars.com/api/?name=${searchResult.username}`
        }

    />

    <div>

        <h4>{searchResult.username}</h4>

        <small>{searchResult.chat_id}</small>

    </div>

    {
(
  !searchResult.connection_id ||
  searchResult.status === "REJECTED"
) && (

<button
onClick={handleConnect}
>

Connect

</button>

)
}
{
searchResult.status==="PENDING"

&&

Number(searchResult.sender_id)===Number(currentUserId)

&&

<button disabled>

Request Sent

</button>

}
{
searchResult.status==="PENDING" && Number(searchResult.receiver_id)===Number(currentUserId) &&
<div style={{display:'flex', gap:'5px'}}>
<button 
className="accept-btn"
onClick={handleAccept}
>
Accept

</button>
<button
                        className="reject-btn"
                        onClick={handleReject}
                          
                    >
                        Reject
                    </button>
</div>

}
{
searchResult.status==="ACCEPTED"

&&

<button

onClick={()=>{

// setSelectedUser(searchResult);
openChat(searchResult);

setSearchResult(null);

setSearchId("");

}}

>

Open Chat

</button>

}

</div>

)
}
{searchResult === null && searchId && !searchLoading && (
    <p>No user found.</p>
)}
</div>
</div>
          <div className="users-list">

{users.map((user) => (

  <div
    key={user.id}
    className={`user-item ${
      selectedUser?.id === user.id
        ? "active"
        : ""
    }`}
    onClick={() => {openChat(user)}}
  >

    <img
      src={
        user.avatar ||
        `https://ui-avatars.com/api/?background=random&name=${user.username}`
      }
      alt=""
    />

    <div className="user-info">

      <h4>

        {user.username}

        {onlineUsers.includes(
          String(user.id)
        ) && (
          <span className="online-dot"></span>
        )}

      </h4>

      {/* <small>

        {user.unread > 0
          ? `${user.unread} new messages`
          : user.last_message || ""}

      </small> */}

    </div>

    {user.unread > 0 && (

      <span className="badge">

        {user.unread}

      </span>

    )}

  </div>

))}

</div>
<div
    className="requests-header"
    onClick={() =>
        setShowRequests(!showRequests)
    }
>

    <h3>

        {showRequests ? "▲" : "▼"} Requests ({requests.length})

    </h3>



{
showRequests && (

<div className="requests-list">

    {requests.length === 0 ? (

        <p className="no-request">

            No Requests

        </p>

    ) : (

        requests.map(req => (

            <div
                key={req.id}
                className="request-card"
            >

                <img
                    src={
                        req.avatar ||
                        `https://ui-avatars.com/api/?name=${req.username}`
                    }
                    alt=""
                />

                <div className="request-info">

                    <h4>{req.username}</h4>

                    <small>{req.chat_id}</small>

                </div>

                <div className="request-actions">

                    <button
                        className="accept-btn"
                        onClick={()=>
                          acceptRequest(req.id)
                          }
                    >
                        Accept
                    </button>

                    <button
                        className="reject-btn"
                        onClick={()=>
                          rejectRequest(req.id)
                          }
                    >
                        Reject
                    </button>

                </div>

            </div>

        ))

    )}

</div>


)}
</div>
        </div>
  
        {/* Chat Section */}
        <div className={`chat-section ${!showSidebar ? "show" : ""}`}>
  
          {/* <div className="chat-header">
            <img
               src={`https://ui-avatars.com/api/?name=${
                selectedUser?.username || "User"
              }`}
            />
  
            <div>
              <h3>{selectedUser?.username || "Select User"}</h3>
              <span>
                 {typing
                  ? "Typing..."
                  : onlineUsers.includes(String(selectedUser?.id))
                    ? "Online"
                    :  selectedUser?.last_seen
                      ? `last seen ${formatLastSeen(selectedUser.last_seen)}`
                      : ""}
              </span>
            </div>
          </div> */}
{selectedUser && (
<div className="chat-header">
<button
className="mobile-back"
onClick={() => setShowSidebar(true)}
>
←
</button>

{selectedUser ? (
  <>
    <img
      src={
        selectedUser.avatar ||
        `https://ui-avatars.com/api/?background=random&name=${selectedUser.username}`
      }
      alt=""
    />

    <div className="chat-user-info">
      <h3>{selectedUser.username}</h3>

      <span>
        {typing
          ? "Typing..."
          : onlineUsers.includes(String(selectedUser.id))
          ? "Online"
          : selectedUser.last_seen
          ? `Last seen ${formatLastSeen(selectedUser.last_seen)}`
          : ""}
      </span>
    </div>
  </>
) : (
  <h3>Select a user</h3>
)}
<div className="button-menu">
<button

onClick={()=>{

setShowRemoveModal(true);

}}

>

Remove

</button>
<button
onClick={()=>{
setShowClearChatModal(true);
}}
>
<FaTrash /> Chat
</button> 
</div>

</div>
)}
{

showRemoveModal && (

<div

className="modal-overlay"

onClick={()=>setShowRemoveModal(false)}

>

<div

className="modal"

onClick={(e)=>e.stopPropagation()}

>

<h3>

Remove Connection

</h3>

<p>

Are you sure you want to remove this connection?

</p>

<div className="modal-buttons">

<button

onClick={removeConnection}
className="red"

>

Yes

</button>

<button
className="green"
onClick={()=>setShowRemoveModal(false)}

>

No

</button>

</div>

<button

className="close-btn"
style={{color:'black'}}
onClick={()=>setShowRemoveModal(false)}

>

✕

</button>

</div>

</div>

)
}
{
showClearChatModal && (

<div
className="modal-overlay"
onClick={() => setShowClearChatModal(false)}
>

<div
className="modal"
onClick={(e)=>e.stopPropagation()}
>

<button
className="close-btn" style={{color:'black'}}
onClick={() => setShowClearChatModal(false)}
>
✕
</button>

<h3>
Clear Chat
</h3>

<p>
All messages will be removed only for you.
</p>

<div className="modal-buttons">

<button
className="red"
onClick={clearChat}
>
Yes
</button>

<button
className="green"
onClick={() => setShowClearChatModal(false)}
>
No
</button>

</div>

</div>

</div>

)
}

  
          {/* Messages */}
  
<div className="messages">

{
messages.length === 0 && (

<div className="empty-chat">

    <div className="empty-chat-card">

        <div className="empty-chat-icon">

            💬

        </div>

        <h2>

            No Messages Yet

        </h2>

        <p>

            Start a conversation

        </p>

        <span>

            Send your first message, image or file and begin chatting instantly.

        </span>
        <div className="empty-chat-icon">

        <BsChatHeart/>
        
        </div>

    </div>

</div>

)
}

{messages.map((msg) => (

  <div
    key={msg.id || msg.tempId}
    className={
      Number(msg.sender_id) === currentUserId
        ? "message sent"
        : "message received"
    }
    onContextMenu={(e) => {
        e.preventDefault();
    
        setSelectedMessage(msg);
    
        setContextPosition({
            x: e.clientX - 90,
            y: e.clientY + 20,
        });
    
        setContextMenu(true);
    }}
  >

{
msg.file ? (

    msg.file_type?.startsWith("image") ? (

        <img
            src={`http://localhost:5000${msg.file}`}
            className="chat-image"
            onClick={() =>
                setViewerImage(
                    `http://localhost:5000${msg.file}`
                )
            }
        />

    ) : (

        <a
            href={`http://localhost:5000${msg.file}`}
            target="_blank"
            rel="noreferrer"
        >
            📄 {msg.file_name}
        </a>

    )

) : msg.deleted_for_everyone ? (

    <i
        style={{
            color: "#888",
            fontStyle: "italic",
        }}
    >
        🚫 This message was deleted
    </i>

) : (

    <>

        {msg.reply_to && (

            <div className="reply-box">

                <strong>
                    {Number(msg.reply_sender) === Number(currentUserId)
                        ? "You"
                        : selectedUser.username}
                </strong>

                <p>
                    {msg.reply_file
                        ? "📷 Image"
                        : msg.reply_message}
                </p>

            </div>

        )}

        <p>{msg.message}</p>

    </>

)
                    }

    <div className="message-meta">

      <small>
        {msg.created_at
          ? new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""}
      </small>

      {Number(msg.sender_id) === currentUserId && (

        <small
          className={`status ${msg.status}`}
        >
          {msg.status === "SENT" && "✓"}

          {msg.status === "DELIVERED" && "✓✓"}

          {msg.status === "SEEN" && "✓✓"}
        </small>

      )}

    </div>

  </div>

))}

<div ref={messagesEndRef}></div>


</div>
  
          {/* Input */}
          {
replyMessage && (

<div className="reply-preview">

<div>

<strong>

Replying to

</strong>

<p>

{

replyMessage.file

?

"📷 Image"

:

replyMessage.message

}

</p>

</div>

<button

onClick={()=>

setReplyMessage(null)

}

>

✕

</button>

</div>

)
}
          {
selectedFile && (

<div className="file-preview">

    {

    previewURL ?

    (

    <img
        src={previewURL}
        className="preview-image"
    />

    )

    :

    (

    <div className="file-box">

        📄

        <span>

            {selectedFile.name}

        </span>

    </div>

    )

    }

    <div className="preview-buttons">

        <button
            className="cancel-upload"
            onClick={cancelFile}
        >

            ✕

        </button>

        <button
            className="send-upload"
            onClick={sendSelectedFile}
        >

            ➤

        </button>

    </div>

</div>

)
}
{selectedUser && ( 
          <div className="message-input">
          <button
    onClick={openFilePicker}
    className="attach-btn"
>
    <FaPaperclip />
</button>
{
uploadingFile && (

<div className="uploading">

Uploading file...

</div>

)

}
<input
    ref={fileInputRef}
    type="file"
    hidden
    onChange={handleFileChange}
/>

  <input
    type="text"
    value={newMessage}
    placeholder="Type a message..."

    onChange={(e) => {

      setNewMessage(e.target.value);

      if (selectedUser) {
        socket.emit("typing", {
          sender: currentUserId,
          receiver: selectedUser.id,
        });
      }

    }}

    onKeyDown={(e) => {

      if (e.key === "Enter") {

        sendMessage();

      }

    }}

  />

  <button
    onClick={sendMessage}
  >
    <FaPaperPlane />
  </button>

</div>
)}
  
        </div>
        <ImageViewer
    image={viewerImage}
    onClose={() => setViewerImage(null)}
/>

<DeleteMessageModal

open={deleteModal}

onClose={()=>setDeleteModal(false)}

isSender={
selectedMessage?.sender_id==
currentUserId
}

onDeleteMe={()=>
deleteMessage("me")
}

onDeleteEveryone={()=>
deleteMessage("everyone")
}

/>
{contextMenu && (

<div
    className="context-menu"
    style={{
        top: contextPosition.y,
        left: contextPosition.x,
    }}
>

    <div
        onClick={() => {

            setReplyMessage(selectedMessage);

            setContextMenu(false);

        }}
    >
        🗨 Reply
    </div>

    <div
        onClick={() => {

            setDeleteModal(true);

            setContextMenu(false);

        }}
    >
        🗑 Delete
    </div>

    <div
        onClick={() => {

            navigator.clipboard.writeText(
                selectedMessage.message || ""
            );

            setContextMenu(false);

        }}
    >
        📋 Copy
    </div>

</div>

)}
  
      </div>
    );
  }
  
  export default Chat;