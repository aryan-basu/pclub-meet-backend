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

io.on("connection", (socket) => {


    socket.on("join-room", (roomId, userId) => {

        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
        socket.on('msg', function (data) {
            // server side data fetched 
            console.log(data);
            io.to(roomId).emit('newmsg', data);
        })
        /*socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userId);
        });  */
    })
})

server.listen(process.env.PORT || 5000, () => {
    console.log(process.env.PORT)
    console.log("Server is running...")
})
