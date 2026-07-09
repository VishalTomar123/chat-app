import { useEffect, useState } from "react";
import API from "../services/api";
import {
    FaSearch,
    FaPaperPlane,
    FaCircle,
  } from "react-icons/fa";

import socket from "../socket";
import { useRef } from "react";
  
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
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const currentUserId = localStorage.getItem("userId");
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typing, setTyping] = useState(false);

    useEffect(() => {

      socket.on("userTyping", () => {
    
        setTyping(true);
    
        setTimeout(() => {
          setTyping(false);
        }, 2000);
    
      });

      return () => {
        socket.off("userTyping");
      };
      
    }, []);

    

    useEffect(() => {

      socket.on("onlineUsers", (users) => {
        setOnlineUsers(users);
      });
    
      return () => {
        socket.off("onlineUsers");
      };
    
    }, []);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, [messages]);

    useEffect(() => {
      fetchUsers();
    }, []);

    const fetchUsers = async () => {
      try {
        const res = await API.get(
          `/users?userId=${currentUserId}`
        );
    
        setUsers(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    useEffect(() => {
      if (selectedUser) {
        loadMessages();
      }
    }, [selectedUser]);
    
    const loadMessages = async () => {
      try {
        const res = await API.get(
          `/messages/${currentUserId}/${selectedUser.id}`
        );
    
        setMessages(res.data);
        console.log(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    const sendMessage = async () => {

      if (!newMessage.trim()) return;
    
      try {
    
        await API.post("/messages/send", {
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          message: newMessage,
        });
        socket.emit("sendMessage", {
          tempId,
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          message: newMessage,
        });

        const tempId = Date.now();

setMessages(prev => [
  ...prev,
  {
    id: tempId,
    tempId,
    sender_id: currentUserId,
    receiver_id: selectedUser.id,
    message: newMessage,
    status: "SENT",
    created_at: new Date().toISOString(),
  }
]);
    
        setNewMessage("");
    
        // loadMessages();
    
      } catch (error) {
        console.log(error);
      }
    };
    useEffect(() => {

      if (currentUserId) {
    
        socket.emit(
          "join",
          currentUserId
        );
    
      }
    
    }, []);

    useEffect(() => {

      socket.on(
        "receiveMessage",
        (messageData) => {
    
          setMessages((prev) => [
            ...prev,
            messageData,
          ]);
    
        }
      );
    
      return () => {
        socket.off("receiveMessage");
      };

      
    
    }, []);

    useEffect(() => {

      if (!selectedUser) return;
    
      API.post("/messages/mark-read", {
        sender_id: selectedUser.id,
        receiver_id: currentUserId,
      });
    
    }, [selectedUser]);

    useEffect(() => {

      socket.on(
        "messageDelivered",
        (data) => {
    
          setMessages(prev =>
            prev.map(msg =>
              msg.tempId === data.tempId
                ? {
                    ...msg,
                    status: "DELIVERED"
                  }
                : msg
            )
          );
    
        }
      );
    
      return () => {
        socket.off("messageDelivered");
      };
    
    }, []);

    useEffect(() => {

      socket.on("messageSeen", () => {

        setMessages(prev =>
          prev.map(msg =>
            msg.sender_id == currentUserId
              ? {
                  ...msg,
                  status: "SEEN"
                }
              : msg
          )
        );
      
      });
    
      return () => {
        socket.off("messageSeen");
      };
    
    }, []);

    return (
      <div className="chat-container">
  
        {/* Sidebar */}
        <div className="sidebar">
  
          <div className="sidebar-header">
            <h2>Chats</h2>
  
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search users..."
              />
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
                  onClick={() => {setSelectedUser(user);
                  
                    setUsers((prev) =>
                    prev.map((u) =>
                      u.id === user.id
                        ? { ...u, unread: 0 }
                        : u
                    )
                  );
                  }}
                >
                  <img
                    src={user.avatar??`https://ui-avatars.com/api/?name=${user.username}`}
                    alt=""
                  />

                  <div>
                    <h4>{user.username}</h4>
                    {/* <span>{user.phone}</span> */}
                  </div>
                  {user.unread > 0 && (
                      <div className="badge">
                        {user.unread}
                      </div>
                    )}
                </div>
              ))}
  
            {/* <div className="user-item">
              <img
                src="https://i.pravatar.cc/50?img=2"
                alt=""
              />
  
              <div>
                <h4>Aman</h4>
                <span>Last seen 2m ago</span>
              </div>
            </div> */}
  
          </div>
        </div>
  
        {/* Chat Section */}
        <div className="chat-section">
  
          <div className="chat-header">
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
          </div>
  
          {/* Messages */}
  
          <div className="messages">
  
            {/* <div className="message received">
              Hello 👋
            </div>
  
            <div className="message sent">
              Hi bro 😎
            </div>
  
            <div className="message received">
              How are you?
            </div> */}
      
          {messages.map((msg, index) => (
          
          <div
            key={index}
            className={
              msg.sender_id == currentUserId
                ? "message sent"
                : "message received"
            }
          >
           <p>{msg.message}</p>
            <small>
            {msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
            </small>
            {msg.sender_id == currentUserId && (
                        
            <small>
                        
              {msg.status === "SENT" && "✓"}
            
              {msg.status === "DELIVERED" && "✓✓"}
            
              {msg.status === "SEEN" && "👁"}
            
            </small>
            
            )}
          </div>

          ))}
          <div ref={messagesEndRef}></div>
          </div>
  
          {/* Input */}
  
          <div className="message-input">
  
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
              
                socket.emit("typing", {
                  sender: currentUserId,
                  receiver: selectedUser.id,
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
  
            <button onClick={sendMessage}>
              <FaPaperPlane />
            </button>
  
          </div>
  
        </div>
  
      </div>
    );
  }
  
  export default Chat;