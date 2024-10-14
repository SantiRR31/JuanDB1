function checkAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/auth');
}

function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied');
}