const express = require("express");
const router =  express.Router();
const Message = require('../models/Message');
const User = require('../models/User');


  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }


  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.render("./error/accessdenied.ejs");
  }

// Chat route to fetch and display old messages
router.get('/chat',ensureAuthenticated, async (req, res) => {
  const { recipient } = req.query;
  const sender = req.user.email; // Assuming `currUser.email` is set as `req.user.email` after login
  // Fetch all messages between sender and recipient
  const messages = await Message.find({
    $or: [
      { sender, recipient },
      { sender: recipient, recipient: sender }
    ]
  }).sort({ createdAt: 1 }); // Sort by timestamp to show messages in order

  // Render the chat page with the fetched messages
  res.render('./chats/chat', { recipient, messages });
});


router.post('/send',ensureAuthenticated, async (req, res) => {
  const { sender, recipient, content } = req.body;
  const timestamp = new Date().toISOString();  // Get the current timestamp
  const newMessage = new Message({ sender, recipient, content, timestamp });
  await newMessage.save();
  res.redirect(`/chat?recipient=${recipient}`);
});

router.delete('/clear-chat', async (req, res) => {
    const { sender, recipient } = req.query;
    // Delete messages between the sender and recipient
    await Message.deleteMany({
      $or: [
        { sender, recipient },
        { sender: recipient, recipient: sender }
      ]
    });
  
    res.status(200).send('Chat history cleared');
  });

// Delete message by ID
router.delete('/delete-message', async (req, res) => {
  const messageId = req.query.id;
  console.log(messageId)
  
  try {
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    if (deletedMessage) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Message not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

  

module.exports = router;