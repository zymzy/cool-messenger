import io from "socket.io-client";
import store from "./store";
import {
  setNewMessage,
  removeOfflineUser,
  addOnlineUser,
  incrementUnreadBadge,
  setMessagesAsSeen
} from "./store/conversations";
import { syncSeenMessages } from "./store/utils/thunkCreators";

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
    store.dispatch(setNewMessage(data.message, data.sender));

    const activeConvoOtherUser = store.getState().activeConversation;

    if (activeConvoOtherUser === "") store.dispatch(incrementUnreadBadge(data.message.conversationId));
    else {
      const activeConvoOtherUserId = store.getState().conversations.find(convo => convo.otherUser.username === activeConvoOtherUser).otherUser.id;
      const senderId = data.message.senderId;

      if (senderId !== activeConvoOtherUserId) {
        store.dispatch(incrementUnreadBadge(data.message.conversationId));
      } else {
        store.dispatch(syncSeenMessages(data.message.conversationId, [data.message.id]));
      }
    }
  });

  socket.on("messages-are-seen", (data) => {
    store.dispatch(setMessagesAsSeen(data));
  });
});

export default socket;
