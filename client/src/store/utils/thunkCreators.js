import axios from "axios";
import socketInit from "../../socket";
import {
  gotConversations,
  addConversation,
  setNewMessage,
  setSearchedUsers,
  incrementUnreadBadge,
  clearUnreadBadge
} from "../conversations";
import { gotUser, setFetchingStatus } from "../user";

axios.interceptors.request.use(async function (config) {
  const token = await localStorage.getItem("messenger-token");
  config.headers["x-access-token"] = token;

  return config;
});

let socket;

// USER THUNK CREATORS

export const fetchUser = () => async (dispatch) => {
  dispatch(setFetchingStatus(true));
  try {
    const { data } = await axios.get("/auth/user");
    if (!socket) socket = socketInit(); // if not already initialized, initializes the client socket
    dispatch(gotUser(data));
    if (data.id) {
      socket.emit("go-online", data.id);
    }
  } catch (error) {
    console.error(error);
  } finally {
    dispatch(setFetchingStatus(false));
  }
};

export const register = (credentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/auth/register", credentials);
    await localStorage.setItem("messenger-token", data.token);
    socket = socketInit(); // initializes the client socket
    dispatch(gotUser(data));
    socket.emit("go-online", data.id);
  } catch (error) {
    console.error(error);
    dispatch(gotUser({ error: error.response.data.error || "Server Error" }));
  }
};

export const login = (credentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/auth/login", credentials);
    await localStorage.setItem("messenger-token", data.token);
    socket = socketInit(); // initializes the client socket
    dispatch(gotUser(data));
    socket.emit("go-online", data.id);
  } catch (error) {
    console.error(error);
    dispatch(gotUser({ error: error.response.data.error || "Server Error" }));
  }
};

export const logout = (id) => async (dispatch) => {
  try {
    await axios.delete("/auth/logout");
    await localStorage.removeItem("messenger-token");
    dispatch(gotUser({}));
    socket.emit("logout", id);
  } catch (error) {
    console.error(error);
  }
};

// CONVERSATIONS THUNK CREATORS

export const fetchConversations = () => async (dispatch) => {
  try {
    const { data } = await axios.get("/api/conversations");
    dispatch(gotConversations(data));
  } catch (error) {
    console.error(error);
  }
};

const saveMessage = async (body) => {
  const { data } = await axios.post("/api/messages", body);
  return data;
};

const sendMessage = (data, body) => {
  socket.emit("new-message", {
    message: data.message,
    recipientId: body.recipientId,
    sender: data.sender,
  });
};

// message format to send: {recipientId, text, conversationId}
// conversationId will be set to null if its a brand new conversation
export const postMessage = (body) => async (dispatch) => {
  try {
    const data = await saveMessage(body);

    if (!body.conversationId) {
      dispatch(addConversation(body.recipientId, data.message));
    } else {
      dispatch(setNewMessage(data.message));
    }

    sendMessage(data, body);
  } catch (error) {
    console.error(error);
  }
};

export const searchUsers = (searchTerm) => async (dispatch) => {
  try {
    const { data } = await axios.get(`/api/users/${searchTerm}`);
    dispatch(setSearchedUsers(data));
  } catch (error) {
    console.error(error);
  }
};

export const syncSeenMessages = (convoId, messageIds) => async (dispatch) => {
  dispatch(clearUnreadBadge(convoId));
  try {
    if (messageIds.length !== 0)
      await axios.patch('/api/messages/seen', { convoId, messageIds, socketId: socket.id });
  } catch (error) {
    console.error(error);
  }
}

export const processIncomingMessage = (data) => async (dispatch, getState) => {
  dispatch(setNewMessage(data.message, data.sender));

  const activeConvoOtherUser = getState().activeConversation;

  if (activeConvoOtherUser === "") dispatch(incrementUnreadBadge(data.message.conversationId));
  else {
    const activeConvoOtherUserId = getState().conversations.find(convo => convo.otherUser.username === activeConvoOtherUser).otherUser.id;
    const senderId = data.message.senderId;

    if (senderId !== activeConvoOtherUserId) {
      dispatch(incrementUnreadBadge(data.message.conversationId));
    } else {
      dispatch(syncSeenMessages(data.message.conversationId, [data.message.id]));
    }
  }
}
