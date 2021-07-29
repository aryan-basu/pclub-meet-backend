const express = require("express");
const http = require("http");
const cors = require('cors')
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: '*' } });
const { ExpressPeerServer } = require("peer");

const newMeeting = require("./routes/newMeeting");

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/myapp'
});

app.use("/peerjs", peerServer);
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send("Working...."))
app.get('/join', (req, res) => newMeeting(req, res));

io.on("connection", (socket) => {
    console.log("user connected")
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId)
    })
})

server.listen(process.env.PORT || 5000, () => {
    console.log("Server is running...")
})
