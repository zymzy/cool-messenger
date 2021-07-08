import io from "socket.io-client";
import store from "./store";
import {
  setNewMessage,
  removeOfflineUser,
  addOnlineUser,
  incrementUnreadBadge
} from "./store/conversations";

const socket = io(window.location.origin);

socket.on("connect", () => {
  console.log("connected to server");

  socket.on("add-online-user", (id) => {
    store.dispatch(addOnlineUser(id));
  });

  socket.on("remove-offline-user", (id) => {
    store.dispatch(removeOfflineUser(id));
  });
  
  socket.on("new-message", (data) => {
    const activeConvoOtherUser = store.getState().activeConversation;

    if (activeConvoOtherUser === "") store.dispatch(incrementUnreadBadge(data.message.conversationId));
    else {
      const activeConvoOtherUserId = store.getState().conversations.find(convo => convo.otherUser.username === activeConvoOtherUser).otherUser.id;
      const senderId = data.message.senderId;

      if (senderId !== activeConvoOtherUserId) {
        store.dispatch(incrementUnreadBadge(data.message.conversationId));
      }
    }

    store.dispatch(setNewMessage(data.message, data.sender));
  });
});

export default socket;
