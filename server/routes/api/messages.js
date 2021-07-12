const router = require("express").Router();
const { Conversation, Message } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");
const { Op } = require("sequelize");

// expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;

    // if we already know conversation id, we can save time and just add it to message and return
    if (conversationId) {
      const conversation = await Conversation.findByPk(conversationId);

      // if the message sender is not a participant in the specified conversation, reject the request
      if (senderId != conversation.user1Id && senderId != conversation.user2Id)
        return res.status(403).json({ error: "This action is forbidden." });

      const message = await Message.create({ senderId, text, conversationId });
      return res.json({ message, sender });
    }
    // if we don't have conversation id, find a conversation to make sure it doesn't already exist
    let conversation = await Conversation.findConversation(
      senderId,
      recipientId
    );

    if (!conversation) {
      // create conversation
      conversation = await Conversation.create({
        user1Id: senderId,
        user2Id: recipientId,
      });
      if (onlineUsers.has(sender.id)) {
        sender.online = true;
      }
    }
    const message = await Message.create({
      senderId,
      text,
      conversationId: conversation.id,
    });
    res.json({ message, sender });
  } catch (error) {
    next(error);
  }
});

router.patch("/seen", async (req, res, next) => {
  // perform a query to the db to set all unread messages' 'isRead' field to true
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const senderId = req.user.id;
    const targetConvoMessages = await Conversation.findByPk(req.body.convoId, {
      include: [{
        model: Message,
        where: { id: { [Op.in]: req.body.messageIds } }
      }]
    });

    // checks if the sender of the request is a participant in the specified conversation, if not reject
    if (targetConvoMessages.user1Id !== senderId && targetConvoMessages.user2Id !== senderId) return res.sendStatus(403);

    // checks if all messages that are requested for update are associated with the specified conversation
    if (targetConvoMessages.messages.length !== req.body.messageIds.length) return res.sendStatus(403);

    const totalAffectedRows = await Message.update({ isRead: true }, { where: {
      id: {
        [Op.in]: req.body.messageIds
      }
    } });
    res.sendStatus(204);

    // emit a socket event to convo channel to notify both users that unread messages have been seen and that db is synced
    // (socket.io) 'server.sockets' is an alias to the default namespace. 'namespace.sockets' is a Map
    // '.emit()' could be changed to 'to("roomX").emit()' once rooms are implemented
    req.app.socketIo.emit("messages-are-seen", {
      convoId: req.body.convoId,
      messageIds: req.body.messageIds
    });
  } catch (error) {
    console.log(error)
    next(error)
  }
});

module.exports = router;
