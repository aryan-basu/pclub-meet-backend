const { v4: uuidV4 } = require("uuid");

const newMeeting = (req, res) => {
    res.json({ link: uuidV4() })
}

module.exports = newMeeting