const express = require('express');
const app = express();
const port = 5000;
const mongoose = require('mongoose');
const { User } = require("./models/User.js");
const bodyParser = require('body-parser');
const config = require('./config/key');
const cookieParser = require('cookie-parser');
const {auth } = require('./middleware/auth')

// application/x-www-form-urlencoded 데이터를 분석해서 가져올 수 있게함
app.use(bodyParser.urlencoded({extended: true}));
// application/jason 을 분석해서 가져올 수 있게함
app.use(bodyParser.json());

app.use(cookieParser());

// 보안을 위해 mongoDB URI를 config 폴더의 key파일에서 가져옴
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(()=> console.log('MongoDB connected...'))
.catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api/hello', (req, res) =>{
    res.send("hello!")
})

app.post('/api/users/register', (req, res) => {
  // 회원 가입 할 때 필요한 정보를 client에서 가져오면 db에 넣음
  
  // bodyParser 덕분에 req.body 안에 json형식으로 데이터가 저장됨
  const user = new User(req.body);
  
  // mongoDB method - 정보들이 user 모델에 저장됨
  user.save((err, userInfo) =>{
      //if(err) return res.setDefaultEncoding({success: false, err})
      if(err) return res.status(200).json({success: false, err});
      return res.status(200).json({
          success: true
      });
  });
});

app.post('/api/users/login', (req, res) =>{
    // 요청된 이메일을 데이터베이스에 있는지 찾는다.
    User.findOne({email: req.body.email}, (err, user) =>{
        if(!user){
            return res.jason({
                loginSuccess: false,
                message: "입력한 이메일을 가진 유저가 없습니다."
            })
        }

        // 요청된 이메일이 db에 있다면 비밀번호가 맞는지 확인
        user.comparePassword(req.body.password , (err, isMatch ) =>{
            if(!isMatch)
            return res.json({ loginSuccess: false, message: "Wrong password!"})
        })

        // 비밀번호가 맞다면 토큰 생성
        user.generateToken((err, user) => {
            if(err) return res.status(400).send(err);
            
            // 토큰을 저장. 저장 위치는 쿠키 or local storage, session, ... (여기서는 쿠키에 저장)
            res.cookie("x_auth", user.token)
            .status(200)
            .json({loginSuccess: true, userId: user._id})
            
        })

    })
    
});

// 미들웨어 - 콜백 함수 실행 전에 auth 실행
app.get('/api/users/auth', auth, (req, res) => {
    // authentication이 true면 여기 내용 실행
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
});

// 로그아웃 - token을 지워서 인증이 안되게 만든다.
app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, { token: ""}, (err, doc) => {
        if(err) return res.json({ success: false, err })
        return res.status(200).send({
            success: true
        })
    })

});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


// 