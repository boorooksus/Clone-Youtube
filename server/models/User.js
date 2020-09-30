const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10; // salt의 길이(salt는 암호화에 이용됨)
var jwt = require('jsonwebtoken');

const userschema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true // trim: 스페이스 없애주는 역할 ex)he llo->hello
        //unique: 1 // 같은 email 존재 못하도록
    },
    password: {
        type: String
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token:{ // 유효성 관리
        type: String
    },
    tokenExp: {
        type: Number
    }
});

// mongoose method: save하기 전에 실행
userschema.pre('save', function (next) {

    var user = this;
    // password 변경시에만 암호화 하도록함. 이메일이나 이름 수정 할때에는 비밀번호 암호화 다시 안함
    if(user.isModified('password')){
        // 비밀번호 암호화
        bcrypt.genSalt(saltRounds, function(err, salt) {
            if(err) return next(err)
            
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return(err)
                // Store hash in your password DB.
                // password를 hash된 비밀번호로 바꿔줌
                user.password = hash
                next()
            });
        });
    }else{
        next()
    }
});

userschema.methods.comparePassword = function(plainPassword, cb) {
    // 암호화 전 비밀번호와 db의 비밀번호 비교
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err),
            cb(null, isMatch)
    })
}

userschema.methods.generateToken = function(cb){
    var user = this;
    // jasonwebtoken으로 토큰 생성
    // _id: db의 id
    var token = jwt.sign(user._id.toHexString(), 'secretToken') 

    // 'secretToken(이름 맘대로 해도 됨)' 사용해서 누구인지 알 수 있음.
    user.token = token
    user.save(function(err, user){
        if(err) return cb(errr)
        cb(null, user)
    })
}

userschema.statics.findByToken = function(token, cb) {
    var user = this;


    // 토큰을 decode
    jwt.verify(token, 'secretToken', function(err, decoded){
        // 유저 아이디로 유저를 찾은 뒤 클라이언트에서 가져온 token과 db에 보관된 토큰이 일치하는지 확인

        // findOne: mongodb method
        user.findOne({"_id": decoded, "token": token}, function(err, user) {
            if(err) return cb(err);
            cb(null, user)
        })
    })
}

const User = mongoose.model('User', userschema)

module.exports = { User };