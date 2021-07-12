import io from "socket.io-client";
import store from "./store";
import {
  removeOfflineUser,
  addOnlineUser,
  setMessagesAsSeen
} from "./store/conversations";
import { processIncomingMessage } from "./store/utils/thunkCreators";

export default function socketInit() {
  const jwt = localStorage.getItem('messenger-token');

  if (!jwt) throw Error("User is not authenticated. Please log in or sign up.");

  const socket = io(window.location.origin, { auth: { token: jwt } });
  
  socket.on("connect", () => {
    console.log("connected to server");
  
    socket.on("add-online-user", (id) => {
      store.dispatch(addOnlineUser(id));
    });
  
    socket.on("remove-offline-user", (id) => {
      store.dispatch(removeOfflineUser(id));
    });
    
    socket.on("new-message", (data) => {
      store.dispatch(processIncomingMessage(data));
    });
  
    socket.on("messages-are-seen", (data) => {
      store.dispatch(setMessagesAsSeen(data));
    });
  });

  return socket;
}
