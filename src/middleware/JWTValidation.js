import jwt from 'jsonwebtoken'

export const JWTValidation = (req, res, next) => {
    const { authorization } = req.headers
    const jwtToken = authorization.split(' ')[1];
    const { SECRET_KEYS } = process.env

    if (jwtToken == null) {
        res.sendStatus(401);
    }

    jwt.verify(jwtToken, SECRET_KEYS ,(err, decode) => {
        if(err) return res.sendStatus(403)
        req.body = {
            id: decode.id,
            email: decode.email,
            role: decode.role
        }
        next();
    } );

}