import React from "react";
import { Box, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { Search, Chat, CurrentUser } from "./index.js";

const useStyles = makeStyles(() => ({
  root: {
    paddingLeft: 21,
    paddingRight: 21,
    flexGrow: 1
  },
  title: {
    fontSize: 20,
    letterSpacing: -0.29,
    fontWeight: "bold",
    marginTop: 32,
    marginBottom: 15
  }
}));

const Sidebar = (props) => {
  const classes = useStyles();
  const conversations = props.conversations || [];
  const { handleChange, searchTerm } = props;

  return (
    <Box className={classes.root}>
      <CurrentUser />
      <Typography className={classes.title}>Chats</Typography>
      <Search handleChange={handleChange} />
      {conversations
        .filter((conversation) => conversation.otherUser.username.includes(searchTerm))
        .map((conversation) => {
          return <Chat conversation={conversation} key={conversation.otherUser.username} />;
        })}
    </Box>
  );
};

const mapStateToProps = (state) => {
  // Creates a copy of the 'conversations' state array where each member element has a 'latestMsgTime' property
  const _conversations = state.conversations.length ? state.conversations.map(convo => {
    convo.latestMsgTime = Date.parse(convo.messages[convo.messages.length - 1].createdAt);
    return convo
  }) : [];

  // Return the '_conversations' array sorted by the 'latestMsgTime'
  return {
    conversations: _conversations.length ? _conversations.sort((a, b) => b.latestMsgTime - a.latestMsgTime) : _conversations
  };
};

export default connect(mapStateToProps)(Sidebar);
