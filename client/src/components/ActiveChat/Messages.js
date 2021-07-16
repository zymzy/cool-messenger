import React from "react";
import { Box } from "@material-ui/core";
import { SenderBubble, OtherUserBubble } from "../ActiveChat";
import moment from "moment";

const Messages = (props) => {
  const { messages, otherUser, userId } = props;

  let lastSeenMsgId = -1;
  if (messages) {
    lastSeenMsgId = messages.reduce((accum, msg) => {
      if (msg.senderId === userId && msg.isRead === true && msg.id > accum) return msg.id;
      return accum;
    }, -1)
  }

  return (
    <Box>
      {messages.map((message) => {
        const time = moment(message.createdAt).format("h:mm");

        return message.senderId === userId ? (
          <SenderBubble 
            key={message.id} 
            text={message.text} 
            time={time} 
            otherUser={otherUser} 
            lastSeen={message.id === lastSeenMsgId} 
          />
        ) : (
          <OtherUserBubble key={message.id} text={message.text} time={time} otherUser={otherUser} />
        );
      })}
    </Box>
  );
};

export default Messages;
