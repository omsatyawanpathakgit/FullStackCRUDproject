import React, { useEffect, useState } from "react";
import api from "../api";
import "../App.css";

function UserForm({
  user,
  onUserSaved,
  onCancel
}) {

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [PhoneNumber, setPhoneNumber] = useState("");
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {

    if (user) {

      setUsername(user.username);
      setName(user.name);
      setEmail(user.email);
      setPhoneNumber(user.PhoneNumber || "");
      setAssignmentFile(null);
      setPassword("");

    } else {

      setUsername("");
      setName("");
      setEmail("");
      setPhoneNumber("");
      setAssignmentFile(null);
      setPassword("");

    }

  }, [user]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("PhoneNumber", PhoneNumber);
      formData.append("password", password);
      if (assignmentFile) {
        formData.append("Assignment", assignmentFile);
      }

      if (user) {

        await api.put(`/users/${user._id}`, formData);

        setMessage(
          "User updated successfully"
        );

      } else {

        await api.post("/users", formData);

        setMessage(
          "User added successfully"
        );

      }

      onUserSaved();

    } catch (error) {

      setMessage(
        error.response?.data?.message ||
        "Failed to save user"
      );

    }
  };

  return (

    <div className="form-card">

      <h2>
        {user ? "Edit User" : "Add New User"}
      </h2>

      <form onSubmit={handleSubmit}>

        <div className="form-grid">

          <div className="form-group">

            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>Name</label>

            <input
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>Phone Number</label>

            <input
              type="tel"
              placeholder="Enter phone number"
              value={PhoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <label>Assignment</label>

            {user?.Assignment?.originalName && (
              <p>Current file: {user.Assignment.originalName}</p>
            )}

            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={(e) =>
                setAssignmentFile(e.target.files[0] || null)
              }
            />

          </div>

          <div className="form-group">

            <label>Password</label>

            <input
              type="password"
              placeholder={
                user
                  ? "Leave blank to keep current password"
                  : "Enter password"
              }
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required={!user}
            />

          </div>

        </div>

        <div className="form-actions">

          <button
            type="submit"
            className="btn btn-primary"
          >
            {user ? "Update User" : "Add User"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

        </div>

      </form>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

    </div>

  );
}

export default UserForm;