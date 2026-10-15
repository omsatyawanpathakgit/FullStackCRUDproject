import React, {
  useEffect,
  useState
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../api";
import UserForm from "./UserForm";

import "../App.css";

function Users({ onLogout }) {

  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [messageDrafts, setMessageDrafts] = useState({});
  const [sendingMessageTo, setSendingMessageTo] = useState(null);

  useEffect(() => {

    getUsers();

  }, []);

  const getUsers = async () => {

    try {

      const response = await api.get("/users");

      setUsers(response.data);

    } catch (error) {

      console.log(
        "Get users error:",
        error
      );

      if (error.response?.status === 401) {

        localStorage.removeItem("token");

        onLogout();

        navigate("/");

      } else {

        setMessage(
          error.response?.data?.message ||
          "Failed to get users"
        );

      }

    }

  };

  const handleLogout = () => {

    onLogout();

    navigate("/");

  };

  const handleAddUser = () => {

    setEditingUser(null);

    setShowForm(true);

    setMessage("");

  };

  const handleEdit = (user) => {

    setEditingUser(user);

    setShowForm(true);

    setMessage("");

  };

  const handleUserSaved = () => {

    setShowForm(false);

    setEditingUser(null);

    setMessage("");

    getUsers();

  };

  const handleCancel = () => {

    setShowForm(false);

    setEditingUser(null);

    setMessage("");

  };

  const handleDelete = async (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this user?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await api.delete(
        `/users/${id}`
      );

      setMessage(
        "User deleted successfully"
      );

      getUsers();

    } catch (error) {

      console.log(
        "Delete error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
        "Failed to delete user"
      );

    }

  };

  const handleDownloadAssignment = async (user) => {
    try {
      const response = await api.get(
        `/users/${user._id}/assignment`,
        { responseType: "blob" }
      );
      const downloadUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = user.Assignment.originalName || "Assignment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to download assignment"
      );
    }
  };

  const handleUploadAssignment = async (user, file, input) => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("Assignment", file);

    try {
      await api.post(`/users/${user._id}/assignment`, formData);
      setMessage("Assignment uploaded successfully");
      await getUsers();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to upload assignment"
      );
    } finally {
      input.value = "";
    }
  };

  const handleUploadProfilePicture = async (user, file, input) => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      await api.post(`/users/${user._id}/profile-picture`, formData);
      setMessage("Profile picture uploaded successfully");
      await getUsers();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to upload profile picture"
      );
    } finally {
      input.value = "";
    }
  };

  const handleSendMessage = async (user) => {
    const userMessage = (messageDrafts[user._id] || "").trim();

    if (!userMessage) {
      setMessage("Enter a message before sending.");
      return;
    }

    setSendingMessageTo(user._id);
    setMessage("");

    try {
      const response = await api.post(`/users/${user._id}/message`, {
        message: userMessage
      });
      setMessage(response.data.message || "Message sent successfully.");
      setMessageDrafts((drafts) => ({
        ...drafts,
        [user._id]: ""
      }));
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to send the message."
      );
    } finally {
      setSendingMessageTo(null);
    }
  };

  return (

    <div className="dashboard">

      <div className="dashboard-container">

        {/* HEADER */}

        <div className="dashboard-header">

          <div className="dashboard-title">

            <h1>User Management</h1>

            <p>
              Manage your application users
            </p>

          </div>

          <div className="header-actions">

            <button
              className="btn btn-primary"
              onClick={handleAddUser}
            >
              + Add User
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </div>

        {/* FORM */}

        {showForm && (

          <UserForm
            user={editingUser}
            onUserSaved={handleUserSaved}
            onCancel={handleCancel}
          />

        )}

        {/* MESSAGE */}

        {message && (

          <div className="message">
            {message}
          </div>

        )}

        {/* TABLE */}

        <div className="table-card">

          <div className="table-header">

            <h2>
              All Users ({users.length})
            </h2>

          </div>

          <div className="table-wrapper">

            <table className="users-table">

              <thead>

                <tr>

                  <th>
                    Username
                  </th>

                  <th>
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Send Message
                  </th>

                  <th>
                    Phone Number
                  </th>

                  <th>
                    Profile Picture
                  </th>

                  <th>
                    Assignment
                  </th>

                  <th>
                    Password
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {users.length === 0 ? (

                  
                  <tr>

                    <td
                      colSpan="9"
                      style={{
                        textAlign: "center",
                        padding: "30px"
                      }}
                    >
                      No users found
                    </td>

                  </tr>

                ) : (

                  users.map((user) => (

                    <tr key={user._id}>

                      <td className="username">
                        {user.username}
                      </td>

                      <td>
                        {user.name}
                      </td>

                      <td className="email">
                        {user.email}
                      </td>

                      <td>
                        <div className="send-message-cell">
                          <input
                            type="text"
                            aria-label={`Message to ${user.email}`}
                            placeholder="Type a message"
                            value={messageDrafts[user._id] || ""}
                            maxLength={5000}
                            disabled={sendingMessageTo === user._id}
                            onChange={(event) =>
                              setMessageDrafts((drafts) => ({
                                ...drafts,
                                [user._id]: event.target.value
                              }))
                            }
                          />
                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={sendingMessageTo === user._id}
                            onClick={() => handleSendMessage(user)}
                          >
                            {sendingMessageTo === user._id ? "Sending..." : "Send"}
                          </button>
                        </div>
                      </td>

                      <td>
                        {user.PhoneNumber || "N/A"}
                      </td>

                      <td>
                        <div className="profile-picture-cell">
                          {user.profilePicture ? (
                            <img
                              className="profile-picture-thumbnail"
                              src={user.profilePicture}
                              alt={`${user.name}'s profile`}
                            />
                          ) : (
                            <span className="profile-picture-placeholder">
                              No picture
                            </span>
                          )}
                          <label className="btn btn-secondary assignment-upload-button">
                            {user.profilePicture ? "Change" : "Upload"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="assignment-file-input"
                              onChange={(event) =>
                                handleUploadProfilePicture(
                                  user,
                                  event.target.files[0],
                                  event.target
                                )
                              }
                            />
                          </label>
                        </div>
                      </td>

                      <td>
                        <div className="actions">
                          <label className="btn btn-secondary assignment-upload-button">
                            Upload
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                              className="assignment-file-input"
                              onChange={(event) =>
                                handleUploadAssignment(
                                  user,
                                  event.target.files[0],
                                  event.target
                                )
                              }
                            />
                          </label>
                          {user.Assignment?.filename && (
                            <>
                              <button
                                className="btn btn-secondary"
                                onClick={() =>
                                  handleDownloadAssignment(user)
                                }
                              >
                                Download
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        ********
                      </td>

                      <td>

                        <div className="actions">

                          <button
                            className="btn btn-edit"
                            onClick={() =>
                              handleEdit(user)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              handleDelete(
                                user._id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Users;