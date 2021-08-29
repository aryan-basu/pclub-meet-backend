const express = require("express");
const http = require("http");
const cors = require('cors')
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: '*' } });
const { ExpressPeerServer } = require("peer");
const newMeeting = require("./routes/newMeeting");
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use("/peerjs", peerServer);
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send("Working...."))
app.get('/join', (req, res) => newMeeting(req, res));

const users = [];

function userJoin(id, username, roomId) {
  return { id, username, roomId };
}

function getRoomUsers(roomId) {
  const abc = users.filter(user => user.roomId === roomId);
  return abc;
}

function userLeave(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

io.on("connection", socket => {

  socket.on('joinRoom', ({ username, roomId }) => {

    const user = userJoin(socket.id, username, roomId);
    const index1 = users.findIndex(user => user.id === socket.id);

    if (index1 === -1)
      users.push(user);

    socket.join(user.roomId);

    io.to(user.roomId).emit('roomUsers', {
      roomId: user.roomId,
      users: getRoomUsers(user.roomId)
    });

  });

  socket.on('msg', function (data) {
    io.sockets.emit('newmsg', data);
  });

  socket.on("join-room", (roomId, userId) => {
    
    socket.broadcast.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      const user = userLeave(socket.id);
      if (user) {
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(process.env.PORT || 5000, () => {
  console.log(process.env.PORT)
  console.log("Server is running...")
})
