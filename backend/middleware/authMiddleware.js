const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next){
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token)
        return res.status(401).json({error:'Token not provided.'});
    
    jwt.verify(token, JWT_SECRET,(error, payload) =>{
        if(error){
            console.log('error:', error);
            return res.status(403).json({error:'Token invalid or expired.'});
        }
        req.user = payload;
        next();
    })
}

module.exports = {
    authenticateToken,
}