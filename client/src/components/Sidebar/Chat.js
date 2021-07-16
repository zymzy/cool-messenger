import React, { Component } from "react";
import { Box, Badge } from "@material-ui/core";
import { BadgeAvatar, ChatContent } from "../Sidebar";
import { withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";

import { setActiveChat } from "../../store/activeConversation";
import { syncSeenMessages } from "../../store/utils/thunkCreators";

const styles = {
  root: {
    borderRadius: 8,
    height: 80,
    boxShadow: "0 2px 10px 0 rgba(88,133,196,0.05)",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    "&:hover": {
      cursor: "grab",
    }
  },
  badge: {
    fontWeight: "bold",
    marginRight: 30,
  },
  badgeRoot: {
    width: "20px"
  }
};

class Chat extends Component {
  handleClick = async (conversation) => {
    const otherUserId = conversation.otherUser.id;
    const seenMessageIds = [];
    conversation.messages.forEach(msg => {
      if (msg.isRead === false && msg.senderId === otherUserId) seenMessageIds.push(msg.id);
    });

    this.props.syncSeenMessages(conversation.id, seenMessageIds);
    await this.props.setActiveChat(conversation.otherUser.username);
  };

  render() {
    const { classes } = this.props;
    const otherUser = this.props.conversation.otherUser;
    return (
      <Box
        onClick={() => this.handleClick(this.props.conversation)}
        className={classes.root}
      >
        <BadgeAvatar
          photoUrl={otherUser.photoUrl}
          username={otherUser.username}
          online={otherUser.online}
          sidebar={true}
        />
        <ChatContent conversation={this.props.conversation} hasUnreadMsg={this.props.conversation.unreadCount > 0} />
        <Badge badgeContent={this.props.conversation.unreadCount} color="primary" classes={{ badge: classes.badge, root: classes.badgeRoot}} />
      </Box>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setActiveChat: (id) => {
      dispatch(setActiveChat(id));
    },
    syncSeenMessages: (convoId, messageIds) => {
      dispatch(syncSeenMessages(convoId, messageIds));
    }
  };
};

export default connect(null, mapDispatchToProps)(withStyles(styles)(Chat));
