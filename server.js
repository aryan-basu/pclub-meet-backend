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

// Join user to chat
function userJoin(id, username, roomId) {
  const user = { id, username, roomId };
 

  return user;
}
function getRoomUsers(roomId) {
    const abc=users.filter(user => user.roomId === roomId);
    //console.log(abc[0].username);
    //console.log(abc.length);
    return abc;
  }
  
// User leaves chat
function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
  
    if (index !== -1) {
      return users.splice(index, 1)[0];
    }
  }
io.on("connection", socket => {
   
   /* socket.on('joinRoom', ({ username, roomId }) => {
        const user = userJoin(socket.id, username, roomId);
        //console.log(user);
        const index1 = users.findIndex(user => user.id === socket.id);
        //console.log(index1);
        if(index1===-1)
       users.push(user);
        
      //  console.log(user.roomId);
        socket.join(user.roomId);
         // Send users and room info
         //socket.broadcast.to(user.roomId).emit('roomUsers', {
        io.to(user.roomId).emit('roomUsers',{
        roomId: user.roomId,
        users: getRoomUsers(user.roomId)
      });
    }); */
     socket.on('msg', function(data){
        // server side data fetched 
        console.log(data);
        io.sockets.emit('newmsg', data);
     });
    socket.on("join-room", (roomId, userId,username) => {
      
        const user = userJoin(userId, username, roomId);
      
        const index1 = users.findIndex(user => user.id === userId);
     
        if(index1===-1)
       users.push(user);
        
    
        socket.join(user.roomId);
         // Send users and room info
         //socket.broadcast.to(user.roomId).emit('roomUsers', {
        io.to(user.roomId).emit('roomUsers',{
        roomId: user.roomId,
        users: getRoomUsers(user.roomId)
      });
   socket.broadcast.to(roomId).emit('user-connected', userId); 
        
  
        socket.on('disconnect', () => {
            const user = userLeave(userId);
            if(user)
            {
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                  });
            }
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
            //console.log(io.sockets.clients().length);
        })

        /*socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userId);
        });  */
      //console.log(clients);
    
    })
})


server.listen(process.env.PORT || 5000, () => {
    console.log(process.env.PORT)
    console.log("Server is running...")
})
