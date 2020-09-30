// production 환경인 경우(Heroku로 배포한 후)
if(process.env.Node_ENV === 'production'){
    module.exports = require('./prod');
} 
// Development 환경인 경우(Local 환경)
else {
    module.exports = require('./dev');
}

// 개발 환경과 헤로쿠 환경일 때 다르게 해줘야 함