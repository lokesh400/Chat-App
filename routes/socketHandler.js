const Message = require('../models/Message');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected');

    // Handle user joining (based on username)
    socket.on('join', (username) => {
      socket.join(username); // Join a room based on the recipient's username
      console.log(`${username} joined the room`);
    });

    // Handle private messages
    socket.on('private_message', async (data) => {
      const { sender, recipient, content } = data;
      const timestamp = new Date().toISOString();  // Get the current timestamp
      const newMessage = new Message({ sender, recipient, content, timestamp });
      await newMessage.save(); // Save the message to the database

      // Emit the message to the recipient
      io.to(recipient).emit('receive_message', { sender, content, timestamp });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

module.exports = socketHandler;
