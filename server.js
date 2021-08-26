const express = require("express");
const http = require("http");
const cors = require('cors')
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: '*' } });
const { ExpressPeerServer } = require("peer");
const firebase=require("firebase");


const config = {
    apiKey: "AIzaSyAVihggwV-iWKJDozK9eBa18N5tKeJqecg",
    authDomain: "login-d970e.firebaseapp.com",
    databaseURL: "https://login-d970e-default-rtdb.firebaseio.com",
    projectId: "login-d970e",
    storageBucket: "login-d970e.appspot.com",
    messagingSenderId: "499716605752",
    appId: "1:499716605752:web:37bb19df341143e8da63cd",
    measurementId: "G-MK64MTNLDX"
};
firebase.initializeApp(config);
 const auth = firebase.auth();
 const firestore = firebase.firestore();

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
   
    socket.on('joinRoom', ({ username, roomId }) => {
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
    });

    socket.on("join-room", (roomId, userId,displayname) => {
       // console.log(roomId);
        //const user=userId;
        //console.log(user);
        //users.push(user);
        //io.sockets.emit('all user',users);
        //socket.join(roomId);
        const roomRef=firebase.firestore().collection(`${roomId}`).doc(`${userId}`);
        roomRef.set({
                        
                            username: displayname,
                            id:userId
                            
                          });
   socket.broadcast.to(roomId).emit('user-connected', userId); 
         socket.on('msg', function (data) {
            // server side data fetched 
            console.log(data);
            io.to(roomId).emit('newmsg', data);
        })
  
        socket.on('disconnect', () => {
            const user = userLeave(socket.id);
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
