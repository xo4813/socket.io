// server.js

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//body-parser를 사용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({
    extended: false
}));

//body-parser를 사용해 application/json 파싱
app.use(bodyParser.json());


app.use(session({

    secret: '1@%24^%$3^*&98&^%$', // 쿠키에 저장할 connect.sid값을 암호화할 키값 입력

    resave: false, //세션 아이디를 접속할때마다 새롭게 발급하지 않음

    saveUninitialized: true //세션 아이디를 실제 사용하기전에는 발급하지 않음

}));

var count = 1;

var rooms = []


app.get('/', function (req, res) {

    if (req.session.user) {

        console.log(`세션이 이미 존재합니다.`);
    } else {
        req.session.user = {
            "name": 'User' + count,
            "createCurTime": new Date()
        }
        count++;
        console.log(`세션 저장 완료! `);
    }

    res.sendFile(__dirname + '/view/client.html');


});



app.get('/room', function (req, res) {
    sess = req.session;
    // console.log(sess);

    res.sendFile(__dirname + '/view/room.html');
});

app.get('/add_room', function (req, res) {

});

app.post('/setName', function (req, res) {

    req.session.user['name'] = req.body.name;


    console.log('~~~~~~~~~~~~~~~~' + req.body.name)
    res.json('good');
})



// 연결시
io.on('connection', function (socket) {
    // console.log('user connected: ', socket.id);

    var name = "user" + count++;
    console.log(io.sockets.rooms)

    // socket.set('key', 'value', function () {});

    // change name
    io.to(socket.id).emit('change name', name);

    // 닉네임 변경

    // 연결이 끊어졌을 경우
    socket.on('disconnect', function () {

        console.log('user disconnected: ', name);
        socket.leave('roon name')
        io.emit('roomList', rooms);
        count--;
    });

    socket.on('backRoom', function (id) {

        console.log('방을 나갔음' + id);
        socket.leave(id)
        io.emit('roomList', rooms);
    });



    //방리스트 전달
    socket.on('start', function () {
        // console.log(io.sockets.adapter.rooms);


        io.emit('roomList', rooms);
    });

    // 방만들기
    socket.on('createdRoom', function (roomName) {
        console.log('createdRoom', roomName);

        rooms.push({
            roomName: roomName,
            root: socket.id,
            name: name,
            users: []
        });

        socket.join(rooms.length)
        io.emit('roomList', rooms);
        io.to(socket.id).emit('createdRoom', rooms.length - 1);
        // io.in(rooms.length).emit('receive message', rooms.length + "번째 방이 생성되었습니다.");
    });

    // 방들어가기
    socket.on('joinRoom', function (num) {
        console.log('joinRoom', num);
        socket.join(num)
        io.in(num).emit('receive message', (Number(num) + 1) + '번째 방에 입장하셨습니다.');
    });

    //전체 메시지
    socket.on('send message', function (name, text) {
        var msg = name + ' : ' + text;
        console.log(msg);
        io.emit('receive message', msg);
    });

    //방 메시지
    socket.on('roomSendMessage', function (num, name, text) {
        var msg = name + ' : ' + text;
        console.log(msg);
        io.in(num).emit('receive message', msg);
    });
});

http.listen(3000, function () {
    console.log('server on!');
});